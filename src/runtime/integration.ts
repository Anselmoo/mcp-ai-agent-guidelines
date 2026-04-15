/**
 * Runtime integration for orchestration, caching, planning gates, and validation.
 */

import { DEFAULT_INTEGRATED_RUNTIME_CONFIG_VALUES } from "../config/runtime-defaults.js";
import type {
	InstructionInput,
	SkillExecutionResult,
	SkillExecutionRuntime,
} from "../contracts/runtime.js";
import { modelAvailabilityService } from "../models/model-availability.js";
import type { SkillRegistry } from "../skills/skill-registry.js";
import { assertPhysicsSkillQuorum } from "../tools/quorum-gate.js";
import { skillRequestSchema } from "../validation/core-schemas.js";
import { createErrorContext } from "../validation/error-handling.js";
import {
	type ValidationOptions,
	validateSkillInput,
} from "../validation/input-guards.js";
import {
	type ExecutionPriority,
	type OrchestrationConfig,
	OrchestrationRuntime,
} from "./orchestration-runtime.js";
import {
	type PlanningGateConfig,
	type PlanningGateService,
	planningGateService,
} from "./planning-gate.js";
import {
	type CacheConfig,
	type SkillCacheService,
	skillCacheService,
} from "./skill-cache.js";

/**
 * Optional service seams for `IntegratedSkillRuntime`.  Defaults to the
 * module-level singletons so all existing call-sites remain unaffected.
 */
export interface IntegratedRuntimeDeps {
	/** Cache service instance.  Defaults to the module-level `skillCacheService`. */
	cache?: SkillCacheService;
	/** Planning-gate service instance.  Defaults to the module-level `planningGateService`. */
	gate?: PlanningGateService;
}

function writeRuntimeDiagnostic(message: string, detail?: unknown) {
	const suffix =
		detail === undefined
			? ""
			: ` ${detail instanceof Error ? (detail.stack ?? detail.message) : JSON.stringify(detail, null, 2)}`;
	process.stderr.write(`${message}${suffix}\n`);
}

export interface RuntimeIntegrationConfig {
	orchestration: Partial<OrchestrationConfig>;
	caching: Partial<CacheConfig>;
	planning: Partial<PlanningGateConfig>;
	validation: ValidationOptions;
	/** Enable orchestrated execution globally */
	enableOrchestration: boolean;
	/** Fallback to direct execution when orchestrated execution fails */
	fallbackToDirectExecution: boolean;
	/** @deprecated Use enableOrchestration instead. */
	enableWave3?: boolean;
	/** @deprecated Use fallbackToDirectExecution instead. */
	fallbackToWave2?: boolean;
}

export interface IntegratedExecutionResult {
	result: SkillExecutionResult;
	metadata: {
		executionMode: "orchestrated" | "direct" | "cached";
		latencyMs: number;
		fromCache: boolean;
		planningGateUsed: boolean;
		validationWarnings: string[];
		modelUsed: string;
		retryCount?: number;
	};
}

type RuntimeStatus = {
	orchestrationEnabled: boolean;
	modelAvailabilityMode: "advisory" | "configured";
	orchestrationMetrics?: ReturnType<OrchestrationRuntime["getMetrics"]>;
	cacheStats?: ReturnType<SkillCacheService["getStats"]>;
	planningConfig?: ReturnType<PlanningGateService["getConfig"]>;
};

const DEFAULT_INTEGRATION_CONFIG: RuntimeIntegrationConfig = {
	...DEFAULT_INTEGRATED_RUNTIME_CONFIG_VALUES,
	orchestration: { ...DEFAULT_INTEGRATED_RUNTIME_CONFIG_VALUES.orchestration },
	caching: { ...DEFAULT_INTEGRATED_RUNTIME_CONFIG_VALUES.caching },
	planning: { ...DEFAULT_INTEGRATED_RUNTIME_CONFIG_VALUES.planning },
	validation: { ...DEFAULT_INTEGRATED_RUNTIME_CONFIG_VALUES.validation },
};

export class IntegratedSkillRuntime {
	private readonly config: RuntimeIntegrationConfig;
	private readonly skillRegistry: SkillRegistry;
	private readonly orchestrationRuntime!: OrchestrationRuntime;
	private readonly baseRuntime: SkillExecutionRuntime;
	private readonly isOrchestrationEnabled: boolean;
	private readonly cacheService: SkillCacheService;
	private readonly planningService: PlanningGateService;

	constructor(
		skillRegistry: SkillRegistry,
		baseRuntime: SkillExecutionRuntime,
		config: Partial<RuntimeIntegrationConfig> = {},
		deps: IntegratedRuntimeDeps = {},
	) {
		this.config = {
			...DEFAULT_INTEGRATION_CONFIG,
			...config,
			orchestration: {
				...DEFAULT_INTEGRATION_CONFIG.orchestration,
				...config.orchestration,
			},
			caching: {
				...DEFAULT_INTEGRATION_CONFIG.caching,
				...config.caching,
			},
			planning: {
				...DEFAULT_INTEGRATION_CONFIG.planning,
				...config.planning,
			},
			validation: {
				...DEFAULT_INTEGRATION_CONFIG.validation,
				...config.validation,
			},
			enableOrchestration:
				config.enableOrchestration ??
				config.enableWave3 ??
				DEFAULT_INTEGRATION_CONFIG.enableOrchestration,
			fallbackToDirectExecution:
				config.fallbackToDirectExecution ??
				config.fallbackToWave2 ??
				DEFAULT_INTEGRATION_CONFIG.fallbackToDirectExecution,
		};
		this.skillRegistry = skillRegistry;
		this.baseRuntime = baseRuntime;
		this.cacheService = deps.cache ?? skillCacheService;
		this.planningService = deps.gate ?? planningGateService;

		// Initialize orchestrated execution systems
		this.isOrchestrationEnabled = this.config.enableOrchestration;

		if (this.isOrchestrationEnabled) {
			// Configure caching service
			this.cacheService.updateConfig(this.config.caching);

			// Configure planning gate
			this.planningService.updateConfig(this.config.planning);

			// Initialize orchestration runtime
			this.orchestrationRuntime = new OrchestrationRuntime(
				this.skillRegistry,
				this.baseRuntime,
				this.config.orchestration,
				{ cache: this.cacheService, gate: this.planningService },
			);
		}
	}

	/**
	 * Execute a skill with orchestration, caching, planning, and validation.
	 */
	async executeSkill(
		skillId: string,
		input: InstructionInput,
		options: {
			priority?: ExecutionPriority;
			timeout?: number;
			sessionId?: string;
			bypassCache?: boolean;
			forceDirectExecution?: boolean;
			forceWave2?: boolean;
		} = {},
	): Promise<IntegratedExecutionResult> {
		const startTime = Date.now();
		const forceDirectExecution =
			options.forceDirectExecution ?? options.forceWave2 ?? false;
		const executionOptions = {
			priority: options.priority,
			timeout: options.timeout,
			sessionId: options.sessionId,
			bypassCache: options.bypassCache,
		};

		// Always validate input first.
		const validationResult = await validateSkillInput(
			input,
			skillRequestSchema,
			createErrorContext(skillId, undefined, undefined, options.sessionId),
			this.config.validation,
		);

		if (!validationResult.success) {
			throw new Error(
				`Input validation failed: ${validationResult.errors.join(", ")}`,
			);
		}
		const validatedInput = validationResult.data;
		if (!validatedInput) {
			throw new Error(
				"Validated input was not returned by the validation service",
			);
		}

		assertPhysicsSkillQuorum(
			skillId,
			validatedInput.request,
			typeof validatedInput.physicsAnalysisJustification === "string"
				? validatedInput.physicsAnalysisJustification
				: undefined,
		);

		const validationWarnings = validationResult.warnings;

		// Decide execution path
		const useOrchestration =
			this.isOrchestrationEnabled && !forceDirectExecution;

		if (useOrchestration) {
			try {
				return await this.executeWithOrchestration(
					skillId,
					validatedInput,
					executionOptions,
					validationWarnings,
					startTime,
				);
			} catch (error) {
				if (this.config.fallbackToDirectExecution) {
					writeRuntimeDiagnostic(
						`Orchestrated execution failed for ${skillId}, falling back to direct execution:`,
						error,
					);
					return await this.executeWithDirectExecution(
						skillId,
						validatedInput,
						executionOptions,
						validationWarnings,
						startTime,
					);
				}
				throw error;
			}
		} else {
			return await this.executeWithDirectExecution(
				skillId,
				validatedInput,
				executionOptions,
				validationWarnings,
				startTime,
			);
		}
	}

	/**
	 * Execute skill using orchestration runtime.
	 */
	private async executeWithOrchestration(
		skillId: string,
		input: InstructionInput,
		options: {
			priority?: ExecutionPriority;
			timeout?: number;
			sessionId?: string;
			bypassCache?: boolean;
		},
		validationWarnings: string[],
		startTime: number,
	): Promise<IntegratedExecutionResult> {
		// Check cache first unless bypassed
		const fromCache = !options.bypassCache;
		if (fromCache) {
			const cached = await this.cacheService.get(skillId, input);
			if (cached) {
				return {
					result: cached,
					metadata: {
						executionMode: "cached",
						latencyMs: Date.now() - startTime,
						fromCache: true,
						planningGateUsed: false,
						validationWarnings,
						modelUsed: cached.model.id,
						retryCount: 0,
					},
				};
			}
		}

		// Execute through orchestration runtime
		const result = await this.orchestrationRuntime.executeSkill(
			skillId,
			input,
			{
				priority: options.priority,
				timeout: options.timeout,
				sessionId: options.sessionId,
				bypassCache: options.bypassCache,
				bypassPlanning: false,
			},
		);

		return {
			result,
			metadata: {
				executionMode: "orchestrated",
				latencyMs: Date.now() - startTime,
				fromCache: false,
				planningGateUsed: true,
				validationWarnings,
				modelUsed: result.model.id,
			},
		};
	}

	/**
	 * Execute skill using direct registry fallback.
	 */
	private async executeWithDirectExecution(
		skillId: string,
		input: InstructionInput,
		_options: {
			priority?: ExecutionPriority;
			timeout?: number;
			sessionId?: string;
			bypassCache?: boolean;
		},
		validationWarnings: string[],
		startTime: number,
	): Promise<IntegratedExecutionResult> {
		// Use direct skill registry execution.
		const skill = this.skillRegistry.getById(skillId);
		if (!skill) {
			throw new Error(`Skill ${skillId} not found`);
		}
		// Enrich the base runtime with the registry's workspace/workspaceSurface
		// so the skill receives the full substrate even in the direct path.
		const enrichedRuntime = this.skillRegistry.buildSkillRuntime(
			this.baseRuntime,
		);
		const result = await skill.run(input, enrichedRuntime);

		return {
			result,
			metadata: {
				executionMode: "direct",
				latencyMs: Date.now() - startTime,
				fromCache: false,
				planningGateUsed: false,
				validationWarnings,
				modelUsed: result.model.id,
				retryCount: 0,
			},
		};
	}

	/**
	 * Execute multiple skills in parallel using the orchestration runtime.
	 */
	async executeSkillBatch(
		skills: Array<{
			skillId: string;
			input: InstructionInput;
			priority?: ExecutionPriority;
			dependencies?: string[];
		}>,
		options: {
			timeout?: number;
			sessionId?: string;
			failFast?: boolean;
			forceDirectExecution?: boolean;
			forceWave2?: boolean;
		} = {},
	): Promise<Map<string, IntegratedExecutionResult | Error>> {
		if (
			!this.isOrchestrationEnabled ||
			options.forceDirectExecution ||
			options.forceWave2
		) {
			// Fallback to sequential direct execution.
			const results = new Map<string, IntegratedExecutionResult | Error>();

			for (const skill of skills) {
				try {
					const result = await this.executeSkill(skill.skillId, skill.input, {
						priority: skill.priority,
						timeout: options.timeout,
						sessionId: options.sessionId,
						forceDirectExecution: true,
					});
					results.set(skill.skillId, result);
				} catch (error) {
					const err = error instanceof Error ? error : new Error(String(error));
					results.set(skill.skillId, err);

					if (options.failFast) {
						break;
					}
				}
			}

			return results;
		}

		// Use orchestrated batch execution.
		const batchStartTime = Date.now();
		const batchResults = await this.orchestrationRuntime.executeSkillBatch(
			skills,
			{
				timeout: options.timeout,
				sessionId: options.sessionId,
				failFast: options.failFast,
			},
		);

		// Convert to integrated results.
		const integratedResults = new Map<
			string,
			IntegratedExecutionResult | Error
		>();

		for (const [skillId, result] of batchResults.entries()) {
			if (result instanceof Error) {
				integratedResults.set(skillId, result);
			} else {
				integratedResults.set(skillId, {
					result,
					metadata: {
						executionMode: "orchestrated",
						latencyMs: Date.now() - batchStartTime,
						fromCache: false,
						planningGateUsed: true,
						validationWarnings: [],
						modelUsed: result.model.id,
					},
				});
			}
		}

		return integratedResults;
	}

	/**
	 * Initialize runtime with model availability check
	 */
	async initialize(): Promise<void> {
		// Load model availability configuration
		await modelAvailabilityService.loadConfig();

		// Validate that required models are available
		const mode = modelAvailabilityService.getMode();

		if (mode === "configured" && this.isOrchestrationEnabled) {
			writeRuntimeDiagnostic(
				"Orchestrated runtime initialized with configured model availability",
			);
		} else if (mode === "advisory") {
			writeRuntimeDiagnostic(
				"Runtime is running in advisory mode; some orchestration features may be limited",
			);
		}

		if (this.config.orchestration.enableCaching) {
			writeRuntimeDiagnostic(
				"Skill caching enabled with config:",
				this.cacheService.getConfig(),
			);
		}

		if (this.config.planning.enabled) {
			writeRuntimeDiagnostic(
				"Planning gate enabled with config:",
				this.planningService.getConfig(),
			);
		}
	}

	/**
	 * Get runtime health and status
	 */
	getStatus(): RuntimeStatus {
		return {
			orchestrationEnabled: this.isOrchestrationEnabled,
			modelAvailabilityMode: modelAvailabilityService.getMode(),
			...(this.isOrchestrationEnabled && {
				orchestrationMetrics: this.orchestrationRuntime.getMetrics(),
				cacheStats: this.cacheService.getStats(),
				planningConfig: this.planningService.getConfig(),
			}),
		};
	}

	/**
	 * Update runtime configuration
	 */
	updateConfig(newConfig: Partial<RuntimeIntegrationConfig>): void {
		Object.assign(this.config, newConfig);

		if (this.isOrchestrationEnabled) {
			if (newConfig.orchestration) {
				this.orchestrationRuntime.updateConfig(newConfig.orchestration);
			}

			if (newConfig.caching) {
				this.cacheService.updateConfig(newConfig.caching);
			}

			if (newConfig.planning) {
				this.planningService.updateConfig(newConfig.planning);
			}
		}
	}

	/**
	 * Clear caches and reset runtime state
	 */
	async reset(): Promise<void> {
		if (this.isOrchestrationEnabled) {
			await this.cacheService.clear();
			await this.orchestrationRuntime.shutdown();
		}
	}

	/**
	 * Gracefully shutdown the runtime
	 */
	async shutdown(): Promise<void> {
		if (this.isOrchestrationEnabled) {
			await this.orchestrationRuntime.shutdown();
		}
	}
}

/**
 * Factory function to create integrated runtime
 */
export function createIntegratedRuntime(
	skillRegistry: SkillRegistry,
	baseRuntime: SkillExecutionRuntime,
	config?: Partial<RuntimeIntegrationConfig>,
	deps?: IntegratedRuntimeDeps,
): IntegratedSkillRuntime {
	return new IntegratedSkillRuntime(skillRegistry, baseRuntime, config, deps);
}
