import { describe, expect, it, vi } from "vitest";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";
import { StateMachineOrchestrator } from "../../infrastructure/state-machine-orchestration.js";

describe("state-machine-orchestration", () => {
	it("creates workflows, accepts events, and reports current state", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const workflowId = orchestrator.createWorkflow("wf-1");

		expect(orchestrator.sendEvent(workflowId, "START")).toBe(true);
		expect(orchestrator.getWorkflowState(workflowId)).toEqual(
			expect.objectContaining({
				status: "running",
				context: expect.objectContaining({
					currentState: "executing",
					previousState: "pending",
					metadata: expect.objectContaining({
						transitionCount: 1,
						lastTransition: expect.any(Date),
					}),
				}),
			}),
		);

		orchestrator.sendEvent(workflowId, "COMPLETE");
		expect(orchestrator.getWorkflowState(workflowId)).toEqual(
			expect.objectContaining({
				status: "completed",
				context: expect.objectContaining({
					currentState: "completed",
					duration: expect.any(Number),
					endTime: expect.any(Number),
				}),
			}),
		);
	});

	it("reuses provided workflow ids for skill workflows and accepts unified events", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const workflowId = orchestrator.createSkillWorkflow("skill-1", {
			workflowId: "wf-skill-1",
			skills: ["skill-1"],
			results: {},
			startTime: Date.now(),
			metadata: {},
		});

		expect(workflowId).toBe("wf-skill-1");
		expect(orchestrator.sendEvent(workflowId, { type: "START" })).toBe(true);
		expect(
			orchestrator.sendEvent(workflowId, {
				type: "SKILL_COMPLETE",
				skillId: "skill-1",
				result: { ok: true },
			}),
		).toBe(true);

		expect(orchestrator.getWorkflowState(workflowId)).toEqual(
			expect.objectContaining({
				workflowId: "wf-skill-1",
				status: "completed",
				context: expect.objectContaining({
					currentState: "completed",
					results: {
						"skill-1": { ok: true },
					},
				}),
			}),
		);
	});

	it("captures workflow start payloads in context data", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const workflowId = orchestrator.createWorkflow("wf-start-context");

		expect(
			orchestrator.sendEvent(workflowId, {
				type: "START",
				context: { requestId: "req-1" },
				payload: { attempt: 2 },
			}),
		).toBe(true);
		expect(orchestrator.getWorkflowState(workflowId)?.context.data).toEqual({
			attempt: 2,
			requestId: "req-1",
		});
	});

	it("persists and restores workflow state when persistence is enabled", async () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: true,
			defaultTimeout: 1000,
		});
		const workflowId = orchestrator.createWorkflow("wf-persist", {
			context: {
				workflowId: "wf-persist",
				skills: ["skill-1"],
				results: {},
				startTime: Date.now(),
				metadata: {},
			},
		});

		orchestrator.sendEvent(workflowId, { type: "START" });
		orchestrator.sendEvent(workflowId, {
			type: "SKILL_COMPLETE",
			skillId: "skill-1",
			result: { ok: true },
		});
		const originalState = orchestrator.getWorkflowState(workflowId);

		await expect(orchestrator.persistWorkflow(workflowId)).resolves.toBe(true);

		orchestrator.stopWorkflow(workflowId);
		expect(orchestrator.getWorkflowState(workflowId)).toBeNull();

		await expect(orchestrator.restoreWorkflow(workflowId)).resolves.toBe(true);
		expect(orchestrator.getWorkflowState(workflowId)).toEqual(
			expect.objectContaining({
				currentState: originalState?.currentState,
				context: expect.objectContaining({
					results: originalState?.context.results,
					currentState: originalState?.context.currentState,
					previousState: originalState?.context.previousState,
					metadata: expect.objectContaining({
						transitionCount:
							originalState?.context.metadata.transitionCount ?? 0,
					}),
				}),
			}),
		);
	});

	it("logs invalid event dispatch failures and returns false", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});
		const workflowId = orchestrator.createWorkflow("wf-invalid");

		try {
			expect(orchestrator.sendEvent(workflowId, {} as never)).toBe(false);
			expect(logSpy).toHaveBeenCalledWith(
				"error",
				"Error sending event to workflow",
				expect.objectContaining({
					workflowId: "wf-invalid",
				}),
			);
		} finally {
			logSpy.mockRestore();
		}
	});
});
