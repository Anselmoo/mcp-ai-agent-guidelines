import { describe, expect, it, vi } from "vitest";
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
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
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
		warnSpy.mockRestore();
	});
});
