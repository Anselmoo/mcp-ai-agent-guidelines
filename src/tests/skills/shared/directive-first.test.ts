import { describe, expect, it, vi } from "vitest";
import type {
	ModelProfile,
	RecommendationItem,
	Sampler,
	WorkflowExecutionResult,
} from "../../../contracts/runtime.js";
import {
	ANALYSIS_OUTPUT_CONTRACT,
	resolveTransformProfile,
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
	outputContract: ANALYSIS_OUTPUT_CONTRACT,
	candidateNextTools: ["evidence-research", "code-review"],
};

describe("resolveTransformProfile", () => {
	it("returns a profile with a clean domain noun for analysis-family tools", () => {
		const p = resolveTransformProfile("quality-evaluate");
		expect(p?.domain).toBe("evaluation setup");
		expect(p?.outputContract.toLowerCase()).toContain("findings per criterion");
		expect(resolveTransformProfile("code-review")?.domain).toBeTruthy();
		expect(resolveTransformProfile("issue-debug")?.domain).toBeTruthy();
	});

	it("never returns the raw 'Label:' displayName form as the domain", () => {
		const domain = resolveTransformProfile("quality-evaluate")?.domain ?? "";
		expect(domain).not.toMatch(/^[A-Z][a-z]+:/);
	});

	it("covers the solution-producing tools with the build contract", () => {
		for (const tool of [
			"feature-implement",
			"code-refactor",
			"test-verify",
			"strategy-plan",
			"docs-generate",
			"enterprise-strategy",
		]) {
			const p = resolveTransformProfile(tool);
			expect(p, tool).toBeDefined();
			expect(p?.outputContract.toLowerCase()).toContain("deliverable");
			expect(p?.domain).not.toMatch(/^[A-Z][a-z]+:/);
		}
	});

	it("gives meta-routing a routing profile that seeds the routable domain tools", () => {
		// meta-routing's mission is to DECIDE which instruction(s) to invoke, so it
		// must name concrete tools for the request — not collapse to a rubric
		// analysis. The routing profile carries its own candidate tools (its
		// manifest chainTo is empty).
		const p = resolveTransformProfile("meta-routing");
		expect(p).toBeDefined();
		expect(p?.domain).not.toMatch(/^[A-Z][a-z]+:/);
		expect(p?.outputContract.toLowerCase()).toMatch(/instruction|tool/);
		expect(p?.candidateNextTools ?? []).toContain("issue-debug");
		expect((p?.candidateNextTools ?? []).length).toBeGreaterThan(3);
	});

	it("gives agent-orchestrate an orchestration profile (it produces a deliverable)", () => {
		// Mission: "synthesize results … coherent unified output" — a deliverable,
		// not a passthrough. It collapses into a tailored coordination plan.
		const p = resolveTransformProfile("agent-orchestrate");
		expect(p).toBeDefined();
		expect(p?.domain).not.toMatch(/^[A-Z][a-z]+:/);
		expect(p?.outputContract.toLowerCase()).toMatch(/coordination|orchestrat/);
	});

	it("gives prompt-engineering a prompt deliverable profile", () => {
		const p = resolveTransformProfile("prompt-engineering");
		expect(p).toBeDefined();
		expect(p?.domain).not.toMatch(/^[A-Z][a-z]+:/);
		expect(p?.outputContract.toLowerCase()).toContain("prompt");
	});

	it("gives routing-adapt an adaptive-routing profile (it produces a routing policy)", () => {
		// Mission: "Deploy → observe → reinforce → prune → converge" — produces an
		// adaptive routing policy deliverable, structurally like agent-orchestrate.
		// Was emitting a 44-rec / 21KB generic delegation-template wall.
		const p = resolveTransformProfile("routing-adapt");
		expect(p).toBeDefined();
		expect(p?.domain).not.toMatch(/^[A-Z][a-z]+:/);
		expect(p?.outputContract.toLowerCase()).toMatch(/rout/);
	});

	it("gives task-bootstrap an orientation profile (scope brief, not a solution)", () => {
		// Mission: "Orient the agent … identify scope and unknowns before any
		// implementation starts." The contract orients (in/out of scope, key
		// ambiguities, recommended first instruction) — it does NOT solve the task,
		// so it is not the build/analysis category error. Was emitting a 75-rec /
		// 45KB wall at every session start.
		const p = resolveTransformProfile("task-bootstrap");
		expect(p).toBeDefined();
		expect(p?.domain).not.toMatch(/^[A-Z][a-z]+:/);
		expect(p?.outputContract.toLowerCase()).toMatch(/scope|orient|ambigu/);
	});

	it("gives project-onboard an orientation profile", () => {
		const p = resolveTransformProfile("project-onboard");
		expect(p).toBeDefined();
		expect(p?.domain).not.toMatch(/^[A-Z][a-z]+:/);
		expect(p?.outputContract.toLowerCase()).toMatch(/scope|orient|ambigu/);
	});

	it("still excludes only the analogy special path", () => {
		// analogy-think gates to a request-specific metaphor (or "no analogy opens")
		// — already situation-anchored, not a template wall. The sole correct
		// passthrough on the public surface.
		expect(resolveTransformProfile("analogy-think")).toBeUndefined();
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

	it("leaves a result with a blank request unchanged (no problem to anchor to)", async () => {
		const result = workflowResult([rec("Define the dataset slices.")]);
		result.request = "   ";
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
