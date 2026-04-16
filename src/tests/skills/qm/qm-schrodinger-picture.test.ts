import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-schrodinger-picture.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-schrodinger-picture", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits forecast artifacts for short-horizon drift", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Predict the future code state from recent snapshots",
				options: {
					steps: 2,
					snapshots: [
						{ label: "v1", state: [0.2, 0.1, 0.3] },
						{ label: "v2", state: [0.3, 0.2, 0.4] },
						{ label: "v3", state: [0.5, 0.3, 0.6] },
					],
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Schrodinger forecast worked example",
				"Short-horizon drift memo",
				"Trajectory forecast checks",
			]),
		);
	});
});
