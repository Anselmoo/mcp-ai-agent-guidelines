import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-clone-mutate.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("resil-clone-mutate", () => {
	it("derives mutation guidance from degradation parameters", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"recover after repeated failures by mutating prompt templates and tracking quality threshold",
				options: {
					qualityThreshold: 0.65,
					consecutiveFailures: 6,
					nClones: 4,
					promoteThreshold: 0.03,
					mutationTypes: ["template", "concrete"],
				},
			},
			{
				summaryIncludes: ["Clone-Mutate produced", "recovery-cycle guideline"],
				detailIncludes: [
					"n_clones=4 is below the recommended 7",
					"promote_threshold=0.03 is very low",
					"Enabled mutation strategies: template, concrete",
					"held-out tournament set",
					"Keep an audit trail for every cycle",
				],
				recommendationCountAtLeast: 6,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("rejects invalid clone-mutate options", async () => {
		const result = await skillModule.run(
			{
				request: "self-heal a degraded prompt",
				options: { qualityThreshold: 2 },
			} as never,
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});
