/**
 * Retry utilities using `p-retry` for declarative, exponential-backoff retry
 * logic across skill executions and infrastructure calls.
 */

import pRetry, { AbortError } from "p-retry";
import {
	DEFAULT_RETRY_OPTIONS,
	NETWORK_RETRY_OPTIONS,
	SKILL_RETRY_OPTIONS,
} from "../config/runtime-defaults.js";
import { createOperationalLogger } from "./observability.js";

// ---------------------------------------------------------------------------
// Re-export AbortError so callers can terminate retries without importing
// p-retry directly
// ---------------------------------------------------------------------------

export { AbortError };

const retryLogger = createOperationalLogger("warn");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetryOptions {
	/** Maximum number of attempts (default: 3) */
	retries?: number;
	/** Base delay in milliseconds between attempts (default: 500) */
	minTimeout?: number;
	/** Maximum delay cap in milliseconds (default: 5000) */
	maxTimeout?: number;
	/** Exponential backoff factor (default: 2) */
	factor?: number;
	/** Randomize retry delays to avoid synchronized retries (default: true) */
	randomize?: boolean;
	/** Called before each retry with the error and attempt number */
	onFailedAttempt?: (error: {
		message: string;
		attemptNumber: number;
		retriesLeft: number;
	}) => void;
}

export interface BackoffDelayOptions {
	/** Maximum delay cap applied after exponential backoff and jitter */
	maxDelayMs?: number;
	/** Jitter window added to the exponential delay */
	jitterMs?: number;
	/** Deterministic random value for testing */
	randomValue?: number;
}

export function calculateExponentialBackoffDelay(
	baseDelayMs: number,
	attempt: number,
	options: BackoffDelayOptions = {},
): number {
	const exponentialDelay = baseDelayMs * 2 ** attempt;
	const cappedDelay =
		options.maxDelayMs === undefined
			? exponentialDelay
			: Math.min(exponentialDelay, options.maxDelayMs);
	const jitter =
		(options.randomValue ?? Math.random()) * (options.jitterMs ?? 0);

	if (options.maxDelayMs === undefined) {
		return cappedDelay + jitter;
	}

	return Math.min(cappedDelay + jitter, options.maxDelayMs);
}

// ---------------------------------------------------------------------------
// Core helper
// ---------------------------------------------------------------------------

/**
 * Retry `fn` up to `options.retries` times using exponential back-off.
 *
 * Throw an {@link AbortError} inside `fn` to stop retrying immediately.
 *
 * ```ts
 * const result = await withRetries(() => fetchRemoteData(), { retries: 5 });
 * ```
 */
export async function withRetries<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	return pRetry(fn, {
		retries: options.retries ?? DEFAULT_RETRY_OPTIONS.retries,
		minTimeout: options.minTimeout ?? DEFAULT_RETRY_OPTIONS.minTimeout,
		maxTimeout: options.maxTimeout ?? DEFAULT_RETRY_OPTIONS.maxTimeout,
		factor: options.factor ?? DEFAULT_RETRY_OPTIONS.factor,
		randomize: options.randomize ?? DEFAULT_RETRY_OPTIONS.randomize,
		onFailedAttempt: options.onFailedAttempt,
	});
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

/**
 * Retry a network/model call three times with sensible defaults.
 */
export function retryNetworkCall<T>(fn: () => Promise<T>): Promise<T> {
	return withRetries(fn, {
		...NETWORK_RETRY_OPTIONS,
		onFailedAttempt: (err) => {
			retryLogger.log("warn", "Network retry attempt failed", {
				attemptNumber: err.attemptNumber,
				retriesLeft: err.retriesLeft,
				error: err.message,
			});
		},
	});
}

/**
 * Retry an idempotent skill execution up to five times, logging each failure.
 */
export function retrySkillExecution<T>(fn: () => Promise<T>): Promise<T> {
	return withRetries(fn, {
		...SKILL_RETRY_OPTIONS,
		onFailedAttempt: (err) => {
			retryLogger.log("warn", "Skill retry attempt failed", {
				attemptNumber: err.attemptNumber,
				retriesLeft: err.retriesLeft,
				error: err.message,
			});
		},
	});
}
