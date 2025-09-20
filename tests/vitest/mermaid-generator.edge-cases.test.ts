import { describe, expect, it } from "vitest";
import { mermaidDiagramGenerator } from "../../src/tools/mermaid-diagram-generator";

describe("mermaid-diagram-generator additional edge cases", () => {
	it("handles different diagram types", async () => {
		const types = ["flowchart", "sequence", "class", "state", "gantt", "pie"];
		for (const type of types) {
			const res = await mermaidDiagramGenerator({
				description: `Test ${type} diagram`,
				diagramType: type as any,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/Mermaid Diagram/);
		}
	});

	it("handles metadata flag variations", async () => {
		const res = await mermaidDiagramGenerator({
			description: "Test diagram",
			diagramType: "flowchart",
			includeMetadata: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).not.toMatch(/### Metadata/);
	});

	it("handles references flag variations", async () => {
		const res = await mermaidDiagramGenerator({
			description: "Test diagram",
			diagramType: "flowchart",
			includeReferences: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).not.toMatch(/## References/);
	});

	it("handles empty description", async () => {
		const res = await mermaidDiagramGenerator({
			description: "",
			diagramType: "flowchart",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Mermaid Diagram/);
	});
});
