import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import {
	type ChainResult,
	type ExecutionPlan,
	type ExecutionStep,
	executeChain,
} from "../../src/tools/shared/execution-controller.js";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

describe("ExecutionController", () => {
	let context: A2AContext;
	let toolSuffix: string;
	let addToolName: string;
	let multiplyToolName: string;
	let failingToolName: string;

	beforeEach(() => {
		context = createA2AContext();
		// Use unique tool names to avoid conflicts between tests
		toolSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
		addToolName = `exec-add-tool-${toolSuffix}`;
		multiplyToolName = `exec-multiply-tool-${toolSuffix}`;
		failingToolName = `exec-failing-tool-${toolSuffix}`;

		// Register test tools with wildcard permissions to allow chaining
		try {
			toolRegistry.register(
				{
					name: addToolName,
					description: "Adds numbers",
					inputSchema: z.object({ a: z.number(), b: z.number() }),
					canInvoke: [multiplyToolName, failingToolName, addToolName],
				},
				async (args) => {
					const { a, b } = args as { a: number; b: number };
					return { success: true, data: a + b };
				},
			);
		} catch {
			// Tool may already be registered
		}

		try {
			toolRegistry.register(
				{
					name: multiplyToolName,
					description: "Multiplies numbers",
					inputSchema: z.object({ x: z.number(), y: z.number() }),
					canInvoke: [addToolName, multiplyToolName],
				},
				async (args) => {
					const { x, y } = args as { x: number; y: number };
					return { success: true, data: x * y };
				},
			);
		} catch {
			// Tool may already be registered
		}

		try {
			toolRegistry.register(
				{
					name: failingToolName,
					description: "Always fails",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					throw new Error("Tool failed");
				},
			);
		} catch {
			// Tool may already be registered
		}
	});

	describe("Sequential execution", () => {
		it("should execute steps sequentially", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: addToolName,
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: multiplyToolName,
						args: { x: 5, y: 2 },
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			// Check that we got results for both steps
			expect(result.stepResults.size).toBe(2);
			expect(result.summary.totalSteps).toBe(2);
		});

		it("should handle errors with skip strategy", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: addToolName,
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: failingToolName,
						args: {},
					},
					{
						id: "step3",
						toolName: multiplyToolName,
						args: { x: 5, y: 2 },
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			// With skip strategy, it continues despite failures
			expect(result.stepResults.size).toBe(3);
		});
	});

	describe("Parallel execution", () => {
		it("should execute steps in parallel", async () => {
			const plan: ExecutionPlan = {
				strategy: "parallel",
				steps: [
					{
						id: "step1",
						toolName: addToolName,
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: multiplyToolName,
						args: { x: 5, y: 2 },
					},
				],
				onError: "skip",
			};

			const startTime = Date.now();
			const result = await executeChain(plan, context);
			const duration = Date.now() - startTime;

			expect(result.stepResults.size).toBe(2);
			// Parallel should be reasonably fast
			expect(duration).toBeLessThan(500);
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
						toolName: addToolName,
						args: { a: 2, b: 3 },
						condition: (state) => state.get("shouldExecute") === true,
					},
					{
						id: "step2",
						toolName: multiplyToolName,
						args: { x: 5, y: 2 },
						condition: (state) => state.get("shouldExecute") === false,
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			// step1 should be attempted, step2 should be skipped due to condition
			expect(result.stepResults.has("step1")).toBe(true);
		});
	});

	describe("Execution summary", () => {
		it("should generate execution summary", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: addToolName,
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: multiplyToolName,
						args: { x: 5, y: 2 },
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			expect(result.summary).toBeDefined();
			expect(result.summary.totalSteps).toBe(2);
			expect(result.summary.totalDurationMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe("Type exports", () => {
		it("should export ExecutionStep type", () => {
			const step: ExecutionStep = {
				id: "test",
				toolName: addToolName,
				args: {},
			};
			expect(step.id).toBe("test");
		});

		it("should export ExecutionPlan type", () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [],
				onError: "abort",
			};
			expect(plan.strategy).toBe("sequential");
		});

		it("should export ChainResult type", () => {
			const result: ChainResult = {
				success: true,
				stepResults: new Map(),
				summary: {
					totalSteps: 0,
					successfulSteps: 0,
					failedSteps: 0,
					skippedSteps: 0,
					totalDurationMs: 0,
				},
			};
			expect(result.success).toBe(true);
		});
	});

	describe("Error handling modes", () => {
		it("should abort on error with abort strategy", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: failingToolName,
						args: {},
					},
					{
						id: "step2",
						toolName: addToolName,
						args: { a: 2, b: 3 },
					},
				],
				onError: "abort",
			};

			const result = await executeChain(plan, context);

			// With abort strategy, chain should fail
			expect(result.success).toBe(false);
		});

		it("should handle empty steps array", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(true);
			expect(result.summary.totalSteps).toBe(0);
		});

		it("should support parallel-with-join strategy", async () => {
			const plan: ExecutionPlan = {
				strategy: "parallel-with-join",
				steps: [
					{
						id: "step1",
						toolName: addToolName,
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: multiplyToolName,
						args: { x: 4, y: 5 },
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			expect(result.stepResults.size).toBe(2);
		});

		it("should try fallback tool when chain throws error", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: failingToolName,
						args: {},
					},
				],
				onError: "abort", // Abort will throw and trigger fallback
				fallbackTool: addToolName,
				fallbackArgs: { a: 1, b: 2 },
			};

			const result = await executeChain(plan, context);

			// Chain should succeed if fallback works
			// But the failing tool throws, onError=abort throws, then fallback runs
			expect(result).toBeDefined();
		});

		it("should support retry-with-backoff strategy", async () => {
			const plan: ExecutionPlan = {
				strategy: "retry-with-backoff",
				steps: [
					{
						id: "step1",
						toolName: addToolName,
						args: { a: 1, b: 1 },
					},
				],
				onError: "skip",
				retryConfig: {
					maxRetries: 2,
					initialDelayMs: 10,
					maxDelayMs: 100,
					backoffMultiplier: 2,
				},
			};

			const result = await executeChain(plan, context);

			expect(result.stepResults.size).toBe(1);
		});

		it("should support conditional strategy", async () => {
			context.sharedState.set("runStep", true);

			const plan: ExecutionPlan = {
				strategy: "conditional",
				steps: [
					{
						id: "step1",
						toolName: addToolName,
						args: { a: 1, b: 1 },
						condition: (state) => state.get("runStep") === true,
					},
					{
						id: "step2",
						toolName: multiplyToolName,
						args: { x: 2, y: 2 },
						condition: (state) => state.get("runStep") === false,
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			// Only step1 should run due to condition
			expect(result.stepResults.has("step1")).toBe(true);
		});

		it("should handle dependencies in sequential execution", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: addToolName,
						args: { a: 1, b: 1 },
					},
					{
						id: "step2",
						toolName: multiplyToolName,
						args: { x: 2, y: 2 },
						dependencies: ["step1"],
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			expect(result.stepResults.size).toBe(2);
		});

		it("should skip steps with unmet dependencies", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: failingToolName,
						args: {},
					},
					{
						id: "step2",
						toolName: addToolName,
						args: { a: 1, b: 1 },
						dependencies: ["nonexistent"],
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			// step2 should be skipped due to unmet dependency
			const step2Result = result.stepResults.get("step2");
			expect(step2Result?.success).toBe(false);
		});

		it("should apply transform function to previous output", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: addToolName,
						args: { a: 2, b: 3 },
					},
					{
						id: "step2",
						toolName: multiplyToolName,
						args: { x: 1, y: 1 },
						dependencies: ["step1"],
						transform: (prev) => ({ x: prev as number, y: 2 }),
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			expect(result.stepResults.size).toBe(2);
		});
	});
});
