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
				request:
					"optimise workflow topology with linear temperature cooling schedule search",
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
				request:
					"anneal workflow config iterating through topology candidates with logarithmic schedule",
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
				request:
					"optimise workflow with simulated annealing single dimension search",
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
				request:
					"anneal workflow config with multi-dimension perturbation strategy exploration",
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
				request:
					"optimise for latency-token_cost tradeoff objective balancing quality lambda weight",
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
				request:
					"anneal topology config to balance the search and detect a plateau before it locks in",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "adaptive",
				},
			},
			{
				detailIncludes: [
					"Monitor the ratio of unique states visited",
					"Detect premature convergence",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("handles quality measure signal", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"anneal workflow and evaluate configuration quality metric score by iterating",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "adaptive",
				},
			},
			{
				detailIncludes: ["Measure quality on a stratified sample"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	// -------------------------------------------------------------------------
	// Additional branch-coverage cases (issue #1521): domain-signal cluster
	// short-circuit paths, unset-option inference defaults, surrogate/reheat
	// word-boundary edge cases, and constraint-list guidance.
	// -------------------------------------------------------------------------

	it("asks for more detail when request has words but no keywords and no context (stage 1 vague guard)", async () => {
		await expectSkillGuidance(
			skillModule,
			{ request: "hi ok" },
			{
				summaryIncludes: [
					"Annealing Optimizer needs a description of the workflow topology",
				],
			},
		);
	});

	it("asks for more detail when cluster B topology wording lacks search intent (stage 2 guard)", async () => {
		await expectSkillGuidance(
			skillModule,
			{ request: "workflow topology configuration" },
			{
				summaryIncludes: [
					"could not identify workflow-search or simulated-annealing details",
				],
			},
		);
	});

	it("asks for more detail when cluster C objective wording lacks adaptation intent (stage 2 guard)", async () => {
		await expectSkillGuidance(
			skillModule,
			{ request: "latency and cost objective tradeoff for the workflow" },
			{
				summaryIncludes: [
					"could not identify workflow-search or simulated-annealing details",
				],
			},
		);
	});

	it("infers logarithmic cooling and single-dimension perturbation when no options are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"anneal the workflow using a very slow logarithmic schedule for a rugged landscape",
			},
			{
				summaryIncludes: [
					"logarithmic cooling",
					"single-dimension perturbation",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers linear cooling when no options are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "anneal the workflow with a simple linear decrement schedule",
			},
			{
				summaryIncludes: ["linear cooling"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers geometric cooling and single-dimension perturbation defaults when no options and no matching keywords are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "anneal the workflow to find the best agent topology",
			},
			{
				summaryIncludes: ["geometric cooling", "single-dimension perturbation"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers adaptive perturbation when no options are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"anneal the workflow using an adaptive perturbation radius that shrinks",
			},
			{
				summaryIncludes: ["adaptive perturbation"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers multi-dimension perturbation when no options are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"anneal the workflow changing several knobs at once, simultaneous across the topology",
			},
			{
				summaryIncludes: ["multi-dimension perturbation"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("handles surrogate-model signal", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"anneal workflow topology using a surrogate model to screen candidates before full evaluation",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "single-dimension",
				},
			},
			{
				detailIncludes: [
					"build a surrogate model trained on the first 20–30 actual evaluations",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("handles reheat signal only when the word boundary matches (not 'reheating')", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"anneal workflow and reheat the schedule when the search stalls",
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "single-dimension",
				},
			},
			{
				detailIncludes: ["Implement iterated annealing"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("detects cluster B domain signal (topology + search intent) without cluster A vocabulary", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"optimise workflow topology by iterating through candidate configurations",
			},
			{
				summaryIncludes: ["geometric cooling", "single-dimension perturbation"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("applies constraint-list guidance when constraints are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"anneal the workflow topology to search for the best configuration",
				constraints: [
					"evaluation budget capped at 200 runs",
					"latency SLA under 2s",
				],
				options: {
					coolingSchedule: "geometric",
					perturbationStrategy: "single-dimension",
				},
			},
			{
				detailIncludes: [
					"Apply annealing configuration within these constraints: evaluation budget capped at 200 runs; latency SLA under 2s.",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});
});
