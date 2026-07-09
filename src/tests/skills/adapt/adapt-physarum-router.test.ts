import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/adapt/adapt-physarum-router.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("adapt-physarum-router", () => {
	it("uses adaptive pruning and throughput flow signals", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"prune low flow paths in the workflow topology using conductance throughput",
				options: {
					pruningStrategy: "adaptive",
					flowMeasure: "throughput",
				},
			},
			{
				summaryIncludes: [
					"Physarum Router produced",
					"adaptive pruning",
					"edge throughput",
				],
				detailIncludes: [
					"Physarum routing advisory",
					"D(t+1) = D(t) × |flow(t)|^μ",
					"2–3 consecutive adaptation cycles",
					"with probability p_explore per cycle, spawn a candidate edge",
				],
				recommendationCountAtLeast: 5,
			},
		);
	});

	it("uses explicit adaptive and quality options on a generic routing request", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "adapt workflow routing",
				options: {
					pruningStrategy: "adaptive",
					flowMeasure: "quality",
				},
			},
			{
				summaryIncludes: ["Physarum Router produced", "adaptive pruning"],
				detailIncludes: [
					"Quality-based Physarum flow should derive one bounded score per traversed edge",
					"Adaptive pruning should compute D_prune from the current conductance distribution and its variance",
				],
				recommendationCountAtLeast: 5,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request has no extractable keywords and no context", async () => {
		// "a to be" is entirely stop-words/short tokens, so it passes the
		// schema's min(1) length check but yields zero keywords — this is the
		// stage-1 vague-request guard, distinct from the empty-string case
		// (which fails schema validation before reaching this branch).
		const result = await skillModule.run(
			{ request: "a to be" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain(
			"Physarum Router needs a description of the workflow topology",
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("asks for more detail when keywords exist but no Physarum-distinctive signal is present", async () => {
		const result = await skillModule.run(
			{ request: "please help me think about something" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain(
			"could not identify conductance-and-pruning-specific",
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("infers aggressive pruning strategy from fast-convergence vocabulary", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"aggressively prune workflow edges to converge fast on quickly reduced topology with low threshold conductance",
			},
			{
				summaryIncludes: [
					"Physarum Router produced",
					"aggressive pruning (low threshold",
				],
				detailIncludes: [
					"Aggressive pruning can remove low-signal edges quickly",
				],
			},
		);
	});

	it("infers conservative pruning strategy by default when no strategy vocabulary is present", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"advise on physarum conductance tube reinforcement for workflow edges",
			},
			{
				summaryIncludes: [
					"Physarum Router produced",
					"conservative pruning (high conductance threshold",
				],
				detailIncludes: [
					"Conservative pruning should require multiple low-conductance cycles before removal",
				],
			},
		);
	});

	it("infers adaptive pruning strategy from variance/dynamic-threshold vocabulary without an explicit option", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"adapt the conductance pruning threshold dynamically based on flow variance for physarum-style workflow edges",
			},
			{
				summaryIncludes: [
					"Physarum Router produced",
					"adaptive pruning (threshold adjusts based on flow variance)",
				],
				detailIncludes: [
					"Adaptive pruning should compute D_prune from the current conductance distribution and its variance",
				],
			},
		);
	});

	it("infers quality flow measure from quality/score vocabulary without an explicit option", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"reinforce physarum conductance based on the output quality score of each workflow edge",
			},
			{
				summaryIncludes: [
					"Physarum Router produced",
					"output quality score (higher quality",
				],
				detailIncludes: [
					"Quality-based Physarum flow should derive one bounded score per traversed edge",
				],
			},
		);
	});

	it("infers latency flow measure from latency vocabulary", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"prune slow, high-latency workflow edges using physarum conductance decay for slime mould routing",
			},
			{
				summaryIncludes: [
					"Physarum Router produced",
					"edge latency (lower latency",
				],
				detailIncludes: [
					"Latency-based Physarum flow should invert and normalise response time",
				],
			},
		);
	});

	it("treats context-only requests as sufficient signal to proceed past the vague-request guard", async () => {
		const result = await skillModule.run(
			{
				request: "help",
				context:
					"We need physarum conductance pruning guidance for our workflow edges.",
			},
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Physarum Router produced");
	});

	it("surfaces exploration, convergence, persistence, and constraint supplementary guidance together", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"physarum conductance routing: balance exploration vs exploitation of new paths, monitor convergence and stability toward a stable plateau, persist and checkpoint conductance state so it can resume, and prune dead-end edges",
				constraints: [
					"Cycle budget capped at 50 adaptation cycles",
					"No more than 200 edges in the topology",
					"Must log every pruning decision",
				],
			},
			{
				summaryIncludes: ["Physarum Router produced"],
				detailIncludes: [
					"Track the proportion of active edges (D > D_min) over time",
					"Measure topology convergence as the coefficient of variation",
					"Snapshot the conductance map at each cycle boundary",
					"Apply Physarum configuration within these constraints: Cycle budget capped at 50 adaptation cycles; No more than 200 edges in the topology; Must log every pruning decision.",
				],
			},
		);
	});
});
