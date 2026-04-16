import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-inflation-detector.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-inflation-detector", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits cleanup artifacts for runaway growth", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "This module keeps growing faster than the value it ships",
				options: {
					locGrowthRate: 0.24,
					valueGrowthRate: 0.08,
					currentLOC: 2600,
					currentValue: 14,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"output-template",
			"eval-criteria",
		]);
	});
});
