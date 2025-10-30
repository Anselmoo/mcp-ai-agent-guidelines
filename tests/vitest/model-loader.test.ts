import { describe, expect, it } from "vitest";
import {
	getBudgetAdjustments,
	getBudgetBonus,
	getBudgetPenalty,
	getCapabilityWeights,
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
});
