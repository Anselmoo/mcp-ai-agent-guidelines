import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/synth/synth-engine.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("synth-engine", () => {
	it("expands synthesis depth and insight extraction", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"synthesize findings into a decision memo with extracted insights",
				deliverable: "decision memo",
				options: {
					summaryDepth: "comprehensive",
					extractInsights: true,
				},
			},
			{
				summaryIncludes: [
					"Synthesis Engine produced",
					"depth: comprehensive",
					"insights: enabled",
				],
				detailIncludes: [
					"full insight extraction, conflict analysis, gaps, and limitations",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("switches to theme-based synthesis when insight extraction is disabled", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "synthesise these findings into a board memo",
				options: {
					summaryDepth: "standard",
					extractInsights: false,
				},
			},
			{
				summaryIncludes: ["insights: disabled"],
				detailIncludes: [
					"theme-level summaries",
					"recommendation-ready handoff",
				],
				recommendationCountAtLeast: 3,
			},
		);

		const template = result.artifacts?.find(
			(artifact) => artifact.kind === "output-template",
		);
		expect(template).toMatchObject({
			kind: "output-template",
			title: "Synthesis Output Template",
		});
		expect((template as { template: string }).template).toContain('"themes"');
		expect((template as { template: string }).template).not.toContain(
			'"insights"',
		);
	});

	it("hands recommendation-heavy prompts to recommendation framing after synthesis", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"synthesise these findings and recommend what we should do next",
			},
			{
				detailIncludes: ["hand the final choice to recommendation framing"],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
	});
});
