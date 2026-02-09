/**
 * Shared utilities and base classes for strategy implementations.
 * @module
 */

export type { StrategyConfig } from "./base-strategy.js";
export {
	BaseStrategy,
	isErrorResult,
	isSuccessResult,
} from "./base-strategy.js";

export { ExecutionTrace } from "./execution-trace.js";

export type {
	ExecutionTraceExport,
	StrategyResult,
	TraceEntry,
	TraceSummary,
	ValidationError,
	ValidationResult,
	ValidationWarning,
} from "./types.js";
