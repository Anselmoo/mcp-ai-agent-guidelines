/**
 * Tool Invoker - Core runtime for A2A tool orchestration
 *
 * Provides the execution layer for tool-to-tool invocations with:
 * - Timeout enforcement
 * - Recursion depth guards
 * - Context propagation
 * - Execution logging
 * - Error handling and recovery
 */

import {
	type A2AContext,
	addExecutionLogEntry,
	createChildContext,
	getRemainingChainTime,
	hasChainTimedOut,
	hashInput,
} from "./a2a-context.js";
import {
	ChainTimeoutError,
	RecursionDepthError,
	ToolInvocationError,
	ToolTimeoutError,
} from "./a2a-errors.js";
import { logger } from "./logger.js";
import type { ToolResult } from "./tool-registry.js";
import { toolRegistry } from "./tool-registry.js";

/**
 * Options for tool invocation
 */
export interface InvokeOptions {
	/** Override timeout for this specific invocation */
	timeoutMs?: number;
	/** Skip execution if inputs match a recent invocation (deduplication) */
	deduplicate?: boolean;
	/** Custom error handler for this invocation */
	onError?: (error: Error) => ToolResult | Promise<ToolResult>;
}

/**
 * Invoke a tool with A2A context support
 *
 * This is the primary entry point for tool-to-tool invocations.
 * It handles:
 * - Context creation/propagation
 * - Recursion depth checking
 * - Timeout enforcement
 * - Execution logging
 * - Error handling
 *
 * @param toolName - Name of the tool to invoke
 * @param args - Arguments to pass to the tool
 * @param context - A2A context (optional for top-level, required for nested)
 * @param options - Invocation options
 * @returns Tool execution result
 * @throws RecursionDepthError if maximum depth exceeded
 * @throws ChainTimeoutError if chain timeout exceeded
 * @throws ToolTimeoutError if tool timeout exceeded
 * @throws ToolInvocationError if tool execution fails
 */
export async function invokeTool(
	toolName: string,
	args: unknown,
	context?: A2AContext,
	options?: InvokeOptions,
): Promise<ToolResult> {
	// If context provided, create child context; otherwise this is top-level
	let executionContext = context;
	if (context) {
		try {
			executionContext = createChildContext(context, toolName);
		} catch (error) {
			if (error instanceof Error && error.message.includes("depth")) {
				const depthError = new RecursionDepthError(
					context.depth + 1,
					context.maxDepth,
					{ toolName, parentTool: context.parentToolName },
				);
				throw depthError;
			}
			throw error;
		}
	}

	// Check chain timeout if context exists
	if (executionContext && hasChainTimedOut(executionContext)) {
		const error = new ChainTimeoutError(
			executionContext.chainTimeoutMs || 0,
			executionContext.executionLog.length,
			{ toolName },
		);
		throw error;
	}

	const startTime = Date.now();
	const inputHash = hashInput(args);

	// Check for duplicate invocations if requested
	if (options?.deduplicate && executionContext) {
		const duplicate = findDuplicateInvocation(
			executionContext,
			toolName,
			inputHash,
		);
		if (duplicate) {
			logger.debug(`Skipping duplicate invocation of ${toolName}`, {
				inputHash,
				originalTimestamp: duplicate.timestamp,
			});

			// Return cached result from log
			return {
				success: duplicate.status === "success",
				data: { cached: true, outputSummary: duplicate.outputSummary },
				metadata: {
					toolName,
					durationMs: 0,
					timestamp: new Date(),
				},
			};
		}
	}

	// Determine timeout (use option, context, or chain remaining time)
	let timeoutMs = options?.timeoutMs || executionContext?.timeoutMs;
	if (executionContext) {
		const remainingTime = getRemainingChainTime(executionContext);
		if (remainingTime !== undefined && timeoutMs) {
			timeoutMs = Math.min(timeoutMs, remainingTime);
		}
	}

	// Execute tool with timeout
	try {
		const result = await executeWithTimeout(
			() => toolRegistry.invoke(toolName, args, executionContext),
			timeoutMs,
			toolName,
		);

		const durationMs = Date.now() - startTime;

		// Log successful execution
		if (executionContext) {
			addExecutionLogEntry(executionContext, {
				toolName,
				inputHash,
				outputSummary: summarizeOutput(result.data),
				durationMs,
				status: result.success ? "success" : "error",
				errorDetails: result.error,
				parentToolName: executionContext.parentToolName,
			});
		}

		logger.info(`Tool '${toolName}' executed successfully`, {
			durationMs,
			depth: executionContext?.depth,
			correlationId: executionContext?.correlationId,
		});

		return result;
	} catch (error) {
		const durationMs = Date.now() - startTime;

		// Handle custom error handler if provided
		if (options?.onError) {
			try {
				const recoveryResult = await options.onError(
					error instanceof Error ? error : new Error(String(error)),
				);

				// Log error with recovery
				if (executionContext) {
					addExecutionLogEntry(executionContext, {
						toolName,
						inputHash,
						outputSummary: summarizeOutput(recoveryResult.data),
						durationMs,
						status: "success",
						errorDetails: `Recovered: ${error instanceof Error ? error.message : String(error)}`,
						parentToolName: executionContext.parentToolName,
					});
				}

				return recoveryResult;
			} catch (recoveryError) {
				// Recovery failed, continue with original error handling
				logger.error("Error recovery failed", {
					toolName,
					originalError: error instanceof Error ? error.message : String(error),
					recoveryError:
						recoveryError instanceof Error
							? recoveryError.message
							: String(recoveryError),
				});
			}
		}

		// Log failed execution
		if (executionContext) {
			addExecutionLogEntry(executionContext, {
				toolName,
				inputHash,
				outputSummary: "",
				durationMs,
				status: "error",
				errorDetails: error instanceof Error ? error.message : String(error),
				parentToolName: executionContext.parentToolName,
			});
		}

		// Re-throw as ToolInvocationError if not already an A2A error
		if (
			error instanceof RecursionDepthError ||
			error instanceof ChainTimeoutError ||
			error instanceof ToolTimeoutError
		) {
			throw error;
		}

		throw new ToolInvocationError(
			toolName,
			error instanceof Error ? error.message : String(error),
			{
				durationMs,
				depth: executionContext?.depth,
				correlationId: executionContext?.correlationId,
			},
		);
	}
}

/**
 * Execute a function with timeout
 *
 * @param fn - Function to execute
 * @param timeoutMs - Timeout in milliseconds (undefined = no timeout)
 * @param toolName - Tool name for error reporting
 * @returns Function result
 * @throws ToolTimeoutError if timeout exceeded
 */
async function executeWithTimeout<T>(
	fn: () => Promise<T>,
	timeoutMs: number | undefined,
	toolName: string,
): Promise<T> {
	if (!timeoutMs) {
		return fn();
	}

	return Promise.race([
		fn(),
		new Promise<T>((_, reject) => {
			setTimeout(() => {
				reject(new ToolTimeoutError(toolName, timeoutMs));
			}, timeoutMs);
		}),
	]);
}

/**
 * Find duplicate invocation in execution log
 *
 * @param context - A2A context
 * @param toolName - Tool name
 * @param inputHash - Input hash to match
 * @returns Matching log entry or undefined
 */
function findDuplicateInvocation(
	context: A2AContext,
	toolName: string,
	inputHash: string,
): (typeof context.executionLog)[0] | undefined {
	// Look for recent invocations (within last 10 entries) to avoid excessive searching
	const recentLog = context.executionLog.slice(-10);

	return recentLog.find(
		(entry) =>
			entry.toolName === toolName &&
			entry.inputHash === inputHash &&
			entry.status === "success",
	);
}

/**
 * Create a summary of tool output for logging
 *
 * @param output - Tool output
 * @returns Summary string (max 200 chars)
 */
function summarizeOutput(output: unknown): string {
	if (!output) {
		return "";
	}

	const str = JSON.stringify(output);
	return str.length > 200 ? `${str.substring(0, 200)}...` : str;
}

/**
 * Batch invoke multiple tools in parallel
 *
 * @param invocations - Array of tool invocations
 * @param context - Optional A2A context
 * @returns Array of results (in same order as invocations)
 */
export async function batchInvoke(
	invocations: Array<{
		toolName: string;
		args: unknown;
		options?: InvokeOptions;
	}>,
	context?: A2AContext,
): Promise<ToolResult[]> {
	const promises = invocations.map((inv) =>
		invokeTool(inv.toolName, inv.args, context, inv.options),
	);

	return Promise.all(promises);
}

/**
 * Invoke tools sequentially, passing output from one to the next
 *
 * @param chain - Array of tool invocations with optional transform functions
 * @param context - Optional A2A context
 * @param initialInput - Initial input for first tool
 * @returns Final tool result
 */
export async function invokeSequence(
	chain: Array<{
		toolName: string;
		transform?: (previousOutput: unknown) => unknown;
		options?: InvokeOptions;
	}>,
	context?: A2AContext,
	initialInput?: unknown,
): Promise<ToolResult> {
	let currentInput = initialInput;
	let lastResult: ToolResult = { success: true, data: currentInput };

	for (const step of chain) {
		// Apply transform if provided
		const args = step.transform ? step.transform(currentInput) : currentInput;

		lastResult = await invokeTool(step.toolName, args, context, step.options);

		if (!lastResult.success) {
			// Stop on first failure
			return lastResult;
		}

		currentInput = lastResult.data;
	}

	return lastResult;
}
