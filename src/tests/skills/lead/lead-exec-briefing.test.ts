import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-exec-briefing.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-exec-briefing", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits an executive briefing template, worked example, and rubric", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"brief the c-suite on the AI platform investment, business outcomes, and key risks",
				context:
					"the platform team is proposing a 3-phase roadmap over 18 months",
				options: {
					audience: "c-suite" as const,
					briefingLength: "decision-memo" as const,
					includeRisks: true,
				},
			},
			{
				detailIncludes: [
					"Structure the decision-memo for a c-suite audience",
					"Include a short risk slide or section",
					"End with a single explicit ask",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			title: "Executive Briefing (c-suite, decision-memo)",
		});
		expect(result.artifacts?.[2]).toMatchObject({
			title: "Executive briefing quality rubric",
		});
	});
});
