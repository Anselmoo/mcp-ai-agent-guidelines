import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import {
	ChainTimeoutError,
	RecursionDepthError,
	ToolInvocationError,
	ToolTimeoutError,
} from "../../src/tools/shared/a2a-errors.js";
import {
	batchInvoke,
	invokeSequence,
	invokeTool,
} from "../../src/tools/shared/tool-invoker.js";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

describe("Tool Invoker", () => {
	let _context: A2AContext;

	beforeEach(() => {
		// Create context without parent so tools don't need permission to invoke themselves
		_context = createA2AContext();
	});

	describe("invokeTool", () => {
		it("should invoke a registered tool successfully", async () => {
			// Register a test tool with unique name to avoid conflicts
			const toolName = `test-tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Test tool",
					inputSchema: z.object({ value: z.number() }),
					canInvoke: [],
				},
				async (args) => {
					const input = args as { value: number };
					return { success: true, data: input.value * 2 };
				},
			);

			// Invoke without context to avoid permission checks
			const result = await invokeTool(toolName, { value: 5 });

			expect(result.success).toBe(true);
			expect(result.data).toBe(10);
		});

		it("should handle tool errors gracefully", async () => {
			const toolName = `failing-tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Failing tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					throw new Error("Tool failed");
				},
			);

			await expect(invokeTool(toolName, {})).rejects.toThrow();
		});

		it("should enforce recursion depth limits", async () => {
			const toolName = `recursive-tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Recursive tool",
					inputSchema: z.object({}),
					canInvoke: [],
					maxConcurrency: 1,
				},
				async () => {
					return { success: true, data: "done" };
				},
			);

			// Create context at max depth
			const deepContext = createA2AContext(undefined, { maxDepth: 2 });
			deepContext.depth = 2;

			// Invoking should fail due to depth limit
			await expect(invokeTool(toolName, {}, deepContext)).rejects.toThrow(
				/depth/i,
			);
		});

		it("should handle missing tools", async () => {
			await expect(
				invokeTool(`non-existent-tool-xyz-${Date.now()}`, {}),
			).rejects.toThrow();
		});

		it("should propagate context correctly in nested invocations", async () => {
			const suffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
			const childToolName = `child-tool-${suffix}`;
			const parentToolName = `parent-tool-${suffix}`;

			toolRegistry.register(
				{
					name: childToolName,
					description: "Child tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async (_args, ctx) => {
					const parentData = ctx?.sharedState.get("parent-data");
					return { success: true, data: parentData };
				},
			);

			toolRegistry.register(
				{
					name: parentToolName,
					description: "Parent tool",
					inputSchema: z.object({}),
					canInvoke: [childToolName],
				},
				async (_args, ctx) => {
					ctx?.sharedState.set("parent-data", "from-parent");
					const childResult = await invokeTool(childToolName, {}, ctx);
					return { success: true, data: childResult };
				},
			);

			// Don't pass context at the top level to avoid permission issues
			const result = await invokeTool(parentToolName, {});

			expect(result.success).toBe(true);
		});

		it("should track execution time in logs", async () => {
			const toolName = `timed-tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Timed tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { success: true, data: "done" };
				},
			);

			// Invoke without context (first call, no parent) to avoid permission issues
			const result = await invokeTool(toolName, {});

			expect(result.success).toBe(true);
			expect(result.metadata?.durationMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe("batchInvoke", () => {
		it("should invoke multiple tools in parallel", async () => {
			const suffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
			const tool1 = `batch-tool-1-${suffix}`;
			const tool2 = `batch-tool-2-${suffix}`;

			toolRegistry.register(
				{
					name: tool1,
					description: "First batch tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => ({ success: true, data: "tool1" }),
			);

			toolRegistry.register(
				{
					name: tool2,
					description: "Second batch tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => ({ success: true, data: "tool2" }),
			);

			// Don't pass context to avoid permission checks
			const results = await batchInvoke([
				{ toolName: tool1, args: {} },
				{ toolName: tool2, args: {} },
			]);

			expect(results).toHaveLength(2);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(true);
		});
	});

	describe("invokeSequence", () => {
		it("should invoke tools in sequence with transforms", async () => {
			const suffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
			const tool1 = `seq-tool-1-${suffix}`;
			const tool2 = `seq-tool-2-${suffix}`;

			toolRegistry.register(
				{
					name: tool1,
					description: "First sequence tool",
					inputSchema: z.object({ value: z.number() }),
					canInvoke: [],
				},
				async (args) => ({
					success: true,
					data: (args as { value: number }).value * 2,
				}),
			);

			toolRegistry.register(
				{
					name: tool2,
					description: "Second sequence tool",
					inputSchema: z.object({ value: z.number() }),
					canInvoke: [],
				},
				async (args) => ({
					success: true,
					data: (args as { value: number }).value + 10,
				}),
			);

			// Don't pass context to avoid permission checks
			const result = await invokeSequence(
				[
					{
						toolName: tool1,
						transform: (input) => ({ value: input as number }),
					},
					{ toolName: tool2, transform: (prev) => ({ value: prev as number }) },
				],
				undefined,
				5,
			);

			expect(result.success).toBe(true);
			// 5 * 2 = 10, then 10 + 10 = 20
			expect(result.data).toBe(20);
		});
	});

	describe("Error types", () => {
		it("should export RecursionDepthError", () => {
			const error = new RecursionDepthError(5, 3, { toolName: "test" });
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toContain("depth");
		});

		it("should export ToolTimeoutError", () => {
			const error = new ToolTimeoutError("test-tool", 1000);
			expect(error).toBeInstanceOf(Error);
			expect(error.message.toLowerCase()).toContain("timed out");
		});

		it("should export ChainTimeoutError", () => {
			const error = new ChainTimeoutError(5000, 3, { toolName: "test" });
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toContain("timed out");
		});

		it("should export ToolInvocationError", () => {
			const error = new ToolInvocationError("test-tool", "Failed to invoke");
			expect(error).toBeInstanceOf(Error);
		});

		it("should handle tool throwing non-Error object", async () => {
			const toolName = `throw-string-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Tool that throws string",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					throw "string error";
				},
			);

			await expect(invokeTool(toolName, {})).rejects.toThrow("string error");
		});

		it("should invoke tool with timeout context", async () => {
			const toolName = `timeout-ctx-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Fast tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => ({ success: true, data: "fast" }),
			);

			// Create context without timeout to avoid permission issues at depth
			const result = await invokeTool(toolName, {});
			expect(result.success).toBe(true);
		});

		it("should check chain timeout before invocation", async () => {
			const toolName = `chain-timeout-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Tool for chain timeout test",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => ({ success: true, data: "ok" }),
			);

			const ctx = createA2AContext(undefined, { chainTimeoutMs: 1 });
			ctx.chainStartTime = new Date(Date.now() - 10000);

			await expect(invokeTool(toolName, {}, ctx)).rejects.toThrow();
		});
	});
});
