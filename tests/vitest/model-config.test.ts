// Comprehensive tests for model-config.ts exports
import { describe, expect, it } from "vitest";
import {
	BUDGET_ADJUSTMENTS,
	BUDGET_BONUS,
	BUDGET_PENALTY,
	CAPABILITY_WEIGHTS,
	DEFAULT_MODEL,
	MODELS,
	type ModelDefinition,
	REQUIREMENT_KEYWORDS,
	type ScoredModel,
} from "../../src/tools/config/model-config.js";

describe("Model Config Exports", () => {
	describe("MODELS constant", () => {
		it("should export an array of model definitions", () => {
			expect(Array.isArray(MODELS)).toBe(true);
			expect(MODELS.length).toBeGreaterThan(0);
		});

		it("should have valid structure for all models", () => {
			MODELS.forEach((model: ModelDefinition) => {
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

				expect(typeof model.name).toBe("string");
				expect(typeof model.provider).toBe("string");
				expect(typeof model.contextTokens).toBe("number");
				expect(typeof model.baseScore).toBe("number");
				expect(Array.isArray(model.capabilities)).toBe(true);
				expect(Array.isArray(model.strengths)).toBe(true);
				expect(Array.isArray(model.limitations)).toBe(true);
				expect(Array.isArray(model.specialFeatures)).toBe(true);
			});
		});

		it("should have valid pricing tiers", () => {
			const validTiers = ["budget", "mid-tier", "premium"];
			MODELS.forEach((model: ModelDefinition) => {
				expect(validTiers).toContain(model.pricingTier);
			});
		});

		it("should have base scores in valid range", () => {
			MODELS.forEach((model: ModelDefinition) => {
				expect(model.baseScore).toBeGreaterThanOrEqual(0);
				expect(model.baseScore).toBeLessThanOrEqual(100);
			});
		});

		it("should have positive context tokens", () => {
			MODELS.forEach((model: ModelDefinition) => {
				expect(model.contextTokens).toBeGreaterThan(0);
			});
		});
	});

	describe("REQUIREMENT_KEYWORDS constant", () => {
		it("should export a record of requirement keywords", () => {
			expect(typeof REQUIREMENT_KEYWORDS).toBe("object");
			expect(REQUIREMENT_KEYWORDS).not.toBeNull();
		});

		it("should have array values for each capability", () => {
			Object.entries(REQUIREMENT_KEYWORDS).forEach(([key, value]) => {
				expect(typeof key).toBe("string");
				expect(Array.isArray(value)).toBe(true);
				expect(value.length).toBeGreaterThan(0);
				value.forEach((keyword: string) => {
					expect(typeof keyword).toBe("string");
				});
			});
		});

		it("should have expected capability types", () => {
			const expectedTypes = ["reasoning", "code", "large-context"];
			expectedTypes.forEach((type) => {
				expect(REQUIREMENT_KEYWORDS).toHaveProperty(type);
			});
		});
	});

	describe("CAPABILITY_WEIGHTS constant", () => {
		it("should export a record of capability weights", () => {
			expect(typeof CAPABILITY_WEIGHTS).toBe("object");
			expect(CAPABILITY_WEIGHTS).not.toBeNull();
		});

		it("should have numeric values greater than zero", () => {
			Object.entries(CAPABILITY_WEIGHTS).forEach(([key, value]) => {
				expect(typeof key).toBe("string");
				expect(typeof value).toBe("number");
				expect(value).toBeGreaterThan(0);
			});
		});

		it("should have expected capabilities", () => {
			const expectedCapabilities = ["reasoning", "code", "speed"];
			expectedCapabilities.forEach((capability) => {
				expect(CAPABILITY_WEIGHTS).toHaveProperty(capability);
			});
		});
	});

	describe("BUDGET_ADJUSTMENTS constant", () => {
		it("should export budget adjustments for all levels", () => {
			expect(typeof BUDGET_ADJUSTMENTS).toBe("object");
			expect(BUDGET_ADJUSTMENTS).toHaveProperty("low");
			expect(BUDGET_ADJUSTMENTS).toHaveProperty("medium");
			expect(BUDGET_ADJUSTMENTS).toHaveProperty("high");
		});

		it("should have bonus and penalty arrays for each level", () => {
			const levels = ["low", "medium", "high"] as const;
			levels.forEach((level) => {
				expect(BUDGET_ADJUSTMENTS[level]).toHaveProperty("bonus");
				expect(BUDGET_ADJUSTMENTS[level]).toHaveProperty("penalty");
				expect(Array.isArray(BUDGET_ADJUSTMENTS[level].bonus)).toBe(true);
				expect(Array.isArray(BUDGET_ADJUSTMENTS[level].penalty)).toBe(true);
			});
		});

		it("should have string values in bonus and penalty arrays", () => {
			const levels = ["low", "medium", "high"] as const;
			levels.forEach((level) => {
				BUDGET_ADJUSTMENTS[level].bonus.forEach((item: string) => {
					expect(typeof item).toBe("string");
				});
				BUDGET_ADJUSTMENTS[level].penalty.forEach((item: string) => {
					expect(typeof item).toBe("string");
				});
			});
		});
	});

	describe("BUDGET_BONUS constant", () => {
		it("should export a numeric budget bonus", () => {
			expect(typeof BUDGET_BONUS).toBe("number");
		});

		it("should be a positive number", () => {
			expect(BUDGET_BONUS).toBeGreaterThan(0);
		});
	});

	describe("BUDGET_PENALTY constant", () => {
		it("should export a numeric budget penalty", () => {
			expect(typeof BUDGET_PENALTY).toBe("number");
		});

		it("should be a positive number", () => {
			expect(BUDGET_PENALTY).toBeGreaterThan(0);
		});
	});

	describe("DEFAULT_MODEL constant", () => {
		it("should export a string default model", () => {
			expect(typeof DEFAULT_MODEL).toBe("string");
		});

		it("should be a non-empty string", () => {
			expect(DEFAULT_MODEL.length).toBeGreaterThan(0);
			expect(DEFAULT_MODEL.trim()).toBe(DEFAULT_MODEL);
		});

		it("should be GPT-5 as configured", () => {
			expect(DEFAULT_MODEL).toBe("GPT-5");
		});

		it("should exist in the MODELS list", () => {
			const modelNames = MODELS.map((m: ModelDefinition) => m.name);
			expect(modelNames).toContain(DEFAULT_MODEL);
		});
	});

	describe("Type exports", () => {
		it("should export ModelDefinition type", () => {
			// Type test - if this compiles, the type is exported
			const testModel: ModelDefinition = MODELS[0];
			expect(testModel).toBeDefined();
		});

		it("should export ScoredModel type", () => {
			// Type test - create a ScoredModel to verify type is available
			const testScoredModel: ScoredModel = {
				...MODELS[0],
				score: 50,
			};
			expect(testScoredModel).toBeDefined();
			expect(testScoredModel.score).toBe(50);
		});
	});

	describe("Configuration consistency", () => {
		it("should have consistent data across all exports", () => {
			// Verify all exports are non-null and defined
			expect(MODELS).toBeDefined();
			expect(REQUIREMENT_KEYWORDS).toBeDefined();
			expect(CAPABILITY_WEIGHTS).toBeDefined();
			expect(BUDGET_ADJUSTMENTS).toBeDefined();
			expect(BUDGET_BONUS).toBeDefined();
			expect(BUDGET_PENALTY).toBeDefined();
			expect(DEFAULT_MODEL).toBeDefined();

			// Verify they come from the same loaded configuration
			expect(MODELS.length).toBeGreaterThan(0);
			expect(Object.keys(REQUIREMENT_KEYWORDS).length).toBeGreaterThan(0);
			expect(Object.keys(CAPABILITY_WEIGHTS).length).toBeGreaterThan(0);
		});

		it("should maintain referential integrity across re-imports", async () => {
			// Dynamic import to verify singleton behavior
			const module1 = await import("../../src/tools/config/model-config.js");
			const module2 = await import("../../src/tools/config/model-config.js");

			// Should be the same reference (singleton pattern)
			expect(module1.MODELS).toBe(module2.MODELS);
			expect(module1.MODELS).toBe(MODELS);
		});

		it("should have capability weights matching requirement keywords", () => {
			// All capability types with keywords should have weights
			Object.keys(REQUIREMENT_KEYWORDS).forEach((capability) => {
				// Not all keywords may have weights, but common ones should
				if (
					["reasoning", "code", "large-context", "speed"].includes(capability)
				) {
					expect(CAPABILITY_WEIGHTS).toHaveProperty(capability);
				}
			});
		});
	});

	describe("Integration with model-loader", () => {
		it("should use cached configuration from model-loader", async () => {
			// Import model-loader functions to verify they use the same cache
			const { getModels, getDefaultModel } = await import(
				"../../src/tools/config/model-loader.js"
			);

			const loaderModels = getModels();
			const loaderDefault = getDefaultModel();

			// Should match the exported constants
			expect(loaderModels).toBe(MODELS);
			expect(loaderDefault).toBe(DEFAULT_MODEL);
		});
	});
});
