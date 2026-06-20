import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/eval/eval-design.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("eval-design", () => {
	it("reflects dataset and assertion planning inputs", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design an eval dataset with assertions and hard negatives",
				deliverable: "release gate plan",
				successCriteria: "block regressions",
				options: {
					datasetStyle: "hard-negative-heavy",
					sampleCount: 24,
				},
			},
			{
				summaryIncludes: [
					"Eval Design produced",
					"dataset style: hard-negative-heavy",
					"sample target: 24",
				],
				detailIncludes: [
					"hard-negative-heavy dataset shape",
					"Write assertions or rubric checks",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("builds dataset slice artifacts for hard-negative-heavy plans", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "design an eval dataset with hard negatives and assertions",
				options: { datasetStyle: "hard-negative-heavy", sampleCount: 24 },
			},
			{
				summaryIncludes: ["Eval Design produced", "sample target: 24"],
				detailIncludes: ["Write assertions or rubric checks"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Eval dataset slice matrix",
				}),
				expect.objectContaining({
					kind: "tool-chain",
					title: "Eval design workflow",
				}),
				expect.objectContaining({
					kind: "output-template",
					title: "Eval plan template",
				}),
				expect.objectContaining({
					kind: "eval-criteria",
					title: "Eval design criteria",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Eval design example",
				}),
			]),
		);
	});
});
