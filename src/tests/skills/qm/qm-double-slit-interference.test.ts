import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-double-slit-interference.js";
import {
	createMockSkillRuntime,
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-double-slit-interference", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits compatibility artifacts for two competing approaches", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Do these two implementations complement each other or conflict?",
				options: {
					analysisGoal: "merge",
					intensityA: 0.8,
					intensityB: 0.7,
					cosineSimilarity: 0.9,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"comparison-matrix",
			"eval-criteria",
		]);
	});

	it("asks for more detail when no interference signal is provided", async () => {
		const result = await skillModule.run(
			{
				request: "evaluate a general design note",
				context: "this text is intentionally neutral and avoids signal phrases",
			},
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain(
			"requires signal about two competing or cooperating approaches",
		);
	});

	it("classifies destructive interference for negative cosine similarity", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "compare two implementations for conflict and duplication",
				options: {
					analysisGoal: "keep-separate",
					intensityA: 0.8,
					intensityB: 0.7,
					cosineSimilarity: -0.85,
				},
			},
			{
				detailIncludes: ["destructive"],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.summary).toContain("Double Slit Interference");
	});

	it("classifies independent interference when similarity is near zero", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "compare these two closely related approaches",
				options: {
					analysisGoal: "choose-one",
					intensityA: 0.4,
					intensityB: 0.4,
					cosineSimilarity: 0.0,
				},
			},
			{
				detailIncludes: ["independent"],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.summary).toContain("Double Slit Interference");
	});
});
