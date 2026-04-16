import { describe, it } from "vitest";
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
});
