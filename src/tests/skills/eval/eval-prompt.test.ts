import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/eval/eval-prompt.js";
import {
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
});
