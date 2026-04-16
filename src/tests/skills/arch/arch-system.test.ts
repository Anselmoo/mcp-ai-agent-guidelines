import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/arch/arch-system.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("arch-system", () => {
	it("defines system boundaries for agent workflows", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "design AI-native platform with modular architecture",
				context: "current architecture notes",
				constraints: ["modular architecture"],
			},
			{
				summaryIncludes: ["System Design identified", "architectural concern"],
				detailIncludes: ["primary trust model", "five AI-native layers"],
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
