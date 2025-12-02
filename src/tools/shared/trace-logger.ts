/**
 * Trace Logger for A2A Orchestration
 *
 * Provides structured tracing and observability for tool chains:
 * - Correlation ID propagation
 * - Execution timeline visualization
 * - Performance metrics
 * - Error tracking
 * - Distributed tracing support
 */

import type { A2AContext } from "./a2a-context.js";
import { logger } from "./logger.js";

/**
 * Trace event types
 */
export type TraceEventType =
	| "chain_start"
	| "chain_end"
	| "tool_start"
	| "tool_end"
	| "tool_error"
	| "context_update";

/**
 * Trace event
 */
export interface TraceEvent {
	/** Event type */
	type: TraceEventType;
	/** Timestamp */
	timestamp: Date;
	/** Correlation ID */
	correlationId: string;
	/** Tool name (if applicable) */
	toolName?: string;
	/** Execution depth */
	depth?: number;
	/** Additional event data */
	data?: Record<string, unknown>;
}

/**
 * Trace span for a tool invocation
 */
export interface TraceSpan {
	/** Span ID */
	spanId: string;
	/** Parent span ID (if nested) */
	parentSpanId?: string;
	/** Correlation ID */
	correlationId: string;
	/** Tool name */
	toolName: string;
	/** Start time */
	startTime: Date;
	/** End time */
	endTime?: Date;
	/** Duration in milliseconds */
	durationMs?: number;
	/** Execution depth */
	depth: number;
	/** Status */
	status: "success" | "error" | "pending";
	/** Error message if failed */
	error?: string;
	/** Input hash */
	inputHash: string;
	/** Output summary */
	outputSummary?: string;
}

/**
 * Trace Logger class for managing traces
 */
export class TraceLogger {
	private events: TraceEvent[] = [];
	private spans: Map<string, TraceSpan> = new Map();
	private activeSpans: Map<string, string> = new Map(); // correlationId -> spanId

	/**
	 * Start a new chain trace
	 *
	 * @param context - A2A context
	 */
	startChain(context: A2AContext): void {
		this.addEvent({
			type: "chain_start",
			timestamp: new Date(),
			correlationId: context.correlationId,
			depth: context.depth,
			data: {
				maxDepth: context.maxDepth,
				chainTimeoutMs: context.chainTimeoutMs,
			},
		});

		logger.info("Chain execution started", {
			correlationId: context.correlationId,
			maxDepth: context.maxDepth,
		});
	}

	/**
	 * End a chain trace
	 *
	 * @param context - A2A context
	 * @param success - Whether chain succeeded
	 * @param error - Error message if failed
	 */
	endChain(context: A2AContext, success: boolean, error?: string): void {
		const totalDurationMs = Date.now() - context.chainStartTime.getTime();

		this.addEvent({
			type: "chain_end",
			timestamp: new Date(),
			correlationId: context.correlationId,
			depth: context.depth,
			data: {
				success,
				error,
				totalDurationMs,
				toolCount: context.executionLog.length,
			},
		});

		logger.info("Chain execution ended", {
			correlationId: context.correlationId,
			success,
			totalDurationMs,
			toolCount: context.executionLog.length,
			error,
		});
	}

	/**
	 * Start a tool span
	 *
	 * @param context - A2A context
	 * @param toolName - Tool name
	 * @param inputHash - Input hash
	 * @returns Span ID
	 */
	startToolSpan(
		context: A2AContext,
		toolName: string,
		inputHash: string,
	): string {
		const spanId = this.generateSpanId();
		const parentSpanId = this.activeSpans.get(context.correlationId);

		const span: TraceSpan = {
			spanId,
			parentSpanId,
			correlationId: context.correlationId,
			toolName,
			startTime: new Date(),
			depth: context.depth,
			status: "pending",
			inputHash,
		};

		this.spans.set(spanId, span);
		this.activeSpans.set(context.correlationId, spanId);

		this.addEvent({
			type: "tool_start",
			timestamp: new Date(),
			correlationId: context.correlationId,
			toolName,
			depth: context.depth,
			data: { spanId, parentSpanId },
		});

		return spanId;
	}

	/**
	 * End a tool span
	 *
	 * @param spanId - Span ID
	 * @param success - Whether tool succeeded
	 * @param outputSummary - Output summary
	 * @param error - Error message if failed
	 */
	endToolSpan(
		spanId: string,
		success: boolean,
		outputSummary?: string,
		error?: string,
	): void {
		const span = this.spans.get(spanId);
		if (!span) {
			logger.warn(`Span ${spanId} not found`);
			return;
		}

		const endTime = new Date();
		const durationMs = endTime.getTime() - span.startTime.getTime();

		span.endTime = endTime;
		span.durationMs = durationMs;
		span.status = success ? "success" : "error";
		span.outputSummary = outputSummary;
		span.error = error;

		this.addEvent({
			type: success ? "tool_end" : "tool_error",
			timestamp: endTime,
			correlationId: span.correlationId,
			toolName: span.toolName,
			depth: span.depth,
			data: {
				spanId,
				durationMs,
				success,
				error,
			},
		});

		// Remove from active spans if this was the active span
		if (this.activeSpans.get(span.correlationId) === spanId) {
			if (span.parentSpanId) {
				this.activeSpans.set(span.correlationId, span.parentSpanId);
			} else {
				this.activeSpans.delete(span.correlationId);
			}
		}
	}

	/**
	 * Get all spans for a correlation ID
	 *
	 * @param correlationId - Correlation ID
	 * @returns Array of spans
	 */
	getSpans(correlationId: string): TraceSpan[] {
		return Array.from(this.spans.values()).filter(
			(span) => span.correlationId === correlationId,
		);
	}

	/**
	 * Get all events for a correlation ID
	 *
	 * @param correlationId - Correlation ID
	 * @returns Array of events
	 */
	getEvents(correlationId: string): TraceEvent[] {
		return this.events.filter((event) => event.correlationId === correlationId);
	}

	/**
	 * Get execution timeline for a correlation ID
	 *
	 * @param correlationId - Correlation ID
	 * @returns Timeline visualization data
	 */
	getTimeline(correlationId: string): {
		spans: TraceSpan[];
		totalDurationMs: number;
		criticalPath: string[];
	} {
		const spans = this.getSpans(correlationId);

		if (spans.length === 0) {
			return { spans: [], totalDurationMs: 0, criticalPath: [] };
		}

		// Calculate total duration
		const startTimes = spans.map((s) => s.startTime.getTime());
		const endTimes = spans
			.filter((s) => s.endTime)
			.map((s) => s.endTime?.getTime() ?? 0);

		const totalDurationMs =
			endTimes.length > 0 ? Math.max(...endTimes) - Math.min(...startTimes) : 0;

		// Find critical path (longest chain of dependent spans)
		const criticalPath = this.findCriticalPath(spans);

		return { spans, totalDurationMs, criticalPath };
	}

	/**
	 * Export trace data for external systems
	 *
	 * @param correlationId - Correlation ID
	 * @param format - Export format
	 * @returns Formatted trace data
	 */
	exportTrace(correlationId: string, format: "json" | "otlp" = "json"): string {
		const spans = this.getSpans(correlationId);
		const events = this.getEvents(correlationId);

		if (format === "json") {
			return JSON.stringify(
				{
					correlationId,
					spans,
					events,
					summary: {
						totalSpans: spans.length,
						successfulSpans: spans.filter((s) => s.status === "success").length,
						failedSpans: spans.filter((s) => s.status === "error").length,
					},
				},
				null,
				2,
			);
		}

		// OTLP format (simplified)
		// In production, use proper OTLP library
		return JSON.stringify({
			resourceSpans: [
				{
					resource: {
						attributes: [
							{
								key: "service.name",
								value: { stringValue: "a2a-orchestrator" },
							},
						],
					},
					scopeSpans: [
						{
							spans: spans.map((span) => ({
								traceId: correlationId,
								spanId: span.spanId,
								parentSpanId: span.parentSpanId,
								name: span.toolName,
								startTimeUnixNano: span.startTime.getTime() * 1000000,
								endTimeUnixNano: span.endTime
									? span.endTime.getTime() * 1000000
									: undefined,
								status: {
									code: span.status === "success" ? 1 : 2,
									message: span.error,
								},
								attributes: [
									{ key: "tool.name", value: { stringValue: span.toolName } },
									{ key: "depth", value: { intValue: span.depth } },
									{
										key: "input.hash",
										value: { stringValue: span.inputHash },
									},
								],
							})),
						},
					],
				},
			],
		});
	}

	/**
	 * Clear all traces (for testing)
	 */
	clear(): void {
		this.events = [];
		this.spans.clear();
		this.activeSpans.clear();
	}

	/**
	 * Get summary statistics
	 */
	getSummary(): {
		totalChains: number;
		totalSpans: number;
		totalEvents: number;
		avgSpansPerChain: number;
	} {
		const correlationIds = new Set(this.events.map((e) => e.correlationId));

		return {
			totalChains: correlationIds.size,
			totalSpans: this.spans.size,
			totalEvents: this.events.length,
			avgSpansPerChain:
				correlationIds.size > 0 ? this.spans.size / correlationIds.size : 0,
		};
	}

	/**
	 * Add a trace event
	 */
	private addEvent(event: TraceEvent): void {
		this.events.push(event);

		// Keep only last 1000 events to prevent memory leaks
		if (this.events.length > 1000) {
			this.events = this.events.slice(-1000);
		}
	}

	/**
	 * Generate a unique span ID
	 */
	private generateSpanId(): string {
		return `span_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
	}

	/**
	 * Find critical path through spans
	 */
	private findCriticalPath(spans: TraceSpan[]): string[] {
		// Build dependency graph
		const graph = new Map<string, string[]>();
		const durations = new Map<string, number>();

		for (const span of spans) {
			durations.set(span.spanId, span.durationMs || 0);

			if (span.parentSpanId) {
				if (!graph.has(span.parentSpanId)) {
					graph.set(span.parentSpanId, []);
				}
				const children = graph.get(span.parentSpanId);
				if (children) {
					children.push(span.spanId);
				}
			}
		}

		// Find longest path using DFS
		let longestPath: string[] = [];
		let longestDuration = 0;

		function dfs(spanId: string, path: string[], totalDuration: number): void {
			path.push(spanId);
			totalDuration += durations.get(spanId) || 0;

			const children = graph.get(spanId) || [];

			if (children.length === 0) {
				if (totalDuration > longestDuration) {
					longestDuration = totalDuration;
					longestPath = [...path];
				}
			} else {
				for (const child of children) {
					dfs(child, path, totalDuration);
				}
			}

			path.pop();
		}

		// Start from root spans (those without parents)
		const rootSpans = spans.filter((s) => !s.parentSpanId);
		for (const root of rootSpans) {
			dfs(root.spanId, [], 0);
		}

		// Convert span IDs to tool names
		return longestPath.map(
			(spanId) => spans.find((s) => s.spanId === spanId)?.toolName || spanId,
		);
	}
}

/**
 * Singleton trace logger instance
 */
export const traceLogger = new TraceLogger();

/**
 * Helper: Create trace from A2A context execution log
 *
 * @param context - A2A context
 * @returns Trace data
 */
export function createTraceFromContext(context: A2AContext): {
	correlationId: string;
	spans: TraceSpan[];
	totalDurationMs: number;
} {
	const spans: TraceSpan[] = context.executionLog.map((entry, index) => ({
		spanId: `span_${index}`,
		parentSpanId: entry.parentToolName
			? `parent_${entry.parentToolName}`
			: undefined,
		correlationId: context.correlationId,
		toolName: entry.toolName,
		startTime: new Date(entry.timestamp.getTime() - entry.durationMs),
		endTime: entry.timestamp,
		durationMs: entry.durationMs,
		depth: entry.depth,
		status: entry.status === "success" ? "success" : "error",
		error: entry.errorDetails,
		inputHash: entry.inputHash,
		outputSummary: entry.outputSummary,
	}));

	const totalDurationMs = spans.reduce(
		(sum, span) => sum + (span.durationMs || 0),
		0,
	);

	return {
		correlationId: context.correlationId,
		spans,
		totalDurationMs,
	};
}
