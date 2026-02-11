/**
 * Execution Trace - records decisions, metrics, and errors during strategy execution.
 *
 * The trace is mutable during execution but provides immutable snapshots for export.
 */

import { randomUUID } from "node:crypto";
import type { Decision, ExecutionTraceData, TracedError } from "./types.js";

/**
 * Execution Trace - records decisions, metrics, and errors during strategy execution.
 *
 * The trace is mutable during execution but provides immutable snapshots for export.
 *
 * @example
 * ```typescript
 * const trace = new ExecutionTrace('my-strategy', '1.0.0');
 *
 * trace.recordDecision(
 *   'select-template',
 *   'Selected enterprise template based on input size',
 *   { inputSize: 1500, threshold: 1000 }
 * );
 *
 * trace.recordMetric('generation_time_ms', 250);
 *
 * try {
 *   // operation
 * } catch (error) {
 *   trace.recordError(error, { operation: 'template-render' });
 * }
 *
 * // Export for debugging
 * const markdown = trace.toMarkdown();
 * ```
 */
export class ExecutionTrace {
	private readonly executionId: string;
	private readonly startedAt: Date;
	private completedAt: Date | null = null;

	private readonly _decisions: Decision[] = [];
	private readonly _metrics: Record<string, number> = {};
	private readonly _errors: TracedError[] = [];

	constructor(
		private readonly strategyName: string,
		private readonly strategyVersion: string,
	) {
		this.executionId = randomUUID();
		this.startedAt = new Date();
	}

	// ============================================
	// Recording Methods
	// ============================================

	/**
	 * Record a decision made during execution.
	 *
	 * @param category - Decision category (e.g., 'validation', 'generation', 'selection')
	 * @param description - Human-readable description of the decision
	 * @param context - Additional context (must be JSON-serializable)
	 * @returns The recorded decision
	 */
	recordDecision(
		category: string,
		description: string,
		context: Record<string, unknown> = {},
	): Decision {
		const decision: Decision = {
			id: randomUUID(),
			timestamp: new Date(),
			category,
			description,
			context: this.sanitizeContext(context),
		};

		this._decisions.push(decision);
		return decision;
	}

	/**
	 * Record a numeric metric.
	 *
	 * @param name - Metric name (e.g., 'generation_time_ms', 'token_count')
	 * @param value - Metric value
	 */
	recordMetric(name: string, value: number): void {
		this._metrics[name] = value;
	}

	/**
	 * Increment a counter metric.
	 *
	 * @param name - Counter name
	 * @param increment - Amount to increment (default: 1)
	 */
	incrementMetric(name: string, increment = 1): void {
		this._metrics[name] = (this._metrics[name] ?? 0) + increment;
	}

	/**
	 * Record an error with context.
	 *
	 * @param error - The error that occurred
	 * @param context - Additional context at time of error
	 */
	recordError(error: Error, context: Record<string, unknown> = {}): void {
		this._errors.push({
			timestamp: new Date(),
			category: error.name || "Error",
			message: error.message,
			stack: error.stack,
			context: this.sanitizeContext(context),
		});
	}

	/**
	 * Mark the trace as complete.
	 */
	complete(): void {
		this.completedAt = new Date();
		this.recordMetric("total_duration_ms", this.durationMs);
	}

	// ============================================
	// Query Methods
	// ============================================

	/**
	 * Get all recorded decisions.
	 */
	get decisions(): readonly Decision[] {
		return [...this._decisions];
	}

	/**
	 * Get all recorded metrics.
	 */
	get metrics(): Readonly<Record<string, number>> {
		return { ...this._metrics };
	}

	/**
	 * Get all recorded errors.
	 */
	get errors(): readonly TracedError[] {
		return [...this._errors];
	}

	/**
	 * Get current duration in milliseconds.
	 */
	get durationMs(): number {
		const endTime = this.completedAt ?? new Date();
		return endTime.getTime() - this.startedAt.getTime();
	}

	/**
	 * Check if any errors were recorded.
	 */
	get hasErrors(): boolean {
		return this._errors.length > 0;
	}

	/**
	 * Get decisions filtered by category.
	 */
	getDecisionsByCategory(category: string): readonly Decision[] {
		return this._decisions.filter((d) => d.category === category);
	}

	// ============================================
	// Export Methods
	// ============================================

	/**
	 * Export trace as immutable data object.
	 */
	toData(): ExecutionTraceData {
		return {
			executionId: this.executionId,
			strategyName: this.strategyName,
			strategyVersion: this.strategyVersion,
			startedAt: this.startedAt,
			completedAt: this.completedAt,
			decisions: [...this._decisions],
			metrics: { ...this._metrics },
			errors: [...this._errors],
		};
	}

	/**
	 * Export trace as JSON string.
	 */
	toJSON(): string {
		return JSON.stringify(this.toData(), null, 2);
	}

	/**
	 * Export trace as Markdown for human-readable debugging.
	 */
	toMarkdown(): string {
		const lines: string[] = [];

		// Header
		lines.push(
			`# Execution Trace: ${this.strategyName} v${this.strategyVersion}`,
		);
		lines.push("");
		lines.push(`**Execution ID**: \`${this.executionId}\``);
		lines.push(`**Started**: ${this.startedAt.toISOString()}`);
		if (this.completedAt) {
			lines.push(`**Completed**: ${this.completedAt.toISOString()}`);
		}
		lines.push(`**Duration**: ${this.durationMs}ms`);
		lines.push("");

		// Metrics
		if (Object.keys(this._metrics).length > 0) {
			lines.push("## Metrics");
			lines.push("");
			lines.push("| Metric | Value |");
			lines.push("|--------|-------|");
			for (const [name, value] of Object.entries(this._metrics)) {
				lines.push(`| ${name} | ${value} |`);
			}
			lines.push("");
		}

		// Decisions
		if (this._decisions.length > 0) {
			lines.push("## Decisions");
			lines.push("");

			for (const decision of this._decisions) {
				lines.push(`### ${decision.category}`);
				lines.push("");
				lines.push(`**Time**: ${decision.timestamp.toISOString()}`);
				lines.push("");
				lines.push(decision.description);
				lines.push("");

				if (Object.keys(decision.context).length > 0) {
					lines.push("**Context**:");
					lines.push("```json");
					lines.push(JSON.stringify(decision.context, null, 2));
					lines.push("```");
					lines.push("");
				}
			}
		}

		// Errors
		if (this._errors.length > 0) {
			lines.push("## Errors");
			lines.push("");

			for (const error of this._errors) {
				lines.push(`### ${error.category}`);
				lines.push("");
				lines.push(`**Time**: ${error.timestamp.toISOString()}`);
				lines.push(`**Message**: ${error.message}`);
				lines.push("");

				if (error.stack) {
					lines.push("**Stack**:");
					lines.push("```");
					lines.push(error.stack);
					lines.push("```");
					lines.push("");
				}

				if (Object.keys(error.context).length > 0) {
					lines.push("**Context**:");
					lines.push("```json");
					lines.push(JSON.stringify(error.context, null, 2));
					lines.push("```");
					lines.push("");
				}
			}
		}

		return lines.join("\n");
	}

	// ============================================
	// Private Helpers
	// ============================================

	/**
	 * Sanitize context to ensure it's JSON-serializable.
	 */
	private sanitizeContext(
		context: Record<string, unknown>,
	): Record<string, unknown> {
		const result: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(context)) {
			try {
				// Test if value is serializable
				JSON.stringify(value);
				result[key] = value;
			} catch {
				// Convert non-serializable values to strings
				result[key] = String(value);
			}
		}

		return result;
	}
}
