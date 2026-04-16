import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/flow/flow-orchestrator.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("flow-orchestrator", () => {
	it("derives staged orchestration with checkpoints", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"research plan implement test and release a multi-agent feature",
				deliverable: "shippable workflow",
				successCriteria: "validated release",
				options: {
					maxStages: 4,
					allowParallel: true,
					includeCheckpoints: true,
				},
			},
			{
				summaryIncludes: [
					"Workflow Orchestrator defined",
					"across 4 planned stages",
				],
				detailIncludes: [
					"intake → research → plan → execute",
					"Parallelize only independent workstreams",
					"Add checkpoints after every major stage",
				],
				recommendationCountAtLeast: 5,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"eval-criteria",
			"tool-chain",
			"worked-example",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Path contract template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
