import { describe, expect, it } from "vitest";
import {
	ChainTimeoutError,
	ExecutionStrategyError,
	OrchestrationError,
	RecursionDepthError,
	ToolInvocationError,
	ToolInvocationNotAllowedError,
	ToolNotFoundError,
	ToolTimeoutError,
} from "../../src/tools/shared/a2a-errors.js";

describe("A2A Errors", () => {
	describe("RecursionDepthError", () => {
		it("should create error with correct properties", () => {
			const error = new RecursionDepthError("test-tool", 10, 10);

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(RecursionDepthError);
			expect(error.name).toBe("RecursionDepthError");
			expect(error.message).toContain("test-tool");
			expect(error.message).toContain("10");
			expect(error.code).toBe("RECURSION_DEPTH_EXCEEDED");
			expect(error.context).toEqual({
				toolName: "test-tool",
				currentDepth: 10,
				maxDepth: 10,
			});
			expect(error.timestamp).toBeInstanceOf(Date);
		});

		it("should be catchable as Error", () => {
			try {
				throw new RecursionDepthError("test", 5, 3);
			} catch (e) {
				expect(e).toBeInstanceOf(Error);
				expect(e instanceof RecursionDepthError).toBe(true);
			}
		});
	});

	describe("ToolTimeoutError", () => {
		it("should create error with timeout details", () => {
			const error = new ToolTimeoutError("slow-tool", 5000, 10000);

			expect(error.name).toBe("ToolTimeoutError");
			expect(error.message).toContain("slow-tool");
			expect(error.message).toContain("5000");
			expect(error.code).toBe("TOOL_TIMEOUT");
			expect(error.context).toEqual({
				toolName: "slow-tool",
				timeoutMs: 5000,
				elapsedMs: 10000,
			});
		});
	});

	describe("ChainTimeoutError", () => {
		it("should create error with chain timeout details", () => {
			const error = new ChainTimeoutError("correlation-123", 30000, 35000);

			expect(error.name).toBe("ChainTimeoutError");
			expect(error.message).toContain("correlation-123");
			expect(error.message).toContain("30000");
			expect(error.code).toBe("CHAIN_TIMEOUT");
			expect(error.context).toEqual({
				correlationId: "correlation-123",
				chainTimeoutMs: 30000,
				elapsedMs: 35000,
			});
		});
	});

	describe("ToolNotFoundError", () => {
		it("should create error with tool name", () => {
			const error = new ToolNotFoundError("missing-tool");

			expect(error.name).toBe("ToolNotFoundError");
			expect(error.message).toContain("missing-tool");
			expect(error.code).toBe("TOOL_NOT_FOUND");
			expect(error.context).toEqual({
				toolName: "missing-tool",
			});
		});
	});

	describe("ToolInvocationNotAllowedError", () => {
		it("should create error with caller and target details", () => {
			const error = new ToolInvocationNotAllowedError(
				"caller-tool",
				"target-tool",
			);

			expect(error.name).toBe("ToolInvocationNotAllowedError");
			expect(error.message).toContain("caller-tool");
			expect(error.message).toContain("target-tool");
			expect(error.code).toBe("INVOCATION_NOT_ALLOWED");
			expect(error.context).toEqual({
				callerTool: "caller-tool",
				targetTool: "target-tool",
			});
		});
	});

	describe("ToolInvocationError", () => {
		it("should create error with tool execution details", () => {
			const originalError = new Error("Original failure");
			const error = new ToolInvocationError("failing-tool", originalError, {
				input: "test",
			});

			expect(error.name).toBe("ToolInvocationError");
			expect(error.message).toContain("failing-tool");
			expect(error.message).toContain("Original failure");
			expect(error.code).toBe("TOOL_INVOCATION_ERROR");
			expect(error.context).toEqual({
				toolName: "failing-tool",
				originalError: originalError.message,
				args: { input: "test" },
			});
		});

		it("should handle non-Error originalError", () => {
			const error = new ToolInvocationError("tool", "String error", {});

			expect(error.message).toContain("String error");
			expect(error.context.originalError).toBe("String error");
		});
	});

	describe("OrchestrationError", () => {
		it("should create error with orchestration details", () => {
			const error = new OrchestrationError("Invalid workflow", "workflow-123", {
				step: 1,
			});

			expect(error.name).toBe("OrchestrationError");
			expect(error.message).toBe("Invalid workflow");
			expect(error.code).toBe("ORCHESTRATION_ERROR");
			expect(error.context).toEqual({
				correlationId: "workflow-123",
				details: { step: 1 },
			});
		});
	});

	describe("ExecutionStrategyError", () => {
		it("should create error with strategy details", () => {
			const error = new ExecutionStrategyError(
				"sequential",
				"Circular dependency detected",
				{ step: "step1" },
			);

			expect(error.name).toBe("ExecutionStrategyError");
			expect(error.message).toContain("sequential");
			expect(error.message).toContain("Circular dependency");
			expect(error.code).toBe("EXECUTION_STRATEGY_ERROR");
			expect(error.context).toEqual({
				strategy: "sequential",
				reason: "Circular dependency detected",
				details: { step: "step1" },
			});
		});
	});

	describe("Error inheritance", () => {
		it("all A2A errors should extend Error", () => {
			const errors = [
				new RecursionDepthError("tool", 1, 1),
				new ToolTimeoutError("tool", 1000, 2000),
				new ChainTimeoutError("corr", 1000, 2000),
				new ToolNotFoundError("tool"),
				new ToolInvocationNotAllowedError("caller", "target"),
				new ToolInvocationError("tool", new Error("fail"), {}),
				new OrchestrationError("msg", "corr", {}),
				new ExecutionStrategyError("seq", "reason", {}),
			];

			for (const error of errors) {
				expect(error).toBeInstanceOf(Error);
				expect(error.name).toBeDefined();
				expect(error.message).toBeDefined();
				expect(error.code).toBeDefined();
				expect(error.context).toBeDefined();
				expect(error.timestamp).toBeInstanceOf(Date);
			}
		});
	});

	describe("Error context", () => {
		it("should preserve error context for debugging", () => {
			const error = new RecursionDepthError("deep-tool", 15, 10);

			expect(error.context.toolName).toBe("deep-tool");
			expect(error.context.currentDepth).toBe(15);
			expect(error.context.maxDepth).toBe(10);
		});

		it("should have timestamp for error tracking", () => {
			const before = Date.now();
			const error = new ToolTimeoutError("tool", 1000, 2000);
			const after = Date.now();

			expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before);
			expect(error.timestamp.getTime()).toBeLessThanOrEqual(after);
		});
	});

	describe("Error serialization", () => {
		it("should serialize to JSON properly", () => {
			const error = new ToolNotFoundError("missing-tool");
			const json = JSON.stringify(error);
			const parsed = JSON.parse(json);

			expect(parsed.name).toBe("ToolNotFoundError");
			expect(parsed.code).toBe("TOOL_NOT_FOUND");
			expect(parsed.message).toContain("missing-tool");
		});
	});
});
