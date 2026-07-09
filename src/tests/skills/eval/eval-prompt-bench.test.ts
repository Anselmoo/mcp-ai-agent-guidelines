import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/eval/eval-prompt-bench.js";
import {
	createMockSkillRuntime,
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

	it("asks for more detail when the request has no meaningful keywords, context, or deliverable", async () => {
		// Request parses successfully (non-empty string) but every token is a
		// stop word, so signals.keywords is empty and there is no context or
		// deliverable to fall back on.
		const result = await skillModule.run(
			{ request: "the a an" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("asks for more detail when the request has keywords but no prompt-benchmark terms or context", async () => {
		// Has real keywords so it clears the keywords/context/deliverable gate,
		// but the combined request+context text has no prompt-benchmark keyword
		// and there is no context, so the third insufficient-signal gate fires.
		const result = await skillModule.run(
			{ request: "analyze latency scores today" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("falls back to a generic subject label when the request has no keywords but has context", async () => {
		// hasContext bypasses both insufficient-signal gates even though the
		// request itself has zero keywords, so summarizeKeywords(...) joins to
		// an empty string and the "the requested prompt variants" fallback label
		// is used instead.
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "the a an",
				context: "benchmark this variant against the baseline",
			},
			{
				detailIncludes: ["the requested prompt variants"],
			},
		);
		expect(result.summary).toContain("Prompt Benchmarking produced");
	});

	it("defaults comparison mode and regression window when options are omitted", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "benchmark these prompt variants",
			},
			{
				summaryIncludes: [
					"comparison mode: baseline-first",
					"regression window: single-release",
				],
			},
		);
	});

	it("folds deliverable, success criteria, and constraints into the guidance", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "benchmark prompt variants for latency and quality",
				deliverable: "a release-decision memo",
				successCriteria: "the winning prompt beats baseline on every segment",
				constraints: ["stay within the existing token budget"],
			},
			{
				detailIncludes: [
					"a release-decision memo",
					"the winning prompt beats baseline on every segment",
					"stay within the existing token budget",
				],
			},
		);
	});

	it("keeps the multi-release monitoring decision in the worked example", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "benchmark prompt variants across releases",
				options: {
					regressionWindow: "multi-release",
				},
			},
			{
				summaryIncludes: ["regression window: multi-release"],
			},
		);
	});

	it("uses the generic fallback guideline when no rule matches and no options are set", async () => {
		// "prompt" satisfies the top-level gate keyword without matching any of
		// the EVAL_PROMPT_BENCH_RULES patterns, and no promptCount/deliverable/
		// successCriteria/constraints are supplied, so details.length === 1 right
		// before the generic fallback guideline is appended.
		await expectSkillGuidance(
			skillModule,
			{ request: "prompt" },
			{
				detailIncludes: [
					"Start with a baseline-first comparison, keep the benchmark family fixed",
				],
			},
		);
	});
});
