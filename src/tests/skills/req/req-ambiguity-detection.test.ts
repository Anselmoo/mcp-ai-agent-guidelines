import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/req/req-ambiguity-detection.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("req-ambiguity-detection", () => {
	it("flags subjective requirement language", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"find ambiguous requirements around latency being fast secure and scalable",
				options: {
					includeClarifyingQuestions: true,
				},
			},
			{
				summaryIncludes: [
					"Ambiguity Detection found",
					"potential ambiguity pattern",
				],
				detailIncludes: ["Subjective terms found: fast", "Clarifying question"],
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
			title: "Ambiguity register template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
