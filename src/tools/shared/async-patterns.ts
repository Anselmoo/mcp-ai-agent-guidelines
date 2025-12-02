/**
 * Async Patterns for A2A Orchestration
 *
 * Provides common async orchestration patterns:
 * - Map-Reduce for parallel processing with aggregation
 * - Pipeline with transformations between steps
 * - Conditional branching based on runtime state
 * - Scatter-Gather for fan-out/fan-in patterns
 */

import type { A2AContext } from "./a2a-context.js";
import { OrchestrationError } from "./a2a-errors.js";
import { logger } from "./logger.js";
import { batchInvoke, invokeTool } from "./tool-invoker.js";
import type { ToolResult } from "./tool-registry.js";

/**
 * Map-Reduce pattern: Apply a tool to multiple inputs in parallel, then reduce
 *
 * @param toolName - Tool to apply to each input
 * @param inputs - Array of inputs
 * @param context - A2A context
 * @param reducer - Function to combine results
 * @returns Reduced result
 */
export async function mapReduceTools<T, R>(
	toolName: string,
	inputs: T[],
	context: A2AContext,
	reducer: (results: ToolResult[]) => R,
): Promise<R> {
	logger.info("Starting map-reduce operation", {
		toolName,
		inputCount: inputs.length,
		correlationId: context.correlationId,
	});

	// Map: Execute tool for each input in parallel
	const invocations = inputs.map((input) => ({
		toolName,
		args: input,
	}));

	const results = await batchInvoke(invocations, context);

	// Check for failures
	const failures = results.filter((r) => !r.success);
	if (failures.length > 0) {
		logger.warn(`Map-reduce: ${failures.length} invocations failed`, {
			toolName,
			failureCount: failures.length,
		});
	}

	// Reduce: Combine results
	return reducer(results);
}

/**
 * Pipeline pattern: Chain tools with transformations between steps
 *
 * @param pipeline - Array of pipeline steps
 * @param context - A2A context
 * @param initialInput - Initial input for first tool
 * @returns Final result
 */
export async function pipelineTools(
	pipeline: Array<{
		toolName: string;
		transform?: (previousOutput: unknown) => unknown;
	}>,
	context: A2AContext,
	initialInput?: unknown,
): Promise<ToolResult> {
	logger.info("Starting pipeline execution", {
		stageCount: pipeline.length,
		correlationId: context.correlationId,
	});

	let currentInput = initialInput;

	for (let i = 0; i < pipeline.length; i++) {
		const stage = pipeline[i];

		// Apply transform if provided
		const args = stage.transform ? stage.transform(currentInput) : currentInput;

		logger.debug(`Pipeline stage ${i + 1}/${pipeline.length}`, {
			toolName: stage.toolName,
		});

		const result = await invokeTool(stage.toolName, args, context);

		if (!result.success) {
			throw new OrchestrationError(
				`Pipeline failed at stage ${i + 1} (${stage.toolName}): ${result.error}`,
				{ stage: i + 1, toolName: stage.toolName },
			);
		}

		currentInput = result.data;
	}

	return {
		success: true,
		data: currentInput,
	};
}

/**
 * Conditional branch pattern: Execute one of two tools based on a condition
 *
 * @param condition - Function to evaluate condition
 * @param trueBranch - Tool to execute if condition is true
 * @param falseBranch - Tool to execute if condition is false
 * @param args - Arguments for the selected tool
 * @param context - A2A context
 * @returns Result from the executed branch
 */
export async function branchOnCondition(
	condition: (state: Map<string, unknown>) => boolean,
	trueBranch: string,
	falseBranch: string,
	args: unknown,
	context: A2AContext,
): Promise<ToolResult> {
	const shouldExecuteTrueBranch = condition(context.sharedState);

	const selectedTool = shouldExecuteTrueBranch ? trueBranch : falseBranch;

	logger.info("Executing conditional branch", {
		condition: shouldExecuteTrueBranch,
		selectedTool,
		correlationId: context.correlationId,
	});

	return invokeTool(selectedTool, args, context);
}

/**
 * Scatter-Gather pattern: Fan out to multiple tools, then gather results
 *
 * @param tools - Array of tools to invoke
 * @param args - Arguments (can be per-tool or shared)
 * @param context - A2A context
 * @param gatherer - Function to process gathered results
 * @returns Gathered result
 */
export async function scatterGatherTools<R>(
	tools: Array<{
		toolName: string;
		args: unknown;
	}>,
	context: A2AContext,
	gatherer: (results: Map<string, ToolResult>) => R,
): Promise<R> {
	logger.info("Starting scatter-gather operation", {
		toolCount: tools.length,
		correlationId: context.correlationId,
	});

	// Scatter: Execute all tools in parallel
	const invocations = tools.map(({ toolName, args }) => ({
		toolName,
		args,
	}));

	const results = await batchInvoke(invocations, context);

	// Create map of tool name to result
	const resultMap = new Map<string, ToolResult>();
	for (let i = 0; i < tools.length; i++) {
		resultMap.set(tools[i].toolName, results[i]);
	}

	// Gather: Process all results
	return gatherer(resultMap);
}

/**
 * Fan-out pattern: Execute a tool multiple times with different arguments
 *
 * @param toolName - Tool to execute
 * @param argsArray - Array of argument sets
 * @param context - A2A context
 * @param maxConcurrency - Maximum concurrent executions (undefined = unlimited)
 * @returns Array of results
 */
export async function fanOut(
	toolName: string,
	argsArray: unknown[],
	context: A2AContext,
	maxConcurrency?: number,
): Promise<ToolResult[]> {
	logger.info("Starting fan-out operation", {
		toolName,
		executionCount: argsArray.length,
		maxConcurrency,
		correlationId: context.correlationId,
	});

	if (!maxConcurrency || maxConcurrency >= argsArray.length) {
		// Execute all in parallel
		const invocations = argsArray.map((args) => ({ toolName, args }));
		return batchInvoke(invocations, context);
	}

	// Execute with concurrency limit
	const results: ToolResult[] = [];
	const chunks = chunkArray(argsArray, maxConcurrency);

	for (const chunk of chunks) {
		const invocations = chunk.map((args) => ({ toolName, args }));
		const chunkResults = await batchInvoke(invocations, context);
		results.push(...chunkResults);
	}

	return results;
}

/**
 * Waterfall pattern: Execute tools in sequence, each using the previous result
 *
 * Similar to pipeline but without explicit transforms (tools handle previous output)
 *
 * @param tools - Array of tool names
 * @param context - A2A context
 * @param initialInput - Initial input
 * @returns Final result
 */
export async function waterfallTools(
	tools: string[],
	context: A2AContext,
	initialInput?: unknown,
): Promise<ToolResult> {
	logger.info("Starting waterfall execution", {
		toolCount: tools.length,
		correlationId: context.correlationId,
	});

	let currentData = initialInput;

	for (const toolName of tools) {
		const result = await invokeTool(toolName, currentData, context);

		if (!result.success) {
			return result; // Propagate failure
		}

		currentData = result.data;
	}

	return {
		success: true,
		data: currentData,
	};
}

/**
 * Race pattern: Execute multiple tools in parallel, return first success
 *
 * @param tools - Array of tools to race
 * @param args - Arguments (can be per-tool or shared)
 * @param context - A2A context
 * @returns First successful result
 */
export async function raceTools(
	tools: Array<{
		toolName: string;
		args: unknown;
	}>,
	context: A2AContext,
): Promise<ToolResult> {
	logger.info("Starting race operation", {
		toolCount: tools.length,
		correlationId: context.correlationId,
	});

	const promises = tools.map(async ({ toolName, args }) => {
		const result = await invokeTool(toolName, args, context);
		if (result.success) {
			return result;
		}
		throw new Error(`Tool ${toolName} failed: ${result.error}`);
	});

	try {
		// Return first successful result
		return await Promise.race(promises);
	} catch (error) {
		// All failed
		return {
			success: false,
			error: `All tools failed in race: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Retry pattern: Retry a tool invocation with exponential backoff
 *
 * @param toolName - Tool to retry
 * @param args - Tool arguments
 * @param context - A2A context
 * @param maxRetries - Maximum retry attempts
 * @param initialDelayMs - Initial delay before first retry
 * @param backoffMultiplier - Multiplier for exponential backoff
 * @returns Tool result
 */
export async function retryTool(
	toolName: string,
	args: unknown,
	context: A2AContext,
	maxRetries = 3,
	initialDelayMs = 1000,
	backoffMultiplier = 2,
): Promise<ToolResult> {
	let lastError: Error | undefined;
	let delayMs = initialDelayMs;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const result = await invokeTool(toolName, args, context);

			if (result.success) {
				return result;
			}

			lastError = new Error(result.error || "Tool execution failed");
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
		}

		if (attempt < maxRetries) {
			logger.warn(
				`Retry attempt ${attempt + 1}/${maxRetries} for ${toolName}`,
				{
					delayMs,
				},
			);
			await sleep(delayMs);
			delayMs *= backoffMultiplier;
		}
	}

	return {
		success: false,
		error: `Failed after ${maxRetries} retries: ${lastError?.message}`,
	};
}

/**
 * Fallback pattern: Try primary tool, fall back to secondary if it fails
 *
 * @param primaryTool - Primary tool to try
 * @param fallbackTool - Fallback tool if primary fails
 * @param args - Tool arguments
 * @param context - A2A context
 * @returns Result from primary or fallback
 */
export async function fallbackTool(
	primaryTool: string,
	fallbackTool: string,
	args: unknown,
	context: A2AContext,
): Promise<ToolResult> {
	logger.info("Trying primary tool", {
		primaryTool,
		fallbackTool,
		correlationId: context.correlationId,
	});

	const primaryResult = await invokeTool(primaryTool, args, context);

	if (primaryResult.success) {
		return primaryResult;
	}

	logger.warn("Primary tool failed, trying fallback", {
		primaryTool,
		fallbackTool,
		primaryError: primaryResult.error,
	});

	return invokeTool(fallbackTool, args, context);
}

/**
 * Helper: Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}

/**
 * Helper: Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Common reducer functions for map-reduce
 */
export const reducers = {
	/**
	 * Collect all successful results into an array
	 */
	collectSuccessful: (results: ToolResult[]): unknown[] =>
		results.filter((r) => r.success).map((r) => r.data),

	/**
	 * Count successful executions
	 */
	countSuccessful: (results: ToolResult[]): number =>
		results.filter((r) => r.success).length,

	/**
	 * Check if all executions succeeded
	 */
	allSucceeded: (results: ToolResult[]): boolean =>
		results.every((r) => r.success),

	/**
	 * Check if any execution succeeded
	 */
	anySucceeded: (results: ToolResult[]): boolean =>
		results.some((r) => r.success),

	/**
	 * Merge all results into a single object
	 */
	mergeResults: (results: ToolResult[]): Record<string, unknown> => {
		const merged: Record<string, unknown> = {};
		for (const result of results) {
			if (result.success && result.data) {
				Object.assign(merged, result.data);
			}
		}
		return merged;
	},
};
