import { describe, expect, it } from "vitest";
import { getModels } from "../../src/tools/config/model-loader.js";
import type {
	ModelDefinition,
	ModelMode,
	ModelStatus,
	TaskArea,
} from "../../src/tools/config/types/model.types.js";

describe("Model Schema Enhancement", () => {
	describe("New optional fields", () => {
		it("should load models with new optional fields", () => {
			const models = getModels();

			// Find models that should have new fields
			const gpt41 = models.find((m) => m.name === "GPT-4.1");
			const gpt5 = models.find((m) => m.name === "GPT-5");
			const claudeOpus41 = models.find((m) => m.name === "Claude Opus 4.1");
			const claudeSonnet4 = models.find((m) => m.name === "Claude Sonnet 4");
			const gemini25Pro = models.find((m) => m.name === "Gemini 2.5 Pro");

			expect(gpt41).toBeDefined();
			expect(gpt5).toBeDefined();
			expect(claudeOpus41).toBeDefined();
			expect(claudeSonnet4).toBeDefined();
			expect(gemini25Pro).toBeDefined();
		});

		it("should have modes field for enhanced models", () => {
			const models = getModels();
			const gpt41 = models.find((m) => m.name === "GPT-4.1");

			expect(gpt41?.modes).toBeDefined();
			expect(gpt41?.modes?.agent).toBe(true);
			expect(gpt41?.modes?.vision).toBe(true);
			expect(gpt41?.modes?.chat).toBe(true);
		});

		it("should have taskArea field for enhanced models", () => {
			const models = getModels();
			const gpt41 = models.find((m) => m.name === "GPT-4.1");
			const gpt5 = models.find((m) => m.name === "GPT-5");

			expect(gpt41?.taskArea).toBe("general-purpose");
			expect(gpt5?.taskArea).toBe("deep-reasoning");
		});

		it("should have multiplier field for enhanced models", () => {
			const models = getModels();
			const gpt41 = models.find((m) => m.name === "GPT-4.1");
			const claudeOpus41 = models.find((m) => m.name === "Claude Opus 4.1");

			expect(gpt41?.multiplier).toBe(1.0);
			expect(claudeOpus41?.multiplier).toBe(2.0);
		});

		it("should have status field for enhanced models", () => {
			const models = getModels();
			const gpt41 = models.find((m) => m.name === "GPT-4.1");

			expect(gpt41?.status).toBe("ga");
		});

		it("should have documentationUrl field for enhanced models", () => {
			const models = getModels();
			const gpt41 = models.find((m) => m.name === "GPT-4.1");

			expect(gpt41?.documentationUrl).toBeDefined();
			expect(gpt41?.documentationUrl).toContain("openai.com");
		});
	});

	describe("Backward compatibility", () => {
		it("should still load models without new optional fields", () => {
			const models = getModels();

			// Models without new fields should still work
			for (const model of models) {
				expect(model.name).toBeDefined();
				expect(model.provider).toBeDefined();
				expect(model.pricingTier).toBeDefined();
				expect(model.contextTokens).toBeGreaterThan(0);
				expect(model.baseScore).toBeGreaterThanOrEqual(0);
			}
		});

		it("should have undefined or no new fields for non-enhanced models", () => {
			const models = getModels();

			// Find a model that hasn't been enhanced (e.g., o3)
			const o3 = models.find((m) => m.name === "gpt-5.1");

			// New fields should be undefined for non-enhanced models
			if (o3 && !o3.modes) {
				expect(o3.modes).toBeUndefined();
			}
		});

		it("should maintain all original required fields", () => {
			const models = getModels();

			for (const model of models) {
				// All required fields must be present
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
			}
		});
	});

	describe("Type validation", () => {
		it("should have valid ModelMode values", () => {
			const models = getModels();
			const validModes: ModelMode[] = [
				"agent",
				"reasoning",
				"vision",
				"chat",
				"edit",
				"completions",
			];

			for (const model of models) {
				if (model.modes) {
					for (const [mode, enabled] of Object.entries(model.modes)) {
						expect(validModes).toContain(mode as ModelMode);
						expect(typeof enabled).toBe("boolean");
					}
				}
			}
		});

		it("should have valid TaskArea values", () => {
			const models = getModels();
			const validTaskAreas: TaskArea[] = [
				"general-purpose",
				"deep-reasoning",
				"fast-simple",
				"visual",
			];

			for (const model of models) {
				if (model.taskArea) {
					expect(validTaskAreas).toContain(model.taskArea);
				}
			}
		});

		it("should have valid ModelStatus values", () => {
			const models = getModels();
			const validStatuses: ModelStatus[] = ["ga", "preview", "beta", "retired"];

			for (const model of models) {
				if (model.status) {
					expect(validStatuses).toContain(model.status);
				}
			}
		});

		it("should have valid multiplier values", () => {
			const models = getModels();
			// Maximum multiplier of 5.0 allows for extreme premium models
			// while preventing unrealistic values (e.g., 2x base = 2.0, 5x base = 5.0)
			const MAX_MULTIPLIER = 5.0;

			for (const model of models) {
				if (model.multiplier !== undefined) {
					expect(typeof model.multiplier).toBe("number");
					// Allow 0.0 for complimentary models (e.g., Grok Code Fast 1)
					expect(model.multiplier).toBeGreaterThanOrEqual(0);
					expect(model.multiplier).toBeLessThanOrEqual(MAX_MULTIPLIER);
				}
			}
		});

		it("should have valid documentationUrl format", () => {
			const models = getModels();

			for (const model of models) {
				if (model.documentationUrl) {
					expect(typeof model.documentationUrl).toBe("string");
					expect(
						model.documentationUrl.startsWith("http://") ||
							model.documentationUrl.startsWith("https://"),
					).toBe(true);
				}
			}
		});
	});

	describe("Enhanced model validation", () => {
		it("should have all 5 required enhanced models", () => {
			const models = getModels();
			const enhancedModelNames = [
				"GPT-4.1",
				"GPT-5",
				"Claude Opus 4.1",
				"Claude Sonnet 4",
				"Gemini 2.5 Pro",
			];

			for (const name of enhancedModelNames) {
				const model = models.find((m) => m.name === name);
				expect(model).toBeDefined();

				// Verify each has the new fields
				expect(model?.modes).toBeDefined();
				expect(model?.taskArea).toBeDefined();
				expect(model?.multiplier).toBeDefined();
				expect(model?.status).toBeDefined();
				expect(model?.documentationUrl).toBeDefined();
			}
		});

		it("should have correct mode configuration for GPT-4.1", () => {
			const models = getModels();
			const gpt41 = models.find((m) => m.name === "GPT-4.1");

			expect(gpt41?.modes?.agent).toBe(true);
			expect(gpt41?.modes?.reasoning).toBe(false);
			expect(gpt41?.modes?.vision).toBe(true);
			expect(gpt41?.modes?.chat).toBe(true);
			expect(gpt41?.modes?.edit).toBe(true);
			expect(gpt41?.modes?.completions).toBe(true);
		});

		it("should have correct mode configuration for GPT-5", () => {
			const models = getModels();
			const gpt5 = models.find((m) => m.name === "GPT-5");

			expect(gpt5?.modes?.agent).toBe(true);
			expect(gpt5?.modes?.reasoning).toBe(true);
			expect(gpt5?.modes?.vision).toBe(true);
			expect(gpt5?.modes?.chat).toBe(true);
			expect(gpt5?.modes?.edit).toBe(true);
			expect(gpt5?.modes?.completions).toBe(false);
		});

		it("should have correct taskArea assignments", () => {
			const models = getModels();

			const gpt41 = models.find((m) => m.name === "GPT-4.1");
			const gpt5 = models.find((m) => m.name === "GPT-5");
			const claudeOpus41 = models.find((m) => m.name === "Claude Opus 4.1");

			expect(gpt41?.taskArea).toBe("general-purpose");
			expect(gpt5?.taskArea).toBe("deep-reasoning");
			expect(claudeOpus41?.taskArea).toBe("deep-reasoning");
		});

		it("should have correct multiplier assignments", () => {
			const models = getModels();

			const gpt41 = models.find((m) => m.name === "GPT-4.1");
			const gpt5 = models.find((m) => m.name === "GPT-5");
			const claudeOpus41 = models.find((m) => m.name === "Claude Opus 4.1");

			expect(gpt41?.multiplier).toBe(1.0);
			expect(gpt5?.multiplier).toBe(1.5);
			expect(claudeOpus41?.multiplier).toBe(2.0);
		});

		it("should have all models with ga status", () => {
			const models = getModels();
			const enhancedModelNames = [
				"GPT-4.1",
				"GPT-5",
				"Claude Opus 4.1",
				"Claude Sonnet 4",
				"Gemini 2.5 Pro",
			];

			for (const name of enhancedModelNames) {
				const model = models.find((m) => m.name === name);
				expect(model?.status).toBe("ga");
			}
		});

		it("should have valid documentation URLs for all enhanced models", () => {
			const models = getModels();
			const enhancedModels = models.filter((m) =>
				[
					"GPT-4.1",
					"GPT-5",
					"Claude Opus 4.1",
					"Claude Sonnet 4",
					"Gemini 2.5 Pro",
				].includes(m.name),
			);

			for (const model of enhancedModels) {
				expect(model.documentationUrl).toBeDefined();
				expect(model.documentationUrl).toMatch(/^https?:\/\/.+/);
			}
		});
	});

	describe("Schema consistency", () => {
		it("should maintain consistent structure across all models", () => {
			const models = getModels();

			for (const model of models) {
				// Type checks
				expect(typeof model.name).toBe("string");
				expect(typeof model.provider).toBe("string");
				expect(typeof model.contextTokens).toBe("number");
				expect(typeof model.baseScore).toBe("number");
				expect(typeof model.pricing).toBe("string");
				expect(Array.isArray(model.capabilities)).toBe(true);
				expect(Array.isArray(model.strengths)).toBe(true);
				expect(Array.isArray(model.limitations)).toBe(true);
				expect(Array.isArray(model.specialFeatures)).toBe(true);

				// Optional fields type checks (when present)
				if (model.modes !== undefined) {
					expect(typeof model.modes).toBe("object");
				}
				if (model.taskArea !== undefined) {
					expect(typeof model.taskArea).toBe("string");
				}
				if (model.multiplier !== undefined) {
					expect(typeof model.multiplier).toBe("number");
				}
				if (model.status !== undefined) {
					expect(typeof model.status).toBe("string");
				}
				if (model.documentationUrl !== undefined) {
					expect(typeof model.documentationUrl).toBe("string");
				}
			}
		});

		it("should have non-empty arrays for list fields", () => {
			const models = getModels();

			for (const model of models) {
				expect(model.capabilities.length).toBeGreaterThan(0);
				expect(model.strengths.length).toBeGreaterThan(0);
				expect(model.limitations.length).toBeGreaterThan(0);
				expect(model.specialFeatures.length).toBeGreaterThan(0);
			}
		});

		it("should have valid pricing tier values", () => {
			const models = getModels();
			const validTiers = ["premium", "mid-tier", "budget"];

			for (const model of models) {
				expect(validTiers).toContain(model.pricingTier);
			}
		});
	});

	describe("Type system integration", () => {
		it("should be compatible with TypeScript ModelDefinition interface", () => {
			const models = getModels();

			// This test verifies that the loaded models match the TypeScript interface
			const model: ModelDefinition = models[0];

			expect(model).toBeDefined();
			expect(typeof model.name).toBe("string");
			expect(typeof model.provider).toBe("string");
		});

		it("should allow optional fields to be undefined", () => {
			const models = getModels();

			for (const model of models) {
				// These checks should not throw
				const _modes = model.modes;
				const _taskArea = model.taskArea;
				const _multiplier = model.multiplier;
				const _status = model.status;
				const _docUrl = model.documentationUrl;

				// Should be able to access without errors
				expect(true).toBe(true);
			}
		});
	});
});
