import { describe, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-replay.js";
import {
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
				request: "replay execution traces with quality weighted buffer consolidation",
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
				request: "replay execution traces with quality weighted buffer full consolidation and recency quality injection",
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
				request: "replay execution traces with buffer full consolidation and prepend injection manual trigger",
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
				request: "replay execution traces with quality weighted buffer full consolidation and replace injection",
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
				request: "replay execution traces buffer full trigger consolidation strategy",
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
				request: "replay buffer quality degradation trigger full consolidation prepend injection",
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
				request: "replay buffer replace injection mode buffer full consolidation",
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
				request: "replay buffer append injection consolidation buffer full quality weighted",
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
});
