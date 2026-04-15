import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/eval/eval-output-grading.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("eval-output-grading", () => {
	it("configures rubric grading and adjudication", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"grade outputs with rubric schema and disagreement calibration for release gate",
				context: "use pass fail rubric and judge calibration",
				options: {
					gradingMode: "rubric",
					includeCalibration: true,
					disagreementPolicy: "adjudicate",
				},
			},
			{
				summaryIncludes: [
					"Output Grading produced",
					"mode: rubric",
					"disagreement: adjudicate",
				],
				detailIncludes: ["rubric primary mode", "calibration"],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("adds rubric, mode, and calibration artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "grade outputs with rubric and calibration anchors",
				context: "use pass fail rubric and judge calibration",
				options: {
					gradingMode: "rubric",
					includeCalibration: true,
					disagreementPolicy: "adjudicate",
				},
			},
			{
				summaryIncludes: ["Output Grading produced", "mode: rubric"],
				detailIncludes: ["calibration examples", "Disagreement policy"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "output-template",
					title: "Grading rubric template",
				}),
				expect.objectContaining({
					kind: "eval-criteria",
					title: "Grading acceptance criteria",
				}),
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Grading mode comparison",
				}),
				expect.objectContaining({
					kind: "tool-chain",
					title: "Output grading workflow",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Calibration and disagreement example",
				}),
			]),
		);
	});
});
