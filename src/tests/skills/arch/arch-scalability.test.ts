import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/arch/arch-scalability.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("arch-scalability", () => {
	it("focuses on throughput and backpressure scaling", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"scale inference latency budget with queue throughput concurrency backpressure and cost",
				constraints: ["burst traffic"],
			},
			{
				summaryIncludes: ["Scalability Design identified", "scaling concern"],
				detailIncludes: [
					"Profile inference cost per request",
					"backpressure",
					"tail latency",
				],
				recommendationCountAtLeast: 2,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"eval-criteria",
			"tool-chain",
			"worked-example",
		]);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
