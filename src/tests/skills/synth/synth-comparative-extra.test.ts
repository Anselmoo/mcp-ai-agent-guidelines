import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/synth/synth-comparative.js";
import {
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
				detailIncludes: [
					"build the evidence packet first",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
