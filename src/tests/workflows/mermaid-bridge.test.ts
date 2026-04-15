import { describe, expect, it } from "vitest";
import { workflowSpecToMermaid } from "../../workflows/mermaid-bridge.js";
import {
	adaptWorkflow,
	debugWorkflow,
	documentWorkflow,
	evaluateWorkflow,
	governWorkflow,
	implementWorkflow,
	metaRoutingWorkflow,
	orchestrateWorkflow,
	physicsAnalysisWorkflow,
	promptEngineeringWorkflow,
	resilienceWorkflow,
	reviewWorkflow,
	WORKFLOW_SPECS,
} from "../../workflows/workflow-spec.js";

interface MermaidTransition {
	from: string;
	to: string;
	label?: string;
}

function extractMermaidTransitions(mermaid: string): MermaidTransition[] {
	return mermaid
		.split("\n")
		.map((line) => line.trim())
		.flatMap((line) => {
			const [from, rest] = line.split(/\s+-->\s+/u);
			if (!from || !rest) {
				return [];
			}

			const labelSeparator = ": ";
			const labelIndex = rest.indexOf(labelSeparator);
			const to =
				labelIndex === -1 ? rest.trim() : rest.slice(0, labelIndex).trim();
			const label =
				labelIndex === -1
					? undefined
					: rest.slice(labelIndex + labelSeparator.length).trim();
			if (from.trim() === "[*]" || to === "[*]") {
				return [];
			}

			return [
				{
					from: from.trim(),
					to,
					...(label ? { label: label.trim() } : {}),
				},
			];
		});
}

describe("workflowSpecToMermaid", () => {
	// ── baseline ──────────────────────────────────────────────────────────────

	it("renders stateDiagram-v2 for meta-routing", () => {
		const mermaid = workflowSpecToMermaid(metaRoutingWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(mermaid).toContain("stateDiagram-v2");
		expect(transitions).toContainEqual({
			from: "UnstructuredRequest",
			to: "SignalExploration",
		});
		expect(transitions).toContainEqual({
			from: "ConfidentDispatch",
			to: "RouteExecution",
		});
	});

	it("renders labeled transitions correctly (debug)", () => {
		const mermaid = workflowSpecToMermaid(debugWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(mermaid).toContain("stateDiagram-v2");
		expect(transitions).toContainEqual({
			from: "ReproductionPlan",
			to: "Triage",
			label: "cannot reproduce — gather more context",
		});
	});

	it("renders fan-out transitions (review)", () => {
		const mermaid = workflowSpecToMermaid(reviewWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(
			transitions.filter(({ from }) => from === "ParallelReviewFanOut"),
		).toEqual(
			expect.arrayContaining([
				{ from: "ParallelReviewFanOut", to: "QualityReview" },
				{ from: "ParallelReviewFanOut", to: "SecurityReview" },
				{ from: "ParallelReviewFanOut", to: "PerformanceReview" },
			]),
		);
		expect(transitions).toContainEqual({
			from: "FinalJudgment",
			to: "Approved",
			label: "all gates pass",
		});
		expect(transitions).toContainEqual({
			from: "FinalJudgment",
			to: "Rejected",
			label: "critical issue detected",
		});
	});

	it("renders fan-in transitions (document)", () => {
		const mermaid = workflowSpecToMermaid(documentWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(
			transitions
				.filter(({ to }) => to === "DocSynthesis")
				.map(({ from }) => from),
		).toEqual(
			expect.arrayContaining([
				"ApiDoc",
				"ReadmeGen",
				"RunbookGen",
				"FullDocGen",
			]),
		);
	});

	// ── new batch ─────────────────────────────────────────────────────────────

	it("renders regression loop-back label (evaluate)", () => {
		const mermaid = workflowSpecToMermaid(evaluateWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(transitions).toContainEqual({
			from: "PromptBenchRegression",
			to: "EvalSuiteDesign",
			label: "regression found — re-run with adjusted rubric",
		});
		expect(transitions).toContainEqual({
			from: "PromptBenchRegression",
			to: "EvalComplete",
			label: "no regressions detected",
		});
	});

	it("preserves labels that contain additional colons", () => {
		const mermaid = workflowSpecToMermaid(implementWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(transitions).toContainEqual({
			from: "HomeostaticLoop",
			to: "StaticAnalysis",
			label: "retry: iteration < 3",
		});
	});

	it("renders quantum-to-gravity bridge transition (physics-analysis)", () => {
		const mermaid = workflowSpecToMermaid(physicsAnalysisWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(transitions).toContainEqual({
			from: "EventHorizonScan",
			to: "EntanglementMap",
		});
		expect(transitions).toContainEqual({
			from: "UncertaintyCoupling",
			to: "SpacetimeDebt",
		});
		expect(transitions).toContainEqual({
			from: "RedshiftAbstraction",
			to: "GeodesicPath",
		});
	});

	it("renders multi-convergence at TopologyApply (adapt)", () => {
		const mermaid = workflowSpecToMermaid(adaptWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		for (const from of [
			"HebbianAgentPairing",
			"QuorumCoordination",
			"CloneMutateRepair",
			"ReplayConsolidation",
		]) {
			expect(transitions, `${from} -> TopologyApply`).toContainEqual({
				from,
				to: "TopologyApply",
			});
		}
	});

	it("renders compliance gate labels (govern)", () => {
		const mermaid = workflowSpecToMermaid(governWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(transitions).toContainEqual({
			from: "ComplianceGate",
			to: "ModelGovernance",
			label: "workflow compliant",
		});
		expect(transitions).toContainEqual({
			from: "ComplianceGate",
			to: "ViolationThrowback",
			label: "violation found",
		});
	});

	it("renders double fan-out and fan-in (orchestrate)", () => {
		const mermaid = workflowSpecToMermaid(orchestrateWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(transitions).toContainEqual({
			from: "MultiAgentArchitecture",
			to: "DelegationStrategy",
		});
		expect(transitions).toContainEqual({
			from: "MultiAgentArchitecture",
			to: "MembraneEncapsulation",
		});
		expect(transitions).toContainEqual({
			from: "ModeSwitching",
			to: "ResultAssembly",
		});
		expect(transitions).toContainEqual({
			from: "ContextHandoff",
			to: "ResultAssembly",
		});
	});

	it("renders improvement cycle labels (prompt-engineering)", () => {
		const mermaid = workflowSpecToMermaid(promptEngineeringWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(transitions).toContainEqual({
			from: "BenchRegression",
			to: "RefinementLoop",
			label: "score did not improve",
		});
		expect(transitions).toContainEqual({
			from: "BenchRegression",
			to: "Certified",
			label: "score strictly higher than baseline",
		});
		expect(transitions).toContainEqual({
			from: "RefinementLoop",
			to: "EvalRun",
		});
	});

	it("renders dual fan-out and convergence (resilience)", () => {
		const mermaid = workflowSpecToMermaid(resilienceWorkflow);
		const transitions = extractMermaidTransitions(mermaid);

		expect(transitions).toContainEqual({
			from: "HomeostaticMonitor",
			to: "RedundantVoter",
		});
		expect(transitions).toContainEqual({
			from: "HomeostaticMonitor",
			to: "MembraneIsolation",
		});
		expect(transitions).toContainEqual({
			from: "ReplayLearning",
			to: "PostmortemSynthesis",
		});
		expect(transitions).toContainEqual({
			from: "ReliabilityArchitecture",
			to: "PostmortemSynthesis",
		});
	});

	// ── parametric golden test: covers all 20 registered workflows ────────────

	it("produces valid stateDiagram-v2 with every transition for all 20 registered workflows", () => {
		for (const spec of WORKFLOW_SPECS) {
			const mermaid = workflowSpecToMermaid(spec);
			const transitions = extractMermaidTransitions(mermaid);

			expect(mermaid, `${spec.key}: must start with stateDiagram-v2`).toMatch(
				/^stateDiagram-v2/,
			);
			expect(transitions, `${spec.key}: transition contract mismatch`).toEqual(
				spec.transitions,
			);
		}
	});
});
