import { describe, expect, it } from "vitest";
import { generateTasks } from "../../../../../src/domain/speckit/generators/tasks-generator.js";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";

describe("generateTasks", () => {
	it("should generate checklist tasks from requirements", () => {
		const state = createInitialSessionState({
			title: "Task Test",
			overview: "Overview",
			objectives: [{ description: "Obj", priority: "high" }],
			requirements: [
				{ description: "First req", type: "functional", priority: "high" },
				{ description: "Second req", type: "non-functional", priority: "low" },
			],
			acceptanceCriteria: [],
			outOfScope: [],
			validateAgainstConstitution: false,
		});

		const result = generateTasks(state);
		expect(result.title).toBe("tasks.md");
		expect(result.content).toContain("T-1");
		expect(result.content).toContain("T-2");
	});
});
