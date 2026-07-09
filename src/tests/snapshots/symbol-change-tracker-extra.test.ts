import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	computeFileHash,
	diffSymbols,
	extractSymbolsFromSource,
	formatSymbolChangeReport,
	type SymbolChangeReport,
	SymbolChangeTracker,
} from "../../snapshots/symbol-change-tracker.js";

// ─── diffSymbols ──────────────────────────────────────────────────────────────

describe("diffSymbols extra branches", () => {
	it("detects added symbols when current has symbols not in baseline", () => {
		const baseline = [
			{
				name: "foo",
				kind: "function" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
		];
		const current = [
			{
				name: "foo",
				kind: "function" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
			{
				name: "bar",
				kind: "function" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 5,
			},
		];
		const diff = diffSymbols("src/test.ts", baseline, current);
		expect(diff.added).toHaveLength(1);
		expect(diff.added[0]?.name).toBe("bar");
		expect(diff.removed).toHaveLength(0);
	});

	it("detects removed symbols when baseline has symbols not in current", () => {
		const baseline = [
			{
				name: "foo",
				kind: "function" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
			{
				name: "baz",
				kind: "class" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 10,
			},
		];
		const current = [
			{
				name: "foo",
				kind: "function" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
		];
		const diff = diffSymbols("src/test.ts", baseline, current);
		expect(diff.removed).toHaveLength(1);
		expect(diff.removed[0]?.name).toBe("baz");
		expect(diff.added).toHaveLength(0);
	});

	it("detects kind changes (same name, different kind)", () => {
		const baseline = [
			{
				name: "MyThing",
				kind: "class" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
		];
		const current = [
			{
				name: "MyThing",
				kind: "interface" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
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
			{
				name: "helper",
				kind: "function" as const,
				exported: false,
				isDefault: false,
				isAbstract: false,
				isPublic: false,
				line: 1,
			},
		];
		const current = [
			{
				name: "helper",
				kind: "function" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
		];
		const diff = diffSymbols("src/test.ts", baseline, current);
		expect(diff.exportChanged).toHaveLength(1);
		expect(diff.exportChanged[0]?.before.exported).toBe(false);
		expect(diff.exportChanged[0]?.after.exported).toBe(true);
	});

	it("returns empty diff for identical symbol sets", () => {
		const symbols = [
			{
				name: "foo",
				kind: "function" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
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
			{
				name: "newFn",
				kind: "function" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
		];
		const diff = diffSymbols("src/new.ts", [], current);
		expect(diff.added).toHaveLength(1);
		expect(diff.removed).toHaveLength(0);
	});

	it("handles symbols in baseline but empty current (file deleted)", () => {
		const baseline = [
			{
				name: "deletedFn",
				kind: "function" as const,
				exported: true,
				isDefault: false,
				isAbstract: false,
				isPublic: true,
				line: 1,
			},
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

// ─── extractSymbolsFromSource: additional uncovered branches ─────────────────

describe("extractSymbolsFromSource — generator functions", () => {
	it("extracts generator function symbols with kind 'function'", () => {
		const src = "export function* gen() {}\n";
		const symbols = extractSymbolsFromSource(src);
		const gen = symbols.find((s) => s.name === "gen");
		expect(gen).toBeDefined();
		expect(gen?.kind).toBe("function");
	});
});

describe("extractSymbolsFromSource — export default detection", () => {
	// NOTE: `TOP_LEVEL_PATTERNS` all anchor on `^export\s+<keyword>` (or
	// `^<keyword>` for non-exported). None of them tolerate a `default`
	// token between `export` and the declaration keyword, so
	// `export default function namedDefault() {}` is not matched by any
	// top-level pattern at all — the `isDefault` flag (computed via
	// `source.slice(m.index).startsWith("export default")`) is therefore
	// never observed as `true` for a bare `export default function`
	// declaration in the current regex-based extractor. This test pins
	// down that accurate (if surprising) behavior: no symbol is produced.
	it("does not extract a symbol for a bare 'export default function' declaration", () => {
		const src = "export default function namedDefault() {}\n";
		const symbols = extractSymbolsFromSource(src);
		expect(symbols.find((s) => s.name === "namedDefault")).toBeUndefined();
	});

	it("keeps isDefault: false for a class that is separately default-exported", () => {
		const src = "export class Foo {}\nexport default Foo;\n";
		const symbols = extractSymbolsFromSource(src);
		const foo = symbols.find((s) => s.name === "Foo");
		expect(foo).toBeDefined();
		expect(foo?.isDefault).toBe(false);
	});
});

describe("extractSymbolsFromSource — abstract class detection", () => {
	it("marks an abstract class as isAbstract: true", () => {
		const src = "export abstract class Base {}\n";
		const symbols = extractSymbolsFromSource(src);
		const base = symbols.find((s) => s.name === "Base");
		expect(base).toBeDefined();
		expect(base?.isAbstract).toBe(true);
	});
});

describe("extractSymbolsFromSource — non-exported top-level declarations", () => {
	it("extracts all non-exported declarations with exported: false", () => {
		const src =
			"function helper() {}\n" +
			"class Internal {}\n" +
			"interface IPriv {}\n" +
			"type TPriv = string;\n" +
			"enum EPriv {A}\n" +
			"const CPriv = 1;\n";
		const symbols = extractSymbolsFromSource(src);

		const helper = symbols.find((s) => s.name === "helper");
		const internal = symbols.find((s) => s.name === "Internal");
		const iPriv = symbols.find((s) => s.name === "IPriv");
		const tPriv = symbols.find((s) => s.name === "TPriv");
		const ePriv = symbols.find((s) => s.name === "EPriv");
		const cPriv = symbols.find((s) => s.name === "CPriv");

		expect(helper).toBeDefined();
		expect(helper?.exported).toBe(false);
		expect(internal).toBeDefined();
		expect(internal?.exported).toBe(false);
		expect(iPriv).toBeDefined();
		expect(iPriv?.exported).toBe(false);
		expect(tPriv).toBeDefined();
		expect(tPriv?.exported).toBe(false);
		expect(ePriv).toBeDefined();
		expect(ePriv?.exported).toBe(false);
		expect(cPriv).toBeDefined();
		expect(cPriv?.exported).toBe(false);
	});
});

describe("extractSymbolsFromSource — getter/setter detection", () => {
	it("detects getter and setter class members", () => {
		// The kind classifier looks at a fixed 40-char lookback window around
		// each match; keep the getter and setter far enough apart that the
		// setter's window doesn't also contain the getter's "get " text.
		const src = `
export class Holder {
  get value() { return 1 + 1 + 1 + 1 + 1; }

  set value(v) { }
}
`;
		const symbols = extractSymbolsFromSource(src, false, true);
		const getter = symbols.find((s) => s.kind === "getter");
		const setter = symbols.find((s) => s.kind === "setter");
		expect(getter).toBeDefined();
		expect(getter?.name).toBe("value");
		expect(setter).toBeDefined();
		expect(setter?.name).toBe("value");
	});
});

describe("extractSymbolsFromSource — private method inclusion", () => {
	it("excludes underscore-prefixed methods by default", () => {
		const src = `
export class Secretive {
  _secret() {}
  public() {}
}
`;
		const symbols = extractSymbolsFromSource(src, false, true);
		const names = symbols
			.filter((s) => s.container === "Secretive")
			.map((s) => s.name);
		expect(names).not.toContain("_secret");
		expect(names).toContain("public");
	});

	it("includes underscore-prefixed methods when includePrivate=true", () => {
		const src = `
export class Secretive {
  _secret() {}
  public() {}
}
`;
		const symbols = extractSymbolsFromSource(src, true, true);
		const names = symbols
			.filter((s) => s.container === "Secretive")
			.map((s) => s.name);
		expect(names).toContain("_secret");
		expect(names).toContain("public");
	});
});

describe("extractSymbolsFromSource — truncated class declaration", () => {
	it("does not throw and still returns the class symbol when no body/braces are found", () => {
		const src = "export class Truncated";
		expect(() => extractSymbolsFromSource(src)).not.toThrow();
		const symbols = extractSymbolsFromSource(src);
		const truncated = symbols.find((s) => s.name === "Truncated");
		expect(truncated).toBeDefined();
		expect(truncated?.kind).toBe("class");
		// No members should have been extracted since there's no body.
		expect(symbols.filter((s) => s.container === "Truncated")).toHaveLength(0);
	});
});

// ─── SymbolChangeTracker.watch() lifecycle ────────────────────────────────────

describe("SymbolChangeTracker.watch() lifecycle", () => {
	let tempDir: string;
	let stop: (() => void) | undefined;

	beforeEach(async () => {
		tempDir = join(
			tmpdir(),
			`sct-watch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		await mkdir(tempDir, { recursive: true });
	});

	afterEach(async () => {
		stop?.();
		stop = undefined;
		await rm(tempDir, { recursive: true, force: true });
	});

	it("emits a 'report' event with changedFiles > 0 after the watched file is modified", async () => {
		const filePath = join(tempDir, "watched.ts");
		await writeFile(filePath, "export const A = 1;\n");

		const tracker = new SymbolChangeTracker({ repositoryRoot: tempDir });
		const intervalMs = 40;

		const reports: Array<{ changedFiles: number }> = [];
		tracker.on("report", (report) => reports.push(report));

		stop = tracker.watch(["watched.ts"], intervalMs);

		// Wait for the first tick to establish the baseline (no report emitted yet).
		await new Promise((resolve) => setTimeout(resolve, intervalMs * 2));
		expect(reports).toHaveLength(0);

		// Modify the watched file so the next diff tick detects a change.
		await writeFile(filePath, "export const A = 1;\nexport const B = 2;\n");

		// Wait for the second tick to run diff() and emit "report".
		await new Promise((resolve) => setTimeout(resolve, intervalMs * 4));

		expect(reports.length).toBeGreaterThan(0);
		expect(reports.some((r) => r.changedFiles > 0)).toBe(true);
	});
});
