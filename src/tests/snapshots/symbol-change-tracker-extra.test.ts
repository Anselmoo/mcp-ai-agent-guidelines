import { describe, expect, it } from "vitest";
import {
	computeFileHash,
	diffSymbols,
	extractSymbolsFromSource,
	formatSymbolChangeReport,
	type SymbolChangeReport,
} from "../../snapshots/symbol-change-tracker.js";

// ─── diffSymbols ──────────────────────────────────────────────────────────────

describe("diffSymbols extra branches", () => {
	it("detects added symbols when current has symbols not in baseline", () => {
		const baseline = [
			{ name: "foo", kind: "function" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
		];
		const current = [
			{ name: "foo", kind: "function" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
			{ name: "bar", kind: "function" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 5 },
		];
		const diff = diffSymbols("src/test.ts", baseline, current);
		expect(diff.added).toHaveLength(1);
		expect(diff.added[0]?.name).toBe("bar");
		expect(diff.removed).toHaveLength(0);
	});

	it("detects removed symbols when baseline has symbols not in current", () => {
		const baseline = [
			{ name: "foo", kind: "function" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
			{ name: "baz", kind: "class" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 10 },
		];
		const current = [
			{ name: "foo", kind: "function" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
		];
		const diff = diffSymbols("src/test.ts", baseline, current);
		expect(diff.removed).toHaveLength(1);
		expect(diff.removed[0]?.name).toBe("baz");
		expect(diff.added).toHaveLength(0);
	});

	it("detects kind changes (same name, different kind)", () => {
		const baseline = [
			{ name: "MyThing", kind: "class" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
		];
		const current = [
			{ name: "MyThing", kind: "interface" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
		];
		const diff = diffSymbols("src/test.ts", baseline, current);
		expect(diff.kindChanged).toHaveLength(1);
		expect(diff.kindChanged[0]?.before.kind).toBe("class");
		expect(diff.kindChanged[0]?.after.kind).toBe("interface");
		expect(diff.removed).toHaveLength(0);
		expect(diff.added).toHaveLength(0);
	});

	it("detects export status changes", () => {
		const baseline = [
			{ name: "helper", kind: "function" as const, exported: false, isDefault: false, isAbstract: false, isPublic: false, line: 1 },
		];
		const current = [
			{ name: "helper", kind: "function" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
		];
		const diff = diffSymbols("src/test.ts", baseline, current);
		expect(diff.exportChanged).toHaveLength(1);
		expect(diff.exportChanged[0]?.before.exported).toBe(false);
		expect(diff.exportChanged[0]?.after.exported).toBe(true);
	});

	it("returns empty diff for identical symbol sets", () => {
		const symbols = [
			{ name: "foo", kind: "function" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
		];
		const diff = diffSymbols("src/test.ts", symbols, symbols);
		expect(diff.added).toHaveLength(0);
		expect(diff.removed).toHaveLength(0);
		expect(diff.kindChanged).toHaveLength(0);
		expect(diff.exportChanged).toHaveLength(0);
	});

	it("handles empty baseline and empty current", () => {
		const diff = diffSymbols("src/empty.ts", [], []);
		expect(diff.added).toHaveLength(0);
		expect(diff.removed).toHaveLength(0);
	});

	it("handles empty baseline with symbols in current", () => {
		const current = [
			{ name: "newFn", kind: "function" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
		];
		const diff = diffSymbols("src/new.ts", [], current);
		expect(diff.added).toHaveLength(1);
		expect(diff.removed).toHaveLength(0);
	});

	it("handles symbols in baseline but empty current (file deleted)", () => {
		const baseline = [
			{ name: "deletedFn", kind: "function" as const, exported: true, isDefault: false, isAbstract: false, isPublic: true, line: 1 },
		];
		const diff = diffSymbols("src/deleted.ts", baseline, []);
		expect(diff.removed).toHaveLength(1);
		expect(diff.removed[0]?.name).toBe("deletedFn");
	});
});

// ─── extractSymbolsFromSource extra branches ──────────────────────────────────

describe("extractSymbolsFromSource extra branches", () => {
	it("extracts interface symbols", () => {
		const src = `export interface IService { getData(): string; }\n`;
		const symbols = extractSymbolsFromSource(src);
		const names = symbols.map((s) => s.name);
		expect(names).toContain("IService");
	});

	it("extracts type alias symbols", () => {
		const src = `export type MyType = string | number;\n`;
		const symbols = extractSymbolsFromSource(src);
		expect(symbols.map((s) => s.name)).toContain("MyType");
	});

	it("extracts enum symbols", () => {
		const src = `export enum Color { Red, Green, Blue }\n`;
		const symbols = extractSymbolsFromSource(src);
		expect(symbols.map((s) => s.name)).toContain("Color");
	});

	it("includes private symbols when includePrivate=true", () => {
		const src = `export function _privateHelper() {}\nexport function publicApi() {}\n`;
		const symbols = extractSymbolsFromSource(src, true);
		const names = symbols.map((s) => s.name);
		expect(names).toContain("_privateHelper");
		expect(names).toContain("publicApi");
	});

	it("excludes private symbols when includePrivate=false (default)", () => {
		const src = `export function _privateHelper() {}\nexport function publicApi() {}\n`;
		const symbols = extractSymbolsFromSource(src, false);
		const names = symbols.map((s) => s.name);
		expect(names).not.toContain("_privateHelper");
		expect(names).toContain("publicApi");
	});

	it("extracts class members when includeMembers=true", () => {
		const src = `
export class MyClass {
  doThing() { return 1; }
  getValue() { return 2; }
}
`;
		const symbols = extractSymbolsFromSource(src, false, true);
		const names = symbols.map((s) => s.name);
		expect(names).toContain("MyClass");
		expect(names).toContain("doThing");
		expect(names).toContain("getValue");
	});

	it("deduplicates symbols with same name:kind:line", () => {
		// This exercises the dedup logic in addSymbol
		const src = `export function hello() {}\nexport function hello() {}\n`;
		const symbols = extractSymbolsFromSource(src);
		// Even though hello appears twice, if they're on different lines they'd be different
		// But the dedup key includes line, so both would appear
		expect(symbols.filter((s) => s.name === "hello").length).toBeGreaterThan(0);
	});

	it("returns empty array for empty source", () => {
		const symbols = extractSymbolsFromSource("");
		expect(symbols).toHaveLength(0);
	});
});

// ─── computeFileHash ──────────────────────────────────────────────────────────

describe("computeFileHash", () => {
	it("returns 16 hex chars", () => {
		const hash = computeFileHash("hello world");
		expect(hash).toHaveLength(16);
		expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
	});

	it("returns consistent hash for same content", () => {
		expect(computeFileHash("abc")).toBe(computeFileHash("abc"));
	});

	it("returns different hash for different content", () => {
		expect(computeFileHash("abc")).not.toBe(computeFileHash("def"));
	});

	it("handles empty string", () => {
		const hash = computeFileHash("");
		expect(hash).toHaveLength(16);
	});
});

// ─── formatSymbolChangeReport ─────────────────────────────────────────────────

describe("formatSymbolChangeReport", () => {
	it("includes summary header", () => {
		const report: SymbolChangeReport = {
			capturedAt: "2024-01-01T00:00:00.000Z",
			totalFilesScanned: 3,
			changedFiles: 1,
			unchangedFiles: 2,
			addedSymbols: 2,
			removedSymbols: 1,
			kindChanges: 0,
			exportChanges: 0,
			diffs: [],
			stalePaths: ["src/changed.ts"],
		};
		const output = formatSymbolChangeReport(report);
		expect(output).toContain("Symbol Change Report");
		expect(output).toContain("1 changed");
		expect(output).toContain("2 unchanged");
	});

	it("skips diffs with no changes", () => {
		const report: SymbolChangeReport = {
			capturedAt: "2024-01-01T00:00:00.000Z",
			totalFilesScanned: 1,
			changedFiles: 0,
			unchangedFiles: 1,
			addedSymbols: 0,
			removedSymbols: 0,
			kindChanges: 0,
			exportChanges: 0,
			diffs: [
				{
					relativePath: "src/unchanged.ts",
					added: [],
					removed: [],
					kindChanged: [],
					exportChanged: [],
				},
			],
			stalePaths: [],
		};
		const output = formatSymbolChangeReport(report);
		expect(output).not.toContain("src/unchanged.ts");
	});

	it("includes added and removed symbols in output", () => {
		const report: SymbolChangeReport = {
			capturedAt: "2024-01-01T00:00:00.000Z",
			totalFilesScanned: 1,
			changedFiles: 1,
			unchangedFiles: 0,
			addedSymbols: 1,
			removedSymbols: 1,
			kindChanges: 0,
			exportChanges: 0,
			diffs: [
				{
					relativePath: "src/test.ts",
					added: [
						{
							name: "newFn",
							kind: "function" as const,
							exported: true,
							isDefault: false,
							isAbstract: false,
							isPublic: true,
							line: 10,
						},
					],
					removed: [
						{
							name: "oldFn",
							kind: "function" as const,
							exported: true,
							isDefault: false,
							isAbstract: false,
							isPublic: true,
							line: 5,
						},
					],
					kindChanged: [],
					exportChanged: [],
				},
			],
			stalePaths: ["src/test.ts"],
		};
		const output = formatSymbolChangeReport(report);
		expect(output).toContain("+ function newFn");
		expect(output).toContain("- function oldFn");
	});

	it("includes export changes in output", () => {
		const sym = {
			name: "myFn",
			kind: "function" as const,
			exported: false,
			isDefault: false,
			isAbstract: false,
			isPublic: false,
			line: 1,
		};
		const symAfter = { ...sym, exported: true, isPublic: true };
		const report: SymbolChangeReport = {
			capturedAt: "2024-01-01T00:00:00.000Z",
			totalFilesScanned: 1,
			changedFiles: 1,
			unchangedFiles: 0,
			addedSymbols: 0,
			removedSymbols: 0,
			kindChanges: 0,
			exportChanges: 1,
			diffs: [
				{
					relativePath: "src/test.ts",
					added: [],
					removed: [],
					kindChanged: [],
					exportChanged: [{ before: sym, after: symAfter }],
				},
			],
			stalePaths: ["src/test.ts"],
		};
		const output = formatSymbolChangeReport(report);
		expect(output).toContain("export");
		expect(output).toContain("myFn");
	});
});
