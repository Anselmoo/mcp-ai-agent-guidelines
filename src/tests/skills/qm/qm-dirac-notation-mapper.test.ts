import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-dirac-notation-mapper.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-dirac-notation-mapper", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits overlap artifacts for centrality analysis", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Which files are most central in this package based on overlap?",
				options: {
					focus: "centrality",
					fileCount: 8,
					pairOverlap: 0.87,
					projectionWeight: 2.4,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Dirac overlap worked example",
				"Dirac mapping decision matrix",
				"Dirac mapping checks",
			]),
		);
	});
});
