import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/eval/eval-variance.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("eval-variance", () => {
	it("analyzes repeated-run variance", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "measure repeated-run variance and flaky output stability",
				options: {
					varianceSource: "mixed",
				},
			},
			{
				summaryIncludes: [
					"Variance Analysis produced",
					"variance source: mixed",
				],
				detailIncludes: ["focus on mixed as the likely source"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("returns variance matrices and acceptance criteria", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "measure repeated-run variance and flaky output stability",
				options: { varianceSource: "mixed", runCount: 8, tolerancePct: 12 },
			},
			{
				summaryIncludes: ["Variance Analysis produced", "tolerance: 12%"],
				detailIncludes: ["spread of outcomes", "acceptable tolerance"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Variance run matrix",
				}),
				expect.objectContaining({
					kind: "tool-chain",
					title: "Variance analysis workflow",
				}),
				expect.objectContaining({
					kind: "output-template",
					title: "Variance report template",
				}),
				expect.objectContaining({
					kind: "eval-criteria",
					title: "Variance acceptance criteria",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Variance triage example",
				}),
			]),
		);
	});
});
