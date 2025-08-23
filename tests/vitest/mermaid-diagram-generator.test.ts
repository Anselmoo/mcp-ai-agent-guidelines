import { describe, expect, it } from "vitest";
import { mermaidDiagramGenerator } from "../../src/tools/mermaid-diagram-generator";

describe("mermaid-diagram-generator", () => {
	it("generates a valid flowchart with accessibility comments", async () => {
		const res = await mermaidDiagramGenerator({
			description:
				"Read users.json. Filter active users. Append to result. Output summary.",
			diagramType: "flowchart",
			accTitle: "User Processing",
			accDescr: "Reads users and filters before output",
			strict: true,
			repair: true,
		});
		const text = res.content[0].text;
		expect(text).toMatch(/```mermaid[\s\S]*flowchart TD/);
		expect(text).toMatch(/Accessibility/);
		expect(text).toMatch(/Validation/);
	});

	it("falls back to minimal diagram if invalid and strict", async () => {
		// Create something that likely fails parser (still allows fallback path)
		const res = await mermaidDiagramGenerator({
			description: "???",
			diagramType: "flowchart",
			strict: true,
			repair: false,
		});
		const text = res.content[0].text;
		expect(text).toMatch(/Diagram Code/);
		expect(text).toMatch(/flowchart TD/); // fallback diagram includes header
	});
});
