import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-bloch-interpolator.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-bloch-interpolator", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits transition artifacts for a named style migration", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "interpolate between functional and object-oriented styles",
				options: {
					styleAName: "functional",
					styleBName: "object-oriented",
					steps: 5,
					stateA: [1, 0, 0],
					stateB: [0, 1, 0],
				},
			},
			{
				recommendationCountAtLeast: 3,
				detailIncludes: ["The runtime bridge is still in progress"],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Bloch transition worked example",
				"Bloch transition review template",
				"Style transition comparison matrix",
				"Transition checkpoint evidence chain",
			]),
		);
	});
});
