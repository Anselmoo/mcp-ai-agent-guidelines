import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/adapt/adapt-annealing.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("adapt-annealing", () => {
	it("adds pareto and reheat annealing guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"anneal workflow routing to escape local optima with reheating and multi objective cost quality tradeoff",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "adaptive",
				},
			},
			{
				summaryIncludes: [
					"Annealing Optimizer produced",
					"geometric cooling",
					"adaptive perturbation",
				],
				detailIncludes: [
					"Pareto archive",
					"Define the energy function E =",
					"random search with the same K evaluations",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "output-template",
					title: "Annealing optimizer result",
				}),
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Annealing strategy matrix",
				}),
				expect.objectContaining({
					kind: "tool-chain",
					title: "Annealing optimization chain",
				}),
				expect.objectContaining({
					kind: "eval-criteria",
					title: "Annealing validation criteria",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Annealing vs random-search example",
				}),
			]),
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
