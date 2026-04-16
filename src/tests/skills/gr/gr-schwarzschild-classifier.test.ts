import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-schwarzschild-classifier.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-schwarzschild-classifier", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits zone-classification artifacts for coupling pressure", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Classify whether this module is near its coupling horizon",
				options: {
					couplingMass: 18,
					currentCoupling: 40,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"comparison-matrix",
			"eval-criteria",
		]);
	});
});
