import { z } from "zod";
import { adapt_aco_router_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
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
	hasAcoDomainSignal,
	hasConvergenceSignal,
	hasExplorationSignal,
	hasGraphStructureSignal,
	hasPersistenceSignal,
	hasQualityMeasureSignal,
	ROUTING_MODE_LABELS,
} from "./routing-helpers.js";

// This handler advises on augmenting workflow routing with Ant Colony
// Optimisation (ACO) pheromone mechanics: edge weight deposition, evaporation,
// and probabilistic path selection guided by α/β parameters.
//
// Scope — advisory and signal-driven only.  This handler does NOT:
//   • execute live graph traversal (no graphology, no in-process graph state)
//   • implement pheromone persistence (advises on where/how to persist)
//   • cover topology pruning (use adapt-physarum-router)
//   • cover agent-pair weight matrices (use adapt-hebbian-router)
//
// Outputs are advisory guidance items that the host LLM uses to reason with.

const acoRouterInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			routingMode: z
				.enum(["explore", "exploit", "balanced"])
				.optional()
				.describe(
					"Routing behaviour bias: explore (high α for new path discovery), exploit (high β to favour best-known paths), or balanced (default α=1, β=2).",
				),
			adaptationScope: z
				.enum(["edges", "nodes", "full-graph"])
				.optional()
				.describe(
					"Scope of pheromone adaptation: edges (weight only edge transitions), nodes (weight node selection probabilities), or full-graph (both).",
				),
		})
		.optional(),
});

type RoutingMode = "explore" | "exploit" | "balanced";
type AdaptationScope = "edges" | "nodes" | "full-graph";

const ACO_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(pheromone|tau|evaporat|deposit|reinforce|trail|ant.colony|aco)\b/i,
		detail:
			"Model pheromone state as a map from edge identifier to a scalar τ (initialise all τ = 1.0). After each successful workflow run, deposit Δτ on every traversed edge: τ(e) += Δτ, where Δτ is proportional to the run's quality score (or inversely proportional to cost). Apply evaporation on a fixed cycle — typically every N runs — by multiplying all τ values by (1 − ρ), where ρ ∈ [0.05, 0.2] is the evaporation rate. Clamp τ to [τ_min, τ_max] to prevent trail collapse or runaway reinforcement.",
	},
	{
		pattern:
			/\b(alpha|alpha.param|β|beta|beta.param|weight|exponent|probabilit|path.select)\b/i,
		detail:
			"Route by computing a selection probability for each candidate edge using P(i,j) ∝ τ(i,j)^α × η(i,j)^β, where η is the static heuristic desirability (e.g., inverse latency, expected quality). α controls pheromone influence and β controls heuristic influence. Start with α=1, β=2 for balanced behaviour; increase α to exploit learned paths more aggressively; increase β to rely more on the heuristic before pheromone data accumulates. Normalise probabilities across all candidate edges before sampling.",
	},
	{
		pattern: /\b(evaporat|decay|fade|reset|cool|anneal|cycle.length|cycle)\b/i,
		detail:
			"Choose the evaporation cycle length (every N runs) to match your workflow's feedback latency. For low-latency workflows (sub-second runs) evaporate every 50–200 runs; for slower workflows (minutes per run) evaporate every 5–20 runs. Too-frequent evaporation prevents pheromone from accumulating on genuinely good paths; too-infrequent evaporation causes stale trails to persist after the environment changes. Track the evaporation event with a counter so pheromone state is reproducible from the run log.",
	},
	{
		pattern:
			/\b(graph|node|edge|workflow|topology|dag|pipeline|flow|path|route)\b/i,
		detail:
			"Represent the workflow as a directed graph: nodes are processing steps or agent invocations, edges are possible transitions between them. Each edge carries its pheromone value τ and an optional static heuristic η. At runtime, the router samples the next edge from the probability distribution P(i,j). Do not hard-code the graph structure in the router — load it from a manifest so the topology can change without redeploying the routing logic.",
	},
	{
		pattern:
			/\b(qualit|score|metric|success|latency|throughput|reward|feedback|measur)\b/i,
		detail:
			"Define the quality signal used for pheromone deposition before instrumenting the workflow. The signal must be observable at the end of each run: it could be an explicit quality score, a binary success flag, or an inverse latency. Avoid composite signals (e.g., 0.5×quality + 0.5×speed) until individual signals are validated — composite signals mask which dimension the ACO is actually optimising. Emit the quality signal as a structured log event so pheromone updates can be replayed or audited.",
	},
	{
		pattern:
			/\b(explor|exploit|balance|epsilon|discover|diversif|stagnant|stuck|local.optima)\b/i,
		detail:
			"Guard against premature convergence by enforcing τ_min > 0 (even the weakest path retains non-zero selection probability) and by injecting an explicit exploration budget: with probability ε, sample uniformly across edges regardless of pheromone. Raise ε when pheromone entropy drops below a threshold (all probability mass concentrated on one path) to escape local optima. Lower ε once the pheromone distribution has converged to a stable, diverse set of paths.",
	},
	{
		pattern:
			/\b(persist|checkpoint|save|store|state|reload|resume|snapshot)\b/i,
		detail:
			"Persist the pheromone map to durable storage (database, object store, or file) after every evaporation cycle — not after every run. Per-run persistence creates I/O bottlenecks; cycle-level persistence limits state loss to at most one cycle's worth of deposits. Use an append-only log of deposit events between cycles so state can be reconstructed after a crash without re-running past workflows.",
	},
	{
		pattern: /\b(converg|stab|plateau|settle|lock.in|frozen|optimal)\b/i,
		detail:
			"Monitor pheromone entropy across cycles — H = −Σ P(e)·log P(e) — to detect convergence. A sudden entropy drop signals that the ACO is locking onto a single path; this may be optimal convergence or premature lock-in. Log entropy at each evaporation cycle. If entropy drops below a threshold before a meaningful number of runs have completed, increase ρ temporarily or reset τ values for under-explored edges to ρ_min.",
	},
	{
		pattern:
			/\b(multi.ant|parallel|population|colony.size|simultaneous|concurrent.run)\b/i,
		detail:
			"When multiple workflow runs execute concurrently (parallel ants), collect deposit events from each run and apply them in a single batch at evaporation time rather than updating τ after each individual run. Interleaved per-run updates create race conditions and can cause pheromone overshoot on high-concurrency edges. Batch deposit accumulation also makes the pheromone update step atomic and auditable.",
	},
	{
		pattern:
			/\b(cold.start|bootstrap|initial|no.data|first.run|warm.up|prior)\b/i,
		detail:
			"Bootstrap pheromone state with a domain-informed prior instead of uniform τ=1.0 when you have existing routing data or expert knowledge. Set τ(e) for high-confidence edges to τ_max × 0.5 and τ(e) for unused or low-confidence edges to τ_min × 2. This biases early runs toward known-good paths while allowing exploration to correct the prior. Re-normalise after setting the prior so probabilities remain valid.",
	},
];

const ADAPTATION_SCOPE_LABELS: Record<AdaptationScope, string> = {
	edges: "edge transitions",
	nodes: "node selection",
	"full-graph": "full graph (nodes and edges)",
};

function inferRoutingMode(
	combined: string,
	explicit?: RoutingMode,
): RoutingMode {
	if (explicit !== undefined) return explicit;
	if (/\b(explor|discover|diversif|breadth|random)\b/i.test(combined))
		return "explore";
	if (/\b(exploit|converge|best.known|greedy|optimal)\b/i.test(combined))
		return "exploit";
	return "balanced";
}

function inferAdaptationScope(
	combined: string,
	explicit?: AdaptationScope,
): AdaptationScope {
	if (explicit !== undefined) return explicit;
	if (/\b(node.select|node.weight|agent.select)\b/i.test(combined))
		return "nodes";
	if (/\b(full.graph|graph.wide|global)\b/i.test(combined)) return "full-graph";
	return "edges";
}

const acoRouterHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(acoRouterInputSchema, input);
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
				"ACO Router needs a description of the workflow graph, the quality signal used for pheromone deposition, and the routing objective before it can produce targeted guidance. Describe the edges, the success metric, and whether exploration or exploitation is the current priority.",
			);
		}

		// Stage 2 — keywords present but no ACO-distinctive signal and no context
		// that might compensate (pheromone/trail, path+quality, reinforce-path).
		if (!hasAcoDomainSignal(combined) && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"ACO Router could not identify ACO-specific routing details in this request. To generate pheromone-trail guidance, describe at least one of: (a) the graph nodes and edges (or workflow steps) that need routing, (b) the quality or success metric used to decide which paths to reinforce, or (c) pheromone / ant-colony concepts you want applied. Without this, the request is too general to distinguish ACO routing from other adaptive approaches.",
				"Add graph structure (nodes, edges, workflow steps), a path-quality signal (score, success rate, latency), or pheromone/trail intent to the request so ACO Router can produce targeted recommendations.",
			);
		}

		const routingMode = inferRoutingMode(
			combined,
			parsed.data.options?.routingMode,
		);
		const adaptationScope = inferAdaptationScope(
			combined,
			parsed.data.options?.adaptationScope,
		);

		const details: string[] = [
			`ACO routing advisory for ${ROUTING_MODE_LABELS[routingMode]} over ${ADAPTATION_SCOPE_LABELS[adaptationScope]}. This guidance is advisory: it describes pheromone mechanics and configuration heuristics but does not execute graph traversal or manage live pheromone state — wire these patterns into your own routing layer.`,
		];

		details.push(
			...ACO_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (details.length === 1) {
			// No rules fired — supply baseline ACO orientation
			details.push(
				"Establish the three components of an ACO router before configuring parameters: (1) a pheromone map keyed by edge identifier (τ, initialised to 1.0), (2) a quality signal emitted at run completion (score, success flag, or inverse latency), and (3) a routing loop that samples next edges by P(i,j) ∝ τ^α × η^β. These three components are independent concerns — implement and test each in isolation before integrating.",
				"Set evaporation rate ρ and cycle length N as the primary tuning levers. ρ controls how quickly old information decays (higher ρ = faster adaptation to change); N controls update granularity (lower N = more responsive, higher I/O cost). Start with ρ=0.1 and N=50 runs; observe whether pheromone entropy stabilises or collapses before adjusting.",
				"Define τ_min and τ_max bounds before the first production run. Without bounds, pheromone collapses to zero on unused edges (eliminating exploration permanently) or grows unbounded on frequently-used edges (creating numeric instability). Typical safe defaults: τ_min = τ_max × 0.01, τ_max = 10.0.",
			);
		}

		// Signal-supplementary items
		if (hasGraphStructureSignal(combined)) {
			details.push(
				"Load the workflow graph from a versioned manifest at router startup rather than hard-coding edges in the routing logic. This allows topology changes (adding agents, removing deprecated paths) to take effect without code changes. Validate the manifest against a schema on load and reject ill-formed graphs before any pheromone state is initialised.",
			);
		}

		if (hasQualityMeasureSignal(combined)) {
			details.push(
				"Emit the quality signal as a structured event at the end of every run, keyed by run ID and edge sequence. The router deposits pheromone by consuming these events — this decouples quality measurement from routing logic and makes it possible to audit, replay, or simulate deposits without re-executing workflows.",
			);
		}

		if (hasExplorationSignal(combined)) {
			details.push(
				"Instrument pheromone entropy at each evaporation cycle and expose it as a metric. When entropy drops below 0.5 nats (roughly 60% of probability mass on one edge), trigger an exploration injection: select the ε fraction of edges with the lowest τ and reset them to τ_min × 2 to restore diversity without discarding accumulated knowledge on high-τ edges.",
			);
		}

		if (hasConvergenceSignal(combined)) {
			details.push(
				"Convergence detection: compare the maximum-probability edge's τ value against the median τ across all edges. A ratio above 10× suggests the router has converged onto a single path. Confirm whether this is correct convergence (the path is genuinely best) or premature lock-in (other paths have not been adequately explored) before concluding that ACO tuning is complete.",
			);
		}

		if (hasPersistenceSignal(combined)) {
			details.push(
				"Persist pheromone state as a flat key-value snapshot (edge_id → τ) at each evaporation cycle boundary. Include the cycle counter and timestamp in the snapshot so state can be correlated with the run log. On restart, load the most recent valid snapshot and resume from that cycle — do not reinitialise τ to 1.0 after restarts or the learned routing history is discarded.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply ACO configuration within these constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints on cycle frequency, persistence latency, or memory budget directly affect ρ, N, and τ_max choices — document which constraints drove which parameter decisions for future tuning reference.`,
			);
		}

		const artifacts = [
			buildOutputTemplateArtifact(
				"ACO pheromone configuration",
				`{
  "alpha": <number>,
  "beta": <number>,
  "rho": <number>,
  "tau_min": <number>,
  "tau_max": <number>,
  "evaporation_cycle": <runs>,
  "exploration_budget": <fraction>
}`,
				[
					"alpha",
					"beta",
					"rho",
					"tau_min",
					"tau_max",
					"evaporation_cycle",
					"exploration_budget",
				],
				"Use this template to keep the pheromone parameters versioned and reviewable.",
			),
			buildComparisonMatrixArtifact(
				"ACO edge-state matrix",
				["edge", "tau", "heuristic", "selection_probability", "update"],
				[
					{
						label: "best-known path",
						values: [
							"high τ after repeated success",
							"high heuristic desirability",
							"dominant but still normalised",
							"deposit and preserve unless entropy collapses",
						],
					},
					{
						label: "under-explored path",
						values: [
							"low τ but above τ_min",
							"moderate heuristic desirability",
							"kept alive by exploration budget",
							"small deposit or no deposit if low-quality",
						],
					},
					{
						label: "stale path",
						values: [
							"decayed τ after evaporation",
							"low heuristic desirability",
							"low selection probability",
							"prefer pruning or further decay",
						],
					},
				],
				"Use this matrix to compare candidate routes against the learned pheromone state.",
			),
			buildWorkedExampleArtifact(
				"ACO pheromone update example",
				{
					input: {
						edgeSequence: [
							"ingest→validate",
							"validate→route",
							"route→respond",
						],
						qualityScore: 0.8,
						evaporationRate: 0.1,
						initialTau: 1.0,
					},
					routingMode,
				},
				{
					deposit: 0.8,
					tauBeforeEvaporation: 1.8,
					tauAfterEvaporation: 1.62,
					action:
						"retain the successful path but keep alternatives above τ_min",
				},
				"Worked example showing one reinforce-and-evaporate cycle.",
			),
		];

		return createCapabilityResult(
			context,
			`ACO Router produced ${details.length} advisory guidance item${details.length === 1 ? "" : "s"} for ${ROUTING_MODE_LABELS[routingMode]} (scope: ${ADAPTATION_SCOPE_LABELS[adaptationScope]}).`,
			createFocusRecommendations(
				"ACO routing",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(skillManifest, acoRouterHandler);
