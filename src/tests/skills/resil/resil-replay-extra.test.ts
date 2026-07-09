import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-replay.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("resil-replay extra branch coverage", () => {
	it("asks for more detail when request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("uses quality-weighted eviction with success-heavy buffer", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay execution traces with quality weighted buffer consolidation",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.85,
					consolidationTrigger: "scheduled",
					injectionMode: "replace",
					bufferCapacity: 20,
				},
			},
			{
				summaryIncludes: ["Replay Consolidator produced"],
				detailIncludes: ["Buffer mix is success-heavy"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("uses recency-quality eviction with balanced buffer", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation and recency quality injection",
				options: {
					evictionPolicy: "recency-quality",
					successFraction: 0.55,
					consolidationTrigger: "quality-degradation",
					injectionMode: "append",
					bufferCapacity: 30,
				},
			},
			{
				summaryIncludes: ["Replay Consolidator produced"],
				detailIncludes: ["Buffer mix is balanced"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("uses fifo eviction with failure-heavy buffer and manual trigger", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay execution traces with buffer full consolidation and prepend injection manual trigger",
				options: {
					evictionPolicy: "fifo",
					successFraction: 0.2,
					consolidationTrigger: "manual",
					injectionMode: "prepend",
					bufferCapacity: 15,
				},
			},
			{
				summaryIncludes: ["Replay Consolidator produced"],
				detailIncludes: ["Buffer mix is failure-heavy"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("sparse buffer below 40% triggers sparse guidance", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation and replace injection",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.5,
					consolidationTrigger: "buffer-full",
					injectionMode: "replace",
					bufferCapacity: 20,
					bufferSize: 5,
				},
			},
			{
				summaryIncludes: ["Replay Consolidator produced"],
				detailIncludes: ["Buffer is sparse"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("buffer-full trigger produces buffer-full trigger note", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay execution traces buffer full trigger consolidation strategy",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.5,
					consolidationTrigger: "buffer-full",
					injectionMode: "replace",
					bufferCapacity: 25,
				},
			},
			{
				detailIncludes: ["Buffer-full trigger"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("quality-degradation trigger produces quality-degradation note", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay buffer quality degradation trigger full consolidation prepend injection",
				options: {
					evictionPolicy: "recency-quality",
					successFraction: 0.4,
					consolidationTrigger: "quality-degradation",
					injectionMode: "replace",
					bufferCapacity: 20,
				},
			},
			{
				detailIncludes: ["Quality-degradation trigger"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("replace injection mode produces replace injection note", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay buffer replace injection mode buffer full consolidation",
				options: {
					evictionPolicy: "recency-quality",
					successFraction: 0.5,
					consolidationTrigger: "scheduled",
					injectionMode: "replace",
					bufferCapacity: 20,
				},
			},
			{
				detailIncludes: ["Replace injection"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("append injection mode produces append injection note", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay buffer append injection consolidation buffer full quality weighted",
				options: {
					evictionPolicy: "recency-quality",
					successFraction: 0.5,
					consolidationTrigger: "scheduled",
					injectionMode: "append",
					bufferCapacity: 20,
				},
			},
			{
				detailIncludes: ["Append injection"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("produces token estimate based on bufferCapacity", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "replay buffer consolidation context window token estimate",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.5,
					consolidationTrigger: "buffer-full",
					injectionMode: "replace",
					bufferCapacity: 10,
				},
			},
			{
				detailIncludes: ["Estimated per-consolidation context window"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("produces fallback guidance when no pattern matches", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "configure replay consolidator system for an agent workflow",
			},
			{
				detailIncludes: ["Replay Consolidator"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("asks for more detail when request is simple and has no replay domain signal", async () => {
		const result = await skillModule.run(
			{ request: "help me improve this workflow" },
			createMockSkillRuntime(),
		);
		expect(result.summary).toContain("Replay Consolidator targets");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).toContain("Mention the trace buffer contents");
	});

	it("appends a constraints guideline when the input includes constraints", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation",
				constraints: [
					"buffer capacity must stay under 25 traces",
					"only manual triggers are allowed",
				],
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.35,
					consolidationTrigger: "buffer-full",
					injectionMode: "prepend",
					bufferCapacity: 25,
				},
			},
			{
				detailIncludes: [
					"Apply the replay consolidation under the following constraints",
					"buffer capacity must stay under 25 traces",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("ignores options that fail schema validation and falls back to keyword rules only", async () => {
		const result = await skillModule.run(
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation",
				options: {
					// out of the [0, 1] range accepted by the schema — parseSkillInput
					// reports ok: false and the handler must treat opts as undefined.
					successFraction: 5,
				},
			},
			createMockSkillRuntime(),
		);
		expect(result.summary).toContain("Replay Consolidator produced");
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Advisory buffer state");
		expect(detailText).not.toContain("Buffer mix is");
	});

	it("adequate buffer fill ratio skips the sparse-buffer guidance", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation and replace injection",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.5,
					consolidationTrigger: "buffer-full",
					injectionMode: "replace",
					bufferCapacity: 20,
					bufferSize: 12,
				},
			},
			{
				detailIncludes: ["Advisory buffer state"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("omits the success/failure mix note when successFraction is not provided", async () => {
		const result = await skillModule.run(
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation",
				options: {
					evictionPolicy: "quality-weighted",
					consolidationTrigger: "buffer-full",
					injectionMode: "replace",
					bufferCapacity: 20,
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Buffer mix is");
	});

	it("omits eviction-policy guidance when evictionPolicy is not provided", async () => {
		const result = await skillModule.run(
			{
				request:
					"replay execution traces with buffer full consolidation and replace injection",
				options: {
					successFraction: 0.5,
					consolidationTrigger: "buffer-full",
					injectionMode: "replace",
					bufferCapacity: 20,
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("FIFO eviction");
		expect(detailText).not.toContain("Quality-weighted eviction");
		expect(detailText).not.toContain("Recency-quality eviction");
	});

	it("omits consolidation-trigger guidance when consolidationTrigger is not provided", async () => {
		const result = await skillModule.run(
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation and replace injection",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.5,
					injectionMode: "replace",
					bufferCapacity: 20,
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Scheduled trigger:");
		expect(detailText).not.toContain("Quality-degradation trigger:");
		expect(detailText).not.toContain("Manual trigger:");
		expect(detailText).not.toContain("Buffer-full trigger:");
	});

	it("omits injection-mode guidance when injectionMode is not provided", async () => {
		const result = await skillModule.run(
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.5,
					consolidationTrigger: "buffer-full",
					bufferCapacity: 20,
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Prepend injection:");
		expect(detailText).not.toContain("Replace injection:");
		expect(detailText).not.toContain("Append injection:");
	});

	it("omits the token-estimate note when bufferCapacity is not provided", async () => {
		const result = await skillModule.run(
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation and replace injection",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.5,
					consolidationTrigger: "buffer-full",
					injectionMode: "replace",
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain(
			"Estimated per-consolidation context window",
		);
	});

	it("produces no numeric advisory parts when options carry only non-numeric fields", async () => {
		const result = await skillModule.run(
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation",
				options: {
					evictionPolicy: "quality-weighted",
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Advisory buffer state");
		expect(detailText).not.toContain("Estimated per-consolidation");
		expect(detailText).toContain("Quality-weighted eviction");
	});

	it("uses singular guideline phrasing when exactly one rule matches and no options are supplied", async () => {
		const result = await skillModule.run(
			{
				request:
					"we need to revert to the previous strategy after a bad rollout this agent should get smarter over time",
			},
			createMockSkillRuntime(),
		);
		expect(result.summary).toContain("Replay Consolidator produced 1 ");
		expect(result.summary).toContain(
			"trace-buffer and consolidation guideline for hippocampal-style",
		);
		expect(result.summary).not.toContain("guidelines for hippocampal-style");
	});
});
