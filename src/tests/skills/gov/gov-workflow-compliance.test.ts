import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-workflow-compliance.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("gov-workflow-compliance", () => {
	it("plans continuous compliance monitoring", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"continuous compliance scan for ai pipeline with policy violations and remediation",
				options: {
					complianceScope: "full",
					workflowType: "agentic",
					nonComplianceAction: "escalate",
				},
			},
			{
				summaryIncludes: [
					"Workflow Compliance produced",
					"compliance assessment guideline",
				],
				detailIncludes: [
					"Full compliance assessment",
					"Continuous compliance monitoring",
				],
				recommendationCountAtLeast: 3,
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
			title: "Workflow compliance checkpoint matrix",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request is simple and has no workflow-compliance signal", async () => {
		const result = await skillModule.run(
			{ request: "help me with something" },
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("falls back to generic guidance when signals match no per-pattern rule", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"audit ai workflow compliance requirements across our agentic pipeline deployment",
			},
			{
				detailIncludes: [
					"identify all applicable policies across data-handling, model-usage, output-validation, and access-control dimensions",
					"shared responsibility between engineering, compliance, and legal teams",
				],
			},
		);
	});

	it("uses singular 'guideline' wording when exactly one rule matches", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"please assess whether our external vendor system remains compliant across this entire ai workflow deployment",
			},
			{
				summaryIncludes: [
					"Workflow Compliance produced 1 compliance assessment guideline for",
				],
			},
		);
	});

	it("skips scope/type/action notes and falls back when options fail schema validation", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"continuous compliance scan for ai pipeline with policy violations and remediation",
				options: {
					// Invalid enum value forces parseSkillInput to return ok: false,
					// so opts is undefined and none of the scope/type/action notes fire.
					complianceScope: "not-a-real-scope",
				},
			},
			{
				detailIncludes: ["Continuous compliance monitoring"],
			},
		);
	});

	it("appends a constraints-aware guideline when constraints are provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"continuous compliance scan for ai pipeline with policy violations and remediation",
				constraints: [
					"Must comply with GDPR",
					"Remediate within 30 days",
					"No downtime during remediation",
				],
			},
			{
				detailIncludes: [
					"Apply workflow compliance assessment under the following constraints",
					"Must comply with GDPR",
				],
			},
		);
	});
});
