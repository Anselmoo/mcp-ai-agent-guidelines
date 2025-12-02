import { beforeEach, describe, expect, it } from "vitest";
import {
	A2A_DEFAULTS,
	type A2AContext,
	addExecutionLogEntry,
	createA2AContext,
	createChildContext,
	getExecutionSummary,
	getRemainingChainTime,
	hasChainTimedOut,
	hashInput,
} from "../../src/tools/shared/a2a-context.js";

describe("A2AContext", () => {
	describe("createA2AContext", () => {
		it("should create a context with default values", () => {
			const context = createA2AContext();

			expect(context.correlationId).toMatch(/^a2a_[a-z0-9]+_[a-z0-9]+$/);
			expect(context.depth).toBe(0);
			expect(context.maxDepth).toBe(A2A_DEFAULTS.MAX_DEPTH);
			expect(context.sharedState).toBeInstanceOf(Map);
			expect(context.executionLog).toEqual([]);
			expect(context.timeoutMs).toBe(A2A_DEFAULTS.DEFAULT_TIMEOUT_MS);
			expect(context.chainStartTime).toBeInstanceOf(Date);
			expect(context.chainTimeoutMs).toBe(
				A2A_DEFAULTS.DEFAULT_CHAIN_TIMEOUT_MS,
			);
		});

		it("should create a context with custom correlation ID", () => {
			const customId = "test-correlation-123";
			const context = createA2AContext(customId);

			expect(context.correlationId).toBe(customId);
		});

		it("should create a context with custom config", () => {
			const context = createA2AContext(undefined, {
				maxDepth: 5,
				timeoutMs: 5000,
				chainTimeoutMs: 60000,
			});

			expect(context.maxDepth).toBe(5);
			expect(context.timeoutMs).toBe(5000);
			expect(context.chainTimeoutMs).toBe(60000);
		});
	});

	describe("createChildContext", () => {
		let parent: A2AContext;

		beforeEach(() => {
			parent = createA2AContext();
		});

		it("should create a child context with incremented depth", () => {
			const child = createChildContext(parent, "test-tool");

			expect(child.depth).toBe(parent.depth + 1);
			expect(child.parentToolName).toBe("test-tool");
			expect(child.correlationId).toBe(parent.correlationId);
		});

		it("should share state and log with parent", () => {
			parent.sharedState.set("key", "value");
			const child = createChildContext(parent, "test-tool");

			expect(child.sharedState).toBe(parent.sharedState);
			expect(child.executionLog).toBe(parent.executionLog);
		});

		it("should throw error when max depth exceeded", () => {
			parent.depth = parent.maxDepth;

			expect(() => createChildContext(parent, "test-tool")).toThrow(
				/Maximum recursion depth/,
			);
		});

		it("should allow depth up to maxDepth", () => {
			parent.depth = parent.maxDepth - 1;

			expect(() => createChildContext(parent, "test-tool")).not.toThrow();
		});
	});

	describe("addExecutionLogEntry", () => {
		let context: A2AContext;

		beforeEach(() => {
			context = createA2AContext();
		});

		it("should add entry to execution log", () => {
			addExecutionLogEntry(context, {
				toolName: "test-tool",
				inputHash: "abc123",
				outputSummary: "success",
				durationMs: 100,
				status: "success",
			});

			expect(context.executionLog).toHaveLength(1);
			expect(context.executionLog[0]).toMatchObject({
				toolName: "test-tool",
				inputHash: "abc123",
				outputSummary: "success",
				durationMs: 100,
				status: "success",
			});
		});

		it("should add timestamp and depth automatically", () => {
			const before = new Date();
			addExecutionLogEntry(context, {
				toolName: "test-tool",
				inputHash: "abc123",
				outputSummary: "success",
				durationMs: 100,
				status: "success",
			});
			const after = new Date();

			const entry = context.executionLog[0];
			expect(entry.timestamp).toBeInstanceOf(Date);
			expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(
				before.getTime(),
			);
			expect(entry.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
			expect(entry.depth).toBe(context.depth);
		});

		it("should add multiple entries", () => {
			addExecutionLogEntry(context, {
				toolName: "tool1",
				inputHash: "hash1",
				outputSummary: "output1",
				durationMs: 100,
				status: "success",
			});

			addExecutionLogEntry(context, {
				toolName: "tool2",
				inputHash: "hash2",
				outputSummary: "output2",
				durationMs: 200,
				status: "error",
				errorDetails: "Something went wrong",
			});

			expect(context.executionLog).toHaveLength(2);
			expect(context.executionLog[0].toolName).toBe("tool1");
			expect(context.executionLog[1].toolName).toBe("tool2");
			expect(context.executionLog[1].errorDetails).toBe("Something went wrong");
		});
	});

	describe("hasChainTimedOut", () => {
		it("should return false when no timeout set", () => {
			const context = createA2AContext(undefined, {
				chainTimeoutMs: undefined,
			});

			expect(hasChainTimedOut(context)).toBe(false);
		});

		it("should return false when within timeout", () => {
			const context = createA2AContext(undefined, { chainTimeoutMs: 10000 });

			expect(hasChainTimedOut(context)).toBe(false);
		});

		it("should return true when timeout exceeded", () => {
			const context = createA2AContext(undefined, { chainTimeoutMs: 100 });
			context.chainStartTime = new Date(Date.now() - 200);

			expect(hasChainTimedOut(context)).toBe(true);
		});
	});

	describe("getRemainingChainTime", () => {
		it("should return undefined when no timeout set", () => {
			// Create context without chainTimeoutMs by not including it in config
			const context = createA2AContext();
			context.chainTimeoutMs = undefined; // Explicitly remove timeout

			expect(getRemainingChainTime(context)).toBeUndefined();
		});

		it("should return remaining time", () => {
			const context = createA2AContext(undefined, { chainTimeoutMs: 5000 });
			const remaining = getRemainingChainTime(context);

			expect(remaining).toBeDefined();
			expect(remaining!).toBeGreaterThan(4000);
			expect(remaining!).toBeLessThanOrEqual(5000);
		});

		it("should return 0 when timeout exceeded", () => {
			const context = createA2AContext(undefined, { chainTimeoutMs: 100 });
			context.chainStartTime = new Date(Date.now() - 200);

			expect(getRemainingChainTime(context)).toBe(0);
		});
	});

	describe("hashInput", () => {
		it("should return consistent hash for same input", () => {
			const input = { key: "value", num: 123 };
			const hash1 = hashInput(input);
			const hash2 = hashInput(input);

			expect(hash1).toBe(hash2);
		});

		it("should return different hash for different input", () => {
			const hash1 = hashInput({ key: "value1" });
			const hash2 = hashInput({ key: "value2" });

			expect(hash1).not.toBe(hash2);
		});

		it("should handle various input types", () => {
			expect(hashInput(null)).toBeTruthy();
			expect(hashInput(undefined)).toBeTruthy();
			expect(hashInput(123)).toBeTruthy();
			expect(hashInput("string")).toBeTruthy();
			expect(hashInput([1, 2, 3])).toBeTruthy();
			expect(hashInput({ nested: { obj: true } })).toBeTruthy();
		});
	});

	describe("getExecutionSummary", () => {
		let context: A2AContext;

		beforeEach(() => {
			context = createA2AContext();
		});

		it("should return summary for empty log", () => {
			const summary = getExecutionSummary(context);

			expect(summary).toMatchObject({
				correlationId: context.correlationId,
				totalDurationMs: 0,
				toolCount: 0,
				successCount: 0,
				errorCount: 0,
				skippedCount: 0,
				maxDepthReached: 0,
			});
		});

		it("should calculate summary correctly", () => {
			addExecutionLogEntry(context, {
				toolName: "tool1",
				inputHash: "hash1",
				outputSummary: "output1",
				durationMs: 100,
				status: "success",
			});

			addExecutionLogEntry(context, {
				toolName: "tool2",
				inputHash: "hash2",
				outputSummary: "output2",
				durationMs: 200,
				status: "error",
				errorDetails: "Error",
			});

			addExecutionLogEntry(context, {
				toolName: "tool3",
				inputHash: "hash3",
				outputSummary: "",
				durationMs: 50,
				status: "skipped",
			});

			const summary = getExecutionSummary(context);

			expect(summary).toMatchObject({
				correlationId: context.correlationId,
				totalDurationMs: 350,
				toolCount: 3,
				successCount: 1,
				errorCount: 1,
				skippedCount: 1,
				maxDepthReached: 0,
			});
		});

		it("should track max depth reached", () => {
			context.depth = 0;
			addExecutionLogEntry(context, {
				toolName: "tool1",
				inputHash: "hash1",
				outputSummary: "output1",
				durationMs: 100,
				status: "success",
			});

			const child = createChildContext(context, "tool1");
			child.depth = 1;
			addExecutionLogEntry(child, {
				toolName: "tool2",
				inputHash: "hash2",
				outputSummary: "output2",
				durationMs: 100,
				status: "success",
			});

			const grandchild = createChildContext(child, "tool2");
			grandchild.depth = 2;
			addExecutionLogEntry(grandchild, {
				toolName: "tool3",
				inputHash: "hash3",
				outputSummary: "output3",
				durationMs: 100,
				status: "success",
			});

			const summary = getExecutionSummary(context);
			expect(summary.maxDepthReached).toBe(2);
		});
	});
});
