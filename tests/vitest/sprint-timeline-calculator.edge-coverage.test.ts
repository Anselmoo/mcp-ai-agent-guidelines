import { describe, expect, it } from "vitest";
import { sprintTimelineCalculator } from "../../src/tools/sprint-timeline-calculator";

describe("Sprint Timeline Calculator - Additional Coverage", () => {
	it("should handle edge case: no risks (low risk scenario)", async () => {
		// Test scenario that should trigger the "risks.length === 0" path
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Small task 1",
					estimate: 1,
					priority: "low",
				},
				{
					name: "Small task 2",
					estimate: 2,
					priority: "low",
				},
			],
			teamSize: 5, // Medium team size (>= 3, <= 8, velocity won't be too high)
			sprintLength: 14,
			velocity: 50, // High velocity to keep utilization low
		});

		const text = result.content[0].text;
		expect(text).toContain(
			"Timeline appears achievable with current team configuration",
		);
		expect(text).toContain("Low"); // Should show low risk level
	});

	it("should handle edge case: high utilization recommendation", async () => {
		// Test scenario that should trigger utilization > 85% recommendation
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Large task 1",
					estimate: 20,
					priority: "high",
				},
				{
					name: "Large task 2",
					estimate: 25,
					priority: "high",
				},
			],
			teamSize: 2, // Small team
			sprintLength: 7, // Short sprint
			velocity: 20, // Low velocity to create high utilization
		});

		const text = result.content[0].text;
		// Should contain high utilization or team size risk
		expect(text).toContain("Risk Assessment");
		expect(text).toContain("Medium"); // Small team size should trigger this
	});

	it("should handle edge case: long timeline recommendation", async () => {
		// Test scenario that should trigger sprints > 6 recommendation
		const result = await sprintTimelineCalculator({
			tasks: Array.from({ length: 20 }, (_, i) => ({
				name: `Task ${i + 1}`,
				estimate: 5,
				priority: "medium",
			})),
			teamSize: 3,
			sprintLength: 7,
			velocity: 10, // Low velocity to create many sprints
		});

		const text = result.content[0].text;
		expect(text).toContain(
			"Long timeline detected - consider breaking into smaller releases",
		);
	});

	it("should handle edge case: large team recommendation", async () => {
		// Test scenario that should trigger teamSize > 8 recommendation
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Team task",
					estimate: 10,
					priority: "medium",
				},
			],
			teamSize: 10, // Large team > 8
			sprintLength: 14,
		});

		const text = result.content[0].text;
		expect(text).toContain(
			"Large team size - ensure clear communication channels and role definitions",
		);
	});

	it("should always include default recommendations", async () => {
		// Test that default recommendations are always included
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Simple task",
					estimate: 3,
					priority: "low",
				},
			],
			teamSize: 4,
			sprintLength: 14,
		});

		const text = result.content[0].text;
		expect(text).toContain(
			"Implement daily standups to track progress and identify blockers early",
		);
		expect(text).toContain(
			"Plan for 20% buffer time to handle unexpected issues",
		);
		expect(text).toContain(
			"Review and adjust velocity after each sprint based on actual completion",
		);
	});

	it("should handle tasks with dependencies risk assessment", async () => {
		// Test scenario that should trigger dependencies risk
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Task with dependencies",
					estimate: 5,
					priority: "high",
					dependencies: ["other-task", "another-dependency"],
				},
				{
					name: "Independent task",
					estimate: 3,
					priority: "medium",
				},
			],
			teamSize: 4,
			sprintLength: 14,
		});

		const text = result.content[0].text;
		expect(text).toContain(
			"Task dependencies may cause delays if not properly managed",
		);
		expect(text).toContain("Medium"); // Should have medium-level risk
	});

	it("should handle multiple risk factors simultaneously", async () => {
		// Test scenario that triggers multiple risk factors
		const result = await sprintTimelineCalculator({
			tasks: Array.from({ length: 15 }, (_, i) => ({
				name: `Complex task ${i + 1}`,
				estimate: 8,
				priority: "high",
				dependencies: i % 3 === 0 ? ["dep1", "dep2"] : undefined,
			})),
			teamSize: 2, // Small team (< 3)
			sprintLength: 7,
			velocity: 15, // This should create high utilization and large scope
		});

		const text = result.content[0].text;
		// Should contain multiple risk types
		expect(text).toContain("High"); // Over 90% utilization or large scope
		expect(text).toContain("Medium"); // Small team or dependencies
	});

	it("should handle minimal task list edge case", async () => {
		// Test with very minimal input
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Only task",
					estimate: 1,
				},
			],
			teamSize: 1,
			sprintLength: 14,
		});

		const text = result.content[0].text;
		expect(text).toContain("Sprint Summary");
		expect(text).toContain("Only task");
		// Should handle single task and single team member
	});
});
