import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-gravitational-wave-detector.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-gravitational-wave-detector", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("grounds strain analysis in static evidence and richer artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"measure the ripple from this large refactor and compare before after dependency snapshots",
				options: {
					couplingBefore: 10,
					couplingAfter: 18,
				},
			},
			{
				recommendationCountAtLeast: 3,
				detailIncludes: [
					"The runtime bridge is still in progress",
					"strain=0.8",
				],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"output-template",
			"comparison-matrix",
			"tool-chain",
		]);
	});
});
