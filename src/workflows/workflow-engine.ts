import { createHash } from "node:crypto";
import type { WorkflowStep } from "../contracts/generated.js";
import type {
	ExecutionProgressRecord,
	InstructionInput,
	InstructionModule,
	RecommendationItem,
	SkillArtifact,
	StepExecutionRecord,
	WorkflowExecutionResult,
	WorkflowExecutionRuntime,
} from "../contracts/runtime.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { sortRecommendationsByGrounding } from "../skills/shared/recommendations.js";
import {
	type ParallelRunnerOptions,
	runParallelSteps,
} from "./parallel-runner.js";
import type { SerialRunnerOptions } from "./serial-runner.js";
import { runSerialSteps } from "./serial-runner.js";
import {
	type CheckpointManager,
	createInitialCheckpoint,
	resolveResumeIndex,
	type WorkflowCheckpoint,
} from "./workflow-checkpoint.js";
import type { RetryConfig } from "./workflow-retry.js";
import {
	assertWorkflowExecutionMatchesSpec,
	assertWorkflowInputMatchesSpec,
	resolveAuthoritativeWorkflowRuntime,
} from "./workflow-state-validator.js";
import {
	type WorkflowTelemetry,
	WorkflowTelemetryCollector,
} from "./workflow-telemetry.js";

// ─── Engine configuration ─────────────────────────────────────────────────────

export interface WorkflowEngineOptions {
	/**
	 * Default per-step timeout in milliseconds.
	 * Applied to all invokeSkill and invokeInstruction steps.
	 * Disabled (no timeout) when ≤ 0 or undefined.
	 */
	defaultStepTimeoutMs?: number;
	/**
	 * Default retry configuration for transient step failures.
	 * When undefined, no retries are attempted.
	 */
	defaultRetryConfig?: RetryConfig;
	/**
	 * Maximum recursion depth for self-calling instructions.
	 * Prevents runaway recursive instruction chains.
	 * Default 8.
	 */
	maxSelfCallDepth?: number;
	/**
	 * When true, the engine saves a checkpoint after each successfully
	 * completed step so interrupted workflows can resume.
	 * Requires `checkpointManager` to be set.
	 * Default false.
	 */
	enableCheckpointing?: boolean;
	/**
	 * Optional checkpoint manager. Required when `enableCheckpointing` is true.
	 */
	checkpointManager?: CheckpointManager;
	/**
	 * When true, the engine collects per-step telemetry and attaches a
	 * `telemetry` object to the `WorkflowExecutionResult`.
	 * Default false.
	 */
	enableTelemetry?: boolean;
}

// ─── Extended result type ─────────────────────────────────────────────────────

export interface WorkflowExecutionResultWithTelemetry
	extends WorkflowExecutionResult {
	telemetry?: WorkflowTelemetry;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectRecommendations(
	steps: StepExecutionRecord[],
): RecommendationItem[] {
	return sortRecommendationsByGrounding(
		steps.flatMap((step) => [
			...(step.skillResult?.recommendations ?? []),
			...(step.children ? collectRecommendations(step.children) : []),
		]),
	);
}

function collectArtifacts(steps: StepExecutionRecord[]): SkillArtifact[] {
	return steps.flatMap((step) => [
		...(step.skillResult?.artifacts ?? []),
		// When step.artifacts is set (invokeInstruction with pre-aggregated
		// artifacts), use it directly instead of recursing into children to
		// avoid double-counting (the pre-aggregated set already represents
		// the full artifact list for that subtree).
		...(step.artifacts
			? step.artifacts
			: step.children
				? collectArtifacts(step.children)
				: []),
	]);
}

/**
 * Compute a short deterministic hash of the workflow input for checkpoint
 * cache-invalidation. Non-fatal: falls back to "unknown" when serialization
 * fails (e.g. circular references in input objects).
 */
function computeInputHash(input: InstructionInput): string {
	try {
		return createHash("sha256")
			.update(JSON.stringify(input))
			.digest("hex")
			.slice(0, 16);
	} catch {
		return "unknown";
	}
}

function recordProgress(
	runtime: WorkflowExecutionRuntime,
	record: ExecutionProgressRecord,
) {
	runtime.executionState.progressRecords.push(record);
	void runtime.sessionStore
		.appendSessionHistory(runtime.sessionId, record)
		.catch((error) => {
			console.warn(
				`Failed to append session history for ${runtime.sessionId}: ${toErrorMessage(error)}`,
			);
		});
}

function shouldRunGate(
	condition:
		| "always"
		| "hasContext"
		| "hasConstraints"
		| "hasDeliverable"
		| "hasPhysicsJustification",
	input: InstructionInput,
): boolean {
	switch (condition) {
		case "hasContext":
			return typeof input.context === "string" && input.context.length > 0;
		case "hasConstraints":
			return Array.isArray(input.constraints) && input.constraints.length > 0;
		case "hasDeliverable":
			return (
				typeof input.deliverable === "string" && input.deliverable.length > 0
			);
		case "hasPhysicsJustification":
			return (
				typeof input.physicsAnalysisJustification === "string" &&
				input.physicsAnalysisJustification.trim().length >= 20
			);
		default:
			throw new Error(`Unknown gate condition: "${condition}"`);
	}
}

/**
 * Count how many times the given instructionId appears in the call stack.
 * Used to detect recursive self-calls and enforce maxSelfCallDepth.
 */
function countInstructionDepth(
	stack: readonly string[],
	instructionId: string,
): number {
	return stack.filter((id) => id === instructionId).length;
}

// ─── WorkflowEngine ───────────────────────────────────────────────────────────

export class WorkflowEngine {
	private readonly defaultStepTimeoutMs: number;
	private readonly defaultRetryConfig?: RetryConfig;
	private readonly maxSelfCallDepth: number;
	private readonly enableCheckpointing: boolean;
	private readonly checkpointManager?: CheckpointManager;
	private readonly enableTelemetry: boolean;

	constructor(options: WorkflowEngineOptions = {}) {
		this.defaultStepTimeoutMs = options.defaultStepTimeoutMs ?? 0;
		this.defaultRetryConfig = options.defaultRetryConfig;
		this.maxSelfCallDepth = options.maxSelfCallDepth ?? 8;
		this.enableCheckpointing = options.enableCheckpointing ?? false;
		this.checkpointManager = options.checkpointManager;
		this.enableTelemetry = options.enableTelemetry ?? false;
	}

	async executeInstruction(
		instruction: InstructionModule,
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	): Promise<WorkflowExecutionResultWithTelemetry> {
		const authoritativeWorkflow = resolveAuthoritativeWorkflowRuntime(
			instruction.manifest,
		);
		const authoritativeSpec = authoritativeWorkflow?.spec;
		if (authoritativeSpec) {
			assertWorkflowInputMatchesSpec(authoritativeSpec, input);
		}

		const instructionStack = [...runtime.executionState.instructionStack];

		// ── Cycle / depth detection ───────────────────────────────────────────
		// Distinguish two patterns:
		//   1. Pure self-call:     A → A → A   (only A in the stack)
		//      Allowed up to maxSelfCallDepth; useful for iterative refinement.
		//   2. Cross-instruction:  A → B → A   (A appears in stack but non-A
		//      items also appear between the first A and the current call)
		//      Always considered a cycle and rejected.
		const occurrences = countInstructionDepth(
			instructionStack,
			instruction.manifest.id,
		);
		if (occurrences > 0) {
			// Check whether this is a true self-call (stack contains ONLY this
			// instruction ID, possibly multiple times) or a cross-instruction cycle.
			const hasOtherInstructions = instructionStack.some(
				(id) => id !== instruction.manifest.id,
			);

			if (hasOtherInstructions) {
				// A→B→A style cross-instruction cycle
				const firstOccurrence = instructionStack.indexOf(
					instruction.manifest.id,
				);
				const cyclePath = [
					...instructionStack.slice(firstOccurrence),
					instruction.manifest.id,
				];
				throw new Error(
					`Instruction cycle detected: ${cyclePath.join(" -> ")}`,
				);
			}

			// Pure self-call — enforce depth limit
			if (occurrences >= this.maxSelfCallDepth) {
				throw new Error(
					`Maximum self-call depth (${this.maxSelfCallDepth}) reached for instruction "${instruction.manifest.id}". ` +
						`Stack: ${[...instructionStack, instruction.manifest.id].join(" -> ")}`,
				);
			}
			// Otherwise allow it to proceed (intentional recursive call)
		}

		const model = runtime.modelRouter.chooseInstructionModel(
			instruction.manifest,
			input,
		);
		const nextRuntime: WorkflowExecutionRuntime = {
			...runtime,
			executionState: {
				...runtime.executionState,
				instructionStack: [...instructionStack, instruction.manifest.id],
			},
		};
		const workflowSteps =
			authoritativeWorkflow?.steps ?? instruction.manifest.workflow.steps;

		// ── Telemetry ─────────────────────────────────────────────────────────
		const telemetryCollector = this.enableTelemetry
			? new WorkflowTelemetryCollector(
					instruction.manifest.id,
					runtime.sessionId,
				)
			: null;

		// ── Checkpointing ─────────────────────────────────────────────────────
		const checkpointMgr =
			this.enableCheckpointing && this.checkpointManager
				? this.checkpointManager
				: null;

		let checkpoint: WorkflowCheckpoint | null = checkpointMgr
			? await checkpointMgr.load(instruction.manifest.id, runtime.sessionId)
			: null;

		const resumeFromIndex = resolveResumeIndex(checkpoint);
		if (resumeFromIndex > 0) {
			console.log(
				`[workflow] Resuming "${instruction.manifest.id}" from step ${resumeFromIndex} ` +
					`(${resumeFromIndex} step(s) already completed).`,
			);
		}

		// Initialise checkpoint for a fresh run
		if (!checkpoint && checkpointMgr) {
			checkpoint = createInitialCheckpoint(
				instruction.manifest.id,
				runtime.sessionId,
				{
					totalSteps: workflowSteps.length,
					inputHash: computeInputHash(input),
				},
			);
		}

		try {
			// ── Collect already-completed steps from checkpoint ──────────────
			const steps: StepExecutionRecord[] = checkpoint
				? [...checkpoint.completedSteps]
				: [];

			for (let i = 0; i < workflowSteps.length; i++) {
				const step = workflowSteps[i];
				if (!step) continue;

				// Skip steps that were completed before the crash
				if (i < resumeFromIndex) continue;

				const stepTimer = telemetryCollector?.startStep(step.label, step.kind);

				let stepRecord: StepExecutionRecord;
				try {
					stepRecord = await this.executeStep(step, input, nextRuntime);
					stepTimer?.finish(true, { attempts: 1 });
				} catch (error) {
					stepTimer?.finish(false, {
						attempts: 1,
						errorMessage: toErrorMessage(error),
					});
					throw error;
				}

				steps.push(stepRecord);
				recordProgress(nextRuntime, {
					stepLabel: stepRecord.label,
					kind: stepRecord.kind,
					summary: stepRecord.summary,
				});

				// Advance checkpoint after each successful step
				if (checkpointMgr && checkpoint) {
					checkpoint = await checkpointMgr.advance(checkpoint, stepRecord);
				}
			}

			const recommendations = collectRecommendations(steps);
			const artifacts = collectArtifacts(steps);

			const result: WorkflowExecutionResultWithTelemetry = {
				instructionId: instruction.manifest.id,
				displayName: instruction.manifest.displayName,
				request: input.request,
				model,
				steps,
				recommendations,
				...(artifacts.length > 0 ? { artifacts } : {}),
			};

			if (authoritativeSpec) {
				assertWorkflowExecutionMatchesSpec(authoritativeSpec, result.steps);
			}

			// Attach telemetry if enabled
			if (telemetryCollector) {
				result.telemetry = telemetryCollector.finalise();
			}

			// Clear checkpoint on clean completion
			if (checkpointMgr && checkpoint) {
				await checkpointMgr.clear(instruction.manifest.id, runtime.sessionId);
			}

			return result;
		} finally {
			await nextRuntime.sessionStore.writeSessionHistory(
				nextRuntime.sessionId,
				nextRuntime.executionState.progressRecords,
			);
		}
	}

	private async executeStep(
		step: WorkflowStep,
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	): Promise<StepExecutionRecord> {
		const timeoutMs = this.defaultStepTimeoutMs;
		const retryConfig = this.defaultRetryConfig;
		const runnerOptions: SerialRunnerOptions & ParallelRunnerOptions = {
			stepTimeoutMs: timeoutMs,
			retryConfig,
		};

		switch (step.kind) {
			case "serial":
				return runSerialSteps(
					step.label,
					step.steps,
					input,
					this.executeStep.bind(this),
					runtime,
					runnerOptions,
				);
			case "parallel":
				return runParallelSteps(
					step.label,
					step.steps,
					input,
					this.executeStep.bind(this),
					runtime,
					runnerOptions,
				);
			case "invokeSkill": {
				const skillResult = runtime.integratedRuntime
					? (
							await runtime.integratedRuntime.executeSkill(
								step.skillId,
								input,
								{
									sessionId: runtime.sessionId,
								},
							)
						).result
					: await runtime.skillRegistry.execute(step.skillId, input, runtime);
				return {
					label: step.label,
					kind: step.kind,
					summary: skillResult.summary,
					skillResult,
				};
			}
			case "invokeInstruction": {
				const instructionResult = await runtime.instructionRegistry.execute(
					step.instructionId,
					input,
					runtime,
				);
				return {
					label: step.label,
					kind: step.kind,
					summary: `Delegated to instruction ${step.instructionId}.`,
					children: instructionResult.steps,
					// Carry the pre-aggregated artifact list so artifacts from
					// external registry implementations (that populate
					// instructionResult.artifacts directly rather than through
					// individual step skillResults) are not silently dropped.
					// When set, collectArtifacts uses this instead of recursing
					// into children to prevent double-counting.
					...(instructionResult.artifacts?.length
						? { artifacts: instructionResult.artifacts }
						: {}),
				};
			}
			case "gate": {
				const branch = shouldRunGate(step.condition, input)
					? step.ifTrue
					: (step.ifFalse ?? []);
				const branchResult = await runSerialSteps(
					step.label,
					branch,
					input,
					this.executeStep.bind(this),
					runtime,
					runnerOptions,
				);
				return {
					...branchResult,
					kind: "gate",
				};
			}
			case "finalize":
				return {
					label: step.label,
					kind: step.kind,
					summary: "Workflow finalized.",
				};
			case "note":
				return {
					label: step.label,
					kind: step.kind,
					summary: step.note,
				};
		}
	}
}
