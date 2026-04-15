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
});
