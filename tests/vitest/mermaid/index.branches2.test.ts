import { expect, test } from "vitest";
import {
	generateDiagram,
	HANDLER_REGISTRY,
	mermaidDiagramGenerator,
	normalizeLegacyTypes,
} from "../../../src/tools/mermaid/index.js";
import { withMermaidProvider } from "../helpers/mermaid-test-utils.js";

test("normalizeLegacyTypes maps legacy names to current types", () => {
	expect(
		(normalizeLegacyTypes({ diagramType: "erDiagram" }) as any).diagramType,
	).toBe("er");
	expect(
		(normalizeLegacyTypes({ diagramType: "graph" }) as any).diagramType,
	).toBe("flowchart");
	expect(
		(normalizeLegacyTypes({ diagramType: "userJourney" }) as any).diagramType,
	).toBe("journey");
	expect(
		(normalizeLegacyTypes({ diagramType: "gitgraph" }) as any).diagramType,
	).toBe("git-graph");
	expect(
		(normalizeLegacyTypes({ diagramType: "gitGraph" }) as any).diagramType,
	).toBe("git-graph");
});

test("generateDiagram throws for unknown diagram type", () => {
	const badInput = {
		diagramType: "nope",
		description: "x",
		theme: "",
		advancedFeatures: {},
	} as any;
	expect(() => generateDiagram(badInput)).toThrow(/Unknown diagram type/);
});

test("mermaidDiagramGenerator prepends accessibility comments when provided", async () => {
	await withMermaidProvider(
		() => ({ parse: (code: string) => {} }), // always succeeds
		async () => {
			const resp: any = await mermaidDiagramGenerator({
				diagramType: "flowchart",
				description: "User -> System",
				accTitle: "My Diagram",
				accDescr: "Useful description",
				strict: false,
				repair: false,
				theme: "",
				advancedFeatures: {},
			} as any);

			expect(resp).toBeDefined();
			const text = resp.content[0].text as string;
			expect(text).toContain("- Title: My Diagram");
			expect(text).toContain("- Description: Useful description");
			expect(text).toContain("```mermaid");
			// The generated diagram body should include "User" and "System"
			expect(text).toContain("User");
			expect(text).toContain("System");
		},
	);
});

test("mermaidDiagramGenerator attempts repair when validation fails and repair=true", async () => {
	// Temporarily replace flowchart handler to emit a diagram that needs a header
	const orig = HANDLER_REGISTRY.flowchart;
	(HANDLER_REGISTRY as any).flowchart = {
		generate: () => "prefix flowchart node A --> B", // contains 'flowchart' but not at start so repair adds header
	} as any;

	// Provider: fail parse for original diagram but succeed for repaired (which includes 'flowchart TD')
	await withMermaidProvider(
		() => ({
			parse(code: string) {
				if (/flowchart TD/.test(code)) return; // repaired passes
				throw new Error("syntax error"); // original fails
			},
		}),
		async () => {
			const resp: any = await mermaidDiagramGenerator({
				diagramType: "flowchart",
				description: "do something flowchart-like",
				strict: false,
				repair: true,
				theme: "",
				advancedFeatures: {},
			} as any);

			const text = resp.content[0].text as string;
			expect(text).toContain("(after auto-repair)");
			// Repaired content should include the header we expect
			expect(text).toContain("flowchart TD");
		},
	);

	// Restore original
	HANDLER_REGISTRY.flowchart = orig;
});

test("mermaidDiagramGenerator falls back to minimal diagram when strict=true and invalid", async () => {
	const orig = HANDLER_REGISTRY.flowchart;
	(HANDLER_REGISTRY as any).flowchart = {
		generate: () => "this is completely invalid mermaid code",
	} as any;

	await withMermaidProvider(
		() => ({
			parse(code: string) {
				if (code.includes("Fallback Diagram")) return; // accept fallback
				throw new Error("parse failed");
			},
		}),
		async () => {
			const resp: any = await mermaidDiagramGenerator({
				diagramType: "flowchart",
				description: "bad",
				strict: true,
				repair: false,
				theme: "",
				advancedFeatures: {},
			} as any);

			const text = resp.content[0].text as string;
			// Should include fallback diagram code
			expect(text).toContain("Fallback Diagram");
		},
	);

	HANDLER_REGISTRY.flowchart = orig;
});

test("mermaidDiagramGenerator includes feedback when diagram invalid and not strict/repaired", async () => {
	const orig = HANDLER_REGISTRY.flowchart;
	(HANDLER_REGISTRY as any).flowchart = {
		generate: () => "still invalid mermaid",
	} as any;

	await withMermaidProvider(
		() => ({
			parse: (code: string) => {
				throw new Error("fatal parse error");
			},
		}),
		async () => {
			const resp: any = await mermaidDiagramGenerator({
				diagramType: "flowchart",
				description: "bad",
				strict: false,
				repair: false,
				theme: "",
				advancedFeatures: {},
			} as any);

			const text = resp.content[0].text as string;
			expect(text).toContain("### Feedback Loop");
		},
	);

	HANDLER_REGISTRY.flowchart = orig;
});
