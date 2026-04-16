import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/prompt/prompt-refinement.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("prompt-refinement", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("produces before/after refinement guidance with an experiment plan", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Improve my prompt because it hallucinates citations, drifts from JSON format, and shows flaky output variance",
				context:
					"Eval runs show unsupported citations on 3 of 10 examples and malformed JSON on long documents.",
				successCriteria:
					"supported citations and valid JSON across the regression set",
				options: {
					evidenceMode: "eval-results",
					maxExperiments: 2,
					preserveStructure: true,
				},
			},
			{
				summaryIncludes: ["Prompt Refinement produced"],
				detailIncludes: ["one causal variable", "grounding", "contract"],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[3]).toMatchObject({
			kind: "worked-example",
			title: "Before/after refinement example",
		});
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});
});
