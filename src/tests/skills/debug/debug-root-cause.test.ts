import { describe, it } from "vitest";
import { skillModule } from "../../../skills/debug/debug-root-cause.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("debug-root-cause", () => {
	it("switches to fishbone for multi-signal failures", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"timeouts started after dependency upgrade with stale cache config",
				options: {
					technique: "auto",
					maxDepth: 6,
				},
			},
			{
				summaryIncludes: ["Root Cause Analysis using fishbone", "depth: 6"],
				detailIncludes: [
					"state/concurrency, dependency/version, configuration/env",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
