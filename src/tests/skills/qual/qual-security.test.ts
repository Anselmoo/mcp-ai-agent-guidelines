import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qual/qual-security.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("qual-security", () => {
	it("highlights authentication and data-protection review", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "review auth input validation secrets and permissions",
				deliverable: "security review",
			},
			{
				summaryIncludes: ["Security Review identified", "security finding"],
				detailIncludes: ["authentication and session management"],
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
			title: "Security review packet template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
