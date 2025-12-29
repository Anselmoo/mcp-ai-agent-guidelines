import { afterEach, describe, expect, it } from "vitest";
import {
	__setMermaidModuleProvider,
	validateDiagram,
} from "../../../src/tools/mermaid/validator.js";

describe("mermaid validator", () => {
	afterEach(() => {
		__setMermaidModuleProvider(null);
	});

	it("validates successfully when provider returns parse function", async () => {
		__setMermaidModuleProvider(() => (code: string) => true);
		const res = await validateDiagram("graph TD\nA-->B");
		expect(res).toEqual({ valid: true });
	});

	it("returns skipped when provider throws module-not-found like error", async () => {
		__setMermaidModuleProvider(() => {
			throw new Error("Cannot find module 'mermaid'");
		});
		const res = await validateDiagram("graph TD\nA-->B");
		expect(res).toEqual({ valid: true, skipped: true });
	});

	it("returns false when parse throws a parse error", async () => {
		__setMermaidModuleProvider(() => ({
			parse(_: string) {
				throw new Error("Syntax error at line 1");
			},
		}));

		const res = await validateDiagram("bad content");
		expect(res.valid).toBe(false);
		expect((res as any).error).toContain("Syntax error");
	});

	it("skips validation when module has no parse (unavailable) and message matches skip regex", async () => {
		__setMermaidModuleProvider(() => ({}));
		// the loader will throw "Mermaid parse function unavailable" which should be treated as skipped
		const res = await validateDiagram("graph TD\nA-->B");
		expect(res).toEqual({ valid: true, skipped: true });
	});

	it("supports default export as a function", async () => {
		__setMermaidModuleProvider(() => ({ default: (code: string) => true }));
		const res = await validateDiagram("graph TD\nA-->B");
		expect(res).toEqual({ valid: true });
	});

	it("supports default export with parse method (including async) and binds correctly", async () => {
		__setMermaidModuleProvider(() => ({
			default: { parse: async (code: string) => Promise.resolve(true) },
		}));
		const res = await validateDiagram("sequence\nA->>B: msg");
		expect(res).toEqual({ valid: true });
	});

	it("treats DOM or environment errors as skipped", async () => {
		__setMermaidModuleProvider(() => {
			throw new Error("document is not defined");
		});
		const res = await validateDiagram("graph TD\nA-->B");
		expect(res).toEqual({ valid: true, skipped: true });
	});

	it("caches load error and subsequent calls return same invalid result", async () => {
		__setMermaidModuleProvider(() => {
			throw new Error("unexpected loader failure");
		});

		const res1 = await validateDiagram("graph TD\nA-->B");
		expect(res1.valid).toBe(false);
		expect((res1 as any).error).toContain("unexpected loader failure");

		// Second call should hit cached error path and return same result
		const res2 = await validateDiagram("graph TD\nA-->B");
		expect(res2.valid).toBe(false);
		expect((res2 as any).error).toContain("unexpected loader failure");
	});
});
