import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-event-horizon-detector.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-event-horizon-detector", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a dependency-risk workflow artifact set", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"this module is past its event horizon and keeps cascading changes",
				context: "dependents count is climbing quickly",
				options: {
					afferentCoupling: 8,
					efferentCoupling: 6,
					dependentsCount: 30,
				},
			},
			{
				detailIncludes: [
					"Beyond-horizon modules (dependents > r_s = 2 × coupling_mass)",
					"Immediate action: freeze the public API",
				],
				recommendationCountAtLeast: 2,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"comparison-matrix",
			"tool-chain",
		]);
	});
});
