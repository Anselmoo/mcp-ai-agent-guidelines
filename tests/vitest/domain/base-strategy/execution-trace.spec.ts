import { beforeEach, describe, expect, it } from "vitest";
import { ExecutionTrace } from "../../../../src/domain/base-strategy/execution-trace.js";

describe("domain/base-strategy/execution-trace", () => {
	describe("constructor", () => {
		it("should initialize with strategy name and version", () => {
			// Arrange & Act
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Assert
			const data = trace.toData();
			expect(data.strategyName).toBe("test-strategy");
			expect(data.strategyVersion).toBe("1.0.0");
			expect(data.executionId).toBeDefined();
			expect(data.executionId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
			);
			expect(data.startedAt).toBeInstanceOf(Date);
			expect(data.completedAt).toBeNull();
		});

		it("should generate unique execution IDs", () => {
			// Arrange & Act
			const trace1 = new ExecutionTrace("strategy", "1.0.0");
			const trace2 = new ExecutionTrace("strategy", "1.0.0");

			// Assert
			expect(trace1.toData().executionId).not.toBe(trace2.toData().executionId);
		});
	});

	describe("recordDecision", () => {
		let trace: ExecutionTrace;

		beforeEach(() => {
			trace = new ExecutionTrace("test-strategy", "1.0.0");
		});

		it("should record decision with all fields", () => {
			// Arrange
			const category = "validation";
			const description = "Selected template based on input size";
			const context = { inputSize: 1500, threshold: 1000 };

			// Act
			const decision = trace.recordDecision(category, description, context);

			// Assert
			expect(decision.id).toBeDefined();
			expect(decision.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
			);
			expect(decision.timestamp).toBeInstanceOf(Date);
			expect(decision.category).toBe(category);
			expect(decision.description).toBe(description);
			expect(decision.context).toEqual(context);
		});

		it("should record decision with empty context when not provided", () => {
			// Arrange & Act
			const decision = trace.recordDecision(
				"test-category",
				"test description",
			);

			// Assert
			expect(decision.context).toEqual({});
		});

		it("should add decision to decisions array", () => {
			// Arrange & Act
			trace.recordDecision("category1", "First decision");
			trace.recordDecision("category2", "Second decision");

			// Assert
			expect(trace.decisions).toHaveLength(2);
			expect(trace.decisions[0].description).toBe("First decision");
			expect(trace.decisions[1].description).toBe("Second decision");
		});

		it("should coerce non-serializable context values to strings", () => {
			// Arrange
			const func = () => "test";
			const sym = Symbol("test");
			const context = {
				valid: "string",
				func,
				symbol: sym,
				undef: undefined,
			};

			// Act
			const decision = trace.recordDecision("test", "description", context);

			// Assert
			expect(decision.context.valid).toBe("string");
			expect(decision.context.func).toBe(String(func));
			expect(decision.context.symbol).toBe(String(sym));
			expect(decision.context.undef).toBe("undefined");
		});
	});

	describe("recordMetric", () => {
		let trace: ExecutionTrace;

		beforeEach(() => {
			trace = new ExecutionTrace("test-strategy", "1.0.0");
		});

		it("should record numeric metric", () => {
			// Arrange & Act
			trace.recordMetric("generation_time_ms", 250);

			// Assert
			expect(trace.metrics.generation_time_ms).toBe(250);
		});

		it("should overwrite existing metric", () => {
			// Arrange
			trace.recordMetric("counter", 10);

			// Act
			trace.recordMetric("counter", 20);

			// Assert
			expect(trace.metrics.counter).toBe(20);
		});

		it("should handle zero values", () => {
			// Arrange & Act
			trace.recordMetric("zero_metric", 0);

			// Assert
			expect(trace.metrics.zero_metric).toBe(0);
		});

		it("should handle negative values", () => {
			// Arrange & Act
			trace.recordMetric("negative", -42);

			// Assert
			expect(trace.metrics.negative).toBe(-42);
		});

		it("should handle floating point values", () => {
			// Arrange & Act
			trace.recordMetric("float_value", Math.PI);

			// Assert
			expect(trace.metrics.float_value).toBe(Math.PI);
		});
	});

	describe("incrementMetric", () => {
		let trace: ExecutionTrace;

		beforeEach(() => {
			trace = new ExecutionTrace("test-strategy", "1.0.0");
		});

		it("should initialize counter to 1 when not exists", () => {
			// Arrange & Act
			trace.incrementMetric("new_counter");

			// Assert
			expect(trace.metrics.new_counter).toBe(1);
		});

		it("should increment existing counter by 1", () => {
			// Arrange
			trace.recordMetric("counter", 5);

			// Act
			trace.incrementMetric("counter");

			// Assert
			expect(trace.metrics.counter).toBe(6);
		});

		it("should increment by custom amount", () => {
			// Arrange
			trace.recordMetric("counter", 10);

			// Act
			trace.incrementMetric("counter", 5);

			// Assert
			expect(trace.metrics.counter).toBe(15);
		});

		it("should handle zero increment", () => {
			// Arrange
			trace.recordMetric("counter", 10);

			// Act
			trace.incrementMetric("counter", 0);

			// Assert
			expect(trace.metrics.counter).toBe(10);
		});

		it("should handle negative increment (decrement)", () => {
			// Arrange
			trace.recordMetric("counter", 10);

			// Act
			trace.incrementMetric("counter", -3);

			// Assert
			expect(trace.metrics.counter).toBe(7);
		});

		it("should initialize to increment value when counter does not exist", () => {
			// Arrange & Act
			trace.incrementMetric("new_counter", 10);

			// Assert
			expect(trace.metrics.new_counter).toBe(10);
		});
	});

	describe("recordError", () => {
		let trace: ExecutionTrace;

		beforeEach(() => {
			trace = new ExecutionTrace("test-strategy", "1.0.0");
		});

		it("should record error with all fields", () => {
			// Arrange
			const error = new Error("Test error message");
			const context = { operation: "template-render", attemptCount: 3 };

			// Act
			trace.recordError(error, context);

			// Assert
			expect(trace.errors).toHaveLength(1);
			const recordedError = trace.errors[0];
			expect(recordedError.timestamp).toBeInstanceOf(Date);
			expect(recordedError.category).toBe("Error");
			expect(recordedError.message).toBe("Test error message");
			expect(recordedError.stack).toBeDefined();
			expect(recordedError.context).toEqual(context);
		});

		it("should record error with empty context when not provided", () => {
			// Arrange
			const error = new Error("Test error");

			// Act
			trace.recordError(error);

			// Assert
			expect(trace.errors).toHaveLength(1);
			expect(trace.errors[0].context).toEqual({});
		});

		it("should use error name as category", () => {
			// Arrange
			class CustomError extends Error {
				constructor(message: string) {
					super(message);
					this.name = "CustomError";
				}
			}
			const error = new CustomError("Custom error message");

			// Act
			trace.recordError(error);

			// Assert
			expect(trace.errors[0].category).toBe("CustomError");
		});

		it("should handle error without stack trace", () => {
			// Arrange
			const error = new Error("Test error");
			delete error.stack;

			// Act
			trace.recordError(error);

			// Assert
			expect(trace.errors[0].stack).toBeUndefined();
		});

		it("should record multiple errors", () => {
			// Arrange & Act
			trace.recordError(new Error("First error"));
			trace.recordError(new Error("Second error"));
			trace.recordError(new Error("Third error"));

			// Assert
			expect(trace.errors).toHaveLength(3);
			expect(trace.errors[0].message).toBe("First error");
			expect(trace.errors[1].message).toBe("Second error");
			expect(trace.errors[2].message).toBe("Third error");
		});

		it("should coerce non-serializable error context values to strings", () => {
			// Arrange
			const error = new Error("Test error");
			const func = () => "test";
			const sym = Symbol("error-context");
			const context = {
				valid: "string",
				func,
				symbol: sym,
			};

			// Act
			trace.recordError(error, context);

			// Assert
			expect(trace.errors[0].context.valid).toBe("string");
			expect(trace.errors[0].context.func).toBe(String(func));
			expect(trace.errors[0].context.symbol).toBe(String(sym));
		});
	});

	describe("complete", () => {
		let trace: ExecutionTrace;

		beforeEach(() => {
			trace = new ExecutionTrace("test-strategy", "1.0.0");
		});

		it("should set completedAt timestamp", () => {
			// Arrange
			const beforeComplete = new Date();

			// Act
			trace.complete();

			// Assert
			const afterComplete = new Date();
			const data = trace.toData();
			const completedAt = data.completedAt;
			expect(completedAt).toBeInstanceOf(Date);
			if (!completedAt) {
				throw new Error("Expected completion timestamp to be set");
			}
			expect(completedAt.getTime()).toBeGreaterThanOrEqual(
				beforeComplete.getTime(),
			);
			expect(completedAt.getTime()).toBeLessThanOrEqual(
				afterComplete.getTime(),
			);
		});

		it("should record total_duration_ms metric", () => {
			// Arrange & Act
			trace.complete();

			// Assert
			expect(trace.metrics.total_duration_ms).toBeDefined();
			expect(trace.metrics.total_duration_ms).toBeGreaterThanOrEqual(0);
		});

		it("should calculate duration correctly", () => {
			// Act
			trace.complete();

			// Assert
			const duration = trace.metrics.total_duration_ms;
			expect(duration).toBeGreaterThanOrEqual(0);
			expect(duration).toBeLessThan(1000); // Should complete within 1 second
		});
	});

	describe("durationMs getter", () => {
		it("should calculate duration from start to now when not completed", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			const duration = trace.durationMs;

			// Assert
			expect(duration).toBeGreaterThanOrEqual(0);
			expect(duration).toBeLessThan(1000); // Should be very quick
		});

		it("should calculate duration from start to completion when completed", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			trace.complete();
			const duration = trace.durationMs;

			// Assert
			expect(duration).toBeGreaterThanOrEqual(0);
			expect(duration).toBeLessThan(1000);
		});

		it("should return same duration after completion", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.complete();

			// Act
			const duration1 = trace.durationMs;
			const duration2 = trace.durationMs;

			// Assert
			expect(duration1).toBe(duration2);
		});
	});

	describe("decisions getter", () => {
		it("should return empty array when no decisions recorded", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			const decisions = trace.decisions;

			// Assert
			expect(decisions).toEqual([]);
		});

		it("should return all recorded decisions", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordDecision("cat1", "Decision 1");
			trace.recordDecision("cat2", "Decision 2");

			// Act
			const decisions = trace.decisions;

			// Assert
			expect(decisions).toHaveLength(2);
		});

		it("should return immutable copy of decisions", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordDecision("cat1", "Decision 1");

			// Act
			const decisions = trace.decisions;
			const originalLength = decisions.length;
			// TypeScript won't allow push on readonly array, but test runtime immutability
			// @ts-expect-error Testing runtime immutability
			decisions.push({ id: "fake", category: "fake" });

			// Assert
			expect(trace.decisions).toHaveLength(originalLength);
		});
	});

	describe("metrics getter", () => {
		it("should return empty object when no metrics recorded", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			const metrics = trace.metrics;

			// Assert
			expect(metrics).toEqual({});
		});

		it("should return all recorded metrics", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordMetric("metric1", 100);
			trace.recordMetric("metric2", 200);

			// Act
			const metrics = trace.metrics;

			// Assert
			expect(metrics.metric1).toBe(100);
			expect(metrics.metric2).toBe(200);
		});

		it("should return immutable copy of metrics", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordMetric("metric1", 100);

			// Act
			const metrics = trace.metrics;
			// @ts-expect-error Testing runtime immutability
			metrics.metric2 = 200;

			// Assert
			expect(trace.metrics.metric2).toBeUndefined();
		});
	});

	describe("errors getter", () => {
		it("should return empty array when no errors recorded", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			const errors = trace.errors;

			// Assert
			expect(errors).toEqual([]);
		});

		it("should return all recorded errors", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordError(new Error("Error 1"));
			trace.recordError(new Error("Error 2"));

			// Act
			const errors = trace.errors;

			// Assert
			expect(errors).toHaveLength(2);
		});

		it("should return immutable copy of errors", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordError(new Error("Error 1"));

			// Act
			const errors = trace.errors;
			const originalLength = errors.length;
			// @ts-expect-error Testing runtime immutability
			errors.push({ message: "fake" });

			// Assert
			expect(trace.errors).toHaveLength(originalLength);
		});
	});

	describe("hasErrors getter", () => {
		it("should return false when no errors recorded", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act & Assert
			expect(trace.hasErrors).toBe(false);
		});

		it("should return true when errors are recorded", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			trace.recordError(new Error("Test error"));

			// Assert
			expect(trace.hasErrors).toBe(true);
		});
	});

	describe("getDecisionsByCategory", () => {
		let trace: ExecutionTrace;

		beforeEach(() => {
			trace = new ExecutionTrace("test-strategy", "1.0.0");
		});

		it("should return empty array when no decisions match category", () => {
			// Arrange
			trace.recordDecision("category1", "Decision 1");
			trace.recordDecision("category2", "Decision 2");

			// Act
			const decisions = trace.getDecisionsByCategory("nonexistent");

			// Assert
			expect(decisions).toEqual([]);
		});

		it("should return only decisions matching category", () => {
			// Arrange
			trace.recordDecision("validation", "Validation decision 1");
			trace.recordDecision("generation", "Generation decision");
			trace.recordDecision("validation", "Validation decision 2");

			// Act
			const validationDecisions = trace.getDecisionsByCategory("validation");

			// Assert
			expect(validationDecisions).toHaveLength(2);
			expect(validationDecisions[0].description).toBe("Validation decision 1");
			expect(validationDecisions[1].description).toBe("Validation decision 2");
		});

		it("should return all decisions when all match category", () => {
			// Arrange
			trace.recordDecision("test", "Decision 1");
			trace.recordDecision("test", "Decision 2");
			trace.recordDecision("test", "Decision 3");

			// Act
			const decisions = trace.getDecisionsByCategory("test");

			// Assert
			expect(decisions).toHaveLength(3);
		});

		it("should be case-sensitive", () => {
			// Arrange
			trace.recordDecision("Validation", "Decision 1");
			trace.recordDecision("validation", "Decision 2");

			// Act
			const upperDecisions = trace.getDecisionsByCategory("Validation");
			const lowerDecisions = trace.getDecisionsByCategory("validation");

			// Assert
			expect(upperDecisions).toHaveLength(1);
			expect(lowerDecisions).toHaveLength(1);
		});
	});

	describe("toData", () => {
		it("should export complete execution trace data", () => {
			// Arrange
			const trace = new ExecutionTrace("my-strategy", "2.0.0");
			trace.recordDecision("test-cat", "Test decision", { key: "value" });
			trace.recordMetric("test_metric", 42);
			trace.recordError(new Error("Test error"), { context: "test" });
			trace.complete();

			// Act
			const data = trace.toData();

			// Assert
			expect(data.executionId).toBeDefined();
			expect(data.strategyName).toBe("my-strategy");
			expect(data.strategyVersion).toBe("2.0.0");
			expect(data.startedAt).toBeInstanceOf(Date);
			expect(data.completedAt).toBeInstanceOf(Date);
			expect(data.decisions).toHaveLength(1);
			expect(data.metrics).toHaveProperty("test_metric");
			expect(data.metrics).toHaveProperty("total_duration_ms");
			expect(data.errors).toHaveLength(1);
		});

		it("should export data with null completedAt when not completed", () => {
			// Arrange
			const trace = new ExecutionTrace("my-strategy", "1.0.0");

			// Act
			const data = trace.toData();

			// Assert
			expect(data.completedAt).toBeNull();
		});

		it("should create immutable snapshot", () => {
			// Arrange
			const trace = new ExecutionTrace("my-strategy", "1.0.0");
			trace.recordDecision("cat1", "Decision 1");

			// Act
			const data = trace.toData();
			// @ts-expect-error Testing runtime immutability
			data.decisions.push({ id: "fake" });

			// Assert
			expect(trace.decisions).toHaveLength(1);
		});
	});

	describe("toJSON", () => {
		it("should export valid JSON string", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordDecision("test", "Test decision");
			trace.recordMetric("test_metric", 100);

			// Act
			const json = trace.toJSON();

			// Assert
			expect(() => JSON.parse(json)).not.toThrow();
		});

		it("should include all trace data in JSON", () => {
			// Arrange
			const trace = new ExecutionTrace("my-strategy", "2.0.0");
			trace.recordDecision("test-cat", "Test decision");
			trace.recordMetric("test_metric", 42);
			trace.recordError(new Error("Test error"));
			trace.complete();

			// Act
			const json = trace.toJSON();
			const parsed = JSON.parse(json);

			// Assert
			expect(parsed.strategyName).toBe("my-strategy");
			expect(parsed.strategyVersion).toBe("2.0.0");
			expect(parsed.executionId).toBeDefined();
			expect(parsed.decisions).toHaveLength(1);
			expect(parsed.metrics.test_metric).toBe(42);
			expect(parsed.errors).toHaveLength(1);
		});

		it("should format JSON with 2-space indentation", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			const json = trace.toJSON();

			// Assert
			expect(json).toContain("  "); // Should have indentation
			expect(json).toContain("\n"); // Should have newlines (actual newline, not escaped)
		});
	});

	describe("toMarkdown", () => {
		it("should include header with strategy info", () => {
			// Arrange
			const trace = new ExecutionTrace("my-strategy", "2.0.0");

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).toContain("# Execution Trace: my-strategy v2.0.0");
			expect(markdown).toContain("**Execution ID**:");
			expect(markdown).toContain("**Started**:");
			expect(markdown).toContain("**Duration**:");
		});

		it("should include completed timestamp when completed", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.complete();

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).toContain("**Completed**:");
		});

		it("should not include completed timestamp when not completed", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).not.toContain("**Completed**:");
		});

		it("should include metrics table when metrics exist", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordMetric("generation_time_ms", 250);
			trace.recordMetric("token_count", 1500);

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).toContain("## Metrics");
			expect(markdown).toContain("| Metric | Value |");
			expect(markdown).toContain("| generation_time_ms | 250 |");
			expect(markdown).toContain("| token_count | 1500 |");
		});

		it("should not include metrics section when no metrics", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).not.toContain("## Metrics");
		});

		it("should include decisions section when decisions exist", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordDecision("validation", "Selected template", {
				inputSize: 1500,
			});

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).toContain("## Decisions");
			expect(markdown).toContain("### validation");
			expect(markdown).toContain("**Time**:");
			expect(markdown).toContain("Selected template");
			expect(markdown).toContain("**Context**:");
			expect(markdown).toContain("```json");
			expect(markdown).toContain('"inputSize": 1500');
		});

		it("should not include context section when context is empty", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordDecision("validation", "Selected template");

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).toContain("Selected template");
			expect(markdown).not.toContain("**Context**:");
		});

		it("should not include decisions section when no decisions", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).not.toContain("## Decisions");
		});

		it("should include errors section when errors exist", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			const error = new Error("Test error message");
			trace.recordError(error, { operation: "template-render" });

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).toContain("## Errors");
			expect(markdown).toContain("### Error");
			expect(markdown).toContain("**Time**:");
			expect(markdown).toContain("**Message**: Test error message");
			expect(markdown).toContain("**Stack**:");
			expect(markdown).toContain("**Context**:");
			expect(markdown).toContain('"operation": "template-render"');
		});

		it("should not include stack section when error has no stack", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			const error = new Error("Test error");
			delete error.stack;
			trace.recordError(error);

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).toContain("**Message**: Test error");
			expect(markdown).not.toContain("**Stack**:");
		});

		it("should not include error context section when context is empty", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");
			trace.recordError(new Error("Test error"));

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).toContain("**Message**: Test error");
			expect(markdown).not.toContain("**Context**:");
		});

		it("should not include errors section when no errors", () => {
			// Arrange
			const trace = new ExecutionTrace("test-strategy", "1.0.0");

			// Act
			const markdown = trace.toMarkdown();

			// Assert
			expect(markdown).not.toContain("## Errors");
		});
	});

	describe("sanitizeContext", () => {
		let trace: ExecutionTrace;

		beforeEach(() => {
			trace = new ExecutionTrace("test-strategy", "1.0.0");
		});

		it("should preserve JSON-serializable values", () => {
			// Arrange
			const context = {
				string: "test",
				number: 42,
				boolean: true,
				null: null,
				array: [1, 2, 3],
				object: { nested: "value" },
			};

			// Act
			const decision = trace.recordDecision("test", "test", context);

			// Assert
			expect(decision.context).toEqual(context);
		});

		it("should coerce functions in context to strings", () => {
			// Arrange
			const func = () => "test";
			const context = { func };

			// Act
			const decision = trace.recordDecision("test", "test", context);

			// Assert
			expect(decision.context.func).toBe(String(func));
		});

		it("should coerce symbols in context to strings", () => {
			// Arrange
			const sym = Symbol("test-symbol");
			const context = { sym };

			// Act
			const decision = trace.recordDecision("test", "test", context);

			// Assert
			expect(decision.context.sym).toBe(String(sym));
		});

		it("should handle circular references", () => {
			// Arrange
			type CircularContext = { name: string; self?: unknown };
			const circular: CircularContext = { name: "circular" };
			circular.self = circular;

			// Act
			const decision = trace.recordDecision("test", "test", circular);

			// Assert
			expect(decision.context.name).toBe("circular");
			expect(decision.context.self).toBe("[Circular]");
		});

		it("should coerce undefined in context to strings", () => {
			// Arrange
			const context = { undef: undefined };

			// Act
			const decision = trace.recordDecision("test", "test", context);

			// Assert
			expect(decision.context.undef).toBe("undefined");
		});

		it("should convert Date objects in context to ISO strings", () => {
			// Arrange
			const date = new Date("2024-01-01T00:00:00Z");
			const context = { date };

			// Act
			const decision = trace.recordDecision("test", "test", context);

			// Assert
			expect(decision.context.date).toBe(date.toISOString());
		});

		it("should handle BigInt by converting to string", () => {
			// Arrange
			const bigint = BigInt(9007199254740991);
			const context = { bigint };

			// Act
			const decision = trace.recordDecision("test", "test", context);

			// Assert
			expect(decision.context.bigint).toBe("9007199254740991");
		});

		it("should handle mixed serializable and non-serializable values", () => {
			// Arrange
			const func = () => "test";
			const sym = Symbol("sym");
			const nestedFunc = () => "nested";
			const context = {
				valid: "string",
				number: 42,
				func,
				symbol: sym,
				nested: { value: "ok", func: nestedFunc },
			};

			// Act
			const decision = trace.recordDecision("test", "test", context);

			// Assert
			expect(decision.context.valid).toBe("string");
			expect(decision.context.number).toBe(42);
			expect(decision.context.func).toBe(String(func));
			expect(decision.context.symbol).toBe(String(sym));
			expect(decision.context.nested.value).toBe("ok");
			expect(decision.context.nested.func).toBe(String(nestedFunc));
		});

		it("should handle empty context", () => {
			// Arrange
			const context = {};

			// Act
			const decision = trace.recordDecision("test", "test", context);

			// Assert
			expect(decision.context).toEqual({});
		});

		it("should convert RegExp in context to strings", () => {
			// Arrange
			const regex = /test/gi;
			const context = { regex };

			// Act
			const decision = trace.recordDecision("test", "test", context);

			// Assert
			expect(decision.context.regex).toBe(regex.toString());
		});
	});
});
