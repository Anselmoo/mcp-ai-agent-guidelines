import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/req/req-scope.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("req-scope", () => {
	it("separates in-scope and out-of-scope work across phases", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"scope audit export for this release and leave analytics later",
				constraints: ["two engineers"],
				options: {
					includeOutOfScope: true,
					phaseCount: 3,
				},
			},
			{
				summaryIncludes: ["Scope Analysis identified", "constraints: provided"],
				detailIncludes: [
					"Document explicit out-of-scope items",
					"Structure delivery in 3 phases",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"comparison-matrix",
			"eval-criteria",
			"worked-example",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "output-template",
			title: "Scope contract template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
