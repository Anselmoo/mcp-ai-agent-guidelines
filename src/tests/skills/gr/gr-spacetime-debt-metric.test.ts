import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-spacetime-debt-metric.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-spacetime-debt-metric", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits curvature-prioritization artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "rank the worst technical debt hotspots by curvature",
				context:
					"the module has high coupling, high complexity, and weak cohesion",
				options: {
					coupling: 24,
					complexity: 18,
					cohesion: 0.5,
				},
			},
			{
				detailIncludes: [
					"Extreme-curvature modules (K > 10)",
					"Prioritization protocol:",
				],
				recommendationCountAtLeast: 2,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"comparison-matrix",
			"eval-criteria",
		]);
	});
});
