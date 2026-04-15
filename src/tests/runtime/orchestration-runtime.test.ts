/**
 * Tests for orchestration runtime components.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	ModelClass,
	SkillManifestEntry,
} from "../../contracts/generated.js";
import type {
	InstructionInput,
	SkillExecutionResult,
	SkillExecutionRuntime,
} from "../../contracts/runtime.js";
import {
	createIntegratedRuntime,
	type IntegratedSkillRuntime,
} from "../../runtime/integration.js";
import { OrchestrationRuntime } from "../../runtime/orchestration-runtime.js";
import { PlanningGateService } from "../../runtime/planning-gate.js";
import { SkillCacheService } from "../../runtime/skill-cache.js";
import { SkillRegistry } from "../../skills/skill-registry.js";
import {
	DependencyCycleError,
	ResourceError,
	SkillExecutionError,
} from "../../validation/error-handling.js";

// Mock implementations
const mockSkillModule = {
	manifest: {
		id: "test-skill",
		canonicalId: "test-skill",
		displayName: "Test Skill",
		description: "A test skill",
		domain: "core",
		sourcePath: "",
		purpose: "",
		relatedSkills: [],
		triggerPhrases: [],
		antiTriggerPhrases: [],
		usageSteps: [],
		intakeQuestions: [],
		outputContract: [],
		recommendationHints: [],
		preferredModelClass: "free" as ModelClass,
	} satisfies SkillManifestEntry,
	handler: {
		async execute(input: InstructionInput): Promise<SkillExecutionResult> {
			return {
				skillId: "test-skill",
				displayName: "Test Skill",
				model: {
					id: "test-model",
					modelClass: "free" as const,
					label: "Test Model",
					strengths: ["test"],
					maxContextWindow: "large" as const,
					costTier: "free" as const,
				},
				summary: `Test execution for: ${input.request}`,
				recommendations: [],
				relatedSkills: [],
			};
		},
	},
	run: async (input: InstructionInput): Promise<SkillExecutionResult> => {
		return {
			skillId: "test-skill",
			displayName: "Test Skill",
			model: {
				id: "test-model",
				modelClass: "free" as const,
				label: "Test Model",
				strengths: ["test"],
				maxContextWindow: "large" as const,
				costTier: "free" as const,
			},
			summary: `Test execution for: ${input.request}`,
			recommendations: [],
			relatedSkills: [],
		};
	},
};

const mockSkillModule2 = {
	...mockSkillModule,
	manifest: {
		...mockSkillModule.manifest,
		id: "test-skill-2",
		canonicalId: "test-skill-2",
		displayName: "Test Skill 2",
		description: "A second test skill",
	} satisfies SkillManifestEntry,
};

const mockRuntime: SkillExecutionRuntime = {
	modelRouter: {
		chooseSkillModel: vi.fn().mockReturnValue({
			id: "test-model",
			modelClass: "free",
			label: "Test Model",
			strengths: ["test"],
			maxContextWindow: "large",
			costTier: "free",
		}),
		getDomainRouting: vi.fn().mockReturnValue(null),
		getProfileForSkill: vi.fn().mockReturnValue("default"),
	},
	workspace: {
		readFile: vi.fn(),
		listFiles: vi.fn(),
	},
};

function createDeferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

type OrchestrationRuntimeInternals = {
	sleep: (ms: number) => Promise<void>;
	executeSingleSkill: (
		context: Record<string, unknown>,
	) => Promise<SkillExecutionResult>;
	executeWithRetry: (
		executionId: string,
		context: Record<string, unknown>,
	) => Promise<SkillExecutionResult>;
	queue: {
		off: (event: string, listener: (...args: unknown[]) => void) => unknown;
	};
	queueListeners: {
		error: (error: Error) => void;
	};
	observabilityManager: {
		log: (
			level: "debug" | "info" | "warn" | "error",
			message: string,
			context?: Record<string, unknown>,
		) => void;
	};
};

function createBlockingSkill(skillId = "blocking-skill") {
	const started = createDeferred<void>();
	const release = createDeferred<void>();
	const runOrder: string[] = [];

	return {
		started,
		release,
		runOrder,
		module: {
			...mockSkillModule,
			manifest: {
				...mockSkillModule.manifest,
				id: skillId,
				canonicalId: skillId,
				displayName: `${skillId} label`,
				description: "A skill that blocks until released",
			} satisfies SkillManifestEntry,
			run: vi.fn(
				async (input: InstructionInput): Promise<SkillExecutionResult> => {
					runOrder.push(input.request);
					if (runOrder.length === 1) {
						started.resolve();
					}
					await release.promise;
					return {
						...(await mockSkillModule.run(input)),
						skillId,
						displayName: `${skillId} label`,
					};
				},
			),
		},
	};
}

describe("SkillCacheService", () => {
	let cacheService: SkillCacheService;

	beforeEach(() => {
		cacheService = new SkillCacheService({
			maxSize: 10,
			defaultTtl: 1, // 1 second for testing
			enableStats: true,
		});
	});

	afterEach(async () => {
		await cacheService.clear();
	});

	it("should cache and retrieve skill results", async () => {
		const skillId = "test-skill";
		const input: InstructionInput = { request: "test request" };
		const result = mockSkillModule.handler.execute(input);

		// Cache the result
		await cacheService.set(skillId, input, await result);

		// Retrieve from cache
		const cached = await cacheService.get(skillId, input);
		expect(cached).toBeDefined();
		expect(cached?.summary).toContain("test request");
	});

	it("should return null for cache miss", async () => {
		const cached = await cacheService.get("nonexistent", { request: "test" });
		expect(cached).toBeNull();
	});

	it("should expire cached results", async () => {
		// Use a cache with very short TTL and LRU disabled so NodeCacheCompat TTL fires
		const shortTtlCache = new SkillCacheService({
			maxSize: 10,
			defaultTtl: 0.1, // 100ms TTL
			enableLru: false,
			enableStats: true,
		});
		const skillId = "test-skill";
		const input: InstructionInput = { request: "test request" };
		const result = mockSkillModule.handler.execute(input);

		await shortTtlCache.set(skillId, input, await result);

		// Should be available immediately
		let cached = await shortTtlCache.get(skillId, input);
		expect(cached).toBeDefined();

		// Wait for expiration (120ms > 100ms TTL)
		await new Promise((resolve) => setTimeout(resolve, 120));

		// Should be expired
		cached = await shortTtlCache.get(skillId, input);
		expect(cached).toBeNull();
	});

	it("should track cache statistics", async () => {
		const skillId = "test-skill";
		const input: InstructionInput = { request: "test request" };
		const result = mockSkillModule.handler.execute(input);

		// Start with empty stats
		let stats = cacheService.getStats();
		expect(stats.hits).toBe(0);
		expect(stats.misses).toBe(0);

		// Cache miss should increment misses
		await cacheService.get(skillId, input);
		stats = cacheService.getStats();
		expect(stats.misses).toBe(1);

		// Cache the result
		await cacheService.set(skillId, input, await result);

		// Cache hit should increment hits
		await cacheService.get(skillId, input);
		stats = cacheService.getStats();
		expect(stats.hits).toBe(1);
	});

	it("should invalidate cache by skill", async () => {
		const result = mockSkillModule.handler.execute({ request: "test" });

		// Cache two entries for "test-skill" (different inputs → different hash keys)
		await cacheService.set("test-skill", { request: "first" }, await result);
		await cacheService.set("test-skill", { request: "second" }, await result);
		await cacheService.set("other-skill", { request: "test" }, await result);

		// Verify all cached
		expect(
			await cacheService.get("test-skill", { request: "first" }),
		).toBeDefined();
		expect(
			await cacheService.get("test-skill", { request: "second" }),
		).toBeDefined();
		expect(
			await cacheService.get("other-skill", { request: "test" }),
		).toBeDefined();

		// Invalidate test-skill entries (exact skillId match)
		const deleted = await cacheService.invalidate("skill-based", "test-skill");
		expect(deleted).toBe(2);

		// Verify test-skill entries are gone
		expect(
			await cacheService.get("test-skill", { request: "first" }),
		).toBeNull();
		expect(
			await cacheService.get("test-skill", { request: "second" }),
		).toBeNull();

		// Verify other-skill is still cached
		expect(
			await cacheService.get("other-skill", { request: "test" }),
		).toBeDefined();
	});

	it("preserves default retry settings when only one retry override is provided", () => {
		const registry = new SkillRegistry({
			modules: [mockSkillModule],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			retry: { attempts: 7 },
		}) as unknown as {
			config: {
				retry: { attempts: number; backoffMs: number; maxBackoffMs: number };
			};
		};

		expect(runtime.config.retry).toEqual({
			attempts: 7,
			backoffMs: 1000,
			maxBackoffMs: 10000,
		});
	});
});

describe("PlanningGateService", () => {
	let planningService: PlanningGateService;

	beforeEach(() => {
		planningService = new PlanningGateService({
			enabled: true,
			advisoryFallback: true,
		});
	});

	it("should allow execution for simple skills", async () => {
		const result = await planningService.checkExecutionGate("req-analysis", {
			request: "Analyze requirements",
		});

		expect(result.canExecute).toBe(true);
	});

	it("should provide advisory mode for physics skills", async () => {
		const result = await planningService.checkExecutionGate(
			"qm-superposition",
			{
				request: "Test quantum skill",
			},
		);

		expect(result.canExecute).toBe(true);
		expect(result.fallbackStrategy).toBe("advisory");
	});

	it("should create execution plans", async () => {
		const plan = await planningService.createExecutionPlan("debug-assistant", {
			request: "Debug this issue",
		});

		expect(plan).toBeDefined();
		expect(plan?.skillId).toBe("debug-assistant");
		expect(plan?.executionMode).toBe("full");
	});

	it("should estimate resource usage", async () => {
		const plan = await planningService.createExecutionPlan("synth-research", {
			request:
				"Research this topic in great detail with many sources and complex analysis",
		});

		expect(plan).toBeDefined();
		expect(plan?.estimatedResources.computeUnits).toBeGreaterThan(1);
		expect(plan?.estimatedResources.memoryMb).toBeGreaterThan(500);
	});
});

describe("OrchestrationRuntime", () => {
	let orchestrationRuntime: OrchestrationRuntime;
	let mockRegistry: SkillRegistry;

	beforeEach(() => {
		mockRegistry = new SkillRegistry({
			modules: [mockSkillModule],
			workspace: null, // Disable workspace for testing
		});

		orchestrationRuntime = new OrchestrationRuntime(mockRegistry, mockRuntime, {
			maxConcurrency: 2,
			defaultTimeout: 5000,
			enableCaching: false, // Disable caching for these tests
			enablePlanning: false, // Disable planning for these tests
		});
	});

	afterEach(async () => {
		await orchestrationRuntime.shutdown();
	});

	it("throws if require_human_in_loop is set in domain routing", async () => {
		const governedRuntime: SkillExecutionRuntime = {
			...mockRuntime,
			modelRouter: {
				...mockRuntime.modelRouter,
				getDomainRouting: vi.fn().mockReturnValue({
					profile: "governance",
					require_human_in_loop: true,
				}),
			},
		};
		const runtime = new OrchestrationRuntime(mockRegistry, governedRuntime, {
			maxConcurrency: 2,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		let thrown: unknown;
		try {
			await runtime.executeSkill("test-skill", { request: "Test" });
		} catch (error) {
			thrown = error;
		} finally {
			await runtime.shutdown();
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toMatch(/requires human in the loop/i);
	});

	it("throws if model routing references an unknown orchestration profile", async () => {
		const invalidProfileRuntime: SkillExecutionRuntime = {
			...mockRuntime,
			modelRouter: {
				...mockRuntime.modelRouter,
				getDomainRouting: vi.fn().mockReturnValue({
					profile: "does-not-exist",
				}),
				getProfileForSkill: vi.fn().mockReturnValue("does-not-exist"),
			},
		};
		const runtime = new OrchestrationRuntime(
			mockRegistry,
			invalidProfileRuntime,
			{
				maxConcurrency: 2,
				defaultTimeout: 5000,
				enableCaching: false,
				enablePlanning: false,
			},
		);

		let thrown: unknown;
		try {
			await runtime.executeSkill("test-skill", { request: "Test" });
		} catch (error) {
			thrown = error;
		} finally {
			await runtime.shutdown();
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toMatch(/unknown orchestration profile/i);
	});

	it("should execute single skill", async () => {
		const result = await orchestrationRuntime.executeSkill("test-skill", {
			request: "Test execution",
		});

		expect(result).toBeDefined();
		expect(result.skillId).toBe("test-skill");
		expect(result.summary).toContain("Test execution");
	});

	it("should handle execution priorities", async () => {
		const promises = [
			orchestrationRuntime.executeSkill("test-skill", {
				request: "Low priority",
			}),
			orchestrationRuntime.executeSkill("test-skill", {
				request: "High priority",
			}),
		];

		const results = await Promise.all(promises);
		expect(results).toHaveLength(2);
		expect(results[0].summary).toBeDefined();
		expect(results[1].summary).toBeDefined();
	});

	it("should track execution metrics", async () => {
		await orchestrationRuntime.executeSkill("test-skill", {
			request: "Test metrics",
		});

		const metrics = orchestrationRuntime.getMetrics();
		expect(metrics.totalExecutions).toBeGreaterThan(0);
		expect(metrics.successfulExecutions).toBeGreaterThan(0);
		expect(metrics.successRate).toBe(1);
	});

	it("keeps average latency finite after the first successful execution", async () => {
		await orchestrationRuntime.executeSkill("test-skill", {
			request: "latency metric",
		});

		const metrics = orchestrationRuntime.getMetrics();
		expect(Number.isFinite(metrics.averageLatency)).toBe(true);
		expect(metrics.averageLatency).toBeGreaterThanOrEqual(0);
		expect(Number.isFinite(metrics.p99Latency)).toBe(true);
		expect(metrics.p99Latency).toBeGreaterThanOrEqual(metrics.averageLatency);
	});

	it("calculates throughput as successful executions per elapsed minute", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

		const runtime = new OrchestrationRuntime(mockRegistry, mockRuntime, {
			maxConcurrency: 1,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		vi.setSystemTime(new Date("2024-01-01T00:00:30.000Z"));
		await runtime.executeSkill("test-skill", {
			request: "first throughput sample",
		});
		await runtime.executeSkill("test-skill", {
			request: "second throughput sample",
		});

		vi.setSystemTime(new Date("2024-01-01T00:01:00.000Z"));
		const metrics = runtime.getMetrics();
		expect(metrics.throughput).toBeCloseTo(2, 5);

		await runtime.shutdown();
		vi.useRealTimers();
	});

	it("clears the metrics collection interval during shutdown", async () => {
		vi.useFakeTimers();
		const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
		const runtime = new OrchestrationRuntime(mockRegistry, mockRuntime, {
			maxConcurrency: 1,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		await runtime.shutdown();

		expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
		clearIntervalSpy.mockRestore();
		vi.useRealTimers();
	});

	it("removes queue event listeners during shutdown when the queue supports off()", async () => {
		const runtime = new OrchestrationRuntime(mockRegistry, mockRuntime, {
			maxConcurrency: 1,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});
		const runtimeInternals =
			runtime as unknown as OrchestrationRuntimeInternals;
		const offSpy = vi.spyOn(runtimeInternals.queue, "off");

		await runtime.shutdown();

		expect(offSpy).toHaveBeenCalledWith("active", expect.any(Function));
		expect(offSpy).toHaveBeenCalledWith("idle", expect.any(Function));
		expect(offSpy).toHaveBeenCalledWith("error", expect.any(Function));
	});

	it("sanitizes queue execution errors before logging them", async () => {
		const runtime = new OrchestrationRuntime(mockRegistry, mockRuntime, {
			maxConcurrency: 1,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});
		const runtimeInternals =
			runtime as unknown as OrchestrationRuntimeInternals;
		const logSpy = vi.spyOn(runtimeInternals.observabilityManager, "log");

		runtimeInternals.queueListeners.error(new Error("queue exploded"));

		expect(logSpy).toHaveBeenCalledWith(
			"error",
			"Queue execution error",
			expect.objectContaining({
				error: "queue exploded",
				errorType: "Error",
			}),
		);
		expect(logSpy.mock.calls[0]?.[2]).not.toHaveProperty("stack");

		await runtime.shutdown();
	});

	it("rejects new submissions at the exact maxQueueSize boundary", async () => {
		const blockingSkill = createBlockingSkill();
		const registry = new SkillRegistry({
			modules: [blockingSkill.module],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 1,
			maxQueueSize: 1,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		const first = runtime.executeSkill("blocking-skill", { request: "first" });
		await blockingSkill.started.promise;

		const second = runtime.executeSkill("blocking-skill", {
			request: "second",
		});
		expect(runtime.getRuntimeInfo().queuedExecutions).toBe(1);

		const third = runtime.executeSkill("blocking-skill", { request: "third" });
		const queueError = await third.catch((error) => error);
		expect(queueError).toBeInstanceOf(ResourceError);
		expect((queueError as Error).message).toMatch(/queue capacity exceeded/i);

		blockingSkill.release.resolve();
		await Promise.all([first, second]);
		await runtime.shutdown();
	});

	it("allows a later submission after a queued slot is released", async () => {
		const blockingSkill = createBlockingSkill();
		const registry = new SkillRegistry({
			modules: [blockingSkill.module],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 1,
			maxQueueSize: 1,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		const first = runtime.executeSkill("blocking-skill", { request: "first" });
		await blockingSkill.started.promise;
		const second = runtime.executeSkill("blocking-skill", {
			request: "second",
		});
		const rejected = await runtime
			.executeSkill("blocking-skill", { request: "third" })
			.catch((error) => error);
		expect(rejected).toBeInstanceOf(ResourceError);

		blockingSkill.release.resolve();
		await Promise.all([first, second]);

		const recoveredResult = await runtime.executeSkill("blocking-skill", {
			request: "fourth",
		});
		expect(recoveredResult.summary).toContain("fourth");
		await runtime.shutdown();
	});

	it("rejects one concurrent enqueue when only one queued slot remains", async () => {
		const blockingSkill = createBlockingSkill();
		const registry = new SkillRegistry({
			modules: [blockingSkill.module],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 1,
			maxQueueSize: 2,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		const first = runtime.executeSkill("blocking-skill", { request: "first" });
		await blockingSkill.started.promise;

		const second = runtime.executeSkill("blocking-skill", {
			request: "second",
		});
		expect(runtime.getRuntimeInfo().queuedExecutions).toBe(1);

		const third = runtime.executeSkill("blocking-skill", { request: "third" });
		const fourth = runtime.executeSkill("blocking-skill", {
			request: "fourth",
		});

		blockingSkill.release.resolve();
		const queueOutcomes = await Promise.allSettled([third, fourth]);

		expect(queueOutcomes.map((outcome) => outcome.status).sort()).toEqual([
			"fulfilled",
			"rejected",
		]);
		const rejectedOutcome = queueOutcomes.find(
			(outcome): outcome is PromiseRejectedResult =>
				outcome.status === "rejected",
		);
		expect(rejectedOutcome?.reason).toBeInstanceOf(ResourceError);

		await Promise.allSettled([first, second]);
		await runtime.shutdown();
	});

	it("rejects queued work during shutdown instead of leaving it pending", async () => {
		const blockingSkill = createBlockingSkill();
		const registry = new SkillRegistry({
			modules: [blockingSkill.module],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 1,
			maxQueueSize: 2,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		const first = runtime.executeSkill("blocking-skill", { request: "first" });
		await blockingSkill.started.promise;
		const queued = runtime.executeSkill("blocking-skill", {
			request: "second",
		});
		const queuedAssertion = expect(queued).rejects.toThrow(/shut down/i);

		const shutdownPromise = runtime.shutdown();
		blockingSkill.release.resolve();

		await Promise.all([first, shutdownPromise, queuedAssertion]);
	});

	it("returns advisory mode results even when the execution queue is full", async () => {
		const blockingSkill = createBlockingSkill();
		const advisorySkill = {
			...mockSkillModule,
			manifest: {
				...mockSkillModule.manifest,
				id: "qm-advisory-skill",
				canonicalId: "qm-advisory-skill",
				displayName: "Advisory Skill",
				description: "An advisory-only skill",
			} satisfies SkillManifestEntry,
			run: vi.fn(mockSkillModule.run),
		};
		const registry = new SkillRegistry({
			modules: [blockingSkill.module, advisorySkill],
			workspace: null,
		});
		// Inject a custom planning gate so blocking-skill runs normally while
		// qm-advisory-skill still returns advisory (checked before availability).
		const gate = new PlanningGateService({ advisoryFallback: false });
		vi.spyOn(gate, "checkExecutionGate").mockImplementation(
			async (skillId: string) => {
				if (skillId.startsWith("qm-")) {
					return {
						canExecute: true,
						fallbackStrategy: "advisory" as const,
						prerequisites: [],
						warnings: ["advisory-only"],
					};
				}
				return { canExecute: true, prerequisites: [], warnings: [] };
			},
		);
		const runtime = new OrchestrationRuntime(
			registry,
			mockRuntime,
			{
				maxConcurrency: 1,
				maxQueueSize: 1,
				defaultTimeout: 5000,
				enableCaching: false,
				enablePlanning: true,
			},
			{ gate },
		);

		const first = runtime.executeSkill("blocking-skill", { request: "first" });
		await blockingSkill.started.promise;
		const second = runtime.executeSkill("blocking-skill", {
			request: "second",
		});

		const advisoryResult = await runtime.executeSkill("qm-advisory-skill", {
			request: "advisory only",
		});
		expect(advisoryResult.model.id).toBe("advisory-mode");
		expect(advisorySkill.run).not.toHaveBeenCalled();

		blockingSkill.release.resolve();
		await Promise.all([first, second]);
		await runtime.shutdown();
	});

	it("runs higher-priority queued work first when priority scheduling is enabled", async () => {
		const startOrder: string[] = [];
		const firstStarted = createDeferred<void>();
		const release = createDeferred<void>();
		const orderedSkill = {
			...mockSkillModule,
			manifest: {
				...mockSkillModule.manifest,
				id: "ordered-skill",
				canonicalId: "ordered-skill",
				displayName: "Ordered Skill",
				description: "A skill that records start order",
			} satisfies SkillManifestEntry,
			run: vi.fn(async (input: InstructionInput) => {
				startOrder.push(input.request);
				if (startOrder.length === 1) {
					firstStarted.resolve();
					await release.promise;
				}
				return {
					...(await mockSkillModule.run(input)),
					skillId: "ordered-skill",
					displayName: "Ordered Skill",
				};
			}),
		};
		const registry = new SkillRegistry({
			modules: [orderedSkill],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 1,
			maxQueueSize: 10,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		const first = runtime.executeSkill("ordered-skill", { request: "first" });
		await firstStarted.promise;
		const low = runtime.executeSkill(
			"ordered-skill",
			{ request: "low-priority" },
			{ priority: "low" },
		);
		const high = runtime.executeSkill(
			"ordered-skill",
			{ request: "high-priority" },
			{ priority: "critical" },
		);

		release.resolve();
		await Promise.all([first, low, high]);

		expect(startOrder).toEqual(["first", "high-priority", "low-priority"]);
		await runtime.shutdown();
	});

	it("retries failed executions with jittered backoff", async () => {
		const retryingSkill = {
			...mockSkillModule,
			manifest: {
				...mockSkillModule.manifest,
				id: "retrying-skill",
				canonicalId: "retrying-skill",
				displayName: "Retrying Skill",
				description: "A skill that always fails",
			} satisfies SkillManifestEntry,
			run: vi.fn(async () => {
				throw new Error("transient failure");
			}),
		};
		const registry = new SkillRegistry({
			modules: [retryingSkill],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 1,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
			retry: {
				attempts: 2,
				backoffMs: 100,
				maxBackoffMs: 1000,
			},
		});
		const runtimeInternals =
			runtime as unknown as OrchestrationRuntimeInternals;
		const randomSpy = vi
			.spyOn(Math, "random")
			.mockReturnValueOnce(0.25)
			.mockReturnValueOnce(0.75);
		const sleepSpy = vi
			.spyOn(runtimeInternals, "sleep")
			.mockResolvedValue(undefined);

		await expect(
			runtime.executeSkill("retrying-skill", { request: "retry me" }),
		).rejects.toThrow(/transient failure/i);
		expect(retryingSkill.run).toHaveBeenCalledTimes(3);
		expect(sleepSpy).toHaveBeenNthCalledWith(1, 125);
		expect(sleepSpy).toHaveBeenNthCalledWith(2, 275);

		randomSpy.mockRestore();
		await runtime.shutdown();
	});

	it("treats retry.attempts as retries-after-the-first-attempt", async () => {
		const runtime = new OrchestrationRuntime(mockRegistry, mockRuntime, {
			maxConcurrency: 1,
			defaultTimeout: 500,
			enableCaching: false,
			enablePlanning: false,
			retry: {
				attempts: 2,
				backoffMs: 0,
				maxBackoffMs: 0,
			},
		});
		const runtimeInternals =
			runtime as unknown as OrchestrationRuntimeInternals;
		const executeSingleSkillSpy = vi
			.spyOn(runtimeInternals, "executeSingleSkill")
			.mockRejectedValue(new Error("still failing"));
		const sleepSpy = vi
			.spyOn(runtimeInternals, "sleep")
			.mockResolvedValue(undefined);

		await expect(
			runtimeInternals.executeWithRetry("retry-count-execution", {
				skillId: "test-skill",
				input: { request: "attempt semantics" },
				timeout: 10,
				retryCount: 0,
				startTime: Date.now(),
				dependencies: [],
			}),
		).rejects.toThrow("still failing");
		expect(executeSingleSkillSpy).toHaveBeenCalledTimes(3);
		expect(sleepSpy).toHaveBeenCalledTimes(2);
		expect(runtime.getMetrics().retryAttempts).toBe(2);
		await runtime.shutdown();
	});

	it("should handle execution timeout", async () => {
		// Mock a slow skill execution
		const slowSkill = {
			...mockSkillModule,
			manifest: {
				...mockSkillModule.manifest,
				id: "slow-skill",
				canonicalId: "slow-skill",
				displayName: "Slow Skill",
				description: "A slow skill",
			} satisfies SkillManifestEntry,
			run: async (input: InstructionInput): Promise<SkillExecutionResult> => {
				await new Promise((resolve) => setTimeout(resolve, 150));
				return mockSkillModule.run(input);
			},
			handler: {
				async execute(input: InstructionInput): Promise<SkillExecutionResult> {
					await new Promise((resolve) => setTimeout(resolve, 150));
					return mockSkillModule.handler.execute(input);
				},
			},
		};

		const registryWithSlow = new SkillRegistry({
			modules: [slowSkill],
			workspace: null,
		});

		const runtimeWithTimeout = new OrchestrationRuntime(
			registryWithSlow,
			mockRuntime,
			{ maxConcurrency: 1, defaultTimeout: 100, enablePlanning: false },
		);

		let thrown: unknown;
		try {
			await runtimeWithTimeout.executeSkill("slow-skill", {
				request: "Test timeout",
			});
		} catch (error) {
			thrown = error;
		} finally {
			await runtimeWithTimeout.shutdown();
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toMatch(/timed out/i);
	});

	it("retries timed-out executions before surfacing the final timeout error", async () => {
		const runtime = new OrchestrationRuntime(mockRegistry, mockRuntime, {
			maxConcurrency: 1,
			defaultTimeout: 500,
			enableCaching: false,
			enablePlanning: false,
			retry: {
				attempts: 2,
				backoffMs: 0,
				maxBackoffMs: 0,
			},
		});
		const runtimeInternals =
			runtime as unknown as OrchestrationRuntimeInternals;
		const executeSingleSkillSpy = vi
			.spyOn(runtimeInternals, "executeSingleSkill")
			.mockRejectedValue(new Error("Skill execution timed out after 10ms"));
		const sleepSpy = vi
			.spyOn(runtimeInternals, "sleep")
			.mockResolvedValue(undefined);

		await expect(
			runtimeInternals.executeWithRetry("timeout-execution", {
				skillId: "test-skill",
				input: { request: "Test timeout retry" },
				timeout: 10,
				retryCount: 0,
				startTime: Date.now(),
				dependencies: [],
			}),
		).rejects.toThrow(/timed out after 10ms/i);
		expect(executeSingleSkillSpy).toHaveBeenCalledTimes(3);
		expect(sleepSpy).toHaveBeenCalledTimes(2);
		await runtime.shutdown();
	});

	it("returns an advisory result instead of executing the skill when planning falls back", async () => {
		const advisorySkill = {
			...mockSkillModule,
			manifest: {
				...mockSkillModule.manifest,
				id: "qm-advisory-skill",
				canonicalId: "qm-advisory-skill",
				displayName: "Advisory Skill",
				description: "An advisory-only skill",
			} satisfies SkillManifestEntry,
			run: vi.fn(mockSkillModule.run),
		};
		const registry = new SkillRegistry({
			modules: [advisorySkill],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 1,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: true,
		});

		const result = await runtime.executeSkill("qm-advisory-skill", {
			request: "Provide guidance only",
		});

		const metrics = runtime.getMetrics();
		expect(result.model.id).toBe("advisory-mode");
		expect(result.summary).toContain("Advisory execution");
		expect(advisorySkill.run).not.toHaveBeenCalled();
		expect(metrics.fallbackExecutions).toBe(1);
		expect(metrics.fallbackFrequency).toBe(1);
		await runtime.shutdown();
	});

	it("counts cached results in success and cache-hit metrics", async () => {
		const runtime = new OrchestrationRuntime(mockRegistry, mockRuntime, {
			maxConcurrency: 1,
			defaultTimeout: 500,
			enableCaching: true,
			enablePlanning: false,
		});

		await runtime.executeSkill("test-skill", {
			request: "cache me",
		});
		await runtime.executeSkill("test-skill", {
			request: "cache me",
		});

		const metrics = runtime.getMetrics();
		expect(metrics.totalExecutions).toBe(2);
		expect(metrics.successfulExecutions).toBe(2);
		expect(metrics.cachedExecutions).toBe(1);
		expect(metrics.cacheHitRate).toBe(0.5);
		await runtime.shutdown();
	});

	it("preserves original inputs for dependency-resolved batch execution", async () => {
		const registry = new SkillRegistry({
			modules: [mockSkillModule, mockSkillModule2],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 2,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		const results = await runtime.executeSkillBatch([
			{ skillId: "test-skill", input: { request: "First skill" } },
			{
				skillId: "test-skill-2",
				input: { request: "Second skill" },
				dependencies: ["test-skill"],
			},
		]);

		await runtime.shutdown();

		expect(results.get("test-skill-2")).toBeDefined();
		expect(results.get("test-skill-2")).not.toBeInstanceOf(Error);
		expect(
			(results.get("test-skill-2") as SkillExecutionResult).summary,
		).toContain("Second skill");
	});

	it("reports dependency cycle details for stalled batches", async () => {
		const registry = new SkillRegistry({
			modules: [mockSkillModule, mockSkillModule2],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 2,
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		const results = await runtime.executeSkillBatch([
			{
				skillId: "test-skill",
				input: { request: "First skill" },
				dependencies: ["test-skill-2"],
			},
			{
				skillId: "test-skill-2",
				input: { request: "Second skill" },
				dependencies: ["test-skill"],
			},
		]);

		await runtime.shutdown();

		const cycleError = results.get("test-skill");
		expect(cycleError).toBeInstanceOf(DependencyCycleError);
		expect((cycleError as DependencyCycleError).cyclePath).toEqual([
			"test-skill",
			"test-skill-2",
		]);
	});

	it("wraps non-failFast batch failures in domain errors", async () => {
		const registry = new SkillRegistry({
			modules: [],
			workspace: null,
		});
		const runtime = new OrchestrationRuntime(registry, mockRuntime, {
			maxConcurrency: 1,
			retry: {
				attempts: 0,
			},
			defaultTimeout: 5000,
			enableCaching: false,
			enablePlanning: false,
		});

		const results = await runtime.executeSkillBatch([
			{
				skillId: "failing-skill",
				input: { request: "fail" },
			},
		]);

		await runtime.shutdown();

		const failure = results.get("failing-skill");
		expect(failure).toBeInstanceOf(SkillExecutionError);
		expect((failure as SkillExecutionError).message).toContain(
			"Skill 'failing-skill' not found in registry",
		);
	});
});

describe("IntegratedSkillRuntime", () => {
	let integratedRuntime: IntegratedSkillRuntime;
	let mockRegistry: SkillRegistry;

	beforeEach(() => {
		mockRegistry = new SkillRegistry({
			modules: [mockSkillModule, mockSkillModule2],
			workspace: null,
		});

		integratedRuntime = createIntegratedRuntime(mockRegistry, mockRuntime, {
			enableOrchestration: true,
			orchestration: {
				maxConcurrency: 2,
				enableCaching: true,
				enablePlanning: false,
			},
		});
	});

	afterEach(async () => {
		await integratedRuntime.shutdown();
	});

	it("should execute skills with orchestration enabled", async () => {
		const result = await integratedRuntime.executeSkill("test-skill", {
			request: "Test orchestrated execution",
		});

		expect(result.result).toBeDefined();
		expect(result.metadata.executionMode).toMatch(/orchestrated|cached/);
		expect(result.result.summary).toContain("Test orchestrated execution");
	});

	it("should fallback to direct execution when requested", async () => {
		const result = await integratedRuntime.executeSkill(
			"test-skill",
			{
				request: "Test direct fallback",
			},
			{
				forceDirectExecution: true,
			},
		);

		expect(result.result).toBeDefined();
		expect(result.metadata.executionMode).toBe("direct");
	});

	it("should execute skill batches", async () => {
		const skills = [
			{ skillId: "test-skill", input: { request: "First skill" } },
			{ skillId: "test-skill-2", input: { request: "Second skill" } },
		];

		const results = await integratedRuntime.executeSkillBatch(skills);

		expect(results.size).toBe(2);

		const firstResult = results.get("test-skill");
		expect(firstResult).toBeDefined();
		expect(firstResult instanceof Error).toBe(false);
	});

	it("should provide runtime status", async () => {
		await integratedRuntime.initialize();

		const status = integratedRuntime.getStatus();
		expect(status.orchestrationEnabled).toBe(true);
		expect(status.orchestrationMetrics).toBeDefined();
		expect(status.cacheStats).toBeDefined();
	});

	it("should handle configuration updates", () => {
		integratedRuntime.updateConfig({
			orchestration: {
				maxConcurrency: 5,
			},
		});

		// Configuration should be updated
		const status = integratedRuntime.getStatus();
		expect(status).toBeDefined();
	});
});
