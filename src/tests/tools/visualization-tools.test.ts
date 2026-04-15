import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";
import {
	dispatchVisualizationToolCall,
	VISUALIZATION_TOOL_DEFINITIONS,
	VISUALIZATION_TOOL_VALIDATORS,
} from "../../tools/visualization-tools.js";

function getFirstText(result: CallToolResult) {
	const first = result.content[0];
	return first && "text" in first ? first.text : "";
}

describe("visualization tool definitions", () => {
	it("exposes a single graph-visualize tool", () => {
		expect(VISUALIZATION_TOOL_DEFINITIONS).toHaveLength(1);
		expect(VISUALIZATION_TOOL_DEFINITIONS[0]?.name).toBe("graph-visualize");
	});

	it("has a validator for the graph-visualize tool", () => {
		expect(VISUALIZATION_TOOL_VALIDATORS.has("graph-visualize")).toBe(true);
	});
});

describe("dispatchVisualizationToolCall", () => {
	it("returns error for unknown tool name", async () => {
		const result = await dispatchVisualizationToolCall("unknown", {});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toContain("Unknown visualization tool");
	});

	describe("chain-graph view", () => {
		it("generates a Mermaid graph with color-coded classDefs", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "chain-graph",
			});
			expect(result.isError).toBe(false);
			const text = getFirstText(result);
			expect(text).toContain("graph TD");
			expect(text).toContain("classDef workflow");
			expect(text).toContain("classDef specialist");
			expect(text).toContain("classDef gated");
			expect(text).toContain("classDef terminal");
		});

		it("includes known chainTo edges", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "chain-graph",
			});
			const text = getFirstText(result);
			expect(text).toContain("design --> feature_implement");
			expect(text).toContain("implement --> test_verify");
		});

		it("applies linkStyle for colored edges", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "chain-graph",
			});
			const text = getFirstText(result);
			expect(text).toContain("linkStyle");
			expect(text).toContain("stroke:#4a90d9");
		});
	});

	describe("skill-graph view", () => {
		it("generates a Mermaid graph with domain subgraphs", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "skill-graph",
			});
			expect(result.isError).toBe(false);
			const text = getFirstText(result);
			expect(text).toContain("graph TD");
			expect(text).toContain("subgraph");
		});
	});

	describe("instruction-chain view", () => {
		it("generates a linear LR graph of workflow instructions", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "instruction-chain",
			});
			expect(result.isError).toBe(false);
			const text = getFirstText(result);
			expect(text).toContain("graph LR");
			expect(text).toContain("design");
			expect(text).toContain("implement");
		});

		it("renders SVG output when requested", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "instruction-chain",
				format: "svg",
			});
			expect(result.isError).toBe(false);
			const text = getFirstText(result);
			expect(text).toContain("<svg");
			expect(text).toContain("Workflow steps");
			expect(text).toContain("design");
		});
	});

	describe("domain-focus view", () => {
		it("filters skills to the given domain", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "domain-focus",
				domain: "qm",
			});
			expect(result.isError).toBe(false);
			const text = getFirstText(result);
			expect(text).toContain("subgraph qm");
		});

		it("returns error for missing domain parameter", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "domain-focus",
			});
			expect(result.isError).toBe(true);
			expect(getFirstText(result)).toContain("domain");
		});

		it("returns error for unknown domain", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "domain-focus",
				domain: "nonexistent",
			});
			expect(result.isError).toBe(true);
			expect(getFirstText(result)).toContain("No skills found");
		});

		it("renders SVG output with glyph-labelled skills", async () => {
			const result = await dispatchVisualizationToolCall("graph-visualize", {
				view: "domain-focus",
				domain: "qm",
				format: "svg",
			});
			expect(result.isError).toBe(false);
			const text = getFirstText(result);
			expect(text).toContain("<svg");
			expect(text).toContain("Agent topology");
			expect(text).toContain("qm-");
		});
	});

	it("returns error for unknown view", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "invalid-view",
		});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toContain("Unknown view");
	});
});
