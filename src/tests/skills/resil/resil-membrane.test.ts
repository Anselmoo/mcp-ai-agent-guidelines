import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-membrane.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("resil-membrane", () => {
	it("applies masking at membrane boundaries", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"enforce membrane boundary for pii between workflow stages with masking",
				options: {
					defaultAction: "mask",
					regulatoryFramework: "HIPAA",
				},
			},
			{
				summaryIncludes: [
					"Membrane Orchestrator produced",
					"data-boundary guideline",
				],
				detailIncludes: [
					"Default action 'mask'",
					"HIPAA",
					"Define entry rules for every membrane boundary",
					"Define evolution rules for processing inside the membrane",
					"Define exit rules separately from entry rules",
					"fail closed on any unannotated field",
				],
				recommendationCountAtLeast: 5,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("rejects invalid membrane options", async () => {
		const result = await skillModule.run(
			{
				request: "enforce membrane boundaries for pii",
				options: { defaultAction: "scrub" },
			} as never,
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});
