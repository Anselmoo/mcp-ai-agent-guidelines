import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as benchAnalyzerModule } from "../skills/bench/bench-analyzer.js";
import { skillModule as benchBlindComparisonModule } from "../skills/bench/bench-blind-comparison.js";
import { skillModule as benchEvalSuiteModule } from "../skills/bench/bench-eval-suite.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

const benchAnalyzerManifest = benchAnalyzerModule.manifest;
const benchBlindComparisonManifest = benchBlindComparisonModule.manifest;
const benchEvalSuiteManifest = benchEvalSuiteModule.manifest;

function createWorkflowRuntime() {
	const instructionRegistry = new InstructionRegistry();
	const skillRegistry = new SkillRegistry({ workspace: null });
	const modelRouter = new ModelRouter();

	return {
		sessionId: "test-bench",
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

describe("bench-analyzer handler", () => {
	it("produces baseline-aware regression analysis guidance", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchAnalyzerModule],
			workspace: null,
		});
		const rawRequest =
			"Analyze benchmark regression trend, outlier spikes, and tenant segmentation before release";

		const result = await registry.execute(
			benchAnalyzerManifest.id,
			{
				request: rawRequest,
				deliverable: "release benchmark review packet",
				successCriteria:
					"identify whether the quality drop is real and whether rollback is warranted",
				options: {
					analysisLens: "regression",
					includeOutliers: true,
					baselineRequired: true,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Benchmark Analyzer produced");
		expect(result.summary).not.toContain(rawRequest);
		expect(result.recommendations[0]?.detail).not.toBe(
			benchAnalyzerManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/baseline|regression/i);
		expect(allDetail).toMatch(/outlier|tenant|segment/i);
		expect(allDetail).toContain("release benchmark review packet");
	});

	it("returns an insufficient-signal guardrail for underspecified input", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchAnalyzerModule],
			workspace: null,
		});

		const result = await registry.execute(
			benchAnalyzerManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Benchmark Analyzer needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("bench-blind-comparison handler", () => {
	it("produces blinded comparison guidance with tie handling", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchBlindComparisonModule],
			workspace: null,
		});
		const rawRequest =
			"Run a blind pairwise comparison, control ordering bias, and adjudicate split votes";

		const result = await registry.execute(
			benchBlindComparisonManifest.id,
			{
				request: rawRequest,
				deliverable: "pairwise comparison decision memo",
				options: {
					blindLevel: "double-blind",
					comparisonMode: "pairwise",
					tiePolicy: "judge-model",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Blind Comparison produced");
		expect(result.summary).not.toContain(rawRequest);
		expect(result.recommendations[0]?.detail).not.toBe(
			benchBlindComparisonManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/blind|provenance|bias/i);
		expect(allDetail).toMatch(/pairwise|tie policy|judge-model/i);
		expect(allDetail).toContain("pairwise comparison decision memo");
	});

	it("requires a comparison protocol instead of generic input", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchBlindComparisonModule],
			workspace: null,
		});

		const result = await registry.execute(
			benchBlindComparisonManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Blind Comparison needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("bench-eval-suite handler", () => {
	it("produces multi-dimensional eval-suite guidance", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchEvalSuiteModule],
			workspace: null,
		});
		const rawRequest =
			"Design an eval suite framework with safety, latency, and hard negative coverage";

		const result = await registry.execute(
			benchEvalSuiteManifest.id,
			{
				request: rawRequest,
				deliverable: "release-gate eval suite specification",
				successCriteria:
					"the suite should support a clear ship or no-ship decision",
				options: {
					dimensions: ["accuracy", "safety", "latency"],
					includeHardNegatives: true,
					judgeStrategy: "schema",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Eval Suite Designer produced");
		expect(result.summary).not.toContain(rawRequest);
		expect(result.recommendations[0]?.detail).not.toBe(
			benchEvalSuiteManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/dimension|dataset slice|threshold/i);
		expect(allDetail).toMatch(/hard negatives|safety|latency/i);
		expect(allDetail).toContain("release-gate eval suite specification");
	});

	it("guards when suite dimensions and grading are missing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchEvalSuiteModule],
			workspace: null,
		});

		const result = await registry.execute(
			benchEvalSuiteManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Eval Suite Designer needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

// Option-focused tests (surgical additions)

describe("bench-analyzer options", () => {
	it("respects explicit options and summarizes correctly", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchAnalyzerModule],
			workspace: null,
		});
		const rawRequest = "Check regress trend outlier segmentation";

		const result = await registry.execute(
			benchAnalyzerManifest.id,
			{
				request: rawRequest,
				options: {
					analysisLens: "regression",
					includeOutliers: false,
					baselineRequired: false,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// Should reference lens and outlier/baseline statuses in summary
		expect(result.summary).toMatch(/regression|regress/i);
		expect(result.summary).toMatch(/outlier|outliers|omitted/i);
		expect(result.summary).toMatch(/baseline|optional|required/i);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/regress|trend|outlier/i);
	});

	it("defaults options when omitted", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchAnalyzerModule],
			workspace: null,
		});
		const rawRequest = "Check segment metric behavior";

		const result = await registry.execute(
			benchAnalyzerManifest.id,
			{ request: rawRequest },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// defaults should mention lens/outliers/baseline in some form
		expect(result.summary).toMatch(/lens|outlier|baseline/i);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/segment|metric/i);
	});
});

describe("bench-eval-suite options", () => {
	it("honors provided options for dimensions, hard negatives, and judgeStrategy", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchEvalSuiteModule],
			workspace: null,
		});

		const result = await registry.execute(
			benchEvalSuiteManifest.id,
			{
				request:
					"Design an eval suite for accuracy and latency with hard negative coverage",
				options: {
					dimensions: ["accuracy", "latency"],
					includeHardNegatives: false,
					judgeStrategy: "pairwise",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/dimension|dimensions/i);
		expect(result.summary).toMatch(
			/hard negatives|hard negative|hard-negatives|omitted/i,
		);
		expect(result.summary).toMatch(/pairwise|judge/i);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/accuracy|latency|hard negatives|adversarial/i);
	});
});

describe("bench-blind-comparison options", () => {
	it("reports provided blind/comparison/tie options and includes rule matches", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [benchBlindComparisonModule],
			workspace: null,
		});

		const result = await registry.execute(
			benchBlindComparisonManifest.id,
			{
				request:
					"Run a blind pairwise comparison to control bias and adjudicate ties",
				options: {
					blindLevel: "double-blind",
					comparisonMode: "pairwise",
					tiePolicy: "judge-model",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(
			/pairwise|mode|blind level|tie policy|judge-model/i,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/blind|pairwise|tie policy|judge-model/i);
	});
});
