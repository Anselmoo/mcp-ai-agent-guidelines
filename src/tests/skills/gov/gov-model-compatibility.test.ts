import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-model-compatibility.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("gov-model-compatibility", () => {
	it("surfaces migration-compatibility guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"migrate model and compare context window regression with schema changes",
				context: "structured output compatibility and rollout planning",
				options: {
					compatibilityDimension: "output-format",
					migrationRisk: "medium",
					rolloutStrategy: "shadow",
				},
			},
			{
				summaryIncludes: [
					"Model Compatibility produced",
					"compatibility assessment guideline",
				],
				detailIncludes: [
					"Output-format compatibility",
					"Migration regression testing",
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
			title: "Compatibility assessment matrix",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request is short and lacks a compatibility signal", async () => {
		const result = await skillModule.run(
			{ request: "help me pick a model" },
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"Model Compatibility targets assessment of fit between an AI model",
		);
	});

	it("falls back to generic guidance when a compatibility signal matches no specific rule", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "we are migrating to a new AI model for our support workflow",
			},
			{
				summaryIncludes: ["Model Compatibility produced"],
				detailIncludes: [
					"To assess model compatibility",
					"Compatibility assessment is a risk-management exercise",
				],
			},
		);

		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it("uses singular phrasing in the summary when exactly one guideline is produced", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"we are migrating and need a rollback plan for the model change",
			},
			{
				summaryIncludes: [
					"Model Compatibility produced 1 compatibility assessment guideline for AI model migration planning",
				],
				detailIncludes: ["Rollback plan"],
			},
		);

		expect(result.summary).not.toContain("guidelines");
	});

	it("ignores options when they fail schema validation", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"we are migrating and need a rollback plan for the model change",
				options: {
					compatibilityDimension: "not-a-real-dimension",
				},
			},
			{
				summaryIncludes: ["Model Compatibility produced"],
				detailIncludes: ["Rollback plan"],
			},
		);

		// Invalid enum value fails schema parsing, so no dimension-specific
		// guidance is prepended — only the matched rule guidance appears.
		expect(result.recommendations[0].detail).not.toContain(
			"Context-window compatibility:",
		);
	});

	it("appends constraint-derived guidance when constraints are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"migrate model and compare context window regression with schema changes",
				context: "structured output compatibility and rollout planning",
				constraints: [
					"Complete rollout within one sprint",
					"No downtime during business hours",
				],
			},
			{
				summaryIncludes: ["Model Compatibility produced"],
				detailIncludes: [
					"Apply model compatibility assessment under the following constraints",
					"Complete rollout within one sprint",
				],
			},
		);
	});
});
