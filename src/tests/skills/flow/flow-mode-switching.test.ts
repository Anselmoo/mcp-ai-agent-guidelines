import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/flow/flow-mode-switching.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("flow-mode-switching", () => {
	it("plans evidence-based mode transitions", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "switch from planning to code once scope is fixed",
				context: "accepted requirements and first validation target exist",
				options: {
					currentMode: "plan",
					targetMode: "code",
				},
			},
			{
				summaryIncludes: [
					"Mode Switching planned",
					"current: plan, next: code",
				],
				detailIncludes: [
					"exit criterion for plan mode before entering code mode",
					"freeze the handoff package",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Transition memo template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
