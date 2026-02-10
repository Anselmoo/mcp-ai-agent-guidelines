/**
 * Execution trace for logging decisions and metrics.
 * Provides transparency into strategy execution for debugging, auditing, and human review.
 */

import type {
	ExecutionTraceExport,
	TraceEntry,
	TraceSummary,
} from "./types.js";

/**
 * Execution trace for logging decisions and metrics.
 *
 * Provides transparency into strategy execution for debugging,
 * auditing, and human review.
 *
 * @example
 * ```typescript
 * const trace = new ExecutionTrace();
 * trace.recordDecision('Selected approach', 'Based on input complexity');
 * trace.recordMetric('validationTime', 45, 'ms');
 * const markdown = trace.toMarkdown();
 * ```
 */
export class ExecutionTrace {
	private readonly traceId: string;
	private readonly startTime: Date;
	private readonly entries: TraceEntry[] = [];
	private endTime?: Date;

	constructor(startTime: Date = new Date()) {
		this.traceId = this.generateTraceId();
		this.startTime = startTime;
	}

	/**
	 * Record the start of execution.
	 */
	recordStart(data: Record<string, unknown>): void {
		this.entries.push({
			timestamp: new Date().toISOString(),
			type: "start",
			message: "Strategy execution started",
			data,
		});
	}

	/**
	 * Record a decision point with rationale.
	 *
	 * @param decision - What was decided
	 * @param rationale - Why it was decided
	 * @param data - Additional context
	 */
	recordDecision(
		decision: string,
		rationale: string,
		data?: Record<string, unknown>,
	): void {
		this.entries.push({
			timestamp: new Date().toISOString(),
			type: "decision",
			message: `${decision}: ${rationale}`,
			data,
		});
	}

	/**
	 * Record a metric measurement.
	 *
	 * @param name - Metric name (e.g., 'validationTime')
	 * @param value - Metric value
	 * @param unit - Unit of measurement (e.g., 'ms', 'bytes')
	 */
	recordMetric(name: string, value: number, unit?: string): void {
		this.entries.push({
			timestamp: new Date().toISOString(),
			type: "metric",
			message: unit ? `${name}: ${value}${unit}` : `${name}: ${value}`,
			data: { name, value, unit },
		});
	}

	/**
	 * Record an error that occurred during execution.
	 */
	recordError(error: Error | string, context?: Record<string, unknown>): void {
		const message = error instanceof Error ? error.message : error;
		this.entries.push({
			timestamp: new Date().toISOString(),
			type: "error",
			message,
			data: {
				...context,
				stack: error instanceof Error ? error.stack : undefined,
			},
		});
	}

	/**
	 * Record a warning (non-blocking issue).
	 */
	recordWarning(message: string, data?: Record<string, unknown>): void {
		this.entries.push({
			timestamp: new Date().toISOString(),
			type: "warning",
			message,
			data,
		});
	}

	/**
	 * Record successful completion.
	 */
	recordSuccess(data: Record<string, unknown>): void {
		this.endTime = new Date();
		this.entries.push({
			timestamp: this.endTime.toISOString(),
			type: "success",
			message: "Strategy execution completed successfully",
			data,
		});
	}

	/**
	 * Export trace as JSON-serializable object.
	 */
	toJSON(): ExecutionTraceExport {
		const end = this.endTime ?? new Date();
		return {
			traceId: this.traceId,
			startTime: this.startTime.toISOString(),
			endTime: end.toISOString(),
			entries: [...this.entries],
			summary: this.getSummary(),
		};
	}

	/**
	 * Export trace as Markdown for human review.
	 */
	toMarkdown(): string {
		const summary = this.getSummary();
		const lines = [
			`# Execution Trace: ${this.traceId}`,
			"",
			"## Summary",
			"",
			`- **Duration**: ${summary.durationMs}ms`,
			`- **Decisions**: ${summary.totalDecisions}`,
			`- **Errors**: ${summary.totalErrors}`,
			`- **Warnings**: ${summary.totalWarnings}`,
			"",
			"## Timeline",
			"",
		];

		for (const entry of this.entries) {
			const icon = this.getEntryIcon(entry.type);
			lines.push(
				`- ${icon} \`${entry.timestamp}\` **${entry.type}**: ${entry.message}`,
			);
		}

		return lines.join("\n");
	}

	/**
	 * Get duration in milliseconds.
	 */
	getDuration(): number {
		const end = this.endTime ?? new Date();
		return end.getTime() - this.startTime.getTime();
	}

	private getSummary(): TraceSummary {
		return {
			totalDecisions: this.entries.filter((e) => e.type === "decision").length,
			totalErrors: this.entries.filter((e) => e.type === "error").length,
			totalWarnings: this.entries.filter((e) => e.type === "warning").length,
			durationMs: this.getDuration(),
		};
	}

	private generateTraceId(): string {
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).substring(2, 8);
		return `trace_${timestamp}_${random}`;
	}

	private getEntryIcon(type: TraceEntry["type"]): string {
		const icons: Record<TraceEntry["type"], string> = {
			start: "🚀",
			decision: "🔀",
			metric: "📊",
			error: "❌",
			warning: "⚠️",
			success: "✅",
		};
		return icons[type] || "•";
	}
}
