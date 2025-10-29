import { describe, expect, it } from "vitest";
import {
	GITHUB_COPILOT_MODELS,
	getAvailableModels,
	getModelAlternative,
	getModelInfo,
	isModelDeprecated,
	MODEL_ALIASES,
	RETIRED_MODELS,
} from "../../src/tools/config/models-data.js";

describe("Model Configuration", () => {
	describe("GITHUB_COPILOT_MODELS", () => {
		it("should contain current OpenAI models", () => {
			const modelNames = GITHUB_COPILOT_MODELS.map((m) => m.name);
			expect(modelNames).toContain("GPT-4o");
			expect(modelNames).toContain("GPT-4o mini");
			expect(modelNames).toContain("o1-preview");
			expect(modelNames).toContain("o1-mini");
			expect(modelNames).toContain("o3-mini");
		});

		it("should contain current Anthropic models", () => {
			const modelNames = GITHUB_COPILOT_MODELS.map((m) => m.name);
			expect(modelNames).toContain("Claude 3.5 Sonnet");
			expect(modelNames).toContain("Claude 3.5 Haiku");
		});

		it("should contain current Google models", () => {
			const modelNames = GITHUB_COPILOT_MODELS.map((m) => m.name);
			expect(modelNames).toContain("Gemini 1.5 Pro");
			expect(modelNames).toContain("Gemini 2.0 Flash");
		});

		it("should have valid status for all models", () => {
			GITHUB_COPILOT_MODELS.forEach((model) => {
				expect(["available", "deprecated", "retired"]).toContain(model.status);
			});
		});
	});

	describe("RETIRED_MODELS", () => {
		it("should contain retired models with alternatives", () => {
			const retiredModel = RETIRED_MODELS.find(
				(m) => m.name === "GPT-4.0 Turbo",
			);
			expect(retiredModel).toBeDefined();
			expect(retiredModel?.status).toBe("retired");
			expect(retiredModel?.alternative).toBe("GPT-4o");
		});

		it("should have retirement dates", () => {
			RETIRED_MODELS.forEach((model) => {
				expect(model.retirementDate).toBeDefined();
				expect(model.retirementDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			});
		});
	});

	describe("MODEL_ALIASES", () => {
		it("should map legacy aliases to current models", () => {
			expect(MODEL_ALIASES["gpt-4.1"]).toBe("GPT-4o");
			expect(MODEL_ALIASES["gpt-5"]).toBe("o1-preview");
			expect(MODEL_ALIASES["claude-4"]).toBe("Claude 3.5 Sonnet");
			expect(MODEL_ALIASES["claude-3.7"]).toBe("Claude 3.5 Sonnet");
			expect(MODEL_ALIASES["gemini-2.5"]).toBe("Gemini 2.0 Flash");
			expect(MODEL_ALIASES["o4-mini"]).toBe("o1-mini");
		});

		it("should have normalized names", () => {
			expect(MODEL_ALIASES["gpt-4o"]).toBe("GPT-4o");
			expect(MODEL_ALIASES["claude-3.5-sonnet"]).toBe("Claude 3.5 Sonnet");
		});
	});

	describe("getAvailableModels", () => {
		it("should return only available models", () => {
			const models = getAvailableModels();
			expect(models.length).toBeGreaterThan(0);
			expect(models).toContain("GPT-4o");
			expect(models).toContain("Claude 3.5 Sonnet");
		});

		it("should not include retired models", () => {
			const models = getAvailableModels();
			expect(models).not.toContain("GPT-4.0 Turbo");
			expect(models).not.toContain("GPT-3.5 Turbo");
		});
	});

	describe("getModelInfo", () => {
		it("should return model info for exact name", () => {
			const info = getModelInfo("GPT-4o");
			expect(info).toBeDefined();
			expect(info?.name).toBe("GPT-4o");
			expect(info?.provider).toBe("OpenAI");
		});

		it("should return model info for alias", () => {
			const info = getModelInfo("gpt-4.1");
			expect(info).toBeDefined();
			expect(info?.name).toBe("GPT-4o");
		});

		it("should return undefined for unknown model", () => {
			const info = getModelInfo("unknown-model-xyz");
			expect(info).toBeUndefined();
		});

		it("should find retired models", () => {
			const info = getModelInfo("GPT-4.0 Turbo");
			expect(info).toBeDefined();
			expect(info?.status).toBe("retired");
		});
	});

	describe("isModelDeprecated", () => {
		it("should return true for retired models", () => {
			expect(isModelDeprecated("GPT-4.0 Turbo")).toBe(true);
			expect(isModelDeprecated("GPT-3.5 Turbo")).toBe(true);
		});

		it("should return false for available models", () => {
			expect(isModelDeprecated("GPT-4o")).toBe(false);
			expect(isModelDeprecated("Claude 3.5 Sonnet")).toBe(false);
		});

		it("should work with aliases", () => {
			expect(isModelDeprecated("gpt-4o")).toBe(false);
		});
	});

	describe("getModelAlternative", () => {
		it("should return alternative for retired models", () => {
			expect(getModelAlternative("GPT-4.0 Turbo")).toBe("GPT-4o");
			expect(getModelAlternative("GPT-3.5 Turbo")).toBe("GPT-4o mini");
		});

		it("should return undefined for available models", () => {
			expect(getModelAlternative("GPT-4o")).toBeUndefined();
		});

		it("should return undefined for unknown models", () => {
			expect(getModelAlternative("unknown-model")).toBeUndefined();
		});
	});
});
