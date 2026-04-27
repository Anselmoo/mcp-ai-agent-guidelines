import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	InstructionManifestEntry,
	ModelClass,
} from "../../contracts/generated.js";
import { MODEL_PROFILES } from "../../models/model-profile.js";

const freePrimary =
	MODEL_PROFILES.free_primary ??
	Object.values(MODEL_PROFILES).find((profile) => profile.costTier === "free")!;
const cheapPrimary =
	MODEL_PROFILES.cheap_primary ??
	Object.values(MODEL_PROFILES).find(
		(profile) => profile.costTier === "cheap",
	)!;
const strongPrimary =
	MODEL_PROFILES.strong_primary ??
	Object.values(MODEL_PROFILES).find(
		(profile) => profile.costTier === "strong",
	)!;

const routerHarness = vi.hoisted(() => {
	const state = {
		configuredModelsBySkill: {} as Record<string, string>,
		domainProfilesBySkill: {} as Record<string, string | null>,
		fanOutByProfile: {} as Record<string, number>,
		isConfigLoaded: false,
		availableModelsByClass: {} as Partial<Record<ModelClass, string[]>>,
		availabilityByModelId: {} as Record<
			string,
			{ available: boolean; reason?: string; fallbackModel?: string }
		>,
		mode: "configured" as "advisory" | "configured",
		capabilities: {} as Record<string, string[]>,
		models: {} as Record<string, { id: string }>,
		orderedModelIdsByClass: {
			free: ["free_primary"],
			cheap: ["cheap_primary"],
			strong: ["strong_primary"],
			reviewer: ["reviewer_primary"],
		} as Record<ModelClass, string[]>,
	};

	return {
		state,
		log: vi.fn(),
		loadConfig: vi.fn(async () => {}),
		configResolveForSkill: vi.fn(
			(skillId: string) =>
				state.configuredModelsBySkill[skillId] ?? "missing-model-profile",
		),
		getDomainRouting: vi.fn((skillId: string) => {
			const profile = state.domainProfilesBySkill[skillId];
			return profile ? { profile } : null;
		}),
		getFanOut: vi.fn((profile: string) => state.fanOutByProfile[profile] ?? 1),
		getProfileForSkill: vi.fn(() => "default-profile"),
		loadOrchestrationConfig: vi.fn(() => ({
			capabilities: state.capabilities,
			models: state.models,
		})),
		isConfigLoaded: vi.fn(() => state.isConfigLoaded),
		getAvailableModelsForClass: vi.fn(
			(modelClass: ModelClass) =>
				state.availableModelsByClass[modelClass] ?? [],
		),
		checkAvailability: vi.fn(
			(modelId: string) =>
				state.availabilityByModelId[modelId] ?? { available: true },
		),
		getMode: vi.fn(() => state.mode),
		orderedModelIdsForClass: vi.fn(
			(modelClass: ModelClass) =>
				state.orderedModelIdsByClass[modelClass] ?? [],
		),
	};
});

vi.mock("../../config/orchestration-config.js", () => ({
	resolveForSkill: routerHarness.configResolveForSkill,
	getDomainRouting: routerHarness.getDomainRouting,
	getFanOut: routerHarness.getFanOut,
	getProfileForSkill: routerHarness.getProfileForSkill,
	loadOrchestrationConfig: routerHarness.loadOrchestrationConfig,
}));

vi.mock("../../infrastructure/observability.js", () => ({
	createOperationalLogger: vi.fn(() => ({ log: routerHarness.log })),
}));

vi.mock("../../models/model-availability.js", () => ({
	modelAvailabilityService: {
		loadConfig: routerHarness.loadConfig,
		isConfigLoaded: routerHarness.isConfigLoaded,
		getAvailableModelsForClass: routerHarness.getAvailableModelsForClass,
		checkAvailability: routerHarness.checkAvailability,
		getMode: routerHarness.getMode,
	},
}));

vi.mock("../../models/model-class-defaults.js", () => ({
	orderedModelIdsForClass: routerHarness.orderedModelIdsForClass,
}));

import { ModelRouter } from "../../models/model-router.js";

function resetHarnessState(): void {
	routerHarness.state.configuredModelsBySkill = {};
	routerHarness.state.domainProfilesBySkill = {};
	routerHarness.state.fanOutByProfile = {};
	routerHarness.state.isConfigLoaded = false;
	routerHarness.state.availableModelsByClass = {};
	routerHarness.state.availabilityByModelId = {};
	routerHarness.state.mode = "configured";
	routerHarness.state.capabilities = {};
	routerHarness.state.models = {};
	routerHarness.state.orderedModelIdsByClass = {
		free: ["free_primary"],
		cheap: ["cheap_primary"],
		strong: ["strong_primary"],
		reviewer: ["reviewer_primary"],
	};
	routerHarness.log.mockReset();
	routerHarness.loadConfig.mockReset();
	routerHarness.loadConfig.mockResolvedValue(undefined);
	routerHarness.configResolveForSkill.mockClear();
	routerHarness.getDomainRouting.mockClear();
	routerHarness.getFanOut.mockClear();
	routerHarness.getProfileForSkill.mockClear();
	routerHarness.loadOrchestrationConfig.mockClear();
	routerHarness.isConfigLoaded.mockClear();
	routerHarness.getAvailableModelsForClass.mockClear();
	routerHarness.checkAvailability.mockClear();
	routerHarness.getMode.mockClear();
	routerHarness.orderedModelIdsForClass.mockClear();
}

function makeInstruction(
	overrides: Partial<InstructionManifestEntry> = {},
): InstructionManifestEntry {
	return {
		id: "test-instruction",
		toolName: "test-instruction",
		displayName: "Test Instruction",
		description: "Test instruction",
		sourcePath: "src/generated/instructions/test-instruction.ts",
		mission: "Test model routing.",
		inputSchema: { type: "object", properties: {} },
		workflow: { instructionId: "test-instruction", steps: [] },
		chainTo: [],
		preferredModelClass: "free",
		...overrides,
	};
}

beforeEach(() => {
	resetHarnessState();
});

afterEach(() => {
	vi.restoreAllMocks();
	resetHarnessState();
});

describe("model-router phase 6 coverage", () => {
	it("uses configured domain routing when routeSkillDecisionById resolves a known model", () => {
		routerHarness.state.domainProfilesBySkill = {
			"configured-skill": "configured-profile",
		};
		routerHarness.state.configuredModelsBySkill = {
			"configured-skill": cheapPrimary.id,
		};

		const router = new ModelRouter();
		const decision = router.routeSkillDecisionById("configured-skill", "free");

		expect(decision.selectedModelId).toBe(cheapPrimary.id);
		expect(decision.selectedProfile).toEqual(cheapPrimary);
		expect(decision.rationale).toBe(
			`Configured domain routing resolved configured-skill to ${cheapPrimary.id}.`,
		);
	});

	it("uses the explicit orch-agent-orchestrator override when configured routing is absent", () => {
		const router = new ModelRouter();
		const decision = router.routeSkillDecisionById(
			"orch-agent-orchestrator",
			"cheap",
		);

		expect(decision.selectedModelId).toBe(strongPrimary.id);
		expect(decision.rationale).toBe(
			`Explicit router override selected ${strongPrimary.id} for orch-agent-orchestrator.`,
		);
	});

	it("returns precise fallback rationale with and without a preferred model class", () => {
		const router = new ModelRouter();

		expect(router.routeSkillDecisionById("boundary-skill")).toMatchObject({
			selectedModelId: freePrimary.id,
			rationale: `Runtime boundary defaulted boundary-skill to free-tier profile ${freePrimary.id}.`,
		});
		expect(
			router.routeSkillDecisionById("boundary-skill", "cheap"),
		).toMatchObject({
			selectedModelId: cheapPrimary.id,
			rationale: `Preferred model class cheap selected default profile ${cheapPrimary.id}.`,
		});
	});

	it("logs and falls back when configured routing resolves to an unknown model", () => {
		routerHarness.state.domainProfilesBySkill = {
			"broken-skill": "broken-profile",
		};
		routerHarness.state.configuredModelsBySkill = {
			"broken-skill": "missing-profile",
		};

		const router = new ModelRouter();
		const decision = router.routeSkillDecisionById("broken-skill", "cheap");

		expect(routerHarness.log).toHaveBeenCalledWith(
			"warn",
			"Model router falling back for skill",
			expect.objectContaining({
				skillId: "broken-skill",
				error: expect.stringContaining("unknown model missing-profile"),
			}),
		);
		expect(decision.selectedModelId).toBe(cheapPrimary.id);
		expect(decision.fallbackModelId).toBe(cheapPrimary.id);
		expect(decision.rationale).toBe(
			`Routing failure for broken-skill fell back to preferred class cheap via ${cheapPrimary.id}.`,
		);
	});

	it("prefers the highest-priority configured workflow model over the instruction default", () => {
		routerHarness.state.domainProfilesBySkill = {
			"cheap-skill": "cheap-profile",
			"strong-skill": "strong-profile",
		};
		routerHarness.state.configuredModelsBySkill = {
			"cheap-skill": cheapPrimary.id,
			"strong-skill": strongPrimary.id,
		};

		const router = new ModelRouter();
		const cheapInstruction = makeInstruction({
			preferredModelClass: "free",
			workflow: {
				instructionId: "cheap-instruction",
				steps: [
					{
						kind: "invokeSkill",
						label: "cheap",
						skillId: "cheap-skill",
					},
				],
			},
		});
		const mixedTierInstruction = makeInstruction({
			preferredModelClass: "free",
			workflow: {
				instructionId: "mixed-tier-instruction",
				steps: [
					{
						kind: "invokeSkill",
						label: "free",
						skillId: "unconfigured-skill",
					},
					{
						kind: "invokeSkill",
						label: "cheap",
						skillId: "cheap-skill",
					},
					{
						kind: "invokeSkill",
						label: "strong",
						skillId: "strong-skill",
					},
				],
			},
		});

		expect(
			router.chooseInstructionModel(cheapInstruction, { request: "cheap" }).id,
		).toBe(cheapPrimary.id);
		expect(
			router.chooseInstructionModel(mixedTierInstruction, { request: "mixed" })
				.id,
		).toBe(strongPrimary.id);
	});

	it("resets a rejected initialization promise so initialize can retry", async () => {
		routerHarness.loadConfig.mockRejectedValueOnce(
			new Error("initial load failed"),
		);
		routerHarness.loadConfig.mockResolvedValueOnce(undefined);

		const router = new ModelRouter();

		await expect(router.initialize()).rejects.toThrow("initial load failed");
		expect(
			(router as unknown as { initPromise: Promise<void> | null }).initPromise,
		).toBeNull();

		await expect(router.initialize()).resolves.toBeUndefined();
		expect(routerHarness.loadConfig).toHaveBeenCalledTimes(2);
	});

	it("logs config-load failures triggered by background initialization", async () => {
		routerHarness.loadConfig.mockRejectedValueOnce(
			new Error("background load failed"),
		);

		const router = new ModelRouter();
		const profile = router.chooseInstructionModel(makeInstruction(), {
			request: "background init",
		});

		expect(profile.id).toBe(freePrimary.id);
		await vi.waitFor(() => {
			expect(routerHarness.log).toHaveBeenCalledWith(
				"warn",
				"Failed to load model configuration",
				expect.objectContaining({ error: "background load failed" }),
			);
		});
	});
});
