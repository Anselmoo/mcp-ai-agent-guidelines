import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/adapt/adapt-quorum.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("adapt-quorum-extra", () => {
	it("returns insufficient signal for empty request (lines 81-82)", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("returns second-stage insufficient signal when keywords present but no quorum domain signal and no context (lines 90-91)", async () => {
		// "review" triggers keywords but has no quorum vocab and no context field
		const result = await skillModule.run(
			{ request: "review the architecture" },
			createMockSkillRuntime(),
		);
		expect(result.recommendations[0]?.title).toContain("Provide more detail");
	});

	it("uses weighted quorum policy when explicitly set (line 200 weighted label)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"agents claim tasks based on quorum threshold and specialisation matching with load awareness",
				options: {
					quorumPolicy: "weighted",
					fallbackBehaviour: "queue",
				},
			},
			{
				summaryIncludes: ["weighted contributions"],
				detailIncludes: ["Quorum sensing advisory"],
			},
		);
	});

	it("uses probabilistic quorum policy when explicitly set (line 206 probabilistic label)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"agents emit availability signals for load-based quorum coordination with threshold broadcast",
				options: {
					quorumPolicy: "probabilistic",
					fallbackBehaviour: "queue",
				},
			},
			{
				summaryIncludes: ["probabilistic broadcast"],
				detailIncludes: ["Quorum sensing advisory"],
			},
		);
	});

	it("uses strict quorum policy by default (line 200 strict label)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"agents broadcast tasks when quorum threshold is met using availability signals",
				options: {
					quorumPolicy: "strict",
					fallbackBehaviour: "escalate",
				},
			},
			{
				summaryIncludes: ["strict threshold"],
				detailIncludes: ["Quorum sensing advisory"],
			},
		);
	});

	it("infers probabilistic policy from request text (line 206 probabilistic infer)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"use a probabilistic soft threshold with sigmoid for partial quorum confidence in agent coordination",
			},
			{
				summaryIncludes: ["probabilistic broadcast"],
			},
		);
	});

	it("infers weighted policy from request text (line 200 weighted infer)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"weight agent contributions by specialisation relevance score when forming quorum threshold",
			},
			{
				summaryIncludes: ["weighted contributions"],
			},
		);
	});

	it("uses escalate fallback behaviour when explicitly set", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"agents publish availability signals with load and quorum threshold for broadcast",
				options: {
					quorumPolicy: "strict",
					fallbackBehaviour: "escalate",
				},
			},
			{
				summaryIncludes: ["escalate"],
			},
		);
	});

	it("uses retry fallback behaviour when explicitly set", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"agents publish quorum signals for availability-based task assignment",
				options: {
					quorumPolicy: "strict",
					fallbackBehaviour: "retry",
				},
			},
			{
				summaryIncludes: ["retry"],
			},
		);
	});

	it("includes specialisation matching detail when signal detected (line 307)", async () => {
		const result = await skillModule.run(
			{
				request:
					"agents match specialisation tags to task requirements before computing quorum signal_sum",
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain(
			"specialisation matching as a pre-aggregation",
		);
	});

	it("includes load balancing detail when load distribution signal detected (line 323)", async () => {
		const result = await skillModule.run(
			{
				request:
					"load balance agents evenly to prevent saturation using quorum threshold for task broadcast",
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("(1 − load) weighting");
	});

	it("includes fleet dynamics detail when fleet scaling signal detected (line 335)", async () => {
		const result = await skillModule.run(
			{
				request:
					"scale the agent fleet dynamically as agents join and leave during quorum threshold coordination",
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("TTL cache");
	});

	it("includes quality measure detail when quality signal detected (line 341)", async () => {
		const result = await skillModule.run(
			{
				request:
					"agents publish quality score and success rate metrics when forming quorum for task broadcast",
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("quality_recent should reflect");
	});

	it("includes convergence detail when convergence signal detected (line 347)", async () => {
		const result = await skillModule.run(
			{
				request:
					"monitor when quorum formation reaches a plateau or agents settle into stable coordination",
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("quorum formation latency");
	});

	it("includes constraints detail when constraints are provided (line 353)", async () => {
		const result = await skillModule.run(
			{
				request:
					"agents emit quorum signals for load-balanced task broadcast with threshold",
				constraints: [
					"fleet must not exceed 20 agents",
					"signal latency under 100ms",
				],
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain(
			"Apply quorum configuration within these constraints",
		);
	});

	it("includes persistence detail when persist/durable signal detected (line 443)", async () => {
		const result = await skillModule.run(
			{
				request:
					"persist the agent registry state to durable storage for quorum coordination and task broadcast",
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("append-only event log");
	});

	it("includes fallback detail when fallback/no-quorum keyword detected", async () => {
		const result = await skillModule.run(
			{
				request:
					"define fallback behaviour when quorum does not form within timeout window for task dispatch",
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("Define a fallback path");
	});

	it("emits all three artifact types", async () => {
		const result = await skillModule.run(
			{
				request:
					"agents publish quorum signals for availability-based task assignment with threshold and fallback",
				options: {
					quorumPolicy: "weighted",
					fallbackBehaviour: "escalate",
				},
			},
			createMockSkillRuntime(),
		);
		const kinds = result.artifacts?.map((a) => a.kind) ?? [];
		expect(kinds).toContain("output-template");
		expect(kinds).toContain("comparison-matrix");
		expect(kinds).toContain("tool-chain");
	});

	it("uses context to override the quorum domain signal check (line 90 hasContext branch)", async () => {
		// Keywords present, no quorum vocab in request, but context provided
		// → hasContext=true bypasses the second-stage insufficient signal guard
		const result = await skillModule.run(
			{
				request: "improve agent coordination and task assignment in the system",
				context:
					"We use quorum sensing with signal_sum thresholds and availability signals",
			},
			createMockSkillRuntime(),
		);
		// Should produce capability result, not insufficient signal
		expect(result.executionMode).toBe("capability");
		expect(result.summary).not.toContain("Provide more detail");
	});

	it("baseline orientation details appear when no quorum rules fire", async () => {
		// Request has quorum domain signal ("quorum" in Cluster A) but avoids all
		// QUORUM_RULES patterns (signal/threshold/load/broadcast/fallback/scale/etc.)
		const result = await skillModule.run(
			{
				request:
					"Design a quorum sensing mechanism for decentralised agent coordination",
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		// When no domain rules match, baseline orientation fallback details are added
		expect(detailText).toContain("Establish three foundational components");
	});
});
