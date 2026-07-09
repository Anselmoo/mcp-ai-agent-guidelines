import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/flow/flow-orchestrator.js";
import {
	createMockSkillRuntime,
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

	it("asks for more detail when the request has no keywords and no context", async () => {
		const result = await skillModule.run(
			{ request: "the a an" },
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"needs the desired workflow goal, stages, or coordination constraints",
		);
	});

	it("falls back to defaults and a single intake stage when no stage keywords, context, or options are supplied", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "the a an",
				context: "some ambient background",
			},
			{
				summaryIncludes: [
					"Workflow Orchestrator defined",
					"across 1 planned stage.",
				],
				detailIncludes: [
					'around "the requested pipeline"',
					"Default to serial execution until dependencies are explicit",
				],
			},
		);

		expect(result.summary).not.toContain("planned stages.");
	});

	it("derives constraints, release stage, and disables checkpoints when explicitly configured", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "ship and launch the release",
				constraints: ["freeze scope", "no new dependencies"],
				options: {
					includeCheckpoints: false,
				},
			},
			{
				detailIncludes: [
					"Insert constraints into the workflow as explicit gates",
					"freeze scope; no new dependencies",
				],
			},
		);

		expect(result.summary).not.toContain(
			"Add checkpoints after every major stage",
		);
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Add checkpoints after every major stage");

		const workedExample = result.artifacts?.find(
			(artifact) => artifact.kind === "worked-example",
		);
		expect(workedExample).toBeDefined();
	});
});
