import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ORCHESTRATION_CONFIG_RELATIVE_PATH } from "../../config/orchestration-config.js";
import {
	initializeEnvironment,
	validateEnvironment,
} from "../../validation/environment.js";

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
	process.env = { ...ORIGINAL_ENV };
	vi.restoreAllMocks();
});

describe("environment", () => {
	it("returns advisory warnings for missing model config while preserving defaults", () => {
		process.env.VALIDATION_MODE = "advisory";
		process.env.MCP_ORCHESTRATION_PATH = ".does-not-exist.toml";
		process.env.MAX_SESSIONS = "0";
		process.env.MAX_PARALLEL_SKILLS = "-5";

		const result = validateEnvironment();

		expect(result.success).toBe(true);
		expect(
			result.warnings.some((warning) =>
				warning.includes("Orchestration config warning"),
			),
		).toBe(true);
		expect(result.config?.maxSessions).toBe(100);
		expect(result.config?.maxParallelSkills).toBe(5);
	});

	it("returns the built-in default config when running in test mode", () => {
		process.env.NODE_ENV = "test";

		const config = initializeEnvironment();

		expect(config.validationMode).toBe("advisory");
		expect(config.enablePhysicsSkills).toBe(false);
		expect(config.maxSessions).toBe(100);
		expect(config.orchestrationConfigPath).toBe(
			ORCHESTRATION_CONFIG_RELATIVE_PATH,
		);
	});

	it("rejects schema-invalid orchestration configs instead of relying on substring checks", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "environment-validation-"));
		const configPath = join(tempDir, "orchestration.toml");
		process.env.NODE_ENV = "development";
		process.env.VALIDATION_MODE = "strict";
		process.env.MCP_ORCHESTRATION_PATH = configPath;

		try {
			writeFileSync(
				configPath,
				[
					"# [environment]",
					"# [models.fake_model]",
					"[cache]",
					"default_ttl_seconds = 60",
					"[cache.profile_overrides]",
				].join("\n"),
				"utf8",
			);

			const result = validateEnvironment();

			expect(result.success).toBe(false);
			expect(
				result.errors.some((error) =>
					error.includes("Failed to validate orchestration config"),
				),
			).toBe(true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("surfaces production warnings while preserving a valid config", () => {
		process.env.NODE_ENV = "production";
		process.env.VALIDATION_MODE = "disabled";
		process.env.MCP_ORCHESTRATION_PATH = ORCHESTRATION_CONFIG_RELATIVE_PATH;
		process.env.DEBUG_SKILL_EXECUTION = "true";
		process.env.ENABLE_PHYSICS_SKILLS = "true";
		process.env.ALLOW_FILE_OPERATIONS = "true";
		process.env.ENABLE_METRICS = "true";
		process.env.METRICS_PORT = "99999";
		delete process.env.ANTHROPIC_API_KEY;
		delete process.env.OPENAI_API_KEY;

		const result = validateEnvironment();

		expect(result.success).toBe(true);
		expect(result.config).toMatchObject({
			nodeEnv: "production",
			validationMode: "disabled",
			enableMetrics: true,
			metricsPort: 3000,
			enablePhysicsSkills: true,
			debugSkillExecution: true,
			allowFileOperations: true,
		});
		expect(result.warnings).toEqual(
			expect.arrayContaining([
				"No API keys configured - models may not work",
				"DEBUG_SKILL_EXECUTION enabled in production",
				"Physics skills enabled in production - ensure proper authorization",
				"File operations enabled in production - review security implications",
			]),
		);
	});

	it("loads discovered dotenv files before validating the environment", () => {
		const envFileName = ".env.coveragebranch-test";
		const envFilePath = join(process.cwd(), envFileName);
		const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
		try {
			writeFileSync(envFilePath, "B=2\n", "utf8");
			process.env.NODE_ENV = "coveragebranch-test";
			process.env.VALIDATION_MODE = "disabled";
			process.env.MCP_ORCHESTRATION_PATH = ORCHESTRATION_CONFIG_RELATIVE_PATH;

			const result = validateEnvironment();

			expect(result.success).toBe(true);
			expect(debugSpy).toHaveBeenCalledWith(
				"Loading environment from: .env.coveragebranch-test",
			);
		} finally {
			rmSync(envFilePath, { force: true });
		}
	});

	it("logs advisory warnings and returns the validated config", () => {
		process.env.NODE_ENV = "development";
		process.env.VALIDATION_MODE = "advisory";
		process.env.MCP_ORCHESTRATION_PATH = ".missing-config.toml";
		delete process.env.VITEST;

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const consoleWarnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation(() => {});

		const config = initializeEnvironment();

		expect(config).toMatchObject({
			nodeEnv: "development",
			validationMode: "advisory",
			orchestrationConfigPath: ".missing-config.toml",
			maxSessions: 100,
		});
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			expect.stringContaining("Orchestration config warning:"),
		);
		expect(consoleErrorSpy).not.toHaveBeenCalled();
	});

	it("exits in strict mode when initialization sees validation errors", () => {
		process.env.NODE_ENV = "development";
		process.env.VALIDATION_MODE = "strict";
		process.env.MCP_ORCHESTRATION_PATH = ".missing-config.toml";
		delete process.env.VITEST;

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
			code?: string | number | null,
		) => {
			throw new Error(`process.exit:${code ?? "undefined"}`);
		}) as never);

		expect(() => initializeEnvironment()).toThrow("process.exit:1");
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Environment validation failed:"),
		);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Environment validation failed in strict mode. Exiting...",
		);
		expect(exitSpy).toHaveBeenCalledWith(1);
	});
});
