import { z } from "zod";
import { adapt_hebbian_router_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildInsufficientSignalResult,
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
	hasHebbianDomainSignal,
	hasPersistenceSignal,
	hasQualityMeasureSignal,
	ROUTING_POLICY_LABELS,
	WEIGHT_SCOPE_LABELS,
} from "./routing-helpers.js";

// This handler advises on augmenting multi-agent collaboration routing with
// Hebbian learning mechanics: N×N weight matrices over agent pairs, co-activation
// reinforcement, weight decay, and softmax/greedy/ε-greedy routing policies.
//
// Scope — advisory and signal-driven only.  This handler does NOT:
//   • execute live agent dispatch or in-process weight updates (no graphology)
//   • implement weight matrix persistence (advises on where/how to persist)
//   • cover pheromone trail mechanics (use adapt-aco-router)
//   • cover topology pruning (use adapt-physarum-router)
//
// Outputs are advisory guidance items that the host LLM uses to reason with.

const hebbianRouterInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			routingPolicy: z
				.enum(["greedy", "softmax", "epsilon-greedy"])
				.optional()
				.describe(
					"Agent selection policy: greedy (always route to highest-weight partner), softmax (sample proportionally to weight), or epsilon-greedy (exploit best pair with probability 1−ε, explore uniformly otherwise).",
				),
			weightScope: z
				.enum(["pairwise", "broadcast", "all-to-all"])
				.optional()
				.describe(
					"Weight matrix structure: pairwise (one weight per ordered agent pair), broadcast (one weight per source agent shared across all targets), or all-to-all (full N×N matrix for maximum routing granularity).",
				),
		})
		.optional(),
});

type RoutingPolicy = "greedy" | "softmax" | "epsilon-greedy";
type WeightScope = "pairwise" | "broadcast" | "all-to-all";

function appendUniqueDetail(details: string[], detail: string) {
	if (!details.includes(detail)) {
		details.push(detail);
	}
}

const HEBBIAN_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(hebbian|synaptic|co.activat|weight.matrix|fire.together|wire.together|W\[|N×N)\b/i,
		detail:
			"Maintain an N×N weight matrix W where W[A][B] represents the learned affinity of routing from agent A to agent B. Initialise all weights to a small uniform value (e.g., 0.1) rather than zero — zero initialisation prevents any agent pair from being selected during the early learning phase. After each collaborative run, update W[A][B] += η × quality × co_activation, where η is the learning rate, quality is the joint output score (0–1), and co_activation is 1 if both agents were active in the same run and 0 otherwise. This embodies the Hebbian principle: pairs that fire together wire together.",
	},
	{
		pattern:
			/\b(decay|forget|memory.horizon|old.pair|stale.weight|fade|decay_rate)\b/i,
		detail:
			"Apply weight decay after each learning update to prevent old agent partnerships from permanently dominating routing: W *= (1 − decay_rate). Choose decay_rate to match your desired memory horizon: decay_rate = 1 − (1/H)^(1/N_cycles) where H is the number of cycles over which you want old knowledge to fade to ~37% (one e-folding). A decay_rate of 0.01 per cycle retains 37% of a weight after ~100 cycles; 0.05 retains 37% after ~20 cycles. Validate the decay rate on a simulation trace before deploying to live agent routing.",
	},
	{
		pattern:
			/\b(softmax|temperature|probabilit|sample|stochastic|distribution)\b/i,
		detail:
			"Compute agent selection probabilities using softmax over the weight row W[A]: P(B|A) = exp(W[A][B] / T) / Σ_j exp(W[A][j] / T), where T is the temperature parameter. Low temperature (T → 0) concentrates probability on the highest-weight agent (approaching greedy); high temperature (T → ∞) produces a uniform distribution (maximum exploration). Start with T = 1.0 and lower it as the weight matrix stabilises — use the Frobenius norm change between successive weight updates as a proxy for stability.",
	},
	{
		pattern:
			/\b(epsilon|ε.greedy|exploration.rate|random.agent|explore.pair|novel.pair)\b/i,
		detail:
			"In ε-greedy mode, select the highest-weight agent with probability (1 − ε) and sample uniformly from all agents with probability ε. This guarantees that every agent pair is tried at least occasionally, preventing the weight matrix from permanently dismissing agent combinations that were unlucky early in the learning process. Anneal ε over time: start at 0.3 and reduce by 0.01 per 10 learning cycles, clamping at a floor of 0.05 to maintain minimal exploration throughout the system's lifetime.",
	},
	{
		pattern:
			/\b(qualit|score|feedback|joint.output|pair.quality|collaboration.score|reward)\b/i,
		detail:
			"Define the quality signal for weight updates before wiring the learning loop. The signal must be attributable to the specific agent pair: a downstream evaluator that scores the combined output of agents A and B is ideal; a binary success flag is acceptable if quality is hard to quantify. Avoid using individual agent quality scores as a proxy for pair quality — an agent that scores well in isolation may perform poorly in collaboration, and vice versa. Emit the quality signal as a structured event { pairId: (A, B), score: float, cycleNumber: int } for auditability.",
	},
	{
		pattern:
			/\b(clamp|bound|ceiling|floor|max.weight|min.weight|weight.range)\b/i,
		detail:
			"Clamp weight matrix values to [W_floor, W_ceiling] after each update to prevent numeric runaway. W_floor > 0 (e.g., 0.01) ensures that every agent pair retains a non-zero selection probability — a weight at exactly zero creates a dead pair that can never be re-selected without resetting the matrix. W_ceiling (e.g., 10.0) prevents a single highly-reinforced pair from making softmax probabilities numerically degenerate. Log the frequency of ceiling clamps: frequent clamping at the ceiling indicates the learning rate η is too high.",
	},
	{
		pattern: /\b(converg|stab|plateau|Frobenius|change.rate|weight.change)\b/i,
		detail:
			"Monitor weight matrix convergence using the Frobenius norm of the update matrix ΔW at each learning cycle: ||ΔW||_F = sqrt(Σ_{A,B} ΔW[A][B]²). When ||ΔW||_F drops below a convergence threshold (e.g., 0.01 × N² where N is the number of agents) for three consecutive cycles, the routing policy has stabilised. Log convergence events; a sudden jump in ||ΔW||_F after a period of stability may indicate an environmental shift (agents changing their capabilities or quality distribution).",
	},
	{
		pattern:
			/\b(persist|checkpoint|save|store|state|reload|resume|snapshot)\b/i,
		detail:
			"Persist the full N×N weight matrix to durable storage after every learning cycle. The matrix is small (N² floats) and can be stored as a JSON file or database record. Include the cycle counter and a checksum in the persisted format so corrupt snapshots can be detected on load. On service restart, load the most recent valid snapshot — do not reinitialise weights to 0.1 after a restart, as this discards all learned agent-pair affinities.",
	},
	{
		pattern:
			/\b(initialise|initialize|bootstrap|cold.start|first.run|warm.up|prior)\b/i,
		detail:
			"Bootstrap the weight matrix with a domain-informed prior when you have historical collaboration data. Set W[A][B] proportional to the historical joint success rate of agents A and B. This reduces the exploration cost of the early learning phase. If no historical data is available, use uniform initialisation W[A][B] = 0.1 and accept a 'warm-up' period of 20–50 cycles before weights reflect true pair affinities. Track the warm-up period separately in metrics so you can distinguish 'routing still learning' from 'routing has stabilised'.",
	},
];

function inferRoutingPolicy(
	combined: string,
	explicit?: RoutingPolicy,
): RoutingPolicy {
	if (explicit !== undefined) return explicit;
	if (/\b(epsilon|ε.greedy|random.agent|explore.pair)\b/i.test(combined))
		return "epsilon-greedy";
	if (/\b(softmax|temperature|probabilit|sample)\b/i.test(combined))
		return "softmax";
	if (/\b(greedy|best.agent|highest.weight|deterministic)\b/i.test(combined))
		return "greedy";
	return "softmax";
}

function inferWeightScope(
	combined: string,
	explicit?: WeightScope,
): WeightScope {
	if (explicit !== undefined) return explicit;
	if (/\b(broadcast|source.agent|one.per.source)\b/i.test(combined))
		return "broadcast";
	if (
		/\b(all.to.all|full.matrix|N×N|maximum.granularity|every.pair)\b/i.test(
			combined,
		)
	)
		return "all-to-all";
	return "pairwise";
}

function buildWeightScopeDetail(weightScope: WeightScope): string {
	switch (weightScope) {
		case "pairwise":
			return "Represent collaboration memory as an ordered agent-pair weight map W[A][B] even if you store it sparsely rather than as a dense matrix. Direction matters: planner→critic and critic→planner should be tracked separately because pair quality is often asymmetric. Initialise unseen pairs to 0.1 so every pairing remains selectable during warm-up instead of starting as a dead edge.";
		case "broadcast":
			return "Broadcast scope is a compressed approximation of the full Hebbian pair matrix: keep one learned source-agent affinity and document that all targets share that value until enough evidence justifies restoring full pair granularity. Use this only when the fleet is large enough that N×N storage is awkward; otherwise prefer explicit W[A][B] tracking so complementary target agents can diverge naturally.";
		case "all-to-all":
			return "Use a full N×N weight matrix W where every ordered agent pair has its own learned affinity. This is the reference-faithful Hebbian form: W[A][B] stores how strongly the router should prefer agent B after agent A, and diagonal entries should be disabled or ignored unless self-routing is intentionally allowed.";
	}
}

function buildRoutingPolicyDetail(routingPolicy: RoutingPolicy): string {
	switch (routingPolicy) {
		case "greedy":
			return "Greedy routing reads row W[A] and deterministically selects the highest-weight target B for source agent A. Use greedy only after warm-up or after convergence monitoring shows the matrix has stabilised; otherwise early noise can lock the fleet onto a pair that only looked best during sparse exploration.";
		case "softmax":
			return "Softmax routing samples the next agent from row W[A] using P(B|A) = exp(W[A][B] / T) / Σ_j exp(W[A][j] / T). Start with T = 1.0 during warm-up, lower temperature as the matrix stabilises, and monitor whether the probability mass collapses onto one pair faster than quality actually improves.";
		case "epsilon-greedy":
			return "ε-greedy routing selects argmax_B W[A][B] with probability (1 − ε) and explores a non-best target with probability ε. Start near ε = 0.3, anneal toward a floor around 0.05, and log visit counts so every meaningful agent pair is still sampled often enough to challenge stale winners.";
	}
}

const hebbianRouterHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(hebbianRouterInputSchema, input);
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
				"Hebbian Router needs a description of the agent fleet, the collaboration quality signal, and the routing objective before it can produce targeted guidance. Describe the agents, the quality metric used to score collaborations, and whether greedy, softmax, or ε-greedy selection fits your exploration needs.",
			);
		}

		// Stage 2 — keywords present but no Hebbian-distinctive signal
		if (
			!hasHebbianDomainSignal(combined) &&
			!signals.hasContext &&
			parsed.data.options?.routingPolicy === undefined &&
			parsed.data.options?.weightScope === undefined
		) {
			return buildInsufficientSignalResult(
				context,
				"Hebbian Router could not identify agent-pair or weight-matrix-specific details in this request. To generate Hebbian routing guidance, describe at least one of: (a) the agents whose collaboration patterns you want to learn, (b) the quality or success signal used to score agent pairs, or (c) Hebbian learning / synaptic weight concepts you want applied. Without this, the request is too general to distinguish Hebbian routing from other adaptive approaches.",
				"Add agent pair context (which agents collaborate, how collaboration quality is scored), a Hebbian/synaptic weight intent, or multi-agent collaboration vocabulary to the request so Hebbian Router can produce targeted recommendations.",
			);
		}

		const routingPolicy = inferRoutingPolicy(
			combined,
			parsed.data.options?.routingPolicy,
		);
		const weightScope = inferWeightScope(
			combined,
			parsed.data.options?.weightScope,
		);

		const details: string[] = [
			`Hebbian routing advisory for ${ROUTING_POLICY_LABELS[routingPolicy]} over ${WEIGHT_SCOPE_LABELS[weightScope]} weight matrix. This guidance is advisory: it describes weight update mechanics and routing policy heuristics but does not execute live agent dispatch or manage in-process weight state — wire these patterns into your own collaboration routing layer.`,
			buildWeightScopeDetail(weightScope),
			"Update collaboration affinity after each learning cycle with the reference Hebbian rule W[A][B] += η × quality × co_activation. Keep quality on a bounded 0–1 scale, set co_activation to 1 only when both agents actually participated in the same run, and emit the update inputs as structured records so the learning step can be replayed or audited without requiring a live runtime bridge.",
			"Apply forgetting and numeric safety on every cycle: decay learned affinities with W *= (1 − decay_rate), then clamp each weight into a non-zero range such as [0.01, 10.0]. Decay prevents early winners from dominating forever, while the positive floor keeps weak pairs available for future re-evaluation instead of becoming permanently unreachable.",
			buildRoutingPolicyDetail(routingPolicy),
		];

		for (const detail of HEBBIAN_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail)) {
			appendUniqueDetail(details, detail);
		}

		if (details.length === 4) {
			// No rules fired — supply baseline Hebbian orientation
			appendUniqueDetail(
				details,
				"Establish the three foundational Hebbian components: (1) an N×N weight matrix W initialised to uniform small values (0.1), (2) a quality signal emitted after each collaboration run that scores the joint output of the agent pair, and (3) a routing function that reads row W[A] and selects agent B using the configured routing policy (softmax, greedy, or ε-greedy). These three components are independent — implement each in isolation before integrating.",
			);
			appendUniqueDetail(
				details,
				"Set learning rate η ∈ [0.01, 0.1] and decay rate ∈ [0.01, 0.05] as the primary tuning levers. η controls how quickly new collaboration evidence updates weights; decay rate controls how quickly historical partnerships fade. A high η / low decay combination adapts quickly but forgets early learnings rapidly; a low η / high decay combination is stable but slow to recognise genuine quality shifts.",
			);
			appendUniqueDetail(
				details,
				"Clamp weights to [0.01, 10.0] from the first update. Without clamping, frequent collaborations can drive weights to extreme values that make softmax probabilities numerically degenerate (all probability mass on one agent).",
			);
		}

		// Signal-supplementary items
		if (hasQualityMeasureSignal(combined)) {
			details.push(
				"Emit quality events as structured logs at the end of each collaboration: { sourceAgent, targetAgent, quality, cycleNumber }. The learning loop consumes these events in batch at cycle boundaries. Decoupling quality emission from weight updates allows quality events to be replayed, filtered, or audited independently of the routing mechanism.",
			);
		}

		if (hasExplorationSignal(combined)) {
			details.push(
				"Track per-pair visit counts to detect under-explored agent combinations. When the visit count for a pair (A, B) falls below a minimum threshold after N learning cycles, force at least one collaboration between A and B in the next cycle regardless of the routing policy. This prevents the weight matrix from permanently avoiding pairs that were unlucky in initial sampling.",
			);
		}

		if (hasConvergenceSignal(combined)) {
			details.push(
				"Compute the Frobenius norm ||ΔW||_F at each learning cycle and log it alongside the cycle counter. A stable ||ΔW||_F < 0.01 × N² for three consecutive cycles indicates the weight matrix has converged to a steady routing policy. Visualise the weight matrix as a heatmap at convergence to confirm that high-weight pairs correspond to agent combinations that produce the highest quality scores — this validates that the Hebbian learning has captured genuine collaboration affinity rather than sampling artefacts.",
			);
		}

		if (hasPersistenceSignal(combined)) {
			details.push(
				"Persist the weight matrix and the per-pair visit counts together in a single snapshot. Visit counts are needed on reload to resume proper exploration guarantees — reloading weights alone would reset visit counts to zero, causing the router to re-explore pairs it had already validated. Include the learning cycle counter in the snapshot so audit logs can be correlated with snapshot timestamps.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply Hebbian configuration within these constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints on fleet size (N), collaboration cycle frequency, or quality signal latency directly affect matrix dimensionality, learning rate, and decay rate choices — document which constraints drove which parameter decisions.`,
			);
		}

		return createCapabilityResult(
			context,
			`Hebbian Router produced ${details.length} advisory guidance item${details.length === 1 ? "" : "s"} for ${ROUTING_POLICY_LABELS[routingPolicy]} (weight scope: ${WEIGHT_SCOPE_LABELS[weightScope]}).`,
			createFocusRecommendations(
				"Hebbian routing",
				details,
				context.model.modelClass,
			),
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	hebbianRouterHandler,
);
