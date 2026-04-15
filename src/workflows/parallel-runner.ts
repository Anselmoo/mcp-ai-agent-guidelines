import PQueue from "p-queue";
import type { WorkflowStep } from "../contracts/generated.js";
import type {
	InstructionInput,
	StepExecutionRecord,
	WorkflowExecutionRuntime,
} from "../contracts/runtime.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import {
	classifyStepError,
	isRetryableErrorClass,
	type RetryConfig,
	StepTimeoutError,
	withRetry,
	withTimeout,
} from "./workflow-retry.js";

/** Max concurrent steps; keeps memory and rate-limit pressure bounded. */
const PARALLEL_CONCURRENCY = 3;

export interface ParallelRunnerOptions {
	/**
	 * Maximum number of steps executing concurrently. Default 3.
	 */
	concurrency?: number;
	/**
	 * Per-step wall-clock timeout in milliseconds.
	 * Disabled (no timeout) when ≤ 0 or undefined.
	 */
	stepTimeoutMs?: number;
	/**
	 * Retry configuration applied to each step.
	 */
	retryConfig?: RetryConfig;
	/**
	 * When true, the parallel runner treats any step failure as a hard error
	 * and the returned record's summary will reflect partial completion.
	 * When false (default), failures are collected but the runner still returns
	 * records for all steps.
	 */
	failFast?: boolean;
}

export async function runParallelSteps(
	label: string,
	steps: WorkflowStep[],
	input: InstructionInput,
	executeStep: (
		step: WorkflowStep,
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	) => Promise<StepExecutionRecord>,
	runtime: WorkflowExecutionRuntime,
	options?: ParallelRunnerOptions,
): Promise<StepExecutionRecord> {
	const concurrency = options?.concurrency ?? PARALLEL_CONCURRENCY;
	const queue = new PQueue({ concurrency });

	const settled = await Promise.allSettled(
		steps.map((step) =>
			queue.add(() =>
				executeParallelStep(step, input, runtime, executeStep, options),
			),
		),
	);

	const children: StepExecutionRecord[] = [];
	const failures: string[] = [];

	for (let i = 0; i < settled.length; i++) {
		const result = settled[i];
		if (result.status === "fulfilled" && result.value !== undefined) {
			children.push(result.value);
		} else if (result.status === "rejected") {
			const stepLabel = steps[i]?.label ?? `step[${i}]`;
			const errorClass = classifyStepError(result.reason);
			const errorMsg = toErrorMessage(result.reason);
			failures.push(`${stepLabel}(${errorClass}): ${errorMsg}`);
			// Add a synthetic failed record so order is preserved
			children.push({
				label: stepLabel,
				kind: steps[i]?.kind ?? "invokeSkill",
				summary: `[FAILED] ${errorMsg}`,
			});
		}
	}

	const summary =
		failures.length === 0
			? `${children.length} parallel step(s) completed.`
			: `${children.length - failures.length}/${steps.length} parallel step(s) completed. Failures: ${failures.join("; ")}`;

	return {
		label,
		kind: "parallel",
		summary,
		children,
	};
}

/**
 * Execute one parallel step, applying optional timeout and retry policies.
 */
async function executeParallelStep(
	step: WorkflowStep,
	input: InstructionInput,
	runtime: WorkflowExecutionRuntime,
	executeStep: (
		step: WorkflowStep,
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	) => Promise<StepExecutionRecord>,
	options?: ParallelRunnerOptions,
): Promise<StepExecutionRecord> {
	const timeoutMs = options?.stepTimeoutMs ?? 0;
	const retry = options?.retryConfig;

	const executeWithTimeout = () => {
		const fn = () => executeStep(step, input, runtime);
		return timeoutMs > 0 ? withTimeout(fn, timeoutMs, step.label) : fn();
	};

	if (!retry) {
		return executeWithTimeout();
	}

	const retryConfig: RetryConfig = {
		...retry,
		isRetryable: (error) => {
			if (retry.isRetryable && !retry.isRetryable(error)) return false;
			const cls = classifyStepError(error);
			return isRetryableErrorClass(cls) && !(error instanceof StepTimeoutError);
		},
	};

	const outcome = await withRetry(executeWithTimeout, retryConfig, step.label);
	return outcome.result;
}
