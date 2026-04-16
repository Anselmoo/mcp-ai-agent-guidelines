import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-regulated-workflow-design.js";
import {
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
});
