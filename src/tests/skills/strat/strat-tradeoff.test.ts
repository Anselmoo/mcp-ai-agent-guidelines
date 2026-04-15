import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/strat/strat-tradeoff.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("strat-tradeoff", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("honors explicit axes and emits evidence-rich tradeoff artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"analyze tradeoffs between hosted and self-hosted model serving",
				options: {
					decisionType: "technology",
					tradeoffAxes: ["cost", "latency", "reversibility"],
				},
			},
			{
				summaryIncludes: ["technology decision across 3 axes"],
				detailIncludes: [
					"cost, latency, reversibility",
					"Capture evidence quality per axis",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
	});

	it("surfaces workflow-specific axes and recommendation handoff guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"which workflow should we choose: single-agent or multi-agent for our pipeline?",
			},
			{
				detailIncludes: [
					"coordination overhead",
					"failure blast radius",
					"observability",
					"synth-recommendation",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(
			result.recommendations.map((item) => item.detail).join("\n"),
		).toContain("smallest benchmark or experiment");
	});
});
