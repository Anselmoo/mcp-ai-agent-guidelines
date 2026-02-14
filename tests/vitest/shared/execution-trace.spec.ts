import { describe, expect, it } from "vitest";
import { ExecutionTrace } from "../../../src/strategies/shared/execution-trace.js";

const TRACE_ID_PATTERN = /^trace_[a-z0-9]+_[a-z0-9]{6}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const ISO_TIMESTAMP_CONTAINS_PATTERN = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

describe("strategies/shared/execution-trace", () => {
	it("covers the primary trace path", () => {
		// Arrange
		const trace = new ExecutionTrace();

		// Act
		trace.recordStart({ input: "ok" });
		trace.recordDecision("template", "selected chat", { mode: "chat" });
		trace.recordMetric("tokens", 42, "t");
		trace.recordMetric("latency_ms", 10);
		trace.recordWarning("fallback used", { reason: "unsupported format" });
		trace.recordSuccess({ output: "done" });
		const exported = trace.toJSON();

		// Assert
		expect(exported.entries.map((entry) => entry.type)).toEqual([
			"start",
			"decision",
			"metric",
			"metric",
			"warning",
			"success",
		]);
		expect(exported.entries[2]?.message).toBe("tokens: 42t");
		expect(exported.entries[2]?.data).toEqual({
			name: "tokens",
			value: 42,
			unit: "t",
		});
		expect(exported.entries[3]?.message).toBe("latency_ms: 10");
		expect(exported.entries[3]?.data).toEqual({
			name: "latency_ms",
			value: 10,
			unit: undefined,
		});
		expect(exported.summary.totalDecisions).toBe(1);
		expect(exported.summary.totalWarnings).toBe(1);
		expect(exported.summary.totalErrors).toBe(0);
		expect(exported.summary.durationMs).toBeGreaterThanOrEqual(0);
	});

	it("covers failure mode by recording errors and preserving context", () => {
		// Arrange
		const trace = new ExecutionTrace();
		const error = new Error("generation failed");

		// Act
		trace.recordError(error, { step: "generate" });
		const exported = trace.toJSON();
		const errorEntry = exported.entries.find((entry) => entry.type === "error");

		// Assert
		expect(errorEntry?.message).toBe("generation failed");
		expect(errorEntry?.data).toEqual({
			step: "generate",
			stack: error.stack,
		});
		expect(exported.summary.totalErrors).toBe(1);
	});

	it("exports markdown with expected sections", () => {
		// Arrange
		const trace = new ExecutionTrace();
		trace.recordDecision("validation", "input verified");
		trace.recordError("validation failed");

		// Act
		const markdown = trace.toMarkdown();

		// Assert
		expect(markdown).toContain("# Execution Trace: trace_");
		expect(markdown).toContain("## Summary");
		expect(markdown).toContain("## Timeline");
		expect(markdown).toContain("**decision**");
		expect(markdown).toContain("**error**");

		const lines = markdown.split("\n");
		const timelineHeaderIndex = lines.findIndex((line) =>
			line.trim().startsWith("## Timeline"),
		);
		expect(timelineHeaderIndex).toBeGreaterThanOrEqual(0);

		const timelineLines = lines
			.slice(timelineHeaderIndex + 1)
			.filter((line) => line.trim().startsWith("- "));
		expect(timelineLines).toHaveLength(2);
		expect(timelineLines.some((line) => line.includes("**decision**"))).toBe(
			true,
		);
		expect(timelineLines.some((line) => line.includes("**error**"))).toBe(true);

		for (const line of timelineLines) {
			expect(line).toMatch(ISO_TIMESTAMP_CONTAINS_PATTERN);
		}
	});

	it("generates traceId values with expected format and uniqueness", () => {
		// Arrange & Act
		const traceA = new ExecutionTrace();
		const traceB = new ExecutionTrace();
		const traceAId = traceA.toJSON().traceId;
		const traceBId = traceB.toJSON().traceId;

		// Assert
		expect(traceAId).toMatch(TRACE_ID_PATTERN);
		expect(traceBId).toMatch(TRACE_ID_PATTERN);
		expect(traceAId).not.toBe(traceBId);
	});

	it("tracks start/end time and duration semantics", () => {
		// Arrange
		const trace = new ExecutionTrace();

		// Act
		const beforeSuccess = trace.toJSON();
		const duration = trace.getDuration();
		trace.recordSuccess({ output: "done" });
		const afterSuccess = trace.toJSON();
		const successEntry = afterSuccess.entries.find(
			(entry) => entry.type === "success",
		);

		// Assert
		expect(beforeSuccess.startTime).toMatch(ISO_TIMESTAMP_PATTERN);
		expect(beforeSuccess.endTime).toMatch(ISO_TIMESTAMP_PATTERN);
		expect(new Date(beforeSuccess.endTime).getTime()).toBeGreaterThanOrEqual(
			new Date(beforeSuccess.startTime).getTime(),
		);
		expect(duration).toBeGreaterThanOrEqual(0);
		expect(afterSuccess.endTime).toBe(successEntry?.timestamp);
	});

	it("records string errors without stack traces", () => {
		// Arrange
		const trace = new ExecutionTrace();

		// Act
		trace.recordError("simple failure", { step: "generate" });
		const exported = trace.toJSON();
		const errorEntry = exported.entries.find((entry) => entry.type === "error");

		// Assert
		expect(errorEntry?.message).toBe("simple failure");
		expect(errorEntry?.data).toEqual({
			step: "generate",
			stack: undefined,
		});
		expect(exported.summary.totalErrors).toBe(1);
	});
});
