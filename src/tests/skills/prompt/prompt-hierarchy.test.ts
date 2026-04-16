import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/prompt/prompt-hierarchy.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("prompt-hierarchy", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("calibrates autonomy with comparison, workflow, and rubric artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Set up bounded autonomy with approval gates for tool execution, escalation on ambiguity, and audit logging",
				context:
					"The agent can draft vendor responses but must never send them without human review.",
				options: {
					autonomyLevel: "bounded",
					includeApprovalGates: true,
					includeFallbacks: true,
				},
			},
			{
				summaryIncludes: ["Prompt Hierarchy produced"],
				detailIncludes: ["approval", "fallback", "audit"],
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
			title: "Hierarchy memo template",
		});
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});
});
