import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchVisualizationToolCall } from "../../tools/visualization-tools.js";

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
			domain: "adapt",
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
			domain: "adapt",
			format: "mermaid",
		});
		expect(result.isError).toBe(false);
		expect(getFirstText(result)).toContain("subgraph adapt");
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

	// -------------------------------------------------------------------------
	// SVG format – unknown view hits the default case of the SVG switch
	// (mirrors the mermaid "Unknown view" test but for the format === "svg"
	// branch, which has its own independent switch statement).
	// -------------------------------------------------------------------------
	it("unknown view with svg format returns an error via the SVG default case", async () => {
		const result = await dispatchVisualizationToolCall("graph-visualize", {
			view: "totally-unknown",
			format: "svg",
		});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toMatch(/Unknown view/i);
	});
});

// ---------------------------------------------------------------------------
// Empty edge-category branches in generateColoredChainGraph
//
// The real INSTRUCTION_SPECS dataset always contains at least one workflow-,
// specialist-, and gated-classified chainTo edge, so the "no edges of this
// kind" (false) branches of the `workflowEdges.length > 0` /
// `specialistEdges.length > 0` / `gatedEdges.length > 0` checks can only be
// exercised by supplying a spec set that has none of those edge kinds. This
// mocks the instruction-specs module (a static, hand-authored dataset) to
// provide such a set.
// ---------------------------------------------------------------------------
describe("visualization-tools-extra: chain-graph with no classified edges", () => {
	afterEach(() => {
		vi.doUnmock("../../instructions/instruction-specs.js");
		vi.resetModules();
	});

	it("omits linkStyle lines for edge kinds that have no members", async () => {
		vi.resetModules();
		vi.doMock("../../instructions/instruction-specs.js", async () => {
			const actual = await vi.importActual<
				typeof import("../../instructions/instruction-specs.js")
			>("../../instructions/instruction-specs.js");
			return {
				...actual,
				INSTRUCTION_SPECS: [
					{
						id: "discovery-only",
						public: true,
						surface: "discovery",
						chainTo: ["discovery-target"],
					},
					{
						id: "discovery-target",
						public: true,
						surface: "discovery",
						chainTo: [],
					},
				],
			};
		});

		const { dispatchVisualizationToolCall: dispatchWithMockedSpecs } =
			await import("../../tools/visualization-tools.js");

		const result = await dispatchWithMockedSpecs("graph-visualize", {
			view: "chain-graph",
		});
		expect(result.isError).toBe(false);
		const text = getFirstText(result);
		expect(text).toContain("discovery_only --> discovery_target");
		expect(text).not.toContain("linkStyle");
	});
});
