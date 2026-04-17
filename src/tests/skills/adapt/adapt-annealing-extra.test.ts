import { describe, it } from "vitest";
import { skillModule } from "../../../skills/adapt/adapt-annealing.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("adapt-annealing extra branch coverage", () => {
	it("asks for more detail when request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("linear cooling schedule produces linear-specific guidance", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "optimise workflow topology with linear temperature cooling schedule search",
				options: {
					coolingSchedule: "linear",
					perturbationStrategy: "single-dimension",
				},
			},
			{
				summaryIncludes: ["linear cooling"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("logarithmic cooling schedule is described in summary", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "anneal workflow config iterating through topology candidates with logarithmic schedule",
				options: {
					coolingSchedule: "logarithmic",
					perturbationStrategy: "multi-dimension",
				},
			},
			{
				summaryIncludes: ["logarithmic cooling"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("single-dimension perturbation strategy in summary", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "optimise workflow with simulated annealing single dimension search",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "single-dimension",
				},
			},
			{
				summaryIncludes: ["single-dimension perturbation"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("multi-dimension perturbation strategy in summary", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "anneal workflow config with multi-dimension perturbation strategy exploration",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "multi-dimension",
				},
			},
			{
				summaryIncludes: ["multi-dimension perturbation"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("handles latency-cost tradeoff objective signals", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "optimise for latency-token_cost tradeoff objective balancing quality lambda weight",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "adaptive",
				},
			},
			{
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("handles exploration convergence signal", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "anneal topology config converge on optimal configuration by exploring search space",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "adaptive",
				},
			},
			{
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("handles quality measure signal", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "anneal workflow and evaluate configuration quality metric score by iterating",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "adaptive",
				},
			},
			{
				recommendationCountAtLeast: 3,
			},
		);
	});
});
