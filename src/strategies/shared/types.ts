/**
 * Shared type definitions for strategy implementations.
 * Provides consistent interfaces for validation, execution results, and tracing.
 */

/**
 * Result of input validation.
 */
export interface ValidationResult {
	/** Whether validation passed */
	valid: boolean;
	/** List of validation errors (empty if valid) */
	errors: ValidationError[];
	/** List of validation warnings (non-blocking) */
	warnings: ValidationWarning[];
}

/**
 * Validation error with structured context.
 */
export interface ValidationError {
	/** Error code for programmatic handling */
	code: string;
	/** Human-readable error message */
	message: string;
	/** Field or path that caused the error */
	field?: string;
	/** Additional context */
	context?: Record<string, unknown>;
}

/**
 * Validation warning (non-blocking).
 */
export interface ValidationWarning {
	code: string;
	message: string;
	field?: string;
	suggestion?: string;
}

/**
 * Result of strategy execution.
 */
export interface StrategyResult<T> {
	/** Whether execution succeeded */
	success: boolean;
	/** Output data (present if success=true) */
	data?: T;
	/** Execution errors (present if success=false) */
	errors?: ValidationError[];
	/** Execution trace for debugging */
	trace: ExecutionTraceExport;
	/** Execution duration in milliseconds */
	durationMs: number;
}

/**
 * Exported execution trace for serialization.
 */
export interface ExecutionTraceExport {
	traceId: string;
	startTime: string;
	endTime: string;
	entries: TraceEntry[];
	summary: TraceSummary;
}

/**
 * Single trace entry.
 */
export interface TraceEntry {
	timestamp: string;
	type: "start" | "decision" | "metric" | "error" | "success" | "warning";
	message: string;
	data?: Record<string, unknown>;
}

/**
 * Trace summary for quick analysis.
 */
export interface TraceSummary {
	totalDecisions: number;
	totalErrors: number;
	totalWarnings: number;
	durationMs: number;
}
