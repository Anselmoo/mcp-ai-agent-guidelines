/**
 * Integration Test: Model Configuration Pipeline
 *
 * This test validates the end-to-end pipeline:
 * YAML → Type Generation → Compilation → Import → Usage
 *
 * Critical for ensuring the Dynamic AI Model Configuration works correctly.
 * Part of: Anselmoo/mcp-ai-agent-guidelines#401
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// Import generated types (validates type generation pipeline)
import {
	getModelDisplayName,
	isValidModelIdentifier,
	MODEL_ALIASES,
	PROVIDER_ENUM_VALUES,
	ProviderEnum,
} from "../../../src/tools/config/generated/index.js";
// Import from YAML loader (source of truth)
import {
	getDefaultModel,
	getDefaultModelSlug,
	getModels,
	loadModelsFromYaml,
	slugifyModelName,
} from "../../../src/tools/config/model-loader.js";

// Import model selectors (validates usage pipeline)
import {
	getAdvancedReasoningModel,
	getBalancedModel,
	getBudgetModel,
	getLargeContextModel,
	selectModelByCategory,
} from "../../../src/tools/config/model-selectors.js";

// Get path to YAML configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MODELS_YAML_PATH = join(
	__dirname,
	"..",
	"..",
	"..",
	"src",
	"tools",
	"config",
	"models.yaml",
);
const GENERATED_DIR = join(
	__dirname,
	"..",
	"..",
	"..",
	"src",
	"tools",
	"config",
	"generated",
);

describe("Model Configuration Pipeline", () => {
	describe("Step 1: YAML Parsing", () => {
		it("should have models.yaml file present", () => {
			expect(existsSync(MODELS_YAML_PATH)).toBe(true);
		});

		it("should parse YAML successfully", () => {
			const config = loadModelsFromYaml();
			expect(config).toBeDefined();
			expect(typeof config).toBe("object");
		});

		it("should have valid models array", () => {
			const config = loadModelsFromYaml();
			expect(Array.isArray(config.models)).toBe(true);
			expect(config.models.length).toBeGreaterThan(0);
		});

		it("should have defaultModel defined", () => {
			const config = loadModelsFromYaml();
			expect(config.defaultModel).toBeDefined();
			expect(typeof config.defaultModel).toBe("string");
		});

		it("should have valid model structure for all models", () => {
			const models = getModels();
			for (const model of models) {
				expect(model.name).toBeDefined();
				expect(model.provider).toBeDefined();
				expect(model.pricingTier).toBeDefined();
				expect(model.contextTokens).toBeGreaterThan(0);
				expect(model.baseScore).toBeGreaterThanOrEqual(0);
				expect(model.baseScore).toBeLessThanOrEqual(100);
				expect(Array.isArray(model.capabilities)).toBe(true);
			}
		});

		it("should have requirementKeywords section", () => {
			const config = loadModelsFromYaml();
			expect(config.requirementKeywords).toBeDefined();
			expect(typeof config.requirementKeywords).toBe("object");
		});

		it("should have capabilityWeights section", () => {
			const config = loadModelsFromYaml();
			expect(config.capabilityWeights).toBeDefined();
			expect(typeof config.capabilityWeights).toBe("object");
		});
	});

	describe("Step 2: Type Generation", () => {
		it("should have generated directory present", () => {
			expect(existsSync(GENERATED_DIR)).toBe(true);
		});

		it("should have generated index.ts file", () => {
			const indexPath = join(GENERATED_DIR, "index.ts");
			expect(existsSync(indexPath)).toBe(true);
		});

		it("should have generated provider-enum.ts file", () => {
			const enumPath = join(GENERATED_DIR, "provider-enum.ts");
			expect(existsSync(enumPath)).toBe(true);
		});

		it("should have generated model-aliases.ts file", () => {
			const aliasesPath = join(GENERATED_DIR, "model-aliases.ts");
			expect(existsSync(aliasesPath)).toBe(true);
		});

		it("should have generated mode-enum.ts file", () => {
			const modePath = join(GENERATED_DIR, "mode-enum.ts");
			expect(existsSync(modePath)).toBe(true);
		});

		it("should have generated model-identifiers.ts file", () => {
			const identifiersPath = join(GENERATED_DIR, "model-identifiers.ts");
			expect(existsSync(identifiersPath)).toBe(true);
		});

		it("should have auto-generated header in provider-enum.ts", () => {
			const enumPath = join(GENERATED_DIR, "provider-enum.ts");
			const content = readFileSync(enumPath, "utf8");
			expect(content).toContain("AUTO-GENERATED - DO NOT EDIT");
			expect(content).toContain("Generated from models.yaml");
		});
	});

	describe("Step 3: Generated Types Compile and Import", () => {
		it("should export ProviderEnum successfully", () => {
			expect(ProviderEnum).toBeDefined();
			expect(typeof ProviderEnum.parse).toBe("function");
		});

		it("should export PROVIDER_ENUM_VALUES as array", () => {
			expect(Array.isArray(PROVIDER_ENUM_VALUES)).toBe(true);
			expect(PROVIDER_ENUM_VALUES.length).toBeGreaterThan(0);
		});

		it("should have ProviderEnum values matching YAML models", () => {
			const models = getModels();
			const modelSlugs = models.map((m) => slugifyModelName(m.name));

			// Each model slug should be in PROVIDER_ENUM_VALUES
			for (const slug of modelSlugs) {
				expect(PROVIDER_ENUM_VALUES).toContain(slug);
			}
		});

		it("should export MODEL_ALIASES successfully", () => {
			expect(MODEL_ALIASES).toBeDefined();
			expect(typeof MODEL_ALIASES).toBe("object");
		});

		it("should have MODEL_ALIASES matching YAML models", () => {
			const models = getModels();
			for (const model of models) {
				const slug = slugifyModelName(model.name);
				expect(MODEL_ALIASES[slug]).toBe(model.name);
			}
		});

		it("should export getModelDisplayName function", () => {
			expect(typeof getModelDisplayName).toBe("function");
		});

		it("should export isValidModelIdentifier function", () => {
			expect(typeof isValidModelIdentifier).toBe("function");
		});

		it("should validate ProviderEnum with zod parse", () => {
			// Valid provider should parse without error
			expect(() => ProviderEnum.parse("gpt-5-codex")).not.toThrow();

			// Invalid provider should throw
			expect(() => ProviderEnum.parse("invalid-provider")).toThrow();
		});
	});

	describe("Step 4: Model Selection Works Correctly", () => {
		it("should select model by capability", () => {
			const model = selectModelByCategory({ mode: "reasoning" });
			expect(model).toBeDefined();
			expect(model?.modes?.reasoning).toBe(true);
		});

		it("should select budget model", () => {
			const model = getBudgetModel();
			expect(model).toBeDefined();
			expect(model?.pricingTier).toBe("budget");
		});

		it("should select large context model", () => {
			const model = getLargeContextModel();
			expect(model).toBeDefined();
			expect(model?.contextTokens).toBeGreaterThanOrEqual(200000);
		});

		it("should select balanced model", () => {
			const model = getBalancedModel();
			expect(model).toBeDefined();
			expect(model?.taskArea).toBe("general-purpose");
		});

		it("should select advanced reasoning model", () => {
			const model = getAdvancedReasoningModel();
			expect(model).toBeDefined();
			expect(model?.taskArea).toBe("deep-reasoning");
		});

		it("should select by task area", () => {
			const model = selectModelByCategory({ taskArea: "fast-simple" });
			expect(model).toBeDefined();
			expect(model?.taskArea).toBe("fast-simple");
		});
	});

	describe("Step 5: getDefaultModel() Returns Valid Model", () => {
		it("should return default model from YAML", () => {
			const defaultModel = getDefaultModel();
			expect(defaultModel).toBeDefined();
			expect(typeof defaultModel).toBe("string");
			expect(defaultModel.length).toBeGreaterThan(0);
		});

		it("should return GPT-5-Codex as configured default", () => {
			const defaultModel = getDefaultModel();
			expect(defaultModel).toBe("GPT-5-Codex");
		});

		it("should have default model in models list", () => {
			const defaultModel = getDefaultModel();
			const models = getModels();
			const modelNames = models.map((m) => m.name);
			expect(modelNames).toContain(defaultModel);
		});

		it("should return valid slug for default model", () => {
			const slug = getDefaultModelSlug();
			expect(slug).toBe("gpt-5-codex");
		});

		it("should have default model in ProviderEnum", () => {
			const slug = getDefaultModelSlug();
			expect(() => ProviderEnum.parse(slug)).not.toThrow();
		});

		it("should have default model in MODEL_ALIASES", () => {
			const defaultModel = getDefaultModel();
			const slug = getDefaultModelSlug();
			expect(MODEL_ALIASES[slug]).toBe(defaultModel);
		});

		it("should validate default model identifier", () => {
			const slug = getDefaultModelSlug();
			expect(isValidModelIdentifier(slug)).toBe(true);
		});

		it("should get display name for default model", () => {
			const slug = getDefaultModelSlug();
			const displayName = getModelDisplayName(slug);
			expect(displayName).toBe("GPT-5-Codex");
		});
	});

	describe("Step 6: End-to-End Pipeline Validation", () => {
		it("should have consistent model count across YAML and generated types", () => {
			const models = getModels();
			const aliasCount = Object.keys(MODEL_ALIASES).length;
			expect(aliasCount).toBe(models.length);
		});

		it("should have ProviderEnum values match YAML model count (plus 'other')", () => {
			const models = getModels();
			// PROVIDER_ENUM_VALUES includes 'other' as catch-all
			expect(PROVIDER_ENUM_VALUES.length).toBe(models.length + 1);
		});

		it("should allow full workflow: YAML → slug → validate → display", () => {
			const models = getModels();
			for (const model of models) {
				// 1. Get slug from model name
				const slug = slugifyModelName(model.name);

				// 2. Validate with ProviderEnum
				expect(() => ProviderEnum.parse(slug)).not.toThrow();

				// 3. Check MODEL_ALIASES
				expect(isValidModelIdentifier(slug)).toBe(true);

				// 4. Get display name
				const displayName = getModelDisplayName(slug);
				expect(displayName).toBe(model.name);
			}
		});

		it("should handle model selection with default fallback", () => {
			// When no models match criteria, selectModelByCategory returns undefined
			const noMatch = selectModelByCategory({
				taskArea: "general-purpose",
				budget: "low",
			});

			// Should either find a match or return undefined (not throw)
			if (noMatch) {
				expect(noMatch.pricingTier).toBe("budget");
			} else {
				expect(noMatch).toBeUndefined();
			}
		});

		it("should maintain type safety across pipeline", () => {
			// This test ensures TypeScript types are correctly generated
			const defaultSlug = getDefaultModelSlug();

			// ProviderEnum.parse returns Provider type
			const parsed = ProviderEnum.parse(defaultSlug);
			expect(typeof parsed).toBe("string");

			// Can use parsed value in type-safe operations
			expect(PROVIDER_ENUM_VALUES).toContain(parsed);
		});
	});

	describe("Error Handling", () => {
		it("should throw on invalid ProviderEnum value", () => {
			expect(() => ProviderEnum.parse("non-existent-model")).toThrow();
		});

		it("should return false for invalid model identifier", () => {
			expect(isValidModelIdentifier("invalid-model")).toBe(false);
			expect(isValidModelIdentifier("")).toBe(false);
		});

		it("should return identifier unchanged for unknown model", () => {
			const unknown = "unknown-model-xyz";
			expect(getModelDisplayName(unknown)).toBe(unknown);
		});

		it("should handle case-sensitive identifiers correctly", () => {
			// Identifiers are lowercase slugs
			expect(isValidModelIdentifier("GPT-5-Codex")).toBe(false);
			expect(isValidModelIdentifier("gpt-5-codex")).toBe(true);
		});
	});
});
