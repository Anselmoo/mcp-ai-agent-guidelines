import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-data-guardrails.js";
import {
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
});
