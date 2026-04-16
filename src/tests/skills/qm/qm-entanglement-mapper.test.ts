import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-entanglement-mapper.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-entanglement-mapper", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits co-change artifacts for a hidden-coupling example", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "review files that always change together in commit history",
				options: {
					topK: 3,
					fileAProbability: 0.6,
					fileBProbability: 0.5,
					coChangeProbability: 0.3,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Entanglement analysis worked example",
				"Entanglement interpretation matrix",
				"Entanglement analysis chain",
			]),
		);
	});
});
