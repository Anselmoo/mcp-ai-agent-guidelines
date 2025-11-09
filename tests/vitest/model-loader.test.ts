import { describe, expect, it } from "vitest";
import {
	getBudgetAdjustments,
	getBudgetBonus,
	getBudgetPenalty,
	getCapabilityWeights,
	getDefaultModel,
	getModels,
	getRequirementKeywords,
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

		it("should return GPT-5 as the configured default", () => {
			const defaultModel = getDefaultModel();

			// This test assumes GPT-5 is set as default in models.yaml
			expect(defaultModel).toBe("GPT-5");
		});

		it("should cache results on subsequent calls", () => {
			const model1 = getDefaultModel();
			const model2 = getDefaultModel();

			// Should return the same reference (cached)
			expect(model1).toBe(model2);
		});

		it("should return a string that is not empty", () => {
			const defaultModel = getDefaultModel();
			expect(defaultModel.trim().length).toBeGreaterThan(0);
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
});
