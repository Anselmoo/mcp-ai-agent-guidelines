import { afterEach, describe, expect, it, vi } from "vitest";
import {
	checkEnvironment,
	executeSkillSafely,
	sanitizeInputObject,
	ValidationService,
	validateSkill,
} from "../../validation/index.js";

const ORIGINAL_ENV = { ...process.env };

function resetValidationService() {
	(
		ValidationService as unknown as {
			instance: ValidationService | null;
		}
	).instance = null;
}

afterEach(() => {
	resetValidationService();
	process.env = { ...ORIGINAL_ENV };
	vi.restoreAllMocks();
});

describe("validation index", () => {
	it("requires initialization before accessing the singleton", () => {
		expect(() => ValidationService.getInstance()).toThrow(
			"ValidationService not initialized. Call ValidationService.initialize() first.",
		);
	});

	it("initializes once and exposes runtime config helpers", () => {
		process.env.NODE_ENV = "test";
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const service = ValidationService.initialize();
		const reused = ValidationService.initialize();

		service.updateConfig({
			validationMode: "strict",
			traceValidation: true,
		});

		expect(reused).toBe(service);
		expect(service.isValidationEnabled()).toBe(true);
		expect(service.isStrictMode()).toBe(true);
		expect(service.getValidationStats()).toEqual({
			mode: "strict",
			enabledFeatures: [
				"adaptive-routing",
				"file-operations",
				"network-access",
				"trace-validation",
			],
			limits: {
				maxSessions: 100,
				sessionTtlMinutes: 60,
				maxInstructionDepth: 10,
				maxParallelSkills: 5,
				defaultModelTimeout: 30000,
				maxRetries: 3,
				maxFileSize: 10485760,
			},
		});
		expect(logSpy).toHaveBeenCalledWith("Updated validation config:", {
			validationMode: "strict",
			traceValidation: true,
		});
	});

	it("sanitizes output validation logging", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const service = ValidationService.initialize();

		// Plain string output is now accepted (tools return formatted text)
		const result = service.validateOutput("not-an-object", "skill-a");

		expect(result).toEqual({
			success: true,
		});
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it("handles successful output validation and explicit execution wrappers", async () => {
		process.env.NODE_ENV = "test";
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const service = ValidationService.initialize();

		expect(
			service.validateOutput({ summary: "done", details: [] }, "skill-a"),
		).toEqual({ success: true });
		expect(errorSpy).not.toHaveBeenCalled();

		await expect(
			service.executeWithValidation(async () => "ok", "skill-a", {}, false),
		).resolves.toEqual({ success: true, data: "ok" });

		const failed = await service.executeWithValidation(
			async () => {
				throw new Error("boom");
			},
			"skill-a",
			{},
			false,
		);

		expect(failed.success).toBe(false);
		if (!failed.success) {
			expect(failed.error.message).toContain("Unexpected error: boom");
		}
	});

	it("covers the disabled input validation branch", async () => {
		process.env.NODE_ENV = "test";
		const service = ValidationService.initialize();

		service.updateConfig({ validationMode: "disabled" });
		const disabled = await service.validateSkillExecution("req-analysis", {
			request: "hello",
		});

		expect(disabled.success).toBe(true);
		expect(disabled.warnings).toEqual(["Validation disabled"]);
		expect(disabled.sanitized).toBe(false);
	});

	it("wraps validateSkill, executeSkillSafely, and environment status checks", async () => {
		process.env.NODE_ENV = "test";
		process.env.VALIDATION_MODE = "advisory";
		process.env.MCP_ORCHESTRATION_PATH = ".missing-orchestration.toml";
		const service = ValidationService.initialize();

		const validated = await validateSkill("req-analysis", { request: "hello" });
		expect(validated.success).toBe(true);

		const success = await executeSkillSafely(
			"req-analysis",
			{ request: "ship it" },
			async (input) => input.request.toUpperCase(),
		);
		expect(success).toEqual({ success: true, data: "SHIP IT" });

		const failure = await executeSkillSafely(
			"req-analysis",
			{ request: "" },
			async () => "never",
		);
		expect(failure.success).toBe(false);
		if (!failure.success) {
			expect(failure.error.message).toContain(
				"Input must contain a 'request' field with a non-empty string",
			);
			expect(failure.error.suggestedAction).toContain("Fix the input");
			expect(service.formatError(failure.error)).toContain(
				"Input must contain a 'request' field with a non-empty string",
			);
		}

		expect(checkEnvironment()).toEqual({
			valid: true,
			errors: [],
			warnings: [
				"Orchestration config warning: Orchestration configuration not found: .missing-orchestration.toml",
			],
		});
	});

	it("re-exports input sanitization helpers", async () => {
		await expect(
			sanitizeInputObject(
				{ request: "<review>" },
				{
					maxInputLength: 100,
					allowFileOperations: true,
					allowNetworkAccess: true,
				},
			),
		).resolves.toEqual({ request: "&lt;review&gt;" });
	});

	it("returns a defensive copy of the configuration via getConfig", () => {
		process.env.NODE_ENV = "test";
		const service = ValidationService.initialize();

		const config = service.getConfig();
		expect(config).toEqual(service.getConfig());
		expect(config).not.toBe((service as unknown as { config: unknown }).config);
	});

	it("throws when validateSkillExecution runs on a not-yet-initialized instance", async () => {
		process.env.NODE_ENV = "test";
		const service = ValidationService.initialize();

		// Force the internal initialized flag back to false to exercise the
		// defensive guard inside validateSkillExecution (mirrors how other
		// suites poke the singleton's private state).
		(service as unknown as { initialized: boolean }).initialized = false;

		try {
			await expect(
				service.validateSkillExecution("req-analysis", { request: "hello" }),
			).rejects.toThrow("ValidationService not properly initialized");
		} finally {
			(service as unknown as { initialized: boolean }).initialized = true;
		}
	});

	it("builds error context without a request hint when input has no request field", async () => {
		process.env.NODE_ENV = "test";
		const service = ValidationService.initialize();

		// Non-object input: the `typeof input === "object" && ...` chain must
		// short-circuit to `undefined` for the requestSnippet argument.
		const stringInputResult = await service.validateSkillExecution(
			"req-analysis",
			"just a plain string",
		);
		expect(stringInputResult.success).toBe(false);

		// Object input missing the `request` key exercises the same false branch
		// via the `"request" in input` check.
		const missingRequestResult = await service.validateSkillExecution(
			"req-analysis",
			{ notRequest: "hello" },
		);
		expect(missingRequestResult.success).toBe(false);
	});

	it("blocks disallowed governance skills via the critical skill guard", async () => {
		process.env.NODE_ENV = "test";
		delete process.env.ALLOW_GOVERNANCE_SKILLS;
		const service = ValidationService.initialize();

		const blocked = await service.validateSkillExecution("gov-policy-check", {
			request: "run the governance skill",
		});

		expect(blocked.success).toBe(false);
		if (!blocked.success) {
			expect(blocked.errors).toEqual([
				"Governance skills require explicit authorization. Set ALLOW_GOVERNANCE_SKILLS=true.",
			]);
		}
	});

	it("reports an output validation failure through validateOutput", () => {
		process.env.NODE_ENV = "test";
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const service = ValidationService.initialize();

		const result = service.validateOutput("   ", "skill-a");

		expect(result.success).toBe(false);
		expect(result.error).toBe("Skill output must not be empty");
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Output validation failed for skill-a"),
		);
	});

	it("includes metrics and debug-execution in enabled features when both are turned on", () => {
		process.env.NODE_ENV = "test";
		const service = ValidationService.initialize();

		// `initializeEnvironment()` always returns the test-mode default config
		// (enableMetrics: false) while VITEST=true, and `enableMetrics` is not
		// part of the `updateConfig` allow-list, so the only way to exercise the
		// `enableMetrics && "metrics"` true branch is to poke the private config
		// directly, mirroring how other tests in this file manipulate internals.
		(
			service as unknown as { config: { enableMetrics: boolean } }
		).config.enableMetrics = true;
		service.updateConfig({ debugSkillExecution: true });

		expect(service.getValidationStats().enabledFeatures).toEqual(
			expect.arrayContaining(["metrics", "debug-execution"]),
		);
	});

	// Note on remaining uncovered branches (not exercised above):
	// - `getValidationLogMessage`'s `getWorkflowErrorMessage(error)` fallback
	//   (index.ts ~line 74) is unreachable: its only caller, `validateOutput`,
	//   always passes a `validateSkillOutput` error object with a string
	//   `message`, so the guarding `if` is always true.
	// - `guardResult.reason || "Skill execution not allowed"` (index.ts ~line
	//   178) is unreachable: every `criticalSkillGuard` `allowed: false` return
	//   site always sets a non-empty `reason` string.
	// - `validation.context || createErrorContext(skillId)` in
	//   `executeSkillSafely` (index.ts ~line 357) is unreachable: every
	//   `validateSkillExecution` return path (disabled mode, guard-blocked,
	//   and the underlying `validateSkillInput` failures) always populates
	//   `context`. Exercising any of these three would require mocking
	//   `criticalSkillGuard`/`validateSkillInput` internals rather than testing
	//   through the public API, which is out of step with this file's
	//   integration-style approach.
});
