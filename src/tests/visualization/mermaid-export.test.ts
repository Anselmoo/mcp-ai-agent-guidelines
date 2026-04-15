import { describe, expect, it } from "vitest";
import {
	exportOrchestrationFlow,
	exportWorkflowDiagram,
	MermaidExporter,
} from "../../visualization/mermaid-export.js";
import { workflowSpecToMermaid } from "../../workflows/mermaid-bridge.js";
import { metaRoutingWorkflow } from "../../workflows/workflow-spec.js";

describe("exportOrchestrationFlow", () => {
	it("generates code-driven Mermaid for meta-routing", () => {
		const mermaid = exportOrchestrationFlow();
		const expected = `%% MCP Orchestration Flow: Meta-Routing\n${workflowSpecToMermaid(metaRoutingWorkflow)}`;
		expect(mermaid).toBe(expected);
		expect(mermaid).toContain("stateDiagram-v2");
		expect(mermaid).toContain("UnstructuredRequest --> SignalExploration");
		expect(mermaid).toContain("ConfidentDispatch --> RouteExecution");
	});
});

describe("MermaidExporter", () => {
	it("groups skills by domain and links instructions to normalized skill ids", () => {
		const exporter = new MermaidExporter();
		const graph = exporter.generateSkillGraph(
			[
				{ id: "qm-wavefunction-coverage", domain: "qm" },
				{ id: "gov-policy-validation", domain: "gov" },
				{ id: "gov-data-guardrails", domain: "gov" },
			],
			[
				{
					name: "meta-routing",
					skills: ["qm-wavefunction-coverage", "gov-policy-validation"],
				},
			],
		);

		expect(graph).toContain("graph TD");
		expect(graph).toContain("subgraph qm");
		expect(graph).toContain(
			'qm_wavefunction_coverage["qm-wavefunction-coverage"]',
		);
		expect(graph).toContain("subgraph gov");
		expect(graph).toContain('gov_data_guardrails["gov-data-guardrails"]');
		expect(graph).toContain("meta_routing([meta-routing])");
		expect(graph).toContain("meta_routing --> qm_wavefunction_coverage");
		expect(graph).toContain("meta_routing --> gov_policy_validation");
	});

	it("builds a linear instruction chain and skips dangling entries safely", () => {
		const exporter = new MermaidExporter();
		const graph = exporter.generateInstructionChain([
			"meta-routing",
			"implement",
			"testing",
		]);

		expect(graph).toBe(
			[
				"graph LR",
				'  meta_routing["meta-routing"] --> implement["implement"]',
				'  implement["implement"] --> testing["testing"]',
			].join("\n"),
		);
	});

	it("renders routing maps with multiple targets and normalized node ids", () => {
		const exporter = new MermaidExporter();
		const graph = exporter.generateRoutingMap(
			new Map([
				["meta-routing", ["implement", "design-review"]],
				["implement", ["testing"]],
			]),
		);

		expect(graph).toContain("graph TD");
		expect(graph).toContain(
			'  meta_routing["meta-routing"] --> implement["implement"]',
		);
		expect(graph).toContain(
			'  meta_routing["meta-routing"] --> design_review["design-review"]',
		);
		expect(graph).toContain('  implement["implement"] --> testing["testing"]');
	});
});

describe("exportWorkflowDiagram", () => {
	it("throws for unknown workflow ids", () => {
		expect(() => exportWorkflowDiagram("not-a-real-workflow")).toThrow(
			"Unknown workflow diagram: not-a-real-workflow",
		);
	});
});
