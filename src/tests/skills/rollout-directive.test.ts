import { describe, expect, it, vi } from "vitest";
import type { InstructionInput, Sampler } from "../../contracts/runtime.js";
import { skillModule as debugReproduction } from "../../skills/debug/debug-reproduction.js";
import { skillModule as qualCodeAnalysis } from "../../skills/qual/qual-code-analysis.js";
import { createMockSkillRuntime, expectSkillGuidance } from "./test-helpers.js";

const cases: Array<{
	name: string;
	module: typeof qualCodeAnalysis;
	input: InstructionInput;
}> = [
	{
		name: "qual-code-analysis",
		module: qualCodeAnalysis,
		input: { request: "analyze the coupling and complexity of this module" },
	},
	{
		name: "debug-reproduction",
		module: debugReproduction,
		input: { request: "reproduce the crash that happens on startup in CI" },
	},
];

describe("code-review / issue-debug lead skills emit a directive", () => {
	for (const { name, module, input } of cases) {
		it(`${name} leads with a return-a-prompt analysis directive`, async () => {
			const result = await expectSkillGuidance(module, input, {});
			const lead = result.recommendations[0];
			expect(lead?.title.toLowerCase()).toMatch(/^analyze your/);
			expect(lead?.detail.toLowerCase()).toContain("analysis task");
			expect(lead?.groundingScope).toBe("context");
		});
	}

	it("qual-code-analysis samples when the client supports it", async () => {
		const sampler: Sampler = vi.fn().mockResolvedValue({
			text: "module Foo has 9 inbound deps — invert it.",
		});
		const result = await qualCodeAnalysis.run(
			{ request: "analyze the coupling and complexity of this module" },
			{ ...createMockSkillRuntime(), sampler, clientSupportsSampling: true },
		);
		expect(result.recommendations[0]?.title.toLowerCase()).toMatch(
			/^analysis of your/,
		);
		expect(result.recommendations[0]?.detail).toContain("module Foo has 9");
	});
});
