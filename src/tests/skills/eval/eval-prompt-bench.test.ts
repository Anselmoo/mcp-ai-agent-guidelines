import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/eval/eval-prompt-bench.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("eval-prompt-bench", () => {
	it("builds baseline-first prompt benchmarking guidance", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"benchmark prompts for latency quality and baseline regression",
				options: {
					comparisonMode: "baseline-first",
					regressionWindow: "single-release",
				},
			},
			{
				summaryIncludes: [
					"Prompt Benchmarking produced",
					"comparison mode: baseline-first",
					"single-release",
				],
				detailIncludes: ["baseline-first comparison mode"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("builds prompt benchmark artifacts and execution flow", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"benchmark prompts for latency quality and baseline regression",
				options: {
					comparisonMode: "baseline-first",
					regressionWindow: "single-release",
					promptCount: 3,
				},
			},
			{
				summaryIncludes: ["Prompt Benchmarking produced", "prompt count: 3"],
				detailIncludes: ["baseline-first comparison mode", "benchmark family"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Prompt benchmark matrix",
				}),
				expect.objectContaining({
					kind: "eval-criteria",
					title: "Prompt benchmark acceptance criteria",
				}),
				expect.objectContaining({
					kind: "output-template",
					title: "Prompt benchmark protocol template",
				}),
				expect.objectContaining({
					kind: "tool-chain",
					title: "Prompt benchmarking flow",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Prompt benchmark decision example",
				}),
			]),
		);
	});
});
