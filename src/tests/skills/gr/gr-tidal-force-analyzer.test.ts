import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-tidal-force-analyzer.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-tidal-force-analyzer", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits split-candidate artifacts for differential coupling", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Which module is being torn apart by mixed responsibilities?",
				options: {
					maxCoupling: 8,
					minCoupling: 2,
					meanCohesion: 0.6,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Tidal force worked example",
				"Tidal split matrix",
				"Tidal analysis checks",
			]),
		);
	});
});
