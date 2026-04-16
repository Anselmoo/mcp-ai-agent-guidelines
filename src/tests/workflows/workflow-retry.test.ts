/**
 * Tests for workflow-retry: withRetry, withTimeout, CircuitBreaker,
 * classifyStepError, computeRetryDelay.
 */

import { describe, expect, it, vi } from "vitest";
import {
	CircuitBreaker,
	CircuitOpenError,
	classifyStepError,
	computeRetryDelay,
	isRetryableErrorClass,
	type RetryConfig,
	resolveRetryConfig,
	StepTimeoutError,
	withRetry,
	withTimeout,
} from "../../workflows/workflow-retry.js";

// ─── resolveRetryConfig ───────────────────────────────────────────────────────

describe("resolveRetryConfig", () => {
	it("uses defaults when no config provided", () => {
		const cfg = resolveRetryConfig();
		expect(cfg.maxAttempts).toBe(3);
		expect(cfg.initialDelayMs).toBe(200);
		expect(cfg.backoffMultiplier).toBe(2);
		expect(cfg.maxDelayMs).toBe(10_000);
		expect(cfg.jitterFraction).toBe(0.25);
		expect(cfg.isRetryable(new Error("any"))).toBe(true);
	});

	it("merges partial overrides", () => {
		const cfg = resolveRetryConfig({ maxAttempts: 5, initialDelayMs: 50 });
		expect(cfg.maxAttempts).toBe(5);
		expect(cfg.initialDelayMs).toBe(50);
		expect(cfg.backoffMultiplier).toBe(2); // default
	});
});

// ─── computeRetryDelay ───────────────────────────────────────────────────────

describe("computeRetryDelay", () => {
	it("grows with each attempt", () => {
		const cfg = resolveRetryConfig({ jitterFraction: 0 });
		const d0 = computeRetryDelay(0, cfg);
		const d1 = computeRetryDelay(1, cfg);
		const d2 = computeRetryDelay(2, cfg);
		expect(d1).toBeGreaterThan(d0);
		expect(d2).toBeGreaterThan(d1);
	});

	it("is capped at maxDelayMs", () => {
		const cfg = resolveRetryConfig({
			maxDelayMs: 100,
			jitterFraction: 0,
			backoffMultiplier: 1000,
		});
		const delay = computeRetryDelay(5, cfg);
		expect(delay).toBeLessThanOrEqual(100);
	});

	it("returns ≥ 0 even with negative jitter", () => {
		const cfg = resolveRetryConfig({ jitterFraction: 2 });
		for (let i = 0; i < 20; i++) {
			expect(computeRetryDelay(0, cfg)).toBeGreaterThanOrEqual(0);
		}
	});
});

// ─── withRetry ────────────────────────────────────────────────────────────────

describe("withRetry", () => {
	it("returns result on first try", async () => {
		const fn = vi.fn(async () => "ok");
		const outcome = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 });
		expect(outcome.result).toBe("ok");
		expect(outcome.attempts).toBe(1);
		expect(outcome.retryRecords).toHaveLength(0);
	});

	it("retries and succeeds on the second attempt", async () => {
		let call = 0;
		const fn = vi.fn(async () => {
			call++;
			if (call < 2) throw new Error("transient");
			return "success";
		});

		const outcome = await withRetry(fn, {
			maxAttempts: 3,
			initialDelayMs: 0,
			jitterFraction: 0,
		});
		expect(outcome.result).toBe("success");
		expect(outcome.attempts).toBe(2);
		expect(outcome.retryRecords).toHaveLength(1);
	});

	it("throws after all attempts exhausted", async () => {
		const fn = vi.fn(async () => {
			throw new Error("always fails");
		});

		await expect(
			withRetry(fn, {
				maxAttempts: 3,
				initialDelayMs: 0,
				jitterFraction: 0,
			}),
		).rejects.toThrow("always fails");
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("does not retry non-retryable errors", async () => {
		const fn = vi.fn(async () => {
			throw new Error("validation error");
		});
		const config: RetryConfig = {
			maxAttempts: 3,
			initialDelayMs: 0,
			isRetryable: () => false,
		};

		await expect(withRetry(fn, config)).rejects.toThrow("validation error");
		expect(fn).toHaveBeenCalledTimes(1);
	});
});

// ─── withTimeout ─────────────────────────────────────────────────────────────

describe("withTimeout", () => {
	it("resolves when fn completes before timeout", async () => {
		const result = await withTimeout(async () => "done", 1000);
		expect(result).toBe("done");
	});

	it("throws StepTimeoutError when fn exceeds timeout", async () => {
		const fn = () =>
			new Promise<string>((r) => setTimeout(() => r("late"), 200));
		await expect(withTimeout(fn, 10, "test-step")).rejects.toThrow(
			StepTimeoutError,
		);
	});

	it("includes step label in error message", async () => {
		const fn = () =>
			new Promise<never>((_, r) =>
				setTimeout(() => r(new Error("ignored")), 200),
			);
		try {
			await withTimeout(fn, 10, "my-label");
		} catch (err) {
			expect(err instanceof StepTimeoutError).toBe(true);
			expect((err as StepTimeoutError).message).toContain("my-label");
			expect((err as StepTimeoutError).timeoutMs).toBe(10);
		}
	});

	it("passes through when timeoutMs <= 0", async () => {
		const fn = vi.fn(async () => 42);
		const result = await withTimeout(fn, 0);
		expect(result).toBe(42);
		expect(fn).toHaveBeenCalledTimes(1);
	});
});

// ─── CircuitBreaker ───────────────────────────────────────────────────────────

describe("CircuitBreaker", () => {
	it("starts in closed state", () => {
		const cb = new CircuitBreaker("test");
		expect(cb.stats.state).toBe("closed");
		expect(cb.isOpen).toBe(false);
	});

	it("opens after failureThreshold consecutive failures", async () => {
		const cb = new CircuitBreaker("test", {
			failureThreshold: 3,
			resetTimeoutMs: 30_000,
		});

		for (let i = 0; i < 3; i++) {
			await expect(
				cb.execute(async () => {
					throw new Error("boom");
				}),
			).rejects.toThrow();
		}

		expect(cb.stats.state).toBe("open");
		expect(cb.isOpen).toBe(true);
	});

	it("throws CircuitOpenError when open", async () => {
		const cb = new CircuitBreaker("test", {
			failureThreshold: 1,
			resetTimeoutMs: 30_000,
		});
		// Trip the breaker
		await expect(
			cb.execute(async () => {
				throw new Error("trip");
			}),
		).rejects.toThrow();

		// Now it should throw CircuitOpenError
		await expect(cb.execute(async () => "ok")).rejects.toThrow(
			CircuitOpenError,
		);
	});

	it("resets to closed on manual reset", async () => {
		const cb = new CircuitBreaker("test", { failureThreshold: 1 });
		await expect(
			cb.execute(async () => {
				throw new Error("trip");
			}),
		).rejects.toThrow();

		cb.reset();
		expect(cb.stats.state).toBe("closed");
		expect(await cb.execute(async () => "ok")).toBe("ok");
	});

	it("moves to half-open after resetTimeout", async () => {
		const cb = new CircuitBreaker("test", {
			failureThreshold: 1,
			resetTimeoutMs: 5,
		});
		await expect(
			cb.execute(async () => {
				throw new Error("trip");
			}),
		).rejects.toThrow();

		// Wait for reset timeout
		await new Promise((r) => setTimeout(r, 20));

		// Should be half-open now; a success should close it
		const result = await cb.execute(async () => "probe");
		expect(result).toBe("probe");
	});

	it("tracks stats correctly", async () => {
		const cb = new CircuitBreaker("stats-test");
		await cb.execute(async () => "ok");
		expect(cb.stats.totalSuccesses).toBe(1);
		expect(cb.stats.totalCalls).toBe(1);

		await expect(
			cb.execute(async () => {
				throw new Error("x");
			}),
		).rejects.toThrow();
		expect(cb.stats.totalFailures).toBe(1);
		expect(cb.stats.consecutiveFailures).toBe(1);
	});
});

// ─── classifyStepError ───────────────────────────────────────────────────────

describe("classifyStepError", () => {
	it("classifies CircuitOpenError", () => {
		expect(classifyStepError(new CircuitOpenError("msg", "x"))).toBe(
			"circuit-open",
		);
	});

	it("classifies StepTimeoutError", () => {
		expect(classifyStepError(new StepTimeoutError("msg", 100))).toBe("timeout");
	});

	it("classifies rate-limit errors as transient", () => {
		expect(classifyStepError(new Error("429 rate limit"))).toBe("transient");
	});

	it("classifies OOM as fatal", () => {
		expect(classifyStepError(new Error("out of memory"))).toBe("fatal");
	});

	it("classifies validation errors as validation", () => {
		expect(classifyStepError(new Error("invalid input"))).toBe("validation");
	});

	it("classifies unknown errors", () => {
		expect(classifyStepError(new Error("something weird"))).toBe("unknown");
	});
});

// ─── isRetryableErrorClass ───────────────────────────────────────────────────

describe("isRetryableErrorClass", () => {
	it("transient is retryable", () => {
		expect(isRetryableErrorClass("transient")).toBe(true);
	});
	it("timeout is retryable", () => {
		expect(isRetryableErrorClass("timeout")).toBe(true);
	});
	it("unknown is retryable", () => {
		expect(isRetryableErrorClass("unknown")).toBe(true);
	});
	it("validation is not retryable", () => {
		expect(isRetryableErrorClass("validation")).toBe(false);
	});
	it("fatal is not retryable", () => {
		expect(isRetryableErrorClass("fatal")).toBe(false);
	});
	it("circuit-open is not retryable", () => {
		expect(isRetryableErrorClass("circuit-open")).toBe(false);
	});
});
