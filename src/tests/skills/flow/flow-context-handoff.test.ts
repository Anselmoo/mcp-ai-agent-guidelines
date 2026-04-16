import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/flow/flow-context-handoff.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("flow-context-handoff", () => {
	it("produces structured handoff safeguards", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "handoff workflow context and artifacts between agents",
				context:
					"The research phase is complete and implementation starts next.",
				options: {
					handoffStyle: "structured",
					maxContextItems: 4,
					includeValidation: true,
				},
			},
			{
				summaryIncludes: ["Context Handoff prepared", "style: structured"],
				detailIncludes: [
					"no more than 4 must-carry items",
					"structured handoff template",
					"handoff validation check",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Context resume packet template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
