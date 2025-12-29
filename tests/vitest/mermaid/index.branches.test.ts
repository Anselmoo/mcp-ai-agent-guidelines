import { afterEach, describe, expect, it } from "vitest";
import {
	__setMermaidModuleProvider,
	formatResponse,
	generateDiagram,
	mermaidDiagramGenerator,
	normalizeLegacyTypes,
} from "../../../src/tools/mermaid/index.js";

import type { MermaidDiagramInput } from "../../../src/tools/mermaid/types.js";

afterEach(() => {
	// restore provider
	__setMermaidModuleProvider(null);
});

describe("mermaid/index branches", () => {
	it("normalizeLegacyTypes maps legacy names and leaves non-objects unchanged", () => {
		expect(normalizeLegacyTypes(null)).toBeNull();
		const v = normalizeLegacyTypes({ diagramType: "erDiagram" }) as any;
		expect(v.diagramType).toBe("er");
		// unknown stays as-is
		expect(
			(normalizeLegacyTypes({ diagramType: "custom" }) as any).diagramType,
		).toBe("custom");
	});

	it("generateDiagram throws on unknown handler and merges advancedFeatures direction", () => {
		// unknown handler
		const bad = {
			diagramType: "bogus",
			description: "test",
		} as unknown as MermaidDiagramInput;
		expect(() => generateDiagram(bad)).toThrow(/Unknown diagram type/);

		// flowchart uses direction
		const input = {
			diagramType: "flowchart",
			description: "A -> B",
			direction: "LR",
		} as unknown as MermaidDiagramInput;
		const out = generateDiagram(input);
		expect(out).toMatch(/flowchart LR/);
	});

	it("formatResponse shows skipped validation, repaired note and feedback loop appropriately", () => {
		const base = {
			diagramType: "flowchart",
			description: "My chart",
			strict: false,
			repair: false,
		} as unknown as MermaidDiagramInput;

		// skipped validation
		let res = formatResponse(
			base,
			"flowchart TD\nA-->B",
			{ valid: true, skipped: true },
			false,
		);
		expect(res.content[0].text).toMatch(/Validation skipped/);

		// validated after repair
		res = formatResponse(
			{ ...base } as any,
			"flowchart TD\nA-->B",
			{ valid: true },
			true,
		);
		expect(res.content[0].text).toMatch(/after auto-repair/);

		// invalid => feedback present
		res = formatResponse(
			{ ...base } as any,
			"x",
			{ valid: false, error: "syntax" },
			false,
		);
		expect(res.content[0].text).toMatch(/Feedback Loop/);
		expect(res.content[0].text).toMatch(/syntax/);
	});

	it("mermaidDiagramGenerator: handles skipped validation when mermaid not available", async () => {
		// provider that throws a DOM error -> should be treated as skipped
		__setMermaidModuleProvider(() => ({
			parse: () => {
				throw new Error("document is not defined");
			},
		}));

		const args = {
			diagramType: "flowchart",
			description: "A -> B",
			accTitle: "MyTitle",
			accDescr: "Desc",
			strict: false,
			repair: false,
		};

		const out = await mermaidDiagramGenerator(args);
		const txt = out.content[0].text as string;
		expect(txt).toMatch(/Validation\s+skipped/);
		expect(txt).toMatch(/Title: MyTitle/);
		expect(txt).toMatch(/Description: Desc/);
	});

	it("mermaidDiagramGenerator: repair flow succeeds when repair fixes issues", async () => {
		// provider: throw for diagrams that contain 'classDef X fill=' (old syntax)
		__setMermaidModuleProvider(() => ({
			parse: (code: string) => {
				if (/classDef \w+ .*=/.test(code)) throw new Error("syntax error");
				return true;
			},
		}));

		const args = {
			diagramType: "flowchart",
			description: "flowchart\nclassDef Foo fill=#fff;\nA-->B",
			strict: false,
			repair: true,
		};

		const out = await mermaidDiagramGenerator(args);
		const txt = out.content[0].text as string;
		// Should indicate after auto-repair because repair will convert '=' to ':'
		expect(txt).toMatch(/after auto-repair/);
	});

	it("mermaidDiagramGenerator: strict fallback used when repair fails and strict=true", async () => {
		// provider: always throw syntax error (so repair won't help), but accept fallback (we detect fallback by content)
		__setMermaidModuleProvider(() => ({
			parse: (code: string) => {
				if (/Fallback Diagram/.test(code)) return true; // accept fallback
				throw new Error("syntax error");
			},
		}));

		const args = {
			diagramType: "flowchart",
			description: "bad content that can't be repaired",
			strict: true,
			repair: true,
		};

		const out = await mermaidDiagramGenerator(args);
		const txt = out.content[0].text as string;
		// Fallback diagram should be present and validated
		expect(txt).toMatch(/Fallback Diagram/);
		expect(txt).toMatch(/Diagram validated successfully/);
	});

	it("mermaidDiagramGenerator: repair changes diagram but validation still fails", async () => {
		// provider: always throw syntax error (non-DOM)
		__setMermaidModuleProvider(() => ({
			parse: () => {
				throw new Error("syntax fail");
			},
		}));

		// Spy on repairDiagram to return a *different* diagram but still invalid
		const repairModule = await import(
			"../../../src/tools/mermaid/utils/repair.utils.js"
		);
		const { vi } = await import("vitest");
		const spy = vi
			.spyOn(repairModule, "repairDiagram")
			.mockImplementation((d: string) => d + "\n// repaired");

		const args = {
			diagramType: "flowchart",
			description: "flowchart\nclassDef Foo fill=#fff;\nA-->B",
			strict: false,
			repair: true,
		};

		const out = await mermaidDiagramGenerator(args);
		const txt = out.content[0].text as string;
		// Since repair changed content but validation still fails, we should see invalid feedback
		expect(txt).toMatch(/Diagram invalid even after attempts/);
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it("formatResponse shows only title when accTitle provided without accDescr", () => {
		const base = {
			diagramType: "flowchart",
			description: "My chart",
			strict: false,
			repair: false,
			accTitle: "OnlyTitle",
		} as unknown as any;

		const res = formatResponse(
			base,
			"flowchart TD\nA-->B",
			{ valid: true },
			false,
		);
		expect(res.content[0].text).toMatch(/Title: OnlyTitle/);
		expect(res.content[0].text).not.toMatch(/Description:/);
	});

	it("generateDiagram supports all registered diagram types", () => {
		const types = [
			"flowchart",
			"sequence",
			"class",
			"state",
			"gantt",
			"pie",
			"er",
			"journey",
			"quadrant",
			"git-graph",
			"mindmap",
			"timeline",
		];

		for (const t of types) {
			const input = {
				diagramType: t,
				description: "A -> B",
			} as unknown as MermaidDiagramInput;
			const out = generateDiagram(input);
			expect(typeof out).toBe("string");
			expect(out.length).toBeGreaterThan(0);
		}
	});

	it("mermaidDiagramGenerator respects theme and advancedFeatures and validates successfully", async () => {
		// provider that accepts anything
		__setMermaidModuleProvider(() => ({ parse: () => true }));

		const args = {
			diagramType: "flowchart",
			description: "A -> B",
			theme: "dark",
			direction: "LR",
			strict: false,
			repair: false,
		};

		const out = await mermaidDiagramGenerator(args);
		const txt = out.content[0].text as string;
		// Theme should appear in mermaid init comment if theme is set
		expect(txt).toMatch(/theme.*dark/i);
		// Direction should be present in diagram code
		expect(txt).toMatch(/flowchart LR/);
		// Validation success note
		expect(txt).toMatch(/Diagram validated successfully/);
	});

	it("formatResponse shows accessibility fallback when no accTitle/accDescr", () => {
		const base = {
			diagramType: "flowchart",
			description: "My chart",
			strict: false,
			repair: false,
		} as unknown as MermaidDiagramInput;

		const res = formatResponse(
			base,
			"flowchart TD\nA-->B",
			{ valid: true },
			false,
		);
		expect(res.content[0].text).toMatch(
			/You can provide accTitle and accDescr/,
		);
	});

	it("HANDLER_REGISTRY entries are present and generate output", async () => {
		// Dynamic import to work correctly in ESM test environment
		const mod = await import("../../../src/tools/mermaid/index.js");
		const HANDLER_REGISTRY = (mod as any).HANDLER_REGISTRY as Record<
			string,
			any
		>;
		const keys = Object.keys(HANDLER_REGISTRY).sort();
		expect(keys.length).toBeGreaterThan(0);

		for (const k of keys) {
			const handler = HANDLER_REGISTRY[k];
			expect(handler).toBeDefined();
			// call generate with minimal input and ensure string result
			const out = handler.generate("A -> B", undefined, {});
			expect(typeof out).toBe("string");
		}
	});

	// Additional focused branch tests to hit remaining index.ts branches
	it("normalizeLegacyTypes handles other legacy keys correctly", () => {
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

	it("generateDiagram respects direction override from input over advancedFeatures.direction", () => {
		const input = {
			diagramType: "flowchart",
			description: "A -> B",
			direction: "LR",
			advancedFeatures: { direction: "TD" },
		} as any;
		const out = generateDiagram(input);
		expect(out).toMatch(/flowchart LR/);
	});

	it("mermaidDiagramGenerator returns invalid feedback when validation fails and repair disabled", async () => {
		// mermaid provider that always throws a syntax error (non-DOM)
		__setMermaidModuleProvider(() => ({
			parse: () => {
				throw new Error("syntax error");
			},
		}));

		const args = {
			diagramType: "flowchart",
			description: "bad content",
			strict: false,
			repair: false,
		};

		const out = await mermaidDiagramGenerator(args);
		const txt = out.content[0].text as string;
		expect(txt).toMatch(/Diagram invalid even after attempts/);
		expect(txt).toMatch(/syntax error/);
	});

	it("mermaidDiagramGenerator attempts repair but leaves diagram unchanged when repair fails to alter it", async () => {
		// provider: always throw syntax so validation fails
		__setMermaidModuleProvider(() => ({
			parse: () => {
				throw new Error("syntax fail");
			},
		}));

		// Spy on repairDiagram to return the same diagram (no change)
		const repairModule = await import(
			"../../../src/tools/mermaid/utils/repair.utils.js"
		);
		// Use global vi from vitest via importing it
		const { vi } = await import("vitest");
		const spy = vi
			.spyOn(repairModule, "repairDiagram")
			.mockImplementation((d: string) => d);

		const args = {
			diagramType: "flowchart",
			description: "flowchart\nclassDef Foo fill=#fff;\nA-->B",
			strict: false,
			repair: true,
		};

		const out = await mermaidDiagramGenerator(args);
		const txt = out.content[0].text as string;
		// Since repair didn't change content, we should still see invalid feedback
		expect(txt).toMatch(/Diagram invalid even after attempts/);
		spy.mockRestore();
	});

	it("formatResponse shows only description when accDescr provided without accTitle", () => {
		const base = {
			diagramType: "flowchart",
			description: "My chart",
			strict: false,
			repair: false,
			accDescr: "OnlyDesc",
		} as unknown as any;

		const res = formatResponse(
			base,
			"flowchart TD\nA-->B",
			{ valid: true },
			false,
		);
		expect(res.content[0].text).toMatch(/Description: OnlyDesc/);
		expect(res.content[0].text).not.toMatch(/Title:/);
	});

	it("generateDiagram propagates handler errors", async () => {
		// Replace the flowchart handler with a stub that throws
		const mod = await import("../../../src/tools/mermaid/index.js");
		const HANDLER_REGISTRY = (mod as any).HANDLER_REGISTRY as Record<
			string,
			any
		>;
		const orig = HANDLER_REGISTRY.flowchart;
		HANDLER_REGISTRY.flowchart = {
			generate: () => {
				throw new Error("handler fail");
			},
		} as any;

		const input = { diagramType: "flowchart", description: "A -> B" } as any;
		expect(() => generateDiagram(input)).toThrow(/handler fail/);

		// restore original handler
		HANDLER_REGISTRY.flowchart = orig;
	});

	it("mermaidDiagramGenerator: fallback used when strict/repair defaults and repair fails", async () => {
		// provider: always throw unless fallback diagram
		__setMermaidModuleProvider(() => ({
			parse: (code: string) => {
				if (/Fallback Diagram/.test(code)) return true;
				throw new Error("syntax error");
			},
		}));

		const args = {
			diagramType: "flowchart",
			description: "content that fails",
			// no strict/repair provided -> defaults should apply
		};

		const out = await mermaidDiagramGenerator(args as any);
		const txt = out.content[0].text as string;
		expect(txt).toMatch(/Fallback Diagram/);
		expect(txt).toMatch(/Diagram validated successfully/);
	});

	it("mermaidDiagramGenerator: strict true + repair false uses fallback when validation fails", async () => {
		__setMermaidModuleProvider(() => ({
			parse: (code: string) => {
				if (/Fallback Diagram/.test(code)) return true;
				throw new Error("syntax error");
			},
		}));

		const args = {
			diagramType: "flowchart",
			description: "content that fails",
			strict: true,
			repair: false,
		};

		const out = await mermaidDiagramGenerator(args as any);
		const txt = out.content[0].text as string;
		expect(txt).toMatch(/Fallback Diagram/);
		expect(txt).toMatch(/Diagram validated successfully/);
	});
});
