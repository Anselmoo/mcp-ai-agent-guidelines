import { describe, it } from "vitest";
import { skillModule } from "../../../skills/arch/arch-security.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("arch-security", () => {
	it("identifies trust-boundary and prompt-injection controls", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "secure agent workflow prompt inputs and secrets",
				constraints: ["zero trust"],
			},
			{
				summaryIncludes: ["Security Design identified", "risk control"],
				detailIncludes: [
					"least-privilege boundaries",
					"Separate trusted instructions from untrusted user or resource content",
				],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
