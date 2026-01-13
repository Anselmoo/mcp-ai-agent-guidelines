/**
 * Tests for ProgressTracker Git Integration
 *
 * @module tests/strategies/speckit/progress-tracker-git
 */

import { execSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createProgressTracker,
	type GitCommit,
	type ProgressTracker,
} from "../../../../src/strategies/speckit/progress-tracker.js";
import type { Tasks } from "../../../../src/strategies/speckit/types.js";

// Mock child_process module
vi.mock("node:child_process", () => ({
	execSync: vi.fn(),
}));

// Sample tasks for testing
const SAMPLE_TASKS: Tasks = {
	items: [
		{
			id: "P4-001",
			title: "Setup infrastructure",
			description: "Configure cloud infrastructure",
			priority: "high",
			estimate: "2 days",
			acceptanceCriteria: ["Infrastructure deployed"],
		},
		{
			id: "P4-002",
			title: "Implement API",
			description: "Build REST API endpoints",
			priority: "high",
			estimate: "3 days",
			acceptanceCriteria: ["API functional"],
		},
		{
			id: "TASK-123",
			title: "Write tests",
			description: "Add unit tests",
			priority: "medium",
			estimate: "1 day",
			acceptanceCriteria: ["Tests passing"],
		},
	],
};

describe("ProgressTracker Git Integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("extractTaskReferences", () => {
		let tracker: ProgressTracker;

		beforeEach(() => {
			tracker = createProgressTracker(SAMPLE_TASKS);
		});

		it("should parse closes pattern", () => {
			// Access private method through any cast for testing
			const refs = (tracker as any).extractTaskReferences("closes #P4-001");
			expect(refs).toContainEqual({ taskId: "P4-001", action: "close" });
		});

		it("should parse closes without hash", () => {
			const refs = (tracker as any).extractTaskReferences("closes P4-001");
			expect(refs).toContainEqual({ taskId: "P4-001", action: "close" });
		});

		it("should parse fixes pattern", () => {
			const refs = (tracker as any).extractTaskReferences("fixes P4-002");
			expect(refs).toContainEqual({ taskId: "P4-002", action: "fix" });
		});

		it("should parse resolves pattern", () => {
			const refs = (tracker as any).extractTaskReferences("resolves P4-001");
			expect(refs).toContainEqual({ taskId: "P4-001", action: "resolve" });
		});

		it("should parse completes pattern", () => {
			const refs = (tracker as any).extractTaskReferences("completes P4-002");
			expect(refs).toContainEqual({ taskId: "P4-002", action: "complete" });
		});

		it("should handle plural forms", () => {
			const refs = (tracker as any).extractTaskReferences("Closes P4-001");
			expect(refs).toContainEqual({ taskId: "P4-001", action: "close" });
		});

		it("should handle multiple references", () => {
			const refs = (tracker as any).extractTaskReferences(
				"closes P4-001, fixes P4-002",
			);
			expect(refs).toHaveLength(2);
			expect(refs).toContainEqual({ taskId: "P4-001", action: "close" });
			expect(refs).toContainEqual({ taskId: "P4-002", action: "fix" });
		});

		it("should extract standalone task IDs", () => {
			const refs = (tracker as any).extractTaskReferences(
				"Working on TASK-123 implementation",
			);
			expect(refs).toContainEqual({ taskId: "TASK-123", action: "mention" });
		});

		it("should not duplicate task IDs", () => {
			const refs = (tracker as any).extractTaskReferences(
				"closes P4-001 for P4-001",
			);
			// Should have one close and not duplicate the mention
			expect(refs.filter((r) => r.taskId === "P4-001")).toHaveLength(1);
		});

		it("should support custom pattern", () => {
			const customPattern = /implements\s+(\S+)/gi;
			const refs = (tracker as any).extractTaskReferences(
				"implements CUSTOM-001",
				customPattern,
			);
			expect(refs).toContainEqual({
				taskId: "CUSTOM-001",
				action: "implement",
			});
		});

		it("should handle empty message", () => {
			const refs = (tracker as any).extractTaskReferences("");
			expect(refs).toEqual([]);
		});

		it("should handle message with no task references", () => {
			const refs = (tracker as any).extractTaskReferences(
				"Regular commit message",
			);
			expect(refs).toEqual([]);
		});
	});

	describe("fetchCommits", () => {
		let tracker: ProgressTracker;

		beforeEach(() => {
			tracker = createProgressTracker(SAMPLE_TASKS);
		});

		it("should fetch commits from git", () => {
			const mockOutput = [
				"abc123|closes P4-001|2026-01-13T10:00:00Z|John Doe",
				"def456|fixes P4-002|2026-01-13T11:00:00Z|Jane Smith",
			].join("\n");

			vi.mocked(execSync).mockReturnValue(mockOutput);

			const commits = (tracker as any).fetchCommits({});

			expect(commits).toHaveLength(2);
			expect(commits[0]).toEqual({
				hash: "abc123",
				message: "closes P4-001",
				date: "2026-01-13T10:00:00Z",
				author: "John Doe",
			});
			expect(commits[1]).toEqual({
				hash: "def456",
				message: "fixes P4-002",
				date: "2026-01-13T11:00:00Z",
				author: "Jane Smith",
			});
		});

		it("should use default branch HEAD", () => {
			vi.mocked(execSync).mockReturnValue("");

			(tracker as any).fetchCommits({});

			expect(execSync).toHaveBeenCalledWith(
				expect.stringContaining("git log HEAD"),
				expect.any(Object),
			);
		});

		it("should use custom branch", () => {
			vi.mocked(execSync).mockReturnValue("");

			(tracker as any).fetchCommits({ branch: "main" });

			expect(execSync).toHaveBeenCalledWith(
				expect.stringContaining("git log main"),
				expect.any(Object),
			);
		});

		it("should use since parameter", () => {
			vi.mocked(execSync).mockReturnValue("");

			(tracker as any).fetchCommits({ since: "2026-01-01" });

			expect(execSync).toHaveBeenCalledWith(
				expect.stringContaining('--since="2026-01-01"'),
				expect.any(Object),
			);
		});

		it("should use custom repoPath", () => {
			vi.mocked(execSync).mockReturnValue("");

			(tracker as any).fetchCommits({ repoPath: "/custom/path" });

			expect(execSync).toHaveBeenCalledWith(expect.any(String), {
				cwd: "/custom/path",
				encoding: "utf-8",
			});
		});

		it("should handle empty git output", () => {
			vi.mocked(execSync).mockReturnValue("");

			const commits = (tracker as any).fetchCommits({});

			expect(commits).toEqual([]);
		});

		it("should handle git errors gracefully", () => {
			vi.mocked(execSync).mockImplementation(() => {
				throw new Error("fatal: not a git repository");
			});

			const commits = (tracker as any).fetchCommits({});

			expect(commits).toEqual([]);
		});

		it("should filter empty lines", () => {
			const mockOutput = [
				"abc123|closes P4-001|2026-01-13T10:00:00Z|John Doe",
				"",
				"def456|fixes P4-002|2026-01-13T11:00:00Z|Jane Smith",
			].join("\n");

			vi.mocked(execSync).mockReturnValue(mockOutput);

			const commits = (tracker as any).fetchCommits({});

			expect(commits).toHaveLength(2);
		});
	});

	describe("syncFromGit", () => {
		let tracker: ProgressTracker;

		beforeEach(() => {
			tracker = createProgressTracker(SAMPLE_TASKS);
		});

		it("should update progress from commits", () => {
			const mockOutput = [
				"abc123|closes P4-001|2026-01-13T10:00:00Z|John Doe",
				"def456|fixes P4-002|2026-01-13T11:00:00Z|Jane Smith",
			].join("\n");

			vi.mocked(execSync).mockReturnValue(mockOutput);

			const updates = tracker.syncFromGit({});

			expect(updates).toHaveLength(2);
			expect(updates[0]).toMatchObject({
				taskId: "P4-001",
				status: "completed",
			});
			expect(updates[1]).toMatchObject({
				taskId: "P4-002",
				status: "completed",
			});

			// Verify tasks were updated
			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(2);
		});

		it("should mark tasks as in-progress for mentions", () => {
			const mockOutput =
				"abc123|Working on TASK-123|2026-01-13T10:00:00Z|John Doe";

			vi.mocked(execSync).mockReturnValue(mockOutput);

			const updates = tracker.syncFromGit({});

			expect(updates).toHaveLength(1);
			expect(updates[0]).toMatchObject({
				taskId: "TASK-123",
				status: "in-progress",
			});
		});

		it("should add commit reference in notes", () => {
			const mockOutput =
				"abc1234567|closes P4-001|2026-01-13T10:00:00Z|John Doe";

			vi.mocked(execSync).mockReturnValue(mockOutput);

			const updates = tracker.syncFromGit({});

			expect(updates[0].notes).toContain("abc1234");
			expect(updates[0].notes).toContain("commit");
		});

		it("should use commit timestamp", () => {
			const mockOutput = "abc123|closes P4-001|2026-01-13T10:00:00Z|John Doe";

			vi.mocked(execSync).mockReturnValue(mockOutput);

			const updates = tracker.syncFromGit({});

			expect(updates[0].timestamp).toBe("2026-01-13T10:00:00Z");
		});

		it("should ignore unknown task IDs", () => {
			const mockOutput =
				"abc123|closes UNKNOWN-999|2026-01-13T10:00:00Z|John Doe";

			vi.mocked(execSync).mockReturnValue(mockOutput);

			const updates = tracker.syncFromGit({});

			expect(updates).toEqual([]);
		});

		it("should handle no git gracefully", () => {
			vi.mocked(execSync).mockImplementation(() => {
				throw new Error("git not found");
			});

			const updates = tracker.syncFromGit({ repoPath: "/nonexistent" });

			expect(updates).toEqual([]);
		});

		it("should support custom task ID pattern", () => {
			const mockOutput =
				"abc123|implements CUSTOM-001|2026-01-13T10:00:00Z|John";

			vi.mocked(execSync).mockReturnValue(mockOutput);

			// Add a custom task
			const customTasks: Tasks = {
				items: [
					{
						id: "CUSTOM-001",
						title: "Custom task",
						description: "Test",
						priority: "low",
						estimate: "1 day",
						acceptanceCriteria: [],
					},
				],
			};

			const customTracker = createProgressTracker(customTasks);
			const updates = customTracker.syncFromGit({
				taskIdPattern: /implements\s+(\S+)/gi,
			});

			expect(updates).toHaveLength(1);
			expect(updates[0].taskId).toBe("CUSTOM-001");
		});

		it("should handle multiple commits with same task", () => {
			const mockOutput = [
				"abc123|Working on P4-001|2026-01-13T10:00:00Z|John",
				"def456|closes P4-001|2026-01-13T11:00:00Z|John",
			].join("\n");

			vi.mocked(execSync).mockReturnValue(mockOutput);

			const updates = tracker.syncFromGit({});

			// Should have 2 updates, last one wins
			expect(updates).toHaveLength(2);
			expect(updates[1].status).toBe("completed");

			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(1);
		});
	});

	describe("watchAndSync", () => {
		let tracker: ProgressTracker;

		beforeEach(() => {
			tracker = createProgressTracker(SAMPLE_TASKS);
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should watch and sync periodically", async () => {
			const mockOutput = "abc123|closes P4-001|2026-01-13T10:00:00Z|John Doe";
			vi.mocked(execSync).mockReturnValue(mockOutput);

			const stopWatching = await tracker.watchAndSync({ intervalMs: 1000 });

			// Fast-forward time
			vi.advanceTimersByTime(1000);

			// Should have synced once
			expect(execSync).toHaveBeenCalled();

			// Stop watching
			stopWatching();

			// Clear mock calls
			vi.mocked(execSync).mockClear();

			// Fast-forward time again
			vi.advanceTimersByTime(1000);

			// Should not sync after stopping
			expect(execSync).not.toHaveBeenCalled();
		});

		it("should use default interval of 60 seconds", async () => {
			vi.mocked(execSync).mockReturnValue("");

			const stopWatching = await tracker.watchAndSync({});

			// Fast-forward to just before interval
			vi.advanceTimersByTime(59000);
			expect(execSync).not.toHaveBeenCalled();

			// Fast-forward past interval
			vi.advanceTimersByTime(1000);
			expect(execSync).toHaveBeenCalled();

			stopWatching();
		});

		it("should update lastSync timestamp", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const mockOutput = "abc123|closes P4-001|2026-01-13T10:00:00Z|John Doe";
			vi.mocked(execSync).mockReturnValue(mockOutput);

			const stopWatching = await tracker.watchAndSync({ intervalMs: 1000 });

			// First sync
			vi.advanceTimersByTime(1000);

			// Verify since parameter is used
			const firstCall = vi.mocked(execSync).mock.calls[0][0];
			expect(firstCall).toContain("--since=");

			// Clear and advance again
			vi.mocked(execSync).mockClear();
			vi.mocked(execSync).mockReturnValue("");

			vi.advanceTimersByTime(1000);

			// Second call should have updated since timestamp
			const secondCall = vi.mocked(execSync).mock.calls[0][0];
			expect(secondCall).toContain("--since=");

			stopWatching();
			consoleSpy.mockRestore();
		});

		it("should log progress updates", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const mockOutput = "abc123|closes P4-001|2026-01-13T10:00:00Z|John Doe";
			vi.mocked(execSync).mockReturnValue(mockOutput);

			const stopWatching = await tracker.watchAndSync({ intervalMs: 1000 });

			vi.advanceTimersByTime(1000);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("Progress updated: 1 tasks"),
			);

			stopWatching();
			consoleSpy.mockRestore();
		});

		it("should not log when no updates", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			vi.mocked(execSync).mockReturnValue("");

			const stopWatching = await tracker.watchAndSync({ intervalMs: 1000 });

			vi.advanceTimersByTime(1000);

			expect(consoleSpy).not.toHaveBeenCalled();

			stopWatching();
			consoleSpy.mockRestore();
		});
	});

	describe("integration scenarios", () => {
		it("should handle complete git workflow", () => {
			const tracker = createProgressTracker(SAMPLE_TASKS);

			// Simulate git commits
			const mockOutput = [
				"abc123|Working on P4-001|2026-01-13T09:00:00Z|John Doe",
				"def456|fixes P4-002|2026-01-13T10:00:00Z|Jane Smith",
				"ghi789|closes P4-001|2026-01-13T11:00:00Z|John Doe",
			].join("\n");

			vi.mocked(execSync).mockReturnValue(mockOutput);

			// Sync from git
			const updates = tracker.syncFromGit({ since: "2026-01-13" });

			// Verify updates
			expect(updates).toHaveLength(3);

			// Verify final state
			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(2); // P4-001 and P4-002

			// Generate markdown
			const markdown = tracker.generateProgressMarkdown();
			expect(markdown).toContain("- [x] **P4-001**");
			expect(markdown).toContain("- [x] **P4-002**");
			expect(markdown).toContain("via commit");
		});
	});
});
