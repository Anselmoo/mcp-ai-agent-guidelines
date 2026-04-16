import { describe, it } from "vitest";
import { skillModule } from "../../../skills/req/req-analysis.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("req-analysis", () => {
	it("maps constraints and caps requirement count", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "analyze requirements for workflow audit export",
				context: "existing spec and benchmark",
				deliverable: "requirements doc",
				constraints: ["must be deterministic"],
				options: {
					includeConstraintMapping: true,
					maxRequirements: 4,
				},
			},
			{
				summaryIncludes: ["Requirements Analysis produced", "constraints: 1"],
				detailIncludes: [
					"Constraint mapping: must be deterministic.",
					"Limit to at most 4 high-priority requirements",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
