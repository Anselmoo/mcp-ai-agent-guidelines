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
			"comparison-matrix",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "system prompt template",
		});
	});

	it("names a selected technique for a tool-use request", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"prompt for an agent that calls a tool then observes the result",
			},
			{ detailIncludes: ["Selected technique"] },
		);
		expect(
			result.artifacts?.some(
				(a) =>
					a.kind === "comparison-matrix" && a.title === "Technique selection",
			),
		).toBe(true);
	});

	it("emits a worked-example artifact for a first-class (react) technique selection", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Build a prompt for an agent that calls an API tool then observes the result before acting again",
			},
			{ detailIncludes: ["Selected technique"] },
		);

		const workedExamples = result.artifacts?.filter(
			(a) => a.kind === "worked-example",
		);
		// At minimum the built-in prompt template example + the technique card
		expect(workedExamples?.length).toBeGreaterThanOrEqual(2);

		const techniqueCard = result.artifacts?.find(
			(a) => a.kind === "worked-example" && a.title === "react worked example",
		);
		expect(techniqueCard).toBeDefined();
		expect(techniqueCard).toMatchObject({
			kind: "worked-example",
			title: "react worked example",
		});
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});
});
