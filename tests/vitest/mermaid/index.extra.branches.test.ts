import { describe, expect, it } from "vitest";
import { FlowchartHandler } from "../../../src/tools/mermaid/handlers/flowchart.handler.js";
import {
	generateDiagram,
	mermaidDiagramGenerator,
	normalizeLegacyTypes,
} from "../../../src/tools/mermaid/index.js";
import type { MermaidDiagramInput } from "../../../src/tools/mermaid/types.js";
import { withMermaidProvider } from "../helpers/mermaid-test-utils";

describe("mermaid/index extra branches", () => {
	it("FlowchartHandler honors advancedFeatures.direction when provided directly", () => {
		// Call the handler directly to exercise advancedFeatures.direction
		const handler = new FlowchartHandler();
		const out = handler.generate("A -> B", undefined, {
			direction: "LR",
		} as any);
		expect(out).toMatch(/flowchart LR/);
	});

	it("normalizeLegacyTypes maps gitGraph and gitgraph variants", () => {
		expect(
			(normalizeLegacyTypes({ diagramType: "gitGraph" }) as any).diagramType,
		).toBe("git-graph");
		expect(
			(normalizeLegacyTypes({ diagramType: "gitgraph" }) as any).diagramType,
		).toBe("git-graph");
	});

	it("mermaidDiagramGenerator prepends accessibility comments when provided", async () => {
		await withMermaidProvider(
			() => ({ parse: () => true }),
			async () => {
				const res = await mermaidDiagramGenerator({
					diagramType: "flowchart",
					description: "A -> B",
					accTitle: "T",
					accDescr: "D",
				} as any);
				const text = res.content[0].text as string;
				expect(text).toMatch(/## Generated Mermaid Diagram/);
				expect(text).toMatch(/Title: T/);
				expect(text).toMatch(/Description: D/);
			},
		);
	});
});
