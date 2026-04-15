import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as evalDesignModule } from "../skills/eval/eval-design.js";
import { skillModule as evalOutputGradingModule } from "../skills/eval/eval-output-grading.js";
import { skillModule as evalPromptModule } from "../skills/eval/eval-prompt.js";
import { skillModule as evalPromptBenchModule } from "../skills/eval/eval-prompt-bench.js";
import { skillModule as evalVarianceModule } from "../skills/eval/eval-variance.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

const evalDesignManifest = evalDesignModule.manifest;
const evalOutputGradingManifest = evalOutputGradingModule.manifest;
const evalPromptManifest = evalPromptModule.manifest;
const evalPromptBenchManifest = evalPromptBenchModule.manifest;
const evalVarianceManifest = evalVarianceModule.manifest;

function createWorkflowRuntime() {
	const instructionRegistry = new InstructionRegistry();
	const skillRegistry = new SkillRegistry({ workspace: null });
	const modelRouter = new ModelRouter();

	return {
		sessionId: "test-eval",
		executionState: { instructionStack: [], progressRecords: [] },
		sessionStore: {
			async readSessionHistory() {
				return [];
			},
			async writeSessionHistory() {
				return;
			},
			async appendSessionHistory() {
				return;
			},
		},
		instructionRegistry,
		skillRegistry,
		modelRouter,
		workflowEngine: new WorkflowEngine(),
	};
}

describe("eval-design handler", () => {
	it("produces dataset and oracle guidance from eval-design signals", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalDesignModule],
			workspace: null,
		});
		const rawRequest =
			"Design an eval dataset with assertions, hard negatives, and a baseline gate";

		const result = await registry.execute(
			evalDesignManifest.id,
			{
				request: rawRequest,
				deliverable: "eval-plan design packet",
				successCriteria:
					"the plan should catch regressions before launch approval",
				options: {
					datasetStyle: "hard-negative-heavy",
					includeAssertions: true,
					sampleCount: 24,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Eval Design produced");
		expect(result.summary).not.toContain(rawRequest);
		expect(result.recommendations[0]?.detail).not.toBe(
			evalDesignManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/dataset|hard negatives|baseline/i);
		expect(allDetail).toMatch(/oracle|assertion|threshold/i);
		expect(allDetail).toContain("eval-plan design packet");
	});

	it("returns an insufficient-signal eval-design guardrail", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalDesignModule],
			workspace: null,
		});

		const result = await registry.execute(
			evalDesignManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Eval Design needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("eval-output-grading handler", () => {
	it("produces rubric and disagreement-policy guidance", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalOutputGradingModule],
			workspace: null,
		});
		const rawRequest =
			"Grade outputs with a rubric, schema checks, and pairwise adjudication for disagreement";

		const result = await registry.execute(
			evalOutputGradingManifest.id,
			{
				request: rawRequest,
				deliverable: "grading rubric specification",
				options: {
					gradingMode: "pairwise",
					includeCalibration: true,
					disagreementPolicy: "adjudicate",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Output Grading produced");
		expect(result.summary).not.toContain(rawRequest);
		expect(result.recommendations[0]?.detail).not.toBe(
			evalOutputGradingManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/rubric|schema|pairwise/i);
		expect(allDetail).toMatch(/calibration|disagreement|adjudicate/i);
		expect(allDetail).toContain("grading rubric specification");
	});

	it("guards when the grading protocol is missing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalOutputGradingModule],
			workspace: null,
		});

		const result = await registry.execute(
			evalOutputGradingManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Output Grading needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("eval-prompt handler", () => {
	it("produces prompt-eval guidance with benchmark and baseline framing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalPromptModule],
			workspace: null,
		});
		const rawRequest =
			"Evaluate the prompt variants against a benchmark, capture failure modes, and score with a vote";

		const result = await registry.execute(
			evalPromptManifest.id,
			{
				request: rawRequest,
				deliverable: "prompt-eval decision report",
				successCriteria:
					"the report should recommend whether the new prompt replaces the baseline",
				options: {
					scoreMode: "vote",
					includeBaselines: true,
					benchmarkFamily: "regression-suite",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Evaluation produced");
		expect(result.summary).not.toContain(rawRequest);
		expect(result.recommendations[0]?.detail).not.toBe(
			evalPromptManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/prompt|benchmark|baseline/i);
		expect(allDetail).toMatch(/failure|vote|tie-break/i);
		expect(allDetail).toContain("prompt-eval decision report");
	});

	it("guards when the prompt-eval surface is underspecified", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalPromptModule],
			workspace: null,
		});

		const result = await registry.execute(
			evalPromptManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Evaluation needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("eval-prompt-bench handler", () => {
	it("produces regression-aware prompt-benchmark guidance", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalPromptBenchModule],
			workspace: null,
		});
		const rawRequest =
			"Benchmark prompt variants, compare them against the baseline, and check regression across releases";

		const result = await registry.execute(
			evalPromptBenchManifest.id,
			{
				request: rawRequest,
				deliverable: "prompt benchmark ranking memo",
				options: {
					promptCount: 3,
					comparisonMode: "head-to-head",
					regressionWindow: "multi-release",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Benchmarking produced");
		expect(result.summary).not.toContain(rawRequest);
		expect(result.recommendations[0]?.detail).not.toBe(
			evalPromptBenchManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/benchmark|baseline|regression/i);
		expect(allDetail).toMatch(/head-to-head|winner|prompt count/i);
		expect(allDetail).toContain("prompt benchmark ranking memo");
	});

	it("requires prompt variants and comparison context", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalPromptBenchModule],
			workspace: null,
		});

		const result = await registry.execute(
			evalPromptBenchManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Benchmarking needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("eval-variance handler", () => {
	it("produces repeated-run variance guidance with tolerance framing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalVarianceModule],
			workspace: null,
		});
		const rawRequest =
			"Analyze variance, repeated-run noise, and flaky instability against a tolerance budget";

		const result = await registry.execute(
			evalVarianceManifest.id,
			{
				request: rawRequest,
				deliverable: "variance triage report",
				successCriteria:
					"the report should show whether instability is still inside an acceptable band",
				options: {
					runCount: 7,
					tolerancePct: 12,
					varianceSource: "model",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Variance Analysis produced");
		expect(result.summary).not.toContain(rawRequest);
		expect(result.recommendations[0]?.detail).not.toBe(
			evalVarianceManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/variance|repeat|tolerance/i);
		expect(allDetail).toMatch(/model|instability|acceptable/i);
		expect(allDetail).toContain("variance triage report");
	});

	it("guards when the instability surface is missing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [evalVarianceModule],
			workspace: null,
		});

		const result = await registry.execute(
			evalVarianceManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Variance Analysis needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});
