import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/orch/orch-result-synthesis.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("orch-result-synthesis", () => {
	it("merges agent outputs with semantic deduplication", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"merge agent outputs into one recommendation with conflicts and evidence",
				options: {
					conflictResolution: "merge",
					deduplicationStrategy: "semantic",
					includeConfidenceScoring: true,
				},
			},
			{
				summaryIncludes: [
					"Result Synthesis planned",
					"conflict: merge",
					"dedup: semantic",
					"confidence: enabled",
				],
				detailIncludes: [
					"using merge conflict resolution and semantic deduplication",
				],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("emits a synthesis packet artifact set with claims, dissent, and gaps", async () => {
		const result = await skillModule.run(
			{
				request:
					"merge conflicting agent outputs, deduplicate overlap, preserve source attribution, and rank important claims",
				deliverable: "merged recommendation packet",
				options: {
					conflictResolution: "merge",
					deduplicationStrategy: "semantic",
					includeConfidenceScoring: true,
				},
			},
			createMockSkillRuntime(),
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"worked-example",
		]);

		const template = result.artifacts?.find(
			(artifact) => artifact.kind === "output-template",
		);
		expect(template).toMatchObject({
			title: "Synthesis report template",
			fields: expect.arrayContaining([
				"Canonical claims",
				"Dissenting claims",
				"Gaps and unanswered questions",
			]),
		});

		const example = result.artifacts?.find(
			(artifact) => artifact.kind === "worked-example",
		) as
			| {
					expectedOutput?: {
						outputSchema?: {
							claims?: Array<Record<string, unknown>>;
							dissentingClaims?: Array<Record<string, unknown>>;
							gaps?: Array<Record<string, unknown>>;
						};
					};
			  }
			| undefined;
		expect(
			example?.expectedOutput?.outputSchema?.claims?.length,
		).toBeGreaterThan(0);
		expect(
			example?.expectedOutput?.outputSchema?.dissentingClaims?.length,
		).toBeGreaterThan(0);
		expect(example?.expectedOutput?.outputSchema?.gaps?.length).toBeGreaterThan(
			0,
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
