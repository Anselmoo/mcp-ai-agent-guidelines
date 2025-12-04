/**
 * Tool Registry for Agent-to-Agent (A2A) Orchestration
 *
 * Provides centralized tool management with:
 * - Tool registration and discovery
 * - Input/output schema validation
 * - Invocation permission management (allowlist)
 * - Tool capability matrix for orchestration planning
 */

import type { z } from "zod";
import type { A2AContext } from "./a2a-context.js";
import {
	ToolInvocationNotAllowedError,
	ToolNotFoundError,
} from "./a2a-errors.js";
import { logger } from "./logger.js";

/**
 * Result of a tool invocation
 */
export interface ToolResult {
	/** Whether the tool executed successfully */
	success: boolean;
	/** Tool output data (structure varies by tool) */
	data?: unknown;
	/** Error message if execution failed */
	error?: string;
	/** Additional metadata about the execution */
	metadata?: {
		toolName: string;
		durationMs: number;
		timestamp: Date;
	};
}

/**
 * Tool handler function signature
 */
export type ToolHandler = (
	args: unknown,
	context?: A2AContext,
) => Promise<ToolResult> | ToolResult;

/**
 * Tool descriptor with metadata and configuration
 */
export interface ToolDescriptor {
	/** Unique tool name (matches MCP tool name) */
	name: string;
	/** Human-readable description */
	description: string;
	/** Zod schema for input validation */
	inputSchema: z.ZodType;
	/** Optional Zod schema for output validation */
	outputSchema?: z.ZodType;
	/** List of tool names this tool is allowed to invoke */
	canInvoke: string[];
	/** Maximum concurrent invocations (undefined = unlimited) */
	maxConcurrency?: number;
	/** Optional tags for categorization */
	tags?: string[];
}

/**
 * Filter for listing tools
 */
export interface ToolFilter {
	/** Filter by tag */
	tags?: string[];
	/** Filter by name pattern (regex) */
	namePattern?: string;
	/** Filter by tools that can invoke a specific tool */
	canInvoke?: string;
}

/**
 * Tool Registry singleton for managing tool registration and invocation
 */
export class ToolRegistry {
	private tools: Map<string, ToolDescriptor> = new Map();
	private handlers: Map<string, ToolHandler> = new Map();
	private activeCalls: Map<string, number> = new Map();

	/**
	 * Register a tool with its handler
	 *
	 * @param tool - Tool descriptor
	 * @param handler - Tool handler function
	 * @throws Error if tool name is already registered
	 */
	register(tool: ToolDescriptor, handler: ToolHandler): void {
		if (this.tools.has(tool.name)) {
			throw new Error(`Tool '${tool.name}' is already registered`);
		}

		this.tools.set(tool.name, tool);
		this.handlers.set(tool.name, handler);
		this.activeCalls.set(tool.name, 0);

		logger.debug(`Registered tool: ${tool.name}`, {
			canInvoke: tool.canInvoke,
			tags: tool.tags,
		});
	}

	/**
	 * Check if a tool is registered
	 *
	 * @param toolName - Tool name to check
	 * @returns true if tool is registered
	 */
	has(toolName: string): boolean {
		return this.tools.has(toolName);
	}

	/**
	 * Get tool descriptor
	 *
	 * @param toolName - Tool name
	 * @returns Tool descriptor
	 * @throws ToolNotFoundError if tool not found
	 */
	getDescriptor(toolName: string): ToolDescriptor {
		const tool = this.tools.get(toolName);
		if (!tool) {
			throw new ToolNotFoundError(toolName);
		}
		return tool;
	}

	/**
	 * Invoke a tool with the given arguments and context
	 *
	 * @param toolName - Tool to invoke
	 * @param args - Tool arguments
	 * @param context - A2A context (optional for top-level invocations)
	 * @returns Tool result
	 * @throws ToolNotFoundError if tool not found
	 * @throws ToolInvocationNotAllowedError if caller not allowed to invoke tool
	 * @throws Error if concurrency limit exceeded
	 */
	async invoke(
		toolName: string,
		args: unknown,
		context?: A2AContext,
	): Promise<ToolResult> {
		const tool = this.getDescriptor(toolName);
		const handler = this.handlers.get(toolName);

		if (!handler) {
			throw new ToolNotFoundError(toolName);
		}

		// Check invocation permission if this is a nested call
		if (context?.parentToolName) {
			this.checkInvocationPermission(context.parentToolName, toolName);
		}

		// Check concurrency limit
		if (tool.maxConcurrency) {
			const activeCalls = this.activeCalls.get(toolName) || 0;
			if (activeCalls >= tool.maxConcurrency) {
				throw new Error(
					`Tool '${toolName}' has reached maximum concurrency (${tool.maxConcurrency})`,
				);
			}
		}

		// Validate input
		try {
			tool.inputSchema.parse(args);
		} catch (error) {
			logger.error(`Input validation failed for tool '${toolName}'`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return {
				success: false,
				error: `Input validation failed: ${error instanceof Error ? error.message : String(error)}`,
			};
		}

		// Track active calls
		this.activeCalls.set(toolName, (this.activeCalls.get(toolName) || 0) + 1);

		const startTime = Date.now();

		try {
			const result = await handler(args, context);

			// Validate output if schema provided
			if (tool.outputSchema && result.data) {
				try {
					tool.outputSchema.parse(result.data);
				} catch (error) {
					logger.warn(`Output validation failed for tool '${toolName}'`, {
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}

			return {
				...result,
				metadata: {
					toolName,
					durationMs: Date.now() - startTime,
					timestamp: new Date(),
				},
			};
		} finally {
			// Decrement active calls
			this.activeCalls.set(toolName, (this.activeCalls.get(toolName) || 1) - 1);
		}
	}

	/**
	 * Check if a tool is allowed to invoke another tool
	 *
	 * @param callerTool - Calling tool name
	 * @param targetTool - Target tool name
	 * @throws ToolInvocationNotAllowedError if not allowed
	 */
	private checkInvocationPermission(
		callerTool: string,
		targetTool: string,
	): void {
		const caller = this.getDescriptor(callerTool);

		// Check if target tool is in the allowlist
		// Empty array means no tools can be invoked
		// ['*'] means all tools can be invoked
		if (
			caller.canInvoke.length === 0 ||
			(!caller.canInvoke.includes("*") &&
				!caller.canInvoke.includes(targetTool))
		) {
			throw new ToolInvocationNotAllowedError(callerTool, targetTool, {
				allowedTools: caller.canInvoke,
			});
		}
	}

	/**
	 * List all registered tools with optional filtering
	 *
	 * @param filter - Optional filter criteria
	 * @returns Array of tool descriptors
	 */
	listTools(filter?: ToolFilter): ToolDescriptor[] {
		let tools = Array.from(this.tools.values());

		if (filter?.tags && filter.tags.length > 0) {
			tools = tools.filter((tool) =>
				tool.tags?.some((tag) => filter.tags?.includes(tag)),
			);
		}

		if (filter?.namePattern) {
			const regex = new RegExp(filter.namePattern);
			tools = tools.filter((tool) => regex.test(tool.name));
		}

		if (filter?.canInvoke) {
			tools = tools.filter(
				(tool) =>
					tool.canInvoke.includes("*") ||
					tool.canInvoke.includes(filter.canInvoke as string),
			);
		}

		return tools;
	}

	/**
	 * Get capability matrix showing which tools can invoke which
	 *
	 * @returns Map of tool name to array of invokeable tools
	 */
	getCapabilityMatrix(): Map<string, string[]> {
		const matrix = new Map<string, string[]>();

		for (const [name, tool] of this.tools.entries()) {
			// Expand '*' to all tool names
			if (tool.canInvoke.includes("*")) {
				matrix.set(name, Array.from(this.tools.keys()));
			} else {
				matrix.set(name, tool.canInvoke);
			}
		}

		return matrix;
	}

	/**
	 * Get tools that can be invoked by a specific tool
	 *
	 * @param toolName - Tool name
	 * @returns Array of invokeable tool names
	 */
	getInvokeableTools(toolName: string): string[] {
		const tool = this.getDescriptor(toolName);

		if (tool.canInvoke.includes("*")) {
			return Array.from(this.tools.keys());
		}

		return tool.canInvoke;
	}

	/**
	 * Get current active invocations count for a tool
	 *
	 * @param toolName - Tool name
	 * @returns Number of active invocations
	 */
	getActiveInvocations(toolName: string): number {
		return this.activeCalls.get(toolName) || 0;
	}

	/**
	 * Clear all registered tools (primarily for testing)
	 */
	clear(): void {
		this.tools.clear();
		this.handlers.clear();
		this.activeCalls.clear();
	}

	/**
	 * Get total number of registered tools
	 */
	get size(): number {
		return this.tools.size;
	}
}

/**
 * Singleton instance of the tool registry
 */
export const toolRegistry = new ToolRegistry();
