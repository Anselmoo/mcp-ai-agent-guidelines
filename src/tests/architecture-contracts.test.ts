import { describe, expect, it } from "vitest";
import type { ModelClass, SkillManifestEntry } from "../contracts/generated.js";
import type { InstructionInput, ModelProfile } from "../contracts/runtime.js";
import { HIDDEN_SKILL_MODULES } from "../generated/registry/hidden-skills.js";
import { MODEL_PROFILES } from "../models/model-profile.js";
import { ModelRouter } from "../models/model-router.js";
import { OrchestrationPatterns } from "../models/orchestration-patterns.js";

const TEST_INPUT: InstructionInput = {
	request: "validate architecture contract routing",
};

function createSkillManifest(
	id: string,
	preferredModelClass: ModelClass,
): SkillManifestEntry {
	return {
		id,
		canonicalId: id,
		domain: "test",
		displayName: id,
		description: `Test manifest for ${id}`,
		sourcePath: `src/tests/${id}.ts`,
		purpose: "Architecture contract testing",
		triggerPhrases: [],
		antiTriggerPhrases: [],
		usageSteps: [],
		intakeQuestions: [],
		relatedSkills: [],
		outputContract: [],
		recommendationHints: [],
		preferredModelClass,
	};
}

function expectAllCostTiers(
	models: readonly ModelProfile[],
	expectedTier: ModelProfile["costTier"],
): void {
	for (const model of models) {
		expect(model.costTier).toBe(expectedTier);
	}
}

function getSkillsByPrefix(prefix: string) {
	return HIDDEN_SKILL_MODULES.filter((module) =>
		module.manifest.id.startsWith(prefix),
	);
}

describe("Model tier classification", () => {
	it("free_primary is free tier", () => {
		expect(MODEL_PROFILES["free_primary"]?.costTier).toBe("free");
	});

	it("free_secondary is free tier", () => {
		expect(MODEL_PROFILES["free_secondary"]?.costTier).toBe("free");
	});

	it("cheap_primary is cheap tier", () => {
		expect(MODEL_PROFILES["cheap_primary"]?.costTier).toBe("cheap");
	});

	it("strong_primary is strong tier", () => {
		expect(MODEL_PROFILES["strong_primary"]?.costTier).toBe("strong");
	});

	it("strong_secondary is strong tier", () => {
		expect(MODEL_PROFILES["strong_secondary"]?.costTier).toBe("strong");
	});
});

describe("ModelRouter routing", () => {
	const router = new ModelRouter();

	it("routes free class to a free-tier model", () => {
		const profile = router.chooseSkillModel(
			createSkillManifest("test-free", "free"),
			TEST_INPUT,
		);

		expect(profile.costTier).toBe("free");
		expect(profile.id).toBe("free_primary");
	});

	it("routes cheap class to cheap or free tier, never strong", () => {
		const profile = router.chooseSkillModel(
			createSkillManifest("test-cheap", "cheap"),
			TEST_INPUT,
		);

		expect(["free", "cheap"]).toContain(profile.costTier);
		expect(profile.costTier).not.toBe("strong");
	});

	it("routes strong class to a strong tier model", () => {
		const profile = router.chooseSkillModel(
			createSkillManifest("test-strong", "strong"),
			TEST_INPUT,
		);

		expect(profile.costTier).toBe("strong");
		expect(profile.id).toBe("strong_primary");
	});

	it("chooseFreeParallelLanes returns exactly 3 models, all free tier", () => {
		const profiles = router.chooseFreeParallelLanes();

		expect(profiles).toHaveLength(3);
		expect(profiles[0]?.id).toBe("free_primary");
		expectAllCostTiers(profiles, "free");
	});

	it("chooseSynthesisModel returns strong tier", () => {
		const profile = router.chooseSynthesisModel();

		expect(profile.costTier).toBe("strong");
		expect(profile.id).toBe("strong_primary");
	});

	it("chooseCritiqueModel returns strong tier", () => {
		const profile = router.chooseCritiqueModel();

		expect(profile.costTier).toBe("strong");
	});
});

describe("OrchestrationPatterns roles", () => {
	const patterns = new OrchestrationPatterns(new ModelRouter());

	it("Pattern 1: synthesis and critique are both strong tier", () => {
		const roles = patterns.pattern1Roles();

		expect(roles.planModel.costTier).toBe("strong");
		expect(roles.critiqueModel.costTier).toBe("strong");
		expect(roles.synthesisModel.costTier).toBe("strong");
		expectAllCostTiers(
			[roles.planModel, roles.critiqueModel, roles.synthesisModel],
			"strong",
		);
	});

	it("Pattern 2: draft is free, review is strong", () => {
		const roles = patterns.pattern2Roles();

		expect(roles.draftModel.costTier).toBe("free");
		expect(roles.draftModel.id).toBe("free_primary");
		expect(roles.reviewModel.costTier).toBe("strong");
	});

	it("Pattern 3: all 3 voters are free tier", () => {
		const roles = patterns.pattern3Roles();

		expect(roles.voters).toHaveLength(3);
		expectAllCostTiers(roles.voters, "free");
		expect(roles.tiebreak1.costTier).toBe("strong");
		expect(roles.tiebreak2.costTier).toBe("strong");
	});

	it("Pattern 5: freeModels has 3 entries, all free; synthesisModel is strong", () => {
		const roles = patterns.pattern5Roles();

		expect(roles.freeModels).toHaveLength(3);
		expectAllCostTiers(roles.freeModels, "free");
		expect(roles.synthesisModel.costTier).toBe("strong");
		expect(roles.synthesisModel.id).toBe("strong_primary");
	});
});

describe("Cost hierarchy — free first", () => {
	const router = new ModelRouter();

	it("free lane count is at least 2 and includes free_primary + free_secondary", () => {
		const freeModels = Object.values(MODEL_PROFILES).filter(
			(model) => model.costTier === "free",
		);

		expect(freeModels.length).toBeGreaterThanOrEqual(2);
		expect(freeModels.map((model) => model.id)).toEqual(
			expect.arrayContaining(["free_primary", "free_secondary"]),
		);
	});

	it("strong models are never selected for free-tier tasks", () => {
		const profile = router.chooseSkillModel(
			createSkillManifest("test-free-lane", "free"),
			TEST_INPUT,
		);

		expect(profile.costTier).not.toBe("strong");
		expect(profile.costTier).toBe("free");
	});

	it("no single-model strong path exists when free parallel is available", () => {
		const pattern5 = new OrchestrationPatterns(router).pattern5Roles();

		expect(pattern5.freeModels).toHaveLength(3);
		expectAllCostTiers(pattern5.freeModels, "free");
		expect(pattern5.synthesisModel.costTier).toBe("strong");
	});
});

describe("Skill class routing contract", () => {
	const router = new ModelRouter();

	it("physics skills (qm-*, gr-*) route to strong", () => {
		const physicsSkills = [
			...getSkillsByPrefix("qm-"),
			...getSkillsByPrefix("gr-"),
		];

		expect(physicsSkills.length).toBeGreaterThan(0);
		for (const module of physicsSkills) {
			expect(module.manifest.preferredModelClass).toBe("strong");
			expect(
				router.chooseSkillModel(module.manifest, TEST_INPUT).costTier,
			).toBe("strong");
		}
	});

	it("governance skills (gov-*) route to strong", () => {
		const governanceSkills = getSkillsByPrefix("gov-");

		expect(governanceSkills.length).toBeGreaterThan(0);
		for (const module of governanceSkills) {
			expect(module.manifest.preferredModelClass).toBe("strong");
			expect(
				router.chooseSkillModel(module.manifest, TEST_INPUT).costTier,
			).toBe("strong");
		}
	});
});
