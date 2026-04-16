import { afterEach, describe, expect, it, vi } from "vitest";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";
import { modelAvailabilityService } from "../../models/model-availability.js";
import { MODEL_PROFILES } from "../../models/model-profile.js";
import { ModelRouter } from "../../models/model-router.js";
import { PlanningGateService } from "../../runtime/planning-gate.js";

describe("planning-gate", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns advisory execution mode for advisory-only skills and extracts skill dependencies", async () => {
		const service = new PlanningGateService({
			enabled: true,
			advisoryFallback: true,
		});

		const plan = await service.createExecutionPlan("qm-wavefunction-coverage", {
			request:
				"compare req-analysis with debug-root-cause in real-time for user-agent flows",
		});

		expect(plan).not.toBeNull();
		expect(plan?.executionMode).toBe("advisory");
		expect(plan?.dependencies).toEqual(["req-analysis", "debug-root-cause"]);
	});

	it("short-circuits execution checks when the gate is disabled", async () => {
		const service = new PlanningGateService({ enabled: false });

		expect(
			await service.checkExecutionGate("gov-policy-validation", {
				request: "validate policy",
			}),
		).toEqual({
			canExecute: true,
			prerequisites: [],
			warnings: [],
		});
	});

	it("exposes merged configuration overrides", () => {
		const service = new PlanningGateService({
			maxPlanningTime: 2500,
			strictAvailabilityCheck: ["gov-", "eval-", "resil-"],
		});

		expect(service.getConfig()).toMatchObject({
			enabled: true,
			advisoryFallback: true,
			maxPlanningTime: 2500,
			strictAvailabilityCheck: ["gov-", "eval-", "resil-"],
		});
	});

	it("builds a full execution plan for non-advisory skills", async () => {
		const service = new PlanningGateService({
			enabled: true,
			advisoryFallback: true,
		});

		const plan = await service.createExecutionPlan("req-analysis", {
			request: "summarize the product requirements",
		});

		expect(plan).not.toBeNull();
		expect(plan?.skillId).toBe("req-analysis");
		expect(plan?.executionMode).toBe("full");
		expect(plan?.selectedModel.id).toBeTruthy();
		expect(Array.isArray(plan?.fallbacks)).toBe(true);
	});

	it("ignores non-model prerequisite text safely", async () => {
		const service = new PlanningGateService();

		await expect(
			service.validatePrerequisites([
				"Configure at least one experimental model",
				"Document the rollout plan",
			]),
		).resolves.toEqual({
			valid: true,
			failures: [],
		});
	});

	it("blocks strict skills when no models are available and advisory fallback is disabled", async () => {
		const service = new PlanningGateService({
			enabled: true,
			advisoryFallback: false,
			strictAvailabilityCheck: ["gov-"],
		});
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);

		await expect(
			service.checkExecutionGate("gov-policy-validation", {
				request: "validate policy",
			}),
		).resolves.toMatchObject({
			canExecute: false,
			prerequisites: ["Configure at least one strong model"],
		});
	});

	it("falls back to advisory mode when non-strict skills have no available models", async () => {
		const service = new PlanningGateService({
			enabled: true,
			advisoryFallback: true,
			strictAvailabilityCheck: ["gov-"],
		});
		const logSpy = vi.spyOn(ObservabilityOrchestrator.prototype, "log");
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);

		await expect(
			service.checkExecutionGate("req-analysis", {
				request: "summarize requirements",
			}),
		).resolves.toMatchObject({
			canExecute: true,
			fallbackStrategy: "advisory",
		});
		expect(logSpy).toHaveBeenCalledWith(
			"warn",
			"Planning gate decision",
			expect.objectContaining({
				skillId: "req-analysis",
				fallbackStrategy: "advisory",
				decision: "advisory-no-available-models",
			}),
		);
	});

	it("uses an available fallback model when the selected model is unavailable", async () => {
		const service = new PlanningGateService({
			enabled: true,
			advisoryFallback: false,
		});
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue(["gpt-5.1-mini"]);
		vi.spyOn(ModelRouter.prototype, "chooseSkillModelById").mockReturnValue(
			MODEL_PROFILES["strong_primary"]!,
		);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockImplementation(
			(modelId: string) =>
				modelId === "strong_primary"
					? {
							available: false,
							reason: "missing key",
							fallbackModel: "free_primary",
						}
					: { available: true },
		);

		await expect(
			service.checkExecutionGate("arch-system", {
				request: "design the system",
			}),
		).resolves.toMatchObject({
			canExecute: true,
			recommendedModel: MODEL_PROFILES["free_primary"],
		});
	});

	it("queues execution when the selected model is unavailable and no fallback is allowed", async () => {
		const service = new PlanningGateService({
			enabled: true,
			advisoryFallback: false,
		});
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue(["strong_primary"]);
		vi.spyOn(ModelRouter.prototype, "chooseSkillModelById").mockReturnValue(
			MODEL_PROFILES["strong_primary"]!,
		);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: false,
			reason: "missing key",
		});

		await expect(
			service.checkExecutionGate("arch-system", {
				request: "design the system",
			}),
		).resolves.toMatchObject({
			canExecute: false,
			fallbackStrategy: "queue",
			prerequisites: ["missing key"],
		});
	});

	it("returns no execution plan when the gate rejects execution", async () => {
		const service = new PlanningGateService({
			enabled: true,
			advisoryFallback: false,
			strictAvailabilityCheck: ["gov-"],
		});
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);

		await expect(
			service.createExecutionPlan("gov-policy-validation", {
				request: "validate policy",
			}),
		).resolves.toBeNull();
	});

	it("logs execution-plan creation details for successful plans", async () => {
		const service = new PlanningGateService({
			enabled: true,
			advisoryFallback: true,
		});
		const logSpy = vi.spyOn(ObservabilityOrchestrator.prototype, "log");

		const plan = await service.createExecutionPlan("req-analysis", {
			request: "summarize the product requirements",
		});

		expect(plan).not.toBeNull();
		expect(logSpy).toHaveBeenCalledWith(
			"info",
			"Execution plan created",
			expect.objectContaining({
				skillId: "req-analysis",
				selectedModelId: plan?.selectedModel.id,
				executionMode: plan?.executionMode,
			}),
		);
	});

	it("infers model classes through execution gate routing", async () => {
		const service = new PlanningGateService();
		const availabilitySpy = vi
			.spyOn(modelAvailabilityService, "getAvailableModelsForClass")
			.mockReturnValue(["gpt-5.1-mini"]);
		vi.spyOn(ModelRouter.prototype, "chooseSkillModelById").mockImplementation(
			(_skillId, modelClass) => {
				if (modelClass === "strong") {
					return MODEL_PROFILES["strong_secondary"]!;
				}
				if (modelClass === "cheap") {
					return MODEL_PROFILES["cheap_primary"]!;
				}
				return MODEL_PROFILES["free_primary"]!;
			},
		);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: true,
		});

		await service.checkExecutionGate("lead-exec-briefing", { request: "x" });
		await service.checkExecutionGate("adapt-aco-router", { request: "x" });
		await service.checkExecutionGate("req-analysis", {
			request: "x".repeat(600),
		});
		await service.checkExecutionGate("req-analysis", {
			request: "x".repeat(2100),
			constraints: ["a", "b", "c", "d"],
		});

		expect(
			availabilitySpy.mock.calls.map(([modelClass]) => modelClass),
		).toEqual(["strong", "strong", "cheap", "strong"]);
	});

	it("fails prerequisite validation when a required model class is unavailable", async () => {
		const service = new PlanningGateService();
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);

		await expect(
			service.validatePrerequisites(["Configure at least one strong model"]),
		).resolves.toEqual({
			valid: false,
			failures: ["Configure at least one strong model"],
		});
	});
});
