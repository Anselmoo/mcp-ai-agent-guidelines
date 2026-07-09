import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/synth/synth-comparative.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("synth-comparative-extra", () => {
	it("infers matrix format from 'table' keyword in request", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "produce a comparison table of these three frameworks",
			},
			{
				summaryIncludes: ["format: matrix"],
				recommendationCountAtLeast: 3,
			},
		);
		const artifactKinds =
			result.artifacts?.map((artifact) => artifact.kind) ?? [];
		expect(artifactKinds).toContain("comparison-matrix");
	});

	it("infers ranking format from 'rank' keyword in request", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "rank these three database options by performance and cost",
			},
			{
				summaryIncludes: ["format: ranking"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("explicit outputFormat ranking overrides inference", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare these tools",
				options: {
					outputFormat: "ranking",
				},
			},
			{
				summaryIncludes: ["format: ranking"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("explicit outputFormat narrative skips comparison-matrix artifact", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "compare tool A and tool B options side by side",
				options: {
					outputFormat: "narrative",
				},
			},
			{
				summaryIncludes: ["format: narrative"],
				recommendationCountAtLeast: 3,
			},
		);
		const artifactKinds =
			result.artifacts?.map((artifact) => artifact.kind) ?? [];
		expect(artifactKinds).not.toContain("comparison-matrix");
		expect(artifactKinds).toContain("output-template");
	});

	it("uses explicit evaluationAxes when provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare framework A vs framework B",
				options: {
					outputFormat: "matrix",
					evaluationAxes: ["performance", "maintainability", "scalability"],
				},
			},
			{
				summaryIncludes: ["axes: 3"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers default axes for tool/framework comparisons", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare these two platforms for our project",
				options: {
					outputFormat: "matrix",
				},
			},
			{
				summaryIncludes: ["format: matrix"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers default axes for model/LLM comparisons", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare these two LLM models for our inference task",
				options: {
					outputFormat: "matrix",
				},
			},
			{
				summaryIncludes: ["format: matrix"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers default axes for approach/method comparisons", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare these two architectural patterns for scalability",
				options: {
					outputFormat: "matrix",
				},
			},
			{
				summaryIncludes: ["format: matrix"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("handles request with 'scorecard' in text inferring narrative (no match)", async () => {
		// 'scorecard' doesn't match the known regexes so falls back to narrative
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "produce a scorecard for comparing these vendor options",
			},
			{
				summaryIncludes: ["format: narrative"],
				recommendationCountAtLeast: 3,
			},
		);
		const artifactKinds =
			result.artifacts?.map((artifact) => artifact.kind) ?? [];
		expect(artifactKinds).not.toContain("comparison-matrix");
	});

	it("adds recommendation-handoff detail for recommend keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare and recommend the best option for our use case",
				options: {
					outputFormat: "narrative",
				},
			},
			{
				detailIncludes: [
					"hand the matrix or narrative to recommendation framing",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("adds research-handoff detail for gather keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "gather sources and compare these two approaches",
				options: {
					outputFormat: "narrative",
				},
			},
			{
				detailIncludes: ["build the evidence packet first"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("treats a non-empty but keyword-free request without context as insufficient signal", async () => {
		// "it is" passes schema validation (non-empty string) but every word is
		// <= 2 chars, so keywords.length === 0; with no context provided the
		// `keywords.length === 0 && !hasContext` guard should be true.
		const result = await skillModule.run(
			{ request: "it is" },
			createMockSkillRuntime(),
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("does not treat a keyword-free request as insufficient when context is provided", async () => {
		// Request has no keywords longer than 2 chars outside stop words, but
		// context is present, so the `keywords.length === 0 && !hasContext`
		// guard should evaluate false and proceed to normal guidance.
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "it is",
				context: "we need to compare two vendor options for the renewal",
			},
			{
				summaryIncludes: ["Comparative Analysis produced"],
				recommendationCountAtLeast: 3,
			},
		);
		expect(result.summary).not.toContain("Provide more detail");
	});

	it("applies stated constraints as comparison pre-filters", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare these two vendors",
				constraints: ["must support SSO", "budget under $10k/yr"],
			},
			{
				detailIncludes: [
					"Apply the stated constraints as comparison pre-filters",
					"must support SSO",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("structures the comparison around a stated deliverable", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare these two vendors",
				deliverable: "a one-page trade study for architecture review",
			},
			{
				detailIncludes: [
					"Structure the comparison to directly feed the stated deliverable",
					"a one-page trade study for architecture review",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("uses provided context to weight decision-critical axes", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare these two vendors",
				context: "this decision is for a production retrieval system",
			},
			{
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("notes '+N more' when more than four evaluation axes are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare framework A vs framework B",
				options: {
					outputFormat: "matrix",
					evaluationAxes: [
						"performance",
						"maintainability",
						"scalability",
						"cost",
						"security",
						"community",
					],
				},
			},
			{
				summaryIncludes: ["axes: 6"],
				detailIncludes: [", +2 more"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	// NOTE: `details.length === 1 ? "" : "s"` on the final summary line
	// (synth-comparative.ts:390) is unreachable — `details` always starts
	// with 5 unconditional guardrail entries (lines 253-259) before any
	// conditional pushes, so `details.length` can never be 1. Left
	// uncovered intentionally.
});
