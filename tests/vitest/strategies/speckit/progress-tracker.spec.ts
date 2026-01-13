/**
 * Tests for ProgressTracker
 *
 * @module tests/strategies/speckit/progress-tracker
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
	createProgressTracker,
	ProgressTracker,
	type TaskProgressUpdate,
	type TaskStatus,
} from "../../../../src/strategies/speckit/progress-tracker.js";
import type {
	DerivedTask,
	ProgressMetrics,
	Tasks,
} from "../../../../src/strategies/speckit/types.js";

// Sample tasks for testing
const SAMPLE_TASKS: Tasks = {
	items: [
		{
			id: "TASK-001",
			title: "Setup database schema",
			description: "Create initial database schema",
			priority: "high",
			estimate: "2 days",
			acceptanceCriteria: ["Schema created", "Migrations work"],
		},
		{
			id: "TASK-002",
			title: "Implement user authentication",
			description: "Add OAuth 2.0 support",
			priority: "high",
			estimate: "3 days",
			acceptanceCriteria: ["Login works", "Tokens are secure"],
		},
		{
			id: "TASK-003",
			title: "Create API endpoints",
			description: "Build RESTful API",
			priority: "medium",
			estimate: "5 days",
			acceptanceCriteria: ["CRUD operations", "Error handling"],
		},
	],
	metadata: {
		version: "1.0.0",
		createdAt: "2026-01-13T00:00:00Z",
	},
};

describe("ProgressTracker", () => {
	describe("constructor and factory", () => {
		it("should create tracker with constructor", () => {
			const tracker = new ProgressTracker(SAMPLE_TASKS);
			expect(tracker).toBeInstanceOf(ProgressTracker);
		});

		it("should create tracker with factory function", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			expect(tracker).toBeInstanceOf(ProgressTracker);
		});

		it("should initialize task statuses from tasks", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			const metrics = tracker.calculateCompletion();
			expect(metrics.total).toBe(3);
			expect(metrics.completed).toBe(0);
		});

		it("should handle empty tasks gracefully", () => {
			const tracker = createProgressTracker();
			const metrics = tracker.calculateCompletion();
			expect(metrics.total).toBe(0);
			expect(metrics.percentComplete).toBe(0);
		});

		it("should handle tasks without items", () => {
			const tracker = createProgressTracker({ items: [] });
			const metrics = tracker.calculateCompletion();
			expect(metrics.total).toBe(0);
		});
	});

	describe("loadProgress", () => {
		it("should parse completed tasks from markdown", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			const markdown = `
# Progress

## Tasks
- [x] **TASK-001**: Setup database schema
- [ ] **TASK-002**: Implement user authentication
- [x] **TASK-003**: Create API endpoints
`;
			tracker.loadProgress(markdown);
			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(2);
			expect(metrics.remaining).toBe(1);
		});

		it("should handle markdown without checkboxes", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			const markdown = "# Progress\n\nNo tasks here.";
			tracker.loadProgress(markdown);
			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(0);
		});

		it("should ignore unknown task IDs", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			const markdown = `
- [x] **UNKNOWN-TASK**: Unknown task
- [x] **TASK-001**: Setup database schema
`;
			tracker.loadProgress(markdown);
			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(1);
		});

		it("should handle malformed checkboxes", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			const markdown = `
- [x] TASK-001 (no bold markers)
- [x] **TASK-002**: Valid format
`;
			tracker.loadProgress(markdown);
			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(1); // Only TASK-002 should be parsed
		});
	});

	describe("updateProgress", () => {
		let tracker: ProgressTracker;

		beforeEach(() => {
			tracker = createProgressTracker(SAMPLE_TASKS);
		});

		it("should mark task as completed", () => {
			tracker.updateProgress({
				taskId: "TASK-001",
				status: "completed",
			});

			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(1);
		});

		it("should mark task as in-progress", () => {
			tracker.updateProgress({
				taskId: "TASK-001",
				status: "completed",
			});
			tracker.updateProgress({
				taskId: "TASK-001",
				status: "in-progress",
			});

			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(0);
		});

		it("should add notes to task", () => {
			tracker.updateProgress({
				taskId: "TASK-001",
				status: "completed",
				notes: "All tests passing",
			});

			const markdown = tracker.generateProgressMarkdown();
			expect(markdown).toContain("All tests passing");
		});

		it("should use custom timestamp", () => {
			const timestamp = "2026-01-13T12:00:00Z";
			tracker.updateProgress({
				taskId: "TASK-001",
				status: "completed",
				timestamp,
			});

			// We can't directly access the timestamp, but we verify it doesn't throw
			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(1);
		});

		it("should throw error for unknown task", () => {
			expect(() => {
				tracker.updateProgress({
					taskId: "UNKNOWN-TASK",
					status: "completed",
				});
			}).toThrow("Unknown task: UNKNOWN-TASK");
		});

		it("should handle blocked status", () => {
			tracker.updateProgress({
				taskId: "TASK-001",
				status: "blocked",
				notes: "Waiting for API access",
			});

			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(0);
		});
	});

	describe("updateMultiple", () => {
		it("should update multiple tasks", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			tracker.updateMultiple([
				{ taskId: "TASK-001", status: "completed" },
				{ taskId: "TASK-002", status: "completed" },
			]);

			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(2);
		});

		it("should handle empty update array", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			tracker.updateMultiple([]);

			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(0);
		});

		it("should stop on first error", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);

			expect(() => {
				tracker.updateMultiple([
					{ taskId: "TASK-001", status: "completed" },
					{ taskId: "UNKNOWN-TASK", status: "completed" },
					{ taskId: "TASK-003", status: "completed" },
				]);
			}).toThrow("Unknown task: UNKNOWN-TASK");

			// First task should be completed, third should not
			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(1);
		});
	});

	describe("calculateCompletion", () => {
		it("should calculate metrics for no tasks", () => {
			const tracker = createProgressTracker();
			const metrics = tracker.calculateCompletion();

			expect(metrics).toEqual({
				total: 0,
				completed: 0,
				remaining: 0,
				percentComplete: 0,
			});
		});

		it("should calculate metrics for partial completion", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });
			tracker.updateProgress({ taskId: "TASK-002", status: "completed" });

			const metrics = tracker.calculateCompletion();
			expect(metrics.total).toBe(3);
			expect(metrics.completed).toBe(2);
			expect(metrics.remaining).toBe(1);
			expect(metrics.percentComplete).toBe(67);
		});

		it("should calculate 100% for all completed", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			tracker.updateMultiple([
				{ taskId: "TASK-001", status: "completed" },
				{ taskId: "TASK-002", status: "completed" },
				{ taskId: "TASK-003", status: "completed" },
			]);

			const metrics = tracker.calculateCompletion();
			expect(metrics.percentComplete).toBe(100);
		});

		it("should round percentage correctly", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });

			const metrics = tracker.calculateCompletion();
			expect(metrics.percentComplete).toBe(33); // 1/3 = 33.33... rounded to 33
		});
	});

	describe("generateProgressMarkdown", () => {
		it("should generate valid markdown structure", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			const markdown = tracker.generateProgressMarkdown();

			expect(markdown).toContain("# Progress");
			expect(markdown).toContain("## Summary");
			expect(markdown).toContain("## Tasks");
			expect(markdown).toContain("Last Updated");
		});

		it("should include metrics table", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });
			const markdown = tracker.generateProgressMarkdown();

			expect(markdown).toContain("| Total Tasks | 3 |");
			expect(markdown).toContain("| Completed | 1 |");
			expect(markdown).toContain("| Remaining | 2 |");
			expect(markdown).toContain("| Progress | 33% |");
		});

		it("should include task checkboxes", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });
			const markdown = tracker.generateProgressMarkdown();

			expect(markdown).toContain("- [x] **TASK-001**: Setup database schema");
			expect(markdown).toContain(
				"- [ ] **TASK-002**: Implement user authentication",
			);
			expect(markdown).toContain("- [ ] **TASK-003**: Create API endpoints");
		});

		it("should include task notes", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);
			tracker.updateProgress({
				taskId: "TASK-001",
				status: "completed",
				notes: "Schema migration successful",
			});
			const markdown = tracker.generateProgressMarkdown();

			expect(markdown).toContain("Note: Schema migration successful");
		});

		it("should show correct status indicators", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);

			// Starting (0%)
			let markdown = tracker.generateProgressMarkdown();
			expect(markdown).toContain("**Status**: 🔴 Starting");

			// Early Stage (25-49%)
			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });
			markdown = tracker.generateProgressMarkdown();
			expect(markdown).toContain("**Status**: 🟠 Early Stage");

			// In Progress (50-74%)
			tracker.updateProgress({ taskId: "TASK-002", status: "completed" });
			markdown = tracker.generateProgressMarkdown();
			expect(markdown).toContain("**Status**: 🟡 In Progress");

			// Complete (100%)
			tracker.updateProgress({ taskId: "TASK-003", status: "completed" });
			markdown = tracker.generateProgressMarkdown();
			expect(markdown).toContain("**Status**: ✅ Complete");
		});

		it("should handle empty tasks", () => {
			const tracker = createProgressTracker();
			const markdown = tracker.generateProgressMarkdown();

			expect(markdown).toContain("| Total Tasks | 0 |");
			expect(markdown).toContain("| Progress | 0% |");
		});

		it("should handle tasks without titles", () => {
			const tasksWithoutTitles: Tasks = {
				items: [
					{
						id: "TASK-001",
						title: "",
						description: "Test",
						priority: "low",
						estimate: "1 day",
						acceptanceCriteria: [],
					},
				],
			};
			const tracker = createProgressTracker(tasksWithoutTitles);
			const markdown = tracker.generateProgressMarkdown();

			// Should fall back to ID when title is empty
			expect(markdown).toContain("**TASK-001**: ");
		});
	});

	describe("status indicator edge cases", () => {
		it("should show On Track for 75%", () => {
			const tasks: Tasks = {
				items: Array.from({ length: 4 }, (_, i) => ({
					id: `TASK-00${i + 1}`,
					title: `Task ${i + 1}`,
					description: "Test",
					priority: "low" as const,
					estimate: "1 day",
					acceptanceCriteria: [],
				})),
			};

			const tracker = createProgressTracker(tasks);
			tracker.updateMultiple([
				{ taskId: "TASK-001", status: "completed" },
				{ taskId: "TASK-002", status: "completed" },
				{ taskId: "TASK-003", status: "completed" },
			]);

			const markdown = tracker.generateProgressMarkdown();
			expect(markdown).toContain("**Status**: 🟢 On Track");
		});

		it("should show In Progress for 50%", () => {
			const tasks: Tasks = {
				items: Array.from({ length: 2 }, (_, i) => ({
					id: `TASK-00${i + 1}`,
					title: `Task ${i + 1}`,
					description: "Test",
					priority: "low" as const,
					estimate: "1 day",
					acceptanceCriteria: [],
				})),
			};

			const tracker = createProgressTracker(tasks);
			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });

			const markdown = tracker.generateProgressMarkdown();
			expect(markdown).toContain("**Status**: 🟡 In Progress");
		});
	});

	describe("integration scenarios", () => {
		it("should handle complete workflow", () => {
			// Create tracker
			const tracker = createProgressTracker(SAMPLE_TASKS);

			// Load existing progress
			const existingProgress = `
# Progress

## Tasks
- [x] **TASK-001**: Setup database schema
`;
			tracker.loadProgress(existingProgress);

			// Update more tasks
			tracker.updateMultiple([
				{ taskId: "TASK-002", status: "completed", notes: "OAuth working" },
				{
					taskId: "TASK-003",
					status: "in-progress",
					notes: "Endpoints in development",
				},
			]);

			// Generate final markdown
			const markdown = tracker.generateProgressMarkdown();
			expect(markdown).toContain("- [x] **TASK-001**");
			expect(markdown).toContain("- [x] **TASK-002**");
			expect(markdown).toContain("OAuth working");
			expect(markdown).toContain("Endpoints in development");

			// Verify metrics
			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(2);
			expect(metrics.percentComplete).toBe(67);
		});
	});
});
