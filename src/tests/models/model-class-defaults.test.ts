import { describe, expect, it } from "vitest";
import { createDefaultOrchestrationConfig } from "../../config/orchestration-config.js";
import { orderedModelIdsForClass } from "../../models/model-class-defaults.js";

describe("orderedModelIdsForClass", () => {
	it("uses config class ordering for free and cheap tiers", () => {
		const config = createDefaultOrchestrationConfig();
		config.models.free_primary = {
			id: "gpt-5.1-mini",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};
		config.models.free_secondary = {
			id: "gpt-4.1",
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

		expect(orderedModelIdsForClass("free", config)).toEqual([
			"gpt-5.1-mini",
			"gpt-4.1",
		]);
		expect(orderedModelIdsForClass("cheap", config)).toEqual([
			"haiku",
			"gpt-codex-mini",
		]);
	});

	it("prefers adversarial ordering for strong tier", () => {
		const config = createDefaultOrchestrationConfig();
		config.models.strong_primary = {
			id: "sonnet-4.6",
			provider: "anthropic",
			available: true,
			context_window: 200_000,
		};
		config.models.strong_secondary = {
			id: "gpt-5.4",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};

		expect(orderedModelIdsForClass("strong", config)).toEqual([
			"gpt-5.4",
			"sonnet-4.6",
		]);
	});

	it("falls back reviewer tier to synthesis/strong ordering when no reviewer class is configured", () => {
		const config = createDefaultOrchestrationConfig();
		config.models.strong_primary = {
			id: "sonnet-4.6",
			provider: "anthropic",
			available: true,
			context_window: 200_000,
		};
		config.models.strong_secondary = {
			id: "gpt-5.4",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};

		expect(orderedModelIdsForClass("reviewer", config)).toEqual([
			"sonnet-4.6",
			"gpt-5.4",
		]);
	});
});
