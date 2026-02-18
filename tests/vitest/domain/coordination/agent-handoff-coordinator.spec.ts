import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentHandoffCoordinator } from "../../../../src/domain/coordination/agent-handoff-coordinator.js";
import { ExecutionTrace } from "../../../../src/domain/coordination/execution-trace.js";

describe("AgentHandoffCoordinator", () => {
	let coordinator: AgentHandoffCoordinator;

	beforeEach(() => {
		coordinator = new AgentHandoffCoordinator();
	});

	describe("prepareHandoff", () => {
		it("should create handoff package with required fields", () => {
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
			expect(handoff.priority).toBe("normal");
		});

		it("should support priority overrides and expiration", () => {
			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "security-auditor",
				context: {},
				instructions: "Urgent security review",
				priority: "immediate",
				expirationMinutes: 30,
			});

			expect(handoff.priority).toBe("immediate");
			expect(handoff.expiresAt?.getTime()).toBe(
				handoff.createdAt.getTime() + 30 * 60 * 1000,
			);
		});

		it("should include execution trace snapshot", () => {
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

			expect(handoff.trace?.operation).toBe("test-operation");
			expect(handoff.trace?.decisions).toHaveLength(1);
			expect(handoff.trace?.success).toBe(true);
		});
	});

	describe("parseHandoff", () => {
		it("should parse JSON and restore dates", () => {
			const original = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: { artifacts: ["test.md"] },
				instructions: {
					task: "Test",
					deadline: new Date("2026-01-01T00:00:00.000Z"),
				},
			});

			const parsed = AgentHandoffCoordinator.parseHandoff(
				JSON.stringify(original),
			);

			expect(parsed.id).toBe(original.id);
			expect(parsed.createdAt).toBeInstanceOf(Date);
			expect(parsed.expiresAt).toBeInstanceOf(Date);
			expect(parsed.instructions.deadline).toBeInstanceOf(Date);
		});

		it("should fail for missing or incompatible version", () => {
			expect(() => AgentHandoffCoordinator.parseHandoff({})).toThrow(
				"missing version",
			);
			expect(() =>
				AgentHandoffCoordinator.parseHandoff({ version: "2.0.0" }),
			).toThrow("Incompatible handoff version");
		});
	});

	describe("instance management", () => {
		it("should register, update, and list handoffs by priority", () => {
			const normal = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Normal",
				priority: "normal",
			});
			const immediate = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {},
				instructions: "Immediate",
				priority: "immediate",
			});

			coordinator.register(normal);
			coordinator.register(immediate);

			expect(coordinator.get(normal.id)).toBe(normal);
			expect(coordinator.updateStatus(normal.id, "accepted")).toBe(true);
			expect(coordinator.updateStatus("missing", "accepted")).toBe(false);

			const pending = coordinator.listPendingForAgent("code-reviewer");
			expect(pending).toHaveLength(1);
			expect(pending[0].id).toBe(immediate.id);
		});
	});

	describe("expiration and serialization", () => {
		it("should clear expired handoffs", () => {
			vi.useFakeTimers();
			try {
				const expired = AgentHandoffCoordinator.prepareHandoff({
					sourceAgent: "speckit-generator",
					targetAgent: "code-reviewer",
					context: {},
					instructions: "Expired soon",
					expirationMinutes: 0,
				});
				const active = AgentHandoffCoordinator.prepareHandoff({
					sourceAgent: "speckit-generator",
					targetAgent: "code-reviewer",
					context: {},
					instructions: "Still active",
					expirationMinutes: 10,
				});
				coordinator.register(expired);
				coordinator.register(active);

				vi.advanceTimersByTime(1);

				expect(coordinator.isExpired(expired)).toBe(true);
				expect(coordinator.clearExpired()).toBe(1);
				expect(coordinator.get(expired.id)).toBeUndefined();
				expect(coordinator.get(active.id)).toBeDefined();
			} finally {
				vi.useRealTimers();
			}
		});

		it("should generate markdown and json summaries", () => {
			const trace = new ExecutionTrace("test-operation");
			trace.recordDecision("validation", "passed", "All inputs valid");
			trace.complete(true);

			const handoff = AgentHandoffCoordinator.prepareHandoff({
				sourceAgent: "speckit-generator",
				targetAgent: "code-reviewer",
				context: {
					artifacts: ["spec.md", "plan.md"],
					decisions: [{ what: "Template", why: "Using standard format" }],
				},
				instructions: {
					task: "Review for completeness",
					constraints: ["Focus on requirements"],
				},
				trace,
			});

			const markdown = AgentHandoffCoordinator.toMarkdown(handoff);
			expect(markdown).toContain("speckit-generator → code-reviewer");
			expect(markdown).toContain("Execution Trace Summary");
			expect(markdown).toContain("Focus on requirements");

			const json = AgentHandoffCoordinator.toJSON(handoff);
			expect(() => JSON.parse(json)).not.toThrow();
		});
	});
});
