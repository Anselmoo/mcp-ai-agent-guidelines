import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-policy-validation.js";
import {
	createMockSkillRuntime,
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

	it("asks for more detail when the request has context but no policy signal and simple complexity", async () => {
		const result = await skillModule.run(
			{
				request: "help me plan something quickly",
				context: "general planning notes",
			},
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain("Policy Validation targets validation");
	});

	it("falls back to generic guidance when no rule pattern matches", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"draft a quarterly roadmap outline for the team meeting next week please",
			},
			{
				summaryIncludes: ["Policy Validation produced"],
				detailIncludes: [
					"To implement policy validation for an AI workflow",
					"Policy validation is most effective when integrated into the deployment pipeline",
				],
			},
		);

		expect(result.summary).toContain("2 validation guidelines");
	});

	it("uses singular guideline wording when exactly one rule matches", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "validate our rego policy setup for the workflow",
			},
			{
				summaryIncludes: ["1 validation guideline"],
				detailIncludes: ["Policy-as-code implementation"],
			},
		);

		expect(result.summary).not.toContain("1 validation guidelines");
	});

	it("applies compliance framework guidance and handles a schema parse failure", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "validate our rego policy setup for the workflow",
				options: {
					complianceFramework: "ISO-42001",
				},
			},
			{
				detailIncludes: [
					"ISO/IEC 42001 context",
					"Policy-as-code implementation",
				],
			},
		);
		expect(result).toBeDefined();

		// request fails baseSkillInputSchema's `min(1)` because it is empty, but
		// context is non-empty so the request still clears the first insufficient
		// signal guard — this exercises the `parsed.ok === false` branch.
		const parseFailureResult = await skillModule.run(
			{
				request: "",
				context: "validate our rego policy setup for the workflow",
			},
			createMockSkillRuntime(),
		);
		expect(parseFailureResult.executionMode).toBe("capability");
		expect(
			parseFailureResult.recommendations.map((r) => r.detail).join("\n"),
		).toContain("Policy-as-code implementation");
	});

	it("appends constraint-specific guidance when constraints are provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "validate our rego policy setup for the workflow",
				constraints: [
					"Complete validation within 2 weeks",
					"Use only approved tooling",
				],
			},
			{
				detailIncludes: [
					"Apply policy validation under the following constraints",
					"Complete validation within 2 weeks",
				],
			},
		);
		expect(result).toBeDefined();
	});
});
