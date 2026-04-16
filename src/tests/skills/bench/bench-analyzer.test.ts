import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/bench/bench-analyzer.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("bench-analyzer", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("produces benchmark reference artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"analyze regression against the trusted baseline with outlier slices",
				options: { analysisLens: "regression", includeOutliers: true },
			},
			{
				summaryIncludes: ["Benchmark Analyzer produced", "lens: regression"],
				detailIncludes: ["baseline comparison", "outliers"],
			},
		);

		expect(result.artifacts).toHaveLength(4);
		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Benchmark decision matrix",
				}),
				expect.objectContaining({
					kind: "output-template",
					title: "Benchmark analysis report template",
				}),
				expect.objectContaining({
					kind: "eval-criteria",
					title: "Benchmark interpretation checklist",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Benchmark analysis example",
				}),
			]),
		);
	});
});
