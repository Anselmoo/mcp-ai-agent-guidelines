import { describe, expect, it } from "vitest";
import {
	type Location,
	type PersistedUnifiedSymbol,
	type Position,
	type Range,
	type RawDocumentSymbol,
	type RawSymbolInformation,
	SymbolKind,
	SymbolTag,
	type UnifiedSymbolInformation,
} from "../../snapshots/types.js";

// ─── SymbolKind enum ──────────────────────────────────────────────────────────

describe("SymbolKind", () => {
	it("has correct numeric values matching LSP spec", () => {
		expect(SymbolKind.File).toBe(1);
		expect(SymbolKind.Module).toBe(2);
		expect(SymbolKind.Namespace).toBe(3);
		expect(SymbolKind.Package).toBe(4);
		expect(SymbolKind.Class).toBe(5);
		expect(SymbolKind.Method).toBe(6);
		expect(SymbolKind.Property).toBe(7);
		expect(SymbolKind.Field).toBe(8);
		expect(SymbolKind.Constructor).toBe(9);
		expect(SymbolKind.Enum).toBe(10);
		expect(SymbolKind.Interface).toBe(11);
		expect(SymbolKind.Function).toBe(12);
		expect(SymbolKind.Variable).toBe(13);
		expect(SymbolKind.Constant).toBe(14);
		expect(SymbolKind.String).toBe(15);
		expect(SymbolKind.Number).toBe(16);
		expect(SymbolKind.Boolean).toBe(17);
		expect(SymbolKind.Array).toBe(18);
		expect(SymbolKind.Object).toBe(19);
		expect(SymbolKind.Key).toBe(20);
		expect(SymbolKind.Null).toBe(21);
		expect(SymbolKind.EnumMember).toBe(22);
		expect(SymbolKind.Struct).toBe(23);
		expect(SymbolKind.Event).toBe(24);
		expect(SymbolKind.Operator).toBe(25);
		expect(SymbolKind.TypeParameter).toBe(26);
	});

	it("reverse-maps numeric values to member names", () => {
		expect(SymbolKind[1]).toBe("File");
		expect(SymbolKind[5]).toBe("Class");
		expect(SymbolKind[12]).toBe("Function");
	});
});

// ─── SymbolTag enum ───────────────────────────────────────────────────────────

describe("SymbolTag", () => {
	it("has Deprecated = 1", () => {
		expect(SymbolTag.Deprecated).toBe(1);
	});
});

// ─── Interface shape tests ────────────────────────────────────────────────────

describe("Position interface", () => {
	it("accepts zero-based line/character values", () => {
		const pos: Position = { line: 0, character: 0 };
		expect(pos.line).toBe(0);
		expect(pos.character).toBe(0);
	});
});

describe("Range interface", () => {
	it("holds start and end positions", () => {
		const range: Range = {
			start: { line: 0, character: 0 },
			end: { line: 1, character: 5 },
		};
		expect(range.start.line).toBe(0);
		expect(range.end.character).toBe(5);
	});
});

describe("Location interface", () => {
	it("holds URI and path fields", () => {
		const loc: Location = {
			uri: "file:///repo/foo.ts",
			range: {
				start: { line: 0, character: 0 },
				end: { line: 0, character: 1 },
			},
			absolutePath: "/repo/foo.ts",
			relativePath: "foo.ts",
		};
		expect(loc.uri).toBe("file:///repo/foo.ts");
		expect(loc.relativePath).toBe("foo.ts");
	});

	it("allows relativePath to be null", () => {
		const loc: Location = {
			uri: "file:///repo/foo.ts",
			range: {
				start: { line: 0, character: 0 },
				end: { line: 0, character: 1 },
			},
			absolutePath: "/repo/foo.ts",
			relativePath: null,
		};
		expect(loc.relativePath).toBeNull();
	});
});

describe("RawDocumentSymbol interface", () => {
	it("represents hierarchical LSP symbol with required fields", () => {
		const sym: RawDocumentSymbol = {
			name: "MyClass",
			kind: SymbolKind.Class,
			range: {
				start: { line: 0, character: 0 },
				end: { line: 10, character: 1 },
			},
			selectionRange: {
				start: { line: 0, character: 6 },
				end: { line: 0, character: 13 },
			},
		};
		expect(sym.name).toBe("MyClass");
		expect(sym.children).toBeUndefined();
	});

	it("allows optional children array", () => {
		const sym: RawDocumentSymbol = {
			name: "Parent",
			kind: SymbolKind.Class,
			range: {
				start: { line: 0, character: 0 },
				end: { line: 5, character: 0 },
			},
			selectionRange: {
				start: { line: 0, character: 0 },
				end: { line: 0, character: 6 },
			},
			children: [
				{
					name: "child",
					kind: SymbolKind.Method,
					range: {
						start: { line: 1, character: 2 },
						end: { line: 2, character: 0 },
					},
					selectionRange: {
						start: { line: 1, character: 2 },
						end: { line: 1, character: 7 },
					},
				},
			],
		};
		expect(sym.children).toHaveLength(1);
		expect(sym.children?.[0]?.name).toBe("child");
	});
});

describe("RawSymbolInformation interface", () => {
	it("represents flat legacy LSP symbol with location", () => {
		const sym: RawSymbolInformation = {
			name: "myFunc",
			kind: SymbolKind.Function,
			location: {
				uri: "file:///repo/foo.ts",
				range: {
					start: { line: 5, character: 0 },
					end: { line: 8, character: 1 },
				},
			},
		};
		expect(sym.name).toBe("myFunc");
		expect(sym.location.uri).toBe("file:///repo/foo.ts");
	});
});

describe("UnifiedSymbolInformation / PersistedUnifiedSymbol interfaces", () => {
	it("PersistedUnifiedSymbol has no parent field", () => {
		const persisted: PersistedUnifiedSymbol = {
			name: "Foo",
			kind: SymbolKind.Class,
			location: {
				uri: "file:///foo.ts",
				range: {
					start: { line: 0, character: 0 },
					end: { line: 0, character: 1 },
				},
				absolutePath: "/foo.ts",
				relativePath: "foo.ts",
			},
			children: [],
		};
		// parent is not part of PersistedUnifiedSymbol — compile-time check
		expect("parent" in persisted).toBe(false);
	});

	it("UnifiedSymbolInformation extends persisted with parent + body", () => {
		const unified: UnifiedSymbolInformation = {
			name: "Bar",
			kind: SymbolKind.Function,
			location: {
				uri: "file:///bar.ts",
				range: {
					start: { line: 0, character: 0 },
					end: { line: 0, character: 1 },
				},
				absolutePath: "/bar.ts",
				relativePath: "bar.ts",
			},
			children: [],
			parent: null,
		};
		expect(unified.parent).toBeNull();
		expect(unified.body).toBeUndefined();
	});
});
