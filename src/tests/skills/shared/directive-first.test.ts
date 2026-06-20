import { describe, expect, it, vi } from "vitest";
import type {
	ModelProfile,
	RecommendationItem,
	Sampler,
	WorkflowExecutionResult,
} from "../../../contracts/runtime.js";
import { toSituationResult } from "../../../skills/shared/directive-first.js";

const model: ModelProfile = {
	id: "m",
	label: "M",
	modelClass: "strong",
	strengths: [],
	maxContextWindow: "medium",
	costTier: "strong",
};

function rec(detail: string, title = "Guidance"): RecommendationItem {
	return { title, detail, modelClass: "cheap" };
}

function workflowResult(
	recommendations: RecommendationItem[],
): WorkflowExecutionResult {
	return {
		instructionId: "quality-evaluate",
		displayName: "Quality Evaluate",
		request: "evaluate the retrieval quality of our RAG pipeline",
		model,
		steps: [],
		recommendations,
		artifacts: [],
	};
}

const deps = {
	domain: "evaluation setup",
	candidateNextTools: ["evidence-research", "code-review"],
};

describe("toSituationResult", () => {
	it("collapses the template recommendation wall into one situation result", async () => {
		const result = workflowResult([
			rec("Define the dataset slices that map to operational risk."),
			rec("Attach an oracle to every case."),
			rec("Name the release threshold."),
		]);

		const out = await toSituationResult(result, deps);

		expect(out.recommendations).toHaveLength(1);
		const lead = out.recommendations[0];
		expect(lead?.detail.toLowerCase()).toContain("analysis task");
		// The original template details seed the rubric the agent works against.
		expect(lead?.detail).toContain("Define the dataset slices");
	});

	it("seeds the next-action workflow from the instruction's chain-to tools", async () => {
		const out = await toSituationResult(
			workflowResult([rec("Define the dataset slices.")]),
			deps,
		);
		expect(out.recommendations[0]?.detail).toContain("evidence-research");
	});

	it("drops advisory-only recommendations from the rubric seed", async () => {
		const out = await toSituationResult(
			workflowResult([
				rec("Define the dataset slices."),
				rec("This analysis is advisory only — confirm against your project."),
			]),
			deps,
		);
		const detail = out.recommendations[0]?.detail ?? "";
		expect(detail).not.toContain("advisory only");
	});

	it("anchors the directive to the workflow's original request", async () => {
		const out = await toSituationResult(
			workflowResult([rec("Define the dataset slices.")]),
			deps,
		);
		expect(out.recommendations[0]?.detail).toContain(
			"evaluate the retrieval quality of our RAG pipeline",
		);
	});

	it("uses the sampler to produce findings when one is available", async () => {
		const sampler: Sampler = vi
			.fn()
			.mockResolvedValue({ text: "Your golden.jsonl lacks hard negatives." });
		const out = await toSituationResult(
			workflowResult([rec("Define the dataset slices.")]),
			{ ...deps, sampler },
		);
		expect(out.recommendations[0]?.detail).toContain(
			"Your golden.jsonl lacks hard negatives.",
		);
	});

	it("preserves artifacts and steps untouched", async () => {
		const result = workflowResult([rec("Define the dataset slices.")]);
		result.steps = [{ label: "s", kind: "skill", summary: "ran" }];
		const out = await toSituationResult(result, deps);
		expect(out.steps).toBe(result.steps);
		expect(out.artifacts).toBe(result.artifacts);
	});

	it("leaves a result with no usable recommendations unchanged", async () => {
		const result = workflowResult([]);
		const out = await toSituationResult(result, deps);
		expect(out).toBe(result);
	});

	it("leaves an advisory-only-only result unchanged (nothing to seed)", async () => {
		const result = workflowResult([
			rec("This analysis is advisory only — confirm against your project."),
		]);
		const out = await toSituationResult(result, deps);
		expect(out).toBe(result);
	});
});
