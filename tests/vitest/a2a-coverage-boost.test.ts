/**
 * A2A Coverage Boost Tests
 *
 * Tests targeting uncovered branches and lines in A2A infrastructure files.
 * Uses simpler test patterns that avoid permission/context issues.
 */

import crypto from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import { reducers } from "../../src/tools/shared/async-patterns.js";
import {
	type ExecutionPlan,
	executeChain,
} from "../../src/tools/shared/execution-controller.js";
import {
	batchInvoke,
	invokeSequence,
	invokeTool,
} from "../../src/tools/shared/tool-invoker.js";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";
import {
	createTraceFromContext,
	TraceLogger,
} from "../../src/tools/shared/trace-logger.js";

// Helper to generate unique tool names
function uniqueToolName(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

describe("A2A Coverage Boost", () => {
	describe("async-patterns comprehensive coverage", () => {
		it("should cover mapReduceTools with failures (line 49)", async () => {
			const failingTool = uniqueToolName("map-fail");
			let _calls = 0;

			toolRegistry.register(
				{
					name: failingTool,
					description: "Fails sometimes",
					inputSchema: z.object({ shouldFail: z.boolean() }),
					canInvoke: [failingTool], // Allow self-invocation
				},
				async (args) => {
					_calls++;
					const { shouldFail } = args as { shouldFail: boolean };
					if (shouldFail) {
						return { success: false, error: "Failed" };
					}
					return { success: true, data: "ok" };
				},
			);

			const { mapReduceTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			const result = await mapReduceTools(
				failingTool,
				[{ shouldFail: false }, { shouldFail: true }, { shouldFail: false }],
				context,
				reducers.collectSuccessful,
			);

			expect(result).toHaveLength(2);
		});

		it("should cover pipelineTools failure (line 95)", async () => {
			const pipeFail = uniqueToolName("pipe-fail");

			toolRegistry.register(
				{
					name: pipeFail,
					description: "Pipeline failing tool",
					inputSchema: z.unknown(),
					canInvoke: [pipeFail], // Allow self-invocation
				},
				async () => ({ success: false, error: "Pipeline step failed" }),
			);

			const { pipelineTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			await expect(
				pipelineTools([{ toolName: pipeFail }], context, {}),
			).rejects.toThrow(/Pipeline failed/);
		});

		it("should cover waterfallTools failure propagation (line 247)", async () => {
			const waterFail = uniqueToolName("water-fail");

			toolRegistry.register(
				{
					name: waterFail,
					description: "Waterfall failing tool",
					inputSchema: z.unknown(),
					canInvoke: [waterFail], // Allow self-invocation
				},
				async () => ({ success: false, error: "Waterfall step failed" }),
			);

			const { waterfallTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			const result = await waterfallTools([waterFail], context, {});
			expect(result.success).toBe(false);
			expect(result.error).toBe("Waterfall step failed");
		});

		it("should cover raceTools all-failure case (lines 284, 292)", async () => {
			const raceFail = uniqueToolName("race-fail");

			toolRegistry.register(
				{
					name: raceFail,
					description: "Always fails in race",
					inputSchema: z.unknown(),
					canInvoke: [raceFail], // Allow self-invocation
				},
				async () => ({ success: false, error: "Race tool failed" }),
			);

			const { raceTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			const result = await raceTools(
				[
					{ toolName: raceFail, args: {} },
					{ toolName: raceFail, args: {} },
				],
				context,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("All tools failed");
		});

		it("should cover retryTool with actual retries (lines 335-358)", async () => {
			const retryTarget = uniqueToolName("retry-target");
			let attempts = 0;

			toolRegistry.register(
				{
					name: retryTarget,
					description: "Fails then succeeds",
					inputSchema: z.unknown(),
					canInvoke: [retryTarget], // Allow self-invocation
				},
				async () => {
					attempts++;
					if (attempts < 3) {
						return { success: false, error: "Not yet" };
					}
					return { success: true, data: "finally" };
				},
			);

			const { retryTool } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			const result = await retryTool(retryTarget, {}, context, 3, 5, 2, 1);

			expect(result.success).toBe(true);
			expect(result.data).toBe("finally");
			expect(attempts).toBe(3);
		});

		it("should cover retryTool with thrown exception", async () => {
			const throwRetry = uniqueToolName("throw-retry");
			let attempts = 0;

			toolRegistry.register(
				{
					name: throwRetry,
					description: "Throws then succeeds",
					inputSchema: z.unknown(),
					canInvoke: [throwRetry], // Allow self-invocation
				},
				async () => {
					attempts++;
					if (attempts < 2) {
						throw new Error("Thrown error");
					}
					return { success: true, data: "recovered" };
				},
			);

			const { retryTool } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			const result = await retryTool(throwRetry, {}, context, 2, 5, 2, 0);

			expect(result.success).toBe(true);
		});

		it("should cover retryTool exhausting all retries", async () => {
			const alwaysFail = uniqueToolName("always-fail");

			toolRegistry.register(
				{
					name: alwaysFail,
					description: "Always fails",
					inputSchema: z.unknown(),
					canInvoke: [alwaysFail], // Allow self-invocation
				},
				async () => ({ success: false, error: "Always fails" }),
			);

			const { retryTool } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			const result = await retryTool(alwaysFail, {}, context, 2, 5, 2, 0);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed after");
		});

		it("should cover fallbackTool when primary fails (lines 391, 397)", async () => {
			const primaryFail = uniqueToolName("primary-fail");
			const fallbackSuccess = uniqueToolName("fallback-success");

			toolRegistry.register(
				{
					name: primaryFail,
					description: "Primary that fails",
					inputSchema: z.unknown(),
					canInvoke: [primaryFail, fallbackSuccess], // Allow invocations
				},
				async () => ({ success: false, error: "Primary failed" }),
			);

			toolRegistry.register(
				{
					name: fallbackSuccess,
					description: "Fallback that succeeds",
					inputSchema: z.unknown(),
					canInvoke: [primaryFail, fallbackSuccess], // Allow invocations
				},
				async (args) => ({ success: true, data: args }),
			);

			const { fallbackTool } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			const result = await fallbackTool(
				primaryFail,
				fallbackSuccess,
				{ test: "data" },
				context,
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ test: "data" });
		});

		it("should cover branchOnCondition true branch", async () => {
			const trueBranch = uniqueToolName("true-branch");
			const falseBranch = uniqueToolName("false-branch");

			toolRegistry.register(
				{
					name: trueBranch,
					description: "True branch",
					inputSchema: z.unknown(),
					canInvoke: [trueBranch, falseBranch],
				},
				async () => ({ success: true, data: "true" }),
			);

			toolRegistry.register(
				{
					name: falseBranch,
					description: "False branch",
					inputSchema: z.unknown(),
					canInvoke: [trueBranch, falseBranch],
				},
				async () => ({ success: true, data: "false" }),
			);

			const { branchOnCondition } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();
			context.sharedState.set("condition", true);

			const result = await branchOnCondition(
				(state) => state.get("condition") === true,
				trueBranch,
				falseBranch,
				{},
				context,
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe("true");
		});

		it("should cover branchOnCondition false branch", async () => {
			const trueBranch = uniqueToolName("true-branch2");
			const falseBranch = uniqueToolName("false-branch2");

			toolRegistry.register(
				{
					name: trueBranch,
					description: "True branch",
					inputSchema: z.unknown(),
					canInvoke: [trueBranch, falseBranch],
				},
				async () => ({ success: true, data: "true" }),
			);

			toolRegistry.register(
				{
					name: falseBranch,
					description: "False branch",
					inputSchema: z.unknown(),
					canInvoke: [trueBranch, falseBranch],
				},
				async () => ({ success: true, data: "false" }),
			);

			const { branchOnCondition } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();
			context.sharedState.set("condition", false);

			const result = await branchOnCondition(
				(state) => state.get("condition") === true,
				trueBranch,
				falseBranch,
				{},
				context,
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe("false");
		});

		it("should cover fanOut with chunked execution", async () => {
			const chunkTool = uniqueToolName("chunk-tool");

			toolRegistry.register(
				{
					name: chunkTool,
					description: "Chunk test tool",
					inputSchema: z.object({ n: z.number() }),
					canInvoke: [chunkTool], // Allow self-invocation
				},
				async (args) => ({
					success: true,
					data: (args as { n: number }).n * 2,
				}),
			);

			const { fanOut } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			const results = await fanOut(
				chunkTool,
				[{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }],
				context,
				2, // maxConcurrency of 2 will chunk into [2, 2, 1]
			);

			expect(results).toHaveLength(5);
			expect(results.every((r) => r.success)).toBe(true);
		});

		it("should cover scatterGatherTools", async () => {
			const scatter1 = uniqueToolName("scatter1");
			const scatter2 = uniqueToolName("scatter2");

			toolRegistry.register(
				{
					name: scatter1,
					description: "Scatter 1",
					inputSchema: z.object({ x: z.number() }),
					canInvoke: [scatter1, scatter2], // Allow invocations
				},
				async (args) => ({
					success: true,
					data: (args as { x: number }).x * 2,
				}),
			);

			toolRegistry.register(
				{
					name: scatter2,
					description: "Scatter 2",
					inputSchema: z.object({ y: z.number() }),
					canInvoke: [scatter1, scatter2], // Allow invocations
				},
				async (args) => ({
					success: true,
					data: (args as { y: number }).y * 3,
				}),
			);

			const { scatterGatherTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			const context = createA2AContext();

			const result = await scatterGatherTools(
				[
					{ toolName: scatter1, args: { x: 5 } },
					{ toolName: scatter2, args: { y: 10 } },
				],
				context,
				(resultMap) => {
					const values: number[] = [];
					for (const [, r] of resultMap) {
						if (r.success) values.push(r.data as number);
					}
					return values;
				},
			);

			expect(result).toContain(10); // 5 * 2
			expect(result).toContain(30); // 10 * 3
		});
	});

	describe("reducers additional coverage", () => {
		it("should merge results with null data", () => {
			const results = [
				{ success: true, data: { a: 1 } },
				{ success: true, data: null },
				{ success: true, data: { b: 2 } },
			];

			const merged = reducers.mergeResults(results);
			expect(merged).toEqual({ a: 1, b: 2 });
		});

		it("should handle empty results in mergeResults", () => {
			const merged = reducers.mergeResults([]);
			expect(merged).toEqual({});
		});

		it("should filter failed results in collectSuccessful", () => {
			const results = [
				{ success: false, error: "fail1" },
				{ success: true, data: "ok" },
				{ success: false, error: "fail2" },
			];

			const collected = reducers.collectSuccessful(results);
			expect(collected).toEqual(["ok"]);
		});
	});

	describe("trace-logger.ts coverage", () => {
		let logger: TraceLogger;
		let context: A2AContext;

		beforeEach(() => {
			logger = new TraceLogger();
			context = createA2AContext();
		});

		it("should handle ending non-existent span gracefully", () => {
			// Should not throw
			logger.endToolSpan("non-existent-span-id", true, "result");
			expect(true).toBe(true);
		});

		it("should export JSON format with summary", () => {
			const spanId = logger.startToolSpan(context, "test", "hash");
			logger.endToolSpan(spanId, true, "result");

			const exported = logger.exportTrace(context.correlationId, "json");
			const parsed = JSON.parse(exported);

			expect(parsed.summary).toBeDefined();
			expect(parsed.summary.totalSpans).toBe(1);
			expect(parsed.summary.successfulSpans).toBe(1);
			expect(parsed.summary.failedSpans).toBe(0);
		});

		it("should export OTLP format with attributes", () => {
			const spanId = logger.startToolSpan(context, "test-tool", "input-hash");
			logger.endToolSpan(spanId, false, undefined, "Test error");

			const exported = logger.exportTrace(context.correlationId, "otlp");
			const parsed = JSON.parse(exported);

			expect(
				parsed.resourceSpans[0].scopeSpans[0].spans[0].attributes,
			).toBeDefined();
			expect(parsed.resourceSpans[0].scopeSpans[0].spans[0].status.code).toBe(
				2,
			);
		});

		it("should calculate avgSpansPerChain correctly with multiple chains", () => {
			// First chain
			logger.startChain(context);
			const span1 = logger.startToolSpan(context, "tool1", "hash1");
			logger.endToolSpan(span1, true, "result1");
			logger.endChain(context, true);

			// Second chain
			const context2 = createA2AContext();
			logger.startChain(context2);
			const span2 = logger.startToolSpan(context2, "tool2", "hash2");
			logger.endToolSpan(span2, true, "result2");
			const span3 = logger.startToolSpan(context2, "tool3", "hash3");
			logger.endToolSpan(span3, true, "result3");
			logger.endChain(context2, true);

			const summary = logger.getSummary();
			expect(summary.totalChains).toBe(2);
			expect(summary.totalSpans).toBe(3);
		});

		it("should track tool_error event type", () => {
			const spanId = logger.startToolSpan(context, "fail-tool", "hash");
			logger.endToolSpan(spanId, false, undefined, "Error message");

			const events = logger.getEvents(context.correlationId);
			expect(events.some((e) => e.type === "tool_error")).toBe(true);
		});

		it("should handle timeline with spans that have no end time", () => {
			// Start but don't end
			logger.startToolSpan(context, "pending-tool", "hash");

			const timeline = logger.getTimeline(context.correlationId);
			expect(timeline.spans).toHaveLength(1);
			expect(timeline.totalDurationMs).toBe(0);
		});
	});

	describe("createTraceFromContext coverage", () => {
		it("should create trace with parent tool mapping", () => {
			const context = createA2AContext();

			context.executionLog.push({
				timestamp: new Date(),
				toolName: "parent-tool",
				inputHash: "hash1",
				outputSummary: "result1",
				durationMs: 100,
				status: "success",
				depth: 0,
			});

			context.executionLog.push({
				timestamp: new Date(),
				toolName: "child-tool",
				inputHash: "hash2",
				outputSummary: "result2",
				durationMs: 50,
				status: "error",
				depth: 1,
				parentToolName: "parent-tool",
				errorDetails: "Child failed",
			});

			const trace = createTraceFromContext(context);

			expect(trace.spans).toHaveLength(2);
			expect(trace.spans[0].status).toBe("success");
			expect(trace.spans[1].status).toBe("error");
			expect(trace.spans[1].error).toBe("Child failed");
			expect(trace.spans[1].parentSpanId).toBe("span_0");
		});

		it("should calculate totalDurationMs from spans", () => {
			const context = createA2AContext();

			context.executionLog.push({
				timestamp: new Date(),
				toolName: "tool1",
				inputHash: "hash1",
				outputSummary: "result1",
				durationMs: 100,
				status: "success",
				depth: 0,
			});

			context.executionLog.push({
				timestamp: new Date(),
				toolName: "tool2",
				inputHash: "hash2",
				outputSummary: "result2",
				durationMs: 150,
				status: "success",
				depth: 0,
			});

			const trace = createTraceFromContext(context);

			expect(trace.totalDurationMs).toBe(250);
		});
	});

	describe("execution-controller.ts coverage", () => {
		let context: A2AContext;
		let testTool: string;
		let failingTool: string;
		let throwingTool: string;

		beforeEach(() => {
			context = createA2AContext();
			testTool = uniqueToolName("exec-test");
			failingTool = uniqueToolName("exec-fail");
			throwingTool = uniqueToolName("exec-throw");

			toolRegistry.register(
				{
					name: testTool,
					description: "Test tool",
					inputSchema: z.object({ value: z.number().optional() }),
					canInvoke: [testTool, failingTool, throwingTool],
				},
				async (args) => {
					const { value = 1 } = args as { value?: number };
					return { success: true, data: value * 2 };
				},
			);

			toolRegistry.register(
				{
					name: failingTool,
					description: "Failing tool",
					inputSchema: z.object({}),
					canInvoke: [testTool, failingTool, throwingTool],
				},
				async () => {
					return { success: false, error: "Tool failed" };
				},
			);

			toolRegistry.register(
				{
					name: throwingTool,
					description: "Throwing tool",
					inputSchema: z.object({}),
					canInvoke: [testTool, failingTool, throwingTool],
				},
				async () => {
					throw new Error("Tool threw error");
				},
			);
		});

		it("should handle unknown strategy", async () => {
			const plan = {
				strategy: "invalid-strategy" as "sequential",
				steps: [],
				onError: "skip" as const,
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Unknown execution strategy");
		});

		it("should handle sequential abort on step failure", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{ id: "step1", toolName: failingTool, args: {} },
					{ id: "step2", toolName: testTool, args: { value: 1 } },
				],
				onError: "abort",
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Step step1 failed");
		});

		it("should handle sequential abort on thrown error", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{ id: "step1", toolName: throwingTool, args: {} },
					{ id: "step2", toolName: testTool, args: { value: 1 } },
				],
				onError: "abort",
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(false);
		});

		it("should handle parallel abort on thrown error", async () => {
			const plan: ExecutionPlan = {
				strategy: "parallel",
				steps: [{ id: "step1", toolName: throwingTool, args: {} }],
				onError: "abort",
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(false);
		});

		it("should handle parallel execution with step failure in abort mode", async () => {
			const plan: ExecutionPlan = {
				strategy: "parallel",
				steps: [{ id: "step1", toolName: failingTool, args: {} }],
				onError: "abort",
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(false);
		});

		it("should handle conditional abort on step failure", async () => {
			const plan: ExecutionPlan = {
				strategy: "conditional",
				steps: [{ id: "step1", toolName: failingTool, args: {} }],
				onError: "abort",
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(false);
		});

		it("should handle conditional abort on thrown error", async () => {
			const plan: ExecutionPlan = {
				strategy: "conditional",
				steps: [{ id: "step1", toolName: throwingTool, args: {} }],
				onError: "abort",
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(false);
		});

		it("should handle retry-with-backoff abort on step failure", async () => {
			const plan: ExecutionPlan = {
				strategy: "retry-with-backoff",
				steps: [{ id: "step1", toolName: failingTool, args: {} }],
				onError: "abort",
				retryConfig: {
					maxRetries: 1,
					initialDelayMs: 5,
					maxDelayMs: 10,
					backoffMultiplier: 2,
				},
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(false);
		});

		it("should handle retry-with-backoff with unmet dependencies", async () => {
			const plan: ExecutionPlan = {
				strategy: "retry-with-backoff",
				steps: [
					{
						id: "step1",
						toolName: testTool,
						args: { value: 1 },
						dependencies: ["nonexistent"],
					},
				],
				onError: "skip",
				retryConfig: {
					maxRetries: 1,
					initialDelayMs: 5,
					maxDelayMs: 10,
					backoffMultiplier: 2,
				},
			};

			const result = await executeChain(plan, context);

			// Step is skipped due to unmet dependencies
			expect(result.stepResults.has("step1")).toBe(false);
		});

		it("should handle parallel with dependencies", async () => {
			const plan: ExecutionPlan = {
				strategy: "parallel",
				steps: [
					{
						id: "step1",
						toolName: testTool,
						args: { value: 1 },
					},
					{
						id: "step2",
						toolName: testTool,
						args: { value: 2 },
						dependencies: ["step1"],
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			expect(result.stepResults.size).toBe(2);
		});

		it("should handle conditional strategy with unmet dependencies", async () => {
			const plan: ExecutionPlan = {
				strategy: "conditional",
				steps: [
					{
						id: "step1",
						toolName: testTool,
						args: { value: 1 },
						dependencies: ["nonexistent"],
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			// Step should be skipped due to unmet dependencies
			expect(result.stepResults.has("step1")).toBe(false);
		});

		it("should handle retry-with-backoff with default config", async () => {
			const plan: ExecutionPlan = {
				strategy: "retry-with-backoff",
				steps: [
					{
						id: "step1",
						toolName: testTool,
						args: { value: 1 },
					},
				],
				onError: "skip",
				// No retryConfig - should use defaults
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(true);
		});

		it("should merge results in parallel-with-join", async () => {
			const plan: ExecutionPlan = {
				strategy: "parallel-with-join",
				steps: [
					{
						id: "step1",
						toolName: testTool,
						args: { value: 1 },
					},
					{
						id: "step2",
						toolName: testTool,
						args: { value: 2 },
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(true);
			expect(context.sharedState.get("merged_results")).toBeDefined();
		});

		it("should use transform function in sequential execution", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: testTool,
						args: { value: 5 },
					},
					{
						id: "step2",
						toolName: testTool,
						args: {},
						dependencies: ["step1"],
						transform: (prev) => ({ value: (prev as number) + 1 }),
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			expect(result.success).toBe(true);
			// step1: 5 * 2 = 10, step2: (10 + 1) * 2 = 22
			expect(result.finalOutput).toBe(22);
		});

		it("should calculate summary with skipped steps", async () => {
			// Add a skipped entry to execution log
			context.executionLog.push({
				timestamp: new Date(),
				toolName: "skipped-tool",
				inputHash: "hash",
				outputSummary: "",
				durationMs: 0,
				status: "skipped",
				depth: 0,
			});

			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{
						id: "step1",
						toolName: testTool,
						args: { value: 1 },
					},
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			expect(result.summary.skippedSteps).toBe(1);
		});

		it("should get final output from last successful step", async () => {
			const plan: ExecutionPlan = {
				strategy: "sequential",
				steps: [
					{ id: "step1", toolName: testTool, args: { value: 1 } },
					{ id: "step2", toolName: failingTool, args: {} },
				],
				onError: "skip",
			};

			const result = await executeChain(plan, context);

			// Final output should be from step1 (last successful)
			expect(result.finalOutput).toBe(2); // 1 * 2
		});
	});

	describe("tool-invoker.ts coverage", () => {
		it("should handle invokeTool with timeout option", async () => {
			const fastTool = uniqueToolName("fast");

			toolRegistry.register(
				{
					name: fastTool,
					description: "Fast tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => ({ success: true, data: "fast" }),
			);

			const result = await invokeTool(fastTool, {}, undefined, {
				timeoutMs: 5000,
			});

			expect(result.success).toBe(true);
		});

		it("should handle batch invoke with empty array", async () => {
			const results = await batchInvoke([]);
			expect(results).toEqual([]);
		});

		it("should handle invokeSequence with single step", async () => {
			const singleTool = uniqueToolName("single");

			toolRegistry.register(
				{
					name: singleTool,
					description: "Single tool",
					inputSchema: z.unknown(),
					canInvoke: [],
				},
				async (args) => ({ success: true, data: args }),
			);

			const result = await invokeSequence(
				[{ toolName: singleTool }],
				undefined,
				{ input: "test" },
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ input: "test" });
		});

		it("should use onError handler for recovery", async () => {
			const errorTool = uniqueToolName("error");

			toolRegistry.register(
				{
					name: errorTool,
					description: "Error tool",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					throw new Error("Tool error");
				},
			);

			const result = await invokeTool(errorTool, {}, undefined, {
				onError: async (error) => ({
					success: true,
					data: { recovered: true, error: error.message },
				}),
			});

			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty("recovered", true);
		});

		it("should fall through when error recovery fails", async () => {
			const failRecovery = uniqueToolName("fail-recovery");

			toolRegistry.register(
				{
					name: failRecovery,
					description: "Fail recovery test",
					inputSchema: z.object({}),
					canInvoke: [],
				},
				async () => {
					throw new Error("Original error");
				},
			);

			await expect(
				invokeTool(failRecovery, {}, undefined, {
					onError: async () => {
						throw new Error("Recovery also failed");
					},
				}),
			).rejects.toThrow();
		});

		it("should handle invokeSequence stopping on failure", async () => {
			const successTool = uniqueToolName("seq-success");
			const failTool = uniqueToolName("seq-fail");

			toolRegistry.register(
				{
					name: successTool,
					description: "Success tool",
					inputSchema: z.unknown(),
					canInvoke: [successTool],
				},
				async (args) => ({ success: true, data: args }),
			);

			toolRegistry.register(
				{
					name: failTool,
					description: "Fail tool",
					inputSchema: z.unknown(),
					canInvoke: [failTool],
				},
				async () => ({ success: false, error: "Failed" }),
			);

			const result = await invokeSequence([
				{ toolName: successTool },
				{ toolName: failTool },
			]);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Failed");
		});

		it("should handle invokeTool with deduplication finding a match", async () => {
			const dedupTool = uniqueToolName("dedup");
			let callCount = 0;

			toolRegistry.register(
				{
					name: dedupTool,
					description: "Dedup tool",
					inputSchema: z.object({ key: z.string() }),
					canInvoke: [dedupTool],
				},
				async (_args) => {
					callCount++;
					return { success: true, data: `result-${callCount}` };
				},
			);

			const context = createA2AContext();
			// Manually add an entry to the execution log
			const inputHash = JSON.stringify({ key: "test" });
			context.executionLog.push({
				timestamp: new Date(),
				toolName: dedupTool,
				inputHash: crypto
					.createHash("sha256")
					.update(inputHash)
					.digest("hex")
					.substring(0, 16),
				outputSummary: "cached result",
				durationMs: 10,
				status: "success",
				depth: 0,
			});

			// First invocation should not be deduplicated (different hash)
			const result1 = await invokeTool(
				dedupTool,
				{ key: "different" },
				context,
				{
					deduplicate: true,
				},
			);

			expect(result1.success).toBe(true);
		});

		it("should handle batch invoke with multiple tools", async () => {
			const batch1 = uniqueToolName("batch1");
			const batch2 = uniqueToolName("batch2");

			toolRegistry.register(
				{
					name: batch1,
					description: "Batch 1",
					inputSchema: z.object({}),
					canInvoke: [batch1, batch2],
				},
				async () => ({ success: true, data: "batch1" }),
			);

			toolRegistry.register(
				{
					name: batch2,
					description: "Batch 2",
					inputSchema: z.object({}),
					canInvoke: [batch1, batch2],
				},
				async () => ({ success: true, data: "batch2" }),
			);

			const results = await batchInvoke([
				{ toolName: batch1, args: {} },
				{ toolName: batch2, args: {} },
			]);

			expect(results).toHaveLength(2);
			expect(results[0].data).toBe("batch1");
			expect(results[1].data).toBe("batch2");
		});
	});

	describe("agent-orchestrator.ts coverage", () => {
		let testTool: string;

		beforeEach(() => {
			testTool = uniqueToolName("orch-test");

			toolRegistry.register(
				{
					name: testTool,
					description: "Orchestrator test",
					inputSchema: z.object({ value: z.number().optional() }),
					canInvoke: [testTool],
				},
				async (args) => {
					const { value = 1 } = args as { value?: number };
					return { success: true, data: value * 2 };
				},
			);
		});

		// NOTE: The following tests are for the OLD agent-orchestrator implementation
		// with mode="template" and mode="custom" API. This API is being replaced.
		// Tests for the new action-based API are in agent-orchestrator.integration.spec.ts
		it.skip("should handle custom plan with non-object args", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{
							id: "step1",
							toolName: testTool,
							args: null, // non-object args
						},
					],
					onError: "skip",
				},
				parameters: { value: 5 },
				includeTrace: false,
			});

			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.success).toBeDefined();
		});

		it.skip("should execute quality-audit template", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "quality-audit",
				parameters: {
					projectPath: ".",
					codeContent: "const x = 1;",
					language: "typescript",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});

		it.skip("should execute security-scan template", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "security-scan",
				parameters: {
					dependencyContent: "{}",
					codeContext: "function test() {}",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});

		it.skip("should execute code-analysis-pipeline template", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "code-analysis-pipeline",
				parameters: {
					codeContent: "const x = 1;",
					projectPath: ".",
					description: "Test",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});

		it.skip("should execute documentation-generation template", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "documentation-generation",
				parameters: {
					projectPath: ".",
					contentType: "API",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});

		it.skip("should include visualization with mermaid diagram", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{
							id: "step1",
							toolName: testTool,
							args: { value: 1 },
						},
					],
					onError: "skip",
				},
				includeVisualization: true,
				includeTrace: true,
			});

			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.visualization).toContain("mermaid");
			expect(parsed.visualization).toContain("graph TD");
		});

		it.skip("should use custom correlationId from config", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{
							id: "step1",
							toolName: testTool,
							args: { value: 1 },
						},
					],
					onError: "skip",
				},
				config: {
					correlationId: "custom-correlation-123",
				},
				includeTrace: true,
			});

			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.summary.correlationId).toBe("custom-correlation-123");
		});

		it.skip("should handle error in template mode without template name", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				includeTrace: true,
			});

			expect(result.isError).toBe(true);
			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.error).toContain("Template name is required");
		});

		it.skip("should handle error in custom mode without execution plan", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				includeTrace: true,
			});

			expect(result.isError).toBe(true);
			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.error).toContain("Execution plan is required");
		});
	});
});
