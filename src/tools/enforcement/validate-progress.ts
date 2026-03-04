/**
 * validate_progress MCP tool.
 * Validates project progress by scanning task files.
 * @module
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import type {
	DependencyIssue,
	PhaseProgress,
	ProgressValidationResult,
	TaskProgress,
	TaskStatus,
} from "./types.js";

// ============================================
// Schemas
// ============================================

export const taskProgressSchema = z
	.object({
		taskId: z.string().describe("Task identifier (e.g., T-001)"),
		status: z
			.enum(["not-started", "in-progress", "completed", "blocked"])
			.describe("Current task status"),
		completedCriteria: z
			.array(z.string())
			.optional()
			.describe("List of completed acceptance criteria"),
		totalCriteria: z
			.number()
			.optional()
			.describe("Total number of acceptance criteria"),
		blockedBy: z
			.array(z.string())
			.optional()
			.describe("Tasks blocking this task"),
		notes: z.string().optional().describe("Progress notes"),
	})
	.describe("Progress for a single task");

export const phaseProgressSchema = z
	.object({
		phaseId: z.string().describe("Phase identifier (e.g., phase-1)"),
		phaseName: z.string().describe("Phase name"),
		totalTasks: z.number().describe("Total tasks in phase"),
		completedTasks: z.number().describe("Number of completed tasks"),
		blockedTasks: z.number().default(0).describe("Number of blocked tasks"),
		progress: z.number().min(0).max(100).describe("Progress percentage"),
	})
	.describe("Aggregated progress for a phase");

export const validateProgressRequestSchema = z
	.object({
		projectPath: z.string().describe("Path to project root"),
		tasksDir: z
			.string()
			.optional()
			.describe("Path to tasks directory (default: <projectPath>/tasks)"),
		includeDetails: z
			.boolean()
			.default(true)
			.describe("Include detailed task breakdown"),
		validateDependencies: z
			.boolean()
			.default(true)
			.describe("Validate task dependencies"),
		outputFormat: z
			.enum(["summary", "detailed", "json"])
			.default("detailed")
			.describe("Output format"),
	})
	.describe("Progress validation request");

export type ValidateProgressRequest = z.infer<
	typeof validateProgressRequestSchema
>;

// ============================================
// Core Implementation
// ============================================

/**
 * Find all task markdown files under a directory (no glob dependency).
 */
function findTaskFiles(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];

	const allEntries = fs.readdirSync(dir, { recursive: true }) as string[];
	return allEntries
		.filter((e) => /T-\d+.*\.md$/.test(e))
		.map((e) => path.join(dir, e));
}

/**
 * Extract completed criteria lines from task file content.
 */
function extractCompletedCriteria(content: string): string[] {
	const lines = content.split("\n");
	return lines
		.filter((l) => l.includes("✅") || l.match(/- \[x\]/i))
		.map((l) =>
			l
				.replace(/^[-*]\s*\[x\]\s*/i, "")
				.replace("✅", "")
				.trim(),
		)
		.filter(Boolean);
}

/**
 * Determine task status from file content.
 */
function determineStatus(
	content: string,
	completed: number,
	total: number,
): TaskStatus {
	if (
		content.includes("BLOCKED") ||
		content.toLowerCase().includes("blocked by")
	) {
		return "blocked";
	}
	if (completed === 0 && total === 0) return "not-started";
	if (completed >= total && total > 0) return "completed";
	if (completed > 0) return "in-progress";
	return "not-started";
}

/**
 * Extract phase ID from task file path.
 */
function extractPhaseId(filePath: string): string {
	const parts = filePath.split(path.sep);
	const phaseDir = parts.find((p) => /phase[-_]?\d+/.test(p.toLowerCase()));
	return phaseDir ?? "unknown";
}

/**
 * Parse a single task file into TaskProgress.
 */
function parseTaskFile(filePath: string): TaskProgress {
	const content = fs.readFileSync(filePath, "utf-8");
	const taskIdMatch =
		path.basename(filePath, ".md").match(/T-\d+/) ??
		content.match(/\*\*Task ID\*\*:\s*(T-\d+)/);
	const taskId = taskIdMatch?.[0] ?? path.basename(filePath, ".md");

	const completedCriteria = extractCompletedCriteria(content);
	const totalCriteriaMatch = content.match(
		/## [\d.]+\s*Acceptance Criteria([\s\S]*?)(?:^##|z)/m,
	);
	const criteriaLines =
		totalCriteriaMatch?.[1]?.split("\n").filter((l) => l.match(/^[-*|]/))
			.length ?? completedCriteria.length;

	const totalCriteria = Math.max(criteriaLines, completedCriteria.length);
	const status = determineStatus(
		content,
		completedCriteria.length,
		totalCriteria,
	);

	// Extract blockedBy from content
	const blockedByMatch = content.match(/blocked[\s\S]*?(?:T-\d+)/gi);
	const blockedBy = blockedByMatch
		?.flatMap((m) => m.match(/T-\d+/g) ?? [])
		.filter((id): id is string => Boolean(id));

	return {
		taskId,
		status,
		completedCriteria,
		totalCriteria,
		blockedBy: blockedBy && blockedBy.length > 0 ? blockedBy : undefined,
		filePath,
	};
}

/**
 * Group tasks by phase.
 */
function groupTasksByPhase(tasks: TaskProgress[]): Map<string, TaskProgress[]> {
	const phases = new Map<string, TaskProgress[]>();
	for (const task of tasks) {
		const phaseId = extractPhaseId(task.filePath ?? "");
		const list = phases.get(phaseId) ?? [];
		list.push(task);
		phases.set(phaseId, list);
	}
	return phases;
}

/**
 * Calculate phase progress summary.
 */
function calculatePhaseProgress(
	phaseId: string,
	tasks: TaskProgress[],
): PhaseProgress {
	const completed = tasks.filter((t) => t.status === "completed").length;
	const blocked = tasks.filter((t) => t.status === "blocked").length;
	const progress =
		tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

	return {
		phaseId,
		phaseName: phaseId
			.replace(/[-_]/g, " ")
			.replace(/\b\w/g, (c) => c.toUpperCase()),
		totalTasks: tasks.length,
		completedTasks: completed,
		blockedTasks: blocked,
		progress,
	};
}

/**
 * Calculate overall project progress.
 */
function calculateOverallProgress(phases: PhaseProgress[]): number {
	if (phases.length === 0) return 0;
	const total = phases.reduce((s, p) => s + p.totalTasks, 0);
	const completed = phases.reduce((s, p) => s + p.completedTasks, 0);
	return total > 0 ? Math.round((completed / total) * 100) : 0;
}

/**
 * Validate task dependencies (detect missing/blocked predecessors).
 */
function validateDependencyChain(tasks: TaskProgress[]): DependencyIssue[] {
	const taskIds = new Set(tasks.map((t) => t.taskId));
	const issues: DependencyIssue[] = [];

	for (const task of tasks) {
		if (!task.blockedBy) continue;
		for (const dep of task.blockedBy) {
			if (!taskIds.has(dep)) {
				issues.push({
					taskId: task.taskId,
					missingDependency: dep,
					message: `Task ${task.taskId} depends on ${dep} which was not found in task files`,
				});
			}
		}
	}

	return issues;
}

/**
 * Format result as markdown.
 */
function formatMarkdown(
	result: ProgressValidationResult,
	format: "summary" | "detailed" | "json",
): string {
	if (format === "json") {
		return JSON.stringify(result, null, 2);
	}

	const lines: string[] = [
		"# Progress Validation Report",
		"",
		`**Overall Progress**: ${result.overallProgress}%`,
		`**Timestamp**: ${result.timestamp}`,
		"",
		"## Phase Summary",
		"",
		"| Phase | Tasks | Completed | Blocked | Progress |",
		"|-------|-------|-----------|---------|----------|",
	];

	for (const phase of result.phases) {
		lines.push(
			`| ${phase.phaseName} | ${phase.totalTasks} | ${phase.completedTasks} | ${phase.blockedTasks} | ${phase.progress}% |`,
		);
	}

	if (result.dependencyIssues.length > 0) {
		lines.push("", "## Dependency Issues", "");
		for (const issue of result.dependencyIssues) {
			lines.push(`- **${issue.taskId}**: ${issue.message}`);
		}
	}

	if (format === "detailed" && result.tasks) {
		lines.push("", "## Task Details", "");
		for (const task of result.tasks) {
			const icon =
				task.status === "completed"
					? "✅"
					: task.status === "blocked"
						? "🚫"
						: task.status === "in-progress"
							? "🔄"
							: "⬜";
			lines.push(`- ${icon} **${task.taskId}** — ${task.status}`);
		}
	}

	return lines.join("\n");
}

// ============================================
// Public Tool Handler
// ============================================

/**
 * Validate project progress against task definition files.
 */
export async function validateProgress(
	request: ValidateProgressRequest,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
	const validated = validateProgressRequestSchema.parse(request);
	const tasksDir =
		validated.tasksDir ?? path.join(validated.projectPath, "tasks");

	try {
		const taskFiles = findTaskFiles(tasksDir);

		if (taskFiles.length === 0) {
			const result: ProgressValidationResult = {
				success: true,
				overallProgress: 0,
				phases: [],
				tasks: validated.includeDetails ? [] : undefined,
				dependencyIssues: [],
				timestamp: new Date().toISOString(),
			};
			return {
				content: [
					{
						type: "text",
						text: `No task files found in ${tasksDir}\n\n${formatMarkdown(result, validated.outputFormat)}`,
					},
				],
			};
		}

		const tasks = taskFiles.map(parseTaskFile);
		const phaseGroups = groupTasksByPhase(tasks);

		const phaseProgress: PhaseProgress[] = Array.from(
			phaseGroups.entries(),
		).map(([phaseId, phaseTasks]) =>
			calculatePhaseProgress(phaseId, phaseTasks),
		);

		const dependencyIssues = validated.validateDependencies
			? validateDependencyChain(tasks)
			: [];

		const overallProgress = calculateOverallProgress(phaseProgress);

		const result: ProgressValidationResult = {
			success: true,
			overallProgress,
			phases: phaseProgress,
			tasks: validated.includeDetails ? tasks : undefined,
			dependencyIssues,
			timestamp: new Date().toISOString(),
		};

		return {
			content: [
				{
					type: "text",
					text: formatMarkdown(result, validated.outputFormat),
				},
			],
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			content: [
				{
					type: "text",
					text: `Error validating progress: ${message}`,
				},
			],
		};
	}
}
