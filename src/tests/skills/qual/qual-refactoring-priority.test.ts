import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qual/qual-refactoring-priority.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("qual-refactoring-priority", () => {
	it("ranks refactors by churn and complexity", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "prioritize refactoring using churn complexity and risk",
				deliverable: "roadmap",
			},
			{
				summaryIncludes: [
					"Refactoring Priority produced",
					"ranked prioritization factor",
				],
				detailIncludes: ["churn × complexity"],
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
			title: "Refactor ranking sheet",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
