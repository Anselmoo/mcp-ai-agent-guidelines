import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/strat/strat-tradeoff.js";
import {
	createMockSkillRuntime,
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("strat-tradeoff", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("honors explicit axes and emits evidence-rich tradeoff artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"analyze tradeoffs between hosted and self-hosted model serving",
				options: {
					decisionType: "technology",
					tradeoffAxes: ["cost", "latency", "reversibility"],
				},
			},
			{
				summaryIncludes: ["technology decision across 3 axes"],
				detailIncludes: [
					"cost, latency, reversibility",
					"Capture evidence quality per axis",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
	});

	it("surfaces workflow-specific axes and recommendation handoff guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"which workflow should we choose: single-agent or multi-agent for our pipeline?",
			},
			{
				detailIncludes: [
					"coordination overhead",
					"failure blast radius",
					"observability",
					"synth-recommendation",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(
			result.recommendations.map((item) => item.detail).join("\n"),
		).toContain("smallest benchmark or experiment");
	});

	it("infers an architectural decision type from request wording", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"help us evaluate the system architecture for our new platform",
			},
			{
				summaryIncludes: ["architectural decision"],
			},
		);
	});

	it("falls back to a technology decision type when no domain keywords match", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare these two vendor contracts for our office supplies",
			},
			{
				summaryIncludes: ["technology decision"],
			},
		);
	});

	it("returns insufficient-signal guidance for a non-empty request with no keywords and no context", async () => {
		const result = await skillModule.run(
			{ request: "is it or the" },
			createMockSkillRuntime(),
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"Tradeoff Analysis needs the alternatives to compare",
		);
	});

	// Note: the "guardrail" (singular, `details.length === 1`) branch on the
	// summary line is unreachable — `details` always starts with 2 unconditional
	// entries and gets 3 more unconditional pushes later, so its length is never 1.
	it("proceeds with analysis when the request has no keywords but context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "is it or the",
				context:
					"comparing single-agent versus multi-agent pipeline architecture",
			},
			{
				detailIncludes: ["Capture evidence quality per axis"],
			},
		);
	});

	it("handles a single explicit axis without the '+N more' suffix or plural 'axes'", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "compare vendor A and vendor B for our storage layer",
				options: {
					decisionType: "technology",
					tradeoffAxes: ["cost"],
				},
			},
			{
				detailIncludes: ["across axes: cost."],
			},
		);

		expect(result.summary).toContain("across 1 axis.");
	});

	it("appends a '+N more' suffix when more than four axes are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "compare vendor A and vendor B for our storage layer",
				options: {
					decisionType: "technology",
					tradeoffAxes: [
						"cost",
						"latency",
						"reversibility",
						"complexity",
						"security",
					],
				},
			},
			{
				detailIncludes: [
					"across axes: cost, latency, reversibility, complexity, +1 more.",
				],
			},
		);
	});

	it("flags a strategy handoff and comparative research follow-up when both are implied", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"what adoption roadmap and vision should guide our technology strategy, and what benchmark research and evidence base do we still need",
			},
			{
				detailIncludes: [
					"frame the strategy first and then return to tradeoffs",
					"route the request through comparative research or benchmarking",
				],
			},
		);

		expect(result.recommendations.length).toBeGreaterThan(0);
	});
});
