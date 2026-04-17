/**
 * Tests for SymbolChangeTracker and related utilities in
 * src/snapshots/symbol-change-tracker.ts.
 */

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

	it("watch() returns a stop function that can be called without error", () => {
		const tracker = new SymbolChangeTracker({ repositoryRoot: "/tmp" });
		const stop = tracker.watch([], 100_000);
		expect(typeof stop).toBe("function");
		stop(); // should not throw
	});
});

// ─── SymbolChangeTracker: filesystem integration ──────────────────────────────

describe("SymbolChangeTracker — filesystem", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = join(
			tmpdir(),
			`sct-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		await mkdir(tempDir, { recursive: true });
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it("snapshot() reads files and returns TrackedSymbol[]", async () => {
		await writeFile(
			join(tempDir, "mod.ts"),
			"export function hello() {}\nexport class World {}\n",
		);
		const tracker = new SymbolChangeTracker({ repositoryRoot: tempDir });
		const snaps = await tracker.snapshot(["mod.ts"]);
		expect(snaps).toHaveLength(1);
		const names = snaps[0]?.symbols.map((s) => s.name) ?? [];
		expect(names).toContain("hello");
		expect(names).toContain("World");
	});

	it("snapshot() silently skips unreadable files", async () => {
		const tracker = new SymbolChangeTracker({ repositoryRoot: tempDir });
		const snaps = await tracker.snapshot(["nonexistent.ts"]);
		expect(snaps).toHaveLength(0);
	});

	it("diff() reports unchanged when content hash matches", async () => {
		await writeFile(join(tempDir, "a.ts"), "export const X = 1;\n");
		const tracker = new SymbolChangeTracker({ repositoryRoot: tempDir });
		const baseline = await tracker.snapshot(["a.ts"]);
		const report = await tracker.diff(baseline, ["a.ts"]);
		expect(report.unchangedFiles).toBe(1);
		expect(report.changedFiles).toBe(0);
	});

	it("diff() reports added symbols when file content changes", async () => {
		const path = join(tempDir, "b.ts");
		await writeFile(path, "export const X = 1;\n");
		const tracker = new SymbolChangeTracker({ repositoryRoot: tempDir });
		const baseline = await tracker.snapshot(["b.ts"]);
		// Modify file
		await writeFile(path, "export const X = 1;\nexport const Y = 2;\n");
		const report = await tracker.diff(baseline, ["b.ts"]);
		expect(report.addedSymbols).toBeGreaterThan(0);
	});

	it("diff() emits 'change' event for changed files", async () => {
		const path = join(tempDir, "c.ts");
		await writeFile(path, "export const A = 1;\n");
		const tracker = new SymbolChangeTracker({ repositoryRoot: tempDir });
		const baseline = await tracker.snapshot(["c.ts"]);
		await writeFile(path, "export const A = 1;\nexport const B = 2;\n");

		const changes: unknown[] = [];
		tracker.on("change", (d) => changes.push(d));
		await tracker.diff(baseline, ["c.ts"]);
		expect(changes.length).toBeGreaterThan(0);
	});

	it("diff() reports all symbols removed when baseline file is deleted from paths", async () => {
		const path = join(tempDir, "d.ts");
		await writeFile(path, "export const X = 1;\n");
		const tracker = new SymbolChangeTracker({ repositoryRoot: tempDir });
		const baseline = await tracker.snapshot(["d.ts"]);
		// Do NOT include "d.ts" in the current paths → simulates deletion
		const report = await tracker.diff(baseline, []);
		expect(report.removedSymbols).toBeGreaterThan(0);
		expect(report.stalePaths).toContain("d.ts");
	});
});

describe("extractSymbolsFromSource — class properties", () => {
	it("extracts typed class properties with access modifiers (includeMembers=true)", () => {
		const src = `
export class Config {
  public readonly version: string = "1";
  private secret: string = "x";
  protected name: string;
  static count: number = 0;
}
`;
		const symbols = extractSymbolsFromSource(src, false, true);
		const propNames = symbols
			.filter((s) => s.kind === "property")
			.map((s) => s.name);
		// "version", "count" (non-private public/static) should appear; private/protected skipped when includePrivate=false
		expect(propNames).toContain("version");
	});

	it("includes private class properties when includePrivate=true", () => {
		const src = `
export class Auth {
  private _token: string = "";
  public userId: string = "";
}
`;
		const symbols = extractSymbolsFromSource(src, true, true);
		const propNames = symbols
			.filter((s) => s.kind === "property")
			.map((s) => s.name);
		expect(propNames).toContain("_token");
		expect(propNames).toContain("userId");
	});
});

describe("formatSymbolChangeReport — edge cases", () => {
	it("skips diffs where all change arrays are empty", () => {
		const report: SymbolChangeReport = {
			capturedAt: new Date().toISOString(),
			totalFilesScanned: 2,
			changedFiles: 0,
			unchangedFiles: 2,
			addedSymbols: 0,
			removedSymbols: 0,
			kindChanges: 0,
			exportChanges: 0,
			stalePaths: [],
			diffs: [
				{
					relativePath: "src/clean.ts",
					added: [],
					removed: [],
					kindChanged: [],
					exportChanged: [],
				},
			],
		};
		const formatted = formatSymbolChangeReport(report);
		// The empty diff should be skipped — "src/clean.ts" should NOT appear in output
		expect(formatted).not.toContain("src/clean.ts");
	});

	it("includes kind-changed and export-changed lines", () => {
		const sym = (
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
			line: 1,
		});
		const report: SymbolChangeReport = {
			capturedAt: new Date().toISOString(),
			totalFilesScanned: 1,
			changedFiles: 1,
			unchangedFiles: 0,
			addedSymbols: 0,
			removedSymbols: 0,
			kindChanges: 1,
			exportChanges: 1,
			stalePaths: [],
			diffs: [
				{
					relativePath: "src/changed.ts",
					added: [],
					removed: [],
					kindChanged: [
						{ before: sym("Foo", "function"), after: sym("Foo", "class") },
					],
					exportChanged: [
						{
							before: sym("bar", "function", false),
							after: sym("bar", "function", true),
						},
					],
				},
			],
		};
		const formatted = formatSymbolChangeReport(report);
		expect(formatted).toContain("function→class");
		expect(formatted).toContain("private→public");
	});
});
