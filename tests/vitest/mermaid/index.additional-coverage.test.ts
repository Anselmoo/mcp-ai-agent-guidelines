import { describe, expect, it } from "vitest";
import { formatResponse } from "../../../src/tools/mermaid/index.js";
import type { MermaidDiagramInput } from "../../../src/tools/mermaid/types.js";

describe("mermaid/index additional coverage", () => {
	it("formatResponse includes both title and description when provided", () => {
		const base = {
			diagramType: "flowchart",
			description: "My chart",
			strict: false,
			repair: false,
			accTitle: "BothTitle",
			accDescr: "BothDescr",
		} as unknown as MermaidDiagramInput;

		const res = formatResponse(
			base,
			"flowchart TD\nA-->B",
			{ valid: true },
			false,
		);
		const txt = res.content[0].text as string;
		expect(txt).toMatch(/Title: BothTitle/);
		expect(txt).toMatch(/Description: BothDescr/);
	});
});
