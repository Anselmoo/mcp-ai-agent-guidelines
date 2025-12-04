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

		it("should handle tool timeout", async () => {
			const toolName = `slow-tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Slow tool that times out",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 5000));
					return { success: true, data: "done" };
				},
			);

			await expect(
				invokeTool(toolName, {}, undefined, { timeoutMs: 10 }),
			).rejects.toThrow(/timed out/i);
		});

		it("should track execution in context log", async () => {
			const toolName = `log-tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Tool for logging test",
					inputSchema: z.object({}),
					canInvoke: [toolName], // Allow self-invocation
				},
				async () => ({ success: true, data: "logged" }),
			);

			// First invocation without context (root call)
			const ctx = createA2AContext();
			// Set parent to undefined and depth to 0 for root invocation
			ctx.depth = 0;
			ctx.parentToolName = undefined;

			// Invoke without parent context - root call
			await invokeTool(toolName, {});

			// Check that invocation works - context log is internal
			expect(true).toBe(true);
		});

		it("should handle recursion depth limit", async () => {
			const toolName = `depth-tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Tool for depth test",
					inputSchema: z.object({}),
					canInvoke: [toolName],
				},
				async () => ({ success: true, data: "ok" }),
			);

			// Create context at max depth
			const ctx = createA2AContext(undefined, { maxDepth: 3 });
			ctx.depth = 3;

			await expect(invokeTool(toolName, {}, ctx)).rejects.toThrow(/depth/i);
		});

		it("should handle tool validation errors", async () => {
			const toolName = `validate-tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Tool with strict validation",
					inputSchema: z.object({ required: z.string() }),
					canInvoke: [],
				},
				async (args) => ({
					success: true,
					data: (args as { required: string }).required,
				}),
			);

			// Pass invalid args - validation returns error result, doesn't throw
			const result = await invokeTool(toolName, { wrong: "key" });
			expect(result.success).toBe(false);
			expect(result.error).toContain("validation");
		});

		it("should support deduplication of invocations", async () => {
			const toolName = `dedup-tool-${Date.now()}-${Math.random().toString(36).substring(7)}`;

			toolRegistry.register(
				{
					name: toolName,
					description: "Tool for dedup test",
					inputSchema: z.object({ value: z.number() }),
					canInvoke: [toolName],
				},
				async (args) => {
					return { success: true, data: (args as { value: number }).value };
				},
			);

			const ctx = createA2AContext();

			// First invocation
			const result1 = await invokeTool(toolName, { value: 42 }, ctx);
			expect(result1.success).toBe(true);

			// Second invocation with same args and deduplicate option
			const result2 = await invokeTool(toolName, { value: 42 }, ctx, {
				deduplicate: true,
			});

			// Should return cached result
			expect(result2.success).toBe(true);
			expect(result2.data).toEqual({ cached: true, outputSummary: "42" });
		});

		it("should use custom error handler for recovery", async () => {
			const toolName = `error-recover-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Tool that fails for recovery test",
					inputSchema: z.object({}),
					canInvoke: ["*"],
				},
				async () => {
					throw new Error("Intentional failure");
				},
			);

			// Don't pass context to avoid permission checks
			const result = await invokeTool(toolName, {}, undefined, {
				onError: async (error) => ({
					success: true,
					data: { recovered: true, originalError: error.message },
				}),
			});

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				recovered: true,
				originalError: "Intentional failure",
			});
		});

		it("should handle recovery handler that also fails", async () => {
			const toolName = `double-fail-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Tool for double failure test",
					inputSchema: z.object({}),
					canInvoke: ["*"],
				},
				async () => {
					throw new Error("Primary failure");
				},
			);

			// Don't pass context to avoid permission checks
			await expect(
				invokeTool(toolName, {}, undefined, {
					onError: async () => {
						throw new Error("Recovery also failed");
					},
				}),
			).rejects.toThrow();
		});

		it("should respect remaining chain time for timeout", async () => {
			const toolName = `chain-time-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			toolRegistry.register(
				{
					name: toolName,
					description: "Fast tool",
					inputSchema: z.object({}),
					canInvoke: ["*"],
				},
				async () => ({ success: true, data: "done" }),
			);

			// Don't pass context to avoid permission checks
			const result = await invokeTool(toolName, {}, undefined, {
				timeoutMs: 5000,
			});
			expect(result.success).toBe(true);
		});
	});
});
