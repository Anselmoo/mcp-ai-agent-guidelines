import type { ExecutionTraceData } from "../base-strategy/types.js";

/**
 * Status of an operation or the overall summary.
 */
export type OperationStatus =
	| "pending"
	| "in-progress"
	| "completed"
	| "failed"
	| "partial";

/**
 * Severity level for feedback items.
 */
export type FeedbackSeverity = "info" | "warning" | "error";

/**
 * A single feedback item to show the user.
 */
export interface FeedbackItem {
	severity: FeedbackSeverity;
	message: string;
	source?: string;
	timestamp: Date;
}

/**
 * A suggestion for next steps.
 */
export interface Suggestion {
	action: string;
	reason: string;
	priority: "high" | "medium" | "low";
}

/**
 * Options for generating summaries.
 */
export interface SummaryOptions {
	/** Maximum character length for text summary */
	maxLength?: number;

	/** Include numeric metrics */
	includeMetrics?: boolean;

	/** Include suggestions for next steps */
	includeSuggestions?: boolean;

	/** Include list of operations */
	includeOperations?: boolean;

	/** Verbosity level */
	verbosity?: "minimal" | "normal" | "verbose";
}

/**
 * Generated summary result.
 */
export interface SummaryResult {
	/** Overall status */
	status: OperationStatus;

	/** Human-readable duration */
	duration: string;

	/** Number of operations performed */
	operationCount: number;

	/** List of operation names (if includeOperations) */
	operations?: string[];

	/** Warning messages */
	warnings: string[];

	/** Error messages */
	errors: string[];

	/** Suggestions for next steps */
	suggestions?: Suggestion[];

	/** Aggregated metrics */
	metrics?: Record<string, number>;

	/** Text summary for display */
	text: string;

	/** Markdown summary for rich display */
	markdown: string;
}

/**
 * Collected operation info from a trace.
 */
export interface CollectedOperation {
	name: string;
	version: string;
	status: OperationStatus;
	duration: number;
	trace: ExecutionTraceData;
}
