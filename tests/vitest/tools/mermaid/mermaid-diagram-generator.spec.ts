import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	__setMermaidModuleProvider,
	mermaidDiagramGenerator,
} from "../../../../src/tools/mermaid-diagram-generator.js";

beforeEach(() => {
	// reset provider
	__setMermaidModuleProvider(null);
});

afterEach(() => {
	__setMermaidModuleProvider(null);
});

describe("mermaidDiagramGenerator - validation branches", () => {
	it("validates successfully when provider parse succeeds", async () => {
		__setMermaidModuleProvider(() => ({ parse: (_code: string) => {} }));
		const res = await mermaidDiagramGenerator({
			description: "simple flow",
			diagramType: "flowchart",
		});
		expect(res.content[0].text).toContain("✅ Diagram validated successfully");
	});

	it("supports different module shapes (function/default/parse) and returns valid/skipped appropriately", async () => {
		// module as function
		__setMermaidModuleProvider(() => (code: string) => {});
		let res = await mermaidDiagramGenerator({
			description: "a",
			diagramType: "flowchart",
		});
		expect(res.content[0].text).toContain("✅ Diagram validated successfully");

		// module with parse property
		__setMermaidModuleProvider(() => ({ parse: (_: string) => {} }));
		res = await mermaidDiagramGenerator({
			description: "a",
			diagramType: "flowchart",
		});
		expect(res.content[0].text).toContain("✅ Diagram validated successfully");

		// module default as function
		__setMermaidModuleProvider(() => ({ default: (_: string) => {} }));
		res = await mermaidDiagramGenerator({
			description: "a",
			diagramType: "flowchart",
		});
		expect(res.content[0].text).toContain("✅ Diagram validated successfully");

		// module default.parse style
		__setMermaidModuleProvider(() => ({
			default: { parse: (_: string) => {} },
		}));
		res = await mermaidDiagramGenerator({
			description: "a",
			diagramType: "flowchart",
		});
		expect(res.content[0].text).toContain("✅ Diagram validated successfully");
	});

	it("skips validation when provider returns null or parse unavailable", async () => {
		__setMermaidModuleProvider(() => null);
		const res = await mermaidDiagramGenerator({
			description: "simple flow",
			diagramType: "flowchart",
			repair: false,
		});
		expect(res.content[0].text).toContain("Validation skipped");
	});

	it("reports invalid when parse throws non-skip error and repair attempted", async () => {
		__setMermaidModuleProvider(() => ({
			parse: () => {
				throw new Error("unexpected parse failure");
			},
		}));
		const res = await mermaidDiagramGenerator({
			description: "broken: /* invalid */",
			diagramType: "flowchart",
			repair: true,
			strict: false,
		});
		expect(res.content[0].text).toMatch(/❌ Diagram invalid|Feedback Loop/);
	});
});
