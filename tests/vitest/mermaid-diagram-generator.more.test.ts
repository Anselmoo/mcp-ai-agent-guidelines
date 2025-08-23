import { describe, expect, it } from "vitest";
import { mermaidDiagramGenerator } from "../../src/tools/mermaid-diagram-generator";

describe("mermaid-diagram-generator extras", () => {
	it("injects risk nodes when keywords are present", async () => {
		const description = [
			"Process order data.",
			"Use API key to authenticate and run raw SQL.",
			"Avoid old method in legacy step.",
		].join(" ");

		const res = await mermaidDiagramGenerator({
			description,
			diagramType: "flowchart",
			// Disable strict to avoid fallback replacing diagram when validation is unavailable
			strict: false,
			repair: true,
		});
		const text = res.content[0].text;
		expect(text).toMatch(/Hardcoded Secret/);
		expect(text).toMatch(/Raw SQL Query Risk/);
		expect(text).toMatch(/Deprecated Method/);
		// classDef risk styling injected
		expect(text).toMatch(/classDef risk/);
		expect(text).toMatch(/class [A-Z, ]+ risk;/);
	});

	it("supports non-flowchart types: sequence, class, state, gantt, pie", async () => {
		const base = "Simple description for diagram.";

		const seq = await mermaidDiagramGenerator({
			description: base,
			diagramType: "sequence",
			strict: false,
		});
		expect(seq.content[0].text).toMatch(/```mermaid[\s\S]*sequenceDiagram/);

		const cls = await mermaidDiagramGenerator({
			description: base,
			diagramType: "class",
			strict: false,
		});
		expect(cls.content[0].text).toMatch(/```mermaid[\s\S]*classDiagram/);

		const st = await mermaidDiagramGenerator({
			description: base,
			diagramType: "state",
			strict: false,
		});
		expect(st.content[0].text).toMatch(/```mermaid[\s\S]*stateDiagram-v2/);

		const gantt = await mermaidDiagramGenerator({
			description: base,
			diagramType: "gantt",
			strict: false,
		});
		expect(gantt.content[0].text).toMatch(/```mermaid[\s\S]*gantt/);

		const pie = await mermaidDiagramGenerator({
			description: base,
			diagramType: "pie",
			strict: false,
		});
		expect(pie.content[0].text).toMatch(/```mermaid[\s\S]*pie title/);
	});
});
