import { describe, expect, it } from "vitest";
import {
	aggregateTelemetry,
	findSlowestStep,
	flattenTelemetryRecords,
	formatTelemetrySummary,
	type StepTelemetryRecord,
	type WorkflowTelemetry,
	WorkflowTelemetryCollector,
} from "../../workflows/workflow-telemetry.js";

describe("WorkflowTelemetryCollector extra branches", () => {
	it("records multiple retried steps and counts them correctly", () => {
		const c = new WorkflowTelemetryCollector("instr-x", "sess-x");

		const t1 = c.startStep("step-1", "invokeSkill");
		t1.finish(true, { attempts: 3 }); // 2 retries

		const t2 = c.startStep("step-2", "invokeSkill");
		t2.finish(false, { attempts: 4, errorMessage: "timeout" }); // 3 retries

		const report = c.finalise();
		expect(report.stepCount).toBe(2);
		expect(report.succeededSteps).toBe(1);
		expect(report.failedSteps).toBe(1);
		expect(report.totalRetries).toBe(5); // (3-1) + (4-1)
		expect(report.steps[1]?.errorMessage).toBe("timeout");
	});

	it("finalise() with children counts them recursively", () => {
		const c = new WorkflowTelemetryCollector("instr-y", "sess-y");
		const timer = c.startStep("parent", "serial");
		timer.finish(true);

		c.attachChildRecords([
			{
				label: "child-ok",
				kind: "invokeSkill",
				attempts: 1,
				succeeded: true,
			},
			{
				label: "child-fail",
				kind: "invokeSkill",
				attempts: 2,
				succeeded: false,
				children: [
					{
						label: "grandchild",
						kind: "note",
						attempts: 1,
						succeeded: true,
					},
				],
			},
		]);

		const report = c.finalise();
		// top-level: 1 (parent)
		expect(report.stepCount).toBe(1);
		// recursive: parent(ok) + child-ok(ok) + child-fail(fail) + grandchild(ok) = 3 ok, 1 fail
		expect(report.succeededSteps).toBe(3);
		expect(report.failedSteps).toBe(1);
		// child-fail has 2 attempts = 1 retry, grandchild has 1 attempt = 0
		expect(report.totalRetries).toBe(1);
	});

	it("attachChildRecords does nothing when records are empty", () => {
		const c = new WorkflowTelemetryCollector("instr-z", "sess-z");
		// no steps started
		c.attachChildRecords([
			{ label: "orphan", kind: "note", attempts: 1, succeeded: true },
		]);
		const report = c.finalise();
		expect(report.stepCount).toBe(0);
	});

	it("finalise() sets finishedAt and totalDurationMs", () => {
		const c = new WorkflowTelemetryCollector("instr-d", "sess-d");
		const t = c.startStep("s", "note");
		t.finish(true);
		const report = c.finalise();
		expect(report.finishedAt).toBeDefined();
		expect(typeof report.finishedAt).toBe("string");
		expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
	});

	it("step with errorClass is preserved in report", () => {
		const c = new WorkflowTelemetryCollector("instr-e", "sess-e");
		const t = c.startStep("s", "gate");
		t.finish(false, { errorClass: "permanent", errorMessage: "not allowed" });
		const report = c.finalise();
		expect(report.steps[0]?.errorClass).toBe("permanent");
	});
});

describe("formatTelemetrySummary extra branches", () => {
	it("does not include retries line when totalRetries is 0", () => {
		const t: WorkflowTelemetry = {
			instructionId: "instr",
			sessionId: "s",
			startedAt: new Date().toISOString(),
			stepCount: 2,
			succeededSteps: 2,
			failedSteps: 0,
			totalRetries: 0,
			steps: [],
			totalDurationMs: 50,
		};
		const summary = formatTelemetrySummary(t);
		expect(summary).not.toContain("retries");
		expect(summary).toContain("✓");
	});

	it("omits 'in Xms' when totalDurationMs is undefined", () => {
		const t: WorkflowTelemetry = {
			instructionId: "instr",
			sessionId: "s",
			startedAt: new Date().toISOString(),
			stepCount: 1,
			succeededSteps: 1,
			failedSteps: 0,
			totalRetries: 0,
			steps: [],
			// no totalDurationMs
		};
		const summary = formatTelemetrySummary(t);
		expect(summary).not.toContain("ms");
	});

	it("includes failed count in summary when failures present", () => {
		const t: WorkflowTelemetry = {
			instructionId: "instr",
			sessionId: "s",
			startedAt: new Date().toISOString(),
			stepCount: 3,
			succeededSteps: 2,
			failedSteps: 1,
			totalRetries: 3,
			steps: [],
			totalDurationMs: 100,
		};
		const summary = formatTelemetrySummary(t);
		expect(summary).toContain("1 failed");
		expect(summary).toContain("3 retries");
	});
});

describe("flattenTelemetryRecords extra branches", () => {
	it("returns single record with no children", () => {
		const record: StepTelemetryRecord = {
			label: "solo",
			kind: "invokeSkill",
			attempts: 1,
			succeeded: true,
		};
		const flat = flattenTelemetryRecords([record]);
		expect(flat).toHaveLength(1);
		expect(flat[0]?.label).toBe("solo");
	});

	it("handles deeply nested children (3 levels)", () => {
		const records: StepTelemetryRecord[] = [
			{
				label: "L0",
				kind: "serial",
				attempts: 1,
				succeeded: true,
				children: [
					{
						label: "L1",
						kind: "parallel",
						attempts: 1,
						succeeded: true,
						children: [
							{
								label: "L2",
								kind: "invokeSkill",
								attempts: 1,
								succeeded: true,
							},
						],
					},
				],
			},
		];
		const flat = flattenTelemetryRecords(records);
		expect(flat).toHaveLength(3);
		expect(flat.map((r) => r.label)).toEqual(["L0", "L1", "L2"]);
	});
});

describe("findSlowestStep extra branches", () => {
	it("returns undefined when all steps have no timing", () => {
		const t: WorkflowTelemetry = {
			instructionId: "i",
			sessionId: "s",
			startedAt: "",
			stepCount: 2,
			succeededSteps: 2,
			failedSteps: 0,
			totalRetries: 0,
			steps: [
				{ label: "a", kind: "note", attempts: 1, succeeded: true },
				{ label: "b", kind: "note", attempts: 1, succeeded: true },
			],
		};
		expect(findSlowestStep(t)).toBeUndefined();
	});

	it("handles tie in durationMs by returning the first one encountered", () => {
		const t: WorkflowTelemetry = {
			instructionId: "i",
			sessionId: "s",
			startedAt: "",
			stepCount: 2,
			succeededSteps: 2,
			failedSteps: 0,
			totalRetries: 0,
			steps: [
				{
					label: "first",
					kind: "invokeSkill",
					attempts: 1,
					succeeded: true,
					timing: { startedAt: "", finishedAt: "", durationMs: 100 },
				},
				{
					label: "second",
					kind: "invokeSkill",
					attempts: 1,
					succeeded: true,
					timing: { startedAt: "", finishedAt: "", durationMs: 100 },
				},
			],
		};
		const slowest = findSlowestStep(t);
		// Both are equal; reduce keeps prev when cur is not strictly greater
		expect(slowest?.label).toBe("first");
	});

	it("picks step with timing over step without timing", () => {
		const t: WorkflowTelemetry = {
			instructionId: "i",
			sessionId: "s",
			startedAt: "",
			stepCount: 2,
			succeededSteps: 2,
			failedSteps: 0,
			totalRetries: 0,
			steps: [
				{ label: "no-timing", kind: "note", attempts: 1, succeeded: true },
				{
					label: "has-timing",
					kind: "invokeSkill",
					attempts: 1,
					succeeded: true,
					timing: { startedAt: "", finishedAt: "", durationMs: 10 },
				},
			],
		};
		const slowest = findSlowestStep(t);
		expect(slowest?.label).toBe("has-timing");
	});
});

describe("aggregateTelemetry extra branches", () => {
	it("handles single run with no totalDurationMs", () => {
		const run: WorkflowTelemetry = {
			instructionId: "i",
			sessionId: "s",
			startedAt: "",
			stepCount: 1,
			succeededSteps: 1,
			failedSteps: 0,
			totalRetries: 0,
			// no totalDurationMs
			steps: [],
		};
		const agg = aggregateTelemetry([run]);
		expect(agg.runCount).toBe(1);
		expect(agg.averageDurationMs).toBeNull();
		expect(agg.p95DurationMs).toBeNull();
	});

	it("computes p95 for a single duration", () => {
		const run: WorkflowTelemetry = {
			instructionId: "i",
			sessionId: "s",
			startedAt: "",
			stepCount: 1,
			succeededSteps: 1,
			failedSteps: 0,
			totalRetries: 0,
			totalDurationMs: 200,
			steps: [],
		};
		const agg = aggregateTelemetry([run]);
		expect(agg.averageDurationMs).toBe(200);
		expect(agg.p95DurationMs).toBe(200);
	});

	it("computes correct p95 for multiple runs", () => {
		const runs: WorkflowTelemetry[] = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(
			(d, i) => ({
				instructionId: "i",
				sessionId: `s-${i}`,
				startedAt: "",
				stepCount: 1,
				succeededSteps: 1,
				failedSteps: 0,
				totalRetries: 0,
				totalDurationMs: d,
				steps: [],
			}),
		);
		const agg = aggregateTelemetry(runs);
		expect(agg.runCount).toBe(10);
		expect(agg.averageDurationMs).toBe(550); // (100+...+1000)/10 = 550
		// p95 index = floor(10 * 0.95) = 9 → sorted[9] = 1000
		expect(agg.p95DurationMs).toBe(1000);
	});

	it("handles mixed runs where some have no duration", () => {
		const runs: WorkflowTelemetry[] = [
			{
				instructionId: "i",
				sessionId: "s1",
				startedAt: "",
				stepCount: 1,
				succeededSteps: 1,
				failedSteps: 0,
				totalRetries: 0,
				totalDurationMs: 400,
				steps: [],
			},
			{
				instructionId: "i",
				sessionId: "s2",
				startedAt: "",
				stepCount: 1,
				succeededSteps: 0,
				failedSteps: 1,
				totalRetries: 1,
				// no totalDurationMs
				steps: [],
			},
		];
		const agg = aggregateTelemetry(runs);
		expect(agg.runCount).toBe(2);
		expect(agg.averageDurationMs).toBe(400);
	});
});
