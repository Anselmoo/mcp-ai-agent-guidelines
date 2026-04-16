import { describe, it } from "vitest";
import { skillModule } from "../../../skills/adapt/adapt-physarum-router.js";
import {
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
});
