import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-regulated-workflow-design.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("gov-regulated-workflow-design", () => {
	it("adds regulated audit-trail guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"design healthcare ai workflow with audit trail human oversight and sign off",
				options: {
					regulatedIndustry: "healthcare",
					approvalGateType: "human-in-loop",
					auditLevel: "forensic",
				},
			},
			{
				summaryIncludes: [
					"Regulated Workflow Design produced",
					"design guideline",
				],
				detailIncludes: [
					"Healthcare AI workflow design",
					"Human-in-the-loop gate design",
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
			title: "Approval gate design matrix",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request is short and lacks regulated-workflow signal", async () => {
		const result = await skillModule.run(
			{ request: "help me plan something quick" },
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"Regulated Workflow Design targets AI workflows",
		);
	});

	it("falls back to generic guidance when no rule pattern or option matches", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"regulated industry ai decision workflow design for the pharmaceutical sector requiring careful planning across several teams",
			},
			{
				summaryIncludes: ["Regulated Workflow Design produced"],
				detailIncludes: [
					"To design a regulated AI workflow",
					"Regulated workflow design is an iterative process",
				],
			},
		);

		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it("ignores unparseable options and still produces guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"design healthcare ai workflow with audit trail human oversight and sign off",
				options: {
					regulatedIndustry: "not-a-real-industry",
				},
			},
			{
				summaryIncludes: ["Regulated Workflow Design produced"],
				detailIncludes: ["Audit trail architecture for regulated AI"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Healthcare AI workflow design");
	});

	it("uses singular 'guideline' wording when exactly one guideline is produced", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "we need an audit trail for this workflow",
			},
			{
				summaryIncludes: [
					"Regulated Workflow Design produced 1 design guideline for AI workflows",
				],
				detailIncludes: ["Audit trail architecture for regulated AI"],
			},
		);

		expect(result.summary).not.toContain("1 design guidelines");
	});

	it("appends a constraint-derived guideline when constraints are provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"design healthcare ai workflow with audit trail human oversight and sign off",
				constraints: [
					"Must comply with HIPAA",
					"Human review required within 24 hours",
					"Retain audit logs for 7 years",
					"Extra constraint beyond the first three",
				],
			},
			{
				summaryIncludes: ["Regulated Workflow Design produced"],
				detailIncludes: [
					"Apply regulated workflow design under the following constraints",
					"Must comply with HIPAA",
					"Human review required within 24 hours",
					"Retain audit logs for 7 years",
				],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Extra constraint beyond the first three");
	});
});
