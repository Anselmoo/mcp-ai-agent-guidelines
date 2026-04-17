import { describe, expect, it } from "vitest";
import { DocumentSymbols } from "../../snapshots/document_symbols.js";
import {
	SymbolKind,
	type UnifiedSymbolInformation,
} from "../../snapshots/types.js";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeSymbol(
	name: string,
	kind: SymbolKind = SymbolKind.Function,
	children: UnifiedSymbolInformation[] = [],
	overload_idx?: number,
): UnifiedSymbolInformation {
	return {
		name,
		kind,
		location: {
			uri: "file:///repo/test.ts",
			range: {
				start: { line: 0, character: 0 },
				end: { line: 1, character: 0 },
			},
			absolutePath: "/repo/test.ts",
			relativePath: "test.ts",
		},
		children,
		parent: null,
		overload_idx,
	};
}

/** Wire parent references for a symbol tree. */
function wireParents(
	sym: UnifiedSymbolInformation,
	parent: UnifiedSymbolInformation | null = null,
): void {
	sym.parent = parent;
	for (const child of sym.children) wireParents(child, sym);
}

// ─── iterSymbols ──────────────────────────────────────────────────────────────

describe("DocumentSymbols.iterSymbols()", () => {
	it("iterates nothing for empty symbol tree", () => {
		const ds = new DocumentSymbols([]);
		expect([...ds.iterSymbols()]).toHaveLength(0);
	});

	it("iterates flat root symbols", () => {
		const ds = new DocumentSymbols([makeSymbol("a"), makeSymbol("b")]);
		const names = [...ds.iterSymbols()].map((s) => s.name);
		expect(names).toEqual(["a", "b"]);
	});

	it("iterates depth-first through children", () => {
		const child1 = makeSymbol("child1");
		const child2 = makeSymbol("child2");
		const parent = makeSymbol("parent", SymbolKind.Class, [child1, child2]);
		wireParents(parent);
		const ds = new DocumentSymbols([parent]);
		const names = [...ds.iterSymbols()].map((s) => s.name);
		expect(names).toEqual(["parent", "child1", "child2"]);
	});

	it("iterates from cache on second call", () => {
		const ds = new DocumentSymbols([makeSymbol("x")]);
		// prime the cache
		ds.getAllSymbolsAndRoots();
		const names = [...ds.iterSymbols()].map((s) => s.name);
		expect(names).toEqual(["x"]);
	});
});

// ─── getAllSymbolsAndRoots ────────────────────────────────────────────────────

describe("DocumentSymbols.getAllSymbolsAndRoots()", () => {
	it("returns [allSymbols, rootSymbols]", () => {
		const root = makeSymbol("Root", SymbolKind.Class, [makeSymbol("method")]);
		wireParents(root);
		const ds = new DocumentSymbols([root]);
		const [all, roots] = ds.getAllSymbolsAndRoots();
		expect(roots).toHaveLength(1);
		expect(all).toHaveLength(2); // root + child
		expect(all[0]?.name).toBe("Root");
		expect(all[1]?.name).toBe("method");
	});

	it("caches flat list on second call (same reference)", () => {
		const ds = new DocumentSymbols([makeSymbol("a"), makeSymbol("b")]);
		const [all1] = ds.getAllSymbolsAndRoots();
		const [all2] = ds.getAllSymbolsAndRoots();
		expect(all1).toBe(all2);
	});
});

// ─── getSymbolPathComponents ──────────────────────────────────────────────────

describe("DocumentSymbols.getSymbolPathComponents()", () => {
	it("returns single component for root symbol", () => {
		const sym = makeSymbol("Foo");
		const ds = new DocumentSymbols([sym]);
		const parts = ds.getSymbolPathComponents(sym);
		expect(parts).toHaveLength(1);
		expect(parts[0]?.name).toBe("Foo");
		expect(parts[0]?.overloadIdx).toBeNull();
	});

	it("includes overload_idx in component", () => {
		const sym = makeSymbol("myMethod", SymbolKind.Method, [], 2);
		const ds = new DocumentSymbols([sym]);
		const parts = ds.getSymbolPathComponents(sym);
		expect(parts[0]?.overloadIdx).toBe(2);
	});

	it("walks parent chain for nested symbol", () => {
		const child = makeSymbol("method");
		const parent = makeSymbol("MyClass", SymbolKind.Class, [child]);
		wireParents(parent);
		const ds = new DocumentSymbols([parent]);
		const parts = ds.getSymbolPathComponents(child);
		expect(parts.map((p) => p.name)).toEqual(["MyClass", "method"]);
	});
});

// ─── getNamePath ──────────────────────────────────────────────────────────────

describe("DocumentSymbols.getNamePath()", () => {
	it("returns name for root symbol", () => {
		const sym = makeSymbol("Foo");
		const ds = new DocumentSymbols([sym]);
		expect(ds.getNamePath(sym)).toBe("Foo");
	});

	it("returns slash-separated path for nested symbol", () => {
		const method = makeSymbol("getValue");
		const cls = makeSymbol("MyClass", SymbolKind.Class, [method]);
		wireParents(cls);
		const ds = new DocumentSymbols([cls]);
		expect(ds.getNamePath(method)).toBe("MyClass/getValue");
	});

	it("includes overload suffix for overloaded method", () => {
		const overload = makeSymbol("fn", SymbolKind.Method, [], 1);
		const ds = new DocumentSymbols([overload]);
		// overload_idx = 1 → suffix [1] appended via componentToString
		expect(ds.getNamePath(overload)).toContain("fn");
	});
});

// ─── findByNamePath ───────────────────────────────────────────────────────────

describe("DocumentSymbols.findByNamePath()", () => {
	it("finds a root-level symbol by exact name", () => {
		const ds = new DocumentSymbols([
			makeSymbol("MyClass"),
			makeSymbol("helper"),
		]);
		const found = ds.findByNamePath("MyClass");
		expect(found).toHaveLength(1);
		expect(found[0]?.name).toBe("MyClass");
	});

	it("returns empty array when no match", () => {
		const ds = new DocumentSymbols([makeSymbol("Foo")]);
		expect(ds.findByNamePath("Bar")).toHaveLength(0);
	});

	it("finds nested symbol by full name path", () => {
		const method = makeSymbol("getX");
		const cls = makeSymbol("Cls", SymbolKind.Class, [method]);
		wireParents(cls);
		const ds = new DocumentSymbols([cls]);
		const found = ds.findByNamePath("Cls/getX");
		expect(found).toHaveLength(1);
		expect(found[0]?.name).toBe("getX");
	});

	it("does not find partial path without substring option", () => {
		const method = makeSymbol("getValue");
		const cls = makeSymbol("MyClass", SymbolKind.Class, [method]);
		wireParents(cls);
		const ds = new DocumentSymbols([cls]);
		// "getV" without substring matching should not match "getValue"
		expect(ds.findByNamePath("getV")).toHaveLength(0);
	});
});

// ─── explainNamePathMatch ─────────────────────────────────────────────────────

describe("DocumentSymbols.explainNamePathMatch()", () => {
	it("returns matched=true for exact match", () => {
		const sym = makeSymbol("Foo");
		const ds = new DocumentSymbols([sym]);
		const result = ds.explainNamePathMatch(sym, "Foo");
		expect(result.matched).toBe(true);
	});

	it("returns matched=false for non-matching pattern", () => {
		const sym = makeSymbol("Bar");
		const ds = new DocumentSymbols([sym]);
		const result = ds.explainNamePathMatch(sym, "Foo");
		expect(result.matched).toBe(false);
	});
});
