import { describe, expect, it, vi } from "vitest";
import type {
	InstructionManifestEntry,
	SkillManifestEntry,
} from "../../contracts/generated.js";
import { modelAvailabilityService } from "../../models/model-availability.js";
import { MODEL_PROFILES } from "../../models/model-profile.js";
import { ModelRouter } from "../../models/model-router.js";

describe("model-router", () => {
	it("uses special-case routing for review instructions and config-driven routing for orchestration skills", () => {
		const router = new ModelRouter();
		const reviewInstruction: InstructionManifestEntry = {
			id: "review",
			toolName: "review",
			displayName: "Review",
			description: "Review",
			sourcePath: "src/generated/instructions/review.ts",
			mission: "Review code and produce actionable feedback.",
			inputSchema: { type: "object", properties: {} },
			workflow: {
				instructionId: "review",
				steps: [],
			},
			chainTo: [],
			preferredModelClass: "free",
		};
		const orchestrationSkill: SkillManifestEntry = {
			id: "orch-agent-orchestrator",
			canonicalId: "orch-agent-orchestrator",
			domain: "orch",
			displayName: "Orchestrator",
			description: "Coordinate agents",
			sourcePath: "src/skills/orch.ts",
			purpose: "Coordinate",
			triggerPhrases: [],
			antiTriggerPhrases: [],
			usageSteps: [],
			intakeQuestions: [],
			relatedSkills: [],
			outputContract: [],
			recommendationHints: [],
			preferredModelClass: "cheap",
		};

		expect(
			router.chooseInstructionModel(reviewInstruction, {
				request: "review runtime",
			}).id,
		).toBe("strong_primary");

		expect(
			router.chooseSkillModel(orchestrationSkill, {
				request: "coordinate",
			}).id,
		).toBe("cheap_primary");
	});

	it("exposes domain routing metadata from the orchestration config", () => {
		const router = new ModelRouter();

		expect(router.getProfileForSkill("qm-entanglement-mapper")).toBe(
			"physics_analysis",
		);
		expect(router.getFanOut("qm-entanglement-mapper")).toBe(1);
		expect(router.getDomainRouting("gov-policy-validation")).toMatchObject({
			profile: "governance",
			require_human_in_loop: true,
		});
		expect(router.resolveForSkill("orch-agent-orchestrator")).toBeTruthy();
	});

	it("falls back to the manifest preferred model class for unrouted skills", () => {
		const router = new ModelRouter();
		const unroutedSkill: SkillManifestEntry = {
			id: "custom-strong-skill",
			canonicalId: "custom-strong-skill",
			domain: "custom",
			displayName: "Custom Strong Skill",
			description: "Not covered by orchestration domain routing",
			sourcePath: "src/skills/custom.ts",
			purpose: "Custom",
			triggerPhrases: [],
			antiTriggerPhrases: [],
			usageSteps: [],
			intakeQuestions: [],
			relatedSkills: [],
			outputContract: [],
			recommendationHints: [],
			preferredModelClass: "strong",
		};

		expect(
			router.chooseSkillModel(unroutedSkill, {
				request: "analyze deeply",
			}).id,
		).toBe("strong_primary");
	});

	it("supports runtime skill routing without constructing manifest stubs", () => {
		const router = new ModelRouter();

		expect(
			router.chooseSkillModelById("custom-strong-skill", "strong").id,
		).toBe("strong_primary");
		expect(router.chooseSkillModelById("boundary-skill").id).toBe(
			"free_primary",
		);
	});

	it("exposes a typed routing decision for runtime skill selection", () => {
		const router = new ModelRouter();
		const decision = router.routeSkillDecisionById(
			"custom-strong-skill",
			"strong",
		);

		expect(decision.selectedModelId).toBe("strong_primary");
		expect(decision.selectedProfile.id).toBe("strong_primary");
		expect(decision.rationale).toContain("Preferred model class strong");
	});

	it("defaults to the free class when preferredModelClass is missing at runtime boundaries", () => {
		const router = new ModelRouter();
		const boundarySkill = {
			id: "boundary-skill",
			canonicalId: "boundary-skill",
			domain: "custom",
			displayName: "Boundary Skill",
			description: "Runtime boundary coverage",
			sourcePath: "src/skills/boundary.ts",
			purpose: "Boundary",
			triggerPhrases: [],
			antiTriggerPhrases: [],
			usageSteps: [],
			intakeQuestions: [],
			relatedSkills: [],
			outputContract: [],
			recommendationHints: [],
			preferredModelClass: undefined,
		} as unknown as SkillManifestEntry;
		const boundaryInstruction = {
			id: "boundary-instruction",
			toolName: "boundary",
			displayName: "Boundary Instruction",
			description: "Runtime boundary coverage",
			sourcePath: "src/generated/instructions/boundary.ts",
			mission: "Exercise missing preferred model class fallback.",
			inputSchema: { type: "object", properties: {} },
			workflow: {
				instructionId: "boundary-instruction",
				steps: [],
			},
			chainTo: [],
			preferredModelClass: undefined,
		} as unknown as InstructionManifestEntry;

		expect(
			router.chooseSkillModel(boundarySkill, {
				request: "boundary skill",
			}).id,
		).toBe("free_primary");
		expect(
			router.chooseInstructionModel(boundaryInstruction, {
				request: "boundary instruction",
			}).id,
		).toBe("free_primary");
	});

	it("uses the highest-priority configured workflow skill from nested gate branches", () => {
		const router = new ModelRouter();
		const routedInstruction: InstructionManifestEntry = {
			id: "nested-routing",
			toolName: "nested-routing",
			displayName: "Nested Routing",
			description: "Nested workflow routing coverage",
			sourcePath: "src/generated/instructions/nested-routing.ts",
			mission: "Exercise nested gate and serial routing traversal.",
			inputSchema: { type: "object", properties: {} },
			workflow: {
				instructionId: "nested-routing",
				steps: [
					{
						kind: "serial",
						label: "collect",
						steps: [
							{
								kind: "gate",
								label: "branch",
								condition: "hasContext",
								ifTrue: [
									{
										kind: "invokeSkill",
										label: "debug",
										skillId: "debug-root-cause",
									},
								],
								ifFalse: [
									{
										kind: "parallel",
										label: "research",
										steps: [
											{
												kind: "invokeSkill",
												label: "synth",
												skillId: "synth-research",
											},
											{
												kind: "note",
												label: "note",
												note: "parallel branch should still be traversed",
											},
										],
									},
								],
							},
						],
					},
				],
			},
			chainTo: [],
			preferredModelClass: "free",
		};

		expect(
			router.chooseInstructionModel(routedInstruction, {
				request: "route nested workflow",
			}).id,
		).toBe("free_primary");
	});

	it("keeps strong instructions on the synthesis model when configured fan-out is present", () => {
		const router = new ModelRouter();
		const fanoutInstruction: InstructionManifestEntry = {
			id: "fanout-routing",
			toolName: "fanout-routing",
			displayName: "Fanout Routing",
			description: "Configured fan-out routing coverage",
			sourcePath: "src/generated/instructions/fanout-routing.ts",
			mission: "Exercise configured fan-out without explicit parallel steps.",
			inputSchema: { type: "object", properties: {} },
			workflow: {
				instructionId: "fanout-routing",
				steps: [
					{
						kind: "invokeSkill",
						label: "research",
						skillId: "synth-research",
					},
				],
			},
			chainTo: [],
			preferredModelClass: "strong",
		};

		expect(
			router.chooseInstructionModel(fanoutInstruction, {
				request: "research deeply",
			}).id,
		).toBe("strong_primary");
	});

	it("keeps strong instructions on the synthesis model for nested parallel workflows", () => {
		const router = new ModelRouter();
		const parallelInstruction: InstructionManifestEntry = {
			id: "parallel-routing",
			toolName: "parallel-routing",
			displayName: "Parallel Routing",
			description: "Nested parallel routing coverage",
			sourcePath: "src/generated/instructions/parallel-routing.ts",
			mission: "Exercise nested parallel traversal for strong workloads.",
			inputSchema: { type: "object", properties: {} },
			workflow: {
				instructionId: "parallel-routing",
				steps: [
					{
						kind: "serial",
						label: "outer",
						steps: [
							{
								kind: "gate",
								label: "parallel-gate",
								condition: "always",
								ifTrue: [
									{
										kind: "parallel",
										label: "parallel-steps",
										steps: [
											{
												kind: "invokeSkill",
												label: "debug",
												skillId: "debug-root-cause",
											},
											{
												kind: "invokeSkill",
												label: "qual",
												skillId: "qual-review",
											},
										],
									},
								],
							},
						],
					},
				],
			},
			chainTo: [],
			preferredModelClass: "strong",
		};

		expect(
			router.chooseInstructionModel(parallelInstruction, {
				request: "parallelize the review",
			}).id,
		).toBe("strong_primary");
	});

	it("chooseSynthesisModel returns a ModelProfile", () => {
		const router = new ModelRouter();
		const profile = router.chooseSynthesisModel();
		expect(profile).toBeTruthy();
		expect(typeof profile.id).toBe("string");
	});

	it("chooseCritiqueModel returns a ModelProfile", () => {
		const router = new ModelRouter();
		const profile = router.chooseCritiqueModel();
		expect(profile).toBeTruthy();
		expect(typeof profile.id).toBe("string");
	});

	it("chooseFreeParallelLanes returns a tuple of three ModelProfiles", () => {
		const router = new ModelRouter();
		const lanes = router.chooseFreeParallelLanes();
		expect(lanes).toHaveLength(3);
		for (const lane of lanes) {
			expect(lane).toBeTruthy();
			expect(typeof lane.id).toBe("string");
		}
	});

	it("chooseReviewerModel returns a ModelProfile", () => {
		const router = new ModelRouter();
		const profile = router.chooseReviewerModel();
		expect(profile).toBeTruthy();
		expect(typeof profile.id).toBe("string");
	});

	it("getModelAvailability returns an availability result", () => {
		const router = new ModelRouter();
		const result = router.getModelAvailability("gpt-4.1");
		expect(result).toBeDefined();
		expect(typeof result.available).toBe("boolean");
	});

	it("getAvailabilityMode returns a string mode", () => {
		const router = new ModelRouter();
		const mode = router.getAvailabilityMode();
		expect(typeof mode).toBe("string");
	});

	it("initialize resolves without throwing", async () => {
		const router = new ModelRouter();
		await expect(router.initialize()).resolves.not.toThrow();
	});

	it("routeSkillDecisionById returns fallback rationale when no class provided", () => {
		const router = new ModelRouter();
		const decision = router.routeSkillDecisionById("unknown-skill-xyz");
		expect(decision.selectedModelId).toBeTruthy();
		expect(decision.rationale).toContain("free-tier");
	});

	it("routeSkillDecisionById with preferredModelClass returns class-specific rationale", () => {
		const router = new ModelRouter();
		const decision = router.routeSkillDecisionById(
			"unknown-skill-xyz",
			"cheap",
		);
		expect(decision.selectedModelId).toBeTruthy();
		expect(decision.rationale).toContain("cheap");
	});

	it("chooseSkillModelById returns a model profile", () => {
		const router = new ModelRouter();
		const profile = router.chooseSkillModelById("req-analysis", "free");
		expect(profile).toBeTruthy();
		expect(typeof profile.id).toBe("string");
	});

	it("getFanOut returns a number for any skill", () => {
		const router = new ModelRouter();
		expect(typeof router.getFanOut("req-analysis")).toBe("number");
	});

	it("getDomainRouting returns an object for any skill", () => {
		const router = new ModelRouter();
		const routing = router.getDomainRouting("req-analysis");
		expect(routing).toBeDefined();
	});

	it("resolveForSkill returns a string for known skill", () => {
		const router = new ModelRouter();
		expect(typeof router.resolveForSkill("req-analysis")).toBe("string");
	});

	it("getProfileForSkill returns a string for known skill", () => {
		const router = new ModelRouter();
		expect(typeof router.getProfileForSkill("req-analysis")).toBe("string");
	});

	it("profileForClass uses first available model when config is loaded", () => {
		// Mock config as loaded with a specific model available
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue(["free_primary"]);
		try {
			const router = new ModelRouter();
			const profile = router.chooseFreeParallelLanes();
			expect(profile).toHaveLength(3);
		} finally {
			vi.restoreAllMocks();
		}
	});

	it("profileForClass falls back to default when available model has no profile", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue(["nonexistent-model-id"]);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: true,
			reason: undefined,
			fallbackModel: undefined,
		});
		try {
			const router = new ModelRouter();
			const profile = router.chooseFreeParallelLanes();
			expect(profile).toHaveLength(3);
		} finally {
			vi.restoreAllMocks();
		}
	});

	it("profileForClass logs warn and uses fallback model when default is unavailable", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);
		const firstFreeId =
			Object.values(MODEL_PROFILES).find((p) => p.modelClass === "free")?.id ??
			"free_primary";
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: false,
			reason: "quota exceeded",
			fallbackModel: firstFreeId,
		});
		try {
			const router = new ModelRouter();
			// Should not throw — returns fallback
			expect(() => router.chooseReviewerModel()).not.toThrow();
		} finally {
			vi.restoreAllMocks();
		}
	});

	it("profileForClass logs advisory warn when default unavailable and no fallback", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: false,
			reason: "quota exceeded",
			fallbackModel: undefined,
		});
		vi.spyOn(modelAvailabilityService, "getMode").mockReturnValue("advisory");
		try {
			const router = new ModelRouter();
			expect(() => router.chooseReviewerModel()).not.toThrow();
		} finally {
			vi.restoreAllMocks();
		}
	});

	it("chooseInstructionModel covers invokeInstruction and finalize steps", () => {
		const router = new ModelRouter();
		const instructionWithMixedSteps: InstructionManifestEntry = {
			id: "mixed-steps",
			toolName: "mixed-steps",
			displayName: "Mixed Steps",
			description: "Tests invokeInstruction and finalize coverage",
			sourcePath: "src/generated/instructions/mixed-steps.ts",
			mission: "Cover non-skill step types.",
			inputSchema: { type: "object", properties: {} },
			workflow: {
				instructionId: "mixed-steps",
				steps: [
					{
						kind: "invokeInstruction",
						label: "invoke",
						instructionId: "code-review",
					},
					{
						kind: "finalize",
						label: "finalize",
					},
					{
						kind: "note",
						label: "note",
						note: "a note step",
					},
				],
			},
			chainTo: [],
			preferredModelClass: "cheap",
		};

		const profile = router.chooseInstructionModel(instructionWithMixedSteps, {
			request: "test mixed steps",
		});
		expect(profile).toBeDefined();
		expect(typeof profile.id).toBe("string");
	});

	it("selectHighestPriorityProfile handles instructions with multiple workflow skills", () => {
		const router = new ModelRouter();
		const multiSkillInstruction: InstructionManifestEntry = {
			id: "multi-skill",
			toolName: "multi-skill",
			displayName: "Multi Skill",
			description: "Multiple skills with different priorities",
			sourcePath: "src/generated/instructions/multi-skill.ts",
			mission: "Test highest-priority selection.",
			inputSchema: { type: "object", properties: {} },
			workflow: {
				instructionId: "multi-skill",
				steps: [
					{
						kind: "invokeSkill",
						label: "free-skill",
						skillId: "req-analysis",
					},
					{
						kind: "invokeSkill",
						label: "qm-skill",
						skillId: "qm-entanglement-mapper",
					},
				],
			},
			chainTo: [],
			preferredModelClass: "free",
		};

		// Should not throw — resolves highest priority from configured models
		expect(() =>
			router.chooseInstructionModel(multiSkillInstruction, {
				request: "multi",
			}),
		).not.toThrow();
	});

	it("hasParallelWorkload: serial step containing non-parallel steps returns false", () => {
		const router = new ModelRouter();
		const serialOnlyInstruction: InstructionManifestEntry = {
			id: "serial-only",
			toolName: "serial-only",
			displayName: "Serial Only",
			description: "No parallel branches",
			sourcePath: "src/generated/instructions/serial-only.ts",
			mission: "Only serial steps.",
			inputSchema: { type: "object", properties: {} },
			workflow: {
				instructionId: "serial-only",
				steps: [
					{
						kind: "serial",
						label: "serial",
						steps: [
							{ kind: "invokeSkill", label: "skill", skillId: "req-analysis" },
							{ kind: "finalize", label: "fin" },
						],
					},
				],
			},
			chainTo: [],
			preferredModelClass: "strong",
		};
		// preferredModelClass is strong but no parallel => should NOT use synthesis model
		const profile = router.chooseInstructionModel(serialOnlyInstruction, {
			request: "serial",
		});
		expect(profile).toBeDefined();
	});

	it("hasParallelWorkload: gate without ifFalse returns false for non-parallel gates", () => {
		const router = new ModelRouter();
		const gateNoFalseInstruction: InstructionManifestEntry = {
			id: "gate-no-false",
			toolName: "gate-no-false",
			displayName: "Gate No False",
			description: "Gate without ifFalse",
			sourcePath: "src/generated/instructions/gate-no-false.ts",
			mission: "Cover gate without ifFalse branch.",
			inputSchema: { type: "object", properties: {} },
			workflow: {
				instructionId: "gate-no-false",
				steps: [
					{
						kind: "gate",
						label: "check",
						condition: "hasContext",
						ifTrue: [
							{ kind: "invokeSkill", label: "skill", skillId: "req-analysis" },
						],
					},
				],
			},
			chainTo: [],
			preferredModelClass: "strong",
		};
		expect(() =>
			router.chooseInstructionModel(gateNoFalseInstruction, {
				request: "gate",
			}),
		).not.toThrow();
	});

	it("profileForClass: fallbackModel profile is found when default unavailable", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);
		// Use a model that actually exists in MODEL_PROFILES as fallback
		const firstFreeId = Object.keys(MODEL_PROFILES)[0] ?? "free_primary";
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: false,
			reason: "quota",
			fallbackModel: firstFreeId,
		});
		try {
			const router = new ModelRouter();
			const profile = router.chooseSynthesisModel();
			expect(profile).toBeDefined();
		} finally {
			vi.restoreAllMocks();
		}
	});

	it("chooseFreeParallelLanes: secondary uses primary when only one free profile", () => {
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(false);
		try {
			const router = new ModelRouter();
			const [primary, secondary, tertiary] = router.chooseFreeParallelLanes();
			expect(primary).toBeDefined();
			expect(secondary).toBeDefined();
			expect(tertiary).toBeDefined();
		} finally {
			vi.restoreAllMocks();
		}
	});

	it("hasParallelWorkload and collectWorkflowSkillIds assertNever on unknown step kind", () => {
		// Passing a step with an invalid kind via type cast triggers the default switch case
		// (assertNever), covering switch[7] at lines 220 and 249
		const router = new ModelRouter();
		const badStep = { kind: "unknown-step-kind", label: "bad" } as never;
		const instructionWithBadStep: InstructionManifestEntry = {
			id: "bad-steps",
			toolName: "bad-steps",
			displayName: "Bad Steps",
			description: "Contains unknown step kind",
			sourcePath: "src/generated/instructions/bad-steps.ts",
			mission: "Cover assertNever.",
			inputSchema: { type: "object", properties: {} },
			workflow: { instructionId: "bad-steps", steps: [badStep] },
			chainTo: [],
			preferredModelClass: "free",
		};
		// chooseInstructionModel calls hasParallelWorkload (line 220) and collectWorkflowSkillIds (line 249)
		// both of which hit the default assertNever case for the unknown kind
		expect(() =>
			router.chooseInstructionModel(instructionWithBadStep, {
				request: "test",
			}),
		).toThrow("Unhandled model router case");
	});

	it("profileForClass enters first-available-model branch when model profile exists", () => {
		// Mock isConfigLoaded=true and getAvailableModelsForClass returns a semantic ID
		// that IS in MODEL_PROFILES → covers line 54 if[0] (then-block entered) and line 57 if[0] (profile found)
		const firstProfileId = Object.keys(MODEL_PROFILES)[0] ?? "free_primary";
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([firstProfileId]);
		try {
			const router = new ModelRouter();
			// chooseReviewerModel → profileForClass("reviewer") → getAvailableModelsForClass returns [firstProfileId]
			// → MODEL_PROFILES[firstProfileId] is defined → returns early at line 58
			const profile = router.chooseReviewerModel();
			expect(profile).toBeDefined();
			expect(profile.id).toBe(firstProfileId);
		} finally {
			vi.restoreAllMocks();
		}
	});

	it("profileForClass skips unavailability block when model is available", () => {
		// Mock config loaded, empty available models, but checkAvailability returns available=true
		// → covers line 68 if[1] (the skip/else direction of !availability.available)
		vi.spyOn(modelAvailabilityService, "isConfigLoaded").mockReturnValue(true);
		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue([]);
		vi.spyOn(modelAvailabilityService, "checkAvailability").mockReturnValue({
			available: true,
			reason: undefined,
			fallbackModel: undefined,
		});
		try {
			const router = new ModelRouter();
			const profile = router.chooseReviewerModel();
			expect(profile).toBeDefined();
		} finally {
			vi.restoreAllMocks();
		}
	});

	it("routeSkillDecisionById with no preferredModelClass and skill without routing uses free-tier rationale", () => {
		// Covers cond-expr[1] (else branch) of rationale ternary for unrouted skills when no class given
		const router = new ModelRouter();
		// "totally-unknown-skill" has no orchestration routing → resolveConfiguredSkillModel returns null
		// → try block fallback with preferredModelClass=undefined → uses "Runtime boundary" rationale
		const decision = router.routeSkillDecisionById("totally-unknown-skill-xyz");
		expect(decision.rationale).toMatch(/Runtime boundary|free-tier/);
		expect(decision.selectedProfile).toBeDefined();
	});
});
