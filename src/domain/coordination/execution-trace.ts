/**
 * ExecutionTrace - records decisions, metrics, and errors during coordination operations.
 *
 * @module domain/coordination/execution-trace
 */

/**
 * A recorded decision made during operation.
 */
export interface TraceDecision {
	/** Decision point identifier */
	point: string;

	/** Choice made at this point */
	choice: string;

	/** Rationale for the choice */
	reason: string;

	/** Timestamp when the decision was made */
	timestamp: string;
}

/**
 * A recorded metric value.
 */
export interface TraceMetric {
	/** Metric name */
	name: string;

	/** Metric value */
	value: number;

	/** Optional unit of measurement */
	unit?: string;
}

/**
 * A recorded error.
 */
export interface TraceError {
	/** Error code */
	code: string;

	/** Human-readable message */
	message: string;

	/** Timestamp when the error occurred */
	timestamp: string;
}

/**
 * Exported trace data for serialization.
 */
export interface TraceExportData {
	/** Operation name */
	operation: string;

	/** Start timestamp */
	timestamp: string;

	/** Duration in milliseconds */
	durationMs: number;

	/** Recorded decisions */
	decisions: TraceDecision[];

	/** Recorded metrics */
	metrics: TraceMetric[];

	/** Recorded errors */
	errors: TraceError[];

	/** Whether the operation completed successfully */
	success: boolean;
}

/**
 * Records decisions, metrics, and errors during an operation.
 *
 * Provides a lightweight audit trail for agent handoff coordination.
 *
 * @example
 * ```typescript
 * const trace = new ExecutionTrace('speckit-generate');
 * trace.recordDecision('template', 'standard', 'Using standard spec template');
 * trace.recordMetric('artifacts', 7, 'files');
 * trace.complete(true);
 *
 * const data = trace.toJSON();
 * ```
 */
export class ExecutionTrace {
	private readonly startedAt: Date;
	private completedAt: Date | null = null;
	private _success = false;

	private readonly _decisions: TraceDecision[] = [];
	private readonly _metrics: TraceMetric[] = [];
	private readonly _errors: TraceError[] = [];

	/**
	 * @param operation - Name of the operation being traced
	 */
	constructor(private readonly operation: string) {
		this.startedAt = new Date();
	}

	/**
	 * Record a decision made during execution.
	 *
	 * @param point - Decision point identifier
	 * @param choice - The choice made
	 * @param reason - Rationale for the choice
	 */
	recordDecision(point: string, choice: string, reason: string): void {
		this._decisions.push({
			point,
			choice,
			reason,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Record a metric value.
	 *
	 * @param name - Metric name
	 * @param value - Metric value
	 * @param unit - Optional unit of measurement
	 */
	recordMetric(name: string, value: number, unit?: string): void {
		this._metrics.push({ name, value, unit });
	}

	/**
	 * Record an error encountered during execution.
	 *
	 * @param code - Error code
	 * @param message - Human-readable error message
	 */
	recordError(code: string, message: string): void {
		this._errors.push({
			code,
			message,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Mark the operation as complete.
	 *
	 * @param success - Whether the operation succeeded
	 */
	complete(success: boolean): void {
		this._success = success;
		this.completedAt = new Date();
	}

	/**
	 * Export the trace data as a plain object.
	 */
	toJSON(): TraceExportData {
		const durationMs = this.completedAt
			? this.completedAt.getTime() - this.startedAt.getTime()
			: Date.now() - this.startedAt.getTime();

		return {
			operation: this.operation,
			timestamp: this.startedAt.toISOString(),
			durationMs,
			decisions: [...this._decisions],
			metrics: [...this._metrics],
			errors: [...this._errors],
			success: this._success,
		};
	}
}
