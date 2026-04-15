import { describe, expect, it, vi } from "vitest";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";
import {
	AbortError,
	calculateExponentialBackoffDelay,
	retryNetworkCall,
	retrySkillExecution,
	withRetries,
} from "../../infrastructure/retry-utilities.js";

describe("retry-utilities", () => {
	it("retries recoverable failures until success", async () => {
		let attempts = 0;

		const result = await withRetries(
			async () => {
				attempts += 1;
				if (attempts < 3) {
					throw new Error("temporary");
				}
				return "ok";
			},
			{ retries: 3, minTimeout: 0 },
		);

		expect(result).toBe("ok");
		expect(attempts).toBe(3);
	});

	it("preserves abort semantics and shared retry helpers", async () => {
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});

		await expect(
			retryNetworkCall(async () => {
				throw new AbortError("stop");
			}),
		).rejects.toThrow("stop");

		expect(logSpy).not.toHaveBeenCalled();
		logSpy.mockRestore();
	});

	it("logs retry attempts for network and skill wrappers", async () => {
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});

		await expect(
			retryNetworkCall(async () => {
				throw new Error("network down");
			}),
		).rejects.toThrow("network down");
		await expect(
			retrySkillExecution(async () => {
				throw new Error("skill failed");
			}),
		).rejects.toThrow("skill failed");

		expect(logSpy).toHaveBeenCalledWith(
			"warn",
			"Network retry attempt failed",
			expect.objectContaining({ error: "network down" }),
		);
		expect(logSpy).toHaveBeenCalledWith(
			"warn",
			"Skill retry attempt failed",
			expect.objectContaining({ error: "skill failed" }),
		);
		logSpy.mockRestore();
	});

	it("calculates deterministic exponential backoff jitter across random values", () => {
		expect(
			calculateExponentialBackoffDelay(100, 0, {
				jitterMs: 100,
				randomValue: 0,
			}),
		).toBe(100);
		expect(
			calculateExponentialBackoffDelay(100, 1, {
				jitterMs: 100,
				randomValue: 0.5,
			}),
		).toBe(250);
		expect(
			calculateExponentialBackoffDelay(100, 2, {
				jitterMs: 100,
				randomValue: 0.999,
				maxDelayMs: 450,
			}),
		).toBe(450);
	});
});
