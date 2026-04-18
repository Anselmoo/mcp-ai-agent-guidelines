import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { modelAvailabilityService } from "../../models/model-availability.js";
import { MODEL_PROFILES } from "../../models/model-profile.js";
import { ModelRouter } from "../../models/model-router.js";

// Helpers to build minimal InstructionManifestEntry fixtures
function makeInstruction(
	overrides: Partial<InstructionManifestEntry> = {},
): InstructionManifestEntry {
	return {
		id: "test-instr",
		toolName: "test-instr",
		displayName: "Test",
		description: "Test instruction",
		sourcePath: "src/generated/instructions/test.ts",
		mission: "Test.",
		inputSchema: { type: "object", properties: {} },
		workflow: { instructionId: "test-instr", steps: [] },
		chainTo: [],
		preferredModelClass: "free",
		...overrides,
	};
}

const firstFreeId =
	Object.values(MODEL_PROFILES).find((p) => p.modelClass === "free")?.id ??
	"free_primary";

describe("model-router-extra", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	// -------------------------------------------------------------------------
	// profileForClass – config loaded, first available model IS in MODEL_PROFILES
	// -------------------------------------------------------------------------
	it("profileForClass returns profile when config is loaded and model is in MODEL_PROFILES", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([firstFreeId]);

		const router = new ModelRouter();
		const result = router.chooseReviewerModel();
		// Should have returned a profile (via profileForClass for "reviewer")
		expect(result).toBeDefined();
		expect(typeof result.id).toBe("string");
	});

	// -------------------------------------------------------------------------
	// profileForClass – availableModels present but not in MODEL_PROFILES
	// -------------------------------------------------------------------------
	it("profileForClass falls back to default when first available model has no profile", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue(["completely-unknown-model-id"]);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: true,
		});

		const router = new ModelRouter();
		const profile = router.chooseReviewerModel();
		expect(profile).toBeDefined();
	});

	// -------------------------------------------------------------------------
	// profileForClass – default model unavailable, fallbackModel IS in MODEL_PROFILES
	// -------------------------------------------------------------------------
	it("profileForClass uses fallback profile when default model unavailable and fallback exists", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: false,
			reason: "quota",
			fallbackModel: firstFreeId, // exists in MODEL_PROFILES
		});

		const router = new ModelRouter();
		const profile = router.chooseReviewerModel();
		expect(profile.id).toBe(firstFreeId);
	});

	// -------------------------------------------------------------------------
	// profileForClass – fallback model NOT in MODEL_PROFILES (returns default)
	// -------------------------------------------------------------------------
	it("profileForClass returns default model when fallback model not in MODEL_PROFILES", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: false,
			reason: "quota",
			fallbackModel: "nonexistent-fallback-xyz",
		});

		const router = new ModelRouter();
		// Should not throw; falls back to getDefaultModelForClass result
		expect(() => router.chooseReviewerModel()).not.toThrow();
	});

	// -------------------------------------------------------------------------
	// profileForClass – advisory mode with unavailable model (line 111)
	// -------------------------------------------------------------------------
	it("profileForClass proceeds with unavailable model in advisory mode", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: false,
			reason: "quota",
			fallbackModel: undefined,
		});
		vi.spyOn(modelAvailabilityService, "getMode").mockReturnValue("advisory");

		const router = new ModelRouter();
		expect(() => router.chooseReviewerModel()).not.toThrow();
	});

	// -------------------------------------------------------------------------
	// getDefaultModelForClass – happy path loop finds a profile (line 119)
	// -------------------------------------------------------------------------
	it("getDefaultModelForClass finds a profile for known free class", () => {
		// isConfigLoaded=false → goes straight to getDefaultModelForClass
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(false);

		const router = new ModelRouter();
		const profile = router.chooseFreeParallelLanes();
		expect(profile).toHaveLength(3);
		expect(profile[0]).toBeDefined();
	});

	// -------------------------------------------------------------------------
	// getDefaultModelForClass – reviewer class fallback to strong (line 126)
	// -------------------------------------------------------------------------
	it("chooseReviewerModel resolves a profile without throwing", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(false);
		const router = new ModelRouter();
		const profile = router.chooseReviewerModel();
		expect(profile).toBeDefined();
		expect(typeof profile.id).toBe("string");
	});

	// -------------------------------------------------------------------------
	// profileForCapabilityOrClass – synthesis and adversarial branches
	// -------------------------------------------------------------------------
	it("chooseSynthesisModel returns a model profile", () => {
		const router = new ModelRouter();
		const profile = router.chooseSynthesisModel();
		expect(profile).toBeDefined();
		expect(profile.id).toBeTruthy();
	});

	it("chooseCritiqueModel returns a model profile", () => {
		const router = new ModelRouter();
		const profile = router.chooseCritiqueModel();
		expect(profile).toBeDefined();
		expect(profile.id).toBeTruthy();
	});

	// -------------------------------------------------------------------------
	// hasParallelWorkload – parallel steps (line 209)
	// -------------------------------------------------------------------------
	it("chooseInstructionModel uses synthesis model for strong instruction with parallel steps", () => {
		const router = new ModelRouter();
		const instruction = makeInstruction({
			id: "design",
			preferredModelClass: "strong",
			workflow: {
				instructionId: "design",
				steps: [
					{
						kind: "parallel",
						label: "fanout",
						steps: [
							{ kind: "invokeSkill", label: "s1", skillId: "synth-research" },
							{
								kind: "invokeSkill",
								label: "s2",
								skillId: "synth-comparative",
							},
						],
					},
				],
			},
		});
		const profile = router.chooseInstructionModel(instruction, {
			request: "design with parallel steps",
		});
		// shouldUseStrongParallelSynthesisModel → true → returns synthesis model
		expect(profile).toBeDefined();
		expect(profile.modelClass).toBe("strong");
	});

	// -------------------------------------------------------------------------
	// hasParallelWorkload – serial steps wrapping parallel (line 220)
	// -------------------------------------------------------------------------
	it("chooseInstructionModel detects parallel within serial steps", () => {
		const router = new ModelRouter();
		const instruction = makeInstruction({
			id: "implement",
			preferredModelClass: "strong",
			workflow: {
				instructionId: "implement",
				steps: [
					{
						kind: "serial",
						label: "outer",
						steps: [
							{
								kind: "parallel",
								label: "inner-fanout",
								steps: [
									{
										kind: "invokeSkill",
										label: "s1",
										skillId: "qual-code-review",
									},
								],
							},
						],
					},
				],
			},
		});
		const profile = router.chooseInstructionModel(instruction, {
			request: "serial wrapping parallel",
		});
		expect(profile.modelClass).toBe("strong");
	});

	// -------------------------------------------------------------------------
	// summarizeInstructionRouting – hasConfiguredFanOut (lines 284/289)
	// -------------------------------------------------------------------------
	it("chooseInstructionModel handles instruction with only serial+invokeSkill steps (no fan-out)", () => {
		const router = new ModelRouter();
		const instruction = makeInstruction({
			id: "test-serial-only",
			preferredModelClass: "free",
			workflow: {
				instructionId: "test-serial-only",
				steps: [
					{
						kind: "serial",
						label: "steps",
						steps: [
							// qm-* skills have fan-out config in orchestration.toml
							{
								kind: "invokeSkill",
								label: "physics",
								skillId: "qm-entanglement-mapper",
							},
							{ kind: "note", label: "noop", note: "for coverage" },
						],
					},
				],
			},
		});
		const profile = router.chooseInstructionModel(instruction, {
			request: "serial instruction",
		});
		expect(profile).toBeDefined();
	});

	// -------------------------------------------------------------------------
	// chooseInstructionModel – strong parallel synthesis (line 342)
	// -------------------------------------------------------------------------
	it("chooseInstructionModel returns synthesis model when fan-out configured + strong class", () => {
		const router = new ModelRouter();
		// qm-entanglement-mapper has a configured routing profile;
		// if preferredModelClass is strong, shouldUseStrongParallelSynthesisModel
		// can also be triggered by hasConfiguredFanOut.
		const instruction = makeInstruction({
			id: "physics-analysis",
			preferredModelClass: "strong",
			workflow: {
				instructionId: "physics-analysis",
				steps: [
					{
						kind: "parallel",
						label: "fanout",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm",
								skillId: "qm-entanglement-mapper",
							},
						],
					},
				],
			},
		});
		const profile = router.chooseInstructionModel(instruction, {
			request: "physics parallel",
		});
		expect(profile).toBeDefined();
		expect(profile.modelClass).toBe("strong");
	});

	// -------------------------------------------------------------------------
	// chooseInstructionModel – review special case (existing path regression)
	// -------------------------------------------------------------------------
	it("chooseInstructionModel always returns synthesis model for review instruction", () => {
		const router = new ModelRouter();
		const instruction = makeInstruction({
			id: "review",
			preferredModelClass: "free",
			workflow: { instructionId: "review", steps: [] },
		});
		const profile = router.chooseInstructionModel(instruction, {
			request: "review something",
		});
		expect(profile.id).toBe("strong_primary");
	});

	// -------------------------------------------------------------------------
	// initialize and getAvailabilityMode
	// -------------------------------------------------------------------------
	it("initialize resolves without throwing (test env skips real load)", async () => {
		const router = new ModelRouter();
		await expect(router.initialize()).resolves.toBeUndefined();
	});

	it("getAvailabilityMode returns configured or advisory string", () => {
		const router = new ModelRouter();
		const mode = router.getAvailabilityMode();
		expect(["configured", "advisory"]).toContain(mode);
	});
});
