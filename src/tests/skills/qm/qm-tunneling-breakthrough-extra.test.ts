import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-tunneling-breakthrough.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-tunneling-breakthrough extra branches", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("handles empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("viability: favourable when barrierRisk low", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "should we refactor this small utility module now",
				options: {
					barrierRisk: "low",
					teamEnergy: "medium",
				},
			},
			{
				summaryIncludes: ["favourable"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("viability: favourable when teamEnergy high", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "should we refactor this legacy module during our dedicated sprint",
				options: {
					barrierRisk: "medium",
					teamEnergy: "high",
				},
			},
			{
				summaryIncludes: ["favourable"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("viability: unfavourable when barrierRisk high and teamEnergy low", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "should we attempt this large-scale legacy migration right now",
				options: {
					barrierRisk: "high",
					teamEnergy: "low",
				},
			},
			{
				summaryIncludes: ["unfavourable"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("viability: marginal for medium barrier and medium energy", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "should we proceed with this legacy module refactoring",
				options: {
					barrierRisk: "medium",
					teamEnergy: "medium",
				},
			},
			{
				summaryIncludes: ["marginal"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("produces numeric WKB estimate when width/height/energy provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "estimate refactoring viability for this legacy component",
				options: {
					barrierRisk: "high",
					teamEnergy: "medium",
					barrierWidth: 0.3,
					barrierHeight: 0.6,
					teamEnergyLevel: 0.5,
				},
			},
			{
				detailIncludes: ["WKB tunnelling estimate"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("produces candidate ranking when multiple candidates provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "rank these refactoring candidates by viability",
				options: {
					candidates: [
						{
							name: "refactor-auth",
							barrierWidth: 0.3,
							barrierHeight: 0.4,
							teamEnergyLevel: 0.7,
						},
						{
							name: "refactor-payment",
							barrierWidth: 0.8,
							barrierHeight: 0.9,
							teamEnergyLevel: 0.3,
						},
					],
				},
			},
			{
				detailIncludes: ["WKB candidate ranking"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("uses snake_case reference-style fields in candidates", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "rank these refactoring candidates using wkb probability",
				options: {
					candidates: [
						{
							name: "legacy-orm",
							barrier_width: 0.7,
							barrier_height: 0.8,
							energy: 0.4,
						},
						{
							name: "small-util",
							barrier_width: 0.2,
							barrier_height: 0.3,
							energy: 0.7,
						},
					],
				},
			},
			{
				detailIncludes: ["WKB candidate ranking"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("detects refactoring signal from 'restructure' keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "restructure the legacy data layer module with coupling barriers",
			},
			{
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("applies rules for 'test' keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"refactor module with coverage gaps and untested characterisation barriers",
			},
			{
				detailIncludes: ["Test coverage"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("applies rules for 'freeze' keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"assess refactoring viability with upcoming code freeze window",
			},
			{
				detailIncludes: ["freeze"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("artifacts contain expected kinds", async () => {
		const result = await skillModule.run(
			{
				request:
					"assess refactoring viability for our legacy migration with barrier risk",
				options: {
					barrierRisk: "high",
					teamEnergy: "medium",
				},
			},
			// use default runtime from skill module contract
			{ modelRouter: { chooseSkillModel: () => ({ id: "test", label: "Test", modelClass: "cheap" as const, strengths: [], maxContextWindow: "medium" as const, costTier: "cheap" as const }) } },
		);

		const artifactKinds =
			result.artifacts?.map((artifact) => artifact.kind) ?? [];
		expect(artifactKinds).toContain("worked-example");
		expect(artifactKinds).toContain("output-template");
	});
});
