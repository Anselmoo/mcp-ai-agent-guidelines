/**
 * Typed model-routing decision and result contracts.
 *
 * Addresses W2 #74: Gives the routing layer an explicit, reviewable contract
 * rather than ad-hoc objects threaded through call sites.
 *
 * `ModelRoutingDecision`  – what the router chose and why (pure decision).
 * `ModelRoutingResult`    – decision + execution outcome, suitable for audit.
 * `LaneExecutionRecord`   – canonical form of a single lane's output (replaces
 *                           the local `ExecutionResult` in multi-model-executor).
 * `PatternExecutionResult`– canonical form of a multi-lane pattern outcome
 *                           (replaces the local `SynthesisResult`).
 */

import type { ModelProfile } from "./runtime.js";

// ─── Routing decision ─────────────────────────────────────────────────────────

/**
 * The outcome of a model-routing call: which model was selected, why, and what
 * fallback was available if the primary was unavailable.
 */
export interface ModelRoutingDecision {
	/** Physical model ID that was ultimately selected for execution. */
	selectedModelId: string;
	/** Model profile for the selected model. */
	selectedProfile: ModelProfile;
	/**
	 * Human-readable explanation of the routing decision (e.g. why a fallback
	 * was chosen over the primary).
	 */
	rationale: string;
	/**
	 * Physical model ID of the fallback, when the primary was unavailable
	 * and a substitution occurred.  `undefined` when the primary was used.
	 */
	fallbackModelId?: string;
}

// ─── Lane-level execution record ─────────────────────────────────────────────

/**
 * Record for a single LLM lane execution.  Canonical contract-level form of
 * what `multi-model-executor` internally called `ExecutionResult`.
 */
export interface LaneExecutionRecord {
	/** Physical model ID used for this lane. */
	modelId: string;
	/** Raw text output produced by the lane. */
	output: string;
	/** Wall-clock milliseconds for this individual lane. */
	latencyMs: number;
}

// ─── Pattern-level result ─────────────────────────────────────────────────────

/**
 * Result of a multi-lane orchestration pattern (parallel synthesis,
 * adversarial critique, draft-review chain, majority vote, cascade fallback).
 *
 * Canonical contract-level form of what `multi-model-executor` internally
 * called `SynthesisResult`.
 */
export interface PatternExecutionResult {
	/** The combined or selected final output of the pattern. */
	finalOutput: string;
	/** Ordered records for every lane that ran (drafts + synthesis, etc.). */
	lanes: LaneExecutionRecord[];
	/** Name of the pattern that produced this result (matches function names in
	 *  multi-model-executor). */
	patternName:
		| "tripleParallelSynthesis"
		| "adversarialCritique"
		| "draftReviewChain"
		| "majorityVote"
		| "cascadeFallback";
}

// ─── Routing result (decision + execution) ────────────────────────────────────

/**
 * Full audit record binding a routing decision to the execution that followed.
 * Useful for observability, replay, and cost attribution.
 */
export interface ModelRoutingResult {
	/** The routing decision that was made before execution. */
	decision: ModelRoutingDecision;
	/** Total wall-clock milliseconds across all lanes. */
	totalDurationMs: number;
	/** The pattern result when a multi-lane pattern was used.  `undefined` for
	 *  single-model calls. */
	patternResult?: PatternExecutionResult;
	/** Direct single-lane output when no multi-lane pattern was used. */
	directOutput?: string;
}

// ─── Type guards ─────────────────────────────────────────────────────────────

/** Returns `true` when the result came from a multi-lane pattern. */
export function isPatternResult(
	result: ModelRoutingResult,
): result is ModelRoutingResult & {
	patternResult: PatternExecutionResult;
} {
	return result.patternResult !== undefined;
}

/** Returns `true` when the result came from a direct single-model call. */
export function isDirectResult(
	result: ModelRoutingResult,
): result is ModelRoutingResult & { directOutput: string } {
	return typeof result.directOutput === "string";
}

/** Narrows an unknown value to `LaneExecutionRecord`. */
export function isLaneExecutionRecord(
	value: unknown,
): value is LaneExecutionRecord {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		typeof v.modelId === "string" &&
		typeof v.output === "string" &&
		typeof v.latencyMs === "number"
	);
}
