import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-wavefunction-coverage.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-wavefunction-coverage", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits coverage artifacts for a bug-pattern ranking", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "prioritise missing tests for high-risk bug patterns",
				options: {
					tests: [
						{ name: "boundary test", vector: [1, 0, 0] },
						{ name: "retry test", vector: [0, 1, 0] },
					],
					bugs: [
						{ name: "null pointer", risk: 0.9, vector: [0.9, 0.1, 0] },
						{ name: "timing race", risk: 0.7, vector: [0.2, 0.8, 0] },
					],
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Wavefunction coverage worked example",
				"Wavefunction coverage matrix",
				"Coverage prioritisation rubric",
			]),
		);
	});
});
