import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/req/req-ambiguity-detection.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("req-ambiguity-detection", () => {
	it("flags subjective requirement language", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"find ambiguous requirements around latency being fast secure and scalable",
				options: {
					includeClarifyingQuestions: true,
				},
			},
			{
				summaryIncludes: [
					"Ambiguity Detection found",
					"potential ambiguity pattern",
				],
				detailIncludes: ["Subjective terms found: fast", "Clarifying question"],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"eval-criteria",
			"worked-example",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Ambiguity register template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("flags vague expansion language and asks a clarifying question", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "The report lists several items",
				options: {
					includeClarifyingQuestions: true,
				},
			},
			{
				summaryIncludes: ["Ambiguity Detection found"],
				detailIncludes: [
					"Vague expansion language found: several",
					"Clarifying question: what is the full enumerated list",
				],
			},
		);
	});

	it("flags absolute language and asks a clarifying question", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "The system must never crash",
				options: {
					includeClarifyingQuestions: true,
				},
			},
			{
				summaryIncludes: ["Ambiguity Detection found"],
				detailIncludes: [
					"Absolute language found: never",
					"Clarifying question: which users, environments, or failure modes",
				],
			},
		);
	});

	it("flags missing-actor language and asks a clarifying question", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "The payload needs to be checked",
				options: {
					includeClarifyingQuestions: true,
				},
			},
			{
				summaryIncludes: ["Ambiguity Detection found"],
				detailIncludes: [
					"Passive/actor-free language found",
					"Clarifying question: which system component or user owns",
				],
			},
		);
	});

	it("suppresses clarifying questions for every pattern when disabled", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"It should always be fast, with several export options, and it needs to be validated",
				options: {
					includeClarifyingQuestions: false,
				},
			},
			{
				summaryIncludes: ["Ambiguity Detection found"],
				detailIncludes: [
					"Subjective terms found",
					"Vague expansion language found",
					"Absolute language found",
					"Passive/actor-free language found",
				],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Clarifying question");

		const workedExample = result.artifacts?.find(
			(artifact) => artifact.kind === "worked-example",
		);
		expect(JSON.stringify(workedExample)).not.toContain("clarifyingQuestion");
	});

	it("defaults to including clarifying questions when options are omitted", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "The system must never crash",
			},
			{
				summaryIncludes: ["Ambiguity Detection found"],
				detailIncludes: [
					"Absolute language found: never",
					"Clarifying question",
				],
			},
		);
	});

	it("does not flag missing success criteria when one is provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "The system must never crash",
				successCriteria: "No crashes occur during a 24-hour soak test.",
			},
			{
				summaryIncludes: ["Ambiguity Detection found"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("No success criteria defined");
	});

	it("reports no obvious ambiguity when the request is clear and complete", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "The gateway forwards the payload to the queue",
				successCriteria: "The queue receives the payload within 1 second.",
			},
			{
				summaryIncludes: ["Ambiguity Detection found"],
				detailIncludes: [
					"No obvious linguistic ambiguity detected",
					"Check whether the request omits error-case behaviour",
				],
			},
		);

		expect(result.recommendations.length).toBeGreaterThanOrEqual(2);
	});
});
