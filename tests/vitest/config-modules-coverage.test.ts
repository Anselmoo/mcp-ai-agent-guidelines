// Configuration modules comprehensive coverage tests
import { describe, expect, it } from "vitest";
import { CATEGORY_CONFIG } from "../../dist/tools/config/guidelines-config.js";
import {
	BUDGET_BONUS,
	BUDGET_PENALTY,
	CAPABILITY_WEIGHTS,
	MODELS,
	REQUIREMENT_KEYWORDS,
} from "../../dist/tools/config/model-config.js";

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
				expect(config.description).toBeDefined();
				expect(config.weight).toBeGreaterThan(0);
				expect(config.rules).toBeDefined();
				expect(Array.isArray(config.rules)).toBe(true);
			});
		});

		it("should have properly weighted categories", () => {
			const weights = Object.values(CATEGORY_CONFIG).map(
				(config) => config.weight,
			);
			const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

			expect(totalWeight).toBeGreaterThan(0);
			expect(Math.max(...weights)).toBeLessThanOrEqual(1.0);
			expect(Math.min(...weights)).toBeGreaterThan(0);
		});

		it("should have valid rule structures", () => {
			Object.values(CATEGORY_CONFIG).forEach((config) => {
				config.rules.forEach((rule) => {
					expect(rule.id).toBeDefined();
					expect(typeof rule.id).toBe("string");
					expect(rule.description).toBeDefined();
					expect(typeof rule.description).toBe("string");
					expect(rule.severity).toBeDefined();
					expect(["error", "warning", "info"]).toContain(rule.severity);
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
				expect(model.capabilities).toBeDefined();
				expect(typeof model.capabilities).toBe("object");
				expect(model.cost).toBeDefined();
				expect(typeof model.cost).toBe("object");
			});
		});

		it("should have valid model capabilities", () => {
			MODELS.forEach((model) => {
				const capabilities = model.capabilities;
				expect(capabilities.reasoning).toBeDefined();
				expect(typeof capabilities.reasoning).toBe("number");
				expect(capabilities.reasoning).toBeGreaterThanOrEqual(0);
				expect(capabilities.reasoning).toBeLessThanOrEqual(100);

				expect(capabilities.coding).toBeDefined();
				expect(typeof capabilities.coding).toBe("number");
				expect(capabilities.coding).toBeGreaterThanOrEqual(0);
				expect(capabilities.coding).toBeLessThanOrEqual(100);

				expect(capabilities.analysis).toBeDefined();
				expect(typeof capabilities.analysis).toBe("number");
				expect(capabilities.analysis).toBeGreaterThanOrEqual(0);
				expect(capabilities.analysis).toBeLessThanOrEqual(100);
			});
		});

		it("should have valid cost structures", () => {
			MODELS.forEach((model) => {
				const cost = model.cost;
				expect(cost.inputTokens).toBeDefined();
				expect(typeof cost.inputTokens).toBe("number");
				expect(cost.inputTokens).toBeGreaterThan(0);

				expect(cost.outputTokens).toBeDefined();
				expect(typeof cost.outputTokens).toBe("number");
				expect(cost.outputTokens).toBeGreaterThan(0);
			});
		});

		it("should have valid requirement keywords mapping", () => {
			expect(REQUIREMENT_KEYWORDS).toBeDefined();
			expect(typeof REQUIREMENT_KEYWORDS).toBe("object");

			const requirements = Object.keys(REQUIREMENT_KEYWORDS);
			expect(requirements.length).toBeGreaterThan(0);

			requirements.forEach((requirement) => {
				const keywords = REQUIREMENT_KEYWORDS[requirement];
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

			const capabilities = Object.keys(CAPABILITY_WEIGHTS);
			expect(capabilities.length).toBeGreaterThan(0);

			capabilities.forEach((capability) => {
				const weight = CAPABILITY_WEIGHTS[capability];
				expect(typeof weight).toBe("number");
				expect(weight).toBeGreaterThan(0);
				expect(weight).toBeLessThanOrEqual(1.0);
			});

			// Check total weights don't exceed reasonable bounds
			const totalWeight = Object.values(CAPABILITY_WEIGHTS).reduce(
				(sum, weight) => sum + weight,
				0,
			);
			expect(totalWeight).toBeGreaterThan(0);
			expect(totalWeight).toBeLessThanOrEqual(5.0); // Reasonable upper bound
		});

		it("should have valid budget constants", () => {
			expect(BUDGET_BONUS).toBeDefined();
			expect(typeof BUDGET_BONUS).toBe("number");
			expect(BUDGET_BONUS).toBeGreaterThan(0);

			expect(BUDGET_PENALTY).toBeDefined();
			expect(typeof BUDGET_PENALTY).toBe("number");
			expect(BUDGET_PENALTY).toBeGreaterThan(0);

			// Penalty should generally be higher than bonus
			expect(BUDGET_PENALTY).toBeGreaterThanOrEqual(BUDGET_BONUS);
		});

		it("should have consistent model data across providers", () => {
			const providers = [...new Set(MODELS.map((model) => model.provider))];
			expect(providers.length).toBeGreaterThan(0);

			providers.forEach((provider) => {
				const providerModels = MODELS.filter(
					(model) => model.provider === provider,
				);
				expect(providerModels.length).toBeGreaterThan(0);

				// Check that models from same provider have consistent structure
				providerModels.forEach((model) => {
					expect(model.provider).toBe(provider);
					expect(model.contextWindow).toBeDefined();
					expect(typeof model.contextWindow).toBe("number");
					expect(model.contextWindow).toBeGreaterThan(0);
				});
			});
		});

		it("should have reasonable model performance scores", () => {
			MODELS.forEach((model) => {
				const totalScore =
					model.capabilities.reasoning +
					model.capabilities.coding +
					model.capabilities.analysis;

				// Total score should be reasonable (not too low or impossibly high)
				expect(totalScore).toBeGreaterThan(50); // At least some capability
				expect(totalScore).toBeLessThanOrEqual(300); // Not impossibly high

				// Individual scores should be balanced
				const scores = [
					model.capabilities.reasoning,
					model.capabilities.coding,
					model.capabilities.analysis,
				];
				const maxScore = Math.max(...scores);
				const minScore = Math.min(...scores);

				// Difference shouldn't be too extreme (within reason)
				expect(maxScore - minScore).toBeLessThanOrEqual(80);
			});
		});

		it("should have cost-effective model options across budget ranges", () => {
			const costs = MODELS.map(
				(model) => model.cost.inputTokens + model.cost.outputTokens,
			);
			const minCost = Math.min(...costs);
			const maxCost = Math.max(...costs);

			expect(minCost).toBeGreaterThan(0);
			expect(maxCost).toBeGreaterThan(minCost);

			// Should have options across different cost ranges
			const lowCostModels = MODELS.filter(
				(model) =>
					model.cost.inputTokens + model.cost.outputTokens <=
					minCost + (maxCost - minCost) * 0.3,
			);
			const highCostModels = MODELS.filter(
				(model) =>
					model.cost.inputTokens + model.cost.outputTokens >=
					minCost + (maxCost - minCost) * 0.7,
			);

			expect(lowCostModels.length).toBeGreaterThan(0);
			expect(highCostModels.length).toBeGreaterThan(0);
		});
	});
});
