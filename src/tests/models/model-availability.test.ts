import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createDefaultOrchestrationConfig } from "../../config/orchestration-config.js";
import * as orchestrationConfigService from "../../config/orchestration-config-service.js";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";
import { ModelAvailabilityService } from "../../models/model-availability.js";

describe("model-availability", () => {
	it("derives availability and same-class fallbacks from orchestration config", async () => {
		const workspaceRoot = mkdtempSync(join(tmpdir(), "model-availability-"));
		const config = createDefaultOrchestrationConfig();
		config.models.strong_primary = {
			id: "sonnet-4.6",
			provider: "anthropic",
			available: false,
			context_window: 200_000,
		};
		config.models.strong_primary.reason = "quota exceeded";
		config.models.strong_secondary = {
			id: "gpt-5.4",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};
		config.models.cheap_primary = {
			id: "haiku",
			provider: "anthropic",
			available: true,
			context_window: 200_000,
		};
		config.models.cheap_secondary = {
			id: "gpt-codex-mini",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};
		await orchestrationConfigService.saveOrchestrationConfig(config, {
			workspaceRoot,
		});
		const service = new ModelAvailabilityService();

		await service.loadConfig(workspaceRoot);
		const model = service.checkAvailability("sonnet-4.6");

		expect(service.isConfigLoaded()).toBe(true);
		expect(model).toMatchObject({
			available: false,
			reason: "quota exceeded",
			fallbackModel: "gpt-5.4",
		});
		expect(service.getAvailableModelsForClass("strong")).toEqual(["gpt-5.4"]);
		expect(service.getAvailableModelsForClass("cheap")).toEqual([
			"haiku",
			"gpt-codex-mini",
		]);
	});

	it("logs and falls back to derived defaults when workspace loading fails", async () => {
		const service = new ModelAvailabilityService();
		const loadSpy = vi
			.spyOn(orchestrationConfigService, "loadOrchestrationConfigForWorkspace")
			.mockRejectedValue(new Error("broken workspace config"));
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});

		try {
			await service.loadConfig("/tmp/fake-workspace");

			expect(service.isConfigLoaded()).toBe(false);
			expect(logSpy).toHaveBeenCalledWith(
				"warn",
				"Orchestration config unavailable; using derived availability defaults",
				expect.objectContaining({
					workspaceRoot: "/tmp/fake-workspace",
					error: "broken workspace config",
				}),
			);
		} finally {
			loadSpy.mockRestore();
			logSpy.mockRestore();
		}
	});

	it("skips config loading in the test environment when no workspaceRoot is given", async () => {
		const service = new ModelAvailabilityService();

		await service.loadConfig();

		expect(service.isConfigLoaded()).toBe(false);
	});

	it("does not skip loading when neither NODE_ENV=test nor VITEST=true is set", async () => {
		const workspaceRoot = mkdtempSync(
			join(tmpdir(), "model-availability-non-test-env-"),
		);
		const config = createDefaultOrchestrationConfig();
		await orchestrationConfigService.saveOrchestrationConfig(config, {
			workspaceRoot,
		});
		const originalNodeEnv = process.env.NODE_ENV;
		const originalVitest = process.env.VITEST;
		// Simulate a non-test runtime so the "skip loading" short-circuit in
		// loadConfig evaluates both `||` operands to false.
		process.env.NODE_ENV = "production";
		process.env.VITEST = "false";

		try {
			const service = new ModelAvailabilityService();
			await service.loadConfig(workspaceRoot);

			expect(service.isConfigLoaded()).toBe(true);
		} finally {
			process.env.NODE_ENV = originalNodeEnv;
			process.env.VITEST = originalVitest;
		}
	});

	it("treats an undeclared model as available in advisory mode", async () => {
		const workspaceRoot = mkdtempSync(
			join(tmpdir(), "model-availability-advisory-"),
		);
		const config = createDefaultOrchestrationConfig();
		config.environment.strict_mode = false;
		await orchestrationConfigService.saveOrchestrationConfig(config, {
			workspaceRoot,
		});
		const service = new ModelAvailabilityService();

		await service.loadConfig(workspaceRoot);

		expect(service.getMode()).toBe("advisory");
		expect(service.checkAvailability("totally-unknown-model")).toEqual({
			available: true,
			reason: "Not explicitly configured (advisory mode)",
		});
	});

	it("treats an undeclared model as unavailable in configured (strict) mode", async () => {
		const workspaceRoot = mkdtempSync(
			join(tmpdir(), "model-availability-strict-"),
		);
		const config = createDefaultOrchestrationConfig();
		config.environment.strict_mode = true;
		await orchestrationConfigService.saveOrchestrationConfig(config, {
			workspaceRoot,
		});
		const service = new ModelAvailabilityService();

		await service.loadConfig(workspaceRoot);

		expect(service.getMode()).toBe("configured");
		expect(service.checkAvailability("totally-unknown-model")).toEqual({
			available: false,
			reason: "Model not declared in configuration",
		});
	});

	it("falls back to a default reason when an unavailable declaration omits one", async () => {
		const workspaceRoot = mkdtempSync(
			join(tmpdir(), "model-availability-no-reason-"),
		);
		const config = createDefaultOrchestrationConfig();
		config.models.strong_primary = {
			id: "sonnet-4.6",
			provider: "anthropic",
			available: false,
			context_window: 200_000,
		};
		// Deliberately omit `reason` so the `??` fallback in checkAvailability is
		// exercised (model.reason is undefined when available === false).
		config.models.strong_primary.reason = undefined;
		await orchestrationConfigService.saveOrchestrationConfig(config, {
			workspaceRoot,
		});
		const service = new ModelAvailabilityService();

		await service.loadConfig(workspaceRoot);
		const result = service.checkAvailability("sonnet-4.6");

		expect(result.available).toBe(false);
		expect(result.reason).toBe("Marked as unavailable");
	});

	it("returns getAllDeclarations as a snapshot copy of the loaded model map", async () => {
		const workspaceRoot = mkdtempSync(
			join(tmpdir(), "model-availability-declarations-"),
		);
		const config = createDefaultOrchestrationConfig();
		config.models.cheap_primary = {
			id: "haiku",
			provider: "anthropic",
			available: true,
			context_window: 200_000,
		};
		await orchestrationConfigService.saveOrchestrationConfig(config, {
			workspaceRoot,
		});
		const service = new ModelAvailabilityService();

		await service.loadConfig(workspaceRoot);
		const declarations = service.getAllDeclarations();

		expect(declarations).toEqual(service.getAllDeclarations());
		expect(declarations).not.toBe(
			(service as unknown as { config: { models: unknown } }).config.models,
		);
		expect(Object.keys(declarations).length).toBeGreaterThan(0);
	});

	it("skips a declared-but-unavailable candidate while searching for a fallback", async () => {
		const workspaceRoot = mkdtempSync(
			join(tmpdir(), "model-availability-skip-unavailable-"),
		);
		const config = createDefaultOrchestrationConfig();
		config.models.strong_primary = {
			id: "sonnet-4.6",
			provider: "anthropic",
			available: false,
			context_window: 200_000,
		};
		config.models.strong_primary.reason = "quota exceeded";
		// A second same-class candidate that is also explicitly unavailable, so
		// findFallbackModel must skip past it (declaration.available === false)
		// before finding the next candidate.
		config.models.strong_secondary = {
			id: "gpt-5.4",
			provider: "openai",
			available: false,
			context_window: 128_000,
		};
		config.models.strong_secondary.reason = "rate limited";
		config.models.strong_tertiary = {
			id: "gemini-3-pro",
			provider: "google",
			available: true,
			context_window: 1_000_000,
		};
		await orchestrationConfigService.saveOrchestrationConfig(config, {
			workspaceRoot,
		});
		const service = new ModelAvailabilityService();

		await service.loadConfig(workspaceRoot);
		const result = service.checkAvailability("sonnet-4.6");

		expect(result).toEqual({
			available: false,
			reason: "quota exceeded",
			fallbackModel: "gemini-3-pro",
		});
	});

	it("returns undefined from findFallbackModel when no class match exists", () => {
		const service = new ModelAvailabilityService();
		(
			service as unknown as {
				config: {
					advisory: boolean;
					models: Record<string, { available: boolean; reason?: string }>;
					classes?: Record<string, string[]>;
				};
			}
		).config = {
			advisory: false,
			models: {
				"orphan-model": { available: false, reason: "no class assigned" },
			},
			classes: { free: [], cheap: [], strong: [], reviewer: [] },
		};

		const result = service.checkAvailability("orphan-model");

		expect(result).toEqual({
			available: false,
			reason: "no class assigned",
			fallbackModel: undefined,
		});
	});

	it("treats a missing classes map and a missing class array as empty (?? fallbacks)", () => {
		const service = new ModelAvailabilityService();
		(
			service as unknown as {
				config: {
					advisory: boolean;
					models: Record<string, { available: boolean; reason?: string }>;
					classes?: Record<string, string[]>;
				};
			}
		).config = {
			advisory: false,
			models: {
				"unclassed-model": { available: false, reason: "no classes map" },
			},
			classes: undefined,
		};

		const result = service.checkAvailability("unclassed-model");
		expect(result).toEqual({
			available: false,
			reason: "no classes map",
			fallbackModel: undefined,
		});

		expect(service.getAvailableModelsForClass("free")).toEqual([]);
	});
});
