import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-transformation-roadmap.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-transformation-roadmap", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a transformation roadmap template, phase matrix, worked example, and checklist", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"design a 3-phase enterprise AI transformation roadmap with platform, people, and governance tracks",
				context:
					"the organisation has existing ML infrastructure but lacks a governed AI platform",
				options: {
					phaseCount: 3,
					horizonMonths: 18,
					includeGovernanceTrack: true,
				},
			},
			{
				detailIncludes: [
					"Build a 3-phase enterprise transformation roadmap",
					"Keep governance checkpoints visible in every phase",
					"Map cross-track dependencies explicitly",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"comparison-matrix",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			title: "Transformation Roadmap (3 phases, 18mo)",
		});
		expect(result.artifacts?.[3]).toMatchObject({
			title: "Roadmap validation checklist",
		});
	});
});
