/**
 * Progress tracking service for Spec-Kit artifacts
 *
 * @module strategies/speckit/progress-tracker
 */

import { promises as fs } from "node:fs";
import type { ProgressMetrics, Tasks } from "./types.js";

/**
 * Status of a single task
 */
export interface TaskStatus {
	/** Task identifier */
	id: string;

	/** Whether the task is completed */
	completed: boolean;

	/** Timestamp when completed (ISO-8601) */
	completedAt?: string;

	/** Optional notes about the task status */
	notes?: string;
}

/**
 * Update for a task's progress
 */
export interface TaskProgressUpdate {
	/** Task identifier to update */
	taskId: string;

	/** New status for the task */
	status: "completed" | "in-progress" | "blocked";

	/** Optional notes about the update */
	notes?: string;

	/** Optional timestamp for the update (ISO-8601) */
	timestamp?: string;
}

/**
 * Service for tracking specification progress
 *
 * Manages task completion state and generates progress.md content.
 *
 * @example
 * ```typescript
 * const tracker = createProgressTracker(tasks);
 * tracker.updateProgress({ taskId: "TASK-001", status: "completed" });
 * const metrics = tracker.calculateCompletion();
 * const markdown = tracker.generateProgressMarkdown();
 * ```
 */
export class ProgressTracker {
	private taskStatuses: Map<string, TaskStatus> = new Map();

	constructor(private tasks?: Tasks) {
		this.initializeFromTasks();
	}

	private initializeFromTasks(): void {
		if (!this.tasks?.items) return;

		for (const task of this.tasks.items) {
			this.taskStatuses.set(task.id, {
				id: task.id,
				completed: false,
			});
		}
	}

	/**
	 * Load progress from existing progress.md content
	 *
	 * Parses markdown checkboxes to determine task completion status.
	 *
	 * @param content - The progress.md markdown content
	 *
	 * @example
	 * ```typescript
	 * const content = `
	 * ## Tasks
	 * - [x] **TASK-001**: Setup database
	 * - [ ] **TASK-002**: Create API
	 * `;
	 * tracker.loadProgress(content);
	 * ```
	 */
	loadProgress(content: string): void {
		// Parse progress.md format
		const completedPattern = /- \[x\] (.+)/gi;
		const matches = content.matchAll(completedPattern);

		for (const match of matches) {
			const taskRef = this.extractTaskId(match[1]);
			if (taskRef && this.taskStatuses.has(taskRef)) {
				const status = this.taskStatuses.get(taskRef);
				if (status) {
					status.completed = true;
					status.completedAt = new Date().toISOString();
				}
			}
		}
	}

	/**
	 * Load progress from file
	 *
	 * Reads and parses progress.md file from disk.
	 *
	 * @param path - Path to progress.md file
	 * @throws Error if file cannot be read
	 *
	 * @example
	 * ```typescript
	 * await tracker.loadProgressFromFile('./progress.md');
	 * ```
	 */
	async loadProgressFromFile(path: string): Promise<void> {
		const content = await fs.readFile(path, "utf-8");
		this.loadProgress(content);
	}

	/**
	 * Update progress for a specific task
	 *
	 * @param update - Progress update information
	 * @throws Error if task ID is unknown
	 *
	 * @example
	 * ```typescript
	 * tracker.updateProgress({
	 *   taskId: "TASK-001",
	 *   status: "completed",
	 *   notes: "All tests passing"
	 * });
	 * ```
	 */
	updateProgress(update: TaskProgressUpdate): void {
		const status = this.taskStatuses.get(update.taskId);
		if (!status) {
			throw new Error(`Unknown task: ${update.taskId}`);
		}

		status.completed = update.status === "completed";
		status.completedAt =
			update.status === "completed"
				? (update.timestamp ?? new Date().toISOString())
				: undefined;
		status.notes = update.notes;
	}

	/**
	 * Batch update multiple tasks
	 *
	 * @param updates - Array of progress updates
	 *
	 * @example
	 * ```typescript
	 * tracker.updateMultiple([
	 *   { taskId: "TASK-001", status: "completed" },
	 *   { taskId: "TASK-002", status: "in-progress" }
	 * ]);
	 * ```
	 */
	updateMultiple(updates: TaskProgressUpdate[]): void {
		for (const update of updates) {
			this.updateProgress(update);
		}
	}

	/**
	 * Calculate completion metrics
	 *
	 * @returns Metrics including total, completed, remaining, and percentage
	 *
	 * @example
	 * ```typescript
	 * const metrics = tracker.calculateCompletion();
	 * console.log(`Progress: ${metrics.percentComplete}%`);
	 * ```
	 */
	calculateCompletion(): ProgressMetrics {
		const total = this.taskStatuses.size;
		const completed = Array.from(this.taskStatuses.values()).filter(
			(s) => s.completed,
		).length;

		return {
			total,
			completed,
			remaining: total - completed,
			percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
		};
	}

	/**
	 * Generate progress.md content
	 *
	 * Creates formatted markdown with summary table and task checklist.
	 *
	 * @returns Markdown content for progress.md
	 *
	 * @example
	 * ```typescript
	 * const markdown = tracker.generateProgressMarkdown();
	 * await fs.writeFile('progress.md', markdown);
	 * ```
	 */
	generateProgressMarkdown(): string {
		const metrics = this.calculateCompletion();
		const lines: string[] = [];

		lines.push("# Progress\n");
		lines.push(`**Last Updated**: ${new Date().toISOString()}\n`);
		lines.push(`**Status**: ${this.getStatusIndicator(metrics)}\n\n`);

		lines.push("## Summary\n\n");
		lines.push("| Metric | Value |\n");
		lines.push("|--------|-------|\n");
		lines.push(`| Total Tasks | ${metrics.total} |\n`);
		lines.push(`| Completed | ${metrics.completed} |\n`);
		lines.push(`| Remaining | ${metrics.remaining} |\n`);
		lines.push(`| Progress | ${metrics.percentComplete}% |\n\n`);

		lines.push("## Tasks\n\n");
		for (const [id, status] of this.taskStatuses) {
			const checkbox = status.completed ? "[x]" : "[ ]";
			const taskInfo = this.tasks?.items?.find((t) => t.id === id);
			const title = taskInfo?.title ?? id;
			lines.push(`- ${checkbox} **${id}**: ${title}\n`);
			if (status.notes) {
				lines.push(`  - Note: ${status.notes}\n`);
			}
		}

		return lines.join("");
	}

	private getStatusIndicator(metrics: ProgressMetrics): string {
		if (metrics.percentComplete === 100) return "✅ Complete";
		if (metrics.percentComplete >= 75) return "🟢 On Track";
		if (metrics.percentComplete >= 50) return "🟡 In Progress";
		if (metrics.percentComplete >= 25) return "🟠 Early Stage";
		return "🔴 Starting";
	}

	private extractTaskId(text: string): string | null {
		const match = text.match(/\*\*([^*]+)\*\*/);
		return match ? match[1] : null;
	}
}

/**
 * Factory function to create a ProgressTracker instance
 *
 * @param tasks - Optional task collection to initialize with
 * @returns New ProgressTracker instance
 *
 * @example
 * ```typescript
 * const tracker = createProgressTracker(tasks);
 * ```
 */
export function createProgressTracker(tasks?: Tasks): ProgressTracker {
	return new ProgressTracker(tasks);
}
