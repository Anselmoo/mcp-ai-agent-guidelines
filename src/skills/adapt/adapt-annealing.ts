import { z } from "zod";
import { adapt_annealing_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	hasConvergenceSignal,
	hasExplorationSignal,
	hasQualityMeasureSignal,
} from "./routing-helpers.js";

// This handler advises on automated workflow-topology optimisation via simulated
// annealing: a workflow configuration is represented as a state vector
// (agent count, model tier, chain depth, parallelism, context window).  Each
// iteration perturbs one dimension, evaluates an energy/cost objective
// E = λ_lat×latency + λ_tok×token_cost + λ_q×(1−quality), and accepts or
// rejects the perturbation via the Boltzmann criterion
// P(accept) = exp(−ΔE / T).  Temperature T cools geometrically: T_k = T_0 × α^k.
//
// Scope — advisory only.  This handler does NOT:
//   • execute real workflow topology changes or dispatch agents
//   • hold a live topology registry or call external cost-evaluation endpoints
//   • cover pheromone-trail or conductance routing (use adapt-aco-router /
//     adapt-physarum-router for edge-weight approaches)
//   • cover quorum-based agent task assignment (use adapt-quorum)
//   • cover Hebbian weight adaptation (use adapt-hebbian-router)
//
// Outputs are advisory guidance items that the host LLM uses to reason with.

const annealingInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			coolingSchedule: z
				.enum(["geometric", "linear", "logarithmic"])
				.optional()
				.describe(
					"Temperature cooling schedule: geometric (T_k = T_0 × α^k, most common — good geometric decay of acceptance probability), linear (T_k = T_0 − k×δ, simple but can reach zero too early), or logarithmic (T_k = T_0 / ln(k+2), very slow cooling — use when evaluation budget is large and landscape is rugged).",
				),
			perturbationStrategy: z
				.enum(["single-dimension", "multi-dimension", "adaptive"])
				.optional()
				.describe(
					"How neighbour states are generated: single-dimension (change one topology knob per step — safer, easier to diagnose), multi-dimension (change multiple knobs simultaneously — covers more space per step but makes attribution harder), or adaptive (perturbation radius shrinks as T cools — balances exploration with exploitation).",
				),
		})
		.optional(),
});

type CoolingSchedule = "geometric" | "linear" | "logarithmic";
type PerturbationStrategy = "single-dimension" | "multi-dimension" | "adaptive";

// ---------------------------------------------------------------------------
// Domain signal detector
//
// Simulated annealing for workflow configuration is semantically distinct from
// the routing trio (ACO / Physarum / Hebbian) and from quorum sensing: it
// operates on a state-vector search with probabilistic acceptance, not on
// edge-weight adaptation or agent-readiness aggregation.  This detector
// identifies requests carrying enough annealing-specific vocabulary to produce
// targeted guidance.
// ---------------------------------------------------------------------------

function hasAnnealingDomainSignal(combined: string): boolean {
	// Cluster A — explicit simulated-annealing / search vocabulary
	// No trailing \b so prefix forms like "annealing", "perturbation" match.
	if (
		/\b(anneal|boltzmann|temperature.schedule|cooling.rate|cooling.schedule|neighbour.generat|perturbat|acceptance.criterion|energy.function|cost.function|metropolis|reheat|reanneal)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — workflow optimisation / auto-tuning co-occurring with search intent.
	// No trailing \b so "optimise", "optimize", "evaluating", "exploration" match.
	if (
		/\b(optimis|optimiz|auto.tun|auto.config|best.config|topology|workflow.config|pipeline.config)/i.test(
			combined,
		) &&
		/\b(search|explor|trial|evaluat|iter|sweep|find|discover|candidate)/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — objective / cost components co-occurring with adaptation intent.
	// No trailing \b on "optimis", "minimis", "configur" prefix patterns.
	if (
		/\b(latency|token.cost|cost.function|objective|trade.?off|weight.*quality|quality.*weight|λ|lambda)\b/i.test(
			combined,
		) &&
		/\b(adapt|balance|optimis|optimiz|minimis|minimiz|tuning|adjust|configur)/i.test(
			combined,
		)
	)
		return true;

	return false;
}

// ---------------------------------------------------------------------------
// Per-pattern advisory rules
// ---------------------------------------------------------------------------

const ANNEALING_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(state.vector|config.vector|topology.vector|state.space|configuration.space|workflow.state|agent.count|model.tier|chain.depth|parallelism|context.window)\b/i,
		detail:
			"Define the state vector before writing any search logic. A practical minimum: { agentCount: number, modelTier: 'cheap'|'standard'|'premium', chainDepth: number, parallelism: number, contextWindow: number }. Constrain each dimension to a finite discrete domain (e.g., agentCount ∈ {1,2,4,8,16}, chainDepth ∈ {1,2,3,4}) — continuous domains make neighbour generation non-deterministic and make it impossible to enumerate all visited states. Treat the constraint set as a first-class object that the perturbation function checks before accepting any candidate state, so you never evaluate an invalid topology.",
	},
	{
		pattern:
			/\b(energy|cost.function|objective|E\s*=|λ|lambda|latency|token.cost|quality|loss|score|evaluat)\b/i,
		detail:
			"Define the energy function E = λ_lat×latency + λ_tok×token_cost + λ_q×(1−quality) explicitly, with each λ summing to 1. Start with equal weights (λ_lat = λ_tok = λ_q = 1/3) and adjust based on observed trade-offs. Measure energy on a held-out validation set rather than the training prompt set — in-distribution evaluation makes cheap or fast configurations look better than they are for unseen inputs. Log every (state, energy) pair evaluated so you can reconstruct the search trajectory and identify whether the algorithm explored diverse regions or converged prematurely to a local minimum.",
	},
	{
		pattern:
			/\b(temperature|T_0|T_k|initial.temperature|starting.temperature|cooling|reheat|reanneal)\b/i,
		detail:
			"Set T_0 so the initial acceptance probability for a bad neighbour is roughly 0.80: T_0 ≈ −ΔE_bad / ln(0.80), where ΔE_bad is a typical uphill energy step. A common calibration procedure: evaluate 20 random neighbour pairs from the starting state, compute the mean positive ΔE, and solve for T_0. Too high a T_0 makes the search indistinguishable from random walk; too low a T_0 traps it in the first local minimum. Schedule reheating if you observe energy plateaus (no improvement over 10% of the evaluation budget): temporarily raise T by 2–3× then resume cooling.",
	},
	{
		pattern:
			/\b(cooling.rate|α|alpha|decay|geometric.cooling|linear.cooling|logarithmic.cooling|cool.factor|schedule)\b/i,
		detail:
			"For geometric cooling (T_k = T_0 × α^k), derive α from T_0 and the target final temperature T_f over N iterations: α = (T_f / T_0)^(1/N). A typical target: T_f ≈ 0.01 × T_0 so the acceptance probability for bad neighbours is near zero at the end. Set N = total evaluation budget × 0.90 to leave 10% of evaluations for a final greedy descent from the best state found. For linear cooling (T_k = T_0 − k×δ), set a floor max(T_k, T_min) to prevent negative temperatures — negative T inverts the acceptance criterion and accepts only bad moves.",
	},
	{
		pattern:
			/\b(perturbat|neighbour|neighbor|mutate|modify|change.one|dimension|knob|tweak|step.size|radius)\b/i,
		detail:
			"Implement neighbour generation as a pure function: neighbour(state) → candidate_state. For single-dimension perturbation, select a dimension uniformly at random, then select a new value uniformly from that dimension's domain (excluding the current value). For adaptive perturbation, restrict the selection domain to values within a Hamming distance of round(T / T_0 × max_hamming_distance): at high temperature the full domain is available, at low temperature only adjacent values are sampled. Always validate the candidate against the constraint set and regenerate if invalid — do not silently clamp values, as clamping biases the search toward constraint boundaries.",
	},
	{
		pattern:
			/\b(boltzmann|acceptance|accept|reject|P\s*=|exp\(-ΔE|probability|metropolis|uphill|downhill)\b/i,
		detail:
			"Implement the Metropolis acceptance criterion: if ΔE < 0 (improvement), always accept; if ΔE ≥ 0 (worsening), accept with probability P = exp(−ΔE / T). Use a cryptographically seeded PRNG to avoid correlated acceptance decisions across parallel runs. Track the running acceptance rate over the last 100 iterations: if acceptance rate > 0.90, T is too high (accelerate cooling); if acceptance rate < 0.10 and the search has not converged, T is too low (consider reheating). Log every acceptance decision with its ΔE and current T so you can reconstruct the full acceptance trace for post-hoc analysis.",
	},
	{
		pattern:
			/\b(budget|evaluation|max.iter|iteration|trial|sample|how.many|afford|cheap|expensive)\b/i,
		detail:
			"Budget evaluations, not wall-clock time. Each energy evaluation costs one real workflow invocation (or a surrogate model call) — estimate the per-evaluation cost (latency × token_cost for the evaluation topology) before committing to an iteration count. A practical heuristic: allocate N = 50 × number_of_dimensions evaluations for the annealing search, plus 10% for the final greedy descent, plus 10% for failed constraint validations. If real evaluations are too expensive, train a surrogate model (Gaussian process or lightweight MLP) on the first 20–30 real evaluations and use it to screen candidates before committing to a full evaluation.",
	},
	{
		pattern:
			/\b(initial.topology|start.state|starting.config|warm.start|seed.state|baseline|current.config)\b/i,
		detail:
			"Choose the initial state carefully — it sets the region of the search space where early exploration is concentrated. Use the current production topology as the starting state if one exists: it is likely a reasonable local minimum and the annealing search will explore the neighbourhood first, which is often where the best improvements lie. If starting from scratch, use domain heuristics: set modelTier to 'standard', agentCount to sqrt(max_tasks), chainDepth to 2, parallelism to agentCount / 2. Record the initial state and its energy in the experiment log so the improvement of the final result can be measured relative to the starting point.",
	},
	{
		pattern:
			/\b(model.tier|model.class|cheap|standard|premium|model.select|which.model|model.choice)\b/i,
		detail:
			"Treat model tier as an ordinal categorical dimension, not a numeric one: cheap < standard < premium in cost, but the quality relationship is task-dependent. During perturbation, move between adjacent tiers only (cheap ↔ standard ↔ premium) — jumping from cheap to premium in a single step is a large energy change that the annealing algorithm cannot properly anneal out. Encode tier transitions in the energy function by measuring actual quality difference on a held-out prompt set per tier: the quality delta between standard and premium is often smaller than the cost delta, making standard the default optimum for cost-constrained searches.",
	},
	{
		pattern:
			/\b(parallel|concurrent|parallelism|worker|thread|fan.out|batch.size|throughput)\b/i,
		detail:
			"Parallelism is a double-edged topology knob: increasing it reduces latency (up to the bottleneck) but increases token cost roughly linearly. Model the interaction: E_parallelism = λ_lat × (latency / parallelism_factor) + λ_tok × (token_cost × parallelism). The denominator is bounded — doubling parallelism does not halve latency once the task graph's critical path dominates. Measure actual latency at each parallelism level rather than assuming linear scaling; include queueing delay in the measurement if your infrastructure has a request queue.",
	},
	{
		pattern:
			/\b(best.found|incumbent|global.best|best.state|best.config|result.track|archive|hall.of.fame)\b/i,
		detail:
			"Maintain an incumbent (best state found so far) separately from the current state. The current state can move uphill (accept worse solutions) but the incumbent only updates when a new global minimum is found. At the end of the search, return the incumbent — not the current state, which may have drifted uphill during the final cooling phase. Also maintain a top-K archive (K = 5–10) of the best states found: these represent the Pareto-efficient configurations across the search trajectory and are useful when the single best state turns out to be infeasible at deployment time.",
	},
	{
		pattern:
			/\b(stopp|termination|convergence|plateau|early.exit|no.improvement|budget.exhausted|done)\b/i,
		detail:
			"Define multiple stopping criteria and use whichever triggers first: (1) evaluation budget exhausted, (2) T < T_min (temperature too low to accept any reasonable move), (3) no improvement in the incumbent for the last 20% of the budget. Log which criterion triggered so you can distinguish 'search converged' from 'search ran out of time'. For criteria (3), reset the plateau counter whenever the incumbent improves — a single good move after a long plateau is still progress and the search should continue.",
	},
];

// ---------------------------------------------------------------------------
// Label maps for human-readable summaries
// ---------------------------------------------------------------------------

const COOLING_SCHEDULE_LABELS: Record<CoolingSchedule, string> = {
	geometric: "geometric cooling (T_k = T_0 × α^k)",
	linear: "linear cooling (T_k = T_0 − k×δ)",
	logarithmic: "logarithmic cooling (T_k = T_0 / ln(k+2))",
} as const;

const PERTURBATION_STRATEGY_LABELS: Record<PerturbationStrategy, string> = {
	"single-dimension":
		"single-dimension perturbation (one topology knob changed per step)",
	"multi-dimension":
		"multi-dimension perturbation (multiple knobs changed simultaneously)",
	adaptive:
		"adaptive perturbation (perturbation radius shrinks as temperature cools)",
} as const;

// ---------------------------------------------------------------------------
// Inference helpers
// ---------------------------------------------------------------------------

function inferCoolingSchedule(
	combined: string,
	explicit?: CoolingSchedule,
): CoolingSchedule {
	if (explicit !== undefined) return explicit;
	if (
		/\b(logarithm|slow.cool|very.slow|rugged|complex.landscape|many.local.min)\b/i.test(
			combined,
		)
	)
		return "logarithmic";
	if (
		/\b(linear|simple|straight|δ|fixed.step|constant.decrement)\b/i.test(
			combined,
		)
	)
		return "linear";
	return "geometric";
}

function inferPerturbationStrategy(
	combined: string,
	explicit?: PerturbationStrategy,
): PerturbationStrategy {
	if (explicit !== undefined) return explicit;
	if (
		/\b(adaptive|shrink|radius|cool.*perturb|perturb.*cool|dynamic.step)\b/i.test(
			combined,
		)
	)
		return "adaptive";
	if (
		/\b(multi.dim|several.knob|multiple.dim|joint|simultaneous|many.knob)\b/i.test(
			combined,
		)
	)
		return "multi-dimension";
	return "single-dimension";
}

// ---------------------------------------------------------------------------
// Supplementary signal helpers (annealing-specific)
// ---------------------------------------------------------------------------

function hasSurrogateModelSignal(combined: string): boolean {
	return /\b(surrogate|proxy.model|cheap.estimat|gaussian.process|GP|MLP|approximate.eval|emulat|cheap.proxy)\b/i.test(
		combined,
	);
}

function hasMultiObjectiveSignal(combined: string): boolean {
	return /\b(pareto|multi.objective|multi.criteria|trade.off.front|non.dominated|bi.criteria|tri.criteria)\b/i.test(
		combined,
	);
}

function hasReheatSignal(combined: string): boolean {
	return /\b(reheat|reanneal|restart|reset.temp|periodic.restart|iterated.anneal|perturbation.restart)\b/i.test(
		combined,
	);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const annealingHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(annealingInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		// Stage 1 — completely vague: no keywords and no context
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Annealing Optimizer needs a description of the workflow topology you want to optimise (agent count, model tier, chain depth, parallelism), how quality and cost are measured, and roughly how many evaluations are affordable before it can produce targeted guidance. Describe the optimisation goal and the topology dimensions you are willing to change.",
			);
		}

		// Stage 2 — keywords present but no annealing-distinctive signal and no
		// compensating context (energy function, temperature, search vocabulary).
		if (!hasAnnealingDomainSignal(combined) && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Annealing Optimizer could not identify workflow-search or simulated-annealing details in this request. To generate targeted guidance, describe at least one of: (a) the topology knobs to optimise (agent count, model tier, chain depth, parallelism), (b) the objective or energy function combining latency, token cost, and quality, or (c) the simulated-annealing search parameters (temperature schedule, cooling rate, perturbation strategy, evaluation budget). Without this, the request is too general to distinguish annealing-based search from other adaptive optimisation patterns.",
				"Add topology knobs to search over, an objective function (E = λ_lat×latency + λ_tok×cost + λ_q×(1−quality)), or an annealing search parameter (temperature, cooling rate, Boltzmann) so Annealing Optimizer can produce targeted recommendations.",
			);
		}

		const coolingSchedule = inferCoolingSchedule(
			combined,
			parsed.data.options?.coolingSchedule,
		);
		const perturbationStrategy = inferPerturbationStrategy(
			combined,
			parsed.data.options?.perturbationStrategy,
		);

		const details: string[] = [
			`Annealing Optimizer advisory for ${COOLING_SCHEDULE_LABELS[coolingSchedule]}, ${PERTURBATION_STRATEGY_LABELS[perturbationStrategy]}. This guidance is advisory: it describes state-vector design, energy-function formulation, and cooling-schedule heuristics but does not implement a live workflow executor, topology registry, or cost-evaluation endpoint — wire these patterns into your own orchestration layer.`,
		];

		details.push(
			...ANNEALING_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (details.length === 1) {
			// No domain rules fired — supply baseline annealing orientation
			details.push(
				"Establish four foundational components before tuning any annealing parameter: (1) a state vector that encodes the topology dimensions you can change (agent count, model tier, chain depth, parallelism); (2) an energy function E = λ_lat×latency + λ_tok×token_cost + λ_q×(1−quality) that maps any state to a scalar cost; (3) a neighbour-generation function that perturbs one or more dimensions to produce a candidate state; and (4) a temperature schedule that starts high (encouraging exploration) and cools to near-zero (enforcing exploitation). These four components are independent — design and test each in isolation before integrating the Metropolis accept/reject loop.",
				"Before starting the search, spend 10–20 evaluations on random state sampling to calibrate the energy function's range and to set T_0. Compute the mean absolute energy change between randomly sampled neighbour pairs (mean |ΔE|). Set T_0 so exp(−mean|ΔE| / T_0) ≈ 0.80 — this ensures the search begins with broad exploration. Log all calibration evaluations in the same format as search evaluations so they can be replayed or included in surrogate-model training.",
				"Track the following metrics throughout the search: current energy, incumbent (best) energy, current temperature, acceptance rate over the last 50 iterations, and number of evaluations consumed. Plot these against iteration count after the run: a healthy annealing search shows a rapidly falling acceptance rate in the first 20% of iterations (high-T exploration), a plateau phase in the middle (escaping local minima), and a near-zero acceptance rate in the final 20% (exploitation). Divergence from this pattern indicates T_0 is miscalibrated or the cooling rate is too fast/slow.",
			);
		}

		// Supplementary signal items
		if (hasSurrogateModelSignal(combined)) {
			details.push(
				"When real evaluations are expensive, build a surrogate model trained on the first 20–30 actual evaluations before launching the full annealing search. A Gaussian process (GP) surrogate gives uncertainty estimates alongside predictions — use expected improvement (EI = max(0, E_best − μ_pred) + σ_pred) as an acquisition function to select which candidate states are worth evaluating for real. Interleave real evaluations with surrogate evaluations at a ratio of 1:4: for every real evaluation, screen 4 candidates with the surrogate and only evaluate the best-predicted one for real. Re-train the surrogate after each real evaluation to incorporate the new observation.",
			);
		}

		if (hasMultiObjectiveSignal(combined)) {
			details.push(
				"For multi-objective optimisation, replace the scalar energy function with a Pareto dominance check: state A dominates state B if A is at least as good as B on all objectives and strictly better on at least one. Maintain a Pareto archive of non-dominated states found during the search. Adapt the acceptance criterion: accept a move if the candidate is non-dominated in the current archive, or accept with probability exp(−hypervolume_loss / T) if it would shrink the Pareto front. Report the full Pareto archive at the end rather than a single incumbent — let the user select their preferred trade-off point after seeing the frontier.",
			);
		}

		if (hasReheatSignal(combined)) {
			details.push(
				"Implement iterated annealing: when the search stagnates (no incumbent improvement for 10% of the budget), reheat to T_reheat = 0.5 × T_0 and restart cooling from the current incumbent (not from the initial state). Each reheat cycle explores the neighbourhood of the current best rather than restarting globally — this preserves the progress made while escaping the local basin. Cap reheat events at 3–5 per run; more reheats suggest either T_0 is too low, the cooling schedule is too aggressive, or the energy landscape has no good local minima reachable from the current region.",
			);
		}

		if (hasExplorationSignal(combined)) {
			details.push(
				"Monitor the ratio of unique states visited to total evaluations: if the ratio drops below 0.5 (the search is revisiting states frequently), increase the perturbation radius or switch to multi-dimension perturbation to force broader exploration. A visited-states cache (bloom filter for large state spaces, set for small ones) lets you skip re-evaluating known states and redirect budget toward unexplored regions. In small discrete state spaces (fewer than 1000 reachable states), complete enumeration via branch-and-bound may be cheaper than annealing — check state-space size before committing to the heuristic approach.",
			);
		}

		if (hasQualityMeasureSignal(combined)) {
			details.push(
				"Measure quality on a stratified sample of the task distribution, not the most common case. If 80% of tasks are simple (where all model tiers perform equally), the quality term λ_q×(1−quality) will not differentiate topology choices — the search will optimise cost alone. Include a representative sample of hard tasks (10–20% of the evaluation set) where model tier makes a measurable difference. Calibrate λ_q so that a 10% quality improvement on hard tasks is worth approximately the same energy reduction as a 20% cost saving — this prevents the search from sacrificing quality on edge cases to win on easy cases.",
			);
		}

		if (hasConvergenceSignal(combined)) {
			details.push(
				"Detect premature convergence by tracking the distribution of accepted states across topology dimensions. If the search has explored fewer than 30% of the values in any dimension by the midpoint of the budget, T_0 may be too low or the cooling schedule too fast. Apply dimension-specific diagnostics: compute the acceptance rate conditioned on each dimension — if agentCount has never been perturbed to a value different from the initial state, that dimension is effectively frozen and the search is biased. Consider restarting from a state generated by uniform random sampling if convergence is premature.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply annealing configuration within these constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints on evaluation budget, topology ranges, or SLA targets directly affect the choice of T_0, cooling rate, evaluation count, and perturbation strategy — document which constraints drove which parameter decisions so the search can be reproduced or adapted when constraints change.`,
			);
		}

		details.push(
			"Use random search with the same K evaluations as the counterfactual baseline, and treat annealing as successful only when it beats that baseline in at least 3 of 5 independent trials. Report the best-seen topology and the trial count together so the improvement claim is reproducible.",
		);

		const artifacts = [
			buildOutputTemplateArtifact(
				"Annealing optimizer result",
				`{
  "agent_count": <number>,
  "model_tier": "<cheap|standard|premium>",
  "chain_depth": <number>,
  "parallelism": <number>,
  "context_window_k": <number>,
  "best_topology": {
    "agent_count": <number>,
    "model_tier": "<cheap|standard|premium>",
    "chain_depth": <number>,
    "parallelism": <number>,
    "context_window_k": <number>
  },
  "temperature": <number>,
  "cooling_rate": <number>,
  "evaluation_budget": <number>,
  "counterfactual_baseline": "random_search_same_K"
}`,
				[
					"agent_count",
					"model_tier",
					"chain_depth",
					"parallelism",
					"context_window_k",
					"best_topology",
					"temperature",
					"cooling_rate",
					"evaluation_budget",
					"counterfactual_baseline",
				],
				"Use this template to keep the output contract and the same-budget random-search baseline explicit.",
			),
			buildComparisonMatrixArtifact(
				"Annealing strategy matrix",
				["strategy", "best for", "risk", "validation rule"],
				[
					{
						label: "simulated annealing",
						values: [
							"fixed-budget topology search with a clear objective",
							"temperature can fall too quickly and freeze exploration",
							"keep the same K evaluations and compare against random search",
						],
					},
					{
						label: "random search",
						values: [
							"baseline comparison under identical budget",
							"can look deceptively strong on tiny search spaces",
							"use as the counterfactual: annealing should win ≥3/5 trials",
						],
					},
					{
						label: "manual tuning",
						values: [
							"operator-guided adjustments when a policy is fixed",
							"biases the search toward current intuition",
							"only valid when the topology cannot change automatically",
						],
					},
				],
				"Compare the adaptive search against the same-budget baseline before claiming improvement.",
			),
			buildToolChainArtifact(
				"Annealing optimization chain",
				[
					{
						tool: "buildAnnealingConfig",
						description:
							"package the initial topology, cooling rate, minimum temperature, and evaluation budget",
					},
					{
						tool: "perturbTopology",
						description:
							"generate a nearby candidate topology within the allowed mutation budget",
					},
					{
						tool: "evaluate",
						description:
							"score the candidate against the held-out evaluation slice",
					},
					{
						tool: "compare-baseline",
						description:
							"measure the same K evaluations against random search and keep the stronger median result",
					},
					{
						tool: "accept",
						description:
							"apply the Boltzmann rule to accept improvements and occasional degradations",
					},
					{
						tool: "return-best",
						description:
							"return the best-seen topology rather than the last sampled state",
					},
				],
				"Use this chain to keep the policy, state transition, and same-budget comparison explicit.",
			),
			buildEvalCriteriaArtifact(
				"Annealing validation criteria",
				[
					"The output includes agent_count, model_tier, chain_depth, parallelism, and context_window_k.",
					"The policy is evaluated with the same K evaluations as the baseline.",
					"Annealing beats random search in at least 3 of 5 independent trials.",
					"Logs include the best-seen topology, not only the last sampled state.",
					"The stop rule is explicit and reproducible from the run log.",
				],
				"Checklist for deciding whether the annealing plan matches the reference contract.",
			),
			buildWorkedExampleArtifact(
				"Annealing vs random-search example",
				{
					initialTopology: {
						agentCount: 8,
						modelTier: "standard",
						chainDepth: 2,
						parallelism: 4,
						contextWindow_k: 32,
					},
					candidateTopology: {
						agentCount: 6,
						modelTier: "standard",
						chainDepth: 3,
						parallelism: 3,
						contextWindow_k: 32,
					},
					evaluationBudget: 200,
					trials: 5,
				},
				{
					bestTopology: {
						agentCount: 6,
						modelTier: "standard",
						chainDepth: 3,
						parallelism: 3,
						contextWindow_k: 32,
					},
					baseline: "random_search_same_K",
					result: "annealing_wins_4_of_5_trials",
				},
				"Worked example showing the same-budget counterfactual baseline and best-seen output.",
			),
		];

		return createCapabilityResult(
			context,
			`Annealing Optimizer produced ${details.length} advisory guidance item${details.length === 1 ? "" : "s"} for ${COOLING_SCHEDULE_LABELS[coolingSchedule]} with ${perturbationStrategy} perturbation.`,
			createFocusRecommendations(
				"Workflow annealing optimisation",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(skillManifest, annealingHandler);
