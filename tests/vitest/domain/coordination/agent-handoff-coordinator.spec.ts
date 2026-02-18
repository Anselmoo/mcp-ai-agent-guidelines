import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	AgentHandoffCoordinator,
	agentHandoffCoordinator,
} from "../../../../src/domain/coordination/agent-handoff-coordinator.js";
import { ExecutionTrace } from "../../../../src/domain/coordination/execution-trace.js";
import type { CreateHandoffRequest } from "../../../../src/domain/coordination/handoff-types.js";

describe("AgentHandoffCoordinator", () => {
	let coordinator: AgentHandoffCoordinator;

	beforeEach(() => {
		coordinator = new AgentHandoffCoordinator();
	});

	// ============================================
	// prepareHandoff - primary path
	// ============================================

	describe("prepareHandoff", () => {
		it("creates handoff package with required fields", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: { artifacts: ["spec.md"] },
				instructions: "Review the spec.",
			});

			expect(handoff.id).toBeDefined();
			expect(handoff.version).toBe("1.0.0");
			expect(handoff.sourceAgent).toBe("speckit-generator");
			expect(handoff.targetAgent).toBe("code-reviewer");
			expect(handoff.status).toBe("pending");
			expect(handoff.instructions.task).toBe("Review the spec.");
		});

		it("sets default priority to normal", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			expect(handoff.priority).toBe("normal");
		});

		it("accepts priority override", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "security-auditor",
				context: {},
				instructions: "Urgent security review",
				priority: "immediate",
			});

			expect(handoff.priority).toBe("immediate");
		});

		it("accepts background priority", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "documentation-generator",
				context: {},
				instructions: "Background doc task",
				priority: "background",
			});

			expect(handoff.priority).toBe("background");
		});

		it("sets expiration time from expirationMinutes", () => {
			const before = Date.now();
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
				expirationMinutes: 30,
			});

			const expectedExpiry = handoff.createdAt.getTime() + 30 * 60 * 1000;
			expect(handoff.expiresAt?.getTime()).toBe(expectedExpiry);
			expect(handoff.createdAt.getTime()).toBeGreaterThanOrEqual(before);
		});

		it("defaults expiration to 60 minutes", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			const expectedExpiry = handoff.createdAt.getTime() + 60 * 60 * 1000;
			expect(handoff.expiresAt?.getTime()).toBe(expectedExpiry);
		});

		it("generates unique IDs for each handoff", () => {
			const h1 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test 1",
			});
			const h2 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test 2",
			});

			expect(h1.id).not.toBe(h2.id);
		});

		it("includes execution trace snapshot when trace is provided", () => {
			const trace = new ExecutionTrace("test-operation");
			trace.recordDecision("validation", "passed", "All inputs valid");
			trace.recordMetric("duration", 100, "ms");
			trace.complete(true);

			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
				trace,
			});

			expect(handoff.trace).toBeDefined();
			expect(handoff.trace?.operation).toBe("test-operation");
			expect(handoff.trace?.decisions).toHaveLength(1);
			expect(handoff.trace?.success).toBe(true);
		});

		it("omits trace when not provided", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			expect(handoff.trace).toBeUndefined();
		});

		it("accepts detailed instructions object", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: {
					task: "Review the generated spec",
					constraints: ["Focus on completeness", "Check for ambiguity"],
					focusAreas: ["Requirements section", "Acceptance criteria"],
					avoid: ["Implementation details"],
				},
			});

			expect(handoff.instructions.task).toBe("Review the generated spec");
			expect(handoff.instructions.constraints).toHaveLength(2);
			expect(handoff.instructions.focusAreas).toHaveLength(2);
			expect(handoff.instructions.avoid).toHaveLength(1);
		});

		it("includes metadata when provided", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
				metadata: { correlationId: "abc-123" },
			});

			expect(handoff.metadata?.correlationId).toBe("abc-123");
		});

		it("preserves all context fields", () => {
			const context = {
				sessionId: "session-xyz",
				artifacts: ["spec.md", "plan.md"],
				workingDirectory: "/workspace",
				userRequest: "Generate spec",
				decisions: [{ what: "template", why: "standard format" }],
				custom: { key: "value" },
			};

			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context,
				instructions: "Test",
			});

			expect(handoff.context).toEqual(context);
		});
	});

	// ============================================
	// parseHandoff
	// ============================================

	describe("parseHandoff", () => {
		it("parses JSON string", () => {
			const original = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: { artifacts: ["test.md"] },
				instructions: "Test",
			});

			const json = JSON.stringify(original);
			const parsed = AgentHandoffCoordinator.parseHandoff(json);

			expect(parsed.id).toBe(original.id);
			expect(parsed.sourceAgent).toBe(original.sourceAgent);
			expect(parsed.context.artifacts).toEqual(["test.md"]);
		});

		it("parses object directly", () => {
			const original = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			const parsed = AgentHandoffCoordinator.parseHandoff(original);

			expect(parsed.id).toBe(original.id);
		});

		it("restores Date objects from JSON", () => {
			const original = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			const json = JSON.stringify(original);
			const parsed = AgentHandoffCoordinator.parseHandoff(json);

			expect(parsed.createdAt).toBeInstanceOf(Date);
			expect(parsed.expiresAt).toBeInstanceOf(Date);
		});

		it("throws on missing version", () => {
			expect(() => {
				AgentHandoffCoordinator.parseHandoff({ sourceAgent: "test" });
			}).toThrow("missing version");
		});

		it("throws on incompatible major version", () => {
			expect(() => {
				AgentHandoffCoordinator.parseHandoff({ version: "2.0.0" });
			}).toThrow("Incompatible handoff version");
		});

		it("accepts same major version with minor difference", () => {
			const original = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			// Patch the version to simulate a minor update
			const data = JSON.parse(JSON.stringify(original));
			data.version = "1.1.0";

			// Should not throw since major version matches
			expect(() => AgentHandoffCoordinator.parseHandoff(data)).not.toThrow();
		});

		it("handles handoff without expiresAt", () => {
			const data = {
				id: "test-id",
				version: "1.0.0",
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				priority: "normal",
				status: "pending",
				context: {},
				instructions: { task: "Test" },
				createdAt: new Date().toISOString(),
			};

			const parsed = AgentHandoffCoordinator.parseHandoff(data);
			expect(parsed.expiresAt).toBeUndefined();
		});
	});

	// ============================================
	// Instance Management
	// ============================================

	describe("register and get", () => {
		it("registers and retrieves handoff by ID", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			coordinator.register(handoff);
			const retrieved = coordinator.get(handoff.id);

			expect(retrieved).toBe(handoff);
		});

		it("returns undefined for unknown ID", () => {
			expect(coordinator.get("nonexistent")).toBeUndefined();
		});
	});

	describe("updateStatus", () => {
		it("updates handoff status", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			coordinator.register(handoff);
			const updated = coordinator.updateStatus(handoff.id, "accepted");

			expect(updated).toBe(true);
			expect(coordinator.get(handoff.id)?.status).toBe("accepted");
		});

		it("returns false for unknown handoff", () => {
			const updated = coordinator.updateStatus("unknown-id", "accepted");
			expect(updated).toBe(false);
		});

		it("supports all status transitions", () => {
			const statuses = [
				"pending",
				"accepted",
				"rejected",
				"completed",
				"expired",
			] as const;

			for (const status of statuses) {
				const handoff = AgentHandoffCoordinator.prepareHandoff({
					sourceAgent: "speckit-generator",
					targetAgent: "code-reviewer",
					context: {},
					instructions: "Test",
				});
				coordinator.register(handoff);
				coordinator.updateStatus(handoff.id, status);
				expect(coordinator.get(handoff.id)?.status).toBe(status);
			}
		});
	});

	// ============================================
	// Expiration
	// ============================================

	describe("isExpired", () => {
		it("detects expired handoff using fake timers", () => {
			vi.useFakeTimers();

			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
				expirationMinutes: 1,
			});

			vi.advanceTimersByTime(2 * 60 * 1000);

			expect(coordinator.isExpired(handoff)).toBe(true);

			vi.useRealTimers();
		});

		it("returns false for non-expired handoff", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
				expirationMinutes: 60,
			});

			expect(coordinator.isExpired(handoff)).toBe(false);
		});

		it("returns false when expiresAt is undefined", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			// Remove expiresAt to simulate no expiration
			handoff.expiresAt = undefined;

			expect(coordinator.isExpired(handoff)).toBe(false);
		});
	});

	describe("clearExpired", () => {
		it("clears expired handoffs and keeps valid ones", () => {
			vi.useFakeTimers();

			const h1 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Short-lived",
				expirationMinutes: 1,
			});

			const h2 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Long-lived",
				expirationMinutes: 60,
			});

			coordinator.register(h1);
			coordinator.register(h2);

			vi.advanceTimersByTime(2 * 60 * 1000);

			const cleared = coordinator.clearExpired();

			expect(cleared).toBe(1);
			expect(coordinator.get(h1.id)).toBeUndefined();
			expect(coordinator.get(h2.id)).toBeDefined();

			vi.useRealTimers();
		});

		it("returns 0 when nothing to clear", () => {
			const cleared = coordinator.clearExpired();
			expect(cleared).toBe(0);
		});
	});

	// ============================================
	// listPendingForAgent
	// ============================================

	describe("listPendingForAgent", () => {
		it("lists only pending handoffs for the given agent", () => {
			const h1 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "For code-reviewer",
			});

			const h2 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "security-auditor",
				context: {},
				instructions: "For security-auditor",
			});

			coordinator.register(h1);
			coordinator.register(h2);

			const pending = coordinator.listPendingForAgent("code-reviewer");

			expect(pending).toHaveLength(1);
			expect(pending[0].id).toBe(h1.id);
		});

		it("excludes non-pending handoffs", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
			});

			coordinator.register(handoff);
			coordinator.updateStatus(handoff.id, "completed");

			const pending = coordinator.listPendingForAgent("code-reviewer");
			expect(pending).toHaveLength(0);
		});

		it("excludes expired handoffs", () => {
			vi.useFakeTimers();

			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
				expirationMinutes: 1,
			});

			coordinator.register(handoff);
			vi.advanceTimersByTime(2 * 60 * 1000);

			const pending = coordinator.listPendingForAgent("code-reviewer");
			expect(pending).toHaveLength(0);

			vi.useRealTimers();
		});

		it("sorts by priority then creation time", () => {
			vi.useFakeTimers();

			const h1 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Normal 1",
				priority: "normal",
			});

			vi.advanceTimersByTime(1000);

			const h2 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Immediate",
				priority: "immediate",
			});

			vi.advanceTimersByTime(1000);

			const h3 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Background",
				priority: "background",
			});

			vi.advanceTimersByTime(1000);

			const h4 = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Normal 2",
				priority: "normal",
			});

			coordinator.register(h1);
			coordinator.register(h2);
			coordinator.register(h3);
			coordinator.register(h4);

			const pending = coordinator.listPendingForAgent("code-reviewer");

			expect(pending[0].id).toBe(h2.id); // immediate first
			expect(pending[1].id).toBe(h1.id); // normal, earlier
			expect(pending[2].id).toBe(h4.id); // normal, later
			expect(pending[3].id).toBe(h3.id); // background last

			vi.useRealTimers();
		});

		it("returns empty array when no pending handoffs", () => {
			const pending = coordinator.listPendingForAgent("code-reviewer");
			expect(pending).toHaveLength(0);
		});
	});

	// ============================================
	// createTraceSnapshot
	// ============================================

	describe("createTraceSnapshot", () => {
		it("snapshots decisions, metrics, and errors", () => {
			const trace = new ExecutionTrace("snap-test");
			trace.recordDecision("step1", "option-a", "Best option");
			trace.recordMetric("count", 42, "items");
			trace.recordError("ERR_TEST", "Test error occurred");
			trace.complete(false);

			const snap = AgentHandoffCoordinator.createTraceSnapshot(trace);

			expect(snap.operation).toBe("snap-test");
			expect(snap.decisions).toHaveLength(1);
			expect(snap.decisions[0]).toEqual({
				point: "step1",
				choice: "option-a",
				reason: "Best option",
			});
			expect(snap.metrics).toHaveLength(1);
			expect(snap.metrics[0]).toEqual({
				name: "count",
				value: 42,
				unit: "items",
			});
			expect(snap.errors).toHaveLength(1);
			expect(snap.errors[0]).toEqual({
				code: "ERR_TEST",
				message: "Test error occurred",
			});
			expect(snap.success).toBe(false);
		});

		it("includes durationMs and timestamp", () => {
			const trace = new ExecutionTrace("timing-test");
			trace.complete(true);

			const snap = AgentHandoffCoordinator.createTraceSnapshot(trace);

			expect(snap.durationMs).toBeGreaterThanOrEqual(0);
			expect(snap.timestamp).toBeDefined();
		});
	});

	// ============================================
	// toJSON / toMarkdown
	// ============================================

	describe("toJSON", () => {
		it("produces parseable JSON", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: { artifacts: ["a.md"] },
				instructions: "Test",
			});

			const json = AgentHandoffCoordinator.toJSON(handoff);
			const parsed = JSON.parse(json) as { sourceAgent: string };

			expect(parsed.sourceAgent).toBe("speckit-generator");
		});
	});

	describe("toMarkdown", () => {
		it("generates markdown with header and status", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Review for completeness",
			});

			const md = AgentHandoffCoordinator.toMarkdown(handoff);

			expect(md).toContain("speckit-generator → code-reviewer");
			expect(md).toContain("Review for completeness");
			expect(md).toContain("**Status**: pending");
		});

		it("includes artifacts when present", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: { artifacts: ["spec.md", "plan.md"] },
				instructions: "Test",
			});

			const md = AgentHandoffCoordinator.toMarkdown(handoff);

			expect(md).toContain("`spec.md`");
			expect(md).toContain("`plan.md`");
		});

		it("includes prior decisions when present", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {
					decisions: [{ what: "Template", why: "Using standard format" }],
				},
				instructions: "Test",
			});

			const md = AgentHandoffCoordinator.toMarkdown(handoff);

			expect(md).toContain("**Template**: Using standard format");
		});

		it("includes constraints in instructions", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: {
					task: "Review",
					constraints: ["Focus on requirements"],
					focusAreas: ["Section 1"],
				},
			});

			const md = AgentHandoffCoordinator.toMarkdown(handoff);

			expect(md).toContain("Focus on requirements");
			expect(md).toContain("Section 1");
		});

		it("includes execution trace summary when trace is present", () => {
			const trace = new ExecutionTrace("review-op");
			trace.recordDecision("d1", "choice", "reason");
			trace.complete(true);

			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
				trace,
			});

			const md = AgentHandoffCoordinator.toMarkdown(handoff);

			expect(md).toContain("Execution Trace Summary");
			expect(md).toContain("review-op");
			expect(md).toContain("✅");
		});

		it("shows ❌ for failed trace", () => {
			const trace = new ExecutionTrace("failed-op");
			trace.complete(false);

			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
				trace,
			});

			const md = AgentHandoffCoordinator.toMarkdown(handoff);
			expect(md).toContain("❌");
		});

		it("includes expiration when present", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Test",
				expirationMinutes: 30,
			});

			const md = AgentHandoffCoordinator.toMarkdown(handoff);
			expect(md).toContain("**Expires**:");
		});
	});

	// ============================================
	// Singleton
	// ============================================

	describe("agentHandoffCoordinator singleton", () => {
		it("is an instance of AgentHandoffCoordinator", () => {
			expect(agentHandoffCoordinator).toBeInstanceOf(AgentHandoffCoordinator);
		});
	});

	// ============================================
	// Full round-trip integration
	// ============================================

	describe("round-trip serialization", () => {
		it("serialize → parse → inspect preserves all fields", () => {
			const trace = new ExecutionTrace("roundtrip-op");
			trace.recordDecision("select", "option-b", "Better fit");
			trace.complete(true);

			const original = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "tdd-workflow",
				context: {
					sessionId: "sess-001",
					artifacts: ["spec.md"],
					decisions: [{ what: "Approach", why: "TDD is required" }],
				},
				instructions: {
					task: "Write tests for generated spec",
					focusAreas: ["Edge cases"],
				},
				trace,
				priority: "immediate",
				metadata: { issueRef: "T-008" },
			});

			const json = AgentHandoffCoordinator.toJSON(original);
			const parsed = AgentHandoffCoordinator.parseHandoff(json);

			expect(parsed.id).toBe(original.id);
			expect(parsed.version).toBe("1.0.0");
			expect(parsed.sourceAgent).toBe("speckit-generator");
			expect(parsed.targetAgent).toBe("tdd-workflow");
			expect(parsed.priority).toBe("immediate");
			expect(parsed.status).toBe("pending");
			expect(parsed.context.sessionId).toBe("sess-001");
			expect(parsed.context.artifacts).toEqual(["spec.md"]);
			expect(parsed.instructions.task).toBe("Write tests for generated spec");
			expect(parsed.trace?.operation).toBe("roundtrip-op");
			expect(parsed.trace?.success).toBe(true);
			expect(parsed.metadata?.issueRef).toBe("T-008");
		});
	});
});

// ============================================
// ExecutionTrace (used by coordinator)
// ============================================

describe("ExecutionTrace", () => {
	it("records decisions with point, choice, and reason", () => {
		const trace = new ExecutionTrace("op");
		trace.recordDecision("step-1", "option-a", "Lowest cost");

		const data = trace.toJSON();
		expect(data.decisions).toHaveLength(1);
		expect(data.decisions[0].point).toBe("step-1");
		expect(data.decisions[0].choice).toBe("option-a");
		expect(data.decisions[0].reason).toBe("Lowest cost");
	});

	it("records metrics with name, value, and optional unit", () => {
		const trace = new ExecutionTrace("op");
		trace.recordMetric("latency", 50, "ms");
		trace.recordMetric("count", 7);

		const data = trace.toJSON();
		expect(data.metrics).toHaveLength(2);
		expect(data.metrics[0]).toEqual({ name: "latency", value: 50, unit: "ms" });
		expect(data.metrics[1]).toEqual({
			name: "count",
			value: 7,
			unit: undefined,
		});
	});

	it("records errors with code and message", () => {
		const trace = new ExecutionTrace("op");
		trace.recordError("ERR_NETWORK", "Connection timed out");

		const data = trace.toJSON();
		expect(data.errors).toHaveLength(1);
		expect(data.errors[0].code).toBe("ERR_NETWORK");
		expect(data.errors[0].message).toBe("Connection timed out");
	});

	it("marks operation as successful", () => {
		const trace = new ExecutionTrace("op");
		trace.complete(true);

		expect(trace.toJSON().success).toBe(true);
	});

	it("marks operation as failed", () => {
		const trace = new ExecutionTrace("op");
		trace.complete(false);

		expect(trace.toJSON().success).toBe(false);
	});

	it("defaults success to false before complete()", () => {
		const trace = new ExecutionTrace("op");
		expect(trace.toJSON().success).toBe(false);
	});

	it("calculates durationMs after complete()", () => {
		const trace = new ExecutionTrace("op");
		trace.complete(true);

		expect(trace.toJSON().durationMs).toBeGreaterThanOrEqual(0);
	});

	it("exports operation name", () => {
		const trace = new ExecutionTrace("my-operation");
		expect(trace.toJSON().operation).toBe("my-operation");
	});

	it("exports ISO timestamp", () => {
		const trace = new ExecutionTrace("op");
		const ts = trace.toJSON().timestamp;

		expect(() => new Date(ts)).not.toThrow();
		expect(new Date(ts).getFullYear()).toBeGreaterThan(2000);
	});
});
