import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-l9-engineer.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-l9-engineer", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a worked example and rubric for senior decisions", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"review consistency versus availability tradeoff for a distributed model registry",
				context: "the platform team owns promotion, replication, and rollback",
				options: {
					reviewMode: "architecture",
					decisionHorizon: "annual",
				},
			},
			{
				detailIncludes: [
					"Identify the architectural invariants first",
					"Name the dominant tradeoff explicitly",
					"State the strongest rejected alternative",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			title: "L9 decision quality rubric",
		});
	});
});
