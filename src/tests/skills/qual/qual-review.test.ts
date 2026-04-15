import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qual/qual-review.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("qual-review", () => {
	it("targets naming and error-path review dimensions", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "review naming complexity tests and error handling",
				deliverable: "engineering audit",
				constraints: ["keep recommendations scoped"],
			},
			{
				summaryIncludes: ["Quality Review surfaced", "engineering audit"],
				detailIncludes: ["Audit naming conventions", "Audit every error path"],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"eval-criteria",
			"comparison-matrix",
			"tool-chain",
			"worked-example",
		]);
		expect(result.artifacts?.[3]).toMatchObject({
			kind: "tool-chain",
			title: "Review evidence loop",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
