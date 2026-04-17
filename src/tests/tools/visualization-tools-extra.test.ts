import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it, vi } from "vitest";
import {
	dispatchVisualizationToolCall,
} from "../../tools/visualization-tools.js";

function getFirstText(result: CallToolResult) {
	const first = result.content[0];
	return first && "text" in first ? first.text : "";
}

describe("visualization-tools-extra", () => {
	// -------------------------------------------------------------------------
	// SVG format – chain-graph (line 174)
	// -------------------------------------------------------------------------
	it("chain-graph SVG renders agent topology diagram", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "chain-graph",
			format: "svg",
		});
		expect(result.isError).toBe(false);
		const text = getFirstText(result);
		expect(text).toContain("<svg");
	});

	// -------------------------------------------------------------------------
	// SVG format – skill-graph (line 195)
	// -------------------------------------------------------------------------
	it("skill-graph SVG renders skill coverage diagram", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "skill-graph",
			format: "svg",
		});
		expect(result.isError).toBe(false);
		const text = getFirstText(result);
		expect(text).toContain("<svg");
	});

	// -------------------------------------------------------------------------
	// SVG format – instruction-chain (ensure still works, regression)
	// -------------------------------------------------------------------------
	it("instruction-chain SVG produces orchestration flow SVG", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "instruction-chain",
			format: "svg",
		});
		expect(result.isError).toBe(false);
		const text = getFirstText(result);
		expect(text).toContain("<svg");
	});

	// -------------------------------------------------------------------------
	// SVG format – domain-focus (ensure still works, regression)
	// -------------------------------------------------------------------------
	it("domain-focus SVG renders agent topology for the given domain", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "domain-focus",
			domain: "qm",
			format: "svg",
		});
		expect(result.isError).toBe(false);
		const text = getFirstText(result);
		expect(text).toContain("<svg");
	});

	// -------------------------------------------------------------------------
	// domain-focus without domain – error path (lines 120/151)
	// -------------------------------------------------------------------------
	it("domain-focus without domain parameter returns an error", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "domain-focus",
		});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toContain("domain");
	});

	it("domain-focus with empty string domain returns an error", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "domain-focus",
			domain: "   ",
		});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toContain("domain");
	});

	// -------------------------------------------------------------------------
	// domain-focus with valid domain (lines 154/157 – mermaid path)
	// -------------------------------------------------------------------------
	it("domain-focus mermaid path renders a subgraph for the given domain", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "domain-focus",
			domain: "qm",
			format: "mermaid",
		});
		expect(result.isError).toBe(false);
		expect(getFirstText(result)).toContain("subgraph qm");
	});

	// -------------------------------------------------------------------------
	// Error thrown inside dispatch catch block (line 356)
	// -------------------------------------------------------------------------
	it("dispatch catch block returns error when a view function throws", async () => {
		// Trigger the catch block by passing an invalid (unknown) domain for
		// domain-focus – getDomainSkills throws which lands in the outer catch.
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "domain-focus",
			domain: "nonexistent-domain-xyz",
		});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toContain("No skills found");
	});

	it("dispatch catch block returns error when SVG domain-focus throws for unknown domain", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "domain-focus",
			domain: "totally-fake-domain",
			format: "svg",
		});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toContain("No skills found");
	});

	// -------------------------------------------------------------------------
	// Default mermaid format when format is omitted
	// -------------------------------------------------------------------------
	it("omitting format defaults to mermaid output", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "skill-graph",
		});
		expect(result.isError).toBe(false);
		expect(getFirstText(result)).toContain("graph TD");
	});

	// -------------------------------------------------------------------------
	// Unknown view returns an error (mermaid path default case)
	// -------------------------------------------------------------------------
	it("unknown view returns an error message", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "totally-unknown",
		});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toMatch(/Unknown view/i);
	});

	// -------------------------------------------------------------------------
	// Unknown tool name
	// -------------------------------------------------------------------------
	it("unknown tool name returns an error", async () => {
		const result = await dispatchVisualizationToolCall("not-a-tool", {});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toContain("Unknown visualization tool");
	});
});
