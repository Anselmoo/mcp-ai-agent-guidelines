import { describe, expect, it } from "vitest";
import type {
	InstructionManifestEntry,
	SkillManifestEntry,
} from "../../contracts/generated.js";
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
});
