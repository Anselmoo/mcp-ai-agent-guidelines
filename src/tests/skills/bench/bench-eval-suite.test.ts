import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/bench/bench-eval-suite.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("bench-eval-suite", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("produces eval-suite artifacts with a dimension matrix", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"design an eval suite for accuracy and safety with hard negatives",
				options: {
					dimensions: ["accuracy", "safety", "cost"],
					includeHardNegatives: true,
					judgeStrategy: "rubric",
				},
			},
			{
				summaryIncludes: ["Eval Suite Designer produced", "grader: rubric"],
				detailIncludes: ["hard negatives", "dimension"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Eval suite dimension matrix",
				}),
				expect.objectContaining({
					kind: "output-template",
					title: "Eval suite manifest template",
				}),
				expect.objectContaining({
					kind: "tool-chain",
					title: "Eval suite execution flow",
				}),
				expect.objectContaining({
					kind: "eval-criteria",
					title: "Eval suite release criteria",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Eval suite example",
				}),
			]),
		);
	});
});
