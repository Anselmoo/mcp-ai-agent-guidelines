import type { OrchestrationConfig } from "../config/orchestration-config.js";
import { loadOrchestrationConfig } from "../config/orchestration-config.js";
import { deriveModelAvailabilityConfig } from "../config/orchestration-config-service.js";
import type { ModelClass } from "../contracts/generated.js";

function uniqueModelIds(modelIds: string[]): string[] {
	return [...new Set(modelIds)];
}

function idsForCapability(
	config: OrchestrationConfig,
	capability: string,
): string[] {
	return (config.capabilities[capability] ?? [])
		.map((alias) => config.models[alias]?.id)
		.filter((modelId): modelId is string => Boolean(modelId));
}

export function orderedModelIdsForClass(
	modelClass: ModelClass,
	config: OrchestrationConfig = loadOrchestrationConfig(),
): string[] {
	const availability = deriveModelAvailabilityConfig(config);
	const classIds = availability.classes?.[modelClass] ?? [];

	switch (modelClass) {
		case "free":
		case "cheap":
			return classIds;
		case "strong":
			return uniqueModelIds([
				...idsForCapability(config, "adversarial"),
				...classIds,
			]);
		case "reviewer":
			if (classIds.length > 0) {
				return classIds;
			}
			return uniqueModelIds([
				...idsForCapability(config, "synthesis"),
				...orderedModelIdsForClass("strong", config),
			]);
	}
}
