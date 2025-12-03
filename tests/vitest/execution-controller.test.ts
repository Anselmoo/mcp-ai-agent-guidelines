import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import {
	ExecutionController,
	type ExecutionPlan,
	type ExecutionStep,
} from "../../src/tools/shared/execution-controller.js";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

describe("ExecutionController", () => {
	let context: A2AContext;
	let controller: ExecutionController;

	beforeEach(() => {
		context = createA2AContext();
		controller = new ExecutionController(context);

		// Register test tools
		toolRegistry.register(
			{
				name: "add-tool",
				description: "Adds numbers",
				inputSchema: z.object({ a: z.number(), b: z.number() }),
				canInvoke: [],
			},
			async (args) => {
				const { a, b } = args as { a: number; b: number };
				return { success: true, data: a + b };
			},
		);

		toolRegistry.register(
			{
				name: "multiply-tool",
				description: "Multiplies numbers",
				inputSchema: z.object({ x: z.number(), y: z.number() }),
				canInvoke: [],
			},
			async (args) => {
				const { x, y } = args as { x: number; y: number };
				return { success: true, data: x * y };
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

	describe("Sequential execution", () => {
		it("should execute steps sequentially", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: "add-tool",
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: "multiply-tool",
						args: { x: 5, y: 2 },
					},
				],
				onError: "abort",
			};

			const result = await controller.execute(plan);

			expect(result.success).toBe(true);
			expect(result.results).toHaveLength(2);
			expect(result.results[0].data).toBe(5);
			expect(result.results[1].data).toBe(10);
		});

		it("should handle errors with abort strategy", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: "add-tool",
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: "failing-tool",
						args: {},
					},
					{
						id: "step3",
						toolName: "multiply-tool",
						args: { x: 5, y: 2 },
					},
				],
				onError: "abort",
			};

			const result = await controller.execute(plan);

			expect(result.success).toBe(false);
			expect(result.results).toHaveLength(2); // Only first two steps
		});

		it("should handle errors with skip strategy", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: "add-tool",
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: "failing-tool",
						args: {},
					},
					{
						id: "step3",
						toolName: "multiply-tool",
						args: { x: 5, y: 2 },
					},
				],
				onError: "skip",
			};

			const result = await controller.execute(plan);

			expect(result.success).toBe(true); // Overall success despite failure
			expect(result.results).toHaveLength(3);
			expect(result.results[1].success).toBe(false);
			expect(result.results[2].success).toBe(true);
		});
	});

	describe("Parallel execution", () => {
		it("should execute steps in parallel", async () => {
			const plan: ExecutionPlan = {
				strategy: "parallel",
				steps: [
					{
						id: "step1",
						toolName: "add-tool",
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: "multiply-tool",
						args: { x: 5, y: 2 },
					},
				],
				onError: "skip",
			};

			const startTime = Date.now();
			const result = await controller.execute(plan);
			const duration = Date.now() - startTime;

			expect(result.success).toBe(true);
			expect(result.results).toHaveLength(2);
			// Parallel should be faster than sequential
			expect(duration).toBeLessThan(200);
		});

		it("should handle parallel failures with skip", async () => {
			const plan: ExecutionPlan = {
				strategy: "parallel",
				steps: [
					{
						id: "step1",
						toolName: "add-tool",
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: "failing-tool",
						args: {},
					},
					{
						id: "step3",
						toolName: "multiply-tool",
						args: { x: 5, y: 2 },
					},
				],
				onError: "skip",
			};

			const result = await controller.execute(plan);

			expect(result.success).toBe(true);
			expect(result.results).toHaveLength(3);
			expect(result.results.filter((r) => r.success)).toHaveLength(2);
		});
	});

	describe("Conditional execution", () => {
		it("should execute conditionally based on state", async () => {
			context.sharedState.set("shouldExecute", true);

			const plan: ExecutionPlan = {
				strategy: "conditional",
				steps: [
					{
						id: "step1",
						toolName: "add-tool",
						args: { a: 2, b: 3 },
						condition: (state) => state.get("shouldExecute") === true,
					},
					{
						id: "step2",
						toolName: "multiply-tool",
						args: { x: 5, y: 2 },
						condition: (state) => state.get("shouldExecute") === false,
					},
				],
				onError: "skip",
			};

			const result = await controller.execute(plan);

			expect(result.success).toBe(true);
			expect(result.results).toHaveLength(2);
			expect(result.results[0].success).toBe(true);
			expect(result.results[1].success).toBe(false); // Skipped
		});
	});

	describe("Dependency resolution", () => {
		it("should resolve dependencies correctly", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: "add-tool",
						args: { a: 2, b: 3 },
						dependencies: [],
					},
					{
						id: "step2",
						toolName: "multiply-tool",
						args: { x: 5, y: 2 },
						dependencies: ["step1"],
					},
				],
				onError: "abort",
			};

			const result = await controller.execute(plan);

			expect(result.success).toBe(true);
			expect(result.results).toHaveLength(2);
		});

		it("should detect circular dependencies", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: "add-tool",
						args: { a: 2, b: 3 },
						dependencies: ["step2"],
					},
					{
						id: "step2",
						toolName: "multiply-tool",
						args: { x: 5, y: 2 },
						dependencies: ["step1"],
					},
				],
				onError: "abort",
			};

			const result = await controller.execute(plan);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Circular dependency");
		});
	});

	describe("Retry with backoff", () => {
		it("should retry failed steps with exponential backoff", async () => {
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

			const plan: ExecutionPlan = {
				strategy: "retry-with-backoff",
				steps: [
					{
						id: "step1",
						toolName: "flaky-tool",
						args: {},
						retryConfig: {
							maxRetries: 3,
							initialDelayMs: 10,
							backoffMultiplier: 2,
						},
					},
				],
				onError: "abort",
			};

			const result = await controller.execute(plan);

			expect(result.success).toBe(true);
			expect(attemptCount).toBe(3);
		});
	});

	describe("Execution summary", () => {
		it("should generate execution summary", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: "add-tool",
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: "multiply-tool",
						args: { x: 5, y: 2 },
					},
				],
				onError: "skip",
			};

			const result = await controller.execute(plan);

			expect(result.summary).toBeDefined();
			expect(result.summary?.totalSteps).toBe(2);
			expect(result.summary?.successfulSteps).toBe(2);
			expect(result.summary?.failedSteps).toBe(0);
			expect(result.summary?.totalDurationMs).toBeGreaterThan(0);
		});
	});
});
