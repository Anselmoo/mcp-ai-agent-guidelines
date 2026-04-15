import {
	resolveForSkill as configResolveForSkill,
	getDomainRouting,
	getFanOut,
	getProfileForSkill,
	loadOrchestrationConfig,
} from "../config/orchestration-config.js";
import type {
	InstructionManifestEntry,
	ModelClass,
	SkillManifestEntry,
	WorkflowStep,
} from "../contracts/generated.js";
import type { ModelRoutingDecision } from "../contracts/model-routing.js";
import type { InstructionInput, ModelProfile } from "../contracts/runtime.js";
import { createOperationalLogger } from "../infrastructure/observability.js";
import {
	createErrorContext,
	ModelExecutionError,
} from "../validation/error-handling.js";
import { modelAvailabilityService } from "./model-availability.js";
import { orderedModelIdsForClass } from "./model-class-defaults.js";
import { MODEL_PROFILES } from "./model-profile.js";

function assertNever(value: never): never {
	throw new Error(`Unhandled model router case: ${String(value)}`);
}

const modelRouterLogger = createOperationalLogger("warn");

function resolvePreferredModelClass(
	modelClass: ModelClass | undefined,
): ModelClass {
	return modelClass ?? "free";
}

function profileForPreferredClass(
	modelClass: ModelClass | undefined,
): ModelProfile {
	return profileForClass(resolvePreferredModelClass(modelClass));
}

function profileForClass(modelClass: ModelClass): ModelProfile {
	// In tests or when config isn't loaded, use the default directly
	if (!modelAvailabilityService.isConfigLoaded()) {
		return getDefaultModelForClass(modelClass);
	}

	// Get available models for the class
	const availableModels =
		modelAvailabilityService.getAvailableModelsForClass(modelClass);

	// If we have available models, use the first one
	if (availableModels.length > 0) {
		const modelId = availableModels[0];
		const profile = MODEL_PROFILES[modelId];
		if (profile) {
			return profile;
		}
	}

	// Fallback to default mapping
	const defaultModel = getDefaultModelForClass(modelClass);
	const availability = modelAvailabilityService.checkAvailability(
		defaultModel.id,
	);

	if (!availability.available) {
		modelRouterLogger.log("warn", "Default model unavailable", {
			modelId: defaultModel.id,
			reason: availability.reason,
		});
		if (availability.fallbackModel) {
			const fallback = MODEL_PROFILES[availability.fallbackModel];
			if (fallback) {
				modelRouterLogger.log("warn", "Using fallback model", {
					modelId: fallback.id,
					originalModelId: defaultModel.id,
				});
				return fallback;
			}
		}

		// In advisory mode, proceed with original selection
		if (modelAvailabilityService.getMode() === "advisory") {
			modelRouterLogger.log(
				"warn",
				"Continuing with unavailable model in advisory mode",
				{
					modelId: defaultModel.id,
				},
			);
		}
	}

	return defaultModel;
}

function getDefaultModelForClass(modelClass: ModelClass): ModelProfile {
	for (const modelId of orderedModelIdsForClass(modelClass)) {
		const profile = MODEL_PROFILES[modelId];
		if (profile) {
			return profile;
		}
	}

	if (modelClass === "reviewer") {
		const fallbackStrong = Object.values(MODEL_PROFILES).find(
			(profile) => profile.modelClass === "strong",
		);
		if (fallbackStrong) {
			return fallbackStrong;
		}
	}

	const classFallback = Object.values(MODEL_PROFILES).find(
		(profile) => profile.modelClass === modelClass,
	);
	if (classFallback) {
		return classFallback;
	}

	const freeFallback = Object.values(MODEL_PROFILES).find(
		(profile) => profile.modelClass === "free",
	);
	if (freeFallback) {
		return freeFallback;
	}

	throw new Error(
		`No default model profile available for class: ${modelClass}`,
	);
}

function getExplicitSkillModel(skillId: string): ModelProfile | null {
	if (skillId === "orch-agent-orchestrator") {
		return profileForCapabilityOrClass("synthesis", "strong");
	}

	return null;
}

function idsForCapability(capability: string): string[] {
	const config = loadOrchestrationConfig();
	return (config.capabilities[capability] ?? [])
		.map((alias) => config.models[alias]?.id)
		.filter((modelId): modelId is string => Boolean(modelId));
}

function profileForCapabilityOrClass(
	capability: string,
	modelClass: ModelClass,
): ModelProfile {
	for (const modelId of [
		...idsForCapability(capability),
		...orderedModelIdsForClass(modelClass),
	]) {
		const profile = MODEL_PROFILES[modelId];
		if (profile) {
			return profile;
		}
	}

	return getDefaultModelForClass(modelClass);
}

function profileForResolvedModelId(modelId: string): ModelProfile | null {
	return MODEL_PROFILES[modelId] ?? null;
}

function resolveConfiguredSkillModel(skillId: string): ModelProfile | null {
	const routing = getDomainRouting(skillId);
	if (!routing) {
		return null;
	}

	const configuredModelId = configResolveForSkill(skillId);
	const configuredProfile = profileForResolvedModelId(configuredModelId);
	if (configuredProfile) {
		return configuredProfile;
	}

	throw new ModelExecutionError(
		`Configured routing resolved ${skillId} to unknown model ${configuredModelId}`,
		createErrorContext(skillId),
		configuredModelId,
	);
}

function resolveModelByPrecedence(
	strategies: Array<() => ModelProfile | null>,
	fallback: () => ModelProfile,
): ModelProfile {
	for (const strategy of strategies) {
		const profile = strategy();
		if (profile) {
			return profile;
		}
	}

	return fallback();
}

function tryResolveConfiguredSkillModel(skillId: string): ModelProfile | null {
	try {
		return resolveConfiguredSkillModel(skillId);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "unknown routing failure";
		modelRouterLogger.log("warn", "Configured routing fallback triggered", {
			skillId,
			error: message,
		});
		return null;
	}
}

function hasParallelWorkload(steps: WorkflowStep[]): boolean {
	for (const step of steps) {
		switch (step.kind) {
			case "parallel":
				return true;
			case "serial":
				if (hasParallelWorkload(step.steps)) {
					return true;
				}
				break;
			case "gate":
				if (hasParallelWorkload([...step.ifTrue, ...(step.ifFalse ?? [])])) {
					return true;
				}
				break;
			case "invokeSkill":
			case "invokeInstruction":
			case "finalize":
			case "note":
				break;
			default:
				return assertNever(step);
		}
	}

	return false;
}

function collectWorkflowSkillIds(steps: WorkflowStep[]): string[] {
	const skillIds: string[] = [];
	for (const step of steps) {
		switch (step.kind) {
			case "invokeSkill":
				skillIds.push(step.skillId);
				break;
			case "parallel":
			case "serial":
				skillIds.push(...collectWorkflowSkillIds(step.steps));
				break;
			case "gate":
				skillIds.push(
					...collectWorkflowSkillIds(step.ifTrue),
					...collectWorkflowSkillIds(step.ifFalse ?? []),
				);
				break;
			case "invokeInstruction":
			case "finalize":
			case "note":
				break;
			default:
				assertNever(step);
		}
	}
	return skillIds;
}

const COST_TIER_PRIORITY: Record<ModelProfile["costTier"], number> = {
	free: 0,
	cheap: 1,
	strong: 2,
	reviewer: 3,
};

function selectHighestPriorityProfile(
	profiles: ModelProfile[],
): ModelProfile | null {
	if (profiles.length === 0) {
		return null;
	}

	return profiles.reduce((selected, current) =>
		COST_TIER_PRIORITY[current.costTier] > COST_TIER_PRIORITY[selected.costTier]
			? current
			: selected,
	);
}

type InstructionRoutingSummary = {
	highestPriorityConfiguredModel: ModelProfile | null;
	hasConfiguredFanOut: boolean;
};

function summarizeInstructionRouting(
	steps: WorkflowStep[],
): InstructionRoutingSummary {
	const workflowSkillIds = collectWorkflowSkillIds(steps);
	const configuredSkillModels = workflowSkillIds
		.map((skillId) => tryResolveConfiguredSkillModel(skillId))
		.filter((profile): profile is ModelProfile => profile !== null);

	return {
		highestPriorityConfiguredModel: selectHighestPriorityProfile(
			configuredSkillModels,
		),
		hasConfiguredFanOut: workflowSkillIds.some((skillId) => {
			const routing = getDomainRouting(skillId);
			return routing !== null && getFanOut(routing.profile) > 1;
		}),
	};
}

function shouldUseStrongParallelSynthesisModel(
	instruction: InstructionManifestEntry,
	hasConfiguredFanOut: boolean,
): boolean {
	return (
		instruction.preferredModelClass === "strong" &&
		(hasParallelWorkload(instruction.workflow.steps) || hasConfiguredFanOut)
	);
}

export class ModelRouter {
	/** Returns the configured free-tier lanes in saturate-free order. */
	public chooseFreeParallelLanes(): [ModelProfile, ModelProfile, ModelProfile] {
		const freeProfiles = orderedModelIdsForClass("free")
			.map((modelId) => MODEL_PROFILES[modelId])
			.filter((profile): profile is ModelProfile => profile !== undefined);
		const primary = freeProfiles[0] ?? getDefaultModelForClass("free");
		const secondary = freeProfiles[1] ?? primary;
		return [primary, secondary, secondary];
	}

	private logConfigLoadFailure(error: unknown): void {
		modelRouterLogger.log("warn", "Failed to load model configuration", {
			error: error instanceof Error ? error.message : String(error),
		});
	}

	/**
	 * Resolves the best available model for a given skillId using the
	 * capability-driven three-layer config (Physical → Semantic → Application).
	 * Falls back to the first configured free-tier profile only if config yields nothing.
	 */
	public resolveForSkill(skillId: string): string {
		return configResolveForSkill(skillId);
	}

	/** Returns the profile name for a skill ID (e.g. "physics_analysis" for qm-*). */
	public getProfileForSkill(skillId: string): string {
		return getProfileForSkill(skillId);
	}

	/** Returns the parallel fan-out count for a skill's profile. */
	public getFanOut(skillId: string): number {
		return getFanOut(getProfileForSkill(skillId));
	}

	/** Returns full domain routing metadata (retries, human-in-loop, enforce_schema). */
	public getDomainRouting(skillId: string) {
		return getDomainRouting(skillId);
	}

	/** Returns the preferred synthesis profile from config-driven capability ordering. */
	public chooseSynthesisModel(): ModelProfile {
		return profileForCapabilityOrClass("synthesis", "strong");
	}

	/** Returns the preferred critique profile from config-driven capability ordering. */
	public chooseCritiqueModel(): ModelProfile {
		return profileForCapabilityOrClass("adversarial", "strong");
	}

	private initPromise: Promise<void> | null = null;

	/**
	 * Initialize the model router with configuration (called lazily).
	 * Resets `initPromise` on failure so a subsequent call can retry instead
	 * of permanently caching a rejected promise.
	 */
	private async ensureInitialized(): Promise<void> {
		if (!this.initPromise) {
			this.initPromise = modelAvailabilityService
				.loadConfig()
				.catch((err: unknown) => {
					this.initPromise = null;
					throw err;
				});
		}
		await this.initPromise;
	}

	chooseInstructionModel(
		instruction: InstructionManifestEntry,
		_input: InstructionInput,
	): ModelProfile {
		// Initialize in background if not already done
		this.ensureInitialized().catch((err) => this.logConfigLoadFailure(err));

		if (instruction.id === "review") {
			return this.chooseSynthesisModel();
		}

		const { highestPriorityConfiguredModel, hasConfiguredFanOut } =
			summarizeInstructionRouting(instruction.workflow.steps);

		if (
			shouldUseStrongParallelSynthesisModel(instruction, hasConfiguredFanOut)
		) {
			return this.chooseSynthesisModel();
		}

		return resolveModelByPrecedence(
			[() => highestPriorityConfiguredModel],
			() => profileForPreferredClass(instruction.preferredModelClass),
		);
	}

	chooseSkillModel(
		skill: SkillManifestEntry,
		_input: InstructionInput,
	): ModelProfile {
		return this.chooseSkillModelById(skill.id, skill.preferredModelClass);
	}

	routeSkillDecisionById(
		skillId: string,
		preferredModelClass?: ModelClass,
	): ModelRoutingDecision {
		// Initialize in background if not already done
		this.ensureInitialized().catch((err) => this.logConfigLoadFailure(err));

		try {
			const configuredModel = resolveConfiguredSkillModel(skillId);
			if (configuredModel) {
				return {
					selectedModelId: configuredModel.id,
					selectedProfile: configuredModel,
					rationale: `Configured domain routing resolved ${skillId} to ${configuredModel.id}.`,
				};
			}

			const explicitModel = getExplicitSkillModel(skillId);
			if (explicitModel) {
				return {
					selectedModelId: explicitModel.id,
					selectedProfile: explicitModel,
					rationale: `Explicit router override selected ${explicitModel.id} for ${skillId}.`,
				};
			}

			const fallbackModel = profileForPreferredClass(preferredModelClass);
			return {
				selectedModelId: fallbackModel.id,
				selectedProfile: fallbackModel,
				rationale: preferredModelClass
					? `Preferred model class ${preferredModelClass} selected default profile ${fallbackModel.id}.`
					: `Runtime boundary defaulted ${skillId} to free-tier profile ${fallbackModel.id}.`,
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "unknown routing failure";
			modelRouterLogger.log("warn", "Model router falling back for skill", {
				skillId,
				error: message,
			});
			const fallbackModel = profileForPreferredClass(preferredModelClass);
			return {
				selectedModelId: fallbackModel.id,
				selectedProfile: fallbackModel,
				rationale: preferredModelClass
					? `Routing failure for ${skillId} fell back to preferred class ${preferredModelClass} via ${fallbackModel.id}.`
					: `Routing failure for ${skillId} fell back to free-tier profile ${fallbackModel.id}.`,
				fallbackModelId: fallbackModel.id,
			};
		}
	}

	chooseSkillModelById(
		skillId: string,
		preferredModelClass?: ModelClass,
	): ModelProfile {
		return this.routeSkillDecisionById(skillId, preferredModelClass)
			.selectedProfile;
	}

	chooseReviewerModel(): ModelProfile {
		// Initialize in background if not already done
		this.ensureInitialized().catch((err) => this.logConfigLoadFailure(err));
		return profileForClass("reviewer");
	}

	/**
	 * Explicit initialization method for startup
	 */
	async initialize(): Promise<void> {
		await this.ensureInitialized();
	}

	/**
	 * Get model availability status
	 */
	getModelAvailability(modelId: string) {
		return modelAvailabilityService.checkAvailability(modelId);
	}

	/**
	 * Get availability service mode
	 */
	getAvailabilityMode() {
		return modelAvailabilityService.getMode();
	}
}
