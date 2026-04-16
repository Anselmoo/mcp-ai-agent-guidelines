import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-measurement-collapse.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-measurement-collapse", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits backaction artifacts for a selection decision", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "choose the implementation and review adjacent modules",
				options: {
					collapseScope: "subsystem",
					backactionRadius: "transitive",
					selectedSimilarity: 0.72,
					adjacentCount: 4,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Measurement collapse worked example",
				"Measurement backaction map template",
				"Measurement collapse review chain",
			]),
		);
	});
});
