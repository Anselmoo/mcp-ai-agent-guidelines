/**
 * Typed LLM response payload contract.
 *
 * Addresses W2 #73: Replace the raw `string` return from the LLM executor with
 * a discriminated union that makes call-site reasoning explicit — callers no
 * longer have to parse stub prefixes out of a plain string.
 */

import type { ModelTier } from "../runtime/llm-lane-executor.js";

// ─── Response kind ────────────────────────────────────────────────────────────

/**
 * Discriminant for the four possible outcomes of an LLM call:
 *
 * - `"success"`      – a live provider response was received.
 * - `"stub"`         – no API key; a deterministic placeholder was returned.
 * - `"rate-limited"` – provider returned 429 / quota-exceeded.
 * - `"api-error"`    – any other provider-side failure.
 */
export type LlmResponseKind = "success" | "stub" | "rate-limited" | "api-error";
export type LlmProvider =
	| "openai"
	| "anthropic"
	| "google"
	| "xai"
	| "mistral"
	| "other";

export interface LlmTokenUsage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
}

// ─── Payload ──────────────────────────────────────────────────────────────────

/**
 * Structured return value from `executeTyped()`.
 *
 * `provider` is always present. `durationMs` is omitted only for stubs where no
 * I/O took place. `usage` is populated for successful calls.
 */
export interface LlmResponsePayload {
	/** Outcome discriminant — use this for branching instead of string-parsing. */
	kind: LlmResponseKind;
	/** The text content: real provider output for `"success"`, deterministic
	 *  description for all failure kinds. */
	text: string;
	/** Model tier that was targeted. */
	tier: ModelTier;
	/** Physical model ID that was resolved for this tier. */
	modelId: string;
	/** Provider that backed the resolved physical model. */
	provider: LlmProvider;
	/**
	 * Wall-clock milliseconds from call start to completion.
	 * `undefined` when no I/O occurred (i.e. `kind === "stub"`).
	 */
	durationMs?: number;
	/**
	 * Provider-reported token usage for successful calls, or provider-aware
	 * estimated usage when the SDK does not supply it directly.
	 */
	usage?: LlmTokenUsage;
}

// ─── Type guards ──────────────────────────────────────────────────────────────

/** Returns `true` when the payload represents a successful live response. */
export function isLlmSuccess(
	payload: LlmResponsePayload,
): payload is LlmResponsePayload & {
	kind: "success";
	durationMs: number;
	usage: LlmTokenUsage;
} {
	return payload.kind === "success";
}

/** Returns `true` when the payload is a deterministic stub (no API key). */
export function isLlmStub(payload: LlmResponsePayload): boolean {
	return payload.kind === "stub";
}

/** Returns `true` for any failure kind (stub, rate-limited, api-error). */
export function isLlmFailure(payload: LlmResponsePayload): boolean {
	return payload.kind !== "success";
}

// ─── Branded error details ────────────────────────────────────────────────────

/**
 * Narrow subset of `LlmResponsePayload` guaranteed after a `!isLlmSuccess`
 * check.  Callers can pattern-match on `kind` for recovery logic.
 */
export type LlmFailurePayload = LlmResponsePayload & {
	kind: "stub" | "rate-limited" | "api-error";
};
