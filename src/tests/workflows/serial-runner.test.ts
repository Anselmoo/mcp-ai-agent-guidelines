import { describe, expect, it, vi } from "vitest";
import type { WorkflowStep } from "../../contracts/generated.js";
import type {
	InstructionInput,
	StepExecutionRecord,
	WorkflowExecutionRuntime,
} from "../../contracts/runtime.js";
import { runSerialSteps } from "../../workflows/serial-runner.js";

const runtime = {} as WorkflowExecutionRuntime;
const input: InstructionInput = { request: "run in order" };

describe("serial-runner", () => {
	it("awaits each child step before starting the next one", async () => {
		const events: string[] = [];
		const steps: WorkflowStep[] = [
			{
				kind: "invokeSkill",
				label: "first-step",
				skillId: "first-step",
			},
			{
				kind: "invokeSkill",
				label: "second-step",
				skillId: "second-step",
			},
		];
		const executeStep = vi.fn(
			async (step: WorkflowStep): Promise<StepExecutionRecord> => {
				events.push(`start:${step.label}`);
				await Promise.resolve();
				events.push(`finish:${step.label}`);
				return {
					label: step.label,
					kind: step.kind,
					summary: `${step.label} complete`,
				};
			},
		);

		const result = await runSerialSteps(
			"serial-batch",
			steps,
			input,
			executeStep,
			runtime,
		);

		expect(events).toEqual([
			"start:first-step",
			"finish:first-step",
			"start:second-step",
			"finish:second-step",
		]);
		expect(result).toEqual({
			label: "serial-batch",
			kind: "serial",
			summary: "2 serial step(s) executed.",
			children: [
				{
					label: "first-step",
					kind: "invokeSkill",
					summary: "first-step complete",
				},
				{
					label: "second-step",
					kind: "invokeSkill",
					summary: "second-step complete",
				},
			],
		});
	});

	it("collects failures without aborting when abortOnFailure is false", async () => {
		const steps: WorkflowStep[] = [
			{ kind: "invokeSkill", label: "step-a", skillId: "a" },
			{ kind: "invokeSkill", label: "step-b", skillId: "b" },
			{ kind: "invokeSkill", label: "step-c", skillId: "c" },
		];
		const executeStep = vi.fn(async (step: WorkflowStep) => {
			if (step.label === "step-b") throw new Error("b-fail");
			return {
				label: step.label,
				kind: step.kind,
				summary: `${step.label} done`,
			};
		});

		const result = await runSerialSteps(
			"no-abort",
			steps,
			input,
			executeStep,
			runtime,
			{ abortOnFailure: false },
		);

		expect(executeStep).toHaveBeenCalledTimes(3);
		expect(result.children).toHaveLength(3);
		expect(result.summary).toContain("2/3");
		expect(result.summary).toContain("step-b");
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

		await expect(
			runSerialSteps("timeout-test", [step], input, executeStep, runtime, {
				stepTimeoutMs: 5,
			}),
		).rejects.toThrow();
	});

	it("stops executing remaining steps after a failure", async () => {
		const steps: WorkflowStep[] = [
			{
				kind: "invokeSkill",
				label: "first-step",
				skillId: "first-step",
			},
			{
				kind: "invokeSkill",
				label: "second-step",
				skillId: "second-step",
			},
			{
				kind: "invokeSkill",
				label: "third-step",
				skillId: "third-step",
			},
		];
		const executeStep = vi.fn(async (step: WorkflowStep) => {
			if (step.label === "second-step") {
				throw new Error("boom");
			}
			return {
				label: step.label,
				kind: step.kind,
				summary: `${step.label} complete`,
			};
		});

		await expect(
			runSerialSteps("serial-batch", steps, input, executeStep, runtime),
		).rejects.toThrow("boom");
		expect(executeStep.mock.calls.map((call) => call[0].label)).toEqual([
			"first-step",
			"second-step",
		]);
	});
});
