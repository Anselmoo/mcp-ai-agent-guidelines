import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-replay.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("resil-replay", () => {
	it("advises on failure-heavy replay buffers", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation and prepend injection",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.35,
					consolidationTrigger: "buffer-full",
					injectionMode: "prepend",
					bufferCapacity: 25,
				},
			},
			{
				summaryIncludes: [
					"Replay Consolidator produced",
					"trace-buffer and consolidation guideline",
				],
				detailIncludes: [
					"Buffer mix is failure-heavy",
					"Estimated per-consolidation context window",
					"reflection agent",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("returns replay buffer and consolidation artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"replay execution traces with quality weighted buffer full consolidation and prepend injection",
				options: {
					evictionPolicy: "quality-weighted",
					successFraction: 0.35,
					consolidationTrigger: "buffer-full",
					injectionStyle: "prepend",
					bufferCapacity: 25,
				},
			},
			{
				summaryIncludes: [
					"Replay Consolidator produced",
					"trace-buffer and consolidation guideline",
				],
				detailIncludes: ["Buffer mix is failure-heavy", "reflection agent"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "output-template",
					title: "Replay buffer configuration",
				}),
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Replay buffer state matrix",
				}),
				expect.objectContaining({
					kind: "worked-example",
					title: "Replay consolidation example",
				}),
			]),
		);
	});
});
