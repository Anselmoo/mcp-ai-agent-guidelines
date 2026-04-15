/**
 * Tests for SymbolChangeTracker and related utilities in
 * src/snapshots/symbol-change-tracker.ts.
 */

import { describe, expect, it } from "vitest";
import {
	computeFileHash,
	diffSymbols,
	extractSymbolsFromSource,
	formatSymbolChangeReport,
	type SymbolChangeReport,
	SymbolChangeTracker,
} from "../../snapshots/symbol-change-tracker.js";

// ─── extractSymbolsFromSource ─────────────────────────────────────────────────

describe("extractSymbolsFromSource", () => {
	it("extracts exported functions", () => {
		const src = `
export function hello() {}
export async function fetchData() {}
`;
		const symbols = extractSymbolsFromSource(src);
		const names = symbols.map((s) => s.name);
		expect(names).toContain("hello");
		expect(names).toContain("fetchData");
	});

	it("extracts exported classes and interfaces", () => {
		const src = `
export class MyService {}
export interface IMyService {}
export type MyAlias = string;
`;
		const symbols = extractSymbolsFromSource(src);
		const names = symbols.map((s) => s.name);
		expect(names).toContain("MyService");
		expect(names).toContain("IMyService");
		expect(names).toContain("MyAlias");
	});

	it("extracts exported constants", () => {
		const src = `export const VERSION = "1.0.0";\nexport let count = 0;\n`;
		const symbols = extractSymbolsFromSource(src);
		const names = symbols.map((s) => s.name);
		expect(names).toContain("VERSION");
	});

	it("marks exported symbols correctly", () => {
		const src = `
export function publicFn() {}
function privateFn() {}
`;
		const symbols = extractSymbolsFromSource(src);
		const pub = symbols.find((s) => s.name === "publicFn");
		const priv = symbols.find((s) => s.name === "privateFn");
		expect(pub?.exported).toBe(true);
		expect(priv?.exported).toBe(false);
	});

	it("skips underscore-prefixed symbols when includePrivate=false", () => {
		const src = `
export function _internal() {}
export function publicApi() {}
`;
		const symbols = extractSymbolsFromSource(src, false);
		const names = symbols.map((s) => s.name);
		expect(names).not.toContain("_internal");
		expect(names).toContain("publicApi");
	});

	it("includes underscore-prefixed symbols when includePrivate=true", () => {
		const src = `export function _internal() {}\n`;
		const symbols = extractSymbolsFromSource(src, true);
		expect(symbols.map((s) => s.name)).toContain("_internal");
	});

	it("extracts class methods when includeMembers=true", () => {
		const src = `
export class Foo {
  doSomething() {}
  getData() {}
}
`;
		const symbols = extractSymbolsFromSource(src, false, true);
		const methodNames = symbols
			.filter((s) => s.container === "Foo")
			.map((s) => s.name);
		expect(methodNames).toContain("doSomething");
		expect(methodNames).toContain("getData");
	});

	it("does not extract class methods when includeMembers=false", () => {
		const src = `
export class Foo {
  doSomething() {}
}
`;
		const symbols = extractSymbolsFromSource(src, false, false);
		const methodNames = symbols.filter((s) => s.container === "Foo");
		expect(methodNames).toHaveLength(0);
	});

	it("returns symbols sorted by line", () => {
		const src = `
export function b() {}
export function a() {}
`;
		const symbols = extractSymbolsFromSource(src);
		for (let i = 1; i < symbols.length; i++) {
			const prev = symbols[i - 1];
			const curr = symbols[i];
			if (prev && curr) {
				expect(prev.line).toBeLessThanOrEqual(curr.line);
			}
		}
	});
});

// ─── computeFileHash ─────────────────────────────────────────────────────────

describe("computeFileHash", () => {
	it("produces consistent hashes", () => {
		const content = "hello world";
		expect(computeFileHash(content)).toBe(computeFileHash(content));
	});

	it("produces different hashes for different content", () => {
		expect(computeFileHash("a")).not.toBe(computeFileHash("b"));
	});

	it("returns 16 hex characters", () => {
		const hash = computeFileHash("test content");
		expect(hash).toMatch(/^[0-9a-f]{16}$/);
	});
});

// ─── diffSymbols ─────────────────────────────────────────────────────────────

describe("diffSymbols", () => {
	const makeSym = (
		name: string,
		kind: "function" | "class" | "interface" = "function",
		exported = true,
	) => ({
		name,
		kind,
		exported,
		isDefault: false,
		isAbstract: false,
		isPublic: exported,
		line: 0,
	});

	it("detects added symbols", () => {
		const baseline = [makeSym("old")];
		const current = [makeSym("old"), makeSym("newFn")];
		const diff = diffSymbols("file.ts", baseline, current);
		expect(diff.added).toHaveLength(1);
		expect(diff.added[0]?.name).toBe("newFn");
		expect(diff.removed).toHaveLength(0);
	});

	it("detects removed symbols", () => {
		const baseline = [makeSym("old"), makeSym("toRemove")];
		const current = [makeSym("old")];
		const diff = diffSymbols("file.ts", baseline, current);
		expect(diff.removed).toHaveLength(1);
		expect(diff.removed[0]?.name).toBe("toRemove");
	});

	it("detects kind changes", () => {
		const baseline = [makeSym("Foo", "function")];
		const current = [makeSym("Foo", "class")];
		const diff = diffSymbols("file.ts", baseline, current);
		expect(diff.kindChanged).toHaveLength(1);
		expect(diff.kindChanged[0]?.before.kind).toBe("function");
		expect(diff.kindChanged[0]?.after.kind).toBe("class");
		expect(diff.added).toHaveLength(0);
		expect(diff.removed).toHaveLength(0);
	});

	it("detects export status changes", () => {
		const baseline = [makeSym("bar", "function", false)];
		const current = [makeSym("bar", "function", true)];
		const diff = diffSymbols("file.ts", baseline, current);
		expect(diff.exportChanged).toHaveLength(1);
		expect(diff.exportChanged[0]?.before.exported).toBe(false);
		expect(diff.exportChanged[0]?.after.exported).toBe(true);
	});

	it("returns clean diff for identical symbol lists", () => {
		const symbols = [makeSym("a"), makeSym("b")];
		const diff = diffSymbols("file.ts", symbols, symbols);
		expect(diff.added).toHaveLength(0);
		expect(diff.removed).toHaveLength(0);
		expect(diff.kindChanged).toHaveLength(0);
		expect(diff.exportChanged).toHaveLength(0);
	});
});

// ─── formatSymbolChangeReport ─────────────────────────────────────────────────

describe("formatSymbolChangeReport", () => {
	it("produces a non-empty string", () => {
		const report: SymbolChangeReport = {
			capturedAt: new Date().toISOString(),
			totalFilesScanned: 3,
			changedFiles: 1,
			unchangedFiles: 2,
			addedSymbols: 2,
			removedSymbols: 1,
			kindChanges: 0,
			exportChanges: 0,
			stalePaths: ["src/foo.ts"],
			diffs: [
				{
					relativePath: "src/foo.ts",
					added: [
						{
							name: "newFn",
							kind: "function",
							exported: true,
							isDefault: false,
							isAbstract: false,
							isPublic: true,
							line: 5,
						},
					],
					removed: [],
					kindChanged: [],
					exportChanged: [],
				},
			],
		};
		const formatted = formatSymbolChangeReport(report);
		expect(formatted).toContain("src/foo.ts");
		expect(formatted).toContain("newFn");
	});

	it("includes summary numbers", () => {
		const report: SymbolChangeReport = {
			capturedAt: new Date().toISOString(),
			totalFilesScanned: 10,
			changedFiles: 3,
			unchangedFiles: 7,
			addedSymbols: 5,
			removedSymbols: 2,
			kindChanges: 1,
			exportChanges: 1,
			stalePaths: [],
			diffs: [],
		};
		const formatted = formatSymbolChangeReport(report);
		expect(formatted).toContain("10 total");
		expect(formatted).toContain("+5");
		expect(formatted).toContain("-2");
	});
});

// ─── SymbolChangeTracker ──────────────────────────────────────────────────────

describe("SymbolChangeTracker", () => {
	it("can be instantiated", () => {
		const tracker = new SymbolChangeTracker({ repositoryRoot: "/tmp" });
		expect(tracker).toBeInstanceOf(SymbolChangeTracker);
	});

	it("emits events on EventEmitter interface", () => {
		const tracker = new SymbolChangeTracker({ repositoryRoot: "/tmp" });
		const handler = () => {};
		tracker.on("change", handler);
		tracker.off("change", handler);
		// Should not throw
	});

	it("diffSymbols logic works for identical snapshots", () => {
		const sym = {
			name: "Foo",
			kind: "class" as const,
			exported: true,
			isDefault: false,
			isAbstract: false,
			isPublic: true,
			line: 1,
		};
		const diff = diffSymbols("foo.ts", [sym], [sym]);
		expect(diff.added).toHaveLength(0);
		expect(diff.removed).toHaveLength(0);
	});
});
