import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/synth/synth-research.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("synth-research", () => {
	it("limits deep research synthesis to a bounded source set", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "synthesize research evidence into concise direction",
				options: {
					researchDepth: "deep",
					maxSources: 5,
				},
			},
			{
				summaryIncludes: [
					"Research Assistant planned",
					"depth: deep",
					"max sources: 5",
				],
				detailIncludes: [
					"Cap the source set at 5 high-quality sources",
					"Hand off the organised, gap-annotated source set to synth-engine",
				],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("treats structured evidence as the initial research substrate", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "research the MCP evidence flow",
				options: {
					researchDepth: "standard",
					maxSources: 6,
					evidence: [
						{
							sourceType: "context7-docs",
							toolName: "mcp_context7_get-library-docs",
							locator: "/modelcontextprotocol/typescript-sdk",
							authority: "official",
							sourceTier: 1,
						},
					],
				},
			},
			{
				detailIncludes: [
					"Structured evidence is already attached",
					"/modelcontextprotocol/typescript-sdk",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("routes comparison-heavy requests to synth-comparative after gathering", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "research vector store options and compare them for us",
			},
			{
				detailIncludes: [
					"reserve the scoring, ranking, and weighting work for synth-comparative",
				],
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
