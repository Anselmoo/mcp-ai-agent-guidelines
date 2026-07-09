import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/orch/orch-agent-orchestrator.js";
import {
	createMockSkillRuntime,
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

	it("infers priority routing from urgency keywords alone", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "handle this urgent SLA-critical task across two agents",
			},
			{
				summaryIncludes: ["strategy: priority"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("falls back to capability routing when no strategy keywords or option are present", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "coordinate two agents to draft the onboarding checklist",
			},
			{
				summaryIncludes: ["strategy: capability"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("prefers the explicit options.agentCount over inferred mentions", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "coordinate three agents with load balancing",
				options: {
					agentCount: 5,
				},
			},
			{
				summaryIncludes: ["for 5 agents"],
				recommendationCountAtLeast: 2,
			},
		);
		expect(result.summary).toContain("for 5 agents");
	});

	it("counts literal mentions of the word agent when 4 or more appear", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"agent one hands off to agent two, agent three, agent four, and agent five in sequence",
			},
			{
				summaryIncludes: ["for 5 agents"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("caps the inferred agent count at 8 when mentions exceed the cap", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"agent one, agent two, agent three, agent four, agent five, agent six, agent seven, agent eight, agent nine, agent ten all report to the orchestrator",
			},
			{
				summaryIncludes: ["for 8 agents"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("infers three agents from the word form 'three'", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "coordinate three specialist agents on this migration",
			},
			{
				summaryIncludes: ["for 3 agents"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it.each([
		["two/pair keyword", "coordinate a pair of specialists on this migration"],
		[
			"bare default with no count signal",
			"coordinate the specialists on this migration",
		],
	])("infers 2 agents for %s", async (_label, request) => {
		await expectSkillGuidance(
			skillModule,
			{ request },
			{
				summaryIncludes: ["for 2 agents"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("uses singular 'agent' text in both the detail line and summary for a count of 1", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "coordinate the specialist on this migration",
				options: {
					agentCount: 1,
				},
			},
			{
				summaryIncludes: ["for 1 agent (strategy"],
				detailIncludes: ["Coordinate 1 agent around"],
				recommendationCountAtLeast: 2,
			},
		);
		expect(result.summary).not.toContain("1 agents");
	});

	it("applies stated constraints as routing constraints", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "coordinate agents to ship the release",
				constraints: ["Stay within budget", "No downtime during rollout"],
			},
			{
				detailIncludes: [
					"Apply the stated constraints as routing constraints, not guidelines: Stay within budget; No downtime during rollout.",
				],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("asks for more detail when the request has no extractable keywords and no context", async () => {
		const result = await skillModule.run(
			{ request: "is it" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain(
			"Agent Orchestrator needs the coordination goal, agent types, or routing strategy",
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("reports invalid input when the request field is missing entirely", async () => {
		const result = await skillModule.run(
			{} as unknown as Parameters<typeof skillModule.run>[0],
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});
});
