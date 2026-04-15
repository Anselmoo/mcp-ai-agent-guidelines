import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/strat/strat-advisor.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("strat-advisor", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("infers governance focus and emits strategy artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"frame our governance strategy for AI compliance, policy reviews, and audit controls",
			},
			{
				summaryIncludes: ["AI governance"],
				detailIncludes: [
					"artifacts or benchmarks that already exist",
					"concrete next actions",
				],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.summary).not.toContain("AI operating model");
		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
	});

	it("honors explicit focus overrides and surfaces handoffs when research is unresolved", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"help me build a technical strategy with research evidence and benchmark gaps",
				options: {
					focusArea: "platform",
					horizonMonths: 18,
				},
			},
			{
				summaryIncludes: ["AI platform design", "18 months"],
				detailIncludes: [
					"gather and synthesise that material before finalising the strategy",
				],
				recommendationCountAtLeast: 3,
			},
		);

		const detailText = result.recommendations
			.map((item) => item.detail)
			.join("\n");
		expect(detailText).toContain("Strategy should consume evidence");
	});

	it("adds a stronger baseline requirement when current-state context is missing", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "AI-first strategy for the product team",
			},
			{
				detailIncludes: ["benchmark or artifact set that proves the baseline"],
				recommendationCountAtLeast: 3,
			},
		);

		expect(
			result.recommendations.map((item) => item.detail).join("\n"),
		).toContain("current AI maturity level");
	});
});
