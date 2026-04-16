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

export interface SerialRunnerOptions {
	/**
	 * Per-step wall-clock timeout in milliseconds.
	 * Disabled (no timeout) when ≤ 0 or undefined.
	 */
	stepTimeoutMs?: number;
	/**
	 * Retry configuration applied to each step.
	 * When provided, failed steps are retried according to this policy.
	 */
	retryConfig?: RetryConfig;
	/**
	 * When true (default), the runner aborts on the first step failure
	 * and re-throws the error. Set to false to collect all results even
	 * when some steps fail.
	 */
	abortOnFailure?: boolean;
}

/** Result entry when `abortOnFailure` is false and a step fails. */
export interface SerialStepFailure {
	label: string;
	error: string;
	errorClass: string;
}

export async function runSerialSteps(
	label: string,
	steps: WorkflowStep[],
	input: InstructionInput,
	executeStep: (
		step: WorkflowStep,
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	) => Promise<StepExecutionRecord>,
	runtime: WorkflowExecutionRuntime,
	options?: SerialRunnerOptions,
): Promise<StepExecutionRecord> {
	const abortOnFailure = options?.abortOnFailure ?? true;
	const children: StepExecutionRecord[] = [];
	const failures: SerialStepFailure[] = [];

	for (const step of steps) {
		try {
			const result = await executeSingleSerialStep(
				step,
				input,
				runtime,
				executeStep,
				options,
			);
			children.push(result);
		} catch (error) {
			const errorClass = classifyStepError(error);

			if (abortOnFailure) {
				throw error;
			}

			// Non-aborting path: record the failure and continue
			failures.push({
				label: step.label,
				error: toErrorMessage(error),
				errorClass,
			});
			// Push a synthetic failed record so the output length matches step count
			children.push({
				label: step.label,
				kind: step.kind,
				summary: `[FAILED] ${toErrorMessage(error)}`,
			});
		}
	}

	const summary =
		failures.length === 0
			? `${children.length} serial step(s) executed.`
			: `${children.length - failures.length}/${steps.length} serial step(s) succeeded. ` +
				`Failures: ${failures.map((f) => `${f.label}(${f.errorClass})`).join("; ")}`;

	return {
		label,
		kind: "serial",
		summary,
		children,
	};
}

/**
 * Execute a single serial step, applying optional timeout and retry policies.
 */
async function executeSingleSerialStep(
	step: WorkflowStep,
	input: InstructionInput,
	runtime: WorkflowExecutionRuntime,
	executeStep: (
		step: WorkflowStep,
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	) => Promise<StepExecutionRecord>,
	options?: SerialRunnerOptions,
): Promise<StepExecutionRecord> {
	const timeoutMs = options?.stepTimeoutMs ?? 0;
	const retry = options?.retryConfig;

	// Build the inner execution function (with timeout if configured)
	const executeWithTimeout = () => {
		const fn = () => executeStep(step, input, runtime);
		return timeoutMs > 0 ? withTimeout(fn, timeoutMs, step.label) : fn();
	};

	if (!retry) {
		return executeWithTimeout();
	}

	// Retry wrapper — only retry transient/timeout/unknown errors
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
