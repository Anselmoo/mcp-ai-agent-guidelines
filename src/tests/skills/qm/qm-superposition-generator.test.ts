import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-superposition-generator.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-superposition-generator", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits ranking artifacts with static evidence grounding", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"rank these candidate implementations and pick the best option",
				options: {
					scores: [0.8, 0.6, 0.4],
					selectionCriteria: "balanced",
					candidateCount: 3,
				},
			},
			{
				recommendationCountAtLeast: 4,
				detailIncludes: [
					"Born-rule probability ranking from provided scores",
					"The runtime bridge is still in progress",
				],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"output-template",
			"comparison-matrix",
			"eval-criteria",
			"tool-chain",
		]);
	});
});
