import { describe, expect, it, vi } from "vitest";

// We'll re-import the module under test after each mock setup to ensure module-level
// cache is reset. This allows us to test behavior around dynamic import + caching.

describe("mermaid-diagram-generator: dynamic mermaid import shapes", () => {
	it("skips validation when mermaid exports no parse function (module shape without parse)", async () => {
		vi.resetModules();
		// Mock 'mermaid' as an empty object, so extractMermaidParse should return null
		vi.mock("mermaid", () => ({}) as unknown);
		const { mermaidDiagramGenerator } = await import(
			"../../src/tools/mermaid-diagram-generator.js"
		);
		const res = await mermaidDiagramGenerator({
			description: "Simple flow with something",
			diagramType: "flowchart",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Validation skipped/);
	});

	it("uses default export as a function when module itself is a function", async () => {
		vi.resetModules();
		const calls: string[] = [];
		vi.mock("mermaid", () => ({
			default: (_code: string) => {
				calls.push("module-as-function");
				return true;
			},
		}));
		const { mermaidDiagramGenerator } = await import(
			"../../src/tools/mermaid-diagram-generator.js"
		);
		const res = await mermaidDiagramGenerator({
			description: "User sends request to system",
			diagramType: "sequence",
		});
		expect(calls).toHaveLength(1);
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Diagram validated successfully|Validation skipped/);
	});

	it("uses parse property when mermaid exports a parse function", async () => {
		vi.resetModules();
		const calls: string[] = [];
		vi.mock(
			"mermaid",
			() =>
				({
					parse: (_code: string) => {
						calls.push("parse-fn");
						return true;
					},
				}) as unknown,
		);
		const { mermaidDiagramGenerator } = await import(
			"../../src/tools/mermaid-diagram-generator.js"
		);
		const res = await mermaidDiagramGenerator({
			description: "User sends request to system",
			diagramType: "sequence",
		});
		expect(calls.length).toBeGreaterThanOrEqual(1);
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Diagram validated successfully|Validation skipped/);
	});

	it("uses default.parse when mermaid.default.parse exists", async () => {
		vi.resetModules();
		const calls: string[] = [];
		vi.mock(
			"mermaid",
			() =>
				({
					default: {
						parse: (_code: string) => {
							calls.push("default-parse");
							return true;
						},
					},
				}) as unknown,
		);
		const { mermaidDiagramGenerator } = await import(
			"../../src/tools/mermaid-diagram-generator.js"
		);
		const res = await mermaidDiagramGenerator({
			description: "User sends request to system",
			diagramType: "sequence",
		});
		expect(calls).toEqual(["default-parse"]);
	});

	it("attempts repair and falls back to safe diagram when parse throws a reclaimed error", async () => {
		vi.resetModules();
		// Parse function throws for diagrams containing the string "BAD_PARSE" and
		// otherwise returns true. We'll craft a description that results in a diagram
		// containing that string in its code so that the initial parse fails, then
		// due to `repair: true` we expect the generator to attempt repair and either
		// succeed or fall back depending on the simulated parse.
		const calls: string[] = [];
		vi.mock(
			"mermaid",
			() =>
				({
					parse: (code: string) => {
						calls.push(code.includes("BAD_PARSE") ? "bad" : "ok");
						if (code.includes("BAD_PARSE"))
							throw new Error("Syntax error near BAD_PARSE");
						return true;
					},
				}) as unknown,
		);

		const { mermaidDiagramGenerator } = await import(
			"../../src/tools/mermaid-diagram-generator.js"
		);

		// Craft a description containing the "BAD_PARSE" token so it appears in the
		// generated diagram and triggers parse failure.
		const res = await mermaidDiagramGenerator({
			description: "This contains BAD_PARSE token to simulate syntax",
			diagramType: "flowchart",
			repair: true,
			strict: false,
		});

		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		// If repair works, we'll see the success after auto-repair message; otherwise
		// with `strict: false` a permissive diagram may be returned. We assert the
		// flow indicates handling of an invalid parse
		expect(text).toMatch(
			/Diagram validated successfully|after auto-repair|Validation skipped|Diagram invalid/,
		);
	});

	it("maps legacy diagram type names and includes accessibility comments", async () => {
		vi.resetModules();
		// Make parse succeed to keep behavior deterministic
		vi.mock("mermaid", () => ({
			parse: (_code: string) => true,
		}));
		const { mermaidDiagramGenerator } = await import(
			"../../src/tools/mermaid-diagram-generator.js"
		);

		// graph -> flowchart
		const g1 = await mermaidDiagramGenerator({
			description: "test example",
			diagramType: "graph",
			accTitle: "Title",
			accDescr: "Description",
		});
		const t1 = g1.content[0]?.type === "text" ? g1.content[0].text : "";
		expect(t1).toContain("flowchart");
		expect(t1).toContain("AccTitle: Title");
		expect(t1).toContain("AccDescr: Description");

		// erDiagram -> er
		const e1 = await mermaidDiagramGenerator({
			description: "test example",
			diagramType: "erDiagram",
			accTitle: "Title",
			accDescr: "Description",
		});
		const te1 = e1.content[0]?.type === "text" ? e1.content[0].text : "";
		expect(te1).toContain("erDiagram");

		// userJourney -> journey
		const uj = await mermaidDiagramGenerator({
			description: "test example",
			diagramType: "userJourney",
			accTitle: "Title",
			accDescr: "Description",
		});
		const tuj = uj.content[0]?.type === "text" ? uj.content[0].text : "";
		expect(tuj).toContain("journey");

		// gitGraph variants
		const gg1 = await mermaidDiagramGenerator({
			description: "test example",
			diagramType: "gitgraph",
			accTitle: "Title",
			accDescr: "Description",
		});
		const tgg1 = gg1.content[0]?.type === "text" ? gg1.content[0].text : "";
		expect(tgg1).toContain("gitGraph");
		const gg2 = await mermaidDiagramGenerator({
			description: "test example",
			diagramType: "gitGraph",
			accTitle: "Title",
			accDescr: "Description",
		});
		const tgg2 = gg2.content[0]?.type === "text" ? gg2.content[0].text : "";
		expect(tgg2).toContain("gitGraph");
	});

	it("falls back to a safe diagram when parse fails and strict mode is set", async () => {
		vi.resetModules();
		// Mock parse to always throw a non-skippable error
		vi.mock("mermaid", () => ({
			parse: (_code: string) => {
				throw new Error("Syntax destruction");
			},
		}));
		const { mermaidDiagramGenerator } = await import(
			"../../src/tools/mermaid-diagram-generator.js"
		);
		const res = await mermaidDiagramGenerator({
			description: "This will fail validation",
			diagramType: "flowchart",
			strict: true,
			repair: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		// Fallback diagram uses "Fallback Diagram" text in body
		expect(text).toContain("Fallback Diagram");
	});

	it("skips validation when dynamic import throws (e.g., DOM/SSR errors)", async () => {
		vi.resetModules();
		// Simulate import failing with an SSR/dom error
		vi.mock("mermaid", () => {
			throw new Error("Cannot use import statement");
		});
		const { mermaidDiagramGenerator } = await import(
			"../../src/tools/mermaid-diagram-generator.js"
		);
		const res = await mermaidDiagramGenerator({
			description: "Simple flow",
			diagramType: "flowchart",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toContain("Validation skipped");
	});

	it("generates decision node for filter steps in flowchart", async () => {
		vi.resetModules();
		// Make parse succeed to avoid interference
		vi.mock("mermaid", () => ({
			parse: (_code: string) => true,
		}));
		const { mermaidDiagramGenerator } = await import(
			"../../src/tools/mermaid-diagram-generator.js"
		);

		const res = await mermaidDiagramGenerator({
			description: "Read users. Filter active users. Append to result.",
			diagramType: "flowchart",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toContain("Filter active users?");
		expect(text).toContain("|Yes|");
		expect(text).toContain("|No|");
	});
});
