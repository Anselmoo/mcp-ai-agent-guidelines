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
});
