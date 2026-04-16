import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-model-compatibility.js";
import {
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
});
