import { describe, expect, it, vi } from "vitest";
import type {
	ModelProfile,
	RecommendationItem,
	Sampler,
	WorkflowExecutionResult,
} from "../../../contracts/runtime.js";
import {
	resolveTransformDomain,
	toSituationResult,
} from "../../../skills/shared/directive-first.js";

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

describe("resolveTransformDomain", () => {
	it("returns a clean domain noun for analysis-family tools", () => {
		// The public displayName is "Evaluate: Benchmark and Assess Quality" — the
		// "Label:" prefix reads wrong as an analysis domain, so the resolver maps
		// to a grammatical noun instead.
		expect(resolveTransformDomain("quality-evaluate")).toBe("evaluation setup");
		expect(resolveTransformDomain("code-review")).toBeTruthy();
		expect(resolveTransformDomain("issue-debug")).toBeTruthy();
	});

	it("never returns the raw 'Label:' displayName form", () => {
		const domain = resolveTransformDomain("quality-evaluate") ?? "";
		expect(domain).not.toMatch(/^[A-Z][a-z]+:/);
	});

	it("excludes non-analysis tools (routers, onboarding, bootstrap)", () => {
		expect(resolveTransformDomain("meta-routing")).toBeUndefined();
		expect(resolveTransformDomain("project-onboard")).toBeUndefined();
		expect(resolveTransformDomain("task-bootstrap")).toBeUndefined();
		expect(resolveTransformDomain("agent-orchestrate")).toBeUndefined();
	});
});

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

	it("preserves steps' labels but trims the artifact wall to the cap", async () => {
		const result = workflowResult([rec("Define the dataset slices.")]);
		const many = Array.from({ length: 20 }, (_, i) => ({
			kind: "eval-criteria" as const,
			title: `crit-${i}`,
			criteria: [`c${i}`],
		}));
		result.steps = [
			{
				label: "s",
				kind: "skill",
				summary: "ran",
				skillResult: {
					skillId: "x",
					displayName: "X",
					model: model,
					summary: "ran",
					recommendations: [],
					relatedSkills: [],
					artifacts: many,
				},
			},
		];
		const out = await toSituationResult(result, deps);
		const merged = [
			...(out.artifacts ?? []),
			...out.steps.flatMap((s) => s.skillResult?.artifacts ?? []),
		];
		expect(merged.length).toBeLessThanOrEqual(6);
		expect(out.steps[0]?.label).toBe("s");
	});

	it("leaves a result with no usable recommendations unchanged", async () => {
		const result = workflowResult([]);
		const out = await toSituationResult(result, deps);
		expect(out).toBe(result);
	});

	it("leaves an advisory-only result unchanged (nothing to seed)", async () => {
		const result = workflowResult([
			rec("This analysis is advisory only — confirm against your project."),
		]);
		const out = await toSituationResult(result, deps);
		expect(out).toBe(result);
	});

	it("forwards the union of evidence anchors and source refs onto the collapsed rec", async () => {
		const result = workflowResult([
			{
				...rec("Define the dataset slices."),
				evidenceAnchors: ["src/eval/runner.ts"],
				sourceRefs: ["docs/eval.md"],
			},
			{
				...rec("Attach an oracle."),
				evidenceAnchors: ["src/eval/runner.ts", "tests/golden.jsonl"],
				sourceRefs: ["docs/eval.md", "RFC-12"],
			},
		]);
		const out = await toSituationResult(result, deps);
		const lead = out.recommendations[0];
		expect(lead?.evidenceAnchors).toEqual([
			"src/eval/runner.ts",
			"tests/golden.jsonl",
		]);
		expect(lead?.sourceRefs).toEqual(["docs/eval.md", "RFC-12"]);
	});

	it("leaves evidence anchors and source refs undefined when no seed carries them", async () => {
		const out = await toSituationResult(
			workflowResult([rec("Define the dataset slices.")]),
			deps,
		);
		const lead = out.recommendations[0];
		expect(lead?.evidenceAnchors).toBeUndefined();
		expect(lead?.sourceRefs).toBeUndefined();
	});
});
