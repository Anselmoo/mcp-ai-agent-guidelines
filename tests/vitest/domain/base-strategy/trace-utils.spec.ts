import { describe, expect, it, vi } from "vitest";
import { ExecutionTrace } from "../../../../src/domain/base-strategy/execution-trace.js";
import {
	createTrace,
	mergeTraces,
	startTiming,
	withErrorTracing,
} from "../../../../src/domain/base-strategy/trace-utils.js";
import type { ExecutionTraceData } from "../../../../src/domain/base-strategy/types.js";

describe("trace-utils", () => {
	describe("createTrace", () => {
		it("should create a new ExecutionTrace instance", () => {
			// Arrange & Act
			const trace = createTrace("test-strategy", "1.0.0");

			// Assert
			expect(trace).toBeInstanceOf(ExecutionTrace);
			const data = trace.toData();
			expect(data.strategyName).toBe("test-strategy");
			expect(data.strategyVersion).toBe("1.0.0");
		});

		it("should create trace with unique execution ID", () => {
			// Arrange & Act
			const trace1 = createTrace("strategy", "1.0.0");
			const trace2 = createTrace("strategy", "1.0.0");

			// Assert
			expect(trace1.toData().executionId).not.toBe(trace2.toData().executionId);
		});
	});

	describe("mergeTraces", () => {
		it("should merge empty traces array", () => {
			// Arrange
			const traces: ExecutionTraceData[] = [];

			// Act
			const result = mergeTraces(traces);

			// Assert
			expect(result.totalDuration).toBe(0);
			expect(result.totalDecisions).toBe(0);
			expect(result.totalErrors).toBe(0);
			expect(result.metrics).toEqual({});
		});

		it("should calculate total decisions from multiple traces", () => {
			// Arrange
			const trace1 = createTrace("strategy-1", "1.0.0");
			trace1.recordDecision("cat1", "Decision 1");
			trace1.recordDecision("cat2", "Decision 2");
			trace1.complete();

			const trace2 = createTrace("strategy-2", "1.0.0");
			trace2.recordDecision("cat3", "Decision 3");
			trace2.complete();

			// Act
			const result = mergeTraces([trace1.toData(), trace2.toData()]);

			// Assert
			expect(result.totalDecisions).toBe(3);
		});

		it("should calculate total errors from multiple traces", () => {
			// Arrange
			const trace1 = createTrace("strategy-1", "1.0.0");
			trace1.recordError(new Error("Error 1"));
			trace1.complete();

			const trace2 = createTrace("strategy-2", "1.0.0");
			trace2.recordError(new Error("Error 2"));
			trace2.recordError(new Error("Error 3"));
			trace2.complete();

			// Act
			const result = mergeTraces([trace1.toData(), trace2.toData()]);

			// Assert
			expect(result.totalErrors).toBe(3);
		});

		it("should calculate total duration from completed traces", () => {
			// Arrange
			const trace1 = createTrace("strategy-1", "1.0.0");
			trace1.complete();

			const trace2 = createTrace("strategy-2", "1.0.0");
			trace2.complete();

			// Act
			const result = mergeTraces([trace1.toData(), trace2.toData()]);

			// Assert
			expect(result.totalDuration).toBeGreaterThanOrEqual(0);
			expect(result.totalDuration).toBeLessThan(2000); // Should be quick
		});

		it("should skip duration for incomplete traces", () => {
			// Arrange
			const trace1 = createTrace("strategy-1", "1.0.0");
			trace1.complete();

			const trace2 = createTrace("strategy-2", "1.0.0");
			// Not completed

			// Act
			const result = mergeTraces([trace1.toData(), trace2.toData()]);

			// Assert
			// Only trace1's duration should be counted
			expect(result.totalDuration).toBeGreaterThanOrEqual(0);
		});

		it("should aggregate metrics from multiple traces", () => {
			// Arrange
			const trace1 = createTrace("strategy-1", "1.0.0");
			trace1.recordMetric("token_count", 100);
			trace1.recordMetric("generation_time_ms", 250);
			trace1.complete();

			const trace2 = createTrace("strategy-2", "1.0.0");
			trace2.recordMetric("token_count", 200);
			trace2.recordMetric("validation_time_ms", 50);
			trace2.complete();

			// Act
			const result = mergeTraces([trace1.toData(), trace2.toData()]);

			// Assert
			expect(result.metrics.token_count).toBe(300);
			expect(result.metrics.generation_time_ms).toBe(250);
			expect(result.metrics.validation_time_ms).toBe(50);
		});

		it("should handle traces with no metrics", () => {
			// Arrange
			const trace1 = createTrace("strategy-1", "1.0.0");
			trace1.complete();

			const trace2 = createTrace("strategy-2", "1.0.0");
			trace2.complete();

			// Act
			const result = mergeTraces([trace1.toData(), trace2.toData()]);

			// Assert
			// Only total_duration_ms from complete() should be present
			expect(result.metrics.total_duration_ms).toBeGreaterThanOrEqual(0);
		});
	});

	describe("startTiming", () => {
		it("should record timing metric when callback is called", () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");

			// Act
			const endTiming = startTiming(trace, "operation_time_ms");
			const duration = endTiming();

			// Assert
			expect(duration).toBeGreaterThanOrEqual(0);
			expect(trace.metrics.operation_time_ms).toBe(duration);
		});

		it("should measure time between start and end", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(0));
			try {
				// Arrange
				const trace = createTrace("test-strategy", "1.0.0");

				// Act
				const endTiming = startTiming(trace, "async_operation_ms");
				vi.advanceTimersByTime(10);
				const duration = endTiming();

				// Assert
				expect(duration).toBe(10);
				expect(trace.metrics.async_operation_ms).toBe(duration);
			} finally {
				vi.useRealTimers();
			}
		});

		it("should return duration value", () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");

			// Act
			const endTiming = startTiming(trace, "test_metric");
			const duration = endTiming();

			// Assert
			expect(typeof duration).toBe("number");
			expect(duration).toBeGreaterThanOrEqual(0);
		});

		it("should support multiple timing measurements", () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");

			// Act
			const endTiming1 = startTiming(trace, "metric1");
			const endTiming2 = startTiming(trace, "metric2");
			const duration1 = endTiming1();
			const duration2 = endTiming2();

			// Assert
			expect(trace.metrics.metric1).toBe(duration1);
			expect(trace.metrics.metric2).toBe(duration2);
		});
	});

	describe("withErrorTracing", () => {
		it("should execute operation successfully", async () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");
			const operation = async () => "success";

			// Act
			const result = await withErrorTracing(trace, operation);

			// Assert
			expect(result).toBe("success");
			expect(trace.hasErrors).toBe(false);
		});

		it("should return operation result", async () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");
			const expectedResult = { data: "test", count: 42 };
			const operation = async () => expectedResult;

			// Act
			const result = await withErrorTracing(trace, operation);

			// Assert
			expect(result).toEqual(expectedResult);
		});

		it("should record error when operation throws", async () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");
			const testError = new Error("Operation failed");
			const operation = async () => {
				throw testError;
			};

			// Act & Assert
			await expect(withErrorTracing(trace, operation)).rejects.toThrow(
				"Operation failed",
			);
			expect(trace.hasErrors).toBe(true);
			expect(trace.errors).toHaveLength(1);
			expect(trace.errors[0].message).toBe("Operation failed");
		});

		it("should record error with context", async () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");
			const operation = async () => {
				throw new Error("Failed");
			};
			const context = { url: "https://example.com", attempt: 3 };

			// Act & Assert
			await expect(withErrorTracing(trace, operation, context)).rejects.toThrow(
				"Failed",
			);
			expect(trace.errors[0].context).toEqual(context);
		});

		it("should handle non-Error thrown values", async () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");
			const operation = async () => {
				throw "string error";
			};

			// Act & Assert
			await expect(withErrorTracing(trace, operation)).rejects.toBe(
				"string error",
			);
			expect(trace.hasErrors).toBe(true);
			expect(trace.errors[0].message).toBe("string error");
		});

		it("should handle empty context by default", async () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");
			const operation = async () => {
				throw new Error("Test error");
			};

			// Act & Assert
			await expect(withErrorTracing(trace, operation)).rejects.toThrow(
				"Test error",
			);
			expect(trace.errors[0].context).toEqual({});
		});

		it("should re-throw error after recording", async () => {
			// Arrange
			const trace = createTrace("test-strategy", "1.0.0");
			class CustomError extends Error {
				constructor(message: string) {
					super(message);
					this.name = "CustomError";
				}
			}
			const customError = new CustomError("Custom error");
			const operation = async () => {
				throw customError;
			};

			// Act & Assert
			await expect(withErrorTracing(trace, operation)).rejects.toThrow(
				customError,
			);
			expect(trace.errors[0].category).toBe("CustomError");
		});
	});
});
