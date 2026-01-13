/**
 * Progress tracking service for Spec-Kit artifacts
 *
 * @module strategies/speckit/progress-tracker
 */

import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { logger } from "../../tools/shared/logger.js";
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
 * Git commit information
 */
export interface GitCommit {
	/** Commit hash */
	hash: string;

	/** Commit message */
	message: string;

	/** Commit date (ISO-8601) */
	date: string;

	/** Commit author */
	author: string;
}

/**
 * Options for syncing progress from git
 */
export interface GitSyncOptions {
	/** Path to git repository (defaults to current directory) */
	repoPath?: string;

	/** Branch to scan (defaults to HEAD) */
	branch?: string;

	/** Only scan commits since this date/time (ISO-8601) */
	since?: string;

	/** Custom pattern for task ID extraction */
	taskIdPattern?: RegExp;
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

	/**
	 * Sync progress from git commit history
	 *
	 * Scans git commit messages for task references and automatically updates
	 * task status based on commit keywords like "closes", "fixes", etc.
	 *
	 * @param options - Options for git sync
	 * @returns Array of progress updates that were applied
	 *
	 * @example
	 * ```typescript
	 * const updates = tracker.syncFromGit({
	 *   since: "2026-01-01",
	 *   branch: "main"
	 * });
	 * console.log(`Updated ${updates.length} tasks from git history`);
	 * ```
	 */
	syncFromGit(options: GitSyncOptions = {}): TaskProgressUpdate[] {
		const commits = this.fetchCommits(options);
		const updates: TaskProgressUpdate[] = [];

		for (const commit of commits) {
			const taskRefs = this.extractTaskReferences(
				commit.message,
				options.taskIdPattern,
			);

			for (const taskRef of taskRefs) {
				if (this.taskStatuses.has(taskRef.taskId)) {
					// Actions that indicate completion: close, fix, resolve, complete
					const completionActions = ["close", "fix", "resolve", "complete"];
					const isCompleted = completionActions.includes(taskRef.action);

					const update: TaskProgressUpdate = {
						taskId: taskRef.taskId,
						status: isCompleted ? "completed" : "in-progress",
						notes: `${taskRef.action} via commit ${commit.hash.substring(0, 7)}`,
						timestamp: commit.date,
					};

					this.updateProgress(update);
					updates.push(update);
				}
			}
		}

		return updates;
	}

	/**
	 * Fetch commits from git repository
	 *
	 * @param options - Git sync options
	 * @returns Array of git commits
	 * @private
	 */
	private fetchCommits(options: GitSyncOptions): GitCommit[] {
		const cwd = options.repoPath ?? process.cwd();
		const branch = options.branch ?? "HEAD";

		try {
			// Build git log arguments safely to prevent command injection
			const args = ["log", branch, "--format=%H|%s|%aI|%an", "--no-merges"];

			// Add since parameter if provided
			if (options.since) {
				args.push(`--since=${options.since}`);
			}

			const output = execFileSync("git", args, {
				cwd,
				encoding: "utf-8",
			});

			return output
				.trim()
				.split("\n")
				.filter(Boolean)
				.map((line) => {
					// Split with limit to handle pipe characters in commit messages
					const parts = line.split("|");
					if (parts.length < 4) {
						// Malformed line, skip it
						return null;
					}
					const [hash, message, date, author, ...rest] = parts;
					// If message contained pipes, rejoin the extra parts
					const fullMessage =
						rest.length > 0
							? [message, ...rest.slice(0, -2)].join("|")
							: message;
					const actualDate = rest.length > 0 ? rest[rest.length - 2] : date;
					const actualAuthor = rest.length > 0 ? rest[rest.length - 1] : author;

					return {
						hash,
						message: fullMessage,
						date: actualDate,
						author: actualAuthor,
					};
				})
				.filter((commit): commit is GitCommit => commit !== null);
		} catch (_error) {
			// Git not available or not a repo - graceful degradation
			return [];
		}
	}

	/**
	 * Extract task references from commit message
	 *
	 * Parses commit messages for standard patterns like "closes #123" or
	 * "fixes TASK-001" as well as standalone task ID mentions.
	 *
	 * @param message - Commit message to parse
	 * @param customPattern - Optional custom regex pattern for task IDs
	 * @returns Array of task references with action and task ID
	 * @private
	 */
	private extractTaskReferences(
		message: string,
		customPattern?: RegExp,
	): Array<{ taskId: string; action: string }> {
		const results: Array<{ taskId: string; action: string }> = [];

		// Standard patterns: closes #X, fixes #X, resolves #X
		// Each pattern captures the action word and the task ID separately
		const patterns: Array<{ pattern: RegExp; action: string }> = [
			{
				pattern: /(?:closes?|close)\s+#?([A-Z0-9]+-\d+)\b/gi,
				action: "close",
			},
			{ pattern: /(?:fixes?|fix)\s+#?([A-Z0-9]+-\d+)\b/gi, action: "fix" },
			{
				pattern: /(?:resolves?|resolve)\s+#?([A-Z0-9]+-\d+)\b/gi,
				action: "resolve",
			},
			{
				pattern: /(?:completes?|complete)\s+#?([A-Z0-9]+-\d+)\b/gi,
				action: "complete",
			},
		];

		// Process standard patterns
		for (const { pattern, action } of patterns) {
			const matches = message.matchAll(pattern);
			for (const match of matches) {
				results.push({
					taskId: match[1],
					action,
				});
			}
		}

		// Add custom pattern if provided
		// Expected shape for customPattern matches:
		//   - match[0]: full text starting with an action word (e.g., "closes P4-001")
		//   - match[1]: captured task ID (e.g., "P4-001")
		if (customPattern) {
			const matches = message.matchAll(customPattern);
			for (const match of matches) {
				// Validate that we have a captured task ID
				if (!match[1]) {
					continue;
				}

				// Derive action from the first whitespace-separated token in the full match
				const rawMatchText =
					typeof match[0] === "string" ? match[0].trim() : "";
				const firstToken = rawMatchText.split(/\s+/)[0] ?? "";
				const normalizedAction = firstToken.toLowerCase().replace(/s$/, "");

				// Validate that we have a plausible action word
				if (!normalizedAction || !/^[a-z]+$/.test(normalizedAction)) {
					// If the custom pattern doesn't start with an action word, use generic action
					results.push({
						taskId: match[1],
						action: "custom",
					});
					continue;
				}

				results.push({
					taskId: match[1],
					action: normalizedAction,
				});
			}
		}

		// Also check for task ID mentions like "P4-001" or "TASK-123"
		const taskIdPattern = /\b([A-Z0-9]+-\d+)\b/g;
		const taskIdMatches = message.matchAll(taskIdPattern);
		for (const match of taskIdMatches) {
			if (!results.some((r) => r.taskId === match[1])) {
				results.push({
					taskId: match[1],
					action: "mention",
				});
			}
		}

		return results;
	}

	/**
	 * Watch for new commits and update progress automatically
	 *
	 * Starts a periodic sync process that checks for new commits and updates
	 * task progress. Returns a cleanup function to stop watching.
	 *
	 * @param options - Git sync options with optional interval
	 * @returns Cleanup function to stop watching
	 *
	 * @example
	 * ```typescript
	 * const stopWatching = tracker.watchAndSync({
	 *   intervalMs: 60000, // Check every minute
	 *   branch: "main"
	 * });
	 *
	 * // Later, to stop watching:
	 * stopWatching();
	 * ```
	 */
	watchAndSync(options: GitSyncOptions & { intervalMs?: number }): () => void {
		const interval = options.intervalMs ?? 60000; // Default 1 minute
		let lastSync = new Date().toISOString();

		const intervalId = setInterval(() => {
			const updates = this.syncFromGit({ ...options, since: lastSync });
			lastSync = new Date().toISOString();

			if (updates.length > 0) {
				logger.info("Progress updated from git commits", {
					taskCount: updates.length,
					taskIds: updates.map((u) => u.taskId),
				});
			}
		}, interval);

		// Return cleanup function
		return () => clearInterval(intervalId);
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
