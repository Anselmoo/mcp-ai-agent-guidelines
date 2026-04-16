import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/req/req-acceptance-criteria.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("req-acceptance-criteria", () => {
	it("formats gherkin acceptance criteria with constraints", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "define acceptance criteria for audit export",
				constraints: ["must be deterministic"],
				options: {
					format: "gherkin",
					includeSadPath: true,
				},
			},
			{
				summaryIncludes: [
					"Acceptance Criteria generated",
					"format: gherkin",
					"constraints: wired",
				],
				detailIncludes: [
					"Happy-path criterion (gherkin)",
					"Sad-path criterion",
				],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"eval-criteria",
			"worked-example",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Acceptance criteria template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
