import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-path-integral-historian.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-path-integral-historian", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits trajectory artifacts for commit-history inflections", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Find the inflection commit in this history",
				options: {
					actions: [0.12, 0.15, 0.81, 0.18],
					temperature: 0.4,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"output-template",
			"eval-criteria",
			"tool-chain",
		]);
	});
});
