import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/debug/debug-postmortem.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("debug-postmortem", () => {
	it("produces critical-incident postmortem structure", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "postmortem for outage after deploy",
				options: {
					incidentSeverity: "critical",
					hasTimeline: false,
					includeActionItems: true,
				},
			},
			{
				summaryIncludes: ["Incident Postmortem generated", "critical incident"],
				detailIncludes: [
					"No timeline provided",
					"Write action items as specific, measurable tasks",
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
			title: "Incident postmortem template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
