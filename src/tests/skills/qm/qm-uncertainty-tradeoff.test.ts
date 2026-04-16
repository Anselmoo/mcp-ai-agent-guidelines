import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-uncertainty-tradeoff.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-uncertainty-tradeoff", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits Pareto-violation artifacts for a tension example", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "analyse coupling and cohesion tradeoffs for a module",
				options: {
					metricPair: "coupling-cohesion",
					violationThreshold: "moderate",
					coupling: 0.72,
					cohesionDeficit: 0.68,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Uncertainty tradeoff worked example",
				"Metric pair comparison matrix",
				"Pareto violation rubric",
			]),
		);
	});
});
