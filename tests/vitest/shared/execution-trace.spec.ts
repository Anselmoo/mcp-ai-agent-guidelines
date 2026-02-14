import { describe, expect, it } from "vitest";
import { ExecutionTrace } from "../../../src/strategies/shared/execution-trace.js";

describe("shared/execution-trace", () => {
	it("covers the primary trace path", () => {
		const trace = new ExecutionTrace();
		trace.recordStart({ input: "ok" });
		trace.recordDecision("template", "selected chat", { mode: "chat" });
		trace.recordMetric("tokens", 42, "t");
		trace.recordMetric("latency_ms", 10);
		trace.recordWarning("fallback used", { reason: "unsupported format" });
		trace.recordSuccess({ output: "done" });

		const exported = trace.toJSON();

		expect(exported.entries.map((entry) => entry.type)).toEqual([
			"start",
			"decision",
			"metric",
			"metric",
			"warning",
			"success",
		]);
		expect(exported.entries[3]?.message).toBe("latency_ms: 10");
		expect(exported.summary.totalDecisions).toBe(1);
		expect(exported.summary.totalWarnings).toBe(1);
		expect(exported.summary.totalErrors).toBe(0);
		expect(exported.summary.durationMs).toBeGreaterThanOrEqual(0);
	});

	it("covers failure mode by recording errors and preserving context", () => {
		const trace = new ExecutionTrace();
		const error = new Error("generation failed");
		trace.recordError(error, { step: "generate" });

		const exported = trace.toJSON();
		const errorEntry = exported.entries.find((entry) => entry.type === "error");

		expect(errorEntry?.message).toBe("generation failed");
		expect(errorEntry?.data).toMatchObject({ step: "generate" });
		expect(exported.summary.totalErrors).toBe(1);
	});

	it("exports markdown with expected sections", () => {
		const trace = new ExecutionTrace();
		trace.recordDecision("validation", "input verified");
		trace.recordError("validation warning");

		const markdown = trace.toMarkdown();

		expect(markdown).toContain("# Execution Trace: trace_");
		expect(markdown).toContain("## Summary");
		expect(markdown).toContain("## Timeline");
		expect(markdown).toContain("**decision**");
		expect(markdown).toContain("**error**");
	});
});
