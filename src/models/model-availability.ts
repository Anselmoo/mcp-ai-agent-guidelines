import { createDefaultOrchestrationConfig } from "../config/orchestration-config.js";
import {
	deriveModelAvailabilityConfig,
	loadOrchestrationConfigForWorkspace,
} from "../config/orchestration-config-service.js";
import type { ModelClass } from "../contracts/generated.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { createOperationalLogger } from "../infrastructure/observability.js";

/**
 * Configuration for model availability as declared by the user
 */
export interface ModelAvailabilityConfig {
	/** Advisory mode: warn when unavailable models are selected, but continue */
	advisory?: boolean;
	/** Model availability declarations by model ID */
	models: Record<string, ModelDeclaration>;
	/** Model class mappings */
	classes?: {
		free?: string[];
		cheap?: string[];
		strong?: string[];
		reviewer?: string[];
	};
}

export interface ModelDeclaration {
	/** Is this model available in the current environment? */
	available: boolean;
	/** Human-readable reason (e.g., "No API key configured", "Paid tier required") */
	reason?: string;
	/** Override the default model class */
	modelClass?: ModelClass;
}

export interface ModelAvailabilityCheck {
	available: boolean;
	reason?: string;
	fallbackModel?: string;
}

const DEFAULT_CONFIG: ModelAvailabilityConfig = deriveModelAvailabilityConfig(
	createDefaultOrchestrationConfig(),
);
const modelAvailabilityLogger = createOperationalLogger("warn");

export class ModelAvailabilityService {
	private config: ModelAvailabilityConfig = DEFAULT_CONFIG;
	private configLoaded = false;

	/**
	 * Load derived model availability from the workspace orchestration.toml.
	 */
	async loadConfig(workspaceRoot?: string): Promise<void> {
		// Skip loading config in test environment
		if (
			(process.env.NODE_ENV === "test" || process.env.VITEST === "true") &&
			workspaceRoot === undefined
		) {
			this.config = DEFAULT_CONFIG;
			this.configLoaded = false;
			return;
		}

		try {
			const orchestration =
				await loadOrchestrationConfigForWorkspace(workspaceRoot);
			const parsed = deriveModelAvailabilityConfig(orchestration.config);
			this.config = {
				...DEFAULT_CONFIG,
				...parsed,
				models: { ...DEFAULT_CONFIG.models, ...parsed.models },
				classes: { ...DEFAULT_CONFIG.classes, ...parsed.classes },
			};

			this.configLoaded = true;
		} catch (error) {
			// Workspace config missing or invalid - use derived builtin defaults.
			modelAvailabilityLogger.log(
				"warn",
				"Orchestration config unavailable; using derived availability defaults",
				{
					workspaceRoot,
					error: toErrorMessage(error),
				},
			);
			this.config = DEFAULT_CONFIG;
			this.configLoaded = false;
		}
	}

	/**
	 * Check if a model is available according to user configuration
	 */
	checkAvailability(modelId: string): ModelAvailabilityCheck {
		const declaration = this.config.models[modelId];

		if (!declaration) {
			// Model not explicitly declared - assume available in advisory mode
			if (this.config.advisory) {
				return {
					available: true,
					reason: "Not explicitly configured (advisory mode)",
				};
			}
			return {
				available: false,
				reason: "Model not declared in configuration",
			};
		}

		if (!declaration.available) {
			// Find fallback model in same class
			const fallback = this.findFallbackModel(modelId);
			return {
				available: false,
				reason: declaration.reason ?? "Marked as unavailable",
				fallbackModel: fallback,
			};
		}

		return { available: true };
	}

	/**
	 * Find a fallback model in the same class
	 */
	private findFallbackModel(modelId: string): string | undefined {
		// Find which class this model belongs to
		for (const [_className, modelIds] of Object.entries(
			this.config.classes ?? {},
		)) {
			if (Array.isArray(modelIds) && modelIds.includes(modelId)) {
				// Find first available model in the same class
				for (const candidateId of modelIds) {
					if (candidateId !== modelId) {
						// Check availability without recursion
						const declaration = this.config.models[candidateId];
						if (!declaration || declaration.available) {
							// Directly available or not explicitly declared (in advisory mode)
							return candidateId;
						}
					}
				}
			}
		}
		return undefined;
	}

	/**
	 * Get models for a specific class, filtered by availability
	 */
	getAvailableModelsForClass(modelClass: ModelClass): string[] {
		const classModels = (this.config.classes?.[modelClass] as string[]) ?? [];
		return classModels.filter(
			(modelId: string) => this.checkAvailability(modelId).available,
		);
	}

	/**
	 * Get the configuration mode (advisory vs configured)
	 */
	getMode(): "advisory" | "configured" {
		return this.config.advisory ? "advisory" : "configured";
	}

	/**
	 * Check if configuration was successfully loaded
	 */
	isConfigLoaded(): boolean {
		return this.configLoaded;
	}

	/**
	 * Get all model declarations
	 */
	getAllDeclarations(): Record<string, ModelDeclaration> {
		return { ...this.config.models };
	}
}

/**
 * Global instance for model availability checking
 */
export const modelAvailabilityService = new ModelAvailabilityService();
