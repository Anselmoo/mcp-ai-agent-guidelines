import { describe, expect, it, vi } from "vitest";
import {
	AuthorizationError,
	createErrorContext,
	formatErrorForDisplay,
	InputSanitizer,
	SkillExecutionError,
	ValidationError,
	withErrorBoundary,
	withRetry,
} from "../../validation/error-handling.js";

describe("error-handling", () => {
	it("normalizes known execution errors into displayable standard errors", async () => {
		const context = createErrorContext("debug-root-cause", "review", "gpt-5.4");
		const result = await withErrorBoundary(async () => {
			throw new ValidationError("Missing request", context, "request");
		}, context);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toContain("VALIDATION_");
			expect(formatErrorForDisplay(result.error)).toContain(
				"request: Missing request",
			);
		}
	});

	it("sanitizes safe input and rejects dangerous file paths", () => {
		expect(InputSanitizer.sanitizeString("<tag>")).toBe("&lt;tag&gt;");
		expect(() => InputSanitizer.sanitizeFilePath("../secret.txt")).toThrow(
			"dangerous pattern",
		);
	});

	it("retries recoverable errors with deterministic jittered backoff", async () => {
		vi.useFakeTimers();
		const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.25);
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const context = createErrorContext("debug-root-cause");
		let attempts = 0;

		try {
			const retriedOperation = withRetry(
				async () => {
					attempts += 1;
					if (attempts === 1) {
						throw new Error("temporary");
					}
					return "ok";
				},
				context,
				2,
				100,
			);

			await vi.advanceTimersByTimeAsync(349);
			expect(attempts).toBe(1);

			await vi.advanceTimersByTimeAsync(1);
			await expect(retriedOperation).resolves.toBe("ok");
			expect(attempts).toBe(2);
			expect(warnSpy).toHaveBeenCalledWith(
				"Retry attempt 1/2 after 350ms delay",
			);
		} finally {
			randomSpy.mockRestore();
			warnSpy.mockRestore();
			vi.useRealTimers();
		}
	});

	it("succeeds on the Nth try and counts maxRetries as total attempts", async () => {
		vi.useFakeTimers();
		const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		let attempts = 0;

		try {
			const execution = withRetry(
				async () => {
					attempts += 1;
					if (attempts < 3) {
						throw new Error(`temporary-${attempts}`);
					}
					return "ok";
				},
				createErrorContext("debug-root-cause"),
				3,
				10,
			);
			await vi.runAllTimersAsync();

			await expect(execution).resolves.toBe("ok");
			expect(attempts).toBe(3);
			expect(warnSpy).toHaveBeenCalledTimes(2);
		} finally {
			randomSpy.mockRestore();
			warnSpy.mockRestore();
			vi.useRealTimers();
		}
	});

	it("does not retry non-recoverable authorization errors", async () => {
		const error = new AuthorizationError(
			"delete workspace",
			createErrorContext("gov-policy-validation"),
		);
		let attempts = 0;

		await expect(
			withRetry(
				async () => {
					attempts += 1;
					throw error;
				},
				error.context,
				3,
				10,
			),
		).rejects.toBe(error);
		expect(attempts).toBe(1);
	});

	it("does not retry non-recoverable skill execution errors", async () => {
		const error = new SkillExecutionError(
			"execution",
			"do not retry",
			createErrorContext("debug-root-cause"),
			false,
		);
		let attempts = 0;

		await expect(
			withRetry(
				async () => {
					attempts += 1;
					throw error;
				},
				error.context,
				4,
				10,
			),
		).rejects.toBe(error);
		expect(attempts).toBe(1);
	});

	it("wraps exhausted retries with recovery metadata", async () => {
		vi.useFakeTimers();
		const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		try {
			const execution = withRetry(
				async () => {
					throw new Error("still broken");
				},
				createErrorContext("debug-root-cause"),
				2,
				50,
			);
			const assertion = expect(execution).rejects.toMatchObject({
				message: "Operation failed after 2 retries: still broken",
				category: "execution",
				recoverable: false,
				context: {
					retryCount: 2,
					recoveryAction: "max_retries_exceeded",
				},
			});
			await vi.runAllTimersAsync();

			await assertion;
		} finally {
			randomSpy.mockRestore();
			warnSpy.mockRestore();
			vi.useRealTimers();
		}
	});
});
