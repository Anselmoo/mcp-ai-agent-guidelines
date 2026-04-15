import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/adapt/adapt-aco-router.js";
import {
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
});
