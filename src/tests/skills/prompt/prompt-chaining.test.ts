import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/prompt/prompt-chaining.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("prompt-chaining", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns a staged chain contract with validation guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Chain an extraction step into a summarization step, validate the output schema, and keep citations from the source documents",
				context:
					"We pass policy PDFs into the workflow before generating a decision brief.",
				deliverable: "validated executive summary packet",
				options: {
					stageCount: 4,
					handoffStyle: "schema-first",
					includeValidation: true,
				},
			},
			{
				summaryIncludes: ["Prompt Chaining produced"],
				detailIncludes: ["handoff", "validation", "source"],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Stage contract template",
		});
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});
});
