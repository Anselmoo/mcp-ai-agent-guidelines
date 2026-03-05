/**
 * Utility functions for working with ExecutionTrace.
 *
 * Provides factory functions, timing helpers, and trace aggregation utilities.
 */

import { ExecutionTrace } from "./execution-trace.js";
import type { ExecutionTraceData } from "./types.js";

/**
 * Create a new execution trace for a strategy.
 *
 * @param strategyName - Name of the strategy
 * @param strategyVersion - Version of the strategy
 * @returns New ExecutionTrace instance
 */
export function createTrace(
	strategyName: string,
	strategyVersion: string,
): ExecutionTrace {
	return new ExecutionTrace(strategyName, strategyVersion);
}

/**
 * Merge multiple traces into a summary.
 *
 * Useful for aggregating traces from sub-strategies or parallel execution.
 */
export function mergeTraces(traces: ExecutionTraceData[]): {
	totalDuration: number;
	totalDecisions: number;
	totalErrors: number;
	metrics: Record<string, number>;
} {
	let totalDuration = 0;
	let totalDecisions = 0;
	let totalErrors = 0;
	const metrics: Record<string, number> = {};

	for (const trace of traces) {
		totalDecisions += trace.decisions.length;
		totalErrors += trace.errors.length;

		if (trace.completedAt && trace.startedAt) {
			totalDuration += trace.completedAt.getTime() - trace.startedAt.getTime();
		}

		for (const [key, value] of Object.entries(trace.metrics)) {
			metrics[key] = (metrics[key] ?? 0) + value;
		}
	}

	return { totalDuration, totalDecisions, totalErrors, metrics };
}

/**
 * Create a timing helper for measuring durations.
 *
 * @param trace - Trace to record timing to
 * @param metricName - Name of the timing metric
 * @returns Function to call when operation completes
 *
 * @example
 * ```typescript
 * const endTiming = startTiming(trace, 'generation_time_ms');
 * await generateDocument();
 * endTiming(); // Records duration to trace
 * ```
 */
export function startTiming(
	trace: ExecutionTrace,
	metricName: string,
): () => number {
	const startTime = Date.now();

	return () => {
		const duration = Date.now() - startTime;
		trace.recordMetric(metricName, duration);
		return duration;
	};
}

/**
 * Wrap an async operation with automatic error tracing.
 *
 * @param trace - Trace to record to
 * @param operation - Async operation to wrap
 * @param context - Context to include if error occurs
 *
 * @example
 * ```typescript
 * const result = await withErrorTracing(
 *   trace,
 *   () => fetchData(url),
 *   { url, operation: 'fetch-data' }
 * );
 * ```
 */
export async function withErrorTracing<T>(
	trace: ExecutionTrace,
	operation: () => Promise<T>,
	context: Record<string, unknown> = {},
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		trace.recordError(
			error instanceof Error ? error : new Error(String(error)),
			context,
		);
		throw error;
	}
}
