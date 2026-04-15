/**
 * Planning gate system for availability-gated execution.
 *
 * Provides availability-gated execution that gracefully falls back to advisory mode,
 * planning stage validation, and model availability checks before expensive operations.
 */

import {
	DEFAULT_PLANNING_GATE_CONFIG_VALUES,
	PLANNING_GATE_FALLBACK_LATENCY_MS,
} from "../config/runtime-defaults.js";
import type { ModelClass, SkillManifestEntry } from "../contracts/generated.js";
import type { InstructionInput, ModelProfile } from "../contracts/runtime.js";
import { createOperationalLogger } from "../infrastructure/observability.js";
import { modelAvailabilityService } from "../models/model-availability.js";
import { MODEL_PROFILES } from "../models/model-profile.js";
import { ModelRouter } from "../models/model-router.js";

/** Build a minimal {@link SkillManifestEntry} suitable for model-routing only. */
function minimalSkillEntry(
	id: string,
	preferredModelClass: ModelClass = "free",
): SkillManifestEntry {
	return {
		id,
		canonicalId: id,
		displayName: id,
		description: "",
		domain: "core",
		sourcePath: "",
		purpose: "",
		triggerPhrases: [],
		antiTriggerPhrases: [],
		usageSteps: [],
		intakeQuestions: [],
		relatedSkills: [],
		outputContract: [],
		recommendationHints: [],
		preferredModelClass,
	};
}

export interface PlanningGateConfig {
	/** Enable planning gate checks */
	enabled: boolean;
	/** Fallback to advisory mode when models unavailable */
	advisoryFallback: boolean;
	/** Maximum planning time in milliseconds */
	maxPlanningTime: number;
	/** Require model availability for these skill prefixes */
	strictAvailabilityCheck: string[];
	/** Advisory-only skill prefixes (never require model availability) */
	advisoryOnlySkills: string[];
}

export interface PlanningResult {
	canExecute: boolean;
	reason?: string;
	recommendedModel?: ModelProfile;
	fallbackStrategy?: "advisory" | "queue" | "abort";
	estimatedCost?: number;
	estimatedLatency?: number;
	prerequisites: string[];
	warnings: string[];
}

export interface ExecutionPlan {
	skillId: string;
	input: InstructionInput;
	selectedModel: ModelProfile;
	executionMode: "full" | "advisory" | "cached";
	dependencies: string[];
	estimatedResources: {
		computeUnits: number;
		memoryMb: number;
		latencyMs: number;
	};
	fallbacks: ModelProfile[];
}

const DEFAULT_CONFIG: PlanningGateConfig = {
	...DEFAULT_PLANNING_GATE_CONFIG_VALUES,
	strictAvailabilityCheck: [
		...DEFAULT_PLANNING_GATE_CONFIG_VALUES.strictAvailabilityCheck,
	],
	advisoryOnlySkills: [
		...DEFAULT_PLANNING_GATE_CONFIG_VALUES.advisoryOnlySkills,
	],
};

const planningGateLogger = createOperationalLogger("info");

function isModelClass(value: string): value is ModelClass {
	return (
		value === "free" ||
		value === "cheap" ||
		value === "strong" ||
		value === "reviewer"
	);
}

export class PlanningGateService {
	private readonly config: PlanningGateConfig;

	constructor(config: Partial<PlanningGateConfig> = {}) {
		this.config = {
			...DEFAULT_CONFIG,
			...config,
			strictAvailabilityCheck: config.strictAvailabilityCheck
				? [...config.strictAvailabilityCheck]
				: [...DEFAULT_CONFIG.strictAvailabilityCheck],
			advisoryOnlySkills: config.advisoryOnlySkills
				? [...config.advisoryOnlySkills]
				: [...DEFAULT_CONFIG.advisoryOnlySkills],
		};
	}

	/**
	 * Check if skill execution should proceed based on model availability
	 */
	async checkExecutionGate(
		skillId: string,
		input: InstructionInput,
	): Promise<PlanningResult> {
		if (!this.config.enabled) {
			const result: PlanningResult = {
				canExecute: true,
				prerequisites: [],
				warnings: [],
			};
			this.logGateDecision(skillId, result, { decision: "disabled" });
			return result;
		}

		const warnings: string[] = [];
		const prerequisites: string[] = [];

		// Check if skill is advisory-only
		const isAdvisoryOnly = this.config.advisoryOnlySkills.some((prefix) =>
			skillId.startsWith(prefix),
		);

		if (isAdvisoryOnly) {
			const result: PlanningResult = {
				canExecute: true,
				fallbackStrategy: "advisory",
				prerequisites: [],
				warnings: ["Skill runs in advisory mode only"],
			};
			this.logGateDecision(skillId, result, { decision: "advisory-only" });
			return result;
		}

		// Get required model class for this skill
		const modelClass = this.inferRequiredModelClass(skillId, input);
		const availableModels =
			modelAvailabilityService.getAvailableModelsForClass(modelClass);

		if (availableModels.length === 0) {
			const isStrictRequired = this.config.strictAvailabilityCheck.some(
				(prefix) => skillId.startsWith(prefix),
			);

			if (isStrictRequired && !this.config.advisoryFallback) {
				const result: PlanningResult = {
					canExecute: false,
					reason: `No available models for required class '${modelClass}' and advisory fallback disabled`,
					prerequisites: [`Configure at least one ${modelClass} model`],
					warnings,
				};
				this.logGateDecision(skillId, result, {
					decision: "blocked-no-available-models",
					modelClass,
				});
				return result;
			}

			if (this.config.advisoryFallback) {
				warnings.push(
					`No models available for class '${modelClass}', falling back to advisory mode`,
				);
				const result: PlanningResult = {
					canExecute: true,
					fallbackStrategy: "advisory",
					prerequisites,
					warnings,
				};
				this.logGateDecision(skillId, result, {
					decision: "advisory-no-available-models",
					modelClass,
				});
				return result;
			}

			const result: PlanningResult = {
				canExecute: false,
				reason: `No available models for class '${modelClass}'`,
				fallbackStrategy: "queue",
				prerequisites: [`Configure at least one ${modelClass} model`],
				warnings,
			};
			this.logGateDecision(skillId, result, {
				decision: "queued-no-available-models",
				modelClass,
			});
			return result;
		}

		// Select best available model
		const modelRouter = new ModelRouter();
		const selectedModel = modelRouter.chooseSkillModelById(skillId, modelClass);
		const availabilityCheck = modelAvailabilityService.checkAvailability(
			selectedModel.id,
		);

		if (!availabilityCheck.available) {
			if (availabilityCheck.fallbackModel) {
				const fallbackCheck = modelAvailabilityService.checkAvailability(
					availabilityCheck.fallbackModel,
				);
				if (fallbackCheck.available) {
					warnings.push(
						`Primary model '${selectedModel.id}' unavailable, using fallback '${availabilityCheck.fallbackModel}'`,
					);
					const fallbackModel = MODEL_PROFILES[availabilityCheck.fallbackModel];
					if (!fallbackModel) {
						throw new Error(
							`Fallback model '${availabilityCheck.fallbackModel}' is available but missing from MODEL_PROFILES.`,
						);
					}

					const result: PlanningResult = {
						canExecute: true,
						recommendedModel: fallbackModel,
						prerequisites,
						warnings,
					};
					this.logGateDecision(skillId, result, {
						decision: "fallback-model-selected",
						modelClass,
						selectedModelId: selectedModel.id,
						fallbackModelId: fallbackModel.id,
					});
					return result;
				}
			}

			if (this.config.advisoryFallback) {
				warnings.push(
					`Selected model '${selectedModel.id}' unavailable: ${availabilityCheck.reason}`,
				);
				const result: PlanningResult = {
					canExecute: true,
					fallbackStrategy: "advisory",
					prerequisites,
					warnings,
				};
				this.logGateDecision(skillId, result, {
					decision: "advisory-selected-model-unavailable",
					modelClass,
					selectedModelId: selectedModel.id,
				});
				return result;
			}

			const result: PlanningResult = {
				canExecute: false,
				reason: `Selected model '${selectedModel.id}' unavailable: ${availabilityCheck.reason}`,
				fallbackStrategy: "queue",
				prerequisites: [availabilityCheck.reason || "Model availability issue"],
				warnings,
			};
			this.logGateDecision(skillId, result, {
				decision: "queued-selected-model-unavailable",
				modelClass,
				selectedModelId: selectedModel.id,
			});
			return result;
		}

		// Estimate execution resources
		const complexity = this.estimateComplexity(skillId, input);

		const result: PlanningResult = {
			canExecute: true,
			recommendedModel: selectedModel,
			estimatedCost: this.estimateCost(selectedModel, complexity),
			estimatedLatency: this.estimateLatency(selectedModel, complexity),
			prerequisites,
			warnings,
		};
		this.logGateDecision(skillId, result, {
			decision: "ready",
			modelClass,
			selectedModelId: selectedModel.id,
		});
		return result;
	}

	/**
	 * Create execution plan for a skill
	 */
	async createExecutionPlan(
		skillId: string,
		input: InstructionInput,
	): Promise<ExecutionPlan | null> {
		const gateResult = await this.checkExecutionGate(skillId, input);

		if (!gateResult.canExecute) {
			planningGateLogger.log("warn", "Execution plan not created", {
				skillId,
				reason: gateResult.reason,
				fallbackStrategy: gateResult.fallbackStrategy,
			});
			return null;
		}

		const preferredModelClass = this.inferRequiredModelClass(skillId, input);
		const router = new ModelRouter();
		const selectedModel =
			gateResult.recommendedModel ||
			router.chooseSkillModelById(skillId, preferredModelClass);

		const complexity = this.estimateComplexity(skillId, input);
		const isAdvisoryOnlySkill = this.config.advisoryOnlySkills.some((prefix) =>
			skillId.startsWith(prefix),
		);
		const executionMode =
			gateResult.fallbackStrategy === "advisory" && !isAdvisoryOnlySkill
				? "full"
				: this.determineExecutionMode(skillId, gateResult);

		// Find fallback models in same class
		const fallbacks = this.findFallbackModels(selectedModel.modelClass);

		const plan = {
			skillId,
			input,
			selectedModel,
			executionMode,
			dependencies: this.extractDependencies(input),
			estimatedResources: {
				computeUnits:
					complexity * (selectedModel.modelClass === "strong" ? 3 : 1),
				memoryMb: Math.min(512 + complexity * 10, 2048),
				latencyMs:
					gateResult.estimatedLatency ?? PLANNING_GATE_FALLBACK_LATENCY_MS,
			},
			fallbacks,
		};
		planningGateLogger.log("info", "Execution plan created", {
			skillId,
			selectedModelId: selectedModel.id,
			executionMode,
			fallbackCount: fallbacks.length,
			dependencyCount: plan.dependencies.length,
		});
		return plan;
	}

	private logGateDecision(
		skillId: string,
		result: PlanningResult,
		extraContext: Record<string, unknown> = {},
	): void {
		const level =
			result.canExecute &&
			!result.fallbackStrategy &&
			result.warnings.length === 0
				? "info"
				: "warn";
		planningGateLogger.log(level, "Planning gate decision", {
			skillId,
			canExecute: result.canExecute,
			reason: result.reason,
			fallbackStrategy: result.fallbackStrategy,
			recommendedModelId: result.recommendedModel?.id,
			prerequisiteCount: result.prerequisites.length,
			warningCount: result.warnings.length,
			...extraContext,
		});
	}

	/**
	 * Infer required model class based on skill type and input
	 */
	private inferRequiredModelClass(
		skillId: string,
		input: InstructionInput,
	): ModelClass {
		// Physics skills need strong models for complex reasoning
		if (skillId.startsWith("qm-") || skillId.startsWith("gr-")) {
			return "strong";
		}

		// Governance and evaluation need strong models
		if (skillId.startsWith("gov-") || skillId.startsWith("eval-")) {
			return "strong";
		}

		// Leadership skills need strong models
		if (skillId.startsWith("lead-")) {
			return "strong";
		}

		// Complex analysis skills
		if (
			skillId.startsWith("arch-") ||
			skillId.startsWith("debug-") ||
			skillId.startsWith("synth-")
		) {
			return "strong";
		}

		// Adaptive and resilience skills need strong reasoning
		if (skillId.startsWith("adapt-") || skillId.startsWith("resil-")) {
			return "strong";
		}

		// Check input complexity
		const inputLength = (input.request + (input.context || "")).length;
		const hasComplexConstraints = (input.constraints?.length || 0) > 3;

		if (inputLength > 2000 || hasComplexConstraints) {
			return "strong";
		}

		if (inputLength > 500) {
			return "cheap";
		}

		return "free";
	}

	/**
	 * Estimate complexity of skill execution
	 */
	private estimateComplexity(skillId: string, input: InstructionInput): number {
		let complexity = 1;

		// Base complexity by skill type
		if (skillId.startsWith("qm-") || skillId.startsWith("gr-")) {
			complexity += 3; // Physics requires complex reasoning
		} else if (skillId.startsWith("arch-") || skillId.startsWith("synth-")) {
			complexity += 2; // Architecture and synthesis are complex
		} else if (skillId.startsWith("eval-") || skillId.startsWith("debug-")) {
			complexity += 2; // Evaluation and debugging need thorough analysis
		}

		// Input-based complexity
		const inputLength = input.request.length + (input.context?.length || 0);
		complexity += Math.floor(inputLength / 500);

		// Constraint complexity
		complexity += input.constraints?.length || 0;

		// Cap at reasonable maximum
		return Math.min(complexity, 10);
	}

	/**
	 * Estimate execution cost
	 */
	private estimateCost(model: ModelProfile, complexity: number): number {
		const baseTokens = 1000 + complexity * 200;

		// Cost multipliers by model class
		const costMultiplier = {
			free: 0,
			cheap: 1,
			strong: 4,
			reviewer: 2,
		}[model.modelClass];

		return baseTokens * costMultiplier * 0.001; // Approximate cost in cents
	}

	/**
	 * Estimate execution latency
	 */
	private estimateLatency(model: ModelProfile, complexity: number): number {
		const baseLatency = {
			free: 2000,
			cheap: 3000,
			strong: 8000,
			reviewer: 5000,
		}[model.modelClass];

		return baseLatency + complexity * 500;
	}

	/**
	 * Determine execution mode based on gate result
	 */
	private determineExecutionMode(
		skillId: string,
		gateResult: PlanningResult,
	): "full" | "advisory" | "cached" {
		if (gateResult.fallbackStrategy === "advisory") {
			return "advisory";
		}

		// Check if skill is in advisory-only list
		const isAdvisoryOnly = this.config.advisoryOnlySkills.some((prefix) =>
			skillId.startsWith(prefix),
		);

		if (isAdvisoryOnly) {
			return "advisory";
		}

		return "full";
	}

	/**
	 * Extract dependencies from input
	 */
	private extractDependencies(input: InstructionInput): string[] {
		const dependencies: string[] = [];

		// Look for references to other skills in the input
		const skillPattern = /\b([a-z]+-[a-z-]+)\b/g;
		const matches = input.request.match(skillPattern) || [];

		for (const match of matches) {
			// Filter out common words that might match the pattern
			if (
				!["user-agent", "real-time", "long-term", "high-level"].includes(match)
			) {
				dependencies.push(match);
			}
		}

		return [...new Set(dependencies)];
	}

	/**
	 * Find fallback models in the same class
	 */
	private findFallbackModels(modelClass: ModelClass): ModelProfile[] {
		const availableModels =
			modelAvailabilityService.getAvailableModelsForClass(modelClass);
		return availableModels
			.map((modelId) => MODEL_PROFILES[modelId])
			.filter((profile): profile is ModelProfile => profile !== undefined)
			.slice(0, 3); // Limit to top 3 fallbacks
	}

	/**
	 * Validate prerequisites for skill execution
	 */
	async validatePrerequisites(
		prerequisites: string[],
	): Promise<{ valid: boolean; failures: string[] }> {
		const failures: string[] = [];

		for (const prereq of prerequisites) {
			// Check if prerequisite is a model configuration requirement
			if (prereq.includes("Configure") && prereq.includes("model")) {
				const matchedModelClass = prereq.match(
					/(free|cheap|strong|reviewer)/,
				)?.[1];
				if (matchedModelClass && isModelClass(matchedModelClass)) {
					const available =
						modelAvailabilityService.getAvailableModelsForClass(
							matchedModelClass,
						);
					if (available.length === 0) {
						failures.push(prereq);
					}
				}
			}
		}

		return {
			valid: failures.length === 0,
			failures,
		};
	}

	/**
	 * Get configuration
	 */
	getConfig(): PlanningGateConfig {
		return { ...this.config };
	}

	/**
	 * Update configuration
	 */
	updateConfig(newConfig: Partial<PlanningGateConfig>): void {
		Object.assign(this.config, newConfig);
	}
}

/**
 * Global planning gate service instance
 */
export const planningGateService = new PlanningGateService();
