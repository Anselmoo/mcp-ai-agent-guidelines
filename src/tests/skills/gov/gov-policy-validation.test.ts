import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-policy-validation.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("gov-policy-validation", () => {
	it("builds policy-as-code validation guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"validate policy as code with rego approval gate for ai workflow",
				context: "regulatory policy validation before deployment",
				options: {
					policyType: "regulatory",
					validationDepth: "behavioral",
					framework: "EU-AI-Act",
				},
			},
			{
				summaryIncludes: ["Policy Validation produced", "validation guideline"],
				detailIncludes: [
					"Policy-as-code implementation",
					"Regulatory policy validation",
				],
				recommendationCountAtLeast: 2,
			},
		);

		expect(result.artifacts?.map((a) => a.kind)).toEqual([
			"comparison-matrix",
			"worked-example",
			"output-template",
			"tool-chain",
			"eval-criteria",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "comparison-matrix",
			title: "Policy validation approach matrix",
		});
		expect(result.artifacts?.[3]).toMatchObject({
			kind: "tool-chain",
			title: "Policy-as-code validation workflow",
		});
		expect(result.artifacts?.[4]).toMatchObject({
			kind: "eval-criteria",
			title: "Policy validation acceptance criteria",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
