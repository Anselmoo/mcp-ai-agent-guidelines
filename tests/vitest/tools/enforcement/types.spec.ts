import { describe, expect, it } from "vitest";
import type {
	DependencyIssue,
	PhaseProgress,
	ProgressValidationResult,
	TaskProgress,
	TaskStatus,
} from "../../../../src/tools/enforcement/types.js";

describe("enforcement types", () => {
	it("TaskProgress shape is correct", () => {
		const t: TaskProgress = { taskId: "T-001", status: "in-progress" };
		expect(t.taskId).toBe("T-001");
		expect(t.status).toBe("in-progress");
	});

	it("PhaseProgress shape is correct", () => {
		const p: PhaseProgress = {
			phaseId: "phase-1",
			phaseName: "Phase 1",
			totalTasks: 10,
			completedTasks: 5,
			blockedTasks: 0,
			progress: 50,
		};
		expect(p.progress).toBe(50);
	});

	it("ProgressValidationResult has required fields", () => {
		const r: ProgressValidationResult = {
			success: true,
			overallProgress: 100,
			phases: [],
			dependencyIssues: [],
			timestamp: new Date().toISOString(),
		};
		expect(r.success).toBe(true);
	});
});
