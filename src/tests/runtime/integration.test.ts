import { afterEach, describe, expect, it, vi } from "vitest";
import type {
	SkillExecutionResult,
	SkillExecutionRuntime,
} from "../../contracts/runtime.js";
import { modelAvailabilityService } from "../../models/model-availability.js";
import { createIntegratedRuntime } from "../../runtime/integration.js";
import { OrchestrationRuntime } from "../../runtime/orchestration-runtime.js";
import { planningGateService } from "../../runtime/planning-gate.js";
import { skillCacheService } from "../../runtime/skill-cache.js";
import type { SkillRegistry } from "../../skills/skill-registry.js";

function createMockResult(summary = "Found issue"): SkillExecutionResult {
	return {
		skillId: "debug-root-cause",
		displayName: "Root Cause",
		summary,
		model: {
			id: "gpt-5.1-mini",
			label: "GPT-5.1 mini",
			costTier: "free",
			modelClass: "free",
			strengths: ["general"],
			maxContextWindow: "large",
		},
		recommendations: [],
		relatedSkills: [],
	};
}

afterEach(async () => {
	vi.restoreAllMocks();
	await skillCacheService.clear();
});

describe("runtime/integration", () => {
	it("falls back to direct execution when orchestration is disabled", async () => {
		const skillRun = vi.fn().mockResolvedValue(createMockResult());
		const runtime = createIntegratedRuntime(
			{
				getById: () => ({ run: skillRun }),
				buildSkillRuntime: (base: SkillExecutionRuntime) => base,
			} as unknown as SkillRegistry,
			{} as unknown as SkillExecutionRuntime,
			{ enableOrchestration: false },
		);

		const result = await runtime.executeSkill("debug-root-cause", {
			request: "investigate failing tests",
		});

		expect(result.metadata.executionMode).toBe("direct");
		expect(skillRun).toHaveBeenCalled();
	});

	it("falls back to direct execution when orchestrated execution fails and fallback is enabled", async () => {
		const skillRun = vi
			.fn()
			.mockResolvedValue(createMockResult("Recovered through direct fallback"));
		const runtime = createIntegratedRuntime(
			{
				getById: () => ({ run: skillRun }),
				buildSkillRuntime: (base: SkillExecutionRuntime) => base,
			} as any,
			{} as any,
			{ enableOrchestration: true, fallbackToDirectExecution: true },
		);
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);
		vi.spyOn(OrchestrationRuntime.prototype, "executeSkill").mockRejectedValue(
			new Error("boom"),
		);

		const result = await runtime.executeSkill("debug-root-cause", {
			request: "recover from orchestration failure",
		});

		expect(result.metadata.executionMode).toBe("direct");
		expect(result.result.summary).toContain("Recovered");
		expect(stderrSpy).toHaveBeenCalled();
	});

	it("surfaces validation failures before execution", async () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as unknown as SkillRegistry,
			{} as unknown as SkillExecutionRuntime,
			{ enableOrchestration: false },
		);

		await expect(
			runtime.executeSkill("debug-root-cause", {} as never),
		).rejects.toThrow("Input validation failed");
	});

	it("deep-merges nested runtime defaults when only partial overrides are provided", () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{
				caching: { maxSize: 42 },
				planning: { advisoryFallback: false },
			},
		) as unknown as {
			config: {
				caching: { maxSize: number; defaultTtl: number; enableLru: boolean };
				planning: { enabled: boolean; advisoryFallback: boolean };
			};
		};

		expect(runtime.config.caching).toEqual({
			maxSize: 42,
			defaultTtl: 300,
			enableLru: true,
		});
		expect(runtime.config.planning).toEqual({
			enabled: true,
			advisoryFallback: false,
		});
	});

	it("returns cached results when the orchestration cache hits", async () => {
		const cached = createMockResult("Cached result");
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableOrchestration: true },
		);
		vi.spyOn(skillCacheService, "get").mockResolvedValue(cached);

		const result = await runtime.executeSkill("debug-root-cause", {
			request: "reuse cached result",
		});

		expect(result.metadata.executionMode).toBe("cached");
		expect(result.metadata.fromCache).toBe(true);
		expect(result.result.summary).toBe("Cached result");
	});

	it("executes direct batches sequentially and keeps later successes when failFast is off", async () => {
		const runtime = createIntegratedRuntime(
			{
				getById: (skillId: string) =>
					skillId === "known-skill"
						? { run: vi.fn().mockResolvedValue(createMockResult("Batch ok")) }
						: undefined,
				buildSkillRuntime: (base: SkillExecutionRuntime) => base,
			} as any,
			{} as any,
			{ enableOrchestration: false },
		);

		const results = await runtime.executeSkillBatch([
			{ skillId: "missing-skill", input: { request: "missing" } },
			{ skillId: "known-skill", input: { request: "known" } },
		]);

		expect(results.get("missing-skill")).toBeInstanceOf(Error);
		expect(results.get("known-skill")).not.toBeInstanceOf(Error);
	});

	it("stops direct batch execution early when failFast is enabled", async () => {
		const skillRun = vi
			.fn()
			.mockResolvedValue(createMockResult("should not run"));
		const runtime = createIntegratedRuntime(
			{
				getById: (skillId: string) =>
					skillId === "known-skill" ? { run: skillRun } : undefined,
			} as any,
			{} as any,
			{ enableOrchestration: false },
		);

		const results = await runtime.executeSkillBatch(
			[
				{ skillId: "missing-skill", input: { request: "missing" } },
				{ skillId: "known-skill", input: { request: "known" } },
			],
			{ failFast: true },
		);

		expect(results.get("missing-skill")).toBeInstanceOf(Error);
		expect(results.has("known-skill")).toBe(false);
		expect(skillRun).not.toHaveBeenCalled();
	});

	it("reports advisory initialization and omits orchestration-only status fields when disabled", async () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableOrchestration: false },
		);
		const loadSpy = vi
			.spyOn(modelAvailabilityService, "loadConfig")
			.mockResolvedValue();
		vi.spyOn(modelAvailabilityService, "getMode").mockReturnValue("advisory");
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		await runtime.initialize();
		const status = runtime.getStatus();
		await runtime.reset();
		await runtime.shutdown();

		expect(loadSpy).toHaveBeenCalled();
		expect(status.orchestrationEnabled).toBe(false);
		expect(status.orchestrationMetrics).toBeUndefined();
		expect(status.cacheStats).toBeUndefined();
		expect(stderrSpy).toHaveBeenCalled();
	});

	it("executes the full orchestrated success path on a cache miss", async () => {
		const orchestrated = createMockResult("Orchestrated success");
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableOrchestration: true },
		);
		vi.spyOn(skillCacheService, "get").mockResolvedValue(null);
		vi.spyOn(OrchestrationRuntime.prototype, "executeSkill").mockResolvedValue(
			orchestrated,
		);

		const result = await runtime.executeSkill("debug-root-cause", {
			request: "run through orchestration",
		});

		expect(result.metadata.executionMode).toBe("orchestrated");
		expect(result.metadata.fromCache).toBe(false);
		expect(result.metadata.planningGateUsed).toBe(true);
		expect(result.result.summary).toBe("Orchestrated success");
	});

	it("skips the cache lookup entirely when bypassCache is true", async () => {
		const orchestrated = createMockResult("Bypassed cache");
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableOrchestration: true },
		);
		const cacheGetSpy = vi.spyOn(skillCacheService, "get");
		vi.spyOn(OrchestrationRuntime.prototype, "executeSkill").mockResolvedValue(
			orchestrated,
		);

		const result = await runtime.executeSkill(
			"debug-root-cause",
			{ request: "bypass the cache" },
			{ bypassCache: true },
		);

		expect(cacheGetSpy).not.toHaveBeenCalled();
		expect(result.metadata.executionMode).toBe("orchestrated");
	});

	it("propagates the orchestration error when fallback is disabled", async () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableOrchestration: true, fallbackToDirectExecution: false },
		);
		vi.spyOn(skillCacheService, "get").mockResolvedValue(null);
		const orchestrationError = new Error("orchestration exploded");
		vi.spyOn(OrchestrationRuntime.prototype, "executeSkill").mockRejectedValue(
			orchestrationError,
		);

		await expect(
			runtime.executeSkill("debug-root-cause", {
				request: "no fallback allowed",
			}),
		).rejects.toThrow("orchestration exploded");
	});

	it("logs configured-mode initialization when orchestration is enabled", async () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableOrchestration: true },
		);
		vi.spyOn(modelAvailabilityService, "loadConfig").mockResolvedValue();
		vi.spyOn(modelAvailabilityService, "getMode").mockReturnValue("configured");
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		await runtime.initialize();

		expect(stderrSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"Orchestrated runtime initialized with configured model availability",
			),
		);
	});

	it("logs that skill caching is enabled during initialize()", async () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{
				enableOrchestration: true,
				orchestration: { enableCaching: true },
			},
		);
		vi.spyOn(modelAvailabilityService, "loadConfig").mockResolvedValue();
		vi.spyOn(modelAvailabilityService, "getMode").mockReturnValue("advisory");
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		await runtime.initialize();

		expect(stderrSpy).toHaveBeenCalledWith(
			expect.stringContaining("Skill caching enabled with config:"),
		);
	});

	it("logs that the planning gate is enabled during initialize()", async () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{
				enableOrchestration: true,
				planning: { enabled: true },
			},
		);
		vi.spyOn(modelAvailabilityService, "loadConfig").mockResolvedValue();
		vi.spyOn(modelAvailabilityService, "getMode").mockReturnValue("advisory");
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		await runtime.initialize();

		expect(stderrSpy).toHaveBeenCalledWith(
			expect.stringContaining("Planning gate enabled with config:"),
		);
	});

	it("propagates updateConfig() to orchestration, cache, and planning services when enabled", () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableOrchestration: true },
		);
		const orchestrationUpdateSpy = vi
			.spyOn(OrchestrationRuntime.prototype, "updateConfig")
			.mockImplementation(() => {});
		const cacheUpdateSpy = vi
			.spyOn(skillCacheService, "updateConfig")
			.mockImplementation(() => {});
		const planningUpdateSpy = vi
			.spyOn(planningGateService, "updateConfig")
			.mockImplementation(() => {});

		runtime.updateConfig({
			orchestration: { enableCaching: false },
			caching: { maxSize: 99 },
			planning: { enabled: false },
		});

		expect(orchestrationUpdateSpy).toHaveBeenCalledWith({
			enableCaching: false,
		});
		expect(cacheUpdateSpy).toHaveBeenCalledWith({ maxSize: 99 });
		expect(planningUpdateSpy).toHaveBeenCalledWith({ enabled: false });
	});

	it("tears down cache and orchestration runtime on reset() and shutdown() when enabled", async () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableOrchestration: true },
		);
		const cacheClearSpy = vi
			.spyOn(skillCacheService, "clear")
			.mockResolvedValue();
		const orchestrationShutdownSpy = vi
			.spyOn(OrchestrationRuntime.prototype, "shutdown")
			.mockResolvedValue();

		await runtime.reset();
		await runtime.shutdown();

		expect(cacheClearSpy).toHaveBeenCalled();
		expect(orchestrationShutdownSpy).toHaveBeenCalledTimes(2);
	});

	it("resolves deprecated enableWave3/fallbackToWave2 aliases as orchestration enablement", () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableWave3: true, fallbackToWave2: true } as any,
		);
		vi.spyOn(modelAvailabilityService, "getMode").mockReturnValue("advisory");

		const status = runtime.getStatus();

		expect(status.orchestrationEnabled).toBe(true);
		expect(status.orchestrationMetrics).toBeDefined();
		expect(status.cacheStats).toBeDefined();
	});

	it("executes an orchestrated batch and passes through successes and errors", async () => {
		const runtime = createIntegratedRuntime(
			{
				getById: () => undefined,
			} as any,
			{} as any,
			{ enableOrchestration: true },
		);
		const batchSuccess = createMockResult("Batch success");
		const batchError = new Error("batch item failed");
		const batchMap = new Map<string, SkillExecutionResult | Error>([
			["ok-skill", batchSuccess],
			["failing-skill", batchError],
		]);
		vi.spyOn(
			OrchestrationRuntime.prototype,
			"executeSkillBatch",
		).mockResolvedValue(batchMap as any);

		const results = await runtime.executeSkillBatch([
			{ skillId: "ok-skill", input: { request: "ok" } },
			{ skillId: "failing-skill", input: { request: "fails" } },
		]);

		const okResult = results.get("ok-skill");
		expect(okResult).not.toBeInstanceOf(Error);
		expect((okResult as any).metadata.executionMode).toBe("orchestrated");
		expect((okResult as any).result.summary).toBe("Batch success");
		expect(results.get("failing-skill")).toBe(batchError);
	});
});
