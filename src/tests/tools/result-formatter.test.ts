import { describe, expect, it } from "vitest";
import type { WorkflowExecutionResult } from "../../contracts/runtime.js";
import { formatWorkflowResult } from "../../tools/result-formatter.js";

/** Minimal valid ModelProfile — note: 'strengths' + 'maxContextWindow', no 'provider'/'contextWindow' */
function makeModel(
	overrides?: Partial<WorkflowExecutionResult["model"]>,
): WorkflowExecutionResult["model"] {
	return {
		id: "gpt-4o-mini",
		label: "GPT-4o Mini",
		modelClass: "cheap",
		strengths: ["speed"],
		maxContextWindow: "medium",
		costTier: "cheap",
		...overrides,
	};
}

function makeResult(
	overrides?: Partial<WorkflowExecutionResult>,
): WorkflowExecutionResult {
	return {
		instructionId: "review",
		displayName: "Review Runtime",
		model: makeModel(),
		steps: [],
		recommendations: [],
		...overrides,
	};
}

describe("formatWorkflowResult", () => {
	it("includes displayName as the top-level heading", () => {
		expect(formatWorkflowResult(makeResult())).toMatch(/^# Review Runtime/m);
	});

	it("includes instructionId in backticks", () => {
		expect(formatWorkflowResult(makeResult())).toContain("`review`");
	});

	it("includes the model label", () => {
		expect(formatWorkflowResult(makeResult())).toContain("GPT-4o Mini");
	});

	it("shows 'No workflow steps executed' when steps array is empty", () => {
		expect(formatWorkflowResult(makeResult())).toContain(
			"No workflow steps executed.",
		);
	});

	it("renders each step's label and kind in the workflow section", () => {
		const out = formatWorkflowResult(
			makeResult({
				steps: [
					{ label: "VALIDATE", kind: "serial", summary: "All good" },
					{ label: "RUN_SKILL", kind: "invokeSkill", summary: "Skill ran" },
				],
			}),
		);
		expect(out).toContain("VALIDATE");
		expect(out).toContain("serial");
		expect(out).toContain("RUN_SKILL");
		expect(out).toContain("invokeSkill");
	});

	it("numbers each step in the progress snapshot section", () => {
		const out = formatWorkflowResult(
			makeResult({
				steps: [{ label: "Step A", kind: "finalize", summary: "Done" }],
			}),
		);
		expect(out).toMatch(/1\. \*\*Step A\*\*/);
	});

	it("shows 'No recommendations' placeholder when recommendations is empty", () => {
		expect(formatWorkflowResult(makeResult())).toContain("No recommendations");
	});

	it("renders recommendations with title, model class, and detail", () => {
		const out = formatWorkflowResult(
			makeResult({
				recommendations: [
					{
						title: "Use DI",
						detail: "Improves testability",
						modelClass: "cheap",
						groundingScope: "workspace",
						problem: "Direct construction couples tests to runtime wiring.",
						suggestedAction: "Inject dependencies at the module seam.",
					},
					{
						title: "Add caching",
						detail: "Reduces latency",
						modelClass: "strong",
						groundingScope: "request",
					},
				],
			}),
		);
		expect(out).toContain("Use DI");
		expect(out).toContain("cheap");
		expect(out).toContain("Add caching");
		expect(out).toContain("Reduces latency");
		expect(out).toContain("workspace-grounded");
		expect(out).toContain("Problem:");
		expect(out).toContain("Action:");
	});

	it("numbers recommendations sequentially from 1", () => {
		const out = formatWorkflowResult(
			makeResult({
				recommendations: [
					{ title: "First", detail: "A", modelClass: "free" },
					{ title: "Second", detail: "B", modelClass: "free" },
				],
			}),
		);
		expect(out).toMatch(/1\. \*\*First\*\*/);
		expect(out).toMatch(/2\. \*\*Second\*\*/);
	});

	it("sorts grounded recommendations ahead of manifest-only ones and prints sources", () => {
		const out = formatWorkflowResult(
			makeResult({
				recommendations: [
					{
						title: "Manifest summary",
						detail: "Fallback",
						modelClass: "cheap",
						groundingScope: "manifest",
					},
					{
						title: "Evidence-first fix",
						detail: "Use attached files",
						modelClass: "strong",
						groundingScope: "evidence",
						evidenceAnchors: ["src/workflows/workflow-engine.ts"],
						sourceRefs: ["src/workflows/workflow-engine.ts"],
					},
				],
			}),
		);

		expect(out.indexOf("Evidence-first fix")).toBeLessThan(
			out.indexOf("Manifest summary"),
		);
		expect(out).toContain("Evidence:");
		expect(out).toContain("Sources:");
	});

	it("output sections appear in order: heading → workflow → progress → recommendations", () => {
		const out = formatWorkflowResult(makeResult());
		const headingPos = out.indexOf("# Review Runtime");
		const workflowPos = out.indexOf("## Executed workflow");
		const progressPos = out.indexOf("## Progress snapshot");
		const artifactsPos = out.indexOf("## Produced artifacts");
		const recsPos = out.indexOf("## Recommendations");
		expect(headingPos).toBeLessThan(workflowPos);
		expect(workflowPos).toBeLessThan(progressPos);
		expect(progressPos).toBeLessThan(artifactsPos);
		expect(artifactsPos).toBeLessThan(recsPos);
	});

	it("renders structured artifacts emitted by workflow steps", () => {
		const out = formatWorkflowResult(
			makeResult({
				steps: [
					{
						label: "RUN_SKILL",
						kind: "invokeSkill",
						summary: "Skill ran",
						skillResult: {
							skillId: "prompt-engineering",
							displayName: "Prompt Engineering",
							model: makeModel(),
							summary: "Produced prompt assets.",
							recommendations: [],
							relatedSkills: [],
							artifacts: [
								{
									kind: "output-template",
									title: "Prompt template",
									template: "Goal: ...",
									fields: ["goal", "constraints"],
								},
								{
									kind: "tool-chain",
									title: "Review flow",
									steps: [
										{
											tool: "agent-memory",
											description: "load prior artifacts",
										},
										{
											tool: "agent-workspace",
											description: "persist prompt asset",
										},
									],
								},
							],
						},
					},
				],
			}),
		);
		expect(out).toContain("## Produced artifacts");
		expect(out).toContain("Output template: Prompt template");
		expect(out).toContain("`goal`");
		expect(out).toContain("Tool chain: Review flow");
		expect(out).toContain("`agent-memory`");
	});

	it("renders top-level WorkflowExecutionResult.artifacts in the produced artifacts section", () => {
		const out = formatWorkflowResult(
			makeResult({
				artifacts: [
					{
						kind: "eval-criteria",
						title: "Workflow-level eval",
						criteria: ["No regressions", "All recommendations grounded"],
					},
					{
						kind: "comparison-matrix",
						title: "Model comparison",
						headers: ["Model", "Cost", "Speed"],
						rows: [
							{ label: "GPT-4o Mini", values: ["cheap", "fast"] },
							{ label: "GPT-4o", values: ["strong", "medium"] },
						],
					},
				],
				steps: [],
			}),
		);
		expect(out).toContain("## Produced artifacts");
		expect(out).toContain("Evaluation criteria: Workflow-level eval");
		expect(out).toContain("No regressions");
		expect(out).toContain("Comparison matrix: Model comparison");
		expect(out).toContain("Model | Cost | Speed");
	});

	it("merges top-level artifacts before step-level artifacts", () => {
		const out = formatWorkflowResult(
			makeResult({
				artifacts: [
					{
						kind: "eval-criteria",
						title: "Top-level criteria",
						criteria: ["Must pass all gates"],
					},
				],
				steps: [
					{
						label: "RUN_SKILL",
						kind: "invokeSkill",
						summary: "Skill ran",
						skillResult: {
							skillId: "prompt-engineering",
							displayName: "Prompt Engineering",
							model: makeModel(),
							summary: "Ran.",
							recommendations: [],
							relatedSkills: [],
							artifacts: [
								{
									kind: "output-template",
									title: "Step-level template",
									template: "Goal: ...",
								},
							],
						},
					},
				],
			}),
		);
		const topPos = out.indexOf("Top-level criteria");
		const stepPos = out.indexOf("Step-level template");
		expect(topPos).toBeGreaterThan(-1);
		expect(stepPos).toBeGreaterThan(-1);
		// Top-level artifacts appear before step-level artifacts
		expect(topPos).toBeLessThan(stepPos);
	});

	it("shows 'No artifacts' placeholder when both top-level and step-level artifacts are absent", () => {
		const out = formatWorkflowResult(
			makeResult({ artifacts: undefined, steps: [] }),
		);
		expect(out).toContain("No artifacts");
	});
});
