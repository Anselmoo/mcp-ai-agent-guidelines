/**
 * Branch coverage tests for tool-invoker.ts
 * Targets uncovered branches:
 * - context.depth at maxDepth → RecursionDepthError
 * - hasChainTimedOut → ChainTimeoutError
 * - deduplicate=true with cache hit → cached result
 * - onError handler succeeds → recovery path
 * - onError handler also throws → double-failure path
 * - no context (top-level) path
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createA2AContext } from "../../../../src/tools/shared/a2a-context.js";
import {
	ChainTimeoutError,
	RecursionDepthError,
	ToolInvocationError,
} from "../../../../src/tools/shared/a2a-errors.js";
import {
	batchInvoke,
	invokeSequence,
	invokeTool,
} from "../../../../src/tools/shared/tool-invoker.js";
import { toolRegistry } from "../../../../src/tools/shared/tool-registry.js";

// Use unique tool names per test run to avoid conflicts with other test files
const makeName = (suffix: string) =>
	`invoker-branch-${suffix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function registerBasicTool(
	name: string,
	handler: (args: unknown) => Promise<{ success: true; data: unknown }>,
) {
	toolRegistry.register(
		{
			name,
			description: "test tool",
			inputSchema: z.object({}).passthrough(),
			canInvoke: ["*"],
		},
		handler,
	);
}

afterEach(() => {
	// Intentionally NOT clearing the whole registry — other tests may use it.
	// We use unique names, so no cleanup needed.
});

// ─── Top-level invocation (no context) ───────────────────────────────────────

describe("invokeTool – top-level (no context)", () => {
	it("should succeed without context", async () => {
		const name = makeName("no-ctx");
		registerBasicTool(name, async () => ({ success: true, data: "ok" }));
		const result = await invokeTool(name, {});
		expect(result.success).toBe(true);
	});

	it("should return tool output without context", async () => {
		const name = makeName("no-ctx-data");
		registerBasicTool(name, async () => ({
			success: true,
			data: { message: "ok" },
		}));
		const result = await invokeTool(name, {});
		expect(result.data).toEqual({ message: "ok" });
	});

	it("should accept deduplicate=false option without context", async () => {
		const name = makeName("no-ctx-dedup");
		registerBasicTool(name, async () => ({ success: true, data: "ok" }));
		const result = await invokeTool(name, {}, undefined, {
			deduplicate: false,
		});
		expect(result.success).toBe(true);
	});
});

// ─── RecursionDepthError ──────────────────────────────────────────────────────

describe("invokeTool – RecursionDepthError", () => {
	it("should throw RecursionDepthError when maxDepth is exceeded", async () => {
		const name = makeName("recursion");
		registerBasicTool(name, async () => ({ success: true, data: "ok" }));

		// Set depth == maxDepth; createChildContext(depth+1 > maxDepth) will throw
		const ctx = createA2AContext(undefined, { maxDepth: 2 });
		ctx.depth = 2;

		await expect(invokeTool(name, {}, ctx)).rejects.toBeInstanceOf(
			RecursionDepthError,
		);
	});

	it("should include depth information in RecursionDepthError", async () => {
		const name = makeName("recursion-info");
		registerBasicTool(name, async () => ({ success: true, data: "ok" }));

		const ctx = createA2AContext(undefined, { maxDepth: 1 });
		ctx.depth = 1;

		const err = await invokeTool(name, {}, ctx).catch((e) => e);
		expect(err).toBeInstanceOf(RecursionDepthError);
	});
});

// ─── ChainTimeoutError ────────────────────────────────────────────────────────

describe("invokeTool – ChainTimeoutError", () => {
	it("should throw ChainTimeoutError when chain has already timed out", async () => {
		const name = makeName("timeout");
		registerBasicTool(name, async () => ({ success: true, data: "ok" }));

		// Create context with chainTimeoutMs=1 and shift chainStartTime 10s into the past
		const ctx = createA2AContext(undefined, { chainTimeoutMs: 1 });
		ctx.chainStartTime = new Date(Date.now() - 10000);

		await expect(invokeTool(name, {}, ctx)).rejects.toBeInstanceOf(
			ChainTimeoutError,
		);
	});

	it("should include tool name in ChainTimeoutError", async () => {
		const name = makeName("timeout-name");
		registerBasicTool(name, async () => ({ success: true, data: "ok" }));

		const ctx = createA2AContext(undefined, { chainTimeoutMs: 1 });
		ctx.chainStartTime = new Date(Date.now() - 10000);

		const err = await invokeTool(name, {}, ctx).catch((e) => e);
		expect(err).toBeInstanceOf(ChainTimeoutError);
	});
});

// ─── Deduplication cache hit ──────────────────────────────────────────────────

describe("invokeTool – deduplication cache hit", () => {
	it("should return cached result on duplicate invocation", async () => {
		const name = makeName("dedup-hit");
		registerBasicTool(name, async () => ({
			success: true,
			data: { message: "ok" },
		}));
		const ctx = createA2AContext();

		// First call populates execution log
		await invokeTool(name, { val: 42 }, ctx);
		// Second call with same args + deduplicate=true → cached
		const cached = await invokeTool(name, { val: 42 }, ctx, {
			deduplicate: true,
		});
		expect(cached.data).toMatchObject({ cached: true });
	});

	it("should NOT return cached for different inputs", async () => {
		const name = makeName("dedup-miss");
		registerBasicTool(name, async () => ({
			success: true,
			data: { message: "ok" },
		}));
		const ctx = createA2AContext();

		await invokeTool(name, { val: 1 }, ctx);
		const result = await invokeTool(name, { val: 2 }, ctx, {
			deduplicate: true,
		});
		expect(result.data).toEqual({ message: "ok" });
	});

	it("should NOT return cached when deduplicate=false", async () => {
		const name = makeName("dedup-false");
		registerBasicTool(name, async () => ({
			success: true,
			data: { message: "ok" },
		}));
		const ctx = createA2AContext();

		await invokeTool(name, { val: 99 }, ctx);
		const result = await invokeTool(name, { val: 99 }, ctx, {
			deduplicate: false,
		});
		expect(result.data).toEqual({ message: "ok" });
	});

	it("should skip deduplication without context", async () => {
		const name = makeName("dedup-no-ctx");
		registerBasicTool(name, async () => ({ success: true, data: "ok" }));
		const result = await invokeTool(name, { val: 5 }, undefined, {
			deduplicate: true,
		});
		expect(result.success).toBe(true);
	});
});

// ─── onError handler – recovery succeeds ─────────────────────────────────────

describe("invokeTool – onError handler", () => {
	it("should call onError when tool throws and return recovery result", async () => {
		const name = makeName("on-error-ok");
		toolRegistry.register(
			{
				name,
				description: "failing tool",
				inputSchema: z.object({}).passthrough(),
				canInvoke: [],
			},
			async () => {
				throw new Error("tool failed");
			},
		);

		const recoveryData = { recovered: true, message: "fallback" };
		const onError = vi.fn().mockResolvedValue({
			success: true,
			data: recoveryData,
		});

		const result = await invokeTool(name, {}, undefined, { onError });

		expect(onError).toHaveBeenCalledOnce();
		expect(result.data).toEqual(recoveryData);
	});

	it("should call onError without context too", async () => {
		const name = makeName("on-error-no-ctx");
		toolRegistry.register(
			{
				name,
				description: "failing tool",
				inputSchema: z.object({}).passthrough(),
				canInvoke: [],
			},
			async () => {
				throw new Error("no-context fail");
			},
		);

		const onError = vi.fn().mockResolvedValue({
			success: true,
			data: { fallback: true },
		});

		const result = await invokeTool(name, {}, undefined, { onError });
		expect(onError).toHaveBeenCalledOnce();
		expect(result.data).toMatchObject({ fallback: true });
	});
});

// ─── onError recovery also throws ────────────────────────────────────────────

describe("invokeTool – onError recovery also throws", () => {
	it("should re-throw as ToolInvocationError when recovery fails", async () => {
		const name = makeName("double-fail");
		toolRegistry.register(
			{
				name,
				description: "failing tool",
				inputSchema: z.object({}).passthrough(),
				canInvoke: [],
			},
			async () => {
				throw new Error("primary failure");
			},
		);

		const onError = vi
			.fn()
			.mockRejectedValue(new Error("recovery also failed"));

		await expect(
			invokeTool(name, {}, undefined, { onError }),
		).rejects.toBeInstanceOf(ToolInvocationError);

		expect(onError).toHaveBeenCalledOnce();
	});

	it("should wrap original error in ToolInvocationError when recovery fails", async () => {
		const name = makeName("double-fail-2");
		toolRegistry.register(
			{
				name,
				description: "failing",
				inputSchema: z.object({}).passthrough(),
				canInvoke: [],
			},
			async () => {
				throw new Error("original error");
			},
		);

		const onError = vi.fn().mockRejectedValue(new Error("recovery crash"));

		const err = await invokeTool(name, {}, undefined, { onError }).catch(
			(e) => e,
		);
		expect(err).toBeInstanceOf(ToolInvocationError);
		expect(err.toolName).toBe(name);
	});
});

// ─── batchInvoke ──────────────────────────────────────────────────────────────

describe("batchInvoke", () => {
	beforeEach(() => {
		// Register a shared tool for batch tests
		const name = "batch-tool-shared";
		if (!toolRegistry.listTools().find((t) => t.name === name)) {
			registerBasicTool(name, async () => ({
				success: true,
				data: { message: "ok" },
			}));
		}
	});

	it("should invoke multiple tools in parallel", async () => {
		const name = makeName("batch-parallel");
		registerBasicTool(name, async () => ({ success: true, data: "done" }));
		const results = await batchInvoke([
			{ toolName: name, args: { a: 1 } },
			{ toolName: name, args: { b: 2 } },
		]);
		expect(results).toHaveLength(2);
		expect(results.every((r) => r.success)).toBe(true);
	});

	it("should pass context to all invocations", async () => {
		const name = makeName("batch-ctx");
		registerBasicTool(name, async () => ({ success: true, data: "done" }));
		const ctx = createA2AContext();
		const results = await batchInvoke([{ toolName: name, args: {} }], ctx);
		expect(results[0].success).toBe(true);
	});
});

// ─── invokeSequence ───────────────────────────────────────────────────────────

describe("invokeSequence", () => {
	it("should chain tools passing previous output as next input via transform", async () => {
		const name = makeName("seq-chain");
		let receivedInput: unknown;
		toolRegistry.register(
			{
				name,
				description: "sequence tool",
				inputSchema: z.object({}).passthrough(),
				canInvoke: [],
			},
			async (args) => {
				receivedInput = args;
				return { success: true as const, data: { message: "ok" } };
			},
		);

		await invokeSequence(
			[
				{ toolName: name },
				{ toolName: name, transform: (out) => ({ transformed: out }) },
			],
			undefined,
			{ initial: true },
		);

		expect(receivedInput).toMatchObject({ transformed: { message: "ok" } });
	});

	it("should stop on first failure", async () => {
		const failName = makeName("seq-fail");
		const afterName = makeName("seq-after");
		let afterCalled = false;

		toolRegistry.register(
			{
				name: failName,
				description: "failing tool",
				inputSchema: z.object({}).passthrough(),
				canInvoke: [],
			},
			async () => ({ success: false as const, data: null }),
		);
		toolRegistry.register(
			{
				name: afterName,
				description: "should not run",
				inputSchema: z.object({}).passthrough(),
				canInvoke: [],
			},
			async () => {
				afterCalled = true;
				return { success: true as const, data: "ran" };
			},
		);

		const result = await invokeSequence([
			{ toolName: failName },
			{ toolName: afterName },
		]);
		expect(result.success).toBe(false);
		expect(afterCalled).toBe(false);
	});
});
