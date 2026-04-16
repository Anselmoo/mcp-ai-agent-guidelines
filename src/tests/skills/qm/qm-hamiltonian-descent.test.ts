import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-hamiltonian-descent.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-hamiltonian-descent", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits ranking artifacts for module repair planning", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "rank modules by quality energy for refactoring",
				options: {
					rankingMode: "repair-vector",
					modules: [
						{
							name: "auth-service",
							complexity: 0.8,
							coupling: 0.7,
							coverage: 0.4,
							churn: 0.6,
						},
						{
							name: "reporting-job",
							complexity: 0.5,
							coupling: 0.4,
							coverage: 0.7,
							churn: 0.3,
						},
					],
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Hamiltonian ranking worked example",
				"Hamiltonian fix-order rubric",
				"Hamiltonian repair-plan template",
			]),
		);
	});
});
