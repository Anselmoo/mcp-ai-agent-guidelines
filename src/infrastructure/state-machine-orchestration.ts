/**
 * XState-based workflow orchestration and state machine management
 * Simplified implementation compatible with XState v5
 */

import { type AnyActor, createActor, createMachine } from "xstate";
import type {
	StateMachineConfig,
	StateMachineContext,
	WorkflowEvent,
	WorkflowMachineState,
	WorkflowState,
} from "../contracts/graph-types.js";
import {
	isStateMachineContext,
	normalizeWorkflowMachineState,
} from "../contracts/graph-types.js";
import { createOperationalLogger } from "./observability.js";
import {
	getWorkflowErrorMessage,
	getWorkflowErrorType,
	toWorkflowError,
} from "./workflow-error-utilities.js";

const WORKFLOW_STATUS_MAP: Record<
	string,
	"pending" | "running" | "completed" | "failed" | "paused"
> = {
	pending: "pending",
	validating: "running",
	executing: "running",
	completed: "completed",
	failed: "failed",
	paused: "paused",
	cancelled: "failed",
	timedOut: "failed",
};
const stateMachineLogger = createOperationalLogger("error");

interface PersistedWorkflowRecord {
	kind: "workflow" | "skill";
	workflowId: string;
	skillId?: string;
	state: WorkflowState;
}

interface WorkflowLifecycleSnapshot {
	currentState: WorkflowMachineState;
	previousState?: WorkflowMachineState;
	lastTransition?: Date;
	transitionCount: number;
}

function cloneWorkflowState(state: WorkflowState): WorkflowState {
	return {
		...state,
		context: {
			...state.context,
			data: state.context.data ? { ...state.context.data } : undefined,
			metadata: { ...state.context.metadata },
			results: { ...state.context.results },
			skills: [...state.context.skills],
		},
		error: state.error ? { ...state.error } : undefined,
		on: { ...state.on },
	};
}

function updateWorkflowErrorResult(
	context: StateMachineContext,
	event: WorkflowEvent | undefined,
	fallbackSkillId?: string,
): void {
	if (!event || event.type !== "SKILL_ERROR") {
		return;
	}

	const skillId =
		typeof event.skillId === "string" ? event.skillId : fallbackSkillId;
	if (!skillId) {
		return;
	}

	context.results[skillId] = {
		error:
			"error" in event
				? event.error
				: "payload" in event
					? event.payload
					: undefined,
		status: "failed",
	};
}

function updateWorkflowStartContext(
	context: StateMachineContext,
	event: WorkflowEvent | undefined,
): void {
	if (!event || event.type !== "START") {
		return;
	}

	const eventContext =
		"context" in event && event.context && typeof event.context === "object"
			? (event.context as Record<string, unknown>)
			: undefined;
	const payload =
		"payload" in event && event.payload && typeof event.payload === "object"
			? (event.payload as Record<string, unknown>)
			: undefined;
	const mergedData = {
		...(context.data ?? {}),
		...(payload ?? {}),
		...(eventContext ?? {}),
	};

	if (Object.keys(mergedData).length > 0) {
		context.data = mergedData;
	}
}

function finalizeWorkflowContext(context: StateMachineContext): void {
	if (context.endTime !== undefined && context.duration !== undefined) {
		return;
	}

	context.endTime = Date.now();
	context.duration = context.endTime - context.startTime;
}

function buildFallbackContext(
	workflowId: string,
	lifecycle?: WorkflowLifecycleSnapshot,
	startTime = Date.now(),
): StateMachineContext {
	return {
		workflowId,
		skills: [],
		results: {},
		metadata: {
			lastTransition: lifecycle?.lastTransition,
			transitionCount: lifecycle?.transitionCount ?? 0,
		},
		startTime,
		currentState: lifecycle?.currentState ?? "pending",
		previousState: lifecycle?.previousState,
	};
}

function withLifecycleContext(
	workflowId: string,
	rawContext: unknown,
	currentState: WorkflowMachineState,
	lifecycle?: WorkflowLifecycleSnapshot,
): StateMachineContext {
	const baseContext = isStateMachineContext(rawContext)
		? rawContext
		: buildFallbackContext(workflowId, lifecycle);

	return {
		...baseContext,
		skills: [...baseContext.skills],
		results: { ...baseContext.results },
		data: baseContext.data ? { ...baseContext.data } : undefined,
		metadata: {
			...baseContext.metadata,
			lastTransition:
				lifecycle?.lastTransition ?? baseContext.metadata.lastTransition,
			transitionCount:
				lifecycle?.transitionCount ?? baseContext.metadata.transitionCount ?? 0,
		},
		currentState,
		previousState: lifecycle?.previousState ?? baseContext.previousState,
	};
}

function updateWorkflowResult(
	context: StateMachineContext,
	event: WorkflowEvent | undefined,
	fallbackSkillId?: string,
): void {
	if (!event || event.type !== "SKILL_COMPLETE") {
		return;
	}

	const skillId =
		typeof event.skillId === "string" ? event.skillId : fallbackSkillId;
	if (!skillId || !("result" in event)) {
		return;
	}

	context.results[skillId] = event.result;
}

function logStateMachineError(
	message: string,
	workflowId: string,
	error: unknown,
): void {
	stateMachineLogger.log("error", message, {
		workflowId,
		errorType: getWorkflowErrorType(error),
		error: getWorkflowErrorMessage(error),
	});
}

/**
 * Workflow state machine orchestrator using XState v5
 */
export class StateMachineOrchestrator {
	private workflowInstances: Map<string, AnyActor> = new Map();
	private persistedWorkflows: Map<string, PersistedWorkflowRecord> = new Map();
	private workflowDefinitions: Map<
		string,
		{ kind: "workflow" | "skill"; skillId?: string }
	> = new Map();
	private workflowLifecycle: Map<string, WorkflowLifecycleSnapshot> = new Map();
	private config: StateMachineConfig;

	constructor(config: StateMachineConfig) {
		this.config = config;
	}

	/**
	 * Create and start a new workflow state machine
	 */
	createWorkflow(
		workflowId: string,
		config: {
			initialState?: string;
			context?: StateMachineContext;
			timeout?: number;
		} = {},
	): string {
		const initialState = normalizeWorkflowMachineState(
			config.initialState || "pending",
		);
		const machine = createMachine(
			{
				id: workflowId,
				initial: initialState,
				context: {
					workflowId,
					skills: [],
					results: {},
					metadata: config.context?.metadata
						? { ...config.context.metadata }
						: {},
					currentState: initialState,
					startTime: Date.now(),
					...config.context,
				},
				states: {
					pending: {
						on: {
							START: {
								actions: "captureStartContext",
								target: "executing",
							},
							CANCEL: "cancelled",
						},
					},
					executing: {
						on: {
							SKILL_COMPLETE: {
								actions: "updateResults",
								target: "executing",
							},
							COMPLETE: "completed",
							ERROR: "failed",
							TIMEOUT: "timedOut",
						},
					},
					completed: {
						type: "final",
						entry: "finalizeWorkflow",
					},
					failed: {
						entry: ["captureWorkflowError", "finalizeWorkflow"],
						on: {
							RETRY: "executing",
							CANCEL: "cancelled",
						},
					},
					cancelled: {
						type: "final",
						entry: "finalizeWorkflow",
					},
					timedOut: {
						entry: "finalizeWorkflow",
						on: {
							RETRY: "executing",
							CANCEL: "cancelled",
						},
					},
				},
			},
			{
				actions: {
					captureStartContext: ({ context, event }) => {
						updateWorkflowStartContext(context, event);
					},
					updateResults: ({ context, event }) => {
						updateWorkflowResult(context, event);
					},
					captureWorkflowError: ({ context, event }) => {
						updateWorkflowErrorResult(context, event);
					},
					finalizeWorkflow: ({ context }) => {
						finalizeWorkflowContext(context);
					},
				},
			},
		);

		const actor = createActor(machine);
		actor.start();

		this.workflowInstances.set(workflowId, actor);
		this.workflowDefinitions.set(workflowId, { kind: "workflow" });
		this.initializeWorkflowLifecycle(workflowId, initialState);

		const timeoutMs = config.timeout ?? this.config.defaultTimeout;
		if (timeoutMs !== undefined) {
			setTimeout(() => {
				const currentState = normalizeWorkflowMachineState(
					actor.getSnapshot().value,
				);
				if (
					this.workflowInstances.has(workflowId) &&
					!["completed", "failed", "cancelled", "timedOut"].includes(
						currentState,
					)
				) {
					this.sendEvent(workflowId, { type: "TIMEOUT" });
				}
			}, timeoutMs);
		}

		return workflowId;
	}

	/**
	 * Send event to workflow state machine (accepts string or WorkflowEvent)
	 */
	sendEvent(workflowId: string, event: string | WorkflowEvent): boolean {
		const instance = this.workflowInstances.get(workflowId);
		if (!instance) return false;

		try {
			const previousState = normalizeWorkflowMachineState(
				instance.getSnapshot().value,
			);
			// Handle both string and object events for backward compatibility
			const eventObject = typeof event === "string" ? { type: event } : event;
			if (
				typeof eventObject !== "object" ||
				eventObject === null ||
				typeof eventObject.type !== "string" ||
				eventObject.type.length === 0
			) {
				logStateMachineError(
					"Error sending event to workflow",
					workflowId,
					new Error("Workflow event type must be a non-empty string"),
				);
				return false;
			}

			instance.send(eventObject);
			this.updateWorkflowLifecycle(workflowId, previousState);
			return true;
		} catch (error) {
			logStateMachineError(
				"Error sending event to workflow",
				workflowId,
				error,
			);
			return false;
		}
	}

	/**
	 * Get current workflow state with proper status mapping
	 */
	getWorkflowState(workflowId: string): WorkflowState | null {
		const instance = this.workflowInstances.get(workflowId);
		if (!instance) return null;

		const snapshot = instance.getSnapshot();
		const currentState = normalizeWorkflowMachineState(snapshot.value);
		const context = withLifecycleContext(
			workflowId,
			snapshot.context,
			currentState,
			this.workflowLifecycle.get(workflowId),
		);

		return {
			name: workflowId,
			workflowId,
			currentState,
			status: WORKFLOW_STATUS_MAP[currentState] || "pending",
			context,
			isRunning: !snapshot.done,
			error: toWorkflowError(snapshot.error),
			on: {},
		};
	}

	/**
	 * Stop and cleanup workflow
	 */
	stopWorkflow(workflowId: string): void {
		const instance = this.workflowInstances.get(workflowId);
		if (instance) {
			instance.stop();
			this.workflowInstances.delete(workflowId);
		}
	}

	/**
	 * Get all active workflows with proper status mapping
	 */
	getActiveWorkflows(): WorkflowState[] {
		const states: WorkflowState[] = [];

		for (const [workflowId, instance] of this.workflowInstances) {
			const snapshot = instance.getSnapshot();
			const currentState = normalizeWorkflowMachineState(snapshot.value);
			const context = withLifecycleContext(
				workflowId,
				snapshot.context,
				currentState,
				this.workflowLifecycle.get(workflowId),
			);

			states.push({
				name: workflowId,
				workflowId,
				currentState,
				status: WORKFLOW_STATUS_MAP[currentState] || "pending",
				context,
				isRunning: !snapshot.done,
				error: toWorkflowError(snapshot.error),
				on: {},
			});
		}

		return states;
	}

	/**
	 * Persist workflow state (simplified implementation)
	 */
	async persistWorkflow(workflowId: string): Promise<boolean> {
		if (!this.config.enableWorkflowPersistence) return false;

		const state = this.getWorkflowState(workflowId);
		if (!state) return false;

		try {
			const definition = this.workflowDefinitions.get(workflowId);
			if (!definition) {
				return false;
			}

			this.persistedWorkflows.set(workflowId, {
				...definition,
				workflowId,
				state: cloneWorkflowState(state),
			});
			return true;
		} catch (error) {
			logStateMachineError("Failed to persist workflow", workflowId, error);
			return false;
		}
	}

	/**
	 * Restore workflow from persisted state (simplified implementation)
	 */
	async restoreWorkflow(workflowId: string): Promise<boolean> {
		if (!this.config.enableWorkflowPersistence) return false;

		try {
			const persisted = this.persistedWorkflows.get(workflowId);
			if (!persisted) {
				return false;
			}

			this.stopWorkflow(workflowId);
			if (persisted.kind === "skill") {
				this.createSkillWorkflow(persisted.skillId ?? workflowId, {
					...persisted.state.context,
					metadata: { ...persisted.state.context.metadata },
					results: { ...persisted.state.context.results },
					skills: [...persisted.state.context.skills],
					data: persisted.state.context.data
						? { ...persisted.state.context.data }
						: undefined,
				});
			} else {
				this.createWorkflow(workflowId, {
					initialState: persisted.state.currentState,
					context: {
						...persisted.state.context,
						metadata: { ...persisted.state.context.metadata },
						results: { ...persisted.state.context.results },
						skills: [...persisted.state.context.skills],
						data: persisted.state.context.data
							? { ...persisted.state.context.data }
							: undefined,
					},
				});
			}

			this.workflowLifecycle.set(workflowId, {
				currentState: persisted.state.currentState,
				previousState: persisted.state.context.previousState,
				lastTransition: persisted.state.context.metadata.lastTransition,
				transitionCount: persisted.state.context.metadata.transitionCount ?? 0,
			});
			return true;
		} catch (error) {
			logStateMachineError("Failed to restore workflow", workflowId, error);
			return false;
		}
	}

	/**
	 * Create a skill execution workflow
	 */
	createSkillWorkflow(skillId: string, context: StateMachineContext): string {
		const workflowId = context.workflowId || `skill-${skillId}-${Date.now()}`;
		const initialState = normalizeWorkflowMachineState(
			context.currentState || "validating",
		);

		const machine = createMachine(
			{
				id: workflowId,
				initial: initialState,
				context: {
					...context,
					data: context.data ? { ...context.data } : undefined,
					metadata: { ...context.metadata },
					currentState: initialState,
					workflowId,
					skillId,
					startTime: context.startTime || Date.now(),
				},
				states: {
					validating: {
						on: {
							START: {
								actions: "captureStartContext",
								target: "executing",
							},
							VALIDATION_SUCCESS: {
								actions: "captureStartContext",
								target: "executing",
							},
							VALIDATION_FAILED: "failed",
						},
					},
					executing: {
						on: {
							SKILL_COMPLETE: {
								actions: "updateSkillResult",
								target: "completed",
							},
							COMPLETE: "completed",
							SKILL_ERROR: "failed",
							ERROR: "failed",
						},
					},
					completed: {
						type: "final",
						entry: "recordSuccess",
					},
					failed: {
						entry: ["captureWorkflowError", "recordSuccess"],
						on: {
							RETRY: "validating",
						},
					},
				},
			},
			{
				actions: {
					captureStartContext: ({ context, event }) => {
						updateWorkflowStartContext(context, event);
					},
					updateSkillResult: ({ context, event }) => {
						updateWorkflowResult(context, event, skillId);
					},
					captureWorkflowError: ({ context, event }) => {
						updateWorkflowErrorResult(context, event, skillId);
					},
					recordSuccess: ({ context }) => {
						finalizeWorkflowContext(context);
					},
				},
			},
		);

		const actor = createActor(machine);
		actor.start();

		this.workflowInstances.set(workflowId, actor);
		this.workflowDefinitions.set(workflowId, { kind: "skill", skillId });
		this.initializeWorkflowLifecycle(workflowId, initialState);
		return workflowId;
	}

	/**
	 * Monitor workflow health and performance
	 */
	getWorkflowHealthMetrics(): {
		totalWorkflows: number;
		activeWorkflows: number;
		completedWorkflows: number;
		failedWorkflows: number;
		averageExecutionTime: number;
	} {
		const workflows = this.getActiveWorkflows();
		const totalWorkflows = workflows.length;

		let completedCount = 0;
		let failedCount = 0;
		let totalExecutionTime = 0;
		let activeCount = 0;

		for (const workflow of workflows) {
			if (workflow.status === "completed") {
				completedCount++;
				if (workflow.context.duration) {
					totalExecutionTime += workflow.context.duration;
				}
			} else if (workflow.status === "failed") {
				failedCount++;
			} else if (workflow.isRunning) {
				activeCount++;
			}
		}

		return {
			totalWorkflows,
			activeWorkflows: activeCount,
			completedWorkflows: completedCount,
			failedWorkflows: failedCount,
			averageExecutionTime:
				completedCount > 0 ? totalExecutionTime / completedCount : 0,
		};
	}

	private initializeWorkflowLifecycle(
		workflowId: string,
		initialState: WorkflowMachineState,
	): void {
		this.workflowLifecycle.set(workflowId, {
			currentState: initialState,
			transitionCount: 0,
		});
	}

	private updateWorkflowLifecycle(
		workflowId: string,
		previousState: WorkflowMachineState,
	): void {
		const instance = this.workflowInstances.get(workflowId);
		if (!instance) {
			return;
		}

		const currentState = normalizeWorkflowMachineState(
			instance.getSnapshot().value,
		);
		const existing = this.workflowLifecycle.get(workflowId);
		const stateChanged = currentState !== previousState;
		this.workflowLifecycle.set(workflowId, {
			currentState,
			previousState: stateChanged ? previousState : existing?.previousState,
			lastTransition: stateChanged ? new Date() : existing?.lastTransition,
			transitionCount:
				(existing?.transitionCount ?? 0) + (stateChanged ? 1 : 0),
		});
	}
}

/**
 * Factory for creating state machine orchestrators
 */
export class StateMachineOrchestratorFactory {
	/**
	 * Factory method with required configuration
	 */
	static create(config: StateMachineConfig): StateMachineOrchestrator {
		return new StateMachineOrchestrator(config);
	}

	/**
	 * Factory method with default configuration for convenience
	 */
	static createWithDefaults(): StateMachineOrchestrator {
		return new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
			defaultTimeout: 30000,
		});
	}
}
