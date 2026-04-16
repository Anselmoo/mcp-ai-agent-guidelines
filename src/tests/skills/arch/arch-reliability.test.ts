import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/arch/arch-reliability.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("arch-reliability", () => {
	it("recommends retries and isolation boundaries", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"design reliable workflow with retries idempotent queue workers duplicate delivery and failure isolation",
				constraints: ["99.9% uptime"],
			},
			{
				summaryIncludes: [
					"Reliability Design identified",
					"reliability concern",
				],
				detailIncludes: [
					"retry logic with exponential backoff and jitter",
					"quality gate",
					"idempotent",
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
