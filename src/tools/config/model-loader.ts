import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";
import type { ModelDefinition } from "./types/index.js";

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the YAML configuration file
const MODELS_YAML_PATH = join(__dirname, "models.yaml");

/**
 * Interface for the YAML models configuration structure
 */
interface ModelsYamlConfig {
	defaultModel?: string;
	models: ModelDefinition[];
	requirementKeywords: Record<string, string[]>;
	capabilityWeights: Record<string, number>;
	budgetAdjustments: Record<
		"low" | "medium" | "high",
		{ bonus: string[]; penalty: string[] }
	>;
	budgetBonus: number;
	budgetPenalty: number;
}

/**
 * Loads and parses the models.yaml configuration file.
 * This is a singleton that loads the file once and caches the result.
 *
 * @returns The parsed models configuration
 * @throws Error if the YAML file cannot be read or parsed
 */
let cachedConfig: ModelsYamlConfig | null = null;

export function loadModelsFromYaml(): ModelsYamlConfig {
	if (cachedConfig) {
		return cachedConfig;
	}

	try {
		const fileContents = readFileSync(MODELS_YAML_PATH, "utf8");
		const config = yaml.load(fileContents) as ModelsYamlConfig;

		// Validate the loaded configuration
		if (!config || typeof config !== "object") {
			throw new Error("Invalid YAML configuration: expected an object");
		}

		if (!Array.isArray(config.models)) {
			throw new Error("Invalid YAML configuration: models must be an array");
		}

		// Cache the configuration
		cachedConfig = config;
		return config;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to load models from YAML: ${error.message}`);
		}
		throw new Error("Failed to load models from YAML: Unknown error");
	}
}

/**
 * Gets the list of model definitions from the YAML configuration.
 *
 * @returns Array of model definitions
 */
export function getModels(): ModelDefinition[] {
	const config = loadModelsFromYaml();
	return config.models;
}

/**
 * Gets the requirement keywords from the YAML configuration.
 *
 * @returns Record mapping capability names to keyword arrays
 */
export function getRequirementKeywords(): Record<string, string[]> {
	const config = loadModelsFromYaml();
	return config.requirementKeywords;
}

/**
 * Gets the capability weights from the YAML configuration.
 *
 * @returns Record mapping capability names to weight values
 */
export function getCapabilityWeights(): Record<string, number> {
	const config = loadModelsFromYaml();
	return config.capabilityWeights;
}

/**
 * Gets the budget adjustments from the YAML configuration.
 *
 * @returns Record mapping budget levels to bonus/penalty arrays
 */
export function getBudgetAdjustments(): Record<
	"low" | "medium" | "high",
	{ bonus: string[]; penalty: string[] }
> {
	const config = loadModelsFromYaml();
	return config.budgetAdjustments;
}

/**
 * Gets the budget bonus value from the YAML configuration.
 *
 * @returns Budget bonus value
 */
export function getBudgetBonus(): number {
	const config = loadModelsFromYaml();
	return config.budgetBonus;
}

/**
 * Gets the budget penalty value from the YAML configuration.
 *
 * @returns Budget penalty value
 */
export function getBudgetPenalty(): number {
	const config = loadModelsFromYaml();
	return config.budgetPenalty;
}

/**
 * Gets the default model name from the YAML configuration.
 * Falls back to "GPT-5" if not specified for backward compatibility.
 *
 * @returns Default model name
 */
export function getDefaultModel(): string {
	const config = loadModelsFromYaml();
	return config.defaultModel || "GPT-5";
}
