import { describe, expect, it, vi } from "vitest";
import {
	AuthorizationError,
	createErrorContext,
	DependencyCycleError,
	formatErrorForDisplay,
	InputSanitizer,
	ModelExecutionError,
	ResourceError,
	SessionDataError,
	SkillExecutionError,
	TimeoutError,
	toDomainError,
	ValidationError,
	withErrorBoundary,
	withRetry,
} from "../../validation/error-handling.js";

const baseCtx = () => createErrorContext("skill-a", "instr-b", "model-c");

describe("error-handling-extra", () => {
	// ---------------------------------------------------------------------------
	// SkillExecutionError – captureStackTrace else branch (line 69)
	// ---------------------------------------------------------------------------
	it("constructs SkillExecutionError when Error.captureStackTrace does not exist", () => {
		const original = Error.captureStackTrace;
		// @ts-expect-error intentional deletion to exercise the else branch
		delete Error.captureStackTrace;
		try {
			const err = new SkillExecutionError(
				"execution",
				"no stack capture",
				baseCtx(),
			);
			expect(err.message).toBe("no stack capture");
			expect(err.category).toBe("execution");
		} finally {
			Error.captureStackTrace = original;
		}
	});

	// ---------------------------------------------------------------------------
	// ValidationError – no field (else branch at line 135)
	// ---------------------------------------------------------------------------
	it("ValidationError without field uses the message as-is", () => {
		const err = new ValidationError("must not be empty", baseCtx());
		expect(err.message).toBe("must not be empty");
	});

	it("ValidationError with field prepends field name", () => {
		const err = new ValidationError("must not be empty", baseCtx(), "myField");
		expect(err.message).toBe("myField: must not be empty");
	});

	// ---------------------------------------------------------------------------
	// DependencyCycleError – empty cyclePath (line 172)
	// ---------------------------------------------------------------------------
	it("DependencyCycleError with empty cyclePath uses generic message", () => {
		const err = new DependencyCycleError([], baseCtx());
		expect(err.message).toBe("Dependency cycle detected");
		expect(err.cyclePath).toEqual([]);
	});

	it("DependencyCycleError with non-empty path includes path in message", () => {
		const err = new DependencyCycleError(["A", "B", "A"], baseCtx());
		expect(err.message).toContain("A -> B -> A");
	});

	// ---------------------------------------------------------------------------
	// toDomainError – early return when already a SkillExecutionError (line 213)
	// ---------------------------------------------------------------------------
	it("toDomainError returns the error unchanged when it is already a SkillExecutionError", () => {
		const original = new SkillExecutionError(
			"validation",
			"pre-existing",
			baseCtx(),
		);
		const result = toDomainError(original, baseCtx());
		expect(result).toBe(original);
	});

	it("toDomainError wraps a plain Error", () => {
		const result = toDomainError(new Error("plain"), baseCtx());
		expect(result).toBeInstanceOf(SkillExecutionError);
		expect(result.message).toBe("plain");
	});

	it("toDomainError wraps a string", () => {
		const result = toDomainError("just a string", baseCtx());
		expect(result).toBeInstanceOf(SkillExecutionError);
	});

	// ---------------------------------------------------------------------------
	// withErrorBoundary – generic Error branch (line 269)
	// ---------------------------------------------------------------------------
	it("withErrorBoundary catches a generic Error and returns standard error with stack", async () => {
		const result = await withErrorBoundary(
			async () => {
				throw new Error("generic failure");
			},
			{ skillId: "s1" },
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.message).toContain("generic failure");
			expect(result.error.details).toBeDefined(); // error.stack
		}
	});

	// ---------------------------------------------------------------------------
	// withErrorBoundary – non-Error thrown (line 275 – details === undefined)
	// ---------------------------------------------------------------------------
	it("withErrorBoundary catches a thrown string and sets details to undefined", async () => {
		const result = await withErrorBoundary(async () => {
			// eslint-disable-next-line no-throw-literal
			throw "string-thrown";
		}, {});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.details).toBeUndefined();
			expect(result.error.message).toContain("string-thrown");
		}
	});

	// ---------------------------------------------------------------------------
	// withErrorBoundary – SkillExecutionError path (happy path with recoverable=false)
	// ---------------------------------------------------------------------------
	it("withErrorBoundary wraps a SkillExecutionError in standard error", async () => {
		const err = new AuthorizationError("delete", baseCtx()); // recoverable=false
		const result = await withErrorBoundary(async () => {
			throw err;
		}, {});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.recoverable).toBe(false);
		}
	});

	// ---------------------------------------------------------------------------
	// withRetry – non-recoverable SkillExecutionError throws immediately (line 313)
	// ---------------------------------------------------------------------------
	it("withRetry rethrows non-recoverable SkillExecutionError immediately", async () => {
		const nonRecoverable = new AuthorizationError("write", baseCtx());
		let callCount = 0;
		await expect(
			withRetry(
				async () => {
					callCount++;
					throw nonRecoverable;
				},
				{},
				3,
				0,
			),
		).rejects.toBe(nonRecoverable);
		// Only one attempt because non-recoverable = throw immediately
		expect(callCount).toBe(1);
	});

	// ---------------------------------------------------------------------------
	// withRetry – final attempt reached (line 319) + lastError is SkillExecutionError (line 348)
	// ---------------------------------------------------------------------------
	it("withRetry enhances lastError context when it is a SkillExecutionError", async () => {
		const recoverable = new SkillExecutionError(
			"execution",
			"flaky",
			baseCtx(),
		);
		await expect(
			withRetry(
				async () => {
					throw recoverable;
				},
				{},
				1,
				0,
			),
		).rejects.toBe(recoverable); // same reference
	});

	// ---------------------------------------------------------------------------
	// withRetry – lastError is NOT a SkillExecutionError (line 355)
	// ---------------------------------------------------------------------------
	it("withRetry wraps a plain Error in a new SkillExecutionError after max retries", async () => {
		await expect(
			withRetry(
				async () => {
					throw new Error("plain error");
				},
				{},
				1,
				0,
			),
		).rejects.toMatchObject({
			message: expect.stringContaining("Operation failed after 1 retries"),
			recoverable: false,
		});
	});

	it("withRetry wraps a thrown string in a new SkillExecutionError after max retries", async () => {
		await expect(
			// eslint-disable-next-line no-throw-literal
			withRetry(
				async () => {
					throw "string failure";
				},
				{},
				1,
				0,
			),
		).rejects.toMatchObject({
			message: expect.stringContaining("string failure"),
		});
	});

	// ---------------------------------------------------------------------------
	// InputSanitizer.sanitizeString – non-string input (line 372)
	// ---------------------------------------------------------------------------
	it("sanitizeString throws ValidationError for non-string input", () => {
		expect(() =>
			InputSanitizer.sanitizeString(42 as unknown as string),
		).toThrow("Input must be a string");
	});

	it("sanitizeString throws for input exceeding maxLength", () => {
		expect(() => InputSanitizer.sanitizeString("a".repeat(11), 10)).toThrow(
			"Input too long",
		);
	});

	it("sanitizeString throws for XSS-style input", () => {
		expect(() =>
			InputSanitizer.sanitizeString("<script>alert(1)</script>"),
		).toThrow("dangerous pattern");
	});

	it("sanitizeString encodes HTML entities", () => {
		const encoded = InputSanitizer.sanitizeString(
			'<div class="x">it\'s</div>'.replace(/<script/gi, ""),
		);
		// Verify encoding of angle brackets and quotes without relying on regex state.
		expect(encoded).toContain("&lt;");
	});

	// ---------------------------------------------------------------------------
	// InputSanitizer.sanitizeFilePath – /tmp/ check (line 398)
	// ---------------------------------------------------------------------------
	it("sanitizeFilePath consistently throws when path starts with /tmp/", () => {
		expect(() => InputSanitizer.sanitizeFilePath("/tmp/a")).toThrow(
			/directory traversal|tmp directory|dangerous pattern/i,
		);
		// Second call must also throw — verifying no regex-state pollution
		expect(() => InputSanitizer.sanitizeFilePath("/tmp/b")).toThrow(
			/directory traversal|tmp directory|dangerous pattern/i,
		);
	});

	// ---------------------------------------------------------------------------
	// InputSanitizer.sanitizeUrl – invalid URL (line 408)
	// ---------------------------------------------------------------------------
	it("sanitizeUrl throws ValidationError for invalid URL format", () => {
		expect(() => InputSanitizer.sanitizeUrl("not-a-valid-url")).toThrow(
			"Invalid URL format",
		);
	});

	it("sanitizeUrl accepts valid http URL", () => {
		const result = InputSanitizer.sanitizeUrl("http://example.com/");
		expect(result).toContain("example.com");
	});

	// ---------------------------------------------------------------------------
	// formatErrorForDisplay – various combinations
	// ---------------------------------------------------------------------------
	it("formatErrorForDisplay includes all context fields when present", () => {
		const std = new SkillExecutionError("execution", "boom", {
			skillId: "sk",
			instructionId: "ins",
			modelId: "mdl",
			timestamp: new Date().toISOString(),
			retryCount: 2,
		}).toStandardError();
		const output = formatErrorForDisplay(std);
		expect(output).toContain("Skill: sk");
		expect(output).toContain("Instruction: ins");
		expect(output).toContain("Model: mdl");
		expect(output).toContain("Retries: 2");
	});

	it("formatErrorForDisplay omits context line when no skillId/instructionId/modelId/retryCount", () => {
		const std = new SkillExecutionError("execution", "bare", {
			timestamp: new Date().toISOString(),
		}).toStandardError();
		const output = formatErrorForDisplay(std);
		expect(output).not.toContain("**Context:**");
	});

	it("formatErrorForDisplay shows suggestedAction when present", () => {
		const std = new SkillExecutionError(
			"execution",
			"oops",
			{ timestamp: new Date().toISOString() },
			true,
			"Try X instead",
		).toStandardError();
		const output = formatErrorForDisplay(std);
		expect(output).toContain("Try X instead");
	});

	it("formatErrorForDisplay marks non-recoverable errors with ❌", () => {
		const err = new AuthorizationError("delete", baseCtx());
		const output = formatErrorForDisplay(err.toStandardError());
		expect(output).toContain("❌");
	});

	it("formatErrorForDisplay marks recoverable errors with 🔄", () => {
		const err = new ResourceError("memory", baseCtx());
		const output = formatErrorForDisplay(err.toStandardError());
		expect(output).toContain("🔄");
	});

	// ---------------------------------------------------------------------------
	// Additional constructors for branch coverage
	// ---------------------------------------------------------------------------
	it("TimeoutError formats message with timeout value", () => {
		const err = new TimeoutError(5000, baseCtx());
		expect(err.message).toContain("5000ms");
		expect(err.category).toBe("timeout");
	});

	it("ModelExecutionError merges modelId into context", () => {
		const err = new ModelExecutionError("model down", baseCtx(), "gpt-4");
		expect(err.context.modelId).toBe("gpt-4");
	});

	it("SessionDataError defaults to non-recoverable", () => {
		const err = new SessionDataError("corrupt session", baseCtx());
		expect(err.recoverable).toBe(false);
	});

	it("SessionDataError can be created as recoverable", () => {
		const err = new SessionDataError("stale session", baseCtx(), true);
		expect(err.recoverable).toBe(true);
	});

	it("SkillExecutionError toStandardError populates all fields", () => {
		const err = new SkillExecutionError(
			"model",
			"test msg",
			baseCtx(),
			true,
			"retry",
		);
		const std = err.toStandardError();
		expect(std.code).toBeTruthy();
		expect(std.recoverable).toBe(true);
		expect(std.suggestedAction).toBe("retry");
	});

	it("createErrorContext trims inputSample to 100 chars", () => {
		const longInput = "x".repeat(200);
		const ctx = createErrorContext(
			undefined,
			undefined,
			undefined,
			undefined,
			longInput,
		);
		expect(ctx.inputSample?.length).toBe(100);
	});

	it("withErrorBoundary returns success when operation succeeds", async () => {
		const result = await withErrorBoundary(async () => 42, {});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe(42);
		}
	});
});
