import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-redundant-voter.js";
import {
	createMockSkillRuntime,
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

	it("asks for more detail when the request is short and off-domain", async () => {
		const result = await skillModule.run(
			{ request: "help me plan lunch" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary.length).toBeGreaterThan(0);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
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

	it("warns about zero temperature jitter causing correlated replicas", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "vote across replicas with structural comparison",
				options: {
					nReplicas: 5,
					comparisonMode: "structural",
					temperatureJitter: 0,
				},
			},
			{
				detailIncludes: ["jitter=0: all replicas run at identical temperature"],
			},
		);
	});

	it("notes diverse outputs when temperature jitter is non-zero", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "vote across replicas with structural comparison",
				options: {
					nReplicas: 5,
					comparisonMode: "structural",
					temperatureJitter: 0.15,
				},
			},
			{
				detailIncludes: ["replicas will produce diverse outputs"],
			},
		);
	});

	it("warns when an even replica count allows perfect splits", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "vote across replicas with majority consensus",
				options: {
					nReplicas: 4,
				},
			},
			{
				detailIncludes: [
					"WARNING: even n_replicas=4 allows perfect splits",
					"5 recommended",
				],
			},
		);
	});

	it("omits the similarity classification when no threshold is supplied", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "vote across replicas with majority consensus",
				options: {
					nReplicas: 5,
				},
			},
			{
				detailIncludes: ["strict majority requires 3 agreeing replicas"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("classifies cluster membership");
	});

	it("falls back to generic setup guidance when no rule pattern matches", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"help configure a robust output pipeline for this workflow node please",
			},
			{
				detailIncludes: [
					"To configure an N-modular Redundant Voter",
					"Start with n=3",
				],
			},
		);
	});

	it("uses plural phrasing for a Byzantine fault limit greater than one", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "vote across replicas with majority consensus",
				options: {
					nReplicas: 7,
				},
			},
			{
				detailIncludes: [
					"Byzantine fault limit f=2 (tolerates 2 faulty replicas)",
				],
			},
		);
	});

	it("skips the numeric NMR advisory when nReplicas fails schema validation", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "vote across multiple replicas with majority consensus",
				options: {
					nReplicas: 2,
				},
			},
			{},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Advisory NMR computation");
	});

	it("uses singular phrasing when exactly one guideline is produced", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"what is the token budget and resource overhead for this configuration node setup",
			},
			{
				summaryIncludes: [
					"Redundant Voter produced 1 NMR configuration guideline ",
				],
			},
		);
	});

	it("appends constraint guidance when constraints are provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"vote across multiple replicas with semantic similarity and tiebreak escalation",
				constraints: ["max 5 replicas", "no exact comparison", "budget capped"],
				options: {
					tiebreakStrategy: "escalate",
					comparisonMode: "semantic",
					nReplicas: 5,
				},
			},
			{
				detailIncludes: [
					"Apply the voting configuration under the following constraints",
					"max 5 replicas; no exact comparison; budget capped",
				],
			},
		);
	});
});
