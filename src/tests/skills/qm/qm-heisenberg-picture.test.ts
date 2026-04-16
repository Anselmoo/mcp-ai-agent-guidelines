import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-heisenberg-picture.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-heisenberg-picture", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits drift artifacts for metric snapshots", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"How are our metrics changing over time and which ones conflict?",
				options: {
					snapshots: [
						{ complexity: 0.3, coverage: 0.8, coupling: 0.2 },
						{ complexity: 0.5, coverage: 0.7, coupling: 0.4 },
						{ complexity: 0.7, coverage: 0.6, coupling: 0.6 },
					],
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"comparison-matrix",
			"tool-chain",
		]);
	});
});
