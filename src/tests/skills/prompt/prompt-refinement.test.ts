import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/prompt/prompt-refinement.js";
import {
	createMockSkillRuntime,
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("prompt-refinement", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("produces before/after refinement guidance with an experiment plan", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Improve my prompt because it hallucinates citations, drifts from JSON format, and shows flaky output variance",
				context:
					"Eval runs show unsupported citations on 3 of 10 examples and malformed JSON on long documents.",
				successCriteria:
					"supported citations and valid JSON across the regression set",
				options: {
					evidenceMode: "eval-results",
					maxExperiments: 2,
					preserveStructure: true,
				},
			},
			{
				summaryIncludes: ["Prompt Refinement produced"],
				detailIncludes: ["one causal variable", "grounding", "contract"],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[3]).toMatchObject({
			kind: "worked-example",
			title: "Before/after refinement example",
		});
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("treats a valid request with no context/success/deliverable but refinement evidence keywords as sufficient signal", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "The eval run shows a regression versus the previous version",
			},
			{
				summaryIncludes: ["Prompt Refinement produced"],
			},
		);

		expect(result.summary).toContain("observed-failures");
		expect(result.summary).toContain("max experiments: 3");
		expect(result.summary).toContain("preserve structure: yes");
		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
		]);
	});

	it("reports insufficient signal when the request carries no context, success criteria, deliverable, or refinement evidence", async () => {
		const result = await skillModule.run(
			{ request: "Help me write a prompt for a new chatbot feature" },
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain(
			"Prompt Refinement needs an existing prompt failure",
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("rejects malformed options and surfaces the validation error", async () => {
		const result = await skillModule.run(
			{
				request: "Fix my flaky prompt",
				options: { maxExperiments: 99 },
			},
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain("Invalid input");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("applies default evidenceMode, maxExperiments, and preserveStructure when options are omitted", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "The prompt output is flaky and inconsistent between runs",
			},
			{
				summaryIncludes: ["observed-failures", "max experiments: 3", "yes"],
			},
		);

		expect(result.summary).toContain("3 iteration guardrail");
	});

	it("uses singular 'experiment' wording and disables preserveStructure when maxExperiments is 1", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "The prompt is too verbose and refuses valid requests",
				context: "Users report over-refusal on benign asks.",
				options: {
					maxExperiments: 1,
					preserveStructure: false,
				},
			},
			{
				summaryIncludes: ["preserve structure: no"],
				detailIncludes: ["Plan up to 1 refinement experiment for"],
			},
		);

		expect(result.summary).toContain("max experiments: 1");
	});

	it("uses singular 'guardrail' wording when exactly one detail is produced", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "The prompt eval shows a regression",
				options: {
					preserveStructure: false,
				},
			},
			{},
		);

		expect(result.summary).toMatch(/\bproduced 1 iteration guardrail\b/);
		expect(result.summary).not.toMatch(/\bguardrails\b/);
	});

	it("keeps the refinement loop inside stated constraints when constraints are provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "The prompt is too costly and slow due to token bloat",
				context: "Latency budget is exceeded on long documents.",
				constraints: [
					"Must stay under 2s p95 latency",
					"No new external dependencies",
				],
			},
			{
				detailIncludes: [
					"Keep the refinement loop inside the stated constraints",
				],
			},
		);

		expect(result.recommendations.map((r) => r.detail).join("\n")).toContain(
			"Must stay under 2s p95 latency; No new external dependencies",
		);
	});

	it("matches the refusal/policy refinement rule", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"The assistant is over-refusing safe requests due to an overly strict compliance policy",
				context: "We observed blocked responses on clearly permitted tasks.",
			},
			{
				detailIncludes: ["Distinguish between over-refusal and under-refusal"],
			},
		);
	});

	it("matches the edge-case/coverage refinement rule", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"We keep missing edge case coverage and failing corner test cases",
				context: "New fail case reports came in from QA this week.",
			},
			{
				detailIncludes: [
					"Expand the evaluation set with targeted failure cases",
				],
			},
		);
	});

	it("falls back to 'the failing prompt' when the request has no extractable keywords", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "do it",
				context: "Eval results show it is not working as expected.",
			},
			{
				detailIncludes: [
					'Plan up to 3 refinement experiments for "the failing prompt"',
				],
			},
		);

		expect(result.recommendations.map((r) => r.detail).join("\n")).toContain(
			'"the failing prompt"',
		);
	});

	it("omits the eval-criteria artifact and falls back to an empty successCriteria placeholder when none is provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "The prompt fails on a regression eval and needs comparison",
				context: "Paired comparison against the prior version shows drift.",
				deliverable: "A revised production prompt",
			},
			{
				detailIncludes: ['improves delivery of "A revised production prompt"'],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
		]);
		expect(result.artifacts?.[3]).toMatchObject({
			kind: "worked-example",
			input: expect.objectContaining({ successCriteria: "" }),
		});
	});
});
