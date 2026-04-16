/**
 * Orchestration runtime with concurrency control.
 *
 * Enhanced skill orchestration with concurrency control using p-limit/p-queue,
 * async execution patterns, and backpressure management.
 */

// Using p-queue instead of p-limit
import { randomUUID } from "node:crypto";
import PQueue from "p-queue";
import {
	getDomainRouting,
	getProfileForSkill,
	loadOrchestrationConfig,
} from "../config/orchestration-config.js";
import { DEFAULT_ORCHESTRATION_RUNTIME_CONFIG_VALUES } from "../config/runtime-defaults.js";
import type {
	InstructionInput,
	SkillExecutionResult,
	SkillExecutionRuntime,
} from "../contracts/runtime.js";
import {
	ObservabilityManager,
	StatisticalAnalyzer,
} from "../infrastructure/index.js";
import { calculateExponentialBackoffDelay } from "../infrastructure/retry-utilities.js";
import {
	getWorkflowErrorMessage,
	getWorkflowErrorType,
} from "../infrastructure/workflow-error-utilities.js";
import type { SkillRegistry } from "../skills/skill-registry.js";
import {
	createErrorContext,
	DependencyCycleError,
	ResourceError,
	toDomainError,
	withErrorBoundary,
} from "../validation/error-handling.js";
import {
	type ExecutionPlan,
	type PlanningGateService,
	type PlanningResult,
	planningGateService,
} from "./planning-gate.js";
import { type SkillCacheService, skillCacheService } from "./skill-cache.js";

/**
 * IO/service seams for `OrchestrationRuntime`.  All fields are optional;
 * omitting them falls back to the module-level singletons so existing
 * call-sites are unaffected.
 */
export interface OrchestrationRuntimeDeps {
	/** Cache service instance.  Defaults to the module-level `skillCacheService`. */
	cache?: SkillCacheService;
	/** Planning-gate service instance.  Defaults to the module-level `planningGateService`. */
	gate?: PlanningGateService;
}

export interface OrchestrationConfig {
	/** Maximum concurrent skill executions */
	maxConcurrency: number;
	/** Queue size limit before rejection */
	maxQueueSize: number;
	/** Default timeout for skill execution in ms */
	defaultTimeout: number;
	/** Enable priority-based scheduling */
	enablePriority: boolean;
	/** Enable result caching */
	enableCaching: boolean;
	/** Enable planning gate checks */
	enablePlanning: boolean;
	/** Retry configuration */
	retry: {
		attempts: number;
		backoffMs: number;
		maxBackoffMs: number;
	};
}

type OrchestrationConfigOverrides = Omit<
	Partial<OrchestrationConfig>,
	"retry"
> & {
	retry?: Partial<OrchestrationConfig["retry"]>;
};

export interface ExecutionContext {
	skillId: string;
	input: InstructionInput;
	plan?: ExecutionPlan;
	timeout: number;
	retryCount: number;
	startTime: number;
	dependencies: string[];
	sessionId?: string;
}

export interface ExecutionMetrics {
	totalExecutions: number;
	successfulExecutions: number;
	failedExecutions: number;
	cachedExecutions: number;
	fallbackExecutions: number;
	retryAttempts: number;
	averageLatency: number;
	p99Latency: number;
	queueSize: number;
	activeExecutions: number;
	successRate: number;
	cacheHitRate: number;
	fallbackFrequency: number;
	throughput: number; // executions per minute
}

export type ExecutionPriority = "low" | "normal" | "high" | "critical";

const DEFAULT_CONFIG: OrchestrationConfig = {
	...DEFAULT_ORCHESTRATION_RUNTIME_CONFIG_VALUES,
	retry: { ...DEFAULT_ORCHESTRATION_RUNTIME_CONFIG_VALUES.retry },
};

const _PRIORITY_VALUES: Record<ExecutionPriority, number> = {
	low: 1,
	normal: 5,
	high: 10,
	critical: 20,
};

const MAX_LATENCY_SAMPLES = 200;
const RUNTIME_METRICS_ENTITY_ID = "orchestration-runtime";

export class OrchestrationRuntime {
	private readonly config: OrchestrationConfig;
	private readonly queue: PQueue;
	private readonly skillRegistry: SkillRegistry;
	private readonly runtime: SkillExecutionRuntime;
	private metrics: ExecutionMetrics;
	private readonly latencySamples: number[] = [];
	private readonly throughputMeasurementStartedAt = Date.now();
	private readonly activeExecutions = new Map<string, ExecutionContext>();
	private readonly queuedExecutions = new Map<
		string,
		{
			reject: (error: Error) => void;
			context: ExecutionContext;
		}
	>();
	private isShuttingDown = false;
	private metricsCollectionInterval?: NodeJS.Timeout;
	private readonly queueListeners: {
		active: () => void;
		idle: () => void;
		error: (error: Error) => void;
	};
	private readonly observabilityManager: ObservabilityManager;
	private readonly statisticalAnalyzer: StatisticalAnalyzer;
	private readonly cacheService: SkillCacheService;
	private readonly planningService: PlanningGateService;

	constructor(
		skillRegistry: SkillRegistry,
		runtime: SkillExecutionRuntime,
		config: OrchestrationConfigOverrides = {},
		deps: OrchestrationRuntimeDeps = {},
	) {
		this.config = {
			...DEFAULT_CONFIG,
			...config,
			retry: {
				...DEFAULT_CONFIG.retry,
				...config.retry,
			},
		};
		this.skillRegistry = skillRegistry;
		this.runtime = runtime;
		this.cacheService = deps.cache ?? skillCacheService;
		this.planningService = deps.gate ?? planningGateService;

		this.observabilityManager = new ObservabilityManager({
			logLevel: "info",
			enableMetrics: true,
			enableTracing: true,
		});

		this.statisticalAnalyzer = new StatisticalAnalyzer();
		this.queueListeners = {
			active: () => {
				this.updateMetrics();
			},
			idle: () => {
				this.updateMetrics();
			},
			error: (error: Error) => {
				this.observabilityManager.log("error", "Queue execution error", {
					error: getWorkflowErrorMessage(error),
					errorType: getWorkflowErrorType(error),
					queueSize: this.queue.size,
					activeExecutions: this.activeExecutions.size,
				});
			},
		};

		// Initialize metrics
		this.metrics = {
			totalExecutions: 0,
			successfulExecutions: 0,
			failedExecutions: 0,
			cachedExecutions: 0,
			fallbackExecutions: 0,
			retryAttempts: 0,
			averageLatency: 0,
			p99Latency: 0,
			queueSize: 0,
			activeExecutions: 0,
			successRate: 0,
			cacheHitRate: 0,
			fallbackFrequency: 0,
			throughput: 0,
		};

		this.queue = new PQueue({
			concurrency: this.config.maxConcurrency,
			timeout: this.config.defaultTimeout,
		});

		// Set up queue event listeners
		this.setupQueueListeners();

		// Start metrics collection
		this.startMetricsCollection();
	}

	/**
	 * Execute a single skill with orchestration controls
	 */
	async executeSkill(
		skillId: string,
		input: InstructionInput,
		options: {
			priority?: ExecutionPriority;
			timeout?: number;
			sessionId?: string;
			bypassCache?: boolean;
			bypassPlanning?: boolean;
		} = {},
	): Promise<SkillExecutionResult> {
		const requestStartedAt = Date.now();
		const {
			priority = "normal",
			timeout = this.config.defaultTimeout,
			sessionId,
			bypassCache = false,
			bypassPlanning = false,
		} = options;

		const executionId = `${skillId}-${randomUUID()}`;

		// Check cache first if enabled
		if (this.config.enableCaching && !bypassCache) {
			const cached = await this.cacheService.get(skillId, input);
			if (cached) {
				this.recordExecutionCompletion({
					success: true,
					cached: true,
					latencyMs: Date.now() - requestStartedAt,
					status: "cache-hit",
				});
				return cached;
			}
		}

		this.assertRuntimeAcceptingWork(skillId, input, sessionId);

		const routing =
			this.runtime.modelRouter.getDomainRouting?.(skillId) ??
			getDomainRouting(skillId);
		const profileName =
			routing?.profile ??
			this.runtime.modelRouter.getProfileForSkill?.(skillId) ??
			getProfileForSkill(skillId);
		const profileConfig = loadOrchestrationConfig().profiles[profileName];
		if (!profileConfig) {
			throw new Error(
				`Execution of skill '${skillId}' references unknown orchestration profile '${profileName}'.`,
			);
		}
		const requireHuman =
			routing?.require_human_in_loop === true ||
			profileConfig.require_human_in_loop === true;
		if (requireHuman) {
			throw new Error(
				`Execution of skill '${skillId}' requires human in the loop (governance policy enforced at runtime).`,
			);
		}

		// Create execution context
		const context: ExecutionContext = {
			skillId,
			input,
			timeout,
			retryCount: 0,
			startTime: Date.now(),
			dependencies: [],
			sessionId,
		};

		// Planning gate check if enabled
		if (this.config.enablePlanning && !bypassPlanning) {
			const planningResult = await this.planningService.checkExecutionGate(
				skillId,
				input,
			);

			if (!planningResult.canExecute) {
				throw new Error(
					`Execution blocked by planning gate: ${planningResult.reason}`,
				);
			}

			if (planningResult.fallbackStrategy === "advisory") {
				// Return advisory result
				const advisoryResult = this.createAdvisoryResult(
					skillId,
					input,
					planningResult,
				);
				this.recordExecutionCompletion({
					success: true,
					fallback: true,
					latencyMs: Date.now() - requestStartedAt,
					status: "advisory-fallback",
				});
				return advisoryResult;
			}

			// Create execution plan
			context.plan =
				(await this.planningService.createExecutionPlan(skillId, input)) ??
				undefined;
		}

		this.assertQueueCapacity(skillId, input, sessionId);

		// Add to queue with priority
		return this.enqueueExecution(executionId, context, priority);
	}

	/**
	 * Execute multiple skills in parallel with dependency resolution
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
		} = {},
	): Promise<Map<string, SkillExecutionResult | Error>> {
		const {
			timeout = this.config.defaultTimeout * 2, // Longer timeout for batches
			sessionId,
			failFast = false,
		} = options;

		const results = new Map<string, SkillExecutionResult | Error>();
		const dependencyGraph = this.buildDependencyGraph(skills);
		const failedSkills = new Set<string>();
		const readySkills = this.findReadySkills(
			dependencyGraph,
			new Set(),
			failedSkills,
			skills,
		);
		const completedSkills = new Set<string>();

		while (
			readySkills.length > 0 ||
			completedSkills.size + failedSkills.size < skills.length
		) {
			if (readySkills.length === 0) {
				const remaining = skills.filter(
					(skill) =>
						!completedSkills.has(skill.skillId) &&
						!failedSkills.has(skill.skillId),
				);
				const blockedByFailedDependencies = remaining.filter((skill) =>
					(skill.dependencies ?? []).some((dependency) =>
						failedSkills.has(dependency),
					),
				);
				if (blockedByFailedDependencies.length > 0) {
					for (const skill of blockedByFailedDependencies) {
						const failedDependencies = (skill.dependencies ?? []).filter(
							(dependency) => failedSkills.has(dependency),
						);
						const error = toDomainError(
							new Error(
								`Skipped ${skill.skillId} because dependencies failed: ${failedDependencies.join(", ")}`,
							),
							createErrorContext(
								skill.skillId,
								undefined,
								undefined,
								sessionId,
							),
							{
								recoverable: false,
								suggestedAction:
									"Fix the failed dependency skills before retrying the batch.",
							},
						);
						results.set(skill.skillId, error);
						failedSkills.add(skill.skillId);
					}
					this.observabilityManager.log(
						"warn",
						"Batch execution skipped skills blocked by failed dependencies",
						{
							sessionId,
							blockedSkills: blockedByFailedDependencies.map(
								(skill) => skill.skillId,
							),
						},
					);
					continue;
				}

				if (remaining.length > 0) {
					const error = new DependencyCycleError(
						remaining.map((skill) => skill.skillId),
						createErrorContext(undefined, undefined, undefined, sessionId),
					);
					for (const skill of remaining) {
						results.set(skill.skillId, error);
						failedSkills.add(skill.skillId);
					}
					this.observabilityManager.log(
						"warn",
						"Batch execution halted by circular dependency",
						{
							sessionId,
							remainingSkills: remaining.map((skill) => skill.skillId),
						},
					);
				}
				break; // Break whether remaining is empty (all done) or not (errors set above)
			}

			// Execute ready skills in parallel
			const currentBatch = [...readySkills];
			readySkills.length = 0;

			const batchPromises = currentBatch.map(async (skill) => {
				try {
					const result = await this.executeSkill(skill.skillId, skill.input, {
						timeout,
						sessionId,
					});

					results.set(skill.skillId, result);
					completedSkills.add(skill.skillId);

					return { skillId: skill.skillId, success: true };
				} catch (error) {
					const err = toDomainError(
						error,
						createErrorContext(skill.skillId, undefined, undefined, sessionId),
					);
					results.set(skill.skillId, err);
					failedSkills.add(skill.skillId);
					this.observabilityManager.log(
						"warn",
						"Batch skill execution failed",
						{
							sessionId,
							skillId: skill.skillId,
							error: err.message,
							errorType: err.name,
							recoverable: err.recoverable,
						},
					);

					if (failFast) {
						throw err;
					}

					return { skillId: skill.skillId, success: false };
				}
			});

			try {
				await Promise.all(batchPromises);

				// Find newly ready skills
				const newlyReady = this.findReadySkills(
					dependencyGraph,
					completedSkills,
					failedSkills,
					skills,
				);
				readySkills.push(...newlyReady);
			} catch (error) {
				if (failFast) {
					throw error;
				}
			}
		}

		return results;
	}

	/**
	 * Execute skill with retry logic
	 */
	private async executeWithRetry(
		executionId: string,
		context: ExecutionContext,
	): Promise<SkillExecutionResult> {
		let lastError: Error | undefined;

		for (let attempt = 0; attempt <= this.config.retry.attempts; attempt++) {
			try {
				this.activeExecutions.set(executionId, context);
				this.updateMetrics();

				const result = await this.executeSingleSkill(context);

				// Cache the result if caching is enabled
				if (this.config.enableCaching) {
					await this.cacheService.set(context.skillId, context.input, result);
				}

				this.activeExecutions.delete(executionId);
				this.recordExecutionCompletion({
					success: true,
					latencyMs: Date.now() - context.startTime,
					status: "success",
				});

				return result;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				context.retryCount++;

				if (attempt < this.config.retry.attempts) {
					const retryDelayMs = this.calculateRetryDelay(attempt);
					this.metrics.retryAttempts++;
					this.observabilityManager.log("warn", "Retrying skill execution", {
						executionId,
						skillId: context.skillId,
						attempt: attempt + 1,
						maxAttempts: this.config.retry.attempts + 1,
						retryDelayMs,
						error: lastError.message,
						errorType: lastError.name,
					});
					this.recordMetric(
						"retry_attempts",
						this.metrics.retryAttempts,
						"count",
						{
							skillId: context.skillId,
							executionId,
						},
					);
					await this.sleep(retryDelayMs);
				}
			}
		}

		// All retries failed
		this.activeExecutions.delete(executionId);
		this.recordExecutionCompletion({
			success: false,
			latencyMs: Date.now() - context.startTime,
			status: "failure",
		});
		this.observabilityManager.log(
			"error",
			"Skill execution failed after retries",
			{
				executionId,
				skillId: context.skillId,
				attempts: this.config.retry.attempts + 1,
				retriesUsed: context.retryCount,
				error: lastError?.message,
				errorType: lastError?.name,
			},
		);

		throw lastError || new Error("Execution failed after all retries");
	}

	/**
	 * Execute a single skill without retry logic
	 */
	private async executeSingleSkill(
		context: ExecutionContext,
	): Promise<SkillExecutionResult> {
		const { skillId, input, plan, timeout } = context;

		// Get skill module
		const skillModule = this.skillRegistry.getById(skillId);
		if (!skillModule) {
			throw new Error(`Skill '${skillId}' not found in registry`);
		}

		// Create error context for execution
		const errorContext = createErrorContext(
			skillId,
			undefined, // instruction ID not available at this level
			plan?.selectedModel.id,
			context.sessionId,
			input.request,
		);

		// Execute with error boundary and timeout
		const result = await withErrorBoundary(async () => {
			const skill = this.skillRegistry.getById(skillId);
			if (!skill) {
				throw new Error(`Skill ${skillId} not found`);
			}
			return Promise.race([
				skill.run(input, this.skillRegistry.buildSkillRuntime(this.runtime)),
				this.createTimeoutPromise(timeout),
			]);
		}, errorContext);

		if (!result.success) {
			throw new Error(result.error.message);
		}

		return result.data;
	}

	/**
	 * Create advisory result when planning gate suggests advisory mode
	 */
	private createAdvisoryResult(
		skillId: string,
		_input: InstructionInput,
		planningResult: PlanningResult,
	): SkillExecutionResult {
		const skillModule = this.skillRegistry.getById(skillId);
		const displayName = skillModule?.manifest.displayName || skillId;

		return {
			skillId,
			displayName,
			model: {
				id: "advisory-mode",
				modelClass: "free",
				label: "Advisory Mode",
				strengths: ["advisory"],
				maxContextWindow: "small",
				costTier: "free",
			},
			summary: `Advisory execution of ${displayName}: ${planningResult.reason || "Model unavailable, providing guidance only"}`,
			recommendations: [
				{
					title: "Advisory Mode Active",
					detail:
						"This skill is running in advisory mode due to model availability constraints",
					modelClass: "free",
				},
			],
			relatedSkills: skillModule?.manifest.relatedSkills || [],
		};
	}

	private enqueueExecution(
		executionId: string,
		context: ExecutionContext,
		priority: ExecutionPriority,
	): Promise<SkillExecutionResult> {
		return new Promise((resolve, reject) => {
			this.queuedExecutions.set(executionId, { reject, context });
			this.updateMetrics();

			try {
				const queueOptions = this.config.enablePriority
					? { priority: _PRIORITY_VALUES[priority] }
					: undefined;
				const queuedPromise = this.queue.add(async () => {
					this.queuedExecutions.delete(executionId);
					this.updateMetrics();
					try {
						return await this.executeWithRetry(executionId, context);
					} finally {
						this.queuedExecutions.delete(executionId);
						this.updateMetrics();
					}
				}, queueOptions);

				queuedPromise.then(resolve, reject);
			} catch (error) {
				this.queuedExecutions.delete(executionId);
				this.updateMetrics();
				reject(error instanceof Error ? error : new Error(String(error)));
			}
		});
	}

	private assertRuntimeAcceptingWork(
		skillId: string,
		input: InstructionInput,
		sessionId?: string,
	): void {
		if (!this.isShuttingDown) {
			return;
		}

		throw new ResourceError(
			`orchestration runtime is shutting down; refusing new execution for '${skillId}'`,
			createErrorContext(
				skillId,
				undefined,
				undefined,
				sessionId,
				input.request,
			),
		);
	}

	private assertQueueCapacity(
		skillId: string,
		input: InstructionInput,
		sessionId?: string,
	): void {
		if (this.queue.size < this.config.maxQueueSize) {
			return;
		}

		throw new ResourceError(
			`orchestration queue capacity exceeded for '${skillId}' (${this.queue.size}/${this.config.maxQueueSize} queued, ${this.queue.pending} active)`,
			createErrorContext(
				skillId,
				undefined,
				undefined,
				sessionId,
				input.request,
			),
		);
	}

	private calculateRetryDelay(attempt: number): number {
		return calculateExponentialBackoffDelay(
			this.config.retry.backoffMs,
			attempt,
			{
				maxDelayMs: this.config.retry.maxBackoffMs,
				jitterMs: this.config.retry.backoffMs,
			},
		);
	}

	/**
	 * Create timeout promise
	 *
	 * Returns `Promise<never>` because this promise always rejects — it never
	 * resolves with a value.  The `never` return type lets TypeScript infer the
	 * enclosing `Promise.race` result type directly from the other branch,
	 * removing the need for a downstream `as SkillExecutionResult` cast.
	 */
	private createTimeoutPromise(timeoutMs: number): Promise<never> {
		return new Promise<never>((_, reject) => {
			const t = setTimeout(() => {
				reject(new Error(`Skill execution timed out after ${timeoutMs}ms`));
			}, timeoutMs);
			(t as NodeJS.Timeout).unref();
		});
	}

	/**
	 * Build dependency graph from skill batch
	 */
	private buildDependencyGraph(
		skills: Array<{
			skillId: string;
			input: InstructionInput;
			dependencies?: string[];
		}>,
	): Map<string, Set<string>> {
		const graph = new Map<string, Set<string>>();

		for (const skill of skills) {
			const deps = new Set(skill.dependencies || []);
			graph.set(skill.skillId, deps);
		}

		return graph;
	}

	/**
	 * Find skills ready for execution (all dependencies completed)
	 */
	private findReadySkills(
		dependencyGraph: Map<string, Set<string>>,
		completedSkills: Set<string>,
		failedSkills: Set<string>,
		originalSkills: Array<{
			skillId: string;
			input: InstructionInput;
			priority?: ExecutionPriority;
		}>,
	): Array<{
		skillId: string;
		input: InstructionInput;
		priority?: ExecutionPriority;
	}> {
		const ready: Array<{
			skillId: string;
			input: InstructionInput;
			priority?: ExecutionPriority;
		}> = [];
		for (const [skillId, dependencies] of dependencyGraph.entries()) {
			if (completedSkills.has(skillId) || failedSkills.has(skillId)) continue;
			const allDepsCompleted = [...dependencies].every((dep) =>
				completedSkills.has(dep),
			);
			if (allDepsCompleted) {
				// Find the original skill definition
				const orig = originalSkills.find((s) => s.skillId === skillId);
				if (orig) {
					ready.push({
						skillId: orig.skillId,
						input: orig.input,
						priority: orig.priority,
					});
				}
			}
		}
		return ready;
	}

	/**
	 * Set up queue event listeners
	 */
	private setupQueueListeners(): void {
		this.queue.on("active", this.queueListeners.active);
		this.queue.on("idle", this.queueListeners.idle);
		this.queue.on("error", this.queueListeners.error);
	}

	private teardownQueueListeners(): void {
		const queueWithOptionalEmitterMethods = this.queue as PQueue & {
			off?: (event: string, listener: (...args: unknown[]) => void) => unknown;
			removeListener?: (
				event: string,
				listener: (...args: unknown[]) => void,
			) => unknown;
		};
		const unregister =
			queueWithOptionalEmitterMethods.off?.bind(
				queueWithOptionalEmitterMethods,
			) ??
			queueWithOptionalEmitterMethods.removeListener?.bind(
				queueWithOptionalEmitterMethods,
			);

		if (!unregister) {
			return;
		}

		unregister("active", this.queueListeners.active);
		unregister("idle", this.queueListeners.idle);
		unregister("error", this.queueListeners.error);
	}

	/**
	 * Update runtime metrics
	 */
	private updateMetrics(): void {
		this.metrics.queueSize = this.queue.size;
		this.metrics.activeExecutions = this.activeExecutions.size;
		this.updateThroughputMetric();
		this.updateDerivedMetrics();
	}

	/**
	 * Update average latency metric
	 */
	private updateLatencyMetric(latency: number): void {
		const totalExecutions = this.metrics.totalExecutions;
		this.metrics.averageLatency =
			(this.metrics.averageLatency * (totalExecutions - 1) + latency) /
			totalExecutions;
		this.latencySamples.push(latency);
		if (this.latencySamples.length > MAX_LATENCY_SAMPLES) {
			this.latencySamples.splice(
				0,
				this.latencySamples.length - MAX_LATENCY_SAMPLES,
			);
		}
		this.metrics.p99Latency = this.computeLatencyPercentile(0.99);
	}

	/**
	 * Start metrics collection for throughput calculation
	 */
	private startMetricsCollection(): void {
		// .unref() prevents the timer from keeping the Node process alive (e.g. in tests)
		this.metricsCollectionInterval = setInterval(() => {
			this.updateThroughputMetric();
		}, 60000);
		this.metricsCollectionInterval.unref();
	}

	private stopMetricsCollection(): void {
		if (!this.metricsCollectionInterval) {
			return;
		}

		clearInterval(this.metricsCollectionInterval);
		this.metricsCollectionInterval = undefined;
	}

	private updateThroughputMetric(now = Date.now()): void {
		if (this.metrics.successfulExecutions === 0) {
			this.metrics.throughput = 0;
			return;
		}

		const elapsedMs = now - this.throughputMeasurementStartedAt;
		if (elapsedMs <= 0) {
			this.metrics.throughput = 0;
			return;
		}

		this.metrics.throughput =
			(this.metrics.successfulExecutions / elapsedMs) * 60000;
	}

	private updateDerivedMetrics(): void {
		if (this.metrics.totalExecutions === 0) {
			this.metrics.successRate = 0;
			this.metrics.cacheHitRate = 0;
			this.metrics.fallbackFrequency = 0;
			if (this.latencySamples.length === 0) {
				this.metrics.p99Latency = 0;
			}
			return;
		}

		this.metrics.successRate =
			this.metrics.successfulExecutions / this.metrics.totalExecutions;
		this.metrics.cacheHitRate =
			this.metrics.cachedExecutions / this.metrics.totalExecutions;
		this.metrics.fallbackFrequency =
			this.metrics.fallbackExecutions / this.metrics.totalExecutions;
	}

	private computeLatencyPercentile(percentile: number): number {
		if (this.latencySamples.length === 0) {
			return 0;
		}

		const sorted = [...this.latencySamples].sort((left, right) => left - right);
		const index = Math.min(
			sorted.length - 1,
			Math.max(0, Math.ceil(sorted.length * percentile) - 1),
		);
		return sorted[index] ?? 0;
	}

	private recordExecutionCompletion({
		success,
		cached = false,
		fallback = false,
		latencyMs,
		status,
	}: {
		success: boolean;
		cached?: boolean;
		fallback?: boolean;
		latencyMs: number;
		status: "success" | "failure" | "cache-hit" | "advisory-fallback";
	}): void {
		this.metrics.totalExecutions++;
		if (success) {
			this.metrics.successfulExecutions++;
		} else {
			this.metrics.failedExecutions++;
		}
		if (cached) {
			this.metrics.cachedExecutions++;
		}
		if (fallback) {
			this.metrics.fallbackExecutions++;
		}
		this.updateLatencyMetric(latencyMs);
		this.updateMetrics();
		this.recordMetric("execution_latency", latencyMs, "milliseconds", {
			status,
		});
		this.recordMetric("success_rate", this.metrics.successRate, "ratio");
		this.recordMetric("cache_hit_rate", this.metrics.cacheHitRate, "ratio");
		this.recordMetric(
			"fallback_frequency",
			this.metrics.fallbackFrequency,
			"ratio",
		);
		this.recordMetric("p99_latency", this.metrics.p99Latency, "milliseconds");
	}

	private recordMetric(
		metricName: string,
		value: number,
		unit: string,
		metadata?: Record<string, unknown>,
	): void {
		const metric = {
			entityId: RUNTIME_METRICS_ENTITY_ID,
			metricName,
			name: metricName,
			value,
			unit,
			timestamp: Date.now(),
			metadata,
		};
		this.observabilityManager.recordMetric(metric);
		this.statisticalAnalyzer.recordMetric(RUNTIME_METRICS_ENTITY_ID, metric);
	}

	/**
	 * Sleep utility for backoff
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			const t = setTimeout(resolve, ms);
			(t as NodeJS.Timeout).unref();
		});
	}

	/**
	 * Get current metrics
	 */
	getMetrics(): ExecutionMetrics {
		this.updateMetrics();
		return { ...this.metrics };
	}

	/**
	 * Get configuration
	 */
	getConfig(): OrchestrationConfig {
		return { ...this.config };
	}

	/**
	 * Update configuration
	 */
	updateConfig(newConfig: OrchestrationConfigOverrides): void {
		Object.assign(this.config, newConfig);
		if (newConfig.retry) {
			Object.assign(this.config.retry, newConfig.retry);
		}

		// Update queue settings if changed
		if (newConfig.maxConcurrency !== undefined) {
			this.queue.concurrency = newConfig.maxConcurrency;
		}

		if (newConfig.defaultTimeout !== undefined) {
			this.queue.timeout = newConfig.defaultTimeout;
		}
	}

	/**
	 * Clear all queued and active executions
	 */
	async shutdown(): Promise<void> {
		this.isShuttingDown = true;
		this.stopMetricsCollection();
		this.teardownQueueListeners();
		this.rejectQueuedExecutions();
		this.queue.clear();
		await this.queue.onIdle();
		this.activeExecutions.clear();
		this.queuedExecutions.clear();
		this.updateMetrics();
	}

	private rejectQueuedExecutions(): void {
		for (const [
			executionId,
			queuedExecution,
		] of this.queuedExecutions.entries()) {
			queuedExecution.reject(
				new ResourceError(
					`orchestration runtime shut down before '${queuedExecution.context.skillId}' could start`,
					createErrorContext(
						queuedExecution.context.skillId,
						undefined,
						queuedExecution.context.plan?.selectedModel.id,
						queuedExecution.context.sessionId,
						queuedExecution.context.input.request,
					),
				),
			);
			this.queuedExecutions.delete(executionId);
		}
		this.updateMetrics();
	}

	/**
	 * Get detailed runtime information
	 */
	getRuntimeInfo(): {
		config: OrchestrationConfig;
		metrics: ExecutionMetrics;
		activeExecutions: Array<{ id: string; skillId: string; duration: number }>;
		queuedExecutions: number;
	} {
		const now = Date.now();
		const activeExecutions = Array.from(this.activeExecutions.entries()).map(
			([id, context]) => ({
				id,
				skillId: context.skillId,
				duration: now - context.startTime,
			}),
		);

		return {
			config: this.getConfig(),
			metrics: this.getMetrics(),
			activeExecutions,
			queuedExecutions: this.queue.size,
		};
	}
}
