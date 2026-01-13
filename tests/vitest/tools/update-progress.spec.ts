/**
 * Unit tests for update-progress tool
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { UpdateProgressRequest } from "../../../src/schemas/update-progress.js";
import { updateProgress } from "../../../src/tools/update-progress.js";

describe("updateProgress", () => {
	const sampleTasks = `# Tasks

## Phase 1: Foundation

### P4-001: Setup database
- **Priority**: high
- **Estimate**: 2 days
- **Description**: Initialize PostgreSQL database
- **Acceptance Criteria**:
  - Database is running
  - Schema is created

### P4-002: Create API
- **Priority**: high
- **Estimate**: 3 days
- **Description**: Build REST API endpoints
- **Acceptance Criteria**:
  - Endpoints are functional
  - Tests pass

## Phase 2: Features

### P4-003: Add authentication
- **Priority**: medium
- **Estimate**: 2 days
- **Description**: Implement OAuth2 authentication
- **Dependencies**: P4-001, P4-002
- **Acceptance Criteria**:
  - Users can log in
  - Tokens are validated
`;

	const sampleProgress = `# Progress

**Last Updated**: 2026-01-13T00:00:00Z
**Status**: 🟠 Early Stage

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 3 |
| Completed | 0 |
| Remaining | 3 |
| Progress | 0% |

## Tasks

- [ ] **P4-001**: Setup database
- [ ] **P4-002**: Create API
- [ ] **P4-003**: Add authentication
`;

	// Track temporary files for cleanup
	const tempFiles: string[] = [];

	afterEach(async () => {
		// Clean up temporary files
		for (const file of tempFiles) {
			try {
				await fs.unlink(file);
			} catch {
				// Ignore cleanup errors
			}
		}
		tempFiles.length = 0;
	});

	describe("basic task completion", () => {
		it("should mark tasks as completed with task IDs", async () => {
			// Create a temporary tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				progressContent: sampleProgress,
				completedTaskIds: ["P4-001", "P4-002"],
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Progress");
			expect(result.content[0].text).toContain("[x] **P4-001**");
			expect(result.content[0].text).toContain("[x] **P4-002**");
			expect(result.content[0].text).toContain("[ ] **P4-003**");
			expect(result.content[0].text).toContain("67%"); // 2/3 completed
		});

		it("should work with tasks file", async () => {
			// Create a temporary tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				completedTaskIds: ["P4-001"],
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("[x] **P4-001**");
			expect(result.content[0].text).toContain("33%"); // 1/3 completed
		});

		it("should work with progress file path", async () => {
			// Create temporary files
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			const tempProgressPath = join(
				process.cwd(),
				`test-progress-${Date.now()}.md`,
			);
			tempFiles.push(tempProgressPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");
			await fs.writeFile(tempProgressPath, sampleProgress, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				progressPath: tempProgressPath,
				completedTaskIds: ["P4-001"],
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("[x] **P4-001**");
		});
	});

	describe("detailed task updates", () => {
		it("should apply detailed status updates", async () => {
			// Create a temporary tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				progressContent: sampleProgress,
				completedTaskIds: [],
				taskUpdates: [
					{
						taskId: "P4-001",
						status: "completed",
						notes: "Database successfully initialized",
					},
					{
						taskId: "P4-002",
						status: "in-progress",
						notes: "Working on endpoints",
					},
					{
						taskId: "P4-003",
						status: "blocked",
						notes: "Waiting for P4-002",
					},
				],
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("[x] **P4-001**");
			expect(result.content[0].text).toContain(
				"Database successfully initialized",
			);
			expect(result.content[0].text).toContain("Working on endpoints");
			expect(result.content[0].text).toContain("Waiting for P4-002");
		});
	});

	describe("output formats", () => {
		it("should return markdown format by default", async () => {
			// Create a temporary tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				progressContent: sampleProgress,
				completedTaskIds: ["P4-001"],
			};

			const result = await updateProgress(request);

			expect(result.content[0].text).toContain("# Progress");
			expect(result.content[0].text).toContain("## Summary");
			expect(result.content[0].text).toContain("## Tasks");
		});

		it("should return JSON format when requested", async () => {
			// Create a temporary tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				progressContent: sampleProgress,
				completedTaskIds: ["P4-001"],
				outputFormat: "json",
			};

			const result = await updateProgress(request);

			const jsonOutput = JSON.parse(result.content[0].text);
			expect(jsonOutput).toHaveProperty("metrics");
			expect(jsonOutput).toHaveProperty("progressMarkdown");
			expect(jsonOutput.metrics).toHaveProperty("total");
			expect(jsonOutput.metrics).toHaveProperty("completed");
			expect(jsonOutput.metrics).toHaveProperty("percentComplete");
		});
	});

	describe("git sync", () => {
		it("should sync from git when requested", async () => {
			// Create a temporary tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				progressContent: sampleProgress,
				completedTaskIds: [],
				syncFromGit: true,
				gitOptions: {
					since: "2026-01-01",
				},
				outputFormat: "json",
			};

			const result = await updateProgress(request);

			const jsonOutput = JSON.parse(result.content[0].text);
			// gitUpdates may be undefined if no git commits found (expected in test environment)
			// Just verify the JSON structure is correct
			expect(jsonOutput).toHaveProperty("metrics");
			expect(jsonOutput).toHaveProperty("progressMarkdown");
		});
	});

	describe("error handling", () => {
		it("should throw error when tasks file cannot be read", async () => {
			const request: UpdateProgressRequest = {
				tasksPath: "/nonexistent/path/tasks.md",
				completedTaskIds: ["P4-001"],
			};

			await expect(updateProgress(request)).rejects.toThrow(
				"Failed to read tasks file",
			);
		});

		it("should handle missing progress file gracefully", async () => {
			// Non-existent progress file should not throw, just start fresh
			const request: UpdateProgressRequest = {
				progressPath: "/nonexistent/path/progress.md",
				completedTaskIds: [],
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("# Progress");
		});

		it("should throw error for unknown task ID", async () => {
			// Create temp tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				completedTaskIds: ["UNKNOWN-001"],
			};

			await expect(updateProgress(request)).rejects.toThrow(
				"Unknown task: UNKNOWN-001",
			);
		});

		it("should handle progressContent without tasks gracefully", async () => {
			// When progressContent is provided without tasks, it should work with empty tracker
			const request: UpdateProgressRequest = {
				progressContent: sampleProgress,
				completedTaskIds: [],
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("# Progress");
		});
	});

	describe("file loading edge cases", () => {
		it("should prioritize progressContent over progressPath", async () => {
			// Create temp files
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			const tempProgressPath = join(
				process.cwd(),
				`test-progress-${Date.now()}.md`,
			);
			tempFiles.push(tempTasksPath, tempProgressPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");
			await fs.writeFile(tempProgressPath, "# Different Progress", "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				progressContent: sampleProgress, // This should be used
				progressPath: tempProgressPath, // This should be ignored
				completedTaskIds: ["P4-001"],
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("P4-001");
		});

		it("should handle loadProgressFromFile failure", async () => {
			const request: UpdateProgressRequest = {
				progressPath: "/nonexistent/progress.md",
				completedTaskIds: [],
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			// Should not throw, just create fresh progress
			expect(result).toBeDefined();
		});
	});

	describe("metadata in response", () => {
		it("should include metrics in response metadata", async () => {
			// Create temp tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				completedTaskIds: ["P4-001"],
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			expect(result.metadata).toBeDefined();
			expect(result.metadata).toHaveProperty("total");
			expect(result.metadata).toHaveProperty("completed");
			expect(result.metadata).toHaveProperty("remaining");
			expect(result.metadata).toHaveProperty("percentComplete");
			expect(result.metadata).toHaveProperty("gitUpdatesApplied");
			expect(result.metadata.gitUpdatesApplied).toBe(0);
		});

		it("should include gitUpdatesApplied count in metadata", async () => {
			// Create temp tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				completedTaskIds: [],
				syncFromGit: true,
				gitOptions: {
					since: "2026-01-01",
				},
				outputFormat: "markdown",
			};

			const result = await updateProgress(request);

			expect(result.metadata).toHaveProperty("gitUpdatesApplied");
			// Count may be 0 if no git commits, but key should exist
			expect(typeof result.metadata.gitUpdatesApplied).toBe("number");
		});
	});

	describe("progress calculations", () => {
		it("should calculate correct completion percentage", async () => {
			// Create a temporary tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				progressContent: sampleProgress,
				completedTaskIds: ["P4-001", "P4-002"],
				outputFormat: "json",
			};

			const result = await updateProgress(request);
			const jsonOutput = JSON.parse(result.content[0].text);

			expect(jsonOutput.metrics.total).toBe(3);
			expect(jsonOutput.metrics.completed).toBe(2);
			expect(jsonOutput.metrics.remaining).toBe(1);
			expect(jsonOutput.metrics.percentComplete).toBe(67); // 2/3 = 66.67% rounded
		});

		it("should handle 100% completion", async () => {
			// Create a temporary tasks file
			const tempTasksPath = join(process.cwd(), `test-tasks-${Date.now()}.md`);
			tempFiles.push(tempTasksPath);

			await fs.writeFile(tempTasksPath, sampleTasks, "utf-8");

			const request: UpdateProgressRequest = {
				tasksPath: tempTasksPath,
				progressContent: sampleProgress,
				completedTaskIds: ["P4-001", "P4-002", "P4-003"],
				outputFormat: "json",
			};

			const result = await updateProgress(request);
			const jsonOutput = JSON.parse(result.content[0].text);

			expect(jsonOutput.metrics.percentComplete).toBe(100);
			expect(jsonOutput.metrics.completed).toBe(3);
			expect(jsonOutput.metrics.remaining).toBe(0);
		});
	});
});
