/**
 * Type definitions for ExecutionTrace domain module.
 *
 * Provides types for decision logging, error tracking, and execution tracing
 * in strategy implementations.
 */

/**
 * A single decision recorded during execution.
 *
 * Decisions capture the "why" of execution - what choice was made,
 * why it was made, and what context influenced it.
 */
export interface Decision {
	/** Unique identifier for this decision */
	readonly id: string;

	/** When the decision was made */
	readonly timestamp: Date;

	/** Decision category for filtering */
	readonly category: string;

	/** Human-readable description */
	readonly description: string;

	/** Additional context (must be JSON-serializable) */
	readonly context: Record<string, unknown>;
}

/**
 * An error recorded during execution.
 *
 * Errors capture failures with full context for debugging.
 */
export interface TracedError {
	/** When the error occurred */
	readonly timestamp: Date;

	/** Error category */
	readonly category: string;

	/** Error message */
	readonly message: string;

	/** Original error stack trace */
	readonly stack?: string;

	/** Context at time of error */
	readonly context: Record<string, unknown>;
}

/**
 * Execution trace - immutable log of strategy execution.
 *
 * Contains all decisions, metrics, and errors from a single execution.
 */
export interface ExecutionTraceData {
	/** Unique execution ID */
	readonly executionId: string;

	/** Strategy name */
	readonly strategyName: string;

	/** Strategy version */
	readonly strategyVersion: string;

	/** When execution started */
	readonly startedAt: Date;

	/** When execution completed (if finished) */
	readonly completedAt: Date | null;

	/** All decisions made */
	readonly decisions: readonly Decision[];

	/** All metrics recorded */
	readonly metrics: Readonly<Record<string, number>>;

	/** All errors encountered */
	readonly errors: readonly TracedError[];
}
