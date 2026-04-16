import { afterEach, describe, expect, it, vi } from "vitest";
import type {
	SkillExecutionResult,
	SkillExecutionRuntime,
} from "../../contracts/runtime.js";
import { modelAvailabilityService } from "../../models/model-availability.js";
import { createIntegratedRuntime } from "../../runtime/integration.js";
import { OrchestrationRuntime } from "../../runtime/orchestration-runtime.js";
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

	it("enforces the quorum gate for physics skills on the integrated runtime path", async () => {
		const skillRun = vi
			.fn()
			.mockResolvedValue(createMockResult("should not run"));
		const runtime = createIntegratedRuntime(
			{
				getById: () => ({ run: skillRun }),
				buildSkillRuntime: (base: SkillExecutionRuntime) => base,
			} as unknown as SkillRegistry,
			{} as unknown as SkillExecutionRuntime,
			{
				enableOrchestration: false,
				validation: { allowPhysicsSkills: true },
			},
		);

		await expect(
			runtime.executeSkill("qm-entanglement-mapper", {
				request: "show me a dashboard",
				physicsAnalysisJustification:
					"This explanation is intentionally verbose but avoids the special rationale keywords entirely.",
			}),
		).rejects.toThrow(/quorum gate rejected/i);
		expect(skillRun).not.toHaveBeenCalled();
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
});
