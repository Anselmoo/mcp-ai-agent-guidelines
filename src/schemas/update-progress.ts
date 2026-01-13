/**
 * Schema for update-progress tool
 *
 * @module schemas/update-progress
 */

import { z } from "zod";

/**
 * Schema for update-progress tool input
 */
export const updateProgressSchema = z.object({
	/** Path to existing progress.md file */
	progressPath: z
		.string()
		.optional()
		.describe("Path to existing progress.md file"),

	/** Current progress.md content (alternative to progressPath) */
	progressContent: z
		.string()
		.optional()
		.describe("Current progress.md content"),

	/** Path to tasks.md for task list */
	tasksPath: z.string().optional().describe("Path to tasks.md for task list"),

	/** Task IDs to mark as completed */
	completedTaskIds: z
		.array(z.string())
		.describe("Task IDs to mark as completed"),

	/** Detailed task status updates */
	taskUpdates: z
		.array(
			z.object({
				taskId: z.string(),
				status: z.enum(["completed", "in-progress", "blocked"]),
				notes: z.string().optional(),
			}),
		)
		.optional()
		.describe("Detailed task status updates"),

	/** Also sync from git commits */
	syncFromGit: z
		.boolean()
		.default(false)
		.describe("Also sync from git commits"),

	/** Git sync options */
	gitOptions: z
		.object({
			repoPath: z.string().optional(),
			branch: z.string().optional(),
			since: z.string().optional(),
		})
		.optional()
		.describe("Git sync options"),

	/** Output format */
	outputFormat: z
		.enum(["markdown", "json"])
		.default("markdown")
		.describe("Output format"),
});

/**
 * TypeScript type inferred from the schema
 */
export type UpdateProgressRequest = z.infer<typeof updateProgressSchema>;
