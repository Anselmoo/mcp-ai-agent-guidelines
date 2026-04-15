import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-tunneling-breakthrough.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-tunneling-breakthrough", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits tunneling artifacts with static-evidence grounding", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"assess whether we should refactor this legacy module now or defer until the barrier is lower",
				options: {
					barrierRisk: "high",
					teamEnergy: "medium",
					barrierWidth: 0.45,
					barrierHeight: 0.8,
					teamEnergyLevel: 0.5,
				},
			},
			{
				recommendationCountAtLeast: 4,
				detailIncludes: [
					"WKB tunnelling estimate",
					"The runtime bridge is still in progress",
				],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"output-template",
			"comparison-matrix",
			"eval-criteria",
			"tool-chain",
		]);
	});

	it("ranks structured refactoring candidates using reference-style inputs", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "which refactoring is most viable right now",
				options: {
					candidates: [
						{
							name: "replace-legacy-orm",
							barrier_width: 0.9,
							barrier_height: 0.9,
							energy: 0.35,
						},
						{
							name: "extract-service-layer",
							barrier_width: 0.2,
							barrier_height: 0.45,
							energy: 0.65,
						},
						{
							name: "migrate-to-typescript",
							barrier_width: 0.65,
							barrier_height: 0.75,
							energy: 0.5,
						},
					],
				},
			},
			{
				recommendationCountAtLeast: 4,
				detailIncludes: [
					"WKB candidate ranking from provided refactorings",
					"extract-service-layer",
				],
			},
		);

		expect(result.summary).toContain("ranked 3 refactoring candidates");
		expect(result.summary).toContain("extract-service-layer");

		const rankingArtifact = result.artifacts?.find(
			(artifact) => artifact.kind === "comparison-matrix",
		);
		expect(rankingArtifact).toMatchObject({
			kind: "comparison-matrix",
			title: "Refactoring tunnelling ranking",
			rows: [
				{ label: "extract-service-layer" },
				{ label: "migrate-to-typescript" },
				{ label: "replace-legacy-orm" },
			],
		});
	});
});
