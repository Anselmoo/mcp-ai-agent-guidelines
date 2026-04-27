import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-dirac-notation-mapper.js";
import {
	createMockSkillRuntime,
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-dirac-notation-mapper", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits overlap artifacts for centrality analysis", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Which files are most central in this package based on overlap?",
				options: {
					focus: "centrality",
					fileCount: 8,
					pairOverlap: 0.87,
					projectionWeight: 2.4,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Dirac overlap worked example",
				"Dirac mapping decision matrix",
				"Dirac mapping checks",
			]),
		);
	});

	it("returns insufficient signal when the request lacks overlap semantics", async () => {
		const result = await skillModule.run(
			{
				request: "review the architecture from a high level",
				context:
					"this note keeps the phrasing general and avoids specialized analysis terms",
			},
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain(
			"requires an overlap or file-centrality signal",
		);
	});

	it("handles near-orthogonal pair overlap with numeric advice", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "analyse these two files for overlap and independence",
				options: {
					focus: "orthogonality",
					fileCount: 5,
					pairOverlap: 0.15,
					projectionWeight: 1.2,
				},
			},
			{
				detailIncludes: ["mostly independent"],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.summary).toContain("Dirac Notation Mapper");
	});
});
