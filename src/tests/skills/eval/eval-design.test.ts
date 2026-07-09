import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/eval/eval-design.js";
import {
	createMockSkillRuntime,
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

	it("asks for more detail when the request has no meaningful keywords, context, or deliverable", async () => {
		// Request parses successfully (non-empty string) but every token is a
		// stop word, so signals.keywords is empty and there is no context or
		// deliverable to fall back on.
		const result = await skillModule.run(
			{ request: "a an the" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("asks for more detail when the request has a deliverable but no eval-related terms or context", async () => {
		// Has a deliverable so it clears the keywords/context/deliverable gate,
		// but the combined request+context text has no eval-domain keyword and
		// there is no context, so the third insufficient-signal gate triggers.
		const result = await skillModule.run(
			{
				request: "help me improve the widget",
				deliverable: "a short report",
			},
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("folds explicit constraints into the eval design guidance", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design an eval plan with hard negatives",
				constraints: [
					"Keep the dataset under 50 samples",
					"Only use production-shaped prompts",
				],
			},
			{
				detailIncludes: [
					"Respect these eval-design constraints",
					"Keep the dataset under 50 samples",
				],
			},
		);
	});

	it("falls back to the generic guideline when no rule matches and no extra signals are present", async () => {
		// "eval" satisfies the top-level gate check but does not match any
		// EVAL_DESIGN_RULES pattern. With assertions on (default) and no
		// sampleCount/deliverable/successCriteria/constraints, the details
		// array is exactly [opening guideline, assertions guideline] right
		// before the generic-fallback check, so details.length === 2 is true
		// and the generic "Start with a mixed golden-set..." guideline is
		// appended.
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "eval the widget behavior please",
			},
			{
				detailIncludes: [
					"Start with a mixed golden-set plus hard-negative plan",
				],
			},
		);
		expect(result.summary).toContain("Eval Design produced");
	});

	it("uses the requested keywords when present, falling back only when absent", async () => {
		// signals.keywords is derived from input.request alone; using only stop
		// words there leaves it empty, forcing the "the requested system
		// behavior" fallback even though context supplies the eval-domain terms
		// needed to pass the insufficient-signal gates.
		const result = await skillModule.run(
			{
				request: "the a an",
				context: "design an eval dataset with hard negatives",
			},
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).toContain("the requested system behavior");
	});

	it("marks the golden-set slice share as small for golden-set dataset plans", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "design a golden-set eval dataset with assertions",
				options: { datasetStyle: "golden-set" },
			},
			{
				summaryIncludes: ["dataset style: golden-set"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Eval dataset slice matrix",
					rows: expect.arrayContaining([
						expect.objectContaining({
							label: "hard negatives",
							values: expect.arrayContaining(["small share"]),
						}),
					]),
				}),
			]),
		);
	});

	it("uses singular 'guideline' when only the disclaimer accompanies the summary line", async () => {
		// No matched rule, assertions explicitly omitted, and no sampleCount,
		// deliverable, successCriteria, or constraints -- the details array ends
		// up with just the opening guideline plus the advisory disclaimer, so
		// the summary's pluralization ternary takes its singular branch.
		await expectSkillGuidance(
			skillModule,
			{
				request: "eval the widget behavior please",
				options: { includeAssertions: false },
			},
			{
				summaryIncludes: [
					"Eval Design produced 1 evaluation-design guideline (",
					"assertions: omitted",
				],
			},
		);
	});
});
