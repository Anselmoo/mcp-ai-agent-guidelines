import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import {
	branchOnCondition,
	fallbackTool,
	fanOut,
	mapReduceTools,
	pipelineTools,
	raceTools,
	reducers,
	retryTool,
	scatterGatherTools,
	waterfallTools,
} from "../../src/tools/shared/async-patterns.js";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

describe("Async Patterns", () => {
	let context: A2AContext;
	let toolSuffix: string;
	let addToolName: string;
	let multiplyToolName: string;
	let failingToolName: string;
	let echoToolName: string;

	beforeEach(() => {
		context = createA2AContext();
		toolSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
		addToolName = `async-add-tool-${toolSuffix}`;
		multiplyToolName = `async-multiply-tool-${toolSuffix}`;
		failingToolName = `async-failing-tool-${toolSuffix}`;
		echoToolName = `async-echo-tool-${toolSuffix}`;

		// Register test tools
		try {
			toolRegistry.register(
				{
					name: addToolName,
					description: "Adds numbers",
					inputSchema: z.object({ a: z.number(), b: z.number() }),
					canInvoke: [multiplyToolName, echoToolName, addToolName],
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

		try {
			toolRegistry.register(
				{
					name: echoToolName,
					description: "Echoes input",
					inputSchema: z.unknown(),
					canInvoke: [addToolName, multiplyToolName],
				},
				async (args) => {
					return { success: true, data: args };
				},
			);
		} catch {
			// Tool may already be registered
		}
	});

	describe("Reducers", () => {
		it("collectSuccessful should filter successful results", () => {
			const results = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
				{ success: true, data: 2 },
			];

			const reduced = reducers.collectSuccessful(results);

			expect(reduced).toHaveLength(2);
			expect(reduced).toEqual([1, 2]);
		});

		it("countSuccessful should count successful results", () => {
			const results = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
				{ success: true, data: 2 },
			];

			const count = reducers.countSuccessful(results);

			expect(count).toBe(2);
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

			expect(reducers.allSucceeded(allSuccess)).toBe(true);
			expect(reducers.allSucceeded(someFailure)).toBe(false);
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

			expect(reducers.anySucceeded(someSuccess)).toBe(true);
			expect(reducers.anySucceeded(allFailure)).toBe(false);
		});

		it("mergeResults should merge all result data", () => {
			const results = [
				{ success: true, data: { a: 1 } },
				{ success: true, data: { b: 2 } },
				{ success: true, data: { c: 3 } },
			];

			const merged = reducers.mergeResults(results);

			expect(merged).toEqual({ a: 1, b: 2, c: 3 });
		});
	});

	describe("Module exports", () => {
		it("should export mapReduceTools", async () => {
			const { mapReduceTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof mapReduceTools).toBe("function");
		});

		it("should export pipelineTools", async () => {
			const { pipelineTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof pipelineTools).toBe("function");
		});

		it("should export scatterGatherTools", async () => {
			const { scatterGatherTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof scatterGatherTools).toBe("function");
		});

		it("should export waterfallTools", async () => {
			const { waterfallTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof waterfallTools).toBe("function");
		});

		it("should export raceTools", async () => {
			const { raceTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof raceTools).toBe("function");
		});

		it("should export retryTool", async () => {
			const { retryTool } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof retryTool).toBe("function");
		});

		it("should export fallbackTool", async () => {
			const { fallbackTool } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof fallbackTool).toBe("function");
		});

		it("should export branchOnCondition", async () => {
			const { branchOnCondition } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof branchOnCondition).toBe("function");
		});

		it("should export fanOut", async () => {
			const { fanOut } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof fanOut).toBe("function");
		});
	});

	describe("mapReduceTools", () => {
		it("should apply tool to multiple inputs and reduce", async () => {
			const inputs = [
				{ a: 1, b: 2 },
				{ a: 3, b: 4 },
				{ a: 5, b: 6 },
			];

			// Don't pass parent context to avoid permission checks
			const freshContext = createA2AContext();

			const result = await mapReduceTools(
				addToolName,
				inputs,
				freshContext,
				reducers.collectSuccessful,
			);

			expect(result).toHaveLength(3);
			expect(result).toContain(3); // 1+2
			expect(result).toContain(7); // 3+4
			expect(result).toContain(11); // 5+6
		});

		it("should handle empty inputs in map-reduce", async () => {
			const freshContext = createA2AContext();

			const result = await mapReduceTools(
				addToolName,
				[],
				freshContext,
				reducers.countSuccessful,
			);

			expect(result).toBe(0);
		});
	});

	describe("pipelineTools", () => {
		it("should execute pipeline with transformations", async () => {
			const freshContext = createA2AContext();
			const pipeline = [
				{
					toolName: addToolName,
					transform: () => ({ a: 2, b: 3 }),
				},
			];

			const result = await pipelineTools(pipeline, freshContext);

			expect(result.success).toBe(true);
			expect(result.data).toBe(5);
		});

		it("should execute empty pipeline", async () => {
			const freshContext = createA2AContext();
			const result = await pipelineTools([], freshContext, {
				initial: "value",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("branchOnCondition", () => {
		it("should execute true branch when condition is true", async () => {
			const freshContext = createA2AContext();
			freshContext.sharedState.set("flag", true);

			const result = await branchOnCondition(
				(state) => state.get("flag") === true,
				addToolName,
				multiplyToolName,
				{ a: 2, b: 3 },
				freshContext,
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe(5); // add: 2+3
		});

		it("should execute false branch when condition is false", async () => {
			const freshContext = createA2AContext();
			freshContext.sharedState.set("flag", false);

			const result = await branchOnCondition(
				(state) => state.get("flag") === true,
				addToolName,
				multiplyToolName,
				{ x: 2, y: 3 },
				freshContext,
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe(6); // multiply: 2*3
		});
	});

	describe("scatterGatherTools", () => {
		it("should scatter to multiple tools and gather results", async () => {
			const freshContext = createA2AContext();
			const tools = [
				{ toolName: addToolName, args: { a: 1, b: 2 } },
				{ toolName: multiplyToolName, args: { x: 3, y: 4 } },
			];

			const result = await scatterGatherTools(
				tools,
				freshContext,
				(resultMap) => {
					const values: number[] = [];
					for (const [_, r] of resultMap) {
						if (r.success) values.push(r.data as number);
					}
					return values;
				},
			);

			expect(result).toHaveLength(2);
			expect(result).toContain(3); // 1+2
			expect(result).toContain(12); // 3*4
		});
	});

	describe("fanOut", () => {
		it("should fan out to multiple executions", async () => {
			const freshContext = createA2AContext();
			const argsArray = [
				{ a: 1, b: 1 },
				{ a: 2, b: 2 },
				{ a: 3, b: 3 },
			];

			const results = await fanOut(addToolName, argsArray, freshContext);

			expect(results).toHaveLength(3);
			expect(results[0].data).toBe(2);
			expect(results[1].data).toBe(4);
			expect(results[2].data).toBe(6);
		});

		it("should respect concurrency limit", async () => {
			const freshContext = createA2AContext();
			const argsArray = [
				{ a: 1, b: 1 },
				{ a: 2, b: 2 },
				{ a: 3, b: 3 },
				{ a: 4, b: 4 },
			];

			const results = await fanOut(addToolName, argsArray, freshContext, 2);

			expect(results).toHaveLength(4);
		});
	});

	describe("waterfallTools", () => {
		it("should execute tools in waterfall sequence", async () => {
			const freshContext = createA2AContext();
			const tools = [addToolName];

			const result = await waterfallTools(tools, freshContext, { a: 1, b: 2 });

			expect(result.success).toBe(true);
			expect(result.data).toBe(3);
		});

		it("should handle empty waterfall", async () => {
			const freshContext = createA2AContext();
			const result = await waterfallTools([], freshContext, "initial");

			expect(result.success).toBe(true);
			expect(result.data).toBe("initial");
		});
	});

	describe("raceTools", () => {
		it("should return first successful result", async () => {
			const freshContext = createA2AContext();
			const tools = [
				{ toolName: addToolName, args: { a: 1, b: 2 } },
				{ toolName: addToolName, args: { a: 3, b: 4 } },
			];

			const result = await raceTools(tools, freshContext);

			expect(result.success).toBe(true);
			// Should be one of the results
			expect([3, 7]).toContain(result.data);
		});
	});

	describe("retryTool", () => {
		it("should succeed on first try if tool succeeds", async () => {
			const freshContext = createA2AContext();
			const result = await retryTool(
				addToolName,
				{ a: 1, b: 2 },
				freshContext,
				3,
				10,
				2,
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe(3);
		});

		it("should apply jitter when specified", async () => {
			const freshContext = createA2AContext();
			const result = await retryTool(
				addToolName,
				{ a: 1, b: 2 },
				freshContext,
				1,
				10,
				2,
				5, // 5ms jitter
			);

			expect(result.success).toBe(true);
		});
	});

	describe("fallbackTool", () => {
		it("should use primary tool if it succeeds", async () => {
			const freshContext = createA2AContext();
			const result = await fallbackTool(
				addToolName,
				multiplyToolName,
				{ a: 1, b: 2 },
				freshContext,
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe(3); // add: 1+2
		});
	});
});
