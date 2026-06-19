import { describe, expect, it, vi } from "vitest";
import type { InstructionInput, Sampler } from "../../../contracts/runtime.js";
import { skillModule as evalDesign } from "../../../skills/eval/eval-design.js";
import { skillModule as evalOutputGrading } from "../../../skills/eval/eval-output-grading.js";
import { skillModule as evalPrompt } from "../../../skills/eval/eval-prompt.js";
import { skillModule as evalPromptBench } from "../../../skills/eval/eval-prompt-bench.js";
import { skillModule as evalVariance } from "../../../skills/eval/eval-variance.js";
import {
	createMockSkillRuntime,
	expectSkillGuidance,
} from "../test-helpers.js";

// Every eval skill behind `quality-evaluate` must lead with a return-a-prompt
// directive so the calling agent performs project-specific analysis rather than
// receiving a generic, keyword-matched stub.
const cases: Array<{
	name: string;
	module: typeof evalDesign;
	input: InstructionInput;
}> = [
	{
		name: "eval-design",
		module: evalDesign,
		input: {
			request: "design an eval dataset with assertions and hard negatives",
		},
	},
	{
		name: "eval-output-grading",
		module: evalOutputGrading,
		input: {
			request: "grade model outputs with a rubric oracle and calibration set",
		},
	},
	{
		name: "eval-prompt-bench",
		module: evalPromptBench,
		input: {
			request:
				"benchmark prompt variants against a baseline with regression gates",
		},
	},
	{
		name: "eval-prompt",
		module: evalPrompt,
		input: {
			request:
				"evaluate this prompt asset against a golden-set benchmark with scoring",
		},
	},
	{
		name: "eval-variance",
		module: evalVariance,
		input: {
			request:
				"analyze eval score variance across repeated runs with a tolerance band",
		},
	},
];

describe("eval skills emit a return-a-prompt directive", () => {
	for (const { name, module, input } of cases) {
		it(`${name} leads with an analysis directive grounded in the request`, async () => {
			const result = await expectSkillGuidance(module, input, {});
			const lead = result.recommendations[0];
			expect(lead?.title.toLowerCase()).toMatch(/^analyze your/);
			expect(lead?.detail.toLowerCase()).toContain("analysis task");
			expect(lead?.detail.toLowerCase()).toContain("cite");
			expect(lead?.detail).toContain(input.request);
			expect(lead?.groundingScope).toBe("context");
		});
	}

	it("uses the sampler to produce findings when the client supports it", async () => {
		const sampler: Sampler = vi.fn().mockResolvedValue({
			text: "Your golden.jsonl lacks hard negatives.",
		});
		const result = await evalDesign.run(
			{ request: "design an eval dataset with assertions and hard negatives" },
			{ ...createMockSkillRuntime(), sampler, clientSupportsSampling: true },
		);
		const lead = result.recommendations[0];
		expect(lead?.title.toLowerCase()).toMatch(/^analysis of your/);
		expect(lead?.detail).toContain("Your golden.jsonl lacks hard negatives.");
	});
});
