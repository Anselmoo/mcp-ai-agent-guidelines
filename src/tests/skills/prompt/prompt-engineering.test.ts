import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/prompt/prompt-engineering.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("prompt-engineering", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns a prompt template, comparison matrix, and versioning guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Build a reusable system prompt with JSON output fields, few-shot examples, and strict safety guardrails",
				deliverable: "versioned support-assistant system prompt",
				successCriteria:
					"outputs valid JSON and refuses unsupported account actions",
				options: {
					promptType: "system",
					includeVersioning: true,
					includeVariables: true,
				},
			},
			{
				summaryIncludes: ["Prompt Engineering produced"],
				detailIncludes: [
					"output contract",
					"version header",
					"typed variables",
				],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"worked-example",
			"tool-chain",
			"eval-criteria",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "system prompt template",
		});
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});
});
