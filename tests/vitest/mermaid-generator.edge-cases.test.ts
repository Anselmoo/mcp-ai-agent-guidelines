import { describe, expect, it } from "vitest";
import { mermaidDiagramGenerator } from "../../src/tools/mermaid/index";

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

	it("rejects invalid diagram type", async () => {
		await expect(
			mermaidDiagramGenerator({
				description: "Invalid type",
				diagramType: "not-real" as any,
			}),
		).rejects.toThrow(/Invalid enum value/i);
	});

	it("handles extremely long descriptions", async () => {
		const longDescription = "A".repeat(5000);
		const res = await mermaidDiagramGenerator({
			description: longDescription,
			diagramType: "flowchart",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toContain(longDescription.slice(0, 100));
	});

	it("preserves special characters in descriptions", async () => {
		const specialDescription = `Nodes & relationships <A> -> "B" & 'C'`;
		const res = await mermaidDiagramGenerator({
			description: specialDescription,
			diagramType: "flowchart",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toContain(specialDescription);
	});
});
