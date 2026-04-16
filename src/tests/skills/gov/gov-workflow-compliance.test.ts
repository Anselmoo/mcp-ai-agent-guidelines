import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-workflow-compliance.js";
import {
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
});
