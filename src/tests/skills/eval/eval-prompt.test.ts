import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/eval/eval-prompt.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("eval-prompt", () => {
	it("evaluates prompts against a golden-set baseline", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "evaluate prompt quality with assertions and failure cases",
				options: {
					scoreMode: "single",
					benchmarkFamily: "golden-set",
					includeBaseline: true,
				},
			},
			{
				summaryIncludes: [
					"Prompt Evaluation produced",
					"golden-set",
					"baseline: included",
				],
				detailIncludes: ["golden-set benchmark family"],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("returns prompt-eval artifacts for a baseline comparison", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"evaluate prompt quality with failure cases and baseline review",
				options: {
					scoreMode: "single",
					benchmarkFamily: "golden-set",
					includeBaselines: true,
				},
			},
			{
				summaryIncludes: ["Prompt Evaluation produced", "baseline: included"],
				detailIncludes: ["baseline prompt", "golden-set benchmark family"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Prompt evaluation matrix",
				}),
				expect.objectContaining({
					kind: "eval-criteria",
					title: "Prompt evaluation acceptance criteria",
				}),
				expect.objectContaining({
					kind: "output-template",
					title: "Prompt eval report template",
				}),
				expect.objectContaining({
					kind: "tool-chain",
					title: "Prompt evaluation workflow",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Prompt baseline comparison example",
				}),
			]),
		);
	});

	it("asks for more detail when the request has no keywords, context, or deliverable", async () => {
		const result = await skillModule.run(
			{ request: "the a an" },
			createMockSkillRuntime(),
		);

		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"Prompt Evaluation needs the prompt objective, benchmark surface, or scoring intent",
		);
	});

	it("asks for more detail when the combined text has no eval keywords and no context", async () => {
		const result = await skillModule.run(
			{
				request: "improve this general asset thing",
				deliverable: "a report",
			},
			createMockSkillRuntime(),
		);

		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"Prompt Evaluation needs the prompt family, benchmark shape",
		);
	});

	it("falls back to a generic prompt label when no keywords are extracted but context carries signal", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "the a",
				context: "evaluate this prompt properly",
			},
			{
				detailIncludes: ['Evaluate "the requested prompt asset"'],
			},
		);
	});

	it("defaults score mode and benchmark family when options are omitted", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "evaluate prompt quality with failure cases",
			},
			{
				summaryIncludes: ["score mode: single", "benchmark family: golden-set"],
			},
		);
	});

	it("adds deliverable, success criteria, and constraint guidance, and omits the baseline when disabled", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "evaluate prompt quality with failure cases",
				deliverable: "a go/no-go recommendation",
				successCriteria: "no regressions on the failure slice",
				constraints: ["limited eval budget", "single rater available"],
				options: {
					includeBaselines: false,
				},
			},
			{
				summaryIncludes: ["baseline: omitted"],
				detailIncludes: [
					'Shape the prompt-eval report to support the requested deliverable: "a go/no-go recommendation"',
					'Turn the success criteria into prompt-eval pass signals: "no regressions on the failure slice"',
					"Respect these prompt-eval constraints: limited eval budget; single rater available",
				],
			},
		);

		expect(result.summary).toContain("guidelines");
		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "worked-example",
					title: "Prompt baseline comparison example",
					expectedOutput: expect.objectContaining({
						nextStep: "re-run with a baseline for confirmation",
					}),
				}),
			]),
		);
	});

	it("adds the generic fallback guideline when no eval rules match but context bypasses the keyword gate", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "please look at this general asset",
				context: "some unrelated context info",
			},
			{
				detailIncludes: [
					"Start with a baseline comparison on a stable prompt set",
				],
			},
		);

		expect(result.summary).toContain("3 prompt-eval guidelines");
	});

	it("uses singular guideline wording when only the base guideline and disclaimer remain", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "please look at this general asset",
				context: "some unrelated context info",
				options: {
					includeBaselines: false,
				},
			},
			{
				summaryIncludes: ["1 prompt-eval guideline ", "baseline: omitted"],
			},
		);

		expect(result.summary).not.toContain("guidelines");
	});
});
