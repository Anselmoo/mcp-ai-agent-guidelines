import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-frame-dragging-detector.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-frame-dragging-detector", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits change-propagation artifacts for high-drag modules", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Which module is dragging neighbouring changes with it?",
				options: {
					churnRate: 9,
					coupling: 14,
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
