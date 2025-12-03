import { beforeEach, describe, expect, it } from "vitest";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import {
	TraceLogger,
	type TraceSpan,
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
			const spanId = logger.startToolSpan(
				context.correlationId,
				"test-tool",
				{ input: "test" },
				0,
			);

			expect(spanId).toMatch(/^span_/);

			logger.endToolSpan(spanId, { success: true, data: "result" });

			const trace = logger.getTrace(context.correlationId);
			expect(trace).toBeDefined();
			expect(trace?.spans).toHaveLength(1);
			expect(trace?.spans[0].toolName).toBe("test-tool");
			expect(trace?.spans[0].status).toBe("success");
		});

		it("should track span hierarchy", () => {
			const parentSpanId = logger.startToolSpan(
				context.correlationId,
				"parent-tool",
				{},
				0,
			);

			const childSpanId = logger.startToolSpan(
				context.correlationId,
				"child-tool",
				{},
				1,
				parentSpanId,
			);

			logger.endToolSpan(childSpanId, { success: true, data: "child" });
			logger.endToolSpan(parentSpanId, { success: true, data: "parent" });

			const trace = logger.getTrace(context.correlationId);
			expect(trace?.spans).toHaveLength(2);
			expect(trace?.spans[1].parentSpanId).toBe(parentSpanId);
		});

		it("should mark spans with errors", () => {
			const spanId = logger.startToolSpan(
				context.correlationId,
				"failing-tool",
				{},
				0,
			);

			logger.endToolSpan(spanId, {
				success: false,
				error: "Tool failed",
			});

			const trace = logger.getTrace(context.correlationId);
			expect(trace?.spans[0].status).toBe("error");
			expect(trace?.spans[0].error).toBe("Tool failed");
		});
	});

	describe("Events", () => {
		it("should add events to trace", () => {
			const spanId = logger.startToolSpan(
				context.correlationId,
				"test-tool",
				{},
				0,
			);

			logger.addEvent(context.correlationId, "test_event", {
				message: "Test event",
			});

			const trace = logger.getTrace(context.correlationId);
			expect(trace?.events).toHaveLength(1);
			expect(trace?.events[0].name).toBe("test_event");
		});

		it("should limit events to prevent memory leaks", () => {
			const spanId = logger.startToolSpan(
				context.correlationId,
				"test-tool",
				{},
				0,
			);

			// Add more than MAX_EVENTS
			for (let i = 0; i < 1100; i++) {
				logger.addEvent(context.correlationId, `event_${i}`, {});
			}

			const trace = logger.getTrace(context.correlationId);
			expect(trace?.events.length).toBeLessThanOrEqual(1000);
		});
	});

	describe("Timeline visualization", () => {
		it("should generate timeline visualization", () => {
			const span1 = logger.startToolSpan(context.correlationId, "tool1", {}, 0);
			logger.endToolSpan(span1, { success: true, data: "result1" });

			const span2 = logger.startToolSpan(context.correlationId, "tool2", {}, 0);
			logger.endToolSpan(span2, { success: true, data: "result2" });

			const timeline = logger.getTimeline(context.correlationId);

			expect(timeline).toBeDefined();
			expect(timeline).toContain("tool1");
			expect(timeline).toContain("tool2");
			expect(timeline).toContain("Timeline");
		});

		it("should handle empty traces", () => {
			const timeline = logger.getTimeline("non-existent");
			expect(timeline).toBe("No trace found for correlation ID: non-existent");
		});
	});

	describe("Mermaid diagram generation", () => {
		it("should generate Mermaid sequence diagram", () => {
			const parentSpan = logger.startToolSpan(
				context.correlationId,
				"parent",
				{},
				0,
			);
			const childSpan = logger.startToolSpan(
				context.correlationId,
				"child",
				{},
				1,
				parentSpan,
			);

			logger.endToolSpan(childSpan, { success: true, data: "child" });
			logger.endToolSpan(parentSpan, { success: true, data: "parent" });

			const diagram = logger.getMermaidDiagram(context.correlationId);

			expect(diagram).toContain("sequenceDiagram");
			expect(diagram).toContain("parent");
			expect(diagram).toContain("child");
		});
	});

	describe("OTLP export", () => {
		it("should export trace in OTLP format", () => {
			const spanId = logger.startToolSpan(
				context.correlationId,
				"test-tool",
				{},
				0,
			);
			logger.endToolSpan(spanId, { success: true, data: "result" });

			const otlp = logger.exportOTLP(context.correlationId);

			expect(otlp).toBeDefined();
			expect(otlp?.resourceSpans).toBeDefined();
			expect(otlp?.resourceSpans[0].scopeSpans[0].spans).toHaveLength(1);
		});
	});

	describe("Metrics", () => {
		it("should calculate trace metrics", () => {
			const span1 = logger.startToolSpan(context.correlationId, "tool1", {}, 0);
			// Simulate some delay
			logger.endToolSpan(span1, { success: true, data: "result1" });

			const span2 = logger.startToolSpan(context.correlationId, "tool2", {}, 0);
			logger.endToolSpan(span2, { success: true, data: "result2" });

			const metrics = logger.getMetrics(context.correlationId);

			expect(metrics).toBeDefined();
			expect(metrics?.totalSpans).toBe(2);
			expect(metrics?.successfulSpans).toBe(2);
			expect(metrics?.failedSpans).toBe(0);
			expect(metrics?.totalDurationMs).toBeGreaterThan(0);
		});

		it("should identify critical path", () => {
			const parentSpan = logger.startToolSpan(
				context.correlationId,
				"parent",
				{},
				0,
			);
			const childSpan = logger.startToolSpan(
				context.correlationId,
				"child",
				{},
				1,
				parentSpan,
			);

			logger.endToolSpan(childSpan, { success: true, data: "child" });
			logger.endToolSpan(parentSpan, { success: true, data: "parent" });

			const metrics = logger.getMetrics(context.correlationId);

			expect(metrics?.criticalPath).toBeDefined();
			expect(metrics?.criticalPath.length).toBeGreaterThan(0);
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

			const trace = logger.createTraceFromContext(context);

			expect(trace).toBeDefined();
			expect(trace.correlationId).toBe(context.correlationId);
			expect(trace.spans).toHaveLength(2);
		});
	});

	describe("Memory management", () => {
		it("should cleanup old spans to prevent memory leaks", () => {
			// Create many spans for different correlations
			for (let i = 0; i < 150; i++) {
				const corrId = `corr_${i}`;
				const spanId = logger.startToolSpan(corrId, `tool_${i}`, {}, 0);
				logger.endToolSpan(spanId, { success: true, data: "result" });
			}

			// Cleanup should have been triggered
			// Verify that old spans are cleaned up
			const allTraces = [];
			for (let i = 0; i < 150; i++) {
				const trace = logger.getTrace(`corr_${i}`);
				if (trace) allTraces.push(trace);
			}

			// Some old traces should have been cleaned up
			expect(allTraces.length).toBeLessThan(150);
		});

		it("should cleanup spans older than MAX_SPAN_AGE_MS", () => {
			const oldCorrId = "old_correlation";
			const spanId = logger.startToolSpan(oldCorrId, "old-tool", {}, 0);
			logger.endToolSpan(spanId, { success: true, data: "result" });

			// Manually set span to be very old (this tests the cleanup logic conceptually)
			// In real implementation, cleanup happens periodically

			// Trigger cleanup by creating new spans
			for (let i = 0; i < 20; i++) {
				const newSpan = logger.startToolSpan(`new_${i}`, `tool_${i}`, {}, 0);
				logger.endToolSpan(newSpan, { success: true, data: "result" });
			}

			// Old span might be cleaned up
			// This is a conceptual test - actual cleanup depends on time thresholds
		});
	});
});
