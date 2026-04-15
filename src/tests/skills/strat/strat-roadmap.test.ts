import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/strat/strat-roadmap.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("strat-roadmap", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("includes maturity and capability targets by default", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "create an AI adoption roadmap with milestones for our team",
			},
			{
				summaryIncludes: ["3-phase", "12-month", "maturity model: included"],
				detailIncludes: [
					"capability target",
					"people, process, platform, and governance",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
	});

	it("supports explicit roadmap options and strategy-first handoffs", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"build a roadmap from our strategy vision and rank what to do first",
				options: {
					horizonMonths: 18,
					phaseCount: 4,
					includeMaturityModel: false,
				},
			},
			{
				summaryIncludes: ["4-phase", "18-month", "maturity model: omitted"],
				detailIncludes: [
					"frame strategy before locking dates and phases",
					"prioritise before assigning them to phases",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(
			result.recommendations.map((item) => item.detail).join("\n"),
		).toContain("approve the phase-1 owner");
	});
});
