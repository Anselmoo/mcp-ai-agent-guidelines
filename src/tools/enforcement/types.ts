/**
 * Enforcement tool types.
 * @module
 */

/**
 * Progress status for a task.
 */
export type TaskStatus =
	| "not-started"
	| "in-progress"
	| "completed"
	| "blocked";

/**
 * Progress information for an individual task.
 */
export interface TaskProgress {
	taskId: string;
	status: TaskStatus;
	completedCriteria?: string[];
	totalCriteria?: number;
	blockedBy?: string[];
	notes?: string;
	filePath?: string;
}

/**
 * Aggregated progress for a phase.
 */
export interface PhaseProgress {
	phaseId: string;
	phaseName: string;
	totalTasks: number;
	completedTasks: number;
	blockedTasks: number;
	progress: number;
}

/**
 * Result of a progress validation run.
 */
export interface ProgressValidationResult {
	success: boolean;
	overallProgress: number;
	phases: PhaseProgress[];
	tasks?: TaskProgress[];
	dependencyIssues: DependencyIssue[];
	timestamp: string;
	error?: string;
}

/**
 * A dependency validation issue.
 */
export interface DependencyIssue {
	taskId: string;
	missingDependency: string;
	message: string;
}
