/**
 * Update Progress Tool
 *
 * Updates spec progress.md with completed tasks and recalculates metrics.
 * Provides direct MCP access to the ProgressTracker for AI agents.
 *
 * @module tools/update-progress
 */

import { promises as fs } from "node:fs";
import type { UpdateProgressRequest } from "../schemas/update-progress.js";
import {
	createProgressTracker,
	parseTasksFromMarkdown,
} from "../strategies/speckit/index.js";
import type { TaskProgressUpdate } from "../strategies/speckit/progress-tracker.js";
import type { Tasks } from "../strategies/speckit/types.js";
import type { McpResponse } from "./shared/error-handler.js";
import { createMcpResponse } from "./shared/response-utils.js";

/**
 * Update progress.md with completed tasks and recalculate metrics
 *
 * @param request - Update progress request with task IDs and options
 * @returns MCP response with updated progress.md content
 * @throws {Error} If task file cannot be read
 * @throws {Error} If progress file cannot be read
 *
 * @example
 * ```typescript
 * // Mark tasks complete
 * const result = await updateProgress({
 *   progressPath: "./progress.md",
 *   completedTaskIds: ["P4-001", "P4-002"],
 *   outputFormat: "markdown"
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With git sync
 * const result = await updateProgress({
 *   progressPath: "./progress.md",
 *   syncFromGit: true,
 *   gitOptions: { since: "2026-01-01" }
 * });
 * ```
 */
export async function updateProgress(
	request: UpdateProgressRequest,
): Promise<McpResponse> {
	// Load tasks if available
	let tasks: Tasks | undefined;
	if (request.tasksPath) {
		try {
			const tasksContent = await fs.readFile(request.tasksPath, "utf-8");
			tasks = parseTasksFromMarkdown(tasksContent);
		} catch (error) {
			throw new Error(
				`Failed to read tasks file: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// Create tracker
	const tracker = createProgressTracker(tasks);

	// Load existing progress if available
	if (request.progressContent) {
		tracker.loadProgress(request.progressContent);
	} else if (request.progressPath) {
		try {
			await tracker.loadProgressFromFile(request.progressPath);
		} catch (error) {
			// If file doesn't exist, that's okay - we'll create new progress
			// Only throw if it's a real read error (file exists but can't read)
			if (
				error instanceof Error &&
				!error.message.includes("ENOENT") &&
				!error.message.includes("no such file")
			) {
				throw new Error(`Failed to read progress file: ${error.message}`);
			}
		}
	}

	// Apply simple completions
	if (request.completedTaskIds && request.completedTaskIds.length > 0) {
		for (const taskId of request.completedTaskIds) {
			const update: TaskProgressUpdate = {
				taskId,
				status: "completed",
				timestamp: new Date().toISOString(),
			};
			tracker.updateProgress(update);
		}
	}

	// Apply detailed updates
	if (request.taskUpdates && request.taskUpdates.length > 0) {
		tracker.updateMultiple(
			request.taskUpdates.map((u) => ({
				taskId: u.taskId,
				status: u.status,
				notes: u.notes,
				timestamp: new Date().toISOString(),
			})),
		);
	}

	// Sync from git if requested
	let gitUpdates: TaskProgressUpdate[] = [];
	if (request.syncFromGit) {
		gitUpdates = tracker.syncFromGit(request.gitOptions ?? {});
	}

	// Calculate metrics
	const metrics = tracker.calculateCompletion();

	// Generate output
	let output: string;
	if (request.outputFormat === "json") {
		output = JSON.stringify(
			{
				metrics,
				gitUpdates: gitUpdates.length > 0 ? gitUpdates : undefined,
				progressMarkdown: tracker.generateProgressMarkdown(),
			},
			null,
			2,
		);
	} else {
		output = tracker.generateProgressMarkdown();
	}

	return createMcpResponse({
		content: output,
		metadata: {
			...metrics,
			gitUpdatesApplied: gitUpdates.length,
		},
	});
}
