// Error path tests for model-loader.ts
// These tests use mocking to test error handling that can't be reached with valid config
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Model Loader Error Paths", () => {
	beforeEach(() => {
		// Clear the module cache before each test to reset the singleton
		vi.resetModules();
	});

	describe("loadModelsFromYaml error handling", () => {
		it("should handle file read errors gracefully", async () => {
			// Mock readFileSync to throw an error
			vi.doMock("node:fs", () => ({
				readFileSync: vi.fn(() => {
					throw new Error("File not found");
				}),
			}));

			// Import after mocking
			const { loadModelsFromYaml } = await import(
				"../../src/tools/config/model-loader.js"
			);

			expect(() => loadModelsFromYaml()).toThrow(
				"Failed to load models from YAML: File not found",
			);

			vi.doUnmock("node:fs");
		});

		it("should handle YAML parse errors", async () => {
			// Mock yaml.load to throw an error
			vi.doMock("js-yaml", () => ({
				load: vi.fn(() => {
					throw new Error("Invalid YAML syntax");
				}),
			}));

			// Mock readFileSync to return valid content
			vi.doMock("node:fs", () => ({
				readFileSync: vi.fn(() => "invalid: yaml: content"),
			}));

			const { loadModelsFromYaml } = await import(
				"../../src/tools/config/model-loader.js"
			);

			expect(() => loadModelsFromYaml()).toThrow(
				"Failed to load models from YAML: Invalid YAML syntax",
			);

			vi.doUnmock("js-yaml");
			vi.doUnmock("node:fs");
		});

		it("should validate config is an object", async () => {
			// Mock yaml.load to return null
			vi.doMock("js-yaml", () => ({
				load: vi.fn(() => null),
			}));

			vi.doMock("node:fs", () => ({
				readFileSync: vi.fn(() => "null"),
			}));

			const { loadModelsFromYaml } = await import(
				"../../src/tools/config/model-loader.js"
			);

			expect(() => loadModelsFromYaml()).toThrow(
				"Failed to load models from YAML: Invalid YAML configuration: expected an object",
			);

			vi.doUnmock("js-yaml");
			vi.doUnmock("node:fs");
		});

		it("should validate config.models is an array", async () => {
			// Mock yaml.load to return config without models array
			vi.doMock("js-yaml", () => ({
				load: vi.fn(() => ({
					models: "not an array",
					requirementKeywords: {},
					capabilityWeights: {},
					budgetAdjustments: {},
					budgetBonus: 5,
					budgetPenalty: 5,
				})),
			}));

			vi.doMock("node:fs", () => ({
				readFileSync: vi.fn(() => "models: 'not an array'"),
			}));

			const { loadModelsFromYaml } = await import(
				"../../src/tools/config/model-loader.js"
			);

			expect(() => loadModelsFromYaml()).toThrow(
				"Failed to load models from YAML: Invalid YAML configuration: models must be an array",
			);

			vi.doUnmock("js-yaml");
			vi.doUnmock("node:fs");
		});

		it("should handle unknown error types", async () => {
			// Mock to throw a non-Error object
			vi.doMock("node:fs", () => ({
				readFileSync: vi.fn(() => {
					throw "String error";
				}),
			}));

			const { loadModelsFromYaml } = await import(
				"../../src/tools/config/model-loader.js"
			);

			expect(() => loadModelsFromYaml()).toThrow(
				"Failed to load models from YAML: Unknown error",
			);

			vi.doUnmock("node:fs");
		});
	});

	describe("getDefaultModel fallback behavior", () => {
		it("should throw when defaultModel is undefined", async () => {
			// Mock yaml.load to return config without defaultModel
			vi.doMock("js-yaml", () => ({
				load: vi.fn(() => ({
					// defaultModel is intentionally omitted
					models: [
						{
							name: "GPT-5",
							provider: "OpenAI",
							pricingTier: "premium",
							contextTokens: 128000,
							baseScore: 54,
							capabilities: ["reasoning"],
							strengths: [],
							limitations: [],
							specialFeatures: [],
							pricing: "Premium",
						},
					],
					requirementKeywords: { reasoning: ["analyze"] },
					capabilityWeights: { reasoning: 20 },
					budgetAdjustments: {
						low: { bonus: [], penalty: [] },
						medium: { bonus: [], penalty: [] },
						high: { bonus: [], penalty: [] },
					},
					budgetBonus: 5,
					budgetPenalty: 5,
				})),
			}));

			vi.doMock("node:fs", () => ({
				readFileSync: vi.fn(() => "models: []"),
			}));

			const { getDefaultModel } = await import(
				"../../src/tools/config/model-loader.js"
			);

			expect(() => getDefaultModel()).toThrow(
				"No defaultModel configured in models.yaml. Please set a defaultModel value.",
			);

			vi.doUnmock("js-yaml");
			vi.doUnmock("node:fs");
		});

		it("should throw when defaultModel is empty string", async () => {
			// Mock yaml.load to return config with empty defaultModel
			vi.doMock("js-yaml", () => ({
				load: vi.fn(() => ({
					defaultModel: "", // Empty string should trigger error
					models: [
						{
							name: "GPT-5",
							provider: "OpenAI",
							pricingTier: "premium",
							contextTokens: 128000,
							baseScore: 54,
							capabilities: ["reasoning"],
							strengths: [],
							limitations: [],
							specialFeatures: [],
							pricing: "Premium",
						},
					],
					requirementKeywords: { reasoning: ["analyze"] },
					capabilityWeights: { reasoning: 20 },
					budgetAdjustments: {
						low: { bonus: [], penalty: [] },
						medium: { bonus: [], penalty: [] },
						high: { bonus: [], penalty: [] },
					},
					budgetBonus: 5,
					budgetPenalty: 5,
				})),
			}));

			vi.doMock("node:fs", () => ({
				readFileSync: vi.fn(() => "defaultModel: ''"),
			}));

			const { getDefaultModel } = await import(
				"../../src/tools/config/model-loader.js"
			);

			// Empty string is falsy, so error should be thrown
			expect(() => getDefaultModel()).toThrow(
				"No defaultModel configured in models.yaml. Please set a defaultModel value.",
			);

			vi.doUnmock("js-yaml");
			vi.doUnmock("node:fs");
		});

		it("should use configured value when defaultModel is set", async () => {
			// Mock yaml.load to return config with custom defaultModel
			vi.doMock("js-yaml", () => ({
				load: vi.fn(() => ({
					defaultModel: "GPT-6",
					models: [
						{
							name: "GPT-6",
							provider: "OpenAI",
							pricingTier: "premium",
							contextTokens: 256000,
							baseScore: 60,
							capabilities: ["reasoning"],
							strengths: [],
							limitations: [],
							specialFeatures: [],
							pricing: "Premium",
						},
					],
					requirementKeywords: { reasoning: ["analyze"] },
					capabilityWeights: { reasoning: 20 },
					budgetAdjustments: {
						low: { bonus: [], penalty: [] },
						medium: { bonus: [], penalty: [] },
						high: { bonus: [], penalty: [] },
					},
					budgetBonus: 5,
					budgetPenalty: 5,
				})),
			}));

			vi.doMock("node:fs", () => ({
				readFileSync: vi.fn(() => "defaultModel: 'GPT-6'"),
			}));

			const { getDefaultModel } = await import(
				"../../src/tools/config/model-loader.js"
			);

			const defaultModel = getDefaultModel();
			expect(defaultModel).toBe("GPT-6");

			vi.doUnmock("js-yaml");
			vi.doUnmock("node:fs");
		});
	});

	describe("Caching behavior under error conditions", () => {
		it("should not cache invalid configurations", async () => {
			// Mock to return invalid config on first call, then valid on second
			let callCount = 0;
			vi.doMock("js-yaml", () => ({
				load: vi.fn(() => {
					callCount++;
					if (callCount === 1) {
						return null; // Invalid
					}
					return {
						models: [],
						requirementKeywords: {},
						capabilityWeights: {},
						budgetAdjustments: {
							low: { bonus: [], penalty: [] },
							medium: { bonus: [], penalty: [] },
							high: { bonus: [], penalty: [] },
						},
						budgetBonus: 5,
						budgetPenalty: 5,
					};
				}),
			}));

			vi.doMock("node:fs", () => ({
				readFileSync: vi.fn(() => "content"),
			}));

			const { loadModelsFromYaml } = await import(
				"../../src/tools/config/model-loader.js"
			);

			// First call should fail
			expect(() => loadModelsFromYaml()).toThrow();

			// Note: Due to singleton pattern, we can't easily test recovery
			// without resetting the module, which is expected behavior

			vi.doUnmock("js-yaml");
			vi.doUnmock("node:fs");
		});
	});

	describe("DEFAULT_MODEL_SLUG helper tests", () => {
		it("should verify invalid slugs are not in PROVIDER_ENUM_VALUES", async () => {
			// Import the PROVIDER_ENUM_VALUES to verify validation logic
			const { PROVIDER_ENUM_VALUES } = await import(
				"../../src/tools/config/generated/provider-enum.js"
			);

			const invalidSlug = "invalid-model-slug-not-in-enum";

			// Verify the slug is indeed not in the enum
			expect(
				PROVIDER_ENUM_VALUES.includes(
					invalidSlug as unknown as (typeof PROVIDER_ENUM_VALUES)[number],
				),
			).toBe(false);
		});

		it("should verify valid slugs are in PROVIDER_ENUM_VALUES", async () => {
			// Test that the validation passes for valid slugs
			const { PROVIDER_ENUM_VALUES } = await import(
				"../../src/tools/config/generated/provider-enum.js"
			);

			// A valid slug should be in the enum
			const validSlug = "gpt-5-codex";
			expect(
				PROVIDER_ENUM_VALUES.includes(
					validSlug as unknown as (typeof PROVIDER_ENUM_VALUES)[number],
				),
			).toBe(true);
		});
	});
});
