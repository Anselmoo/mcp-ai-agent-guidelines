import { z } from "zod";
import { adapt_physarum_router_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	FLOW_MEASURE_LABELS,
	hasConvergenceSignal,
	hasExplorationSignal,
	hasGraphStructureSignal,
	hasPersistenceSignal,
	hasPhysarumDomainSignal,
	hasQualityMeasureSignal,
	PRUNING_STRATEGY_LABELS,
} from "./routing-helpers.js";

// This handler advises on augmenting workflow routing with Physarum polycephalum
// (slime mould) mechanics: tube conductance reinforcement, flow-based pruning,
// and exploratory edge spawning.
//
// Scope — advisory and signal-driven only.  This handler does NOT:
//   • execute live graph traversal (no graphology, no in-process graph state)
//   • implement conductance persistence (advises on where/how to persist)
//   • cover pheromone trail mechanics (use adapt-aco-router)
//   • cover agent-pair weight matrices (use adapt-hebbian-router)
//
// Outputs are advisory guidance items that the host LLM uses to reason with.

const physarumRouterInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			pruningStrategy: z
				.enum(["conservative", "aggressive", "adaptive"])
				.optional()
				.describe(
					"Edge pruning strategy: conservative (high conductance threshold, preserve more paths), aggressive (low threshold, converge topology quickly), or adaptive (threshold adjusts to flow variance).",
				),
			flowMeasure: z
				.enum(["latency", "throughput", "quality"])
				.optional()
				.describe(
					"The signal used as the flow proxy: latency (lower latency → higher flow), throughput (request volume → reinforcement), or quality (output quality score → reinforcement).",
				),
		})
		.optional(),
});

type PruningStrategy = "conservative" | "aggressive" | "adaptive";
type FlowMeasure = "latency" | "throughput" | "quality";

function appendUniqueDetail(details: string[], detail: string) {
	if (!details.includes(detail)) {
		details.push(detail);
	}
}

const PHYSARUM_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(physarum|slime.mould?|slime.mold|conductance|tube|D_?\(|D\(t\)|D\s*\()\b/i,
		detail:
			"Model each workflow edge as a tube with a conductance scalar D (initialise all D = 1.0). After each adaptation cycle, update conductance using D(t+1) = D(t) × |flow(t)|^μ, where flow(t) is the normalised flow on that edge in the current cycle and μ ∈ [0.5, 1.5] is the reinforcement exponent. Higher μ drives faster convergence toward high-flow paths; lower μ produces smoother adaptation. Normalise flow values across all edges before applying the update to prevent unbounded growth on a single dominant edge.",
	},
	{
		pattern:
			/\b(prune|pruning|threshold|remove|dead.end|unused|low.conductance|discard.edge)\b/i,
		detail:
			"Prune edges whose conductance falls below a threshold D_prune after each adaptation cycle. Choose D_prune relative to the median conductance, not as an absolute value: D_prune = median(D) × k, where k ∈ [0.05, 0.3] depending on pruning aggressiveness. Absolute thresholds become stale as the conductance distribution shifts over time. Log every pruned edge with its final D value and the cycle number — pruned edges must be recoverable if the topology needs to be rolled back.",
	},
	{
		pattern:
			/\b(flow|traffic|utilisa|utiliz|busy|active|high.volume|frequently.used)\b/i,
		detail:
			"Measure flow on each edge as the fraction of adaptation-cycle runs that traversed it. Normalise by dividing each edge's raw count by the maximum count across all edges — this keeps flow values in [0, 1] regardless of total run volume. Do not use raw run counts as the flow signal: absolute counts make D updates dependent on system load, causing conductance to diverge between low-traffic and high-traffic periods.",
	},
	{
		pattern:
			/\b(explor|spawn|p_explore|new.edge|add.edge|discover.*path|path.*discover)\b/i,
		detail:
			"Introduce exploratory edge spawning to prevent topology collapse: with probability p_explore per cycle, add a candidate edge chosen uniformly from the set of non-existing or previously-pruned edges. Exploratory edges start with a small initial conductance D_init = D_min × 2, so they survive at least one adaptation cycle before being eligible for pruning again. Track spawned edges separately from the original topology so you can measure how often exploratory edges graduate to permanent paths versus get pruned again.",
	},
	{
		pattern: /\b(rollback|snapshot|revert|recover|undo|restore.topolog)\b/i,
		detail:
			"Maintain a pruning log: before removing an edge, snapshot its current D value and the cycle number into an append-only log. A pruned edge is recoverable by reading the log and re-inserting the edge with its pre-pruning D value (or D_min, whichever is higher). This makes topology changes auditable and supports rollback when a pruning decision turns out to be premature — for example, when a burst of traffic resumes on a path that was pruned during a quiet period.",
	},
	{
		pattern:
			/\b(reinforce|strengthen|amplif|positive.feedback|high.conduct)\b/i,
		detail:
			"High-flow edges self-reinforce through the D update rule: edges with flow(t) > 1.0 (after normalisation cap) amplify their conductance each cycle, while low-flow edges decay toward zero. The reinforcement exponent μ controls how rapidly this feedback loop concentrates flow: μ = 0.5 produces slow, smooth redistribution; μ = 1.5 produces rapid convergence onto the highest-flow path. Validate μ by running the adaptation loop in simulation on historical flow data before deploying to live traffic.",
	},
	{
		pattern: /\b(converg|topolog.collaps|all.flow|single.path|monopath)\b/i,
		detail:
			"Guard against full topology collapse (all flow concentrating on a single path) by enforcing a minimum conductance floor D_min > 0 on all non-pruned edges. Even with p_explore > 0, a very small D_min prevents edges from accumulating at exactly zero before spawning can replenish them. Monitor the ratio of edges with D > 2×D_min to total edges — a sharp drop in this ratio indicates the topology is contracting toward a monopath, which removes redundancy and makes the routing brittle to that path's failure.",
	},
	{
		pattern:
			/\b(persist|checkpoint|save|store|state|reload|resume|snapshot)\b/i,
		detail:
			"Persist the conductance map (edge_id → D) and the pruning log to durable storage after every adaptation cycle. Conductance state is small (one float per edge) and can be stored in a simple key-value store or a versioned config file. On restart, reload the most recent conductance snapshot and resume adaptation from that cycle — do not reinitialise all D = 1.0 after restarts, which would discard all accumulated flow-based routing knowledge.",
	},
	{
		pattern: /\b(latency|throughput|quality|measure|metric|signal|feedback)\b/i,
		detail:
			"Choose the flow proxy carefully: latency-based flow (lower latency = higher effective flow) works when response time is the primary routing objective; throughput-based flow (request volume) works when utilisation matters more than per-request quality; quality-based flow (output score) works when downstream evaluation is available. Mixing flow proxies within a single adaptation loop produces conflicting reinforcement signals — standardise on one proxy per adaptation tier and use separate routing layers for different objectives.",
	},
];

function inferPruningStrategy(
	combined: string,
	explicit?: PruningStrategy,
): PruningStrategy {
	if (explicit !== undefined) return explicit;
	if (
		/\b(aggressive|fast|quickly|converge.fast|low.threshold)\b/i.test(combined)
	)
		return "aggressive";
	if (/\b(adapt|dynamic.threshold|variance|auto.threshold)\b/i.test(combined))
		return "adaptive";
	return "conservative";
}

function inferFlowMeasure(
	combined: string,
	explicit?: FlowMeasure,
): FlowMeasure {
	if (explicit !== undefined) return explicit;
	if (/\b(latency|speed|response.time|slow|fast)\b/i.test(combined))
		return "latency";
	if (/\b(quality|score|rating|output.quality)\b/i.test(combined))
		return "quality";
	return "throughput";
}

function buildPruningStrategyDetail(pruningStrategy: PruningStrategy): string {
	switch (pruningStrategy) {
		case "conservative":
			return "Conservative pruning should require multiple low-conductance cycles before removal. Keep edges eligible for recovery during a grace window of at least 3 adaptation cycles so temporary traffic dips do not erase fallback paths that the workflow still needs for resilience.";
		case "aggressive":
			return "Aggressive pruning can remove low-signal edges quickly, but still gate removal behind a short warm-up window so new or recently spawned edges are not deleted before they have seen representative traffic. Use aggressive mode only when topology sprawl is the dominant problem and rollback logging is in place.";
		case "adaptive":
			return "Adaptive pruning should compute D_prune from the current conductance distribution and its variance rather than from a fixed constant. Raise the threshold when variance is high and the topology is clearly differentiating, lower it when variance is low so the router does not over-prune while the flow pattern is still ambiguous.";
	}
}

function buildFlowMeasureDetail(flowMeasure: FlowMeasure): string {
	switch (flowMeasure) {
		case "latency":
			return "Latency-based Physarum flow should invert and normalise response time before reinforcement so faster edges receive larger flow values. Use one latency aggregation window per adaptation cycle and avoid mixing p95 latency with throughput counts in the same conductance update.";
		case "throughput":
			return "Throughput-based Physarum flow should count how many runs traversed each edge during the cycle, then divide by the busiest edge count to keep reinforcement in [0, 1]. This makes conductance track relative path utility instead of raw system load.";
		case "quality":
			return "Quality-based Physarum flow should derive one bounded score per traversed edge from downstream evaluation of the path's output, then normalise those scores before updating conductance. This keeps the topology aligned to path quality rather than only to traffic volume.";
	}
}

const physarumRouterHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(physarumRouterInputSchema, input);
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
				"Physarum Router needs a description of the workflow topology, the flow signal used for conductance reinforcement, and the pruning objective before it can produce targeted guidance. Describe the workflow edges, the throughput or quality metric, and whether aggressive or conservative pruning is the current goal.",
			);
		}

		// Stage 2 — keywords present but no Physarum-distinctive signal
		if (
			!hasPhysarumDomainSignal(combined) &&
			!signals.hasContext &&
			parsed.data.options?.pruningStrategy === undefined &&
			parsed.data.options?.flowMeasure === undefined
		) {
			return buildInsufficientSignalResult(
				context,
				"Physarum Router could not identify conductance-and-pruning-specific details in this request. To generate Physarum routing guidance, describe at least one of: (a) the workflow edges and flow traffic you want to reinforce or prune, (b) the throughput or quality signal used as the flow proxy, or (c) edge pruning / slime mould concepts you want applied. Without this, the request is too general to distinguish Physarum routing from other adaptive approaches.",
				"Add flow measurement (throughput, latency, quality per edge), a pruning intent (remove dead-end edges), or Physarum/slime mould vocabulary to the request so Physarum Router can produce targeted recommendations.",
			);
		}

		const pruningStrategy = inferPruningStrategy(
			combined,
			parsed.data.options?.pruningStrategy,
		);
		const flowMeasure = inferFlowMeasure(
			combined,
			parsed.data.options?.flowMeasure,
		);

		const details: string[] = [
			`Physarum routing advisory for ${PRUNING_STRATEGY_LABELS[pruningStrategy]} using ${FLOW_MEASURE_LABELS[flowMeasure]}. This guidance is advisory: it describes conductance mechanics and pruning heuristics but does not execute graph traversal or manage live conductance state — wire these patterns into your own routing layer.`,
			"Model each workflow edge as a tube with conductance D initialised to 1.0, then update it once per adaptation cycle with D(t+1) = D(t) × |flow(t)|^μ using cycle-normalised flow values. Keep μ in a documented operating range such as 0.5–1.5 so reinforcement strength is explicit and reviewable.",
			buildFlowMeasureDetail(flowMeasure),
			"Prune only after an edge has had time to prove it is weak. Mark an edge prune-eligible only after it remains below D_prune for at least 2–3 consecutive adaptation cycles, and log the cycle number plus last observed conductance so removals can be reversed if the traffic pattern changes.",
			buildPruningStrategyDetail(pruningStrategy),
			"Reserve exploratory capacity in every adaptation plan: with probability p_explore per cycle, spawn a candidate edge from the non-existing or previously pruned set and start it at a small non-zero conductance above the floor. Exploration is part of the reference Physarum loop; without it, the topology can only collapse and never rediscover paths when workload shape changes.",
		];

		for (const detail of PHYSARUM_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail)) {
			appendUniqueDetail(details, detail);
		}

		if (details.length === 6) {
			// No rules fired — supply baseline Physarum orientation
			appendUniqueDetail(
				details,
				"Establish the three foundational Physarum components: (1) a conductance map keyed by edge identifier (D, initialised to 1.0), (2) a flow measurement that emits a normalised scalar per edge per adaptation cycle, and (3) a pruning check that removes edges whose conductance falls below D_prune after each cycle. These three components are independent — implement and test each in isolation before integrating.",
			);
			appendUniqueDetail(
				details,
				"Choose the reinforcement exponent μ based on how aggressively you want high-flow paths to dominate: start with μ = 1.0 (linear reinforcement) and observe whether the topology converges too slowly (raise μ) or collapses too quickly (lower μ). Log the conductance distribution after each cycle to detect divergence early.",
			);
			appendUniqueDetail(
				details,
				"Set D_prune = median(D) × 0.1 as the initial pruning threshold. This removes the bottom 10% of conductance values relative to the current distribution. Adjust k upward (0.2–0.3) for more aggressive pruning or downward (0.02–0.05) for conservative pruning. Monitor how many edges are pruned per cycle — zero pruning means the threshold is too low; mass pruning means it is too high.",
			);
		}

		// Signal-supplementary items
		if (hasGraphStructureSignal(combined)) {
			details.push(
				"Load the workflow topology from a versioned manifest at adaptation startup. The manifest should enumerate all initial edges with their source, target, and an optional initial conductance override. Validate the manifest schema on load; reject topologies with dangling edges or cyclic references that would create infinite flow loops.",
			);
		}

		if (hasQualityMeasureSignal(combined)) {
			details.push(
				"Emit the flow measurement as a structured event after every run: { edgeId, flowValue, cycleNumber }. The adaptation loop consumes these events in batches at each cycle boundary. Emitting flow events asynchronously from the main execution path prevents measurement latency from blocking workflow runs.",
			);
		}

		if (hasExplorationSignal(combined)) {
			details.push(
				"Track the proportion of active edges (D > D_min) over time. When this proportion drops below a floor (e.g., 30% of initial edges), increase p_explore for the next N cycles to spawn replacement candidate paths. This prevents the Physarum topology from collapsing to a single path before the routing has had enough cycles to validate that path's superiority.",
			);
		}

		if (hasConvergenceSignal(combined)) {
			details.push(
				"Measure topology convergence as the coefficient of variation (CV = σ/μ) of the conductance distribution. High CV (> 2.0) indicates concentrated flow on a few edges — approaching a monopath topology. Low CV (< 0.3) indicates conductance is still uniformly distributed across edges — the Physarum adaptation has not yet differentiated paths. Target CV ∈ [0.5, 1.5] for a healthy topology with clear high-flow paths and some diversity.",
			);
		}

		if (hasPersistenceSignal(combined)) {
			details.push(
				"Snapshot the conductance map at each cycle boundary using a write-ahead approach: write the new snapshot to a staging location, verify it, then atomically swap it with the current snapshot. This prevents corrupt or partial snapshots from overwriting valid state during a crash. Include the cycle counter in the snapshot filename so the history is browsable.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply Physarum configuration within these constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints on cycle frequency, pruning aggressiveness, or edge count limits directly affect μ, D_prune, and p_explore choices — document which constraints drove which parameter decisions.`,
			);
		}

		return createCapabilityResult(
			context,
			`Physarum Router produced ${details.length} advisory guidance item${details.length === 1 ? "" : "s"} for ${PRUNING_STRATEGY_LABELS[pruningStrategy]} (flow measure: ${FLOW_MEASURE_LABELS[flowMeasure]}).`,
			createFocusRecommendations(
				"Physarum routing",
				details,
				context.model.modelClass,
			),
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	physarumRouterHandler,
);
