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
			const error = new RecursionDepthError(10, 5, { toolName: "test-tool" });

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(RecursionDepthError);
			expect(error.name).toBe("RecursionDepthError");
			expect(error.message).toContain("depth");
			expect(error.message).toContain("10");
			expect(error.code).toBe("RECURSION_DEPTH_ERROR");
			expect(error.currentDepth).toBe(10);
			expect(error.maxDepth).toBe(5);
			expect(error.context.currentDepth).toBe(10);
			expect(error.context.maxDepth).toBe(5);
			expect(error.timestamp).toBeInstanceOf(Date);
		});

		it("should be catchable as Error", () => {
			try {
				throw new RecursionDepthError(5, 3);
			} catch (e) {
				expect(e).toBeInstanceOf(Error);
				expect(e instanceof RecursionDepthError).toBe(true);
			}
		});
	});

	describe("ToolTimeoutError", () => {
		it("should create error with timeout details", () => {
			const error = new ToolTimeoutError("slow-tool", 5000);

			expect(error.name).toBe("ToolTimeoutError");
			expect(error.message).toContain("slow-tool");
			expect(error.message).toContain("5000");
			expect(error.code).toBe("TOOL_TIMEOUT_ERROR");
			expect(error.toolName).toBe("slow-tool");
			expect(error.timeoutMs).toBe(5000);
			expect(error.context.toolName).toBe("slow-tool");
			expect(error.context.timeoutMs).toBe(5000);
		});
	});

	describe("ChainTimeoutError", () => {
		it("should create error with chain timeout details", () => {
			const error = new ChainTimeoutError(30000, 5, {
				correlationId: "test-123",
			});

			expect(error.name).toBe("ChainTimeoutError");
			expect(error.message).toContain("30000");
			expect(error.message).toContain("5");
			expect(error.code).toBe("CHAIN_TIMEOUT_ERROR");
			expect(error.chainTimeoutMs).toBe(30000);
			expect(error.toolsCompleted).toBe(5);
		});
	});

	describe("ToolNotFoundError", () => {
		it("should create error with tool name", () => {
			const error = new ToolNotFoundError("missing-tool");

			expect(error.name).toBe("ToolNotFoundError");
			expect(error.message).toContain("missing-tool");
			expect(error.code).toBe("TOOL_NOT_FOUND_ERROR");
			expect(error.toolName).toBe("missing-tool");
			expect(error.context.toolName).toBe("missing-tool");
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
			expect(error.code).toBe("TOOL_INVOCATION_NOT_ALLOWED_ERROR");
			expect(error.callerTool).toBe("caller-tool");
			expect(error.targetTool).toBe("target-tool");
		});
	});

	describe("ToolInvocationError", () => {
		it("should create error with tool execution details", () => {
			const error = new ToolInvocationError(
				"failing-tool",
				"Original failure",
				{
					input: "test",
				},
			);

			expect(error.name).toBe("ToolInvocationError");
			expect(error.message).toBe("Original failure");
			expect(error.code).toBe("TOOL_INVOCATION_ERROR");
			expect(error.toolName).toBe("failing-tool");
		});
	});

	describe("OrchestrationError", () => {
		it("should create error with orchestration details", () => {
			const error = new OrchestrationError("Invalid workflow", {
				workflowName: "workflow-123",
				step: 1,
			});

			expect(error.name).toBe("OrchestrationError");
			expect(error.message).toBe("Invalid workflow");
			expect(error.code).toBe("ORCHESTRATION_ERROR");
			expect(error.workflowName).toBe("workflow-123");
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
			expect(error.message).toBe("Circular dependency detected");
			expect(error.code).toBe("EXECUTION_STRATEGY_ERROR");
			expect(error.strategy).toBe("sequential");
		});
	});

	describe("Error inheritance", () => {
		it("all A2A errors should extend Error", () => {
			const errors = [
				new RecursionDepthError(1, 1),
				new ToolTimeoutError("tool", 1000),
				new ChainTimeoutError(1000, 2),
				new ToolNotFoundError("tool"),
				new ToolInvocationNotAllowedError("caller", "target"),
				new ToolInvocationError("tool", "fail"),
				new OrchestrationError("msg", { workflowName: "test" }),
				new ExecutionStrategyError("seq", "reason"),
			];

			for (const error of errors) {
				expect(error).toBeInstanceOf(Error);
				expect(error.name).toBeDefined();
				expect(error.message).toBeDefined();
				expect(error.code).toBeDefined();
				expect(error.timestamp).toBeInstanceOf(Date);
			}
		});
	});

	describe("Error context", () => {
		it("should preserve error context for debugging", () => {
			const error = new RecursionDepthError(15, 10, { toolName: "deep-tool" });

			expect(error.context.toolName).toBe("deep-tool");
			expect(error.context.currentDepth).toBe(15);
			expect(error.context.maxDepth).toBe(10);
		});

		it("should have timestamp for error tracking", () => {
			const before = Date.now();
			const error = new ToolTimeoutError("tool", 1000);
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
			expect(parsed.code).toBe("TOOL_NOT_FOUND_ERROR");
		});
	});
});
