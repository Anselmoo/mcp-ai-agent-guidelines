import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-data-guardrails.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("gov-data-guardrails", () => {
	it("applies regulatory data-guardrail guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "mask pii and secrets in logs and outputs",
				context: "gdpr workflow output may leak email and api key",
				constraints: ["retain audit trail"],
				options: {
					dataCategory: "credentials",
					regulatoryFramework: "GDPR",
					minimisationStrategy: "redaction",
				},
			},
			{
				summaryIncludes: [
					"Data Guardrails produced",
					"data-protection guideline",
				],
				detailIncludes: [
					"Credentials guardrail",
					"GDPR context",
					"Redaction strategy",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "comparison-matrix",
			title: "Sensitive data control matrix",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request has keywords but no data-guardrails signal", async () => {
		const result = await skillModule.run(
			{ request: "please review this workflow" },
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"Data Guardrails targets PII protection, secret masking, and data minimisation",
		);
	});

	it("treats an explicit 'none' regulatory framework as no regulatory note", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "mask pii and secrets in logs and outputs",
				options: {
					regulatoryFramework: "none",
				},
			},
			{
				summaryIncludes: ["Data Guardrails produced"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("GDPR context");
		expect(detailText).not.toContain("HIPAA context");
	});

	it("ignores options when they fail schema validation", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "mask pii and secrets in logs and outputs",
				options: {
					// Invalid enum value forces parseSkillInput() to fail, so the
					// handler must fall back to treating options as undefined.
					dataCategory: "not-a-real-category",
				},
			},
			{
				summaryIncludes: ["Data Guardrails produced"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("guardrail: Enumerate all PII fields");
		expect(detailText).not.toContain("GDPR context");
	});

	it("falls back to generic guardrail guidance when no rule pattern matches and no options are given", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "we need pii guidance for our ai pipeline design",
			},
			{
				summaryIncludes: ["Data Guardrails produced"],
				detailIncludes: ["Treat data guardrails as a schema-level concern"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain(
			"Apply data guardrails under the following constraints",
		);
	});
});
