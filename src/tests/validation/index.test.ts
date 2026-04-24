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
			enablePhysicsSkills: true,
			traceValidation: true,
		});

		expect(reused).toBe(service);
		expect(service.isValidationEnabled()).toBe(true);
		expect(service.isStrictMode()).toBe(true);
		expect(service.getConfig().enablePhysicsSkills).toBe(true);
		expect(service.getValidationStats()).toEqual({
			mode: "strict",
			enabledFeatures: [
				"physics-skills",
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
			enablePhysicsSkills: true,
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

	it("covers disabled and physics-specific input validation branches", async () => {
		process.env.NODE_ENV = "test";
		const service = ValidationService.initialize();

		service.updateConfig({ validationMode: "disabled" });
		const disabled = await service.validateSkillExecution("req-analysis", {
			request: "hello",
		});

		expect(disabled.success).toBe(true);
		expect(disabled.warnings).toEqual(["Validation disabled"]);
		expect(disabled.sanitized).toBe(false);

		service.updateConfig({
			validationMode: "advisory",
			enablePhysicsSkills: false,
		});
		const physicsBlocked = await service.validateSkillExecution(
			"qm-wavefunction-coverage",
			{ request: "analyze this" },
		);

		expect(physicsBlocked.success).toBe(false);
		expect(physicsBlocked.errors).toContain(
			"Physics skills require physicsAnalysisJustification (≥ 20 non-whitespace chars) explaining why physics-analysis metaphors are appropriate.",
		);
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
});
