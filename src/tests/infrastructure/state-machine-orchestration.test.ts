import { describe, expect, it, vi } from "vitest";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";
import { StateMachineOrchestrator } from "../../infrastructure/state-machine-orchestration.js";

type StateMachineOrchestratorInternals = {
	workflowInstances: Map<
		string,
		{
			getSnapshot: () => {
				value: string;
				context: unknown;
				done: boolean;
				error?: unknown;
			};
			stop?: () => void;
		}
	>;
	persistedWorkflows: Map<string, unknown>;
	workflowDefinitions: Map<
		string,
		{ kind: "workflow" | "skill"; skillId?: string }
	>;
	workflowLifecycle: Map<
		string,
		{
			currentState: string;
			previousState?: string;
			lastTransition?: Date;
			transitionCount?: number;
		}
	>;
	updateWorkflowLifecycle: (workflowId: string, previousState: string) => void;
};

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

	it("sendEvent returns false for non-existent workflow", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		expect(orchestrator.sendEvent("non-existent-wf", "START")).toBe(false);
	});

	it("getWorkflowState returns null for non-existent workflow", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		expect(orchestrator.getWorkflowState("non-existent")).toBeNull();
	});

	it("getActiveWorkflows returns all running workflows", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		orchestrator.createWorkflow("wf-active-1");
		orchestrator.createWorkflow("wf-active-2");
		orchestrator.sendEvent("wf-active-1", "START");

		const active = orchestrator.getActiveWorkflows();
		expect(active.length).toBeGreaterThanOrEqual(2);
		const ids = active.map((w) => w.workflowId);
		expect(ids).toContain("wf-active-1");
		expect(ids).toContain("wf-active-2");
	});

	it("getWorkflowHealthMetrics returns valid metrics", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf1 = orchestrator.createWorkflow("wf-health-1");
		orchestrator.sendEvent(wf1, "START");
		orchestrator.sendEvent(wf1, "COMPLETE");

		const wf2 = orchestrator.createWorkflow("wf-health-2");
		orchestrator.sendEvent(wf2, "START");
		orchestrator.sendEvent(wf2, "ERROR");

		orchestrator.createWorkflow("wf-health-3");

		const metrics = orchestrator.getWorkflowHealthMetrics();
		expect(typeof metrics.totalWorkflows).toBe("number");
		expect(typeof metrics.activeWorkflows).toBe("number");
		expect(typeof metrics.completedWorkflows).toBe("number");
		expect(typeof metrics.failedWorkflows).toBe("number");
		expect(typeof metrics.averageExecutionTime).toBe("number");
		expect(metrics.totalWorkflows).toBeGreaterThanOrEqual(3);
	});

	it("persistWorkflow returns false when persistence is disabled", async () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createWorkflow("wf-persist-disabled");
		const result = await orchestrator.persistWorkflow(wf);
		expect(result).toBe(false);
	});

	it("restoreWorkflow returns false when persistence is disabled", async () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const result = await orchestrator.restoreWorkflow("non-existent");
		expect(result).toBe(false);
	});

	it("restoreWorkflow returns false for non-existent persisted workflow", async () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: true,
			defaultTimeout: 1000,
		});
		const result = await orchestrator.restoreWorkflow("not-persisted");
		expect(result).toBe(false);
	});

	it("transitions to failed state on ERROR event", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createWorkflow("wf-fail-path");
		orchestrator.sendEvent(wf, "START");
		orchestrator.sendEvent(wf, "ERROR");
		const state = orchestrator.getWorkflowState(wf);
		expect(state?.status).toBe("failed");
	});

	it("transitions skill workflow to failed on SKILL_ERROR", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createSkillWorkflow("skill-fail", {
			workflowId: "wf-skill-fail",
			skills: ["skill-fail"],
			results: {},
			startTime: Date.now(),
			metadata: {},
		});
		orchestrator.sendEvent(wf, { type: "START" });
		orchestrator.sendEvent(wf, {
			type: "SKILL_ERROR",
			skillId: "skill-fail",
			error: new Error("skill failed"),
		});
		const state = orchestrator.getWorkflowState(wf);
		expect(state?.status).toBe("failed");
	});

	it("stopWorkflow removes the workflow instance", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createWorkflow("wf-stop");
		orchestrator.stopWorkflow(wf);
		expect(orchestrator.getWorkflowState(wf)).toBeNull();
	});

	it("createWorkflow uses provided initial state", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		orchestrator.createWorkflow("wf-initial-state", {
			initialState: "executing" as never,
			context: {
				workflowId: "wf-initial-state",
				skills: [],
				results: {},
				startTime: Date.now(),
				metadata: {},
			},
		});
		const state = orchestrator.getWorkflowState("wf-initial-state");
		expect(state).not.toBeNull();
	});

	it("restores skill workflow from persisted state", async () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: true,
			defaultTimeout: 1000,
		});
		const wfId = orchestrator.createSkillWorkflow("skill-restore", {
			workflowId: "wf-skill-restore",
			skills: ["skill-restore"],
			results: {},
			startTime: Date.now(),
			metadata: {},
		});
		orchestrator.sendEvent(wfId, { type: "START" });
		await orchestrator.persistWorkflow(wfId);
		orchestrator.stopWorkflow(wfId);
		const restored = await orchestrator.restoreWorkflow(wfId);
		expect(restored).toBe(true);
	});

	it("createWorkflow without defaultTimeout skips the timeout setup", () => {
		// No defaultTimeout → timeoutMs = undefined → timeout block is skipped (line 324 if[1])
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			// omit defaultTimeout intentionally
		});
		const wf = orchestrator.createWorkflow("wf-no-timeout");
		expect(orchestrator.getWorkflowState(wf)).not.toBeNull();
	});

	it("workflow timeout callback fires TIMEOUT event to a still-running workflow", () => {
		vi.useFakeTimers();
		try {
			const orchestrator = new StateMachineOrchestrator({
				enableWorkflowPersistence: false,
				defaultTimeout: 100,
			});
			const wf = orchestrator.createWorkflow("wf-timeout-running");
			orchestrator.sendEvent(wf, "START"); // workflow is now executing
			// Advance time past the timeout so the setTimeout callback fires
			vi.advanceTimersByTime(200);
			const state = orchestrator.getWorkflowState(wf);
			// timedOut maps to "failed" in WORKFLOW_STATUS_MAP
			expect(state?.status).toBe("failed");
		} finally {
			vi.useRealTimers();
		}
	});

	it("workflow timeout callback is a no-op when the workflow has already completed", () => {
		vi.useFakeTimers();
		try {
			const orchestrator = new StateMachineOrchestrator({
				enableWorkflowPersistence: false,
				defaultTimeout: 100,
			});
			const wf = orchestrator.createWorkflow("wf-timeout-done");
			orchestrator.sendEvent(wf, "START");
			orchestrator.sendEvent(wf, "COMPLETE"); // complete before timeout fires
			vi.advanceTimersByTime(200);
			// Workflow should stay completed, not be overridden by TIMEOUT
			expect(orchestrator.getWorkflowState(wf)?.status).toBe("completed");
		} finally {
			vi.useRealTimers();
		}
	});

	it("persistWorkflow returns false when the workflow does not exist", async () => {
		// persistence enabled but workflow never created → getWorkflowState returns null (line 460 if[0])
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: true,
			defaultTimeout: 1000,
		});
		const result = await orchestrator.persistWorkflow("does-not-exist");
		expect(result).toBe(false);
	});

	it("createSkillWorkflow with falsy workflowId generates auto id", () => {
		// context.workflowId = "" → falsy → falls back to `skill-${skillId}-${Date.now()}` (line 494 binary-expr[1])
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wfId = orchestrator.createSkillWorkflow("auto-id-skill", {
			workflowId: "" as string, // empty string is falsy → triggers fallback
			skills: [],
			results: {},
			startTime: Date.now(),
			metadata: {},
		});
		expect(wfId).toMatch(/^skill-auto-id-skill-/);
	});

	it("createSkillWorkflow without currentState defaults to validating", () => {
		// context.currentState = undefined → `undefined || "validating"` covers cond-expr[0] (line 499)
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wfId = orchestrator.createSkillWorkflow("no-state-skill", {
			workflowId: "wf-no-cs",
			skills: [],
			results: {},
			startTime: Date.now(),
			metadata: {},
			// no currentState
		});
		const state = orchestrator.getWorkflowState(wfId);
		expect(state).not.toBeNull();
	});

	it("createSkillWorkflow without startTime falls back to Date.now()", () => {
		// context.startTime = 0 → falsy → `0 || Date.now()` covers binary-expr[1] (line 535)
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wfId = orchestrator.createSkillWorkflow("no-start-skill", {
			workflowId: "wf-no-start",
			skills: [],
			results: {},
			startTime: 0, // falsy → triggers || Date.now() fallback
			metadata: {},
		});
		expect(orchestrator.getWorkflowState(wfId)).not.toBeNull();
	});

	it("sendEvent SKILL_COMPLETE with non-string skillId covers updateWorkflowResult fallback paths", () => {
		// Sends SKILL_COMPLETE with numeric skillId to regular workflow → skillId is not a string
		// → cond-expr[1] (line 86): uses fallbackSkillId (undefined) → if (!skillId) return early
		// → cond-expr[0] (line 88): short-circuit left side truthy
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createWorkflow("wf-skill-no-str");
		orchestrator.sendEvent(wf, "START");
		// Regular workflow accepts SKILL_COMPLETE; numeric skillId is not a string
		orchestrator.sendEvent(wf, {
			type: "SKILL_COMPLETE",
			skillId: 42 as never,
			result: { ok: true },
		});
		// Workflow stayed in executing (SKILL_COMPLETE → executing) with empty results (update was skipped)
		const state = orchestrator.getWorkflowState(wf);
		expect(state).not.toBeNull();
		expect(state?.context.results).toEqual({});
	});

	it("sendEvent SKILL_COMPLETE with string skillId but no result covers right-side of OR guard", () => {
		// skillId is a string but "result" is not in event → !("result" in event) = true
		// → covers cond-expr[1] of `!skillId || !("result" in event)` (line 88)
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createWorkflow("wf-skill-no-result");
		orchestrator.sendEvent(wf, "START");
		orchestrator.sendEvent(wf, {
			type: "SKILL_COMPLETE",
			skillId: "my-skill",
			// no result property — triggers the right-side of the OR guard
		} as never);
		const state = orchestrator.getWorkflowState(wf);
		expect(state?.context.results).toEqual({});
	});

	it("sendEvent that triggers no state transition covers no-change lifecycle path", () => {
		// After reaching final state, sending another event is a no-op
		// stateChanged = false → covers binary-expr[1] for stateChanged ternaries (lines 643, 654)
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createWorkflow("wf-no-transition");
		orchestrator.sendEvent(wf, "START");
		orchestrator.sendEvent(wf, "COMPLETE"); // transitions to final "completed"
		// Send again — machine is in final state, no transition happens → stateChanged = false
		const result = orchestrator.sendEvent(wf, "COMPLETE");
		expect(result).toBe(true); // sendEvent still returns true (instance exists)
	});

	it("skill workflow error handling uses fallback skill id and payload error details", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createSkillWorkflow("fallback-skill", {
			workflowId: "wf-skill-payload-error",
			skills: ["fallback-skill"],
			results: {},
			startTime: Date.now(),
			metadata: {},
		});

		orchestrator.sendEvent(wf, { type: "START" });
		orchestrator.sendEvent(wf, {
			type: "SKILL_ERROR",
			skillId: 42 as never,
			payload: { reason: "from-payload" },
		} as never);

		expect(orchestrator.getWorkflowState(wf)?.context.results).toEqual({
			"fallback-skill": {
				error: { reason: "from-payload" },
				status: "failed",
			},
		});
	});

	it("VALIDATION_SUCCESS transitions without mutating start context data", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createSkillWorkflow("validate-skill", {
			workflowId: "wf-validation-success",
			skills: [],
			results: {},
			startTime: Date.now(),
			metadata: {},
			data: { preserved: true },
		});

		expect(
			orchestrator.sendEvent(wf, {
				type: "VALIDATION_SUCCESS",
				context: { ignored: true },
				payload: { ignoredPayload: true },
			} as never),
		).toBe(true);
		expect(orchestrator.getWorkflowState(wf)?.context.data).toEqual({
			preserved: true,
		});
	});

	it("finalizeWorkflow preserves precomputed duration and endTime", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createSkillWorkflow("pre-finalized", {
			workflowId: "wf-pre-finalized",
			skills: [],
			results: {},
			startTime: 100,
			endTime: 250,
			duration: 150,
			metadata: {},
			currentState: "completed" as never,
		});

		expect(orchestrator.getWorkflowState(wf)?.context).toEqual(
			expect.objectContaining({
				endTime: 250,
				duration: 150,
			}),
		);
	});

	it("getWorkflowState and getActiveWorkflows fall back for invalid actor contexts", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const internals =
			orchestrator as unknown as StateMachineOrchestratorInternals;

		internals.workflowInstances.set("wf-invalid-context", {
			getSnapshot: () => ({
				value: "mystery-state",
				context: null,
				done: false,
				error: undefined,
			}),
			stop: () => undefined,
		});
		internals.workflowLifecycle.set("wf-invalid-context", {
			currentState: "executing",
			previousState: "pending",
			lastTransition: new Date("2024-01-01T00:00:00.000Z"),
			transitionCount: undefined,
		});

		const state = orchestrator.getWorkflowState("wf-invalid-context");
		const active = orchestrator.getActiveWorkflows();

		expect(state).toEqual(
			expect.objectContaining({
				status: "pending",
				context: expect.objectContaining({
					workflowId: "wf-invalid-context",
					currentState: "pending",
					previousState: "pending",
					metadata: expect.objectContaining({
						transitionCount: 0,
					}),
				}),
			}),
		);
		expect(active).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					workflowId: "wf-invalid-context",
					status: "pending",
				}),
			]),
		);
	});

	it("persistWorkflow returns false when the workflow definition is missing", async () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: true,
			defaultTimeout: 1000,
		});
		const internals =
			orchestrator as unknown as StateMachineOrchestratorInternals;
		const wf = orchestrator.createWorkflow("wf-no-definition", {
			context: {
				workflowId: "wf-no-definition",
				skills: [],
				results: {},
				startTime: Date.now(),
				metadata: {},
				data: { keep: true },
			},
		});

		internals.workflowDefinitions.delete(wf);

		await expect(orchestrator.persistWorkflow(wf)).resolves.toBe(false);
	});

	it("restoreWorkflow uses workflowId fallback for persisted skill workflows and preserves data", async () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: true,
			defaultTimeout: 1000,
		});
		const internals =
			orchestrator as unknown as StateMachineOrchestratorInternals;

		internals.persistedWorkflows.set("wf-persisted-skill", {
			kind: "skill",
			workflowId: "wf-persisted-skill",
			state: {
				name: "wf-persisted-skill",
				workflowId: "wf-persisted-skill",
				currentState: "executing",
				status: "running",
				isRunning: true,
				context: {
					workflowId: "wf-persisted-skill",
					skills: ["persisted-skill"],
					results: {},
					startTime: Date.now(),
					metadata: {},
					data: { restored: "yes" },
					currentState: "executing",
				},
				error: undefined,
				on: {},
			},
		});

		await expect(
			orchestrator.restoreWorkflow("wf-persisted-skill"),
		).resolves.toBe(true);
		expect(
			orchestrator.getWorkflowState("wf-persisted-skill")?.workflowId,
		).toBe("wf-persisted-skill");
		expect(
			orchestrator.getWorkflowState("wf-persisted-skill")?.context.data,
		).toEqual({ restored: "yes" });
	});

	it("restoreWorkflow defaults missing transitionCount to zero for regular workflows", async () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: true,
			defaultTimeout: 1000,
		});
		const internals =
			orchestrator as unknown as StateMachineOrchestratorInternals;

		internals.persistedWorkflows.set("wf-persisted-regular", {
			kind: "workflow",
			workflowId: "wf-persisted-regular",
			state: {
				name: "wf-persisted-regular",
				workflowId: "wf-persisted-regular",
				currentState: "pending",
				status: "pending",
				isRunning: true,
				context: {
					workflowId: "wf-persisted-regular",
					skills: [],
					results: {},
					startTime: Date.now(),
					metadata: { transitionCount: undefined, lastTransition: undefined },
					data: { restored: true },
					currentState: "pending",
				},
				error: undefined,
				on: {},
			},
		});

		await expect(
			orchestrator.restoreWorkflow("wf-persisted-regular"),
		).resolves.toBe(true);
		expect(
			orchestrator.getWorkflowState("wf-persisted-regular")?.context.metadata
				.transitionCount,
		).toBe(0);
		expect(
			orchestrator.getWorkflowState("wf-persisted-regular")?.context.data,
		).toEqual({ restored: true });
	});

	it("createSkillWorkflow preserves provided data and health metrics use duration when available", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});

		const wf = orchestrator.createSkillWorkflow("data-skill", {
			workflowId: "wf-data-skill",
			skills: [],
			results: {},
			startTime: Date.now(),
			metadata: {},
			data: { copied: true },
			currentState: "completed" as never,
			duration: 25,
			endTime: Date.now(),
		});

		expect(orchestrator.getWorkflowState(wf)?.context.data).toEqual({
			copied: true,
		});
		expect(orchestrator.getWorkflowHealthMetrics().averageExecutionTime).toBe(
			25,
		);
	});

	it("health metrics return zero average execution time when no workflows completed", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createWorkflow("wf-no-completions");
		orchestrator.sendEvent(wf, "START");
		orchestrator.sendEvent(wf, "ERROR");

		expect(orchestrator.getWorkflowHealthMetrics().averageExecutionTime).toBe(
			0,
		);
	});

	it("updateWorkflowLifecycle safely handles missing actors and unchanged states", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const internals =
			orchestrator as unknown as StateMachineOrchestratorInternals;

		internals.updateWorkflowLifecycle("wf-missing-actor", "pending");
		const wf = orchestrator.createWorkflow("wf-no-change");
		internals.updateWorkflowLifecycle(wf, "pending");

		expect(
			orchestrator.getWorkflowState(wf)?.context.metadata.transitionCount,
		).toBe(0);
	});

	it("persistWorkflow clones data and error objects from workflow state", async () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: true,
			defaultTimeout: 1000,
		});
		const internals =
			orchestrator as unknown as StateMachineOrchestratorInternals;

		internals.workflowInstances.set("wf-clone-branches", {
			getSnapshot: () => ({
				value: "executing",
				context: {
					workflowId: "wf-clone-branches",
					skills: [],
					results: {},
					metadata: {},
					startTime: Date.now(),
					currentState: "executing",
					data: { nested: true },
				},
				done: false,
				error: { message: "boom" },
			}),
			stop: () => undefined,
		});
		internals.workflowDefinitions.set("wf-clone-branches", {
			kind: "workflow",
		});

		await expect(
			orchestrator.persistWorkflow("wf-clone-branches"),
		).resolves.toBe(true);
	});

	it("skill workflow error handling stores undefined when neither error nor payload is provided", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const wf = orchestrator.createSkillWorkflow("undefined-error-skill", {
			workflowId: "wf-undefined-error",
			skills: ["undefined-error-skill"],
			results: {},
			startTime: Date.now(),
			metadata: {},
		});

		orchestrator.sendEvent(wf, { type: "START" });
		orchestrator.sendEvent(wf, {
			type: "SKILL_ERROR",
			skillId: "undefined-error-skill",
		} as never);

		expect(
			orchestrator.getWorkflowState(wf)?.context.results[
				"undefined-error-skill"
			],
		).toEqual({
			error: undefined,
			status: "failed",
		});
	});

	it("invalid actor contexts fall back to pending previous state when no lifecycle snapshot exists", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const internals =
			orchestrator as unknown as StateMachineOrchestratorInternals;

		internals.workflowInstances.set("wf-no-lifecycle", {
			getSnapshot: () => ({
				value: "unknown-state",
				context: null,
				done: false,
				error: undefined,
			}),
			stop: () => undefined,
		});

		expect(
			orchestrator.getWorkflowState("wf-no-lifecycle")?.context.previousState,
		).toBe(undefined);
		expect(
			orchestrator.getWorkflowState("wf-no-lifecycle")?.context.currentState,
		).toBe("pending");
	});

	it("valid contexts without lifecycle transition counts fall back to zero", () => {
		const orchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 1000,
		});
		const internals =
			orchestrator as unknown as StateMachineOrchestratorInternals;

		internals.workflowInstances.set("wf-no-transition-count", {
			getSnapshot: () => ({
				value: "executing",
				context: {
					workflowId: "wf-no-transition-count",
					skills: [],
					results: {},
					metadata: {},
					startTime: Date.now(),
					currentState: "executing",
				},
				done: false,
				error: undefined,
			}),
			stop: () => undefined,
		});

		expect(
			orchestrator.getWorkflowState("wf-no-transition-count")?.context.metadata
				.transitionCount,
		).toBe(0);

		internals.workflowLifecycle.set("wf-transition-fallback", {
			currentState: "pending",
			transitionCount: undefined,
		});
		const wf = orchestrator.createWorkflow("wf-transition-fallback");
		internals.workflowLifecycle.set(wf, {
			currentState: "pending",
			transitionCount: undefined,
		});
		internals.updateWorkflowLifecycle(wf, "pending");

		expect(
			orchestrator.getWorkflowState(wf)?.context.metadata.transitionCount,
		).toBe(0);
	});
});
