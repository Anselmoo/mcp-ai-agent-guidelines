import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/bench/bench-blind-comparison.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("bench-blind-comparison", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("produces a blind-comparison protocol artifact set", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "set up blind comparison for prompt variants and judge ties",
				options: {
					blindLevel: "double-blind",
					comparisonMode: "pairwise",
					tiePolicy: "human-review",
				},
			},
			{
				summaryIncludes: ["Blind Comparison produced", "double-blind"],
				detailIncludes: ["provenance leakage", "tie resolution"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "eval-criteria",
					title: "Blind comparison checklist",
				}),
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Blind comparison protocol matrix",
				}),
				expect.objectContaining({
					kind: "tool-chain",
					title: "Blind comparison protocol",
				}),
				expect.objectContaining({
					kind: "output-template",
					title: "Blind comparison packet",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Blind comparison example",
				}),
			]),
		);
	});
});
