import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-penrose-diagram-mapper.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-penrose-diagram-mapper", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits causal-structure artifacts for dependency paths", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Map the causal relationship between these modules",
				options: {
					pathLength: 3,
					moduleCount: 18,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"comparison-matrix",
			"tool-chain",
		]);
	});
});
