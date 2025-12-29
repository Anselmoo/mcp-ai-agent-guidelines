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
});
