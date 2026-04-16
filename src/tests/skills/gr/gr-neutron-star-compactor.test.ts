import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-neutron-star-compactor.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-neutron-star-compactor", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits compaction artifacts for dense blob files", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Is this file collapsing into a blob?",
				options: {
					linesOfCode: 640,
					cyclomaticComplexity: 18,
					cohesion: 0.32,
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
