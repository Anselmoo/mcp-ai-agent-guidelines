/**
 * Base Strategy domain module.
 *
 * Provides ExecutionTrace for logging decisions, metrics, and errors
 * during strategy execution.
 */

// Core class
export { ExecutionTrace } from "./execution-trace.js";
// Utilities
export {
	createTrace,
	mergeTraces,
	startTiming,
	withErrorTracing,
} from "./trace-utils.js";
// Types
export type { Decision, ExecutionTraceData, TracedError } from "./types.js";
