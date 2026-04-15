import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qual/qual-performance.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("qual-performance", () => {
	it("surfaces percentile-based performance guidance", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "review latency throughput backpressure and hot paths",
				deliverable: "perf review",
			},
			{
				summaryIncludes: [
					"Performance Review identified",
					"performance concern",
				],
				detailIncludes: ["p99 latency"],
				recommendationCountAtLeast: 1,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"eval-criteria",
			"worked-example",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Performance investigation brief",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
