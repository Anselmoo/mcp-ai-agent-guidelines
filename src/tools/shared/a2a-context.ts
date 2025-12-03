/**
 * Agent-to-Agent (A2A) Context Management
 *
 * Provides context propagation, state management, and execution tracing
 * for tool-to-tool invocation chains within the MCP server.
 *
 * Key Features:
 * - Correlation ID tracking for distributed tracing
 * - Recursion depth guards to prevent infinite loops
 * - Shared state management across tool invocations
 * - Execution audit trail for observability
 * - Timeout enforcement per step and total chain
 */

/**
 * Execution log entry for a single tool invocation
 */
export interface ExecutionLogEntry {
	/** Timestamp when the tool was invoked */
	timestamp: Date;
	/** Name of the tool that was invoked */
	toolName: string;
	/** Hash of input parameters for deduplication */
	inputHash: string;
	/** Summary of the tool's output */
	outputSummary: string;
	/** Duration of tool execution in milliseconds */
	durationMs: number;
	/** Execution status */
	status: "success" | "error" | "skipped";
	/** Error details if status is 'error' */
	errorDetails?: string;
	/** Parent tool that invoked this tool (if nested) */
	parentToolName?: string;
	/** Nesting depth at time of invocation */
	depth: number;
}

/**
 * A2A Context for managing tool-to-tool invocation state
 *
 * This context is passed between tools during orchestration to:
 * - Track execution flow with correlation IDs
 * - Prevent infinite recursion with depth tracking
 * - Share state between tool invocations
 * - Maintain audit trail for debugging and monitoring
 */
export interface A2AContext {
	/** Unique trace ID for the entire invocation chain */
	correlationId: string;
	/** Name of the calling tool (undefined for initial invocation) */
	parentToolName?: string;
	/** Current nesting depth (0 for top-level invocation) */
	depth: number;
	/** Maximum allowed recursion depth (default: 10) */
	maxDepth: number;
	/** Shared state accessible to all tools in the chain */
	sharedState: Map<string, unknown>;
	/** Audit trail of all tool invocations */
	executionLog: ExecutionLogEntry[];
	/** Timeout for individual tool invocations (milliseconds) */
	timeoutMs?: number;
	/** Start time of the entire chain execution */
	chainStartTime: Date;
	/** Maximum total chain execution time (milliseconds) */
	chainTimeoutMs?: number;
}

/**
 * Default configuration for A2A contexts
 */
export const A2A_DEFAULTS = {
	/** Default maximum recursion depth */
	MAX_DEPTH: 10,
	/** Default per-tool timeout (30 seconds) */
	DEFAULT_TIMEOUT_MS: 30000,
	/** Default total chain timeout (5 minutes) */
	DEFAULT_CHAIN_TIMEOUT_MS: 300000,
} as const;

/**
 * Create a new A2A context for a top-level tool invocation
 *
 * @param correlationId - Optional correlation ID (generated if not provided)
 * @param config - Optional configuration overrides
 * @returns A new A2A context
 */
export function createA2AContext(
	correlationId?: string,
	config?: {
		maxDepth?: number;
		timeoutMs?: number;
		chainTimeoutMs?: number;
	},
): A2AContext {
	return {
		correlationId: correlationId || generateCorrelationId(),
		depth: 0,
		maxDepth: config?.maxDepth ?? A2A_DEFAULTS.MAX_DEPTH,
		sharedState: new Map(),
		executionLog: [],
		timeoutMs: config?.timeoutMs ?? A2A_DEFAULTS.DEFAULT_TIMEOUT_MS,
		chainStartTime: new Date(),
		chainTimeoutMs:
			config?.chainTimeoutMs ?? A2A_DEFAULTS.DEFAULT_CHAIN_TIMEOUT_MS,
	};
}

/**
 * Create a child context for a nested tool invocation
 *
 * @param parent - Parent context
 * @param toolName - Name of the calling tool
 * @returns A new child context
 * @throws Error if maximum depth would be exceeded
 */
export function createChildContext(
	parent: A2AContext,
	toolName: string,
): A2AContext {
	const newDepth = parent.depth + 1;

	if (newDepth > parent.maxDepth) {
		throw new Error(
			`Maximum recursion depth (${parent.maxDepth}) exceeded. ` +
				`Current depth: ${newDepth}, Parent: ${toolName}`,
		);
	}

	return {
		...parent,
		parentToolName: toolName,
		depth: newDepth,
		// Share the same state and log references
		sharedState: parent.sharedState,
		executionLog: parent.executionLog,
	};
}

/**
 * Add an execution log entry to the context
 *
 * @param context - A2A context
 * @param entry - Execution log entry to add
 */
export function addExecutionLogEntry(
	context: A2AContext,
	entry: Omit<ExecutionLogEntry, "timestamp" | "depth">,
): void {
	context.executionLog.push({
		...entry,
		timestamp: new Date(),
		depth: context.depth,
	});
}

/**
 * Check if the chain has exceeded its total timeout
 *
 * @param context - A2A context
 * @returns true if chain has timed out
 */
export function hasChainTimedOut(context: A2AContext): boolean {
	if (!context.chainTimeoutMs) {
		return false;
	}

	const elapsed = Date.now() - context.chainStartTime.getTime();
	return elapsed > context.chainTimeoutMs;
}

/**
 * Get remaining time in milliseconds for the chain
 *
 * @param context - A2A context
 * @returns Remaining time in milliseconds (undefined if no timeout set)
 */
export function getRemainingChainTime(context: A2AContext): number | undefined {
	if (!context.chainTimeoutMs) {
		return undefined;
	}

	const elapsed = Date.now() - context.chainStartTime.getTime();
	const remaining = context.chainTimeoutMs - elapsed;
	return Math.max(0, remaining);
}

/**
 * Generate a unique correlation ID
 *
 * Format: a2a_<timestamp>_<random>
 */
function generateCorrelationId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 10);
	return `a2a_${timestamp}_${random}`;
}

/**
 * Create a hash of input parameters for deduplication
 *
 * @param input - Input parameters
 * @returns Hash string
 *
 * @remarks
 * This is a demonstration implementation using a simple string-based hash.
 * For production deployments, replace with a proper hashing library like
 * `crypto.createHash('sha256')` for better collision resistance and performance
 * with large inputs.
 *
 * @example
 * ```typescript
 * // Production implementation:
 * import { createHash } from 'crypto';
 * const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
 * ```
 */
export function hashInput(input: unknown): string {
	// Simple hash implementation using JSON stringification
	// NOTE: This is a demonstration implementation with potential collisions
	const str = JSON.stringify(input) || "";
	let hash = 0;

	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return hash.toString(36);
}

/**
 * Get execution summary from context
 *
 * @param context - A2A context
 * @returns Execution summary
 */
export function getExecutionSummary(context: A2AContext): {
	correlationId: string;
	totalDurationMs: number;
	toolCount: number;
	successCount: number;
	errorCount: number;
	skippedCount: number;
	maxDepthReached: number;
} {
	const totalDurationMs = context.executionLog.reduce(
		(sum, entry) => sum + entry.durationMs,
		0,
	);

	const successCount = context.executionLog.filter(
		(entry) => entry.status === "success",
	).length;

	const errorCount = context.executionLog.filter(
		(entry) => entry.status === "error",
	).length;

	const skippedCount = context.executionLog.filter(
		(entry) => entry.status === "skipped",
	).length;

	const maxDepthReached = Math.max(
		...context.executionLog.map((entry) => entry.depth),
		0,
	);

	return {
		correlationId: context.correlationId,
		totalDurationMs,
		toolCount: context.executionLog.length,
		successCount,
		errorCount,
		skippedCount,
		maxDepthReached,
	};
}
