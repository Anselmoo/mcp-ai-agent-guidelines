// Model selection helpers for dynamic code example generation
// These functions select appropriate models from models.yaml based on criteria

import { MODELS } from "./model-config.js";
import type { ModelDefinition, TaskArea } from "./types/index.js";

/**
 * Select best model for a given use case from models.yaml
 */
export function selectModelByCategory(criteria: {
	taskArea?: TaskArea;
	mode?: string;
	budget?: "low" | "medium" | "high";
	requireLargeContext?: boolean;
}): ModelDefinition | undefined {
	let candidates = [...MODELS];

	if (criteria.taskArea) {
		candidates = candidates.filter((m) => m.taskArea === criteria.taskArea);
	}

	if (criteria.mode && criteria.mode !== "all") {
		candidates = candidates.filter(
			(m) => m.modes?.[criteria.mode as keyof typeof m.modes],
		);
	}

	if (criteria.budget === "low") {
		candidates = candidates.filter((m) => m.pricingTier === "budget");
	}

	if (criteria.requireLargeContext) {
		candidates = candidates.sort((a, b) => b.contextTokens - a.contextTokens);
	}

	// Return highest scored candidate
	return candidates.sort((a, b) => b.baseScore - a.baseScore)[0];
}

/**
 * Get best budget-friendly model (low-cost, fast)
 */
export function getBudgetModel(): ModelDefinition | undefined {
	return selectModelByCategory({ budget: "low" });
}

/**
 * Get model with largest context window
 */
export function getLargeContextModel(): ModelDefinition | undefined {
	return selectModelByCategory({ requireLargeContext: true });
}

/**
 * Get balanced general-purpose model
 */
export function getBalancedModel(): ModelDefinition | undefined {
	return selectModelByCategory({ taskArea: "general-purpose" });
}

/**
 * Get advanced reasoning model for complex tasks
 */
export function getAdvancedReasoningModel(): ModelDefinition | undefined {
	return selectModelByCategory({ taskArea: "deep-reasoning" });
}
