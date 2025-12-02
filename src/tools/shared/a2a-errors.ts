/**
 * A2A-specific error types for tool orchestration
 *
 * Extends the base error system with specialized errors for:
 * - Tool invocation failures
 * - Recursion depth violations
 * - Timeout enforcement
 * - Orchestration workflow errors
 */

import { OperationError } from "./errors.js";

/**
 * Error thrown when a tool invocation fails
 */
export class ToolInvocationError extends OperationError {
	public readonly toolName: string;

	constructor(
		toolName: string,
		message: string,
		context?: Record<string, unknown>,
	) {
		super(message, "TOOL_INVOCATION_ERROR", {
			...context,
			toolName,
		});
		this.name = "ToolInvocationError";
		this.toolName = toolName;
	}
}

/**
 * Error thrown when recursion depth limit is exceeded
 */
export class RecursionDepthError extends OperationError {
	public readonly currentDepth: number;
	public readonly maxDepth: number;

	constructor(
		currentDepth: number,
		maxDepth: number,
		context?: Record<string, unknown>,
	) {
		super(
			`Recursion depth limit exceeded: ${currentDepth} > ${maxDepth}`,
			"RECURSION_DEPTH_ERROR",
			{
				...context,
				currentDepth,
				maxDepth,
			},
		);
		this.name = "RecursionDepthError";
		this.currentDepth = currentDepth;
		this.maxDepth = maxDepth;
	}
}

/**
 * Error thrown when a tool execution times out
 */
export class ToolTimeoutError extends OperationError {
	public readonly toolName: string;
	public readonly timeoutMs: number;

	constructor(
		toolName: string,
		timeoutMs: number,
		context?: Record<string, unknown>,
	) {
		super(
			`Tool '${toolName}' timed out after ${timeoutMs}ms`,
			"TOOL_TIMEOUT_ERROR",
			{
				...context,
				toolName,
				timeoutMs,
			},
		);
		this.name = "ToolTimeoutError";
		this.toolName = toolName;
		this.timeoutMs = timeoutMs;
	}
}

/**
 * Error thrown when the entire chain execution times out
 */
export class ChainTimeoutError extends OperationError {
	public readonly chainTimeoutMs: number;
	public readonly toolsCompleted: number;

	constructor(
		chainTimeoutMs: number,
		toolsCompleted: number,
		context?: Record<string, unknown>,
	) {
		super(
			`Chain execution timed out after ${chainTimeoutMs}ms (${toolsCompleted} tools completed)`,
			"CHAIN_TIMEOUT_ERROR",
			{
				...context,
				chainTimeoutMs,
				toolsCompleted,
			},
		);
		this.name = "ChainTimeoutError";
		this.chainTimeoutMs = chainTimeoutMs;
		this.toolsCompleted = toolsCompleted;
	}
}

/**
 * Error thrown when a tool is not found in the registry
 */
export class ToolNotFoundError extends OperationError {
	public readonly toolName: string;

	constructor(toolName: string, context?: Record<string, unknown>) {
		super(`Tool '${toolName}' not found in registry`, "TOOL_NOT_FOUND_ERROR", {
			...context,
			toolName,
		});
		this.name = "ToolNotFoundError";
		this.toolName = toolName;
	}
}

/**
 * Error thrown when a tool is not allowed to invoke another tool
 */
export class ToolInvocationNotAllowedError extends OperationError {
	public readonly callerTool: string;
	public readonly targetTool: string;

	constructor(
		callerTool: string,
		targetTool: string,
		context?: Record<string, unknown>,
	) {
		super(
			`Tool '${callerTool}' is not allowed to invoke '${targetTool}'`,
			"TOOL_INVOCATION_NOT_ALLOWED_ERROR",
			{
				...context,
				callerTool,
				targetTool,
			},
		);
		this.name = "ToolInvocationNotAllowedError";
		this.callerTool = callerTool;
		this.targetTool = targetTool;
	}
}

/**
 * Error thrown when orchestration workflow execution fails
 */
export class OrchestrationError extends OperationError {
	public readonly workflowName?: string;

	constructor(
		message: string,
		context?: Record<string, unknown> & { workflowName?: string },
	) {
		super(message, "ORCHESTRATION_ERROR", context);
		this.name = "OrchestrationError";
		this.workflowName = context?.workflowName;
	}
}

/**
 * Error thrown when execution strategy is invalid or cannot be executed
 */
export class ExecutionStrategyError extends OperationError {
	public readonly strategy: string;

	constructor(
		strategy: string,
		message: string,
		context?: Record<string, unknown>,
	) {
		super(message, "EXECUTION_STRATEGY_ERROR", {
			...context,
			strategy,
		});
		this.name = "ExecutionStrategyError";
		this.strategy = strategy;
	}
}
