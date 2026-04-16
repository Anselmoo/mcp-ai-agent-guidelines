import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/synth/synth-comparative.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("synth-comparative", () => {
	it("shapes a matrix comparison across explicit axes", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "compare two implementation options and recommend one",
				options: {
					outputFormat: "matrix",
					evaluationAxes: ["capability", "cost", "risk"],
				},
			},
			{
				summaryIncludes: ["Comparative Analysis produced", "format: matrix"],
				detailIncludes: [
					"Produce the comparison as a matrix",
					"Assign explicit axis weights",
					"Label evidence quality",
					"comparison confidence level",
				],
				recommendationCountAtLeast: 5,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("keeps non-matrix formats artifact-rich without emitting a matrix", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "compare these approaches and recommend the best one",
				options: {
					outputFormat: "narrative",
				},
			},
			{
				summaryIncludes: ["format: narrative"],
				detailIncludes: [
					"hand the matrix or narrative to recommendation framing",
				],
				recommendationCountAtLeast: 4,
			},
		);

		const artifactKinds =
			result.artifacts?.map((artifact) => artifact.kind) ?? [];
		expect(artifactKinds).not.toContain("comparison-matrix");
		expect(artifactKinds).toContain("output-template");
		expect(artifactKinds).toContain("eval-criteria");
	});
});
