import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/debug/debug-reproduction.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("debug-reproduction", () => {
	it("plans a deterministic staging reproduction", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "reproduce stale cache race in staging with instrumentation",
				options: {
					targetEnvironment: "staging",
					hasExistingTest: true,
				},
			},
			{
				summaryIncludes: [
					"Reproduction Planner produced",
					"staging reproduction",
					"existing test: true",
				],
				detailIncludes: ["minimal input set", "Existing test available"],
				recommendationCountAtLeast: 4,
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
			title: "Minimal reproduction plan",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
