import { describe, expect, it } from "vitest";
import type { WorkflowExecutionResult } from "../../../contracts/runtime.js";
import { toSituationResult } from "../../../skills/shared/directive-first.js";

function resultWith(scope: "request" | "workspace"): WorkflowExecutionResult {
	return {
		instructionId: "issue-debug",
		displayName: "Debug",
		request: "the test in src/foo.test.ts is flaky",
		model: {
			id: "free_primary",
			label: "Free",
			modelClass: "free",
			strengths: [],
			maxContextWindow: "medium",
			costTier: "free",
		},
		steps: [],
		recommendations: [
			{
				title: "f",
				detail: "concrete finding about src/foo.test.ts",
				modelClass: "free",
				groundingScope: scope,
			},
		],
	};
}

const deps = {
	domain: "incident",
	outputContract: "a root-cause brief",
	candidateNextTools: ["issue-debug"],
};

// A sharp directive to an LLM caller is the intended output, not a degraded
// fallback — so toSituationResult never emits an apology banner, whether or not
// a skill grounded the result in workspace files. (The old "⚠️ Directive mode"
// banner and its grounding-based suppression were removed with the sampler.)
describe("toSituationResult never apologizes", () => {
	it("emits a clean directive when a workspace-grounded rec is present", async () => {
		const out = await toSituationResult(resultWith("workspace"), deps);
		expect(out.recommendations[0].detail).not.toContain("Directive mode");
		expect(out.recommendations[0].detail).not.toContain("⚠️");
	});

	it("emits a clean directive when nothing is grounded", async () => {
		const out = await toSituationResult(resultWith("request"), deps);
		expect(out.recommendations[0].detail).not.toContain("Directive mode");
		expect(out.recommendations[0].detail).not.toContain("⚠️");
	});
});
