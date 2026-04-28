import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/orch/orch-agent-orchestrator.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("orch-agent-orchestrator", () => {
	it("configures broadcast agent coordination", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"coordinate planner executor reviewer agents with parallel subtasks and final deliverable",
				deliverable: "release plan",
				options: {
					routingStrategy: "broadcast",
				},
			},
			{
				summaryIncludes: ["Agent Orchestrator planned", "strategy: broadcast"],
				detailIncludes: [
					"using broadcast routing",
					"control loop between every agent handoff",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("infers load-balanced routing and agent count from the request text", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"coordinate three agents with load balancing across parallel subtasks",
				deliverable: "final synthesis report",
				successCriteria: "all outputs are validated before merge",
				options: {
					includeControlLoop: false,
				},
			},
			{
				summaryIncludes: ["strategy: load-balanced"],
				recommendationCountAtLeast: 3,
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).toContain("success criteria");
		expect(detailText).not.toContain("control loop");
	});
});
