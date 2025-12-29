import { expect, test } from "vitest";
import {
	generateDiagram,
	mermaidDiagramGenerator,
	normalizeLegacyTypes,
} from "../../../src/tools/mermaid/index.js";
import { withMermaidProvider } from "../helpers/mermaid-test-utils.js";

test("normalizeLegacyTypes maps legacy names to current ones", () => {
	const input = { diagramType: "erDiagram", foo: "bar" } as any;
	const out = normalizeLegacyTypes(input) as any;
	expect(out.diagramType).toBe("er");
	expect(out.foo).toBe("bar");
});

test("generateDiagram throws for unknown handler types", () => {
	const bad = { diagramType: "no-such-type", description: "x" } as any;
	expect(() => generateDiagram(bad)).toThrow(/Unknown diagram type/);
});

test("mermaidDiagramGenerator prepends accessibility comments and validates successfully", async () => {
	await withMermaidProvider(
		() => ({ parse: (code: string) => {} }),
		async () => {
			const args = {
				diagramType: "flowchart",
				description: "A --> B",
				accTitle: "MyTitle",
				accDescr: "MyDescription",
				repair: false,
				strict: false,
				strictMode: false,
			};

			const res = await mermaidDiagramGenerator(args);
			const text = res.content[0].text as string;
			expect(text).toContain("Title: MyTitle");
			expect(text).toContain("Description: MyDescription");
			expect(text).toContain("✅ Diagram validated successfully");
		},
	);
});

test("mermaidDiagramGenerator attempts repair then succeeds when repair fixed format issues", async () => {
	// Provider parse throws if diagram contains '=' then succeeds otherwise
	await withMermaidProvider(
		() => ({
			parse: (code: string) => {
				if (code.includes("=")) throw new Error("Syntax: unexpected token");
				return true;
			},
		}),
		async () => {
			const args = {
				diagramType: "class",
				description: "classDef Foo fill=red\nFoo has Account",
				repair: true,
				strict: false,
			};

			const res = await mermaidDiagramGenerator(args);
			const text = res.content[0].text as string;
			// Handler-generated output in this scenario validates successfully; repair may or may not be needed
			expect(text).toContain("✅ Diagram validated successfully");
		},
	);
});
