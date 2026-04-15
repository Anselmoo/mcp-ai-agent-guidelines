/**
 * graph-types.test.ts
 *
 * contracts/graph-types.ts is a pure-type module.
 * Tests verify structural invariants: field types, required vs optional fields,
 * and discriminant values across all key interfaces.
 * W2 #71: Also covers the new isStateMachineContext and extractStateName guards.
 */
import { describe, expect, it } from "vitest";
import type {
	AgentNode,
	AnomalyDetectionResult,
	DistributedTrace,
	LogEntry,
	PathOptimization,
	SkillNode,
	StateMachineContext,
	WorkflowState,
} from "../../contracts/graph-types.js";
import {
	extractStateName,
	isStateMachineContext,
	normalizeWorkflowMachineState,
} from "../../contracts/graph-types.js";

describe("graph-types — contract shapes", () => {
	it("AgentNode performance.successRate is a numeric ratio in [0,1]", () => {
		const agent: AgentNode = {
			id: "agent-1",
			name: "Planner",
			capabilities: ["plan", "review"],
			modelTier: "strong",
			status: "available",
			performance: {
				successRate: 0.98,
				averageLatency: 120,
				throughput: 8,
			},
		};
		expect(agent.performance.successRate).toBeGreaterThanOrEqual(0);
		expect(agent.performance.successRate).toBeLessThanOrEqual(1);
		expect(["available", "busy", "offline"]).toContain(agent.status);
	});

	it("SkillNode complexity and estimatedLatency are numeric fields", () => {
		const skill: SkillNode = {
			id: "debug-root-cause",
			name: "Root Cause Analysis",
			domain: "debug",
			dependencies: ["req-analysis"],
			complexity: 3,
			estimatedLatency: 500,
		};
		expect(typeof skill.complexity).toBe("number");
		expect(typeof skill.estimatedLatency).toBe("number");
		expect(skill.dependencies).toContain("req-analysis");
	});

	it("WorkflowState represents running state with full context", () => {
		const state: WorkflowState = {
			name: "analysis",
			workflowId: "wf-1",
			currentState: "executing",
			status: "running",
			context: {
				workflowId: "wf-1",
				skills: ["debug-root-cause"],
				results: {},
				metadata: {},
				startTime: Date.now(),
			},
			isRunning: true,
			on: {},
		};
		expect(state.status).toBe("running");
		expect(state.isRunning).toBe(true);
		expect(["pending", "running", "completed", "failed", "paused"]).toContain(
			state.status,
		);
	});

	it("DistributedTrace rootSpan traceId matches trace traceId", () => {
		const now = Date.now();
		const trace: DistributedTrace = {
			traceId: "trace-abc",
			rootSpan: {
				traceId: "trace-abc",
				spanId: "span-1",
				operationName: "execute-workflow",
				startTime: now,
				tags: { env: "test" },
				logs: [],
			},
			spans: [],
			startTime: now,
		};
		expect(trace.rootSpan.traceId).toBe(trace.traceId);
		expect(Array.isArray(trace.spans)).toBe(true);
	});

	it("LogEntry level covers all six severity tiers", () => {
		const levels: LogEntry["level"][] = [
			"trace",
			"debug",
			"info",
			"warn",
			"error",
			"fatal",
		];
		expect(levels).toHaveLength(6);
		const entry: LogEntry = {
			level: "error",
			message: "Something went wrong",
			timestamp: Date.now(),
		};
		expect(levels).toContain(entry.level);
	});

	it("AnomalyDetectionResult type discriminates spike from dip", () => {
		const spike: AnomalyDetectionResult = {
			timestamp: 0,
			value: 100,
			expectedValue: 50,
			deviation: 50,
			severity: "high",
			type: "spike",
		};
		expect(spike.type).toBe("spike");
		expect(["low", "medium", "high"]).toContain(spike.severity);
	});

	it("PathOptimization confidence is in [0, 1] range by convention", () => {
		const path: PathOptimization = {
			path: ["agent-1", "agent-2"],
			totalWeight: 1.5,
			estimatedLatency: 300,
			confidence: 0.85,
		};
		expect(path.confidence).toBeGreaterThanOrEqual(0);
		expect(path.confidence).toBeLessThanOrEqual(1);
	});
});

// ─── W2 #71 – isStateMachineContext ──────────────────────────────────────────

describe("isStateMachineContext — type guard", () => {
	const validContext: StateMachineContext = {
		workflowId: "wf-test",
		skills: ["skill-a"],
		results: {},
		metadata: {},
		startTime: Date.now(),
	};

	it("returns true for a fully conforming StateMachineContext", () => {
		expect(isStateMachineContext(validContext)).toBe(true);
	});

	it("returns true when optional fields are absent", () => {
		expect(isStateMachineContext({ ...validContext })).toBe(true);
	});

	it("returns false for null", () => {
		expect(isStateMachineContext(null)).toBe(false);
	});

	it("returns false for a plain string", () => {
		expect(isStateMachineContext("executing")).toBe(false);
	});

	it("returns false when workflowId is missing", () => {
		const { workflowId: _omit, ...bad } = validContext;
		expect(isStateMachineContext(bad)).toBe(false);
	});

	it("returns false when skills is not an array", () => {
		expect(isStateMachineContext({ ...validContext, skills: "skill-a" })).toBe(
			false,
		);
	});

	it("returns false when results is not an object", () => {
		expect(isStateMachineContext({ ...validContext, results: null })).toBe(
			false,
		);
	});

	it("returns false when results is an array", () => {
		expect(isStateMachineContext({ ...validContext, results: [] })).toBe(false);
	});

	it("returns false when skills contains non-string values", () => {
		expect(
			isStateMachineContext({
				...validContext,
				skills: ["skill-a", 42] as unknown as string[],
			}),
		).toBe(false);
	});

	it("returns false when startTime is not a number", () => {
		expect(isStateMachineContext({ ...validContext, startTime: "now" })).toBe(
			false,
		);
	});
});

// ─── W2 #66 / #71 – extractStateName ─────────────────────────────────────────

describe("extractStateName — state value normalisation", () => {
	it("returns a plain string unchanged", () => {
		expect(extractStateName("executing")).toBe("executing");
	});

	it("returns 'unknown' for null", () => {
		expect(extractStateName(null)).toBe("unknown");
	});

	it("returns 'unknown' for undefined", () => {
		expect(extractStateName(undefined)).toBe("unknown");
	});

	it("returns 'unknown' for an empty object", () => {
		expect(extractStateName({})).toBe("unknown");
	});

	it("flattens a shallow compound state object", () => {
		const result = extractStateName({ parent: "child" });
		expect(result).toBe("parent.child");
	});

	it("flattens a nested compound state object depth-first", () => {
		const result = extractStateName({ outer: { inner: "leaf" } });
		expect(result).toBe("outer.inner.leaf");
	});

	it("normalizes compound workflow states to their top-level workflow state", () => {
		expect(normalizeWorkflowMachineState({ executing: "child" })).toBe(
			"executing",
		);
	});

	it("handles the common XState v5 flat-machine pattern", () => {
		// XState v5 flat machines return strings; compound ones return objects.
		// This guard handles both without `as string` casts.
		for (const state of ["pending", "executing", "completed", "failed"]) {
			expect(extractStateName(state)).toBe(state);
		}
	});
});
