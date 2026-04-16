import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/synth/synth-recommendation.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("synth-recommendation", () => {
	it("frames recommendations with explicit confidence and tradeoffs", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"synthesize findings into prioritized recommendation with next action",
				options: {
					confidenceMode: "explicit",
					confidenceLevel: "high",
					includeTradeoffs: true,
				},
			},
			{
				summaryIncludes: [
					"Recommendation Framing produced",
					"confidence: explicit",
					"tradeoffs: included",
				],
				detailIncludes: [
					"evidence → reasoning → recommendation → confidence → conditions",
					"Include a tradeoff summary",
					"caller-supplied confidence level directly",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("omits tradeoff fields when configured and still emits a recommendation contract", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"frame an evidence-based recommendation from this comparison and name the first action",
				context:
					"the comparison favored the managed option on reliability and onboarding speed",
				options: {
					includeTradeoffs: false,
				},
			},
			{
				summaryIncludes: ["tradeoffs: omitted"],
				detailIncludes: ["recommendation contract"],
				recommendationCountAtLeast: 3,
			},
		);

		const template = result.artifacts?.find(
			(artifact) => artifact.kind === "output-template",
		) as { template: string } | undefined;
		expect(template?.template).not.toContain('"tradeoffs"');
	});

	it("requires an explicit confidence level when confidence mode is explicit", async () => {
		const result = await skillModule.run(
			{
				request: "frame an evidence-based recommendation from the comparison",
				options: {
					confidenceMode: "explicit",
				},
			},
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain("explicit confidence");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});
