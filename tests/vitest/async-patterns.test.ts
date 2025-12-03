import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import {
	allSucceeded,
	anySucceeded,
	collectSuccessful,
	countSuccessful,
	fallbackTool,
	mapReduceTools,
	mergeResults,
	pipelineTools,
	raceTool,
	retryTool,
	scatterGatherTools,
	waterfallTools,
} from "../../src/tools/shared/async-patterns.js";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

describe("Async Patterns", () => {
	let context: A2AContext;

	beforeEach(() => {
		context = createA2AContext();

		// Register test tools
		toolRegistry.register(
			{
				name: "double-tool",
				description: "Doubles a number",
				inputSchema: z.object({ value: z.number() }),
				canInvoke: [],
			},
			async (args) => {
				const { value } = args as { value: number };
				return { success: true, data: value * 2 };
			},
		);

		toolRegistry.register(
			{
				name: "add-ten-tool",
				description: "Adds 10 to a number",
				inputSchema: z.object({ value: z.number() }),
				canInvoke: [],
			},
			async (args) => {
				const { value } = args as { value: number };
				return { success: true, data: value + 10 };
			},
		);

		toolRegistry.register(
			{
				name: "square-tool",
				description: "Squares a number",
				inputSchema: z.object({ value: z.number() }),
				canInvoke: [],
			},
			async (args) => {
				const { value } = args as { value: number };
				return { success: true, data: value * value };
			},
		);

		toolRegistry.register(
			{
				name: "slow-tool",
				description: "Slow tool with delay",
				inputSchema: z.object({ delay: z.number() }),
				canInvoke: [],
			},
			async (args) => {
				const { delay } = args as { delay: number };
				await new Promise((resolve) => setTimeout(resolve, delay));
				return { success: true, data: "done" };
			},
		);

		toolRegistry.register(
			{
				name: "failing-tool",
				description: "Always fails",
				inputSchema: z.object({}),
				canInvoke: [],
			},
			async () => {
				throw new Error("Tool failed");
			},
		);
	});

	describe("mapReduceTools", () => {
		it("should map-reduce across multiple tools", async () => {
			const tools = [
				{ toolName: "double-tool", args: { value: 5 } },
				{ toolName: "add-ten-tool", args: { value: 5 } },
				{ toolName: "square-tool", args: { value: 5 } },
			];

			const result = await mapReduceTools(tools, context, (results) => {
				const sum = results.reduce((acc, r) => acc + (r.data as number), 0);
				return { success: true, data: sum };
			});

			expect(result.success).toBe(true);
			expect(result.data).toBe(10 + 15 + 25); // 10, 15, 25
		});

		it("should handle failures in map-reduce", async () => {
			const tools = [
				{ toolName: "double-tool", args: { value: 5 } },
				{ toolName: "failing-tool", args: {} },
			];

			const result = await mapReduceTools(tools, context, collectSuccessful);

			expect(result.success).toBe(true);
			expect(result.data).toHaveLength(1); // Only successful results
		});
	});

	describe("pipelineTools", () => {
		it("should execute tools in pipeline", async () => {
			const tools = ["double-tool", "add-ten-tool", "square-tool"];
			const initialInput = { value: 5 };

			const transforms = new Map([
				["add-ten-tool", (output: unknown) => ({ value: output as number })],
				["square-tool", (output: unknown) => ({ value: output as number })],
			]);

			const result = await pipelineTools(
				tools,
				initialInput,
				context,
				transforms,
			);

			// 5 → double → 10 → add-ten → 20 → square → 400
			expect(result.success).toBe(true);
			expect(result.data).toBe(400);
		});

		it("should stop pipeline on failure", async () => {
			const tools = ["double-tool", "failing-tool", "add-ten-tool"];
			const initialInput = { value: 5 };

			const result = await pipelineTools(tools, initialInput, context);

			expect(result.success).toBe(false);
		});
	});

	describe("scatterGatherTools", () => {
		it("should scatter-gather with custom gatherer", async () => {
			const tools = [
				{ toolName: "double-tool", args: { value: 5 } },
				{ toolName: "add-ten-tool", args: { value: 5 } },
				{ toolName: "square-tool", args: { value: 5 } },
			];

			const result = await scatterGatherTools(tools, context, (results) => {
				const values = results.map((r) => r.data as number);
				const max = Math.max(...values);
				return { success: true, data: max };
			});

			expect(result.success).toBe(true);
			expect(result.data).toBe(25); // Maximum value
		});
	});

	describe("waterfallTools", () => {
		it("should execute waterfall with accumulation", async () => {
			const tools = [
				{ toolName: "double-tool", args: { value: 5 } },
				{ toolName: "add-ten-tool", args: { value: 0 } },
				{ toolName: "square-tool", args: { value: 0 } },
			];

			const result = await waterfallTools(
				tools,
				context,
				(acc, current) => ({
					...current.args,
					value: (acc?.data as number) || 0,
				}),
				{ success: true, data: 5 },
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe(400); // ((5 * 2) + 10) ^ 2 = 400
		});
	});

	describe("raceTool", () => {
		it("should return fastest tool result", async () => {
			const tools = [
				{ toolName: "slow-tool", args: { delay: 100 } },
				{ toolName: "double-tool", args: { value: 5 } },
				{ toolName: "slow-tool", args: { delay: 200 } },
			];

			const result = await raceTool(tools, context);

			expect(result.success).toBe(true);
			expect(result.data).toBe(10); // double-tool is fastest
		});

		it("should handle all failures in race", async () => {
			const tools = [
				{ toolName: "failing-tool", args: {} },
				{ toolName: "failing-tool", args: {} },
			];

			const result = await raceTool(tools, context);

			expect(result.success).toBe(false);
		});
	});

	describe("retryTool", () => {
		it("should retry until success", async () => {
			let attemptCount = 0;

			toolRegistry.register(
				{
					name: "flaky-tool",
					description: "Fails first 2 times",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					attemptCount++;
					if (attemptCount < 3) {
						throw new Error("Temporary failure");
					}
					return { success: true, data: "success" };
				},
			);

			const result = await retryTool(
				"flaky-tool",
				{},
				context,
				3,
				10,
				2,
				0, // no jitter for test
			);

			expect(result.success).toBe(true);
			expect(attemptCount).toBe(3);
		});

		it("should fail after max retries", async () => {
			const result = await retryTool("failing-tool", {}, context, 2, 10, 2);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed after");
		});

		it("should add jitter to retry delays", async () => {
			let attemptCount = 0;

			toolRegistry.register(
				{
					name: "jitter-tool",
					description: "Fails first time",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					attemptCount++;
					if (attemptCount < 2) {
						throw new Error("Temporary failure");
					}
					return { success: true, data: "success" };
				},
			);

			const result = await retryTool(
				"jitter-tool",
				{},
				context,
				2,
				10,
				2,
				50, // jitter of up to 50ms
			);

			expect(result.success).toBe(true);
			expect(attemptCount).toBe(2);
		});
	});

	describe("fallbackTool", () => {
		it("should use primary tool when successful", async () => {
			const result = await fallbackTool(
				"double-tool",
				{ value: 5 },
				"add-ten-tool",
				{ value: 5 },
				context,
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe(10); // Primary result
		});

		it("should fallback to secondary on primary failure", async () => {
			const result = await fallbackTool(
				"failing-tool",
				{},
				"double-tool",
				{ value: 5 },
				context,
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe(10); // Fallback result
		});

		it("should fail when both primary and fallback fail", async () => {
			const result = await fallbackTool(
				"failing-tool",
				{},
				"failing-tool",
				{},
				context,
			);

			expect(result.success).toBe(false);
		});
	});

	describe("Reducers", () => {
		it("collectSuccessful should filter successful results", () => {
			const results = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
				{ success: true, data: 2 },
			];

			const reduced = collectSuccessful(results);

			expect(reduced.success).toBe(true);
			expect(reduced.data).toHaveLength(2);
		});

		it("countSuccessful should count successful results", () => {
			const results = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
				{ success: true, data: 2 },
			];

			const reduced = countSuccessful(results);

			expect(reduced.success).toBe(true);
			expect(reduced.data).toBe(2);
		});

		it("allSucceeded should check if all succeeded", () => {
			const allSuccess = [
				{ success: true, data: 1 },
				{ success: true, data: 2 },
			];

			const someFailure = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
			];

			expect(allSucceeded(allSuccess).data).toBe(true);
			expect(allSucceeded(someFailure).data).toBe(false);
		});

		it("anySucceeded should check if any succeeded", () => {
			const someSuccess = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
			];

			const allFailure = [
				{ success: false, error: "failed1" },
				{ success: false, error: "failed2" },
			];

			expect(anySucceeded(someSuccess).data).toBe(true);
			expect(anySucceeded(allFailure).data).toBe(false);
		});

		it("mergeResults should merge all result data", () => {
			const results = [
				{ success: true, data: { a: 1 } },
				{ success: true, data: { b: 2 } },
				{ success: true, data: { c: 3 } },
			];

			const merged = mergeResults(results);

			expect(merged.success).toBe(true);
			expect(merged.data).toEqual({ a: 1, b: 2, c: 3 });
		});
	});
});
