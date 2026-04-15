import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-geodesic-refactor.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-geodesic-refactor", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a staged refactor plan with validation criteria", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "plan the shortest safe path through a large refactor",
				context: "break the work into shippable waypoints",
				options: {
					currentCoupling: 48,
					targetCoupling: 16,
					waypointCount: 4,
				},
			},
			{
				detailIncludes: [
					"Geodesic refactoring finds the shortest path",
					"Break the refactor into waypoints (intermediate stable states)",
				],
				recommendationCountAtLeast: 2,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"output-template",
			"eval-criteria",
			"tool-chain",
		]);
	});
});
