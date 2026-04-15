import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/debug/debug-assistant.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("debug-assistant", () => {
	it("triages flaky failures with missing stack traces", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "debug flaky timeout with missing stack trace and stale cache",
				options: {
					errorType: "flaky",
					hasStackTrace: false,
					constraints: "prod incident",
					artifacts: "logs, deploy diff",
				},
			},
			{
				summaryIncludes: [
					"Debugging Assistant triaged a flaky failure pattern",
				],
				detailIncludes: [
					"Never sleep — await a condition",
					"No stack trace available",
					"provided artifacts",
				],
				recommendationCountAtLeast: 5,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"tool-chain",
			"eval-criteria",
			"worked-example",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "output-template",
			title: "Flake triage brief",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
