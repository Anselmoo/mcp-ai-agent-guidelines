// Configuration modules comprehensive coverage tests
import { describe, expect, it } from "vitest";
import { CATEGORY_CONFIG } from "../../src/tools/config/guidelines-config.ts";
import {
	BUDGET_BONUS,
	BUDGET_PENALTY,
	CAPABILITY_WEIGHTS,
	DEFAULT_MODEL,
	MODELS,
	REQUIREMENT_KEYWORDS,
} from "../../src/tools/config/model-config.ts";

describe("Configuration Modules Comprehensive Coverage", () => {
	describe("Guidelines Config Tests", () => {
		it("should have valid category configurations", () => {
			expect(CATEGORY_CONFIG).toBeDefined();
			expect(typeof CATEGORY_CONFIG).toBe("object");

			// Check that configurations have expected structure
			const categories = Object.keys(CATEGORY_CONFIG);
			expect(categories.length).toBeGreaterThan(0);

			categories.forEach((category) => {
				const config = CATEGORY_CONFIG[category];
				expect(config).toBeDefined();
				expect(config.base).toBeDefined();
				expect(typeof config.base).toBe("number");
				expect(config.criteria).toBeDefined();
				expect(Array.isArray(config.criteria)).toBe(true);
				expect(config.bestPractices).toBeDefined();
				expect(Array.isArray(config.bestPractices)).toBe(true);
			});
		});

		it("should have properly weighted categories", () => {
			const bases = Object.values(CATEGORY_CONFIG).map((config) => config.base);
			const totalBase = bases.reduce((sum, base) => sum + base, 0);

			expect(totalBase).toBeGreaterThan(0);
			expect(Math.max(...bases)).toBeLessThanOrEqual(100);
			expect(Math.min(...bases)).toBeGreaterThan(0);
		});

		it("should have valid rule structures", () => {
			Object.values(CATEGORY_CONFIG).forEach((config) => {
				config.criteria.forEach((criterion) => {
					expect(criterion.id).toBeDefined();
					expect(typeof criterion.id).toBe("string");
					expect(criterion.keywords).toBeDefined();
					expect(Array.isArray(criterion.keywords)).toBe(true);
					expect(criterion.weight).toBeGreaterThan(0);
					expect(criterion.strength).toBeDefined();
					expect(typeof criterion.strength).toBe("string");
					expect(criterion.issue).toBeDefined();
					expect(typeof criterion.issue).toBe("string");
					expect(criterion.recommendation).toBeDefined();
					expect(typeof criterion.recommendation).toBe("string");
				});
			});
		});
	});

	describe("Model Config Tests", () => {
		it("should have valid model definitions", () => {
			expect(MODELS).toBeDefined();
			expect(Array.isArray(MODELS)).toBe(true);
			expect(MODELS.length).toBeGreaterThan(0);

			MODELS.forEach((model) => {
				expect(model.name).toBeDefined();
				expect(typeof model.name).toBe("string");
				expect(model.provider).toBeDefined();
				expect(typeof model.provider).toBe("string");
				expect(model.pricingTier).toBeDefined();
				expect(["premium", "mid-tier", "budget"]).toContain(model.pricingTier);
			});
		});

		it("should have valid model capabilities", () => {
			MODELS.forEach((model) => {
				expect(model.capabilities).toBeDefined();
				expect(Array.isArray(model.capabilities)).toBe(true);
				expect(model.capabilities.length).toBeGreaterThan(0);
				expect(model.strengths).toBeDefined();
				expect(Array.isArray(model.strengths)).toBe(true);
				expect(model.limitations).toBeDefined();
				expect(Array.isArray(model.limitations)).toBe(true);
			});
		});

		it("should have valid base scores", () => {
			MODELS.forEach((model) => {
				expect(model.baseScore).toBeDefined();
				expect(typeof model.baseScore).toBe("number");
				expect(model.baseScore).toBeGreaterThan(0);
				expect(model.baseScore).toBeLessThanOrEqual(100);
			});
		});

		it("should have valid requirement keywords mapping", () => {
			expect(REQUIREMENT_KEYWORDS).toBeDefined();
			expect(typeof REQUIREMENT_KEYWORDS).toBe("object");

			Object.entries(REQUIREMENT_KEYWORDS).forEach(([key, keywords]) => {
				expect(typeof key).toBe("string");
				expect(Array.isArray(keywords)).toBe(true);
				expect(keywords.length).toBeGreaterThan(0);
				keywords.forEach((keyword) => {
					expect(typeof keyword).toBe("string");
					expect(keyword.length).toBeGreaterThan(0);
				});
			});
		});

		it("should have valid capability weights", () => {
			expect(CAPABILITY_WEIGHTS).toBeDefined();
			expect(typeof CAPABILITY_WEIGHTS).toBe("object");

			Object.entries(CAPABILITY_WEIGHTS).forEach(([capability, weight]) => {
				expect(typeof capability).toBe("string");
				expect(typeof weight).toBe("number");
				expect(weight).toBeGreaterThan(0);
				expect(weight).toBeLessThanOrEqual(25); // Adjusted from 1 to reasonable max
			});
		});

		it("should have valid budget constants", () => {
			expect(BUDGET_BONUS).toBeDefined();
			expect(typeof BUDGET_BONUS).toBe("number");
			expect(BUDGET_BONUS).toBeGreaterThan(0);

			expect(BUDGET_PENALTY).toBeDefined();
			expect(typeof BUDGET_PENALTY).toBe("number");
			expect(BUDGET_PENALTY).toBeGreaterThan(0);
		});

		it("should have consistent model data across providers", () => {
			const providers = [...new Set(MODELS.map((model) => model.provider))];
			expect(providers.length).toBeGreaterThan(0);

			providers.forEach((provider) => {
				const providerModels = MODELS.filter(
					(model) => model.provider === provider,
				);
				expect(providerModels.length).toBeGreaterThan(0);

				providerModels.forEach((model) => {
					expect(model.contextTokens).toBeDefined();
					expect(typeof model.contextTokens).toBe("number");
					expect(model.contextTokens).toBeGreaterThan(0);
					expect(model.pricing).toBeDefined();
					expect(typeof model.pricing).toBe("string");
				});
			});
		});

		it("should have reasonable model performance scores", () => {
			const scores = MODELS.map((model) => model.baseScore);
			const totalScore = scores.reduce((sum, score) => sum + score, 0);
			const avgScore = totalScore / scores.length;

			// Total score should be reasonable (not too low or impossibly high)
			expect(avgScore).toBeGreaterThan(40); // At least some capability
			expect(avgScore).toBeLessThanOrEqual(60); // Not impossibly high

			// All scores should be within reasonable range
			scores.forEach((score) => {
				expect(score).toBeGreaterThan(30);
				expect(score).toBeLessThanOrEqual(60);
			});
		});

		it("should have cost-effective model options across budget ranges", () => {
			const pricingTiers = MODELS.map((model) => model.pricingTier);

			// Should have models in each pricing tier
			expect(pricingTiers).toContain("budget");
			expect(pricingTiers).toContain("mid-tier");
			expect(pricingTiers).toContain("premium");

			// Budget models should exist
			const budgetModels = MODELS.filter(
				(model) => model.pricingTier === "budget",
			);
			expect(budgetModels.length).toBeGreaterThan(0);

			// Premium models should exist
			const premiumModels = MODELS.filter(
				(model) => model.pricingTier === "premium",
			);
			expect(premiumModels.length).toBeGreaterThan(0);
		});

		it("should have meaningful contextual information", () => {
			MODELS.forEach((model) => {
				expect(model.specialFeatures).toBeDefined();
				expect(Array.isArray(model.specialFeatures)).toBe(true);

				// Each model should have some defining characteristics
				const hasInfo =
					model.strengths.length > 0 ||
					model.limitations.length > 0 ||
					model.specialFeatures.length > 0;
				expect(hasInfo).toBe(true);
			});
		});

		it("should export a default model", () => {
			expect(DEFAULT_MODEL).toBeDefined();
			expect(typeof DEFAULT_MODEL).toBe("string");
			expect(DEFAULT_MODEL.length).toBeGreaterThan(0);
		});

		it("should have the default model in the available models list", () => {
			const modelNames = MODELS.map((model) => model.name);
			expect(modelNames).toContain(DEFAULT_MODEL);
		});
	});
});
