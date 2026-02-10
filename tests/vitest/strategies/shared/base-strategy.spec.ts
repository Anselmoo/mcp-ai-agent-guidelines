/**
 * Tests for BaseStrategy abstract class and ExecutionTrace.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
	BaseStrategy,
	isErrorResult,
	isSuccessResult,
} from "../../../../src/strategies/shared/base-strategy.js";
import type { ValidationResult } from "../../../../src/strategies/shared/types.js";

// Concrete implementation for testing
class TestStrategy extends BaseStrategy<{ value: number }, { result: string }> {
	protected readonly name = "TestStrategy";
	protected readonly version = "1.0.0";

	public validateFn: (input: { value: number }) => ValidationResult = () => ({
		valid: true,
		errors: [],
		warnings: [],
	});

	public executeFn: (input: { value: number }) => Promise<{ result: string }> =
		async (input) => ({ result: `processed: ${input.value}` });

	validate(input: { value: number }): ValidationResult {
		return this.validateFn(input);
	}

	async execute(input: { value: number }): Promise<{ result: string }> {
		return this.executeFn(input);
	}
}

describe("BaseStrategy", () => {
	let strategy: TestStrategy;

	beforeEach(() => {
		strategy = new TestStrategy();
	});

	describe("run()", () => {
		it("should return success result when validation and execution pass", async () => {
			const result = await strategy.run({ value: 42 });

			expect(result.success).toBe(true);
			if (!result.success) {
				throw new Error("Expected success result");
			}
			expect(result.data).toEqual({ result: "processed: 42" });
			expect(result.trace).toBeDefined();
			expect(result.durationMs).toBeGreaterThanOrEqual(0);
		});

		it("should return error result when validation fails", async () => {
			strategy.validateFn = () => ({
				valid: false,
				errors: [{ code: "INVALID_VALUE", message: "Value must be positive" }],
				warnings: [],
			});

			const result = await strategy.run({ value: -1 });

			expect(result.success).toBe(false);
			if (result.success) {
				throw new Error("Expected error result");
			}
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].code).toBe("INVALID_VALUE");
		});

		it("should return error result when execution throws", async () => {
			strategy.executeFn = async () => {
				throw new Error("Execution failed");
			};

			const result = await strategy.run({ value: 42 });

			expect(result.success).toBe(false);
			if (result.success) {
				throw new Error("Expected error result");
			}
			expect(result.errors[0].code).toBe("EXECUTION_ERROR");
			expect(result.errors[0].message).toBe("Execution failed");
		});

		it("should timeout when execution takes too long", async () => {
			const slowStrategy = new TestStrategy({ timeoutMs: 50 });
			slowStrategy.executeFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return { result: "too slow" };
			};

			const result = await slowStrategy.run({ value: 42 });

			expect(result.success).toBe(false);
			if (result.success) {
				throw new Error("Expected error result");
			}
			expect(result.errors[0].message).toContain("timed out");
		});

		it("should include multiple validation errors", async () => {
			strategy.validateFn = () => ({
				valid: false,
				errors: [
					{ code: "ERROR_1", message: "First error" },
					{ code: "ERROR_2", message: "Second error" },
				],
				warnings: [],
			});

			const result = await strategy.run({ value: 42 });

			expect(result.success).toBe(false);
			if (result.success) {
				throw new Error("Expected error result");
			}
			expect(result.errors).toHaveLength(2);
		});

		it("should fail fast when configured", async () => {
			const failFastStrategy = new TestStrategy({ failFast: true });
			failFastStrategy.validateFn = () => ({
				valid: false,
				errors: [
					{ code: "ERROR_1", message: "First error" },
					{ code: "ERROR_2", message: "Second error" },
				],
				warnings: [],
			});

			const result = await failFastStrategy.run({ value: 42 });

			expect(result.success).toBe(false);
			if (result.success) {
				throw new Error("Expected error result");
			}
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].code).toBe("ERROR_1");
		});

		it("should record validation warnings in trace", async () => {
			strategy.validateFn = () => ({
				valid: true,
				errors: [],
				warnings: [
					{
						code: "WARN_1",
						message: "Warning message",
						suggestion: "Fix this",
					},
				],
			});

			const result = await strategy.run({ value: 42 });

			expect(result.success).toBe(true);
			expect(result.trace.entries.some((e) => e.type === "warning")).toBe(true);
		});

		it("should handle non-Error thrown values", async () => {
			strategy.executeFn = async () => {
				throw "string error"; // eslint-disable-line @typescript-eslint/only-throw-error
			};

			const result = await strategy.run({ value: 42 });

			expect(result.success).toBe(false);
			if (result.success) {
				throw new Error("Expected error result");
			}
			expect(result.errors[0].code).toBe("EXECUTION_ERROR");
			expect(result.errors[0].message).toBe("string error");
		});
	});

	describe("trace", () => {
		it("should record execution trace when enabled", async () => {
			const result = await strategy.run({ value: 42 });

			expect(result.trace.traceId).toMatch(/^trace_/);
			expect(result.trace.entries.length).toBeGreaterThan(0);
			expect(result.trace.entries[0].type).toBe("start");
		});

		it("should include start trace entry with metadata", async () => {
			const result = await strategy.run({ value: 42 });

			const startEntry = result.trace.entries.find((e) => e.type === "start");
			expect(startEntry).toBeDefined();
			expect(startEntry?.data).toHaveProperty("strategy", "TestStrategy");
			expect(startEntry?.data).toHaveProperty("version", "1.0.0");
		});

		it("should include input type when verbose is enabled", async () => {
			const verboseStrategy = new TestStrategy({ verbose: true });
			const result = await verboseStrategy.run({ value: 42 });

			const startEntry = result.trace.entries.find((e) => e.type === "start");
			expect(startEntry?.data).toHaveProperty("inputType", "object");
		});

		it("should record decision trace for validation", async () => {
			const result = await strategy.run({ value: 42 });

			const decisionEntry = result.trace.entries.find(
				(e) => e.type === "decision",
			);
			expect(decisionEntry).toBeDefined();
			expect(decisionEntry?.message).toContain("validation");
		});

		it("should record metric trace for validation duration", async () => {
			const result = await strategy.run({ value: 42 });

			const metricEntry = result.trace.entries.find((e) => e.type === "metric");
			expect(metricEntry).toBeDefined();
			expect(metricEntry?.data).toHaveProperty("name", "validationDuration");
		});

		it("should record success trace on successful execution", async () => {
			const result = await strategy.run({ value: 42 });

			const successEntry = result.trace.entries.find(
				(e) => e.type === "success",
			);
			expect(successEntry).toBeDefined();
		});

		it("should record error trace on execution failure", async () => {
			strategy.executeFn = async () => {
				throw new Error("Test error");
			};

			const result = await strategy.run({ value: 42 });

			const errorEntry = result.trace.entries.find((e) => e.type === "error");
			expect(errorEntry).toBeDefined();
			expect(errorEntry?.message).toContain("Test error");
		});

		it("should not record detailed trace when disabled", async () => {
			const noTraceStrategy = new TestStrategy({ enableTrace: false });
			const result = await noTraceStrategy.run({ value: 42 });

			// Trace is still returned but with minimal entries
			expect(result.trace).toBeDefined();
			expect(result.trace.entries.length).toBe(0);
		});

		it("should calculate trace summary correctly", async () => {
			strategy.validateFn = () => ({
				valid: true,
				errors: [],
				warnings: [{ code: "WARN", message: "Warning" }],
			});

			const result = await strategy.run({ value: 42 });

			expect(result.trace.summary.totalWarnings).toBe(1);
			expect(result.trace.summary.totalDecisions).toBeGreaterThan(0);
			expect(result.trace.summary.durationMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe("type guards", () => {
		it("isSuccessResult should identify success", async () => {
			const result = await strategy.run({ value: 42 });

			if (isSuccessResult(result)) {
				// TypeScript should narrow this
				expect(result.data.result).toBe("processed: 42");
			} else {
				throw new Error("Expected success result");
			}
		});

		it("isErrorResult should identify failure", async () => {
			strategy.validateFn = () => ({
				valid: false,
				errors: [{ code: "TEST", message: "Test error" }],
				warnings: [],
			});

			const result = await strategy.run({ value: 42 });

			if (isErrorResult(result)) {
				expect(result.errors[0].code).toBe("TEST");
			} else {
				throw new Error("Expected error result");
			}
		});

		it("type guards should be mutually exclusive", async () => {
			const result = await strategy.run({ value: 42 });

			const isSuccess = isSuccessResult(result);
			const isError = isErrorResult(result);

			expect(isSuccess).not.toBe(isError);
		});
	});

	describe("configuration", () => {
		it("should use default configuration", async () => {
			const defaultStrategy = new TestStrategy();
			const result = await defaultStrategy.run({ value: 42 });

			expect(result).toBeDefined();
		});

		it("should accept custom timeout", async () => {
			const customStrategy = new TestStrategy({ timeoutMs: 100 });
			customStrategy.executeFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return { result: "done" };
			};

			const result = await customStrategy.run({ value: 42 });

			expect(result.success).toBe(true);
		});

		it("should respect enableTrace setting", async () => {
			const noTraceStrategy = new TestStrategy({ enableTrace: false });
			const result = await noTraceStrategy.run({ value: 42 });

			expect(result.trace.entries.length).toBe(0);
		});
	});

	describe("input handling", () => {
		it("should handle null input with verbose mode", async () => {
			class NullStrategy extends BaseStrategy<null, { result: string }> {
				protected readonly name = "NullStrategy";
				protected readonly version = "1.0.0";

				validate(_input: null): ValidationResult {
					return { valid: true, errors: [], warnings: [] };
				}

				async execute(_input: null): Promise<{ result: string }> {
					return { result: "null processed" };
				}
			}

			const nullStrategy = new NullStrategy({ verbose: true });
			const result = await nullStrategy.run(null);

			expect(result.success).toBe(true);
			const startEntry = result.trace.entries.find((e) => e.type === "start");
			expect(startEntry?.data?.inputType).toBe("null");
		});

		it("should handle array input with verbose mode", async () => {
			class ArrayStrategy extends BaseStrategy<number[], { result: string }> {
				protected readonly name = "ArrayStrategy";
				protected readonly version = "1.0.0";

				validate(_input: number[]): ValidationResult {
					return { valid: true, errors: [], warnings: [] };
				}

				async execute(input: number[]): Promise<{ result: string }> {
					return { result: `array: ${input.length}` };
				}
			}

			const arrayStrategy = new ArrayStrategy({ verbose: true });
			const result = await arrayStrategy.run([1, 2, 3]);

			expect(result.success).toBe(true);
			const startEntry = result.trace.entries.find((e) => e.type === "start");
			expect(startEntry?.data?.inputType).toBe("array");
		});

		it("should handle object input with multiple keys", async () => {
			interface ComplexInput {
				value: number;
				name: string;
				options: { flag: boolean };
			}

			class ComplexStrategy extends BaseStrategy<
				ComplexInput,
				{ result: string }
			> {
				protected readonly name = "ComplexStrategy";
				protected readonly version = "1.0.0";

				validate(_input: ComplexInput): ValidationResult {
					return { valid: true, errors: [], warnings: [] };
				}

				async execute(input: ComplexInput): Promise<{ result: string }> {
					return { result: `${input.name}: ${input.value}` };
				}
			}

			const complexStrategy = new ComplexStrategy();
			const result = await complexStrategy.run({
				value: 42,
				name: "test",
				options: { flag: true },
			});

			expect(result.success).toBe(true);
			if (!result.success) {
				throw new Error("Expected success result");
			}
			expect(result.trace.entries[0].data?.inputKeys).toContain("value");
			expect(result.trace.entries[0].data?.inputKeys).toContain("name");
		});

		it("should handle primitive input", async () => {
			class PrimitiveStrategy extends BaseStrategy<number, string> {
				protected readonly name = "PrimitiveStrategy";
				protected readonly version = "1.0.0";

				validate(_input: number): ValidationResult {
					return { valid: true, errors: [], warnings: [] };
				}

				async execute(input: number): Promise<string> {
					return `result: ${input}`;
				}
			}

			const primitiveStrategy = new PrimitiveStrategy();
			const result = await primitiveStrategy.run(42);

			expect(result.success).toBe(true);
			if (!result.success) {
				throw new Error("Expected success result");
			}
			expect(result.data).toBe("result: 42");
		});
	});

	describe("error context", () => {
		it("should handle execution error with trace disabled", async () => {
			const noTraceStrategy = new TestStrategy({ enableTrace: false });
			noTraceStrategy.executeFn = async () => {
				throw new Error("Error without trace");
			};

			const result = await noTraceStrategy.run({ value: 42 });

			expect(result.success).toBe(false);
			if (result.success) {
				throw new Error("Expected error result");
			}
			expect(result.errors[0].code).toBe("EXECUTION_ERROR");
			expect(result.errors[0].message).toBe("Error without trace");
		});

		it("should include error stack in context", async () => {
			strategy.executeFn = async () => {
				throw new Error("Error with stack");
			};

			const result = await strategy.run({ value: 42 });

			if (result.success) {
				throw new Error("Expected error result");
			}
			expect(result.errors[0].context?.stack).toBeDefined();
		});

		it("should include validation error field", async () => {
			strategy.validateFn = () => ({
				valid: false,
				errors: [
					{
						code: "FIELD_ERROR",
						message: "Invalid field",
						field: "value",
						context: { min: 0 },
					},
				],
				warnings: [],
			});

			const result = await strategy.run({ value: -1 });

			if (result.success) {
				throw new Error("Expected error result");
			}
			expect(result.errors[0].field).toBe("value");
			expect(result.errors[0].context).toEqual({ min: 0 });
		});
	});

	describe("execution timing", () => {
		it("should record accurate duration", async () => {
			strategy.executeFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return { result: "done" };
			};

			const result = await strategy.run({ value: 42 });

			expect(result.durationMs).toBeGreaterThanOrEqual(0);
		});

		it("should include duration in trace summary", async () => {
			const result = await strategy.run({ value: 42 });

			expect(result.trace.summary.durationMs).toBe(result.durationMs);
		});
	});
});
