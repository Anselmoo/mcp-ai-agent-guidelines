import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-phase-kickback-reviewer.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-phase-kickback-reviewer", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits architecture-signal artifacts for dominant carriers", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Which file has the strongest architectural signal?",
				options: {
					probeDimension: 96,
					files: [
						{ name: "router.ts", tokenCount: 420, phase: 0.41 },
						{ name: "controller.ts", tokenCount: 360, phase: 0.28 },
						{ name: "helpers.ts", tokenCount: 90, phase: 0.05 },
					],
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Phase kickback worked example",
				"Phase review action matrix",
				"Phase kickback review checks",
			]),
		);
	});
});
