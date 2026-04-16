import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-redshift-velocity-mapper.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-redshift-velocity-mapper", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits API-drift artifacts for contract evolution", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Has this API stretched beyond its original contract?",
				options: {
					originalExports: 12,
					currentExports: 19,
					abstractionLayers: 3,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Redshift drift worked example",
				"API drift review memo",
				"API redshift checks",
			]),
		);
	});
});
