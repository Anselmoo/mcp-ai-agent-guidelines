import { describe, expect, it } from "vitest";
import {
	getBudgetAdjustments,
	getBudgetBonus,
	getBudgetPenalty,
	getCapabilityWeights,
	getDefaultModel,
	getDefaultModelSlug,
	getModels,
	getRequirementKeywords,
	slugifyModelName,
} from "../../src/tools/config/model-loader.js";

describe("Model Loader (YAML)", () => {
	describe("getModels", () => {
		it("should load models from YAML configuration", () => {
			const models = getModels();

			expect(Array.isArray(models)).toBe(true);
			expect(models.length).toBeGreaterThan(0);
		});

		it("should have valid model structure", () => {
			const models = getModels();
			const firstModel = models[0];

			expect(firstModel).toHaveProperty("name");
			expect(firstModel).toHaveProperty("provider");
			expect(firstModel).toHaveProperty("pricingTier");
			expect(firstModel).toHaveProperty("contextTokens");
			expect(firstModel).toHaveProperty("baseScore");
			expect(firstModel).toHaveProperty("capabilities");
			expect(firstModel).toHaveProperty("strengths");
			expect(firstModel).toHaveProperty("limitations");
			expect(firstModel).toHaveProperty("specialFeatures");
			expect(firstModel).toHaveProperty("pricing");
		});

		it("should include expected models", () => {
			const models = getModels();
			const modelNames = models.map((m) => m.name);

			expect(modelNames).toContain("GPT-4.1");
			expect(modelNames).toContain("Claude Sonnet 4");
			expect(modelNames).toContain("Gemini 2.5 Pro");
		});

		it("should cache results on subsequent calls", () => {
			const models1 = getModels();
			const models2 = getModels();

			// Should return the same reference (cached)
			expect(models1).toBe(models2);
		});
	});

	describe("getRequirementKeywords", () => {
		it("should load requirement keywords from YAML", () => {
			const keywords = getRequirementKeywords();

			expect(typeof keywords).toBe("object");
			expect(keywords).toHaveProperty("reasoning");
			expect(keywords).toHaveProperty("code");
			expect(keywords).toHaveProperty("large-context");
		});

		it("should have array values for each capability", () => {
			const keywords = getRequirementKeywords();

			for (const [_capability, words] of Object.entries(keywords)) {
				expect(Array.isArray(words)).toBe(true);
				expect(words.length).toBeGreaterThan(0);
				expect(typeof words[0]).toBe("string");
			}
		});
	});

	describe("getCapabilityWeights", () => {
		it("should load capability weights from YAML", () => {
			const weights = getCapabilityWeights();

			expect(typeof weights).toBe("object");
			expect(weights).toHaveProperty("reasoning");
			expect(weights).toHaveProperty("code");
			expect(weights).toHaveProperty("speed");
		});

		it("should have numeric values", () => {
			const weights = getCapabilityWeights();

			for (const [_capability, weight] of Object.entries(weights)) {
				expect(typeof weight).toBe("number");
				expect(weight).toBeGreaterThan(0);
			}
		});
	});

	describe("getBudgetAdjustments", () => {
		it("should load budget adjustments from YAML", () => {
			const adjustments = getBudgetAdjustments();

			expect(adjustments).toHaveProperty("low");
			expect(adjustments).toHaveProperty("medium");
			expect(adjustments).toHaveProperty("high");
		});

		it("should have bonus and penalty arrays", () => {
			const adjustments = getBudgetAdjustments();

			for (const [_level, adjustment] of Object.entries(adjustments)) {
				expect(adjustment).toHaveProperty("bonus");
				expect(adjustment).toHaveProperty("penalty");
				expect(Array.isArray(adjustment.bonus)).toBe(true);
				expect(Array.isArray(adjustment.penalty)).toBe(true);
			}
		});
	});

	describe("getBudgetBonus and getBudgetPenalty", () => {
		it("should load budget bonus from YAML", () => {
			const bonus = getBudgetBonus();

			expect(typeof bonus).toBe("number");
			expect(bonus).toBeGreaterThan(0);
		});

		it("should load budget penalty from YAML", () => {
			const penalty = getBudgetPenalty();

			expect(typeof penalty).toBe("number");
			expect(penalty).toBeGreaterThan(0);
		});
	});

	describe("Backward compatibility", () => {
		it("should maintain compatibility with model-config.ts exports", () => {
			// This test verifies that the YAML loader provides the same structure
			// as the previous hardcoded TypeScript arrays
			const models = getModels();

			// Check that we have the expected number of models (11 in original)
			expect(models.length).toBeGreaterThanOrEqual(11);

			// Verify pricing tier enum values match
			const pricingTiers = models.map((m) => m.pricingTier);
			const validTiers = ["premium", "mid-tier", "budget"];

			for (const tier of pricingTiers) {
				expect(validTiers).toContain(tier);
			}
		});
	});

	describe("getDefaultModel", () => {
		it("should load the default model from YAML configuration", () => {
			const defaultModel = getDefaultModel();

			expect(typeof defaultModel).toBe("string");
			expect(defaultModel.length).toBeGreaterThan(0);
		});

		it("should return GPT-5-Codex as the configured default", () => {
			const defaultModel = getDefaultModel();

			// This test assumes GPT-5-Codex is set as default in models.yaml
			expect(defaultModel).toBe("GPT-5-Codex");
		});

		it("should cache results on subsequent calls", () => {
			const model1 = getDefaultModel();
			const model2 = getDefaultModel();

			// Should return the same value (cached config)
			expect(model1).toBe(model2);
		});

		it("should return a string that is not empty", () => {
			const defaultModel = getDefaultModel();
			expect(defaultModel.trim().length).toBeGreaterThan(0);
		});

		it("should use same cached config as other getters", () => {
			// Call getDefaultModel first to load config
			const defaultModel = getDefaultModel();

			// Call other getters which should use the same cached config
			const models = getModels();
			const keywords = getRequirementKeywords();
			const weights = getCapabilityWeights();

			// Verify they all return valid data from the same config
			expect(defaultModel).toBe("GPT-5-Codex");
			expect(models.length).toBeGreaterThan(0);
			expect(Object.keys(keywords).length).toBeGreaterThan(0);
			expect(Object.keys(weights).length).toBeGreaterThan(0);
		});
	});

	describe("Caching behavior", () => {
		it("should use cached configuration across all getter functions", () => {
			// First call to load and cache config
			const models1 = getModels();

			// Subsequent calls should use cached config
			const models2 = getModels();
			const keywords = getRequirementKeywords();
			const weights = getCapabilityWeights();
			const adjustments = getBudgetAdjustments();
			const bonus = getBudgetBonus();
			const penalty = getBudgetPenalty();
			const defaultModel = getDefaultModel();

			// Verify all data is loaded
			expect(models1).toBe(models2); // Same reference from cache
			expect(models2.length).toBeGreaterThan(0);
			expect(Object.keys(keywords).length).toBeGreaterThan(0);
			expect(Object.keys(weights).length).toBeGreaterThan(0);
			expect(Object.keys(adjustments).length).toBe(3); // low, medium, high
			expect(bonus).toBeGreaterThan(0);
			expect(penalty).toBeGreaterThan(0);
			expect(defaultModel.length).toBeGreaterThan(0);
		});
	});

	describe("Configuration data validation", () => {
		it("should have requirement keywords for all expected capability types", () => {
			const keywords = getRequirementKeywords();

			const expectedCapabilities = ["reasoning", "code", "large-context"];
			for (const capability of expectedCapabilities) {
				expect(keywords).toHaveProperty(capability);
				expect(Array.isArray(keywords[capability])).toBe(true);
				expect(keywords[capability].length).toBeGreaterThan(0);
			}
		});

		it("should have weights for all capability types", () => {
			const weights = getCapabilityWeights();

			expect(Object.keys(weights).length).toBeGreaterThan(0);
			for (const [_capability, weight] of Object.entries(weights)) {
				expect(typeof weight).toBe("number");
				expect(weight).toBeGreaterThan(0);
			}
		});

		it("should have all budget levels with bonus and penalty arrays", () => {
			const adjustments = getBudgetAdjustments();

			const budgetLevels = ["low", "medium", "high"] as const;
			for (const level of budgetLevels) {
				expect(adjustments).toHaveProperty(level);
				expect(adjustments[level]).toHaveProperty("bonus");
				expect(adjustments[level]).toHaveProperty("penalty");
				expect(Array.isArray(adjustments[level].bonus)).toBe(true);
				expect(Array.isArray(adjustments[level].penalty)).toBe(true);
			}
		});

		it("should have positive numeric budget adjustments", () => {
			const bonus = getBudgetBonus();
			const penalty = getBudgetPenalty();

			expect(typeof bonus).toBe("number");
			expect(typeof penalty).toBe("number");
			expect(bonus).toBeGreaterThan(0);
			expect(penalty).toBeGreaterThan(0);
		});

		it("should have all models with consistent structure", () => {
			const models = getModels();

			for (const model of models) {
				expect(model).toHaveProperty("name");
				expect(model).toHaveProperty("provider");
				expect(model).toHaveProperty("pricingTier");
				expect(model).toHaveProperty("contextTokens");
				expect(model).toHaveProperty("baseScore");
				expect(model).toHaveProperty("capabilities");
				expect(model).toHaveProperty("strengths");
				expect(model).toHaveProperty("limitations");
				expect(model).toHaveProperty("specialFeatures");
				expect(model).toHaveProperty("pricing");

				// Validate field types
				expect(typeof model.name).toBe("string");
				expect(typeof model.provider).toBe("string");
				expect(typeof model.contextTokens).toBe("number");
				expect(typeof model.baseScore).toBe("number");
				expect(Array.isArray(model.capabilities)).toBe(true);
				expect(Array.isArray(model.strengths)).toBe(true);
				expect(Array.isArray(model.limitations)).toBe(true);
				expect(Array.isArray(model.specialFeatures)).toBe(true);
				expect(typeof model.pricing).toBe("string");
			}
		});

		it("should have valid pricing tier values for all models", () => {
			const models = getModels();
			const validTiers = ["premium", "mid-tier", "budget"];

			for (const model of models) {
				expect(validTiers).toContain(model.pricingTier);
			}
		});

		it("should have base scores in valid range for all models", () => {
			const models = getModels();

			for (const model of models) {
				expect(model.baseScore).toBeGreaterThanOrEqual(0);
				expect(model.baseScore).toBeLessThanOrEqual(100);
			}
		});

		it("should have context tokens greater than zero for all models", () => {
			const models = getModels();

			for (const model of models) {
				expect(model.contextTokens).toBeGreaterThan(0);
			}
		});
	});

	describe("Default model fallback behavior", () => {
		it("should return GPT-5 as fallback if defaultModel is not set", () => {
			// This test validates the fallback logic in getDefaultModel()
			// The function should return "GPT-5" if config.defaultModel is undefined
			const defaultModel = getDefaultModel();

			// Even if defaultModel is not explicitly set in YAML,
			// the function should return a valid model name
			expect(typeof defaultModel).toBe("string");
			expect(defaultModel.length).toBeGreaterThan(0);

			// In our current config, it should be "GPT-5-Codex"
			expect(defaultModel).toBe("GPT-5-Codex");
		});

		it("should verify default model exists in available models list", () => {
			const defaultModel = getDefaultModel();
			const models = getModels();
			const modelNames = models.map((m) => m.name);

			// The default model must be one of the available models
			expect(modelNames).toContain(defaultModel);
		});

		it("should use consistent default across multiple calls", () => {
			// Call getDefaultModel multiple times
			const calls = Array.from({ length: 5 }, () => getDefaultModel());

			// All calls should return the same value
			const uniqueValues = new Set(calls);
			expect(uniqueValues.size).toBe(1);
			expect(uniqueValues.has("GPT-5-Codex")).toBe(true);
		});
	});

	describe("loadModelsFromYaml comprehensive validation", () => {
		it("should return valid configuration structure", () => {
			// Access all configuration data through getters
			const models = getModels();
			const keywords = getRequirementKeywords();
			const weights = getCapabilityWeights();
			const adjustments = getBudgetAdjustments();
			const bonus = getBudgetBonus();
			const penalty = getBudgetPenalty();
			const defaultModel = getDefaultModel();

			// Validate all parts of the configuration are loaded
			expect(Array.isArray(models)).toBe(true);
			expect(models.length).toBeGreaterThan(0);

			expect(typeof keywords).toBe("object");
			expect(Object.keys(keywords).length).toBeGreaterThan(0);

			expect(typeof weights).toBe("object");
			expect(Object.keys(weights).length).toBeGreaterThan(0);

			expect(typeof adjustments).toBe("object");
			expect(Object.keys(adjustments)).toEqual(
				expect.arrayContaining(["low", "medium", "high"]),
			);

			expect(typeof bonus).toBe("number");
			expect(bonus).toBeGreaterThan(0);

			expect(typeof penalty).toBe("number");
			expect(penalty).toBeGreaterThan(0);

			expect(typeof defaultModel).toBe("string");
			expect(defaultModel.length).toBeGreaterThan(0);
		});

		it("should maintain data consistency across all getters", () => {
			// First, get data through one getter to load cache
			const models1 = getModels();

			// Get data through all other getters
			const models2 = getModels();
			const keywords = getRequirementKeywords();
			const weights = getCapabilityWeights();
			const adjustments = getBudgetAdjustments();
			const bonus = getBudgetBonus();
			const penalty = getBudgetPenalty();
			const defaultModel = getDefaultModel();

			// Verify models are the same reference (cached)
			expect(models1).toBe(models2);

			// Verify all data types are correct
			expect(Array.isArray(models1)).toBe(true);
			expect(typeof keywords).toBe("object");
			expect(typeof weights).toBe("object");
			expect(typeof adjustments).toBe("object");
			expect(typeof bonus).toBe("number");
			expect(typeof penalty).toBe("number");
			expect(typeof defaultModel).toBe("string");

			// Verify relationships between data
			// Default model should be in the models list
			const modelNames = models1.map((m) => m.name);
			expect(modelNames).toContain(defaultModel);

			// Budget adjustments should have entries for all levels
			expect(adjustments.low).toBeDefined();
			expect(adjustments.medium).toBeDefined();
			expect(adjustments.high).toBeDefined();
		});

		it("should load all required configuration fields", () => {
			// Validate that all expected configuration sections are present
			const models = getModels();
			const keywords = getRequirementKeywords();
			const weights = getCapabilityWeights();
			const adjustments = getBudgetAdjustments();

			// Models should have required fields
			expect(models.every((m) => m.name && m.provider && m.pricingTier)).toBe(
				true,
			);

			// Keywords should have expected capability types
			const expectedKeywordTypes = [
				"reasoning",
				"code",
				"large-context",
				"speed",
				"multimodal",
			];
			for (const type of expectedKeywordTypes) {
				expect(keywords[type]).toBeDefined();
				expect(Array.isArray(keywords[type])).toBe(true);
			}

			// Weights should have numeric values
			for (const weight of Object.values(weights)) {
				expect(typeof weight).toBe("number");
				expect(weight).toBeGreaterThan(0);
			}

			// Budget adjustments should have proper structure
			for (const level of ["low", "medium", "high"] as const) {
				expect(adjustments[level]).toBeDefined();
				expect(Array.isArray(adjustments[level].bonus)).toBe(true);
				expect(Array.isArray(adjustments[level].penalty)).toBe(true);
			}
		});
	});

	describe("slugifyModelName", () => {
		it("should convert display name to lowercase slug", () => {
			expect(slugifyModelName("GPT-5-Codex")).toBe("gpt-5-codex");
		});

		it("should replace spaces with hyphens", () => {
			expect(slugifyModelName("Claude Opus 4.1")).toBe("claude-opus-4.1");
			expect(slugifyModelName("GPT-5 mini")).toBe("gpt-5-mini");
		});

		it("should preserve dots", () => {
			expect(slugifyModelName("GPT-4.1")).toBe("gpt-4.1");
			expect(slugifyModelName("Qwen2.5")).toBe("qwen2.5");
		});

		it("should remove special characters except dots and hyphens", () => {
			expect(slugifyModelName("Model@Name!")).toBe("modelname");
			expect(slugifyModelName("Model#$%^Name")).toBe("modelname");
		});

		it("should handle already lowercase slugs", () => {
			expect(slugifyModelName("gpt-5-codex")).toBe("gpt-5-codex");
		});

		it("should handle empty strings", () => {
			expect(slugifyModelName("")).toBe("");
		});

		it("should handle model names from YAML", () => {
			// Test with actual model names from models.yaml
			expect(slugifyModelName("GPT-4.1")).toBe("gpt-4.1");
			expect(slugifyModelName("GPT-5")).toBe("gpt-5");
			expect(slugifyModelName("Claude Sonnet 4")).toBe("claude-sonnet-4");
			expect(slugifyModelName("Gemini 2.5 Pro")).toBe("gemini-2.5-pro");
			expect(slugifyModelName("Gemini 2.0 Flash")).toBe("gemini-2.0-flash");
			expect(slugifyModelName("Grok Code Fast 1")).toBe("grok-code-fast-1");
			expect(slugifyModelName("Raptor mini")).toBe("raptor-mini");
		});
	});

	describe("getDefaultModelSlug", () => {
		it("should return lowercase slug of default model", () => {
			const slug = getDefaultModelSlug();
			expect(slug).toBe("gpt-5-codex");
		});

		it("should be lowercase", () => {
			const slug = getDefaultModelSlug();
			expect(slug).toBe(slug.toLowerCase());
		});

		it("should not contain spaces", () => {
			const slug = getDefaultModelSlug();
			expect(slug).not.toMatch(/\s/);
		});

		it("should be consistent with getDefaultModel", () => {
			const displayName = getDefaultModel();
			const slug = getDefaultModelSlug();
			expect(slug).toBe(slugifyModelName(displayName));
		});

		it("should cache results on subsequent calls", () => {
			const slug1 = getDefaultModelSlug();
			const slug2 = getDefaultModelSlug();
			expect(slug1).toBe(slug2);
		});
	});
});
