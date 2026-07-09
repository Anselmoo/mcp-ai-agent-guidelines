import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkflowStep } from "../../contracts/generated.js";
import type {
	InstructionInput,
	StepExecutionRecord,
	WorkflowExecutionRuntime,
} from "../../contracts/runtime.js";
import { runParallelSteps } from "../../workflows/parallel-runner.js";

const runtime = {} as WorkflowExecutionRuntime;
const input: InstructionInput = { request: "run in parallel" };

describe("parallel-runner", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("starts sibling steps before awaiting completion and preserves source order", async () => {
		const events: string[] = [];
		const steps: WorkflowStep[] = [
			{
				kind: "invokeSkill",
				label: "slow-step",
				skillId: "slow-step",
			},
			{
				kind: "invokeSkill",
				label: "fast-step",
				skillId: "fast-step",
			},
		];
		const executeStep = vi.fn(
			async (step: WorkflowStep): Promise<StepExecutionRecord> => {
				events.push(`start:${step.label}`);
				await new Promise((resolve) =>
					setTimeout(resolve, step.label === "slow-step" ? 20 : 0),
				);
				events.push(`finish:${step.label}`);
				return {
					label: step.label,
					kind: step.kind,
					summary: `${step.label} complete`,
				};
			},
		);

		const result = await runParallelSteps(
			"parallel-batch",
			steps,
			input,
			executeStep,
			runtime,
		);

		expect(events.slice(0, 2)).toEqual(["start:slow-step", "start:fast-step"]);
		expect(result).toEqual({
			label: "parallel-batch",
			kind: "parallel",
			summary: "2 parallel step(s) completed.",
			children: [
				{
					label: "slow-step",
					kind: "invokeSkill",
					summary: "slow-step complete",
				},
				{
					label: "fast-step",
					kind: "invokeSkill",
					summary: "fast-step complete",
				},
			],
		});
	});

	it("includes failure summary when a step rejects", async () => {
		const steps: WorkflowStep[] = [
			{ kind: "invokeSkill", label: "ok-step", skillId: "ok" },
			{ kind: "invokeSkill", label: "bad-step", skillId: "bad" },
		];
		const executeStep = vi.fn(async (step: WorkflowStep) => {
			if (step.label === "bad-step") throw new Error("boom");
			return { label: step.label, kind: step.kind, summary: "ok" };
		});

		const result = await runParallelSteps(
			"fail-batch",
			steps,
			input,
			executeStep,
			runtime,
		);

		expect(result.summary).toContain("Failures:");
		expect(result.summary).toContain("bad-step");
		expect(result.children).toHaveLength(2);
	});

	it("applies stepTimeoutMs when provided", async () => {
		const step: WorkflowStep = {
			kind: "invokeSkill",
			label: "slow",
			skillId: "slow",
		};
		const executeStep = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 50));
			return { label: "slow", kind: "invokeSkill" as const, summary: "done" };
		});

		const result = await runParallelSteps(
			"timeout-batch",
			[step],
			input,
			executeStep,
			runtime,
			{ stepTimeoutMs: 5 },
		);
		// Should record a failure due to timeout
		expect(result.summary).toContain("Failures:");
	});

	it("returns an empty parallel record when there are no child steps", async () => {
		const executeStep = vi.fn();

		const result = await runParallelSteps(
			"empty-parallel",
			[],
			input,
			executeStep,
			runtime,
		);

		expect(executeStep).not.toHaveBeenCalled();
		expect(result).toEqual({
			label: "empty-parallel",
			kind: "parallel",
			summary: "0 parallel step(s) completed.",
			children: [],
		});
	});

	it("retries retryable failures when retryConfig is provided", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		let attempts = 0;
		const step: WorkflowStep = {
			kind: "invokeSkill",
			label: "flaky-step",
			skillId: "flaky-step",
		};
		const executeStep = vi.fn(async () => {
			attempts += 1;
			if (attempts === 1) {
				throw new Error("transient failure");
			}
			return {
				label: "flaky-step",
				kind: "invokeSkill" as const,
				summary: "recovered",
			};
		});

		const result = await runParallelSteps(
			"retry-batch",
			[step],
			input,
			executeStep,
			runtime,
			{
				retryConfig: {
					maxAttempts: 2,
					initialDelayMs: 0,
					jitterFraction: 0,
				},
			},
		);

		expect(executeStep).toHaveBeenCalledTimes(2);
		expect(result.summary).toBe("1 parallel step(s) completed.");
	});

	it("drops a fulfilled result whose value is undefined", async () => {
		const steps: WorkflowStep[] = [
			{ kind: "invokeSkill", label: "undefined-step", skillId: "undefined" },
		];
		// executeStep resolves but yields no record — exercises the branch where
		// settled[i] is fulfilled yet result.value is undefined, so neither the
		// success nor the failure path pushes a child record.
		const executeStep = vi.fn(
			async () => undefined as unknown as StepExecutionRecord,
		);

		const result = await runParallelSteps(
			"undefined-value-batch",
			steps,
			input,
			executeStep,
			runtime,
		);

		expect(result).toEqual({
			label: "undefined-value-batch",
			kind: "parallel",
			summary: "0 parallel step(s) completed.",
			children: [],
		});
	});

	it("falls back to synthetic label/kind when the step entry itself is missing", async () => {
		// Use a sparse-like steps array where the entry at the failing index is
		// undefined, forcing the `steps[i]?.label ?? ...` / `steps[i]?.kind ?? ...`
		// fallback branches to be exercised.
		const steps = [undefined] as unknown as WorkflowStep[];
		const executeStep = vi.fn(async () => {
			throw new Error("missing step boom");
		});

		const result = await runParallelSteps(
			"missing-step-batch",
			steps,
			input,
			executeStep,
			runtime,
		);

		expect(result.summary).toContain("step[0]");
		expect(result.children).toEqual([
			{
				label: "step[0]",
				kind: "invokeSkill",
				summary: "[FAILED] missing step boom",
			},
		]);
	});

	it("respects a custom isRetryable predicate that forbids retrying", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const step: WorkflowStep = {
			kind: "invokeSkill",
			label: "non-retryable-step",
			skillId: "non-retryable",
		};
		const executeStep = vi.fn(async () => {
			throw new Error("permanent failure");
		});

		const result = await runParallelSteps(
			"custom-not-retryable-batch",
			[step],
			input,
			executeStep,
			runtime,
			{
				retryConfig: {
					maxAttempts: 3,
					initialDelayMs: 0,
					jitterFraction: 0,
					isRetryable: () => false,
				},
			},
		);

		// Custom predicate rejects the error, so no retry should occur.
		expect(executeStep).toHaveBeenCalledTimes(1);
		expect(result.summary).toContain("Failures:");
		expect(result.summary).toContain("non-retryable-step");
	});

	it("respects a custom isRetryable predicate that allows retrying", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		let attempts = 0;
		const step: WorkflowStep = {
			kind: "invokeSkill",
			label: "custom-retryable-step",
			skillId: "custom-retryable",
		};
		const executeStep = vi.fn(async () => {
			attempts += 1;
			if (attempts === 1) {
				throw new Error("recoverable failure");
			}
			return {
				label: "custom-retryable-step",
				kind: "invokeSkill" as const,
				summary: "recovered",
			};
		});

		const result = await runParallelSteps(
			"custom-retryable-batch",
			[step],
			input,
			executeStep,
			runtime,
			{
				retryConfig: {
					maxAttempts: 2,
					initialDelayMs: 0,
					jitterFraction: 0,
					isRetryable: () => true,
				},
			},
		);

		expect(executeStep).toHaveBeenCalledTimes(2);
		expect(result.summary).toBe("1 parallel step(s) completed.");
	});
});
