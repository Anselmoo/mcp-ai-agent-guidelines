/**
 * routing-helpers.ts
 *
 * Shared heuristics and label utilities for the adapt-domain routing handlers:
 *   adapt-aco-router, adapt-physarum-router, adapt-hebbian-router
 *
 * All exports are pure functions — no I/O, no model calls, deterministic.
 * Do not import graphology or any live graph executor here (Batch A advisory only).
 */

// ---------------------------------------------------------------------------
// Shared signal constants
// ---------------------------------------------------------------------------

/**
 * Patterns that indicate a user wants adaptive, self-improving routing behaviour
 * across any of the three routing algorithms.
 */
export const ADAPTIVE_ROUTING_SIGNAL =
	/\b(adapt|self.optimis|self.prune|self.adjust|self.learn|reinforce|evolv|automatic|dynamic|feedback.loop)\b/i;

/**
 * Patterns that indicate insufficient context for routing recommendations.
 * When matched alongside an empty keyword set the handler should fire the
 * insufficient-signal guard rather than producing low-quality output.
 */
export const VAGUE_ROUTING_SIGNAL =
	/^(routing|route|adapt|improve|optimize|optimise|help|how|what|why)\s*[?!]?$/i;

// ---------------------------------------------------------------------------
// Graph / topology signal helpers
// ---------------------------------------------------------------------------

/** True when the combined text describes a graph with explicit node/edge structure. */
export function hasGraphStructureSignal(combined: string): boolean {
	return /\b(node|edge|graph|topology|vertex|vertices|dag|pipeline|flow|network)\b/i.test(
		combined,
	);
}

/** True when the combined text references a quality or performance measurement. */
export function hasQualityMeasureSignal(combined: string): boolean {
	return /\b(quality|score|metric|success.rate|latency|throughput|reward|feedback|rating|measure)\b/i.test(
		combined,
	);
}

/** True when the combined text references exploration vs. exploitation trade-offs. */
export function hasExplorationSignal(combined: string): boolean {
	return /\b(explor|exploit|balance|epsilon|random|greedy|diversif|discover)\b/i.test(
		combined,
	);
}

/** True when the combined text references convergence, stability, or plateau. */
export function hasConvergenceSignal(combined: string): boolean {
	return /\b(converg|stab|plateau|settle|lock.in|frozen|weight.*stable|stable.*weight)\b/i.test(
		combined,
	);
}

/** True when the combined text references persistence, state, or checkpointing. */
export function hasPersistenceSignal(combined: string): boolean {
	return /\b(persist|checkpoint|save|store|state|reload|resume|snapshot|durable)\b/i.test(
		combined,
	);
}

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

export const ROUTING_MODE_LABELS = {
	explore: "exploration-biased (high diversity, discover new paths)",
	exploit: "exploitation-focused (prefer best-known paths)",
	balanced: "balanced exploration/exploitation",
} as const;

export const PRUNING_STRATEGY_LABELS = {
	conservative:
		"conservative pruning (high conductance threshold, remove only clearly dead paths)",
	aggressive: "aggressive pruning (low threshold, converge topology quickly)",
	adaptive: "adaptive pruning (threshold adjusts based on flow variance)",
} as const;

export const FLOW_MEASURE_LABELS = {
	latency: "edge latency (lower latency → higher flow weight)",
	throughput:
		"edge throughput (higher request volume → stronger reinforcement)",
	quality: "output quality score (higher quality → stronger reinforcement)",
} as const;

export const ROUTING_POLICY_LABELS = {
	greedy: "greedy selection (always pick highest-weight pair)",
	softmax: "softmax sampling (probability proportional to weight)",
	"epsilon-greedy":
		"ε-greedy (exploit best pair with probability 1−ε, explore randomly otherwise)",
} as const;

export const WEIGHT_SCOPE_LABELS = {
	pairwise: "pairwise (one weight per ordered agent pair)",
	broadcast:
		"broadcast (one weight per source agent, shared across all targets)",
	"all-to-all": "all-to-all (full N×N matrix, maximum granularity)",
} as const;

// ---------------------------------------------------------------------------
// Domain-specific signal detectors
//
// These are the key discriminators used by insufficient-signal guards.
// A request that carries no domain-distinctive vocabulary cannot produce
// targeted routing guidance for that specific algorithm — the handler asks
// for more detail rather than generating generic advice.
//
// Each detector covers three clusters:
//   (a) explicit algorithm vocabulary
//   (b) characteristic output behaviour (what the algorithm does that siblings don't)
//   (c) required input context (graph/agents/quality signal)
// ---------------------------------------------------------------------------

/**
 * True when `combined` contains enough ACO-distinctive signal to advise on
 * pheromone trail mechanics.
 *
 * Distinctive ACO concerns (vs. Physarum / Hebbian):
 *   • pheromone deposition / evaporation on edges
 *   • path-quality signals that drive trail reinforcement
 *   • alpha/beta selection probabilities over graph edges
 *   • self-optimising workflow edge weights (not edge removal, not agent pairs)
 */
export function hasAcoDomainSignal(combined: string): boolean {
	// Cluster A — explicit ACO / pheromone vocabulary
	if (
		/\b(pheromone|tau|ant.colony|aco|evaporat|deposit|trail|alpha.*beta|beta.*alpha)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — path or edge co-occurring with a quality / reward signal
	// ("which paths perform better", "edge quality scores", "success rate per route")
	if (
		/\b(path|edge|workflow.edge|route)\b/i.test(combined) &&
		/\b(qualit|score|reward|success|metric|perform|better|effective)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — reinforcing / preferring paths (not removing them)
	if (
		/\b(reinforce.*path|path.*reinforce|learn.*path|path.*learn|prefer.*path|path.*prefer|self.optimis.*workflow|adaptive.*edge.*weight)\b/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when `combined` contains enough Physarum-distinctive signal to advise on
 * conductance / pruning mechanics.
 *
 * Distinctive Physarum concerns (vs. ACO / Hebbian):
 *   • edge conductance reinforcement and decay (D update rule)
 *   • pruning / removing edges whose conductance falls below a threshold
 *   • flow-based reinforcement (throughput / traffic volume)
 *   • topology simplification toward high-flow paths
 */
export function hasPhysarumDomainSignal(combined: string): boolean {
	// Cluster A — explicit Physarum / conductance vocabulary
	if (
		/\b(physarum|slime.mould?|slime.mold|conductance|tube.conduct)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — pruning / removing / dead-end edges
	if (
		/\b(prune|pruning|dead.end|self.prune|remove.*edge|remove.*path|unused.*route|unused.*path|simplif.*topolog|topolog.*simplif|spawn.*edge|new.edge|p.explore|topology.collapse)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — flow or throughput co-occurring with routing context
	if (
		/\b(flow|throughput|traffic|utilisa|utiliz|busy|volume)\b/i.test(
			combined,
		) &&
		/\b(rout|path|edge|workflow|pipeline|topolog)\b/i.test(combined)
	)
		return true;

	return false;
}

/**
 * True when `combined` contains enough Hebbian-distinctive signal to advise on
 * agent-pair weight matrices.
 *
 * Distinctive Hebbian concerns (vs. ACO / Physarum):
 *   • N×N weight matrices over agent pairs (not workflow edges)
 *   • co-activation and collaboration quality signals
 *   • learning which agent pairings complement each other
 *   • softmax / greedy / ε-greedy selection over agent rows
 */
export function hasHebbianDomainSignal(combined: string): boolean {
	// Cluster A — explicit Hebbian / synaptic vocabulary
	if (
		/\b(hebbian|synaptic|co.activat|weight.matrix|fire.together|wire.together)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — agent pairs / collaboration / complementarity
	if (
		/\b(agent.pair|pair.of.agent|which.agent|multi.agent.*rout|agent.*together|together.*agent|agent.*collaborat|collaborat.*agent|complement.*agent|agent.*complement|strengthen.*pair|pair.*strengthen|pair.*quality|pair.*learn)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — collaboration quality co-occurring with agent / model context
	if (
		/\b(collaborat|partnerships?|synerg|complement)\b/i.test(combined) &&
		/\b(agents?|model|llm|assistant)\b/i.test(combined)
	)
		return true;

	return false;
}
