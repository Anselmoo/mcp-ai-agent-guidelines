/**
 * Tests for workflow-telemetry: WorkflowTelemetryCollector, StepTimer,
 * formatTelemetrySummary, flattenTelemetryRecords, findSlowestStep,
 * aggregateTelemetry.
 */

import { describe, expect, it } from "vitest";
import {
	aggregateTelemetry,
	findSlowestStep,
	flattenTelemetryRecords,
	formatTelemetrySummary,
	type WorkflowTelemetry,
	WorkflowTelemetryCollector,
} from "../../workflows/workflow-telemetry.js";

// ─── WorkflowTelemetryCollector ───────────────────────────────────────────────

describe("WorkflowTelemetryCollector", () => {
	it("starts with zero records", () => {
		const c = new WorkflowTelemetryCollector("instr-1", "sess-1");
		expect(c.currentRecords).toHaveLength(0);
	});

	it("records a successful step", () => {
		const c = new WorkflowTelemetryCollector("instr-1", "sess-1");
		const timer = c.startStep("step-a", "invokeSkill");
		timer.finish(true, { attempts: 1 });

		const report = c.finalise();
		expect(report.stepCount).toBe(1);
		expect(report.succeededSteps).toBe(1);
		expect(report.failedSteps).toBe(0);
		expect(report.totalRetries).toBe(0);
		expect(report.steps[0]?.label).toBe("step-a");
		expect(report.steps[0]?.succeeded).toBe(true);
		expect(report.steps[0]?.timing).toBeDefined();
	});

	it("records a failed step", () => {
		const c = new WorkflowTelemetryCollector("instr-1", "sess-1");
		const timer = c.startStep("step-b", "invokeSkill");
		timer.finish(false, {
			attempts: 2,
			errorMessage: "Network error",
			errorClass: "transient",
		});

		const report = c.finalise();
		expect(report.failedSteps).toBe(1);
		expect(report.totalRetries).toBe(1); // 2 attempts - 1
		expect(report.steps[0]?.errorMessage).toBe("Network error");
		expect(report.steps[0]?.errorClass).toBe("transient");
	});

	it("tracks total duration", () => {
		const c = new WorkflowTelemetryCollector("instr-1", "sess-1");
		const timer = c.startStep("step-a", "note");
		timer.finish(true);
		const report = c.finalise();
		expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
	});

	it("attachChildRecords attaches to the last step", () => {
		const c = new WorkflowTelemetryCollector("instr-1", "sess-1");
		const timer = c.startStep("parent", "serial");
		timer.finish(true);

		const childRecord = {
			label: "child",
			kind: "invokeSkill",
			attempts: 1,
			succeeded: true,
		};
		c.attachChildRecords([childRecord]);

		const report = c.finalise();
		expect(report.steps[0]?.children).toHaveLength(1);
		expect(report.steps[0]?.children?.[0]?.label).toBe("child");
	});
});

// ─── formatTelemetrySummary ───────────────────────────────────────────────────

describe("formatTelemetrySummary", () => {
	it("includes instruction ID and step count", () => {
		const t: WorkflowTelemetry = {
			instructionId: "my-instr",
			sessionId: "sess",
			startedAt: new Date().toISOString(),
			stepCount: 5,
			succeededSteps: 5,
			failedSteps: 0,
			totalRetries: 0,
			steps: [],
			totalDurationMs: 200,
		};
		const summary = formatTelemetrySummary(t);
		expect(summary).toContain("my-instr");
		expect(summary).toContain("5 steps");
		expect(summary).toContain("200ms");
	});

	it("shows failure count when there are failures", () => {
		const t: WorkflowTelemetry = {
			instructionId: "instr",
			sessionId: "sess",
			startedAt: new Date().toISOString(),
			stepCount: 3,
			succeededSteps: 2,
			failedSteps: 1,
			totalRetries: 2,
			steps: [],
		};
		const summary = formatTelemetrySummary(t);
		expect(summary).toContain("✗");
		expect(summary).toContain("1 failed");
		expect(summary).toContain("2 retries");
	});
});

// ─── flattenTelemetryRecords ──────────────────────────────────────────────────

describe("flattenTelemetryRecords", () => {
	it("flattens a nested tree", () => {
		const records = [
			{
				label: "parent",
				kind: "serial",
				attempts: 1,
				succeeded: true,
				children: [
					{
						label: "child-1",
						kind: "invokeSkill",
						attempts: 1,
						succeeded: true,
					},
					{
						label: "child-2",
						kind: "invokeSkill",
						attempts: 1,
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
				],
			},
		];

		const flat = flattenTelemetryRecords(records);
		expect(flat).toHaveLength(4);
		expect(flat.map((r) => r.label)).toEqual([
			"parent",
			"child-1",
			"child-2",
			"grandchild",
		]);
	});

	it("handles empty input", () => {
		expect(flattenTelemetryRecords([])).toHaveLength(0);
	});
});

// ─── findSlowestStep ─────────────────────────────────────────────────────────

describe("findSlowestStep", () => {
	it("finds the step with highest durationMs", () => {
		const t: WorkflowTelemetry = {
			instructionId: "i",
			sessionId: "s",
			startedAt: new Date().toISOString(),
			stepCount: 3,
			succeededSteps: 3,
			failedSteps: 0,
			totalRetries: 0,
			steps: [
				{
					label: "fast",
					kind: "invokeSkill",
					attempts: 1,
					succeeded: true,
					timing: {
						startedAt: "",
						finishedAt: "",
						durationMs: 10,
					},
				},
				{
					label: "slow",
					kind: "invokeSkill",
					attempts: 1,
					succeeded: true,
					timing: {
						startedAt: "",
						finishedAt: "",
						durationMs: 500,
					},
				},
			],
		};
		const slowest = findSlowestStep(t);
		expect(slowest?.label).toBe("slow");
	});

	it("returns undefined for empty steps", () => {
		const t: WorkflowTelemetry = {
			instructionId: "i",
			sessionId: "s",
			startedAt: "",
			stepCount: 0,
			succeededSteps: 0,
			failedSteps: 0,
			totalRetries: 0,
			steps: [],
		};
		expect(findSlowestStep(t)).toBeUndefined();
	});
});

// ─── aggregateTelemetry ───────────────────────────────────────────────────────

describe("aggregateTelemetry", () => {
	it("returns zeroes for empty array", () => {
		const agg = aggregateTelemetry([]);
		expect(agg.runCount).toBe(0);
		expect(agg.averageDurationMs).toBeNull();
	});

	it("aggregates across multiple runs", () => {
		const run1: WorkflowTelemetry = {
			instructionId: "i",
			sessionId: "s1",
			startedAt: "",
			stepCount: 3,
			succeededSteps: 3,
			failedSteps: 0,
			totalRetries: 0,
			totalDurationMs: 100,
			steps: [],
		};
		const run2: WorkflowTelemetry = {
			instructionId: "i",
			sessionId: "s2",
			startedAt: "",
			stepCount: 2,
			succeededSteps: 1,
			failedSteps: 1,
			totalRetries: 2,
			totalDurationMs: 300,
			steps: [],
		};
		const agg = aggregateTelemetry([run1, run2]);
		expect(agg.runCount).toBe(2);
		expect(agg.totalSteps).toBe(5);
		expect(agg.totalSucceeded).toBe(4);
		expect(agg.totalFailed).toBe(1);
		expect(agg.totalRetries).toBe(2);
		expect(agg.averageDurationMs).toBe(200);
	});
});
