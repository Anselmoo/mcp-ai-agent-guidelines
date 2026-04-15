import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-digital-architect.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-digital-architect", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a concrete architecture matrix and brief template", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "design the enterprise ai platform layers and ownership model",
				context: "legacy systems still need a transition plan",
				options: {
					architectureLens: "platform",
					includeTransitionStates: true,
				},
			},
			{
				detailIncludes: [
					"Separate the enterprise AI platform into layers",
					"Add an operating-model overlay",
					"Describe at least one transition state",
				],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			title: "Enterprise AI architecture decision matrix",
		});
	});
});
