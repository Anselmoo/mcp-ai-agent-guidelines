import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-redundant-voter.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("resil-redundant-voter", () => {
	it("configures semantic voting escalation", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"vote across multiple replicas with semantic similarity and tiebreak escalation",
				options: {
					tiebreakStrategy: "escalate",
					comparisonMode: "semantic",
					nReplicas: 5,
					similarityThreshold: 0.72,
				},
			},
			{
				summaryIncludes: [
					"Redundant Voter produced",
					"NMR configuration guideline",
				],
				detailIncludes: ["Escalate tiebreak", "similarity matrix"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("returns redundant-voting artifacts for a semantic majority", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"vote across multiple replicas with semantic similarity and tiebreak escalation",
				options: {
					tiebreakStrategy: "escalate",
					comparisonMode: "semantic",
					nReplicas: 5,
					similarityThreshold: 0.72,
				},
			},
			{
				summaryIncludes: [
					"Redundant Voter produced",
					"NMR configuration guideline",
				],
				detailIncludes: ["Escalate tiebreak", "similarity threshold"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "output-template",
					title: "Redundant voter configuration",
				}),
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Replica consensus matrix",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Replica voting example",
				}),
			]),
		);
	});
});
