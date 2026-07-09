import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/eval/eval-output-grading.js";
import {
	createMockSkillRuntime,
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

	it("asks for more detail when the request has no keywords, context, or deliverable", async () => {
		await expectInsufficientSignalHandling2(
			"is it",
			"Output Grading needs the grading protocol, rubric shape, or disagreement policy before it can produce targeted grading guidance.",
		);
	});

	it("asks for more detail when the request has keywords but no grading vocabulary or context", async () => {
		await expectInsufficientSignalHandling2(
			"please assess the quality of outputs for release readiness",
			"Output Grading needs the scoring mode, the evidence standard, and how disagreements should be resolved before it can suggest a grading design.",
		);
	});

	async function expectInsufficientSignalHandling2(
		request: string,
		expectedSummaryFragment: string,
	) {
		const result = await skillModule.run({ request }, createMockSkillRuntime());
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain(expectedSummaryFragment);
		return result;
	}

	it("falls back to default gradingMode, calibration, and disagreement policy when options are omitted", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "please grade my output",
			},
			{
				summaryIncludes: [
					"Output Grading produced",
					"mode: rubric",
					"calibration: included",
					"disagreement: human-review",
				],
				detailIncludes: [
					"rubric primary mode",
					"Disagreement policy: human-review",
					"Start with a rubric plus rationale requirement",
				],
			},
		);

		// No matched keyword rules, no deliverable/successCriteria/constraints:
		// covers the details.length === 3 fallback guidance branch and the
		// false branches of hasDeliverable / hasSuccessCriteria / hasConstraints.
		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it("falls back to 'the requested outputs' when the request has no summarizable keywords", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "is it",
				context: "please grade this with a rubric",
			},
			{
				summaryIncludes: ["Output Grading produced"],
				detailIncludes: ['Grade "the requested outputs"'],
			},
		);
	});

	it("documents a rerun disagreement policy in the worked example", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "grade outputs with rubric and calibration anchors",
				context: "use pass fail rubric and judge calibration",
				options: {
					gradingMode: "rubric",
					includeCalibration: true,
					disagreementPolicy: "rerun",
				},
			},
			{
				summaryIncludes: ["disagreement: rerun"],
				detailIncludes: ["Disagreement policy: rerun"],
			},
		);
	});
});
