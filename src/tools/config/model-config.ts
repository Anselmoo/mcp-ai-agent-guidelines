// Data-driven configuration for model compatibility scoring
// Models are now loaded from YAML for easier maintenance
// See: https://docs.github.com/en/copilot/reference/ai-models/model-comparison#recommended-models-by-task

import {
	PROVIDER_ENUM_VALUES,
	type Provider,
} from "./generated/provider-enum.js";
import {
	getBudgetAdjustments,
	getBudgetBonus,
	getBudgetPenalty,
	getCapabilityWeights,
	getDefaultModel,
	getDefaultModelSlug,
	getModels,
	getRequirementKeywords,
} from "./model-loader.js";
import type { ModelDefinition, ScoredModel } from "./types/index.js";

export type { ModelDefinition, ScoredModel };

// Export models and configuration from YAML
export const MODELS: ModelDefinition[] = getModels();
export const REQUIREMENT_KEYWORDS: Record<string, string[]> =
	getRequirementKeywords();
export const CAPABILITY_WEIGHTS: Record<string, number> =
	getCapabilityWeights();
export const BUDGET_ADJUSTMENTS: Record<
	"low" | "medium" | "high",
	{ bonus: string[]; penalty: string[] }
> = getBudgetAdjustments();
export const BUDGET_BONUS = getBudgetBonus();
export const BUDGET_PENALTY = getBudgetPenalty();
export const DEFAULT_MODEL = getDefaultModel();

// Get the default model slug and validate it against the ProviderEnum
const defaultSlug = getDefaultModelSlug();
if (!PROVIDER_ENUM_VALUES.includes(defaultSlug as Provider)) {
	throw new Error(
		`Invalid default model slug "${defaultSlug}". Must be one of: ${PROVIDER_ENUM_VALUES.join(", ")}`,
	);
}
export const DEFAULT_MODEL_SLUG: Provider = defaultSlug as Provider;
