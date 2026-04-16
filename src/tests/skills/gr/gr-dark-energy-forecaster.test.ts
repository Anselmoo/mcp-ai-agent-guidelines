import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-dark-energy-forecaster.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-dark-energy-forecaster", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a cleanup worksheet and remediation matrix", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "reduce boilerplate and naming ceremony in the module",
				context: "convention lines outnumber functional lines",
				options: {
					conventionLines: 42,
					functionalLines: 28,
				},
			},
			{
				detailIncludes: [
					"Boilerplate is the primary dark energy source.",
					"Naming convention overhead contributes to dark energy when prefixes/suffixes encode metadata already available through type systems or module boundaries",
				],
				recommendationCountAtLeast: 2,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"comparison-matrix",
			"output-template",
		]);
	});
});
