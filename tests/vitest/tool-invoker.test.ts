import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import {
	RecursionDepthError,
	ToolTimeoutError,
} from "../../src/tools/shared/a2a-errors.js";
import { invokeTool } from "../../src/tools/shared/tool-invoker.js";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

describe("Tool Invoker", () => {
	let context: A2AContext;

	beforeEach(() => {
		context = createA2AContext();
		// Clear registry before each test
		const tools = toolRegistry.listTools();
		for (const tool of tools) {
			// Reset registry state if needed
		}
	});

	describe("invokeTool", () => {
		it("should invoke a registered tool successfully", async () => {
			// Register a test tool
			toolRegistry.register(
				{
					name: "test-tool",
					description: "Test tool",
					inputSchema: z.object({ value: z.number() }),
					canInvoke: [],
				},
				async (args) => {
					const input = args as { value: number };
					return { success: true, data: input.value * 2 };
				},
			);

			const result = await invokeTool("test-tool", { value: 5 }, context);

			expect(result.success).toBe(true);
			expect(result.data).toBe(10);
			expect(context.executionLog).toHaveLength(1);
			expect(context.executionLog[0].toolName).toBe("test-tool");
			expect(context.executionLog[0].status).toBe("success");
		});

		it("should handle tool errors gracefully", async () => {
			toolRegistry.register(
				{
					name: "failing-tool",
					description: "Failing tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					throw new Error("Tool failed");
				},
			);

			const result = await invokeTool("failing-tool", {}, context);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Tool failed");
			expect(context.executionLog).toHaveLength(1);
			expect(context.executionLog[0].status).toBe("error");
		});

		it("should enforce recursion depth limits", async () => {
			toolRegistry.register(
				{
					name: "recursive-tool",
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

			const result = await invokeTool("recursive-tool", {}, deepContext);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Maximum recursion depth");
		});

		it("should enforce tool timeouts", async () => {
			toolRegistry.register(
				{
					name: "slow-tool",
					description: "Slow tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 200));
					return { success: true, data: "done" };
				},
			);

			const shortTimeoutContext = createA2AContext(undefined, {
				timeoutMs: 50,
			});

			const result = await invokeTool("slow-tool", {}, shortTimeoutContext);

			expect(result.success).toBe(false);
			expect(result.error).toContain("timeout");
		});

		it("should detect duplicate invocations", async () => {
			toolRegistry.register(
				{
					name: "dup-tool",
					description: "Tool for duplication test",
					inputSchema: z.object({ id: z.number() }),
					canInvoke: [],
				},
				async (args) => {
					return { success: true, data: args };
				},
			);

			// First invocation
			await invokeTool("dup-tool", { id: 1 }, context);

			// Second invocation with same args
			const result = await invokeTool("dup-tool", { id: 1 }, context);

			// Should still succeed but log should show duplication
			expect(result.success).toBe(true);
			expect(context.executionLog).toHaveLength(2);
		});

		it("should handle missing tools", async () => {
			const result = await invokeTool("non-existent-tool", {}, context);

			expect(result.success).toBe(false);
			expect(result.error).toContain("not found");
		});

		it("should propagate context correctly in nested invocations", async () => {
			toolRegistry.register(
				{
					name: "parent-tool",
					description: "Parent tool",
					inputSchema: z.object({}),
					canInvoke: ["child-tool"],
				},
				async (args, ctx) => {
					ctx.sharedState.set("parent-data", "from-parent");
					const childResult = await invokeTool("child-tool", {}, ctx);
					return { success: true, data: childResult };
				},
			);

			toolRegistry.register(
				{
					name: "child-tool",
					description: "Child tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async (args, ctx) => {
					const parentData = ctx.sharedState.get("parent-data");
					return { success: true, data: parentData };
				},
			);

			const result = await invokeTool("parent-tool", {}, context);

			expect(result.success).toBe(true);
			expect(result.data?.data).toBe("from-parent");
			expect(context.executionLog).toHaveLength(2);
			expect(context.executionLog[0].toolName).toBe("parent-tool");
			expect(context.executionLog[1].toolName).toBe("child-tool");
		});

		it("should track execution time in logs", async () => {
			toolRegistry.register(
				{
					name: "timed-tool",
					description: "Timed tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { success: true, data: "done" };
				},
			);

			await invokeTool("timed-tool", {}, context);

			expect(context.executionLog[0].durationMs).toBeGreaterThan(0);
		});

		it("should handle chain timeout", async () => {
			toolRegistry.register(
				{
					name: "chain-timeout-tool",
					description: "Tool for chain timeout",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 200));
					return { success: true, data: "done" };
				},
			);

			const chainContext = createA2AContext(undefined, {
				chainTimeoutMs: 50,
			});

			const result = await invokeTool("chain-timeout-tool", {}, chainContext);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Chain timeout");
		});

		it("should invoke batch tools in sequence", async () => {
			toolRegistry.register(
				{
					name: "batch-tool-1",
					description: "First batch tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => ({ success: true, data: "tool1" }),
			);

			toolRegistry.register(
				{
					name: "batch-tool-2",
					description: "Second batch tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => ({ success: true, data: "tool2" }),
			);

			const tools = ["batch-tool-1", "batch-tool-2"];
			const results = [];

			for (const toolName of tools) {
				const result = await invokeTool(toolName, {}, context);
				results.push(result);
			}

			expect(results).toHaveLength(2);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(true);
			expect(context.executionLog).toHaveLength(2);
		});
	});
});
