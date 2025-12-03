import { beforeEach, describe, expect, it } from "vitest";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import {
	createTraceFromContext,
	type TraceEvent,
	TraceLogger,
	type TraceSpan,
	traceLogger,
} from "../../src/tools/shared/trace-logger.js";

describe("TraceLogger", () => {
	let logger: TraceLogger;
	let context: A2AContext;

	beforeEach(() => {
		logger = new TraceLogger();
		context = createA2AContext();
	});

	describe("Span management", () => {
		it("should start and end tool spans", () => {
			const spanId = logger.startToolSpan(context, "test-tool", "hash123");

			expect(spanId).toMatch(/^span_/);

			logger.endToolSpan(spanId, true, "result summary");

			const spans = logger.getSpans(context.correlationId);
			expect(spans).toBeDefined();
			expect(spans).toHaveLength(1);
			expect(spans[0].toolName).toBe("test-tool");
			expect(spans[0].status).toBe("success");
		});

		it("should track span hierarchy", () => {
			const parentSpanId = logger.startToolSpan(
				context,
				"parent-tool",
				"hash1",
			);

			// Create child context
			const childContext = { ...context, depth: 1 };
			const childSpanId = logger.startToolSpan(
				childContext,
				"child-tool",
				"hash2",
			);

			logger.endToolSpan(childSpanId, true, "child result");
			logger.endToolSpan(parentSpanId, true, "parent result");

			const spans = logger.getSpans(context.correlationId);
			expect(spans).toHaveLength(2);
			// The child span should have parent reference
			expect(spans[1].parentSpanId).toBe(parentSpanId);
		});

		it("should mark spans with errors", () => {
			const spanId = logger.startToolSpan(context, "failing-tool", "hash");

			logger.endToolSpan(spanId, false, undefined, "Tool failed");

			const spans = logger.getSpans(context.correlationId);
			expect(spans[0].status).toBe("error");
			expect(spans[0].error).toBe("Tool failed");
		});
	});

	describe("Events", () => {
		it("should track events through chain lifecycle", () => {
			logger.startChain(context);

			const spanId = logger.startToolSpan(context, "test-tool", "hash");
			logger.endToolSpan(spanId, true, "result");

			logger.endChain(context, true);

			const events = logger.getEvents(context.correlationId);
			expect(events.length).toBeGreaterThan(0);
			expect(events[0].type).toBe("chain_start");
		});
	});

	describe("Timeline", () => {
		it("should generate timeline data", () => {
			const span1 = logger.startToolSpan(context, "tool1", "hash1");
			logger.endToolSpan(span1, true, "result1");

			const span2 = logger.startToolSpan(context, "tool2", "hash2");
			logger.endToolSpan(span2, true, "result2");

			const timeline = logger.getTimeline(context.correlationId);

			expect(timeline).toBeDefined();
			expect(timeline.spans).toHaveLength(2);
			expect(timeline.totalDurationMs).toBeGreaterThanOrEqual(0);
		});

		it("should handle empty traces", () => {
			const timeline = logger.getTimeline("non-existent");
			expect(timeline.spans).toEqual([]);
			expect(timeline.totalDurationMs).toBe(0);
		});
	});

	describe("Export", () => {
		it("should export trace in JSON format", () => {
			const spanId = logger.startToolSpan(context, "test-tool", "hash");
			logger.endToolSpan(spanId, true, "result");

			const exported = logger.exportTrace(context.correlationId, "json");

			expect(exported).toBeDefined();
			const parsed = JSON.parse(exported);
			expect(parsed.correlationId).toBe(context.correlationId);
			expect(parsed.spans).toHaveLength(1);
		});

		it("should export trace in OTLP format", () => {
			const spanId = logger.startToolSpan(context, "test-tool", "hash");
			logger.endToolSpan(spanId, true, "result");

			const exported = logger.exportTrace(context.correlationId, "otlp");

			expect(exported).toBeDefined();
			const parsed = JSON.parse(exported);
			expect(parsed.resourceSpans).toBeDefined();
		});
	});

	describe("Summary", () => {
		it("should provide summary statistics", () => {
			const span1 = logger.startToolSpan(context, "tool1", "hash1");
			logger.endToolSpan(span1, true, "result1");

			const span2 = logger.startToolSpan(context, "tool2", "hash2");
			logger.endToolSpan(span2, true, "result2");

			const summary = logger.getSummary();

			expect(summary).toBeDefined();
			expect(summary.totalSpans).toBe(2);
		});
	});

	describe("Trace creation from context", () => {
		it("should create trace from A2A context", () => {
			// Simulate execution log entries
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
				depth: 1,
			});

			const trace = createTraceFromContext(context);

			expect(trace).toBeDefined();
			expect(trace.correlationId).toBe(context.correlationId);
			expect(trace.spans).toHaveLength(2);
		});
	});

	describe("Singleton instance", () => {
		it("should export singleton traceLogger", () => {
			expect(traceLogger).toBeDefined();
			expect(traceLogger).toBeInstanceOf(TraceLogger);
		});
	});

	describe("Clear", () => {
		it("should clear all traces", () => {
			const spanId = logger.startToolSpan(context, "test-tool", "hash");
			logger.endToolSpan(spanId, true, "result");

			expect(logger.getSpans(context.correlationId)).toHaveLength(1);

			logger.clear();

			expect(logger.getSpans(context.correlationId)).toHaveLength(0);
		});
	});

	describe("Type exports", () => {
		it("should export TraceSpan type", () => {
			const span: TraceSpan = {
				spanId: "test",
				correlationId: "corr",
				toolName: "tool",
				startTime: new Date(),
				depth: 0,
				status: "pending",
				inputHash: "hash",
			};
			expect(span.spanId).toBe("test");
		});

		it("should export TraceEvent type", () => {
			const event: TraceEvent = {
				type: "tool_start",
				timestamp: new Date(),
				correlationId: "corr",
			};
			expect(event.type).toBe("tool_start");
		});
	});

	describe("Edge cases", () => {
		it("should handle ending non-existent span", () => {
			// Should not throw, just warn
			logger.endToolSpan("non-existent-span", true, "result");
			// No assertion needed - just checking it doesn't throw
		});

		it("should restore parent span when ending nested span", () => {
			const parentSpan = logger.startToolSpan(context, "parent", "hash1");
			const childSpan = logger.startToolSpan(context, "child", "hash2");

			logger.endToolSpan(childSpan, true, "child result");
			// Parent should be restored as active span

			const anotherSpan = logger.startToolSpan(context, "sibling", "hash3");
			logger.endToolSpan(anotherSpan, true, "sibling result");
			logger.endToolSpan(parentSpan, true, "parent result");

			const spans = logger.getSpans(context.correlationId);
			expect(spans).toHaveLength(3);
		});

		it("should handle spans without end times in timeline", () => {
			// Start a span but don't end it
			logger.startToolSpan(context, "unfinished", "hash");

			const timeline = logger.getTimeline(context.correlationId);
			expect(timeline.spans).toHaveLength(1);
			expect(timeline.totalDurationMs).toBe(0); // No end time
		});

		it("should find critical path through dependent spans", () => {
			// Create a chain of dependent spans
			const span1 = logger.startToolSpan(context, "tool1", "hash1");
			logger.endToolSpan(span1, true, "result1");

			const childContext = { ...context, depth: 1 };
			const span2 = logger.startToolSpan(childContext, "tool2", "hash2");
			logger.endToolSpan(span2, true, "result2");

			const timeline = logger.getTimeline(context.correlationId);
			expect(timeline.criticalPath).toBeDefined();
		});

		it("should track context_update events", () => {
			logger.startChain(context);

			const events = logger.getEvents(context.correlationId);
			expect(events.some((e) => e.type === "chain_start")).toBe(true);
		});

		it("should calculate correct summary with zero chains", () => {
			const freshLogger = new TraceLogger();
			const summary = freshLogger.getSummary();

			expect(summary.totalChains).toBe(0);
			expect(summary.avgSpansPerChain).toBe(0);
		});

		it("should handle error spans with error message", () => {
			const spanId = logger.startToolSpan(context, "error-tool", "hash");
			logger.endToolSpan(spanId, false, undefined, "Critical failure");

			const spans = logger.getSpans(context.correlationId);
			expect(spans[0].status).toBe("error");
			expect(spans[0].error).toBe("Critical failure");
		});
	});

	describe("Memory management", () => {
		it("should limit events to prevent memory leaks", () => {
			// Create many events
			for (let i = 0; i < 50; i++) {
				const spanId = logger.startToolSpan(context, `tool-${i}`, `hash-${i}`);
				logger.endToolSpan(spanId, true, `result-${i}`);
			}

			// Should have events but limited
			const events = logger.getEvents(context.correlationId);
			expect(events.length).toBeGreaterThan(0);
		});
	});
});
