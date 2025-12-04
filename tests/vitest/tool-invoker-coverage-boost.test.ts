/**
 * Additional tests to boost tool-invoker.ts coverage
 * Targeting uncovered branches:
 * - Line 75: recursion depth error handling
 * - Line 90: chain timeout error
 * - Line 130: remaining chain time with timeout
 * - Line 172-183: custom error handler with recovery
 * - Line 193-195: recovery error handling
 * - Line 210: error logging
 * - Line 307: output summary truncation
 */
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createA2AContext } from "../../src/tools/shared/a2a-context.js";
import {
	ChainTimeoutError,
	RecursionDepthError,
} from "../../src/tools/shared/a2a-errors.js";
import {
	batchInvoke,
	invokeSequence,
	invokeTool,
} from "../../src/tools/shared/tool-invoker.js";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

describe("ToolInvoker Coverage Boost", () => {
	let toolSuffix: string;

	beforeEach(() => {
		toolSuffix = `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	});

	const registerTool = (
		name: string,
		handler: (
			args: unknown,
		) => Promise<{ success: boolean; data?: unknown; error?: string }>,
	) => {
		try {
			toolRegistry.register(
				{
					name,
					description: `Test tool ${name}`,
					inputSchema: z.object({}).passthrough(),
					canInvoke: ["*"],
				},
				handler,
			);
		} catch {
			// Tool may already be registered
		}
		return name;
	};

	describe("Recursion depth handling - Line 75", () => {
		it("should throw RecursionDepthError when max depth exceeded", async () => {
			const toolName = registerTool(`depth-test-${toolSuffix}`, async () => ({
				success: true,
				data: "ok",
			}));

			// Create context with max depth of 2 and current depth at 2
			const context = createA2AContext(undefined, { maxDepth: 2 });
			// Manually set depth to max so createChildContext will throw
			(context as { depth: number }).depth = 2;

			await expect(invokeTool(toolName, {}, context)).rejects.toThrow(
				RecursionDepthError,
			);
		});
	});

	describe("Chain timeout - Line 90", () => {
		it("should throw ChainTimeoutError when chain has timed out", async () => {
			const toolName = registerTool(`timeout-test-${toolSuffix}`, async () => ({
				success: true,
				data: "ok",
			}));

			// Create context with chain timeout - note: first arg is correlationId, second is config
			const context = createA2AContext(undefined, { chainTimeoutMs: 1 });

			// Wait for timeout to elapse
			await new Promise((resolve) => setTimeout(resolve, 10));

			await expect(invokeTool(toolName, {}, context)).rejects.toThrow(
				ChainTimeoutError,
			);
		});
	});

	describe("Timeout calculation - Line 130", () => {
		it("should use minimum of option timeout and remaining chain time", async () => {
			const toolName = registerTool(`timeout-calc-${toolSuffix}`, async () => ({
				success: true,
				data: "ok",
			}));

			const context = createA2AContext({
				chainTimeoutMs: 10000,
				timeoutMs: 5000,
			});

			// The invocation should complete within the shorter timeout
			const result = await invokeTool(toolName, {}, context, {
				timeoutMs: 3000,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("Custom error handler - Lines 172-183", () => {
		it("should use custom error handler for recovery", async () => {
			const failingTool = registerTool(
				`fail-recover-${toolSuffix}`,
				async () => {
					throw new Error("Tool failure");
				},
			);

			const context = createA2AContext();

			const result = await invokeTool(failingTool, {}, context, {
				onError: async (error) => ({
					success: true,
					data: { recovered: true, originalError: error.message },
				}),
			});

			expect(result.success).toBe(true);
			expect((result.data as { recovered: boolean }).recovered).toBe(true);
		});

		it("should handle recovery handler failure", async () => {
			const failingTool = registerTool(
				`fail-no-recover-${toolSuffix}`,
				async () => {
					throw new Error("Primary failure");
				},
			);

			const context = createA2AContext();

			await expect(
				invokeTool(failingTool, {}, context, {
					onError: async () => {
						throw new Error("Recovery also failed");
					},
				}),
			).rejects.toThrow();
		});
	});

	describe("Deduplication - Line 107", () => {
		it("should skip duplicate invocations when deduplicate is true", async () => {
			let callCount = 0;
			const toolName = registerTool(`dedup-${toolSuffix}`, async () => {
				callCount++;
				return { success: true, data: { count: callCount } };
			});

			const context = createA2AContext();

			// First call
			const result1 = await invokeTool(toolName, { key: "value" }, context, {
				deduplicate: true,
			});

			// Second call with same args
			const result2 = await invokeTool(toolName, { key: "value" }, context, {
				deduplicate: true,
			});

			// Only one actual invocation
			expect(callCount).toBe(1);
			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
		});
	});

	describe("Output summary truncation - Line 307", () => {
		it("should truncate long output summaries", async () => {
			const longOutput = "x".repeat(500);
			const toolName = registerTool(`long-output-${toolSuffix}`, async () => ({
				success: true,
				data: longOutput,
			}));

			const context = createA2AContext();
			await invokeTool(toolName, {}, context);

			// Check that execution log was added with truncated output
			expect(context.executionLog.length).toBeGreaterThan(0);
			const lastEntry = context.executionLog[context.executionLog.length - 1];
			expect(lastEntry.outputSummary.length).toBeLessThanOrEqual(203); // 200 + "..."
		});

		it("should handle null/undefined output", async () => {
			const toolName = registerTool(`null-output-${toolSuffix}`, async () => ({
				success: true,
				data: null,
			}));

			const context = createA2AContext();
			const result = await invokeTool(toolName, {}, context);

			expect(result.success).toBe(true);
		});
	});

	describe("Batch invocation", () => {
		it("should invoke multiple tools in parallel", async () => {
			const tool1 = registerTool(`batch1-${toolSuffix}`, async () => ({
				success: true,
				data: { tool: 1 },
			}));

			const tool2 = registerTool(`batch2-${toolSuffix}`, async () => ({
				success: true,
				data: { tool: 2 },
			}));

			const context = createA2AContext();

			const results = await batchInvoke(
				[
					{ toolName: tool1, args: {} },
					{ toolName: tool2, args: {} },
				],
				context,
			);

			expect(results.length).toBe(2);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(true);
		});

		it("should handle batch invocation without context", async () => {
			const toolName = registerTool(`batch-no-ctx-${toolSuffix}`, async () => ({
				success: true,
				data: "ok",
			}));

			const results = await batchInvoke([
				{ toolName, args: {} },
				{ toolName, args: {} },
			]);

			expect(results.length).toBe(2);
		});
	});

	describe("Sequence invocation", () => {
		it("should invoke tools in sequence with output chaining", async () => {
			const order: number[] = [];

			const tool1 = registerTool(`seq1-${toolSuffix}`, async (args) => {
				order.push(1);
				return { success: true, data: { step: 1, input: args } };
			});

			const tool2 = registerTool(`seq2-${toolSuffix}`, async (args) => {
				order.push(2);
				return { success: true, data: { step: 2, prevInput: args } };
			});

			const context = createA2AContext();

			const result = await invokeSequence(
				[{ toolName: tool1 }, { toolName: tool2 }],
				context,
				{ initial: "data" },
			);

			expect(result.success).toBe(true);
			expect(order).toEqual([1, 2]);
		});

		it("should stop sequence on failure", async () => {
			const tool1 = registerTool(`seq-fail-${toolSuffix}`, async () => ({
				success: false,
				error: "Step 1 failed",
			}));

			const tool2 = registerTool(`seq-never-${toolSuffix}`, async () => ({
				success: true,
				data: "should not reach",
			}));

			const context = createA2AContext();

			const result = await invokeSequence(
				[{ toolName: tool1 }, { toolName: tool2 }],
				context,
			);

			// Should stop at first failure
			expect(result.success).toBe(false);
		});
	});

	describe("Invocation without context", () => {
		it("should invoke tool without A2A context", async () => {
			const toolName = registerTool(`no-ctx-${toolSuffix}`, async () => ({
				success: true,
				data: "no context",
			}));

			const result = await invokeTool(toolName, {});

			expect(result.success).toBe(true);
		});
	});

	describe("Error type preservation", () => {
		it("should preserve RecursionDepthError type", async () => {
			const toolName = registerTool(
				`preserve-depth-${toolSuffix}`,
				async () => {
					throw new RecursionDepthError(5, 3, { test: true });
				},
			);

			await expect(invokeTool(toolName, {})).rejects.toThrow(
				RecursionDepthError,
			);
		});

		it("should preserve ChainTimeoutError type", async () => {
			const toolName = registerTool(
				`preserve-chain-${toolSuffix}`,
				async () => {
					throw new ChainTimeoutError(1000, 5, { test: true });
				},
			);

			await expect(invokeTool(toolName, {})).rejects.toThrow(ChainTimeoutError);
		});
	});
});
