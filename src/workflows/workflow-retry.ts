/**
 * workflow-retry.ts
 *
 * Retry utilities and circuit-breaker pattern for workflow step execution.
 *
 * Features:
 *  - Configurable exponential back-off with jitter
 *  - Per-step or per-instruction retry budget
 *  - Circuit-breaker that opens after N consecutive failures
 *  - Timeout wrapper compatible with both serial and parallel runners
 */

import { toErrorMessage } from "../infrastructure/object-utilities.js";

// ─── Retry config ─────────────────────────────────────────────────────────────

export interface RetryConfig {
	/** Maximum number of attempts (first attempt + N retries). Default 3. */
	maxAttempts?: number;
	/** Initial delay in milliseconds before the first retry. Default 200. */
	initialDelayMs?: number;
	/** Multiplier applied to the delay between retries. Default 2. */
	backoffMultiplier?: number;
	/** Maximum delay cap in milliseconds. Default 10_000. */
	maxDelayMs?: number;
	/** Add ±jitter fraction (0–1) to each delay. Default 0.25. */
	jitterFraction?: number;
	/** Predicate controlling which errors are retryable. Default: all errors. */
	isRetryable?: (error: unknown) => boolean;
}

/** Resolved defaults for a RetryConfig. */
export interface ResolvedRetryConfig {
	maxAttempts: number;
	initialDelayMs: number;
	backoffMultiplier: number;
	maxDelayMs: number;
	jitterFraction: number;
	isRetryable: (error: unknown) => boolean;
}

export function resolveRetryConfig(partial?: RetryConfig): ResolvedRetryConfig {
	return {
		maxAttempts: partial?.maxAttempts ?? 3,
		initialDelayMs: partial?.initialDelayMs ?? 200,
		backoffMultiplier: partial?.backoffMultiplier ?? 2,
		maxDelayMs: partial?.maxDelayMs ?? 10_000,
		jitterFraction: partial?.jitterFraction ?? 0.25,
		isRetryable: partial?.isRetryable ?? (() => true),
	};
}

/** Calculate delay for attempt `attempt` (0-based retry index). */
export function computeRetryDelay(
	attempt: number,
	config: ResolvedRetryConfig,
): number {
	const base = config.initialDelayMs * config.backoffMultiplier ** attempt;
	const capped = Math.min(base, config.maxDelayMs);
	const jitter =
		config.jitterFraction > 0
			? capped * config.jitterFraction * (Math.random() * 2 - 1)
			: 0;
	return Math.max(0, Math.round(capped + jitter));
}

/** Structured record of one retry attempt. */
export interface RetryAttemptRecord {
	attempt: number;
	error: string;
	delayMs: number;
}

/** Outcome from `withRetry`. */
export interface RetryOutcome<T> {
	result: T;
	attempts: number;
	retryRecords: RetryAttemptRecord[];
}

/**
 * Execute `fn` with retry logic according to `config`.
 * Throws the last error if all attempts are exhausted.
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	config?: RetryConfig,
	label?: string,
): Promise<RetryOutcome<T>> {
	const resolved = resolveRetryConfig(config);
	const retryRecords: RetryAttemptRecord[] = [];

	for (let attempt = 0; attempt < resolved.maxAttempts; attempt++) {
		try {
			const result = await fn();
			return { result, attempts: attempt + 1, retryRecords };
		} catch (error) {
			const isLast = attempt === resolved.maxAttempts - 1;
			if (isLast || !resolved.isRetryable(error)) {
				throw error;
			}

			const delayMs = computeRetryDelay(attempt, resolved);
			retryRecords.push({
				attempt: attempt + 1,
				error: toErrorMessage(error),
				delayMs,
			});

			if (label) {
				console.warn(
					`[workflow-retry] Step "${label}" attempt ${attempt + 1} failed: ` +
						`${toErrorMessage(error)}. Retrying in ${delayMs}ms...`,
				);
			}

			await sleep(delayMs);
		}
	}

	// TypeScript narrowing — unreachable but required
	throw new Error(
		`[workflow-retry] Exhausted ${resolved.maxAttempts} attempts`,
	);
}

// ─── Timeout wrapper ──────────────────────────────────────────────────────────

/**
 * Wraps `fn` in a per-call timeout.
 * Rejects with a `StepTimeoutError` when `timeoutMs` is exceeded.
 */
export async function withTimeout<T>(
	fn: () => Promise<T>,
	timeoutMs: number,
	label?: string,
): Promise<T> {
	if (timeoutMs <= 0) return fn();

	let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutHandle = setTimeout(() => {
			reject(
				new StepTimeoutError(
					label
						? `Step "${label}" timed out after ${timeoutMs}ms`
						: `Step timed out after ${timeoutMs}ms`,
					timeoutMs,
				),
			);
		}, timeoutMs);
	});

	try {
		const result = await Promise.race([fn(), timeoutPromise]);
		return result;
	} finally {
		if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
	}
}

/** Thrown when a step exceeds its allotted time. */
export class StepTimeoutError extends Error {
	constructor(
		message: string,
		public readonly timeoutMs: number,
	) {
		super(message);
		this.name = "StepTimeoutError";
	}
}

// ─── Circuit Breaker ──────────────────────────────────────────────────────────

export type CircuitBreakerState = "closed" | "open" | "half-open";

export interface CircuitBreakerConfig {
	/** Number of consecutive failures before the circuit opens. Default 5. */
	failureThreshold?: number;
	/** Time in ms the circuit stays open before moving to half-open. Default 30_000. */
	resetTimeoutMs?: number;
	/** Number of successful probes needed to close from half-open. Default 2. */
	halfOpenSuccessThreshold?: number;
}

export interface CircuitBreakerStats {
	state: CircuitBreakerState;
	consecutiveFailures: number;
	totalFailures: number;
	totalSuccesses: number;
	totalCalls: number;
	lastFailureAt?: string;
	lastOpenedAt?: string;
}

/**
 * A named circuit-breaker instance.
 * Thread-safe for single-process use (Node.js event loop).
 */
export class CircuitBreaker {
	private state: CircuitBreakerState = "closed";
	private consecutiveFailures = 0;
	private totalFailures = 0;
	private totalSuccesses = 0;
	private totalCalls = 0;
	private lastFailureAt?: Date;
	private lastOpenedAt?: Date;
	private halfOpenSuccesses = 0;

	private readonly failureThreshold: number;
	private readonly resetTimeoutMs: number;
	private readonly halfOpenSuccessThreshold: number;

	constructor(
		public readonly name: string,
		config?: CircuitBreakerConfig,
	) {
		this.failureThreshold = config?.failureThreshold ?? 5;
		this.resetTimeoutMs = config?.resetTimeoutMs ?? 30_000;
		this.halfOpenSuccessThreshold = config?.halfOpenSuccessThreshold ?? 2;
	}

	/** Execute `fn` through the circuit breaker. */
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		this.checkState();

		this.totalCalls++;

		try {
			const result = await fn();
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure();
			throw error;
		}
	}

	get isOpen(): boolean {
		return this.state === "open";
	}

	get stats(): CircuitBreakerStats {
		return {
			state: this.state,
			consecutiveFailures: this.consecutiveFailures,
			totalFailures: this.totalFailures,
			totalSuccesses: this.totalSuccesses,
			totalCalls: this.totalCalls,
			lastFailureAt: this.lastFailureAt?.toISOString(),
			lastOpenedAt: this.lastOpenedAt?.toISOString(),
		};
	}

	/** Manually reset to closed (useful in tests). */
	reset(): void {
		this.state = "closed";
		this.consecutiveFailures = 0;
		this.halfOpenSuccesses = 0;
	}

	private checkState(): void {
		if (this.state === "open") {
			if (
				this.lastOpenedAt &&
				Date.now() - this.lastOpenedAt.getTime() >= this.resetTimeoutMs
			) {
				this.state = "half-open";
				this.halfOpenSuccesses = 0;
			} else {
				throw new CircuitOpenError(
					`Circuit "${this.name}" is open — calls are blocked`,
					this.name,
				);
			}
		}
	}

	private onSuccess(): void {
		this.totalSuccesses++;
		if (this.state === "half-open") {
			this.halfOpenSuccesses++;
			if (this.halfOpenSuccesses >= this.halfOpenSuccessThreshold) {
				this.state = "closed";
				this.consecutiveFailures = 0;
				this.halfOpenSuccesses = 0;
			}
		} else {
			this.consecutiveFailures = 0;
		}
	}

	private onFailure(): void {
		this.totalFailures++;
		this.consecutiveFailures++;
		this.lastFailureAt = new Date();

		if (
			this.state === "half-open" ||
			this.consecutiveFailures >= this.failureThreshold
		) {
			this.state = "open";
			this.lastOpenedAt = new Date();
		}
	}
}

/** Thrown when a call is rejected by an open circuit. */
export class CircuitOpenError extends Error {
	constructor(
		message: string,
		public readonly circuitName: string,
	) {
		super(message);
		this.name = "CircuitOpenError";
	}
}

// ─── Error classification ─────────────────────────────────────────────────────

export type StepErrorClass =
	| "transient" // Network hiccup, rate-limit — retry immediately
	| "timeout" // Step took too long — retry with back-off
	| "validation" // Input/output contract violation — do not retry
	| "fatal" // Unrecoverable (OOM, assertion) — abort workflow
	| "circuit-open" // Circuit breaker is open
	| "unknown"; // Default when classification fails

/**
 * Classify an error for retry/abort decisions.
 * Extend or replace this function for domain-specific error handling.
 */
export function classifyStepError(error: unknown): StepErrorClass {
	if (error instanceof CircuitOpenError) return "circuit-open";
	if (error instanceof StepTimeoutError) return "timeout";

	const msg = toErrorMessage(error).toLowerCase();

	if (
		msg.includes("validation") ||
		msg.includes("invalid input") ||
		msg.includes("contract")
	) {
		return "validation";
	}

	if (
		msg.includes("enomem") ||
		msg.includes("out of memory") ||
		msg.includes("maximum call stack")
	) {
		return "fatal";
	}

	if (
		msg.includes("timeout") ||
		msg.includes("timed out") ||
		msg.includes("etimedout")
	) {
		return "timeout";
	}

	if (
		msg.includes("econnreset") ||
		msg.includes("enotfound") ||
		msg.includes("503") ||
		msg.includes("429") ||
		msg.includes("rate limit")
	) {
		return "transient";
	}

	return "unknown";
}

/**
 * Returns true for error classes that should trigger a retry.
 */
export function isRetryableErrorClass(cls: StepErrorClass): boolean {
	return cls === "transient" || cls === "timeout" || cls === "unknown";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
