import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qual/qual-code-analysis.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("qual-code-analysis", () => {
	it("maps structural code-analysis findings", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "analyze code complexity coupling and cohesion",
				context: "focus on runtime bootstrap and shared skill helpers",
				deliverable: "review memo",
			},
			{
				summaryIncludes: ["Code Analysis identified", "structural finding"],
				detailIncludes: ["Map module coupling"],
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
			title: "Structural hotspot scorecard",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
