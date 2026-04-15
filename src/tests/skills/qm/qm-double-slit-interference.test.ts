import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-double-slit-interference.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-double-slit-interference", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits compatibility artifacts for two competing approaches", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Do these two implementations complement each other or conflict?",
				options: {
					analysisGoal: "merge",
					intensityA: 0.8,
					intensityB: 0.7,
					cosineSimilarity: 0.9,
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
