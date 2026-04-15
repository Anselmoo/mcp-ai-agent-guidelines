import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-staff-mentor.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-staff-mentor", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a mentoring plan, worked example, and practice checklist", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"mentor a senior engineer on growing their influence and technical strategy at staff level",
				context:
					"the engineer produces good implementation work but struggles to lead cross-team design decisions",
				options: {
					growthFocus: "influence" as const,
					includePracticePlan: true,
				},
			},
			{
				detailIncludes: [
					"Frame the mentoring advice around influence",
					"Translate the advice into a short practice loop",
					"Use the provided context to calibrate scope honestly",
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
			title: "Mentoring Plan (influence)",
		});
		expect(result.artifacts?.[2]).toMatchObject({
			title: "Staff mentoring practice checklist",
		});
	});
});
