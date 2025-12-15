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
 * Converts a model display name to a lowercase slug format.
 * Examples: "GPT-5-Codex" -> "gpt-5-codex", "Claude Opus 4.1" -> "claude-opus-4.1"
 *
 * @param displayName - The display name of the model
 * @returns Slugified lowercase model name
 */
export function slugifyModelName(displayName: string): string {
	return displayName
		.toLowerCase()
		.replace(/\s+/g, "-") // Replace spaces with hyphens
		.replace(/[^a-z0-9.-]/g, ""); // Remove any characters that aren't alphanumeric, dots, or hyphens
}

/**
 * Gets the default model name from the YAML configuration.
 * The default model is specified in models.yaml under the `defaultModel` key.
 *
 * @returns Default model name (display format, e.g., "GPT-5-Codex")
 * @throws Error if no default model is configured in YAML
 */
export function getDefaultModel(): string {
	const config = loadModelsFromYaml();
	if (!config.defaultModel) {
		throw new Error(
			"No defaultModel configured in models.yaml. Please set a defaultModel value.",
		);
	}
	return config.defaultModel;
}

/**
 * Gets the default model slug from the YAML configuration.
 * Returns a lowercase slug format suitable for use with ProviderEnum.
 *
 * @returns Default model slug (lowercase format, e.g., "gpt-5-codex")
 * @throws Error if no default model is configured in YAML
 */
export function getDefaultModelSlug(): string {
	return slugifyModelName(getDefaultModel());
}
