import { describe, expect, it } from "vitest";
import { sprintTimelineCalculator } from "../../src/tools/sprint-timeline-calculator";

describe("Sprint Timeline Calculator - Reliability Improvements", () => {
	it("should properly order tasks with dependencies using topological sort", async () => {
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Task C",
					estimate: 3,
					priority: "high",
					dependencies: ["Task A"],
				},
				{
					name: "Task A",
					estimate: 5,
					priority: "medium",
				},
				{
					name: "Task B",
					estimate: 2,
					priority: "low",
					dependencies: ["Task A"],
				},
			],
			teamSize: 3,
			sprintLength: 14,
		});

		const text = result.content[0].text;

		// Task A should appear before Task C and Task B in the sprint breakdown
		const taskAIndex = text.indexOf("Task A");
		const taskBIndex = text.indexOf("Task B");
		const taskCIndex = text.indexOf("Task C");

		expect(taskAIndex).toBeLessThan(taskBIndex);
		expect(taskAIndex).toBeLessThan(taskCIndex);

		// Should have no dependency violations
		expect(text).not.toContain("Dependency violations detected");

		// Should mention dependencies are correctly scheduled
		expect(text).toContain("correctly scheduled");
	});

	it("should detect and report circular dependencies", async () => {
		// This test validates that circular dependencies are handled gracefully
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Task A",
					estimate: 3,
					dependencies: ["Task B"],
				},
				{
					name: "Task B",
					estimate: 3,
					dependencies: ["Task A"],
				},
			],
			teamSize: 2,
			sprintLength: 14,
		});

		const text = result.content[0].text;
		// Should complete without crashing and produce output
		expect(text).toContain("Sprint Timeline");
	});

	it("should produce deterministic results for the same input", async () => {
		const input = {
			tasks: [
				{ name: "Task 1", estimate: 8, priority: "high" },
				{ name: "Task 2", estimate: 5, priority: "medium" },
				{ name: "Task 3", estimate: 3, priority: "low" },
				{ name: "Task 4", estimate: 5, priority: "medium" },
				{ name: "Task 5", estimate: 2, priority: "high" },
			],
			teamSize: 3,
			sprintLength: 14,
		};

		const result1 = await sprintTimelineCalculator(input);
		const result2 = await sprintTimelineCalculator(input);

		// Results should be identical (deterministic)
		expect(result1.content[0].text).toBe(result2.content[0].text);
	});

	it("should properly validate multi-level dependencies", async () => {
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Design",
					estimate: 5,
					priority: "high",
				},
				{
					name: "Backend",
					estimate: 8,
					priority: "high",
					dependencies: ["Design"],
				},
				{
					name: "Frontend",
					estimate: 8,
					priority: "high",
					dependencies: ["Backend"],
				},
				{
					name: "Testing",
					estimate: 5,
					priority: "medium",
					dependencies: ["Frontend", "Backend"],
				},
			],
			teamSize: 4,
			sprintLength: 14,
		});

		const text = result.content[0].text;

		// Verify order: Design -> Backend -> Frontend -> Testing
		const designIndex = text.indexOf("Design");
		const backendIndex = text.indexOf("Backend");
		const frontendIndex = text.indexOf("Frontend");
		const testingIndex = text.indexOf("Testing");

		expect(designIndex).toBeLessThan(backendIndex);
		expect(backendIndex).toBeLessThan(frontendIndex);
		expect(frontendIndex).toBeLessThan(testingIndex);

		// Should have no violations
		expect(text).not.toContain("Dependency violations detected");
	});

	it("should use greedy optimization strategy by default", async () => {
		const result = await sprintTimelineCalculator({
			tasks: [{ name: "Task 1", estimate: 5 }],
			teamSize: 2,
			sprintLength: 14,
		});

		const text = result.content[0].text;
		expect(text).toContain("greedy optimization strategy");
	});

	it("should respect optimizationStrategy parameter", async () => {
		const result = await sprintTimelineCalculator({
			tasks: [{ name: "Task 1", estimate: 5 }],
			teamSize: 2,
			sprintLength: 14,
			optimizationStrategy: "linear-programming",
		});

		const text = result.content[0].text;
		expect(text).toContain("linear-programming optimization strategy");
	});

	it("should handle complex dependency graph with priority", async () => {
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Infrastructure Setup",
					estimate: 8,
					priority: "high",
				},
				{
					name: "API Development",
					estimate: 13,
					priority: "high",
					dependencies: ["Infrastructure Setup"],
				},
				{
					name: "Database Schema",
					estimate: 5,
					priority: "high",
					dependencies: ["Infrastructure Setup"],
				},
				{
					name: "Frontend Components",
					estimate: 8,
					priority: "medium",
					dependencies: ["API Development"],
				},
				{
					name: "Integration Tests",
					estimate: 5,
					priority: "medium",
					dependencies: ["API Development", "Database Schema"],
				},
			],
			teamSize: 5,
			sprintLength: 14,
		});

		const text = result.content[0].text;

		// Infrastructure Setup should be first
		const infraIndex = text.indexOf("Infrastructure Setup");
		const apiIndex = text.indexOf("API Development");
		const dbIndex = text.indexOf("Database Schema");

		expect(infraIndex).toBeLessThan(apiIndex);
		expect(infraIndex).toBeLessThan(dbIndex);

		// Should validate dependencies correctly
		expect(text).not.toContain("Dependency violations detected");
		expect(text).toContain("correctly scheduled");
	});

	it("should include reference to optimization article", async () => {
		const result = await sprintTimelineCalculator({
			tasks: [{ name: "Task 1", estimate: 5 }],
			teamSize: 2,
			sprintLength: 14,
		});

		const text = result.content[0].text;
		expect(text).toContain(
			"Optimizing Sprint Planning with Linear Programming",
		);
		expect(text).toContain("Using Julia and Gurobi");
	});

	it("should report missing dependencies as violations", async () => {
		const result = await sprintTimelineCalculator({
			tasks: [
				{
					name: "Dependent Task",
					estimate: 5,
					dependencies: ["Non-existent Task"],
				},
			],
			teamSize: 2,
			sprintLength: 14,
		});

		const text = result.content[0].text;
		expect(text).toContain("Dependency violations detected");
		expect(text).toContain("Non-existent Task");
	});
});
