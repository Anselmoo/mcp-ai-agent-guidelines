import { describe, expect, it } from "vitest";
import { SymbolBody, SymbolBodyFactory } from "../../snapshots/symbol_body.js";
import {
	SymbolKind,
	type UnifiedSymbolInformation,
} from "../../snapshots/types.js";

function makeSymbol(
	startLine: number,
	startChar: number,
	endLine: number,
	endChar: number,
): UnifiedSymbolInformation {
	return {
		name: "test",
		kind: SymbolKind.Function,
		location: {
			uri: "file:///test.ts",
			range: {
				start: { line: startLine, character: startChar },
				end: { line: endLine, character: endChar },
			},
			absolutePath: "/test.ts",
			relativePath: "test.ts",
		},
		children: [],
		parent: null,
	};
}

// ─── SymbolBody ───────────────────────────────────────────────────────────────

describe("SymbolBody.getText()", () => {
	it("returns single-line symbol text", () => {
		const lines = ["function foo() {}"];
		// start col 9, end col 12 → "foo"
		const body = new SymbolBody(lines, 0, 9, 0, 12);
		expect(body.getText()).toBe("foo");
	});

	it("returns full line when start=0 and end=length", () => {
		const lines = ["const x = 1;"];
		const body = new SymbolBody(lines, 0, 0, 0, lines[0].length);
		expect(body.getText()).toBe("const x = 1;");
	});

	it("returns multi-line symbol text", () => {
		const lines = ["function bar() {", "  return 42;", "}"];
		// whole function: start col 0, end col 1
		const body = new SymbolBody(lines, 0, 0, 2, 1);
		expect(body.getText()).toBe("function bar() {\n  return 42;\n}");
	});

	it("trims trailing content on the last line based on endCol", () => {
		const lines = ["  myFunc() {} // comment"];
		// endCol = 13 → stops before " // comment"
		const body = new SymbolBody(lines, 0, 2, 0, 13);
		expect(body.getText()).toBe("myFunc() {}");
	});

	it("handles symbol on the last line exactly (no trailing trim)", () => {
		const lines = ["abc"];
		// endCol == line length → trailingLength == 0, no trim
		const body = new SymbolBody(lines, 0, 0, 0, 3);
		expect(body.getText()).toBe("abc");
	});
});

// ─── SymbolBodyFactory ────────────────────────────────────────────────────────

describe("SymbolBodyFactory", () => {
	it("creates a SymbolBody from a symbol location", () => {
		const source = "export function hello() {\n  return 1;\n}";
		const factory = new SymbolBodyFactory(source);
		const sym = makeSymbol(0, 0, 2, 1);
		const body = factory.createSymbolBody(sym);
		expect(body.getText()).toBe("export function hello() {\n  return 1;\n}");
	});

	it("multiple symbols share the same lines buffer", () => {
		const source = "const a = 1;\nconst b = 2;";
		const factory = new SymbolBodyFactory(source);

		const symA = makeSymbol(0, 6, 0, 7); // "a"
		const symB = makeSymbol(1, 6, 1, 7); // "b"

		expect(factory.createSymbolBody(symA).getText()).toBe("a");
		expect(factory.createSymbolBody(symB).getText()).toBe("b");
	});

	it("handles single-line source with no newlines", () => {
		const source = "const x = 42;";
		const factory = new SymbolBodyFactory(source);
		const sym = makeSymbol(0, 0, 0, source.length);
		expect(factory.createSymbolBody(sym).getText()).toBe("const x = 42;");
	});
});
