import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/adapt/adapt-aco-router.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("adapt-aco-router", () => {
	it("tailors routing advice to exploit mode and full-graph scope", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"pheromone routing over graph edges with quality score convergence and persistence",
				options: {
					routingMode: "exploit",
					adaptationScope: "full-graph",
				},
			},
			{
				summaryIncludes: [
					"ACO Router produced",
					"exploitation-focused",
					"full graph",
				],
				detailIncludes: [
					"ACO routing advisory",
					"Emit the quality signal as a structured event",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("returns pheromone configuration artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"pheromone routing over graph edges with quality score convergence and persistence",
				options: {
					routingMode: "exploit",
					adaptationScope: "full-graph",
				},
			},
			{
				summaryIncludes: ["ACO Router produced", "full graph"],
				detailIncludes: ["pheromone mechanics", "quality signal"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "output-template",
					title: "ACO pheromone configuration",
				}),
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "ACO edge-state matrix",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "ACO pheromone update example",
				}),
			]),
		);
	});

	it("rejects invalid routing options", async () => {
		const result = await skillModule.run(
			{
				request: "pheromone routing over graph edges",
				options: { routingMode: "greedy" },
			} as never,
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("asks for more detail when keywords are present but ACO signal and context are both absent", async () => {
		const result = await skillModule.run(
			{ request: "improve our team meeting schedule please" },
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain(
			"could not identify ACO-specific routing details",
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
			detail: expect.stringContaining("Add graph structure"),
		});
	});

	it("infers explore mode and node scope from free-text signals when no options are given", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"pheromone trail should discover new paths across node select strategy for the graph edges",
			},
			{
				summaryIncludes: [
					"ACO Router produced",
					"exploration-biased",
					"node selection",
				],
			},
		);
	});

	it("infers exploit mode and full-graph scope from free-text signals when no options are given", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"reinforce pheromone trail to exploit the best known path across the full graph edges and nodes",
			},
			{
				summaryIncludes: [
					"ACO Router produced",
					"exploitation-focused",
					"full graph (nodes and edges)",
				],
			},
		);
	});

	it("falls back to balanced mode and edge scope when no inference signal is present", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "please help me decide",
				context: "general strategy discussion",
			},
			{
				summaryIncludes: [
					"ACO Router produced",
					"balanced",
					"edge transitions",
				],
			},
		);

		expect(
			result.recommendations.some((recommendation) =>
				recommendation.detail.includes(
					"Establish the three components of an ACO router",
				),
			),
		).toBe(true);
	});

	it("adds constraint-aware guidance when constraints are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"pheromone routing over graph edges with quality score convergence and persistence",
				constraints: [
					"Cycle frequency must stay under 5 minutes",
					"Persistence writes must be append-only",
				],
			},
			{
				summaryIncludes: ["ACO Router produced"],
				detailIncludes: ["Apply ACO configuration within these constraints"],
			},
		);
	});

	it("asks for more detail when the request has no usable keywords and no context", async () => {
		const result = await skillModule.run(
			{ request: "can you do this for me" },
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain(
			"needs a description of the workflow graph",
		);
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("adds convergence and persistence guidance when both signals are present", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"pheromone trail routing has reached a plateau and settled after we resume from a saved state",
			},
			{
				summaryIncludes: ["ACO Router produced"],
				detailIncludes: [
					"Convergence detection: compare the maximum-probability edge's τ value",
					"Persist pheromone state as a flat key-value snapshot",
				],
			},
		);
	});
});
