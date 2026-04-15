/**
 * Tests for incremental-scanner: IncrementalScanner, diffIncrementalResults.
 */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	diffIncrementalResults,
	IncrementalScanner,
} from "../../snapshots/incremental-scanner.js";

// ─── Fixture helpers ──────────────────────────────────────────────────────────

async function writeTs(dir: string, name: string, content: string) {
	await writeFile(join(dir, name), content, "utf8");
}

// ─── IncrementalScanner ───────────────────────────────────────────────────────

describe("IncrementalScanner", () => {
	let repoDir: string;
	let cacheDir: string;
	let scanner: IncrementalScanner;

	beforeEach(async () => {
		repoDir = await mkdtemp(join(tmpdir(), "inc-scan-"));
		cacheDir = join(repoDir, ".cache");
		await mkdir(cacheDir, { recursive: true });
		scanner = new IncrementalScanner({
			repositoryRoot: repoDir,
			cacheDir,
			include: ["**/*.ts"],
			ignore: [],
		});
	});

	afterEach(async () => {
		await rm(repoDir, { recursive: true, force: true });
	});

	it("returns empty results on an empty repo", async () => {
		const result = await scanner.scan();
		expect(result.allPaths).toHaveLength(0);
		expect(result.changedPaths).toHaveLength(0);
		expect(result.newPaths).toHaveLength(0);
		expect(result.deletedPaths).toHaveLength(0);
	});

	it("detects new files on first scan", async () => {
		await writeTs(repoDir, "a.ts", "export function foo() {}");

		const result = await scanner.scan();
		expect(result.allPaths).toContain("a.ts");
		expect(result.newPaths).toContain("a.ts");
		expect(result.skippedPaths).toHaveLength(0);
	});

	it("skips unchanged files on second scan", async () => {
		await writeTs(repoDir, "b.ts", "export function bar() {}");

		await scanner.scan(); // first scan — marks as new

		const second = await scanner.scan();
		// File is unchanged — should be skipped
		expect(second.skippedPaths).toContain("b.ts");
		expect(second.changedPaths).toHaveLength(0);
		expect(second.newPaths).toHaveLength(0);
	});

	it("detects changed files on second scan", async () => {
		await writeTs(repoDir, "c.ts", "export function original() {}");
		await scanner.scan(); // first scan

		// Now modify the file
		await writeTs(repoDir, "c.ts", "export function modified() {}");

		const second = await scanner.scan();
		expect(second.changedPaths).toContain("c.ts");
	});

	it("detects deleted files between scans", async () => {
		await writeTs(repoDir, "d.ts", "export function toDelete() {}");
		await scanner.scan(); // first scan

		// Delete the file
		const { unlink } = await import("node:fs/promises");
		await unlink(join(repoDir, "d.ts"));

		const second = await scanner.scan();
		expect(second.deletedPaths).toContain("d.ts");
	});

	it("extracts exported symbols into symbolMap", async () => {
		await writeTs(
			repoDir,
			"e.ts",
			"export function alpha() {}\nexport const BETA = 1;\n",
		);

		const result = await scanner.scan();
		expect(result.symbolMap["e.ts"]).toEqual(
			expect.arrayContaining(["alpha", "BETA"]),
		);
	});

	it("reset clears snapshot state", async () => {
		await writeTs(repoDir, "f.ts", "export function resetMe() {}");
		await scanner.scan();

		await scanner.reset();

		// After reset, file should be detected as new again
		const second = await scanner.scan();
		expect(second.newPaths).toContain("f.ts");
	});

	it("getSymbolMap returns symbol map without scanning", async () => {
		await writeTs(repoDir, "g.ts", "export function getMe() {}");
		await scanner.scan();
		const map = scanner.getSymbolMap();
		expect(map["g.ts"]).toContain("getMe");
	});

	it("getFileSymbols returns symbols for a specific file", async () => {
		await writeTs(repoDir, "h.ts", "export class Baz {}\n");
		await scanner.scan();
		const symbols = scanner.getFileSymbols("h.ts");
		expect(symbols.some((s) => s.name === "Baz")).toBe(true);
	});
});

// ─── diffIncrementalResults ───────────────────────────────────────────────────

describe("diffIncrementalResults", () => {
	function makeScanResult(
		allPaths: string[],
		changedPaths: string[],
		symbolMap: Record<string, string[]>,
	) {
		return {
			capturedAt: new Date().toISOString(),
			repositoryRoot: "/repo",
			allPaths,
			changedPaths,
			newPaths: [],
			deletedPaths: [],
			skippedPaths: [],
			symbolMap,
			snapshots: new Map(),
		};
	}

	it("detects files added between runs", () => {
		const before = makeScanResult(["a.ts"], [], { "a.ts": ["foo"] });
		const after = makeScanResult(["a.ts", "b.ts"], ["b.ts"], {
			"a.ts": ["foo"],
			"b.ts": ["bar"],
		});
		const diff = diffIncrementalResults(before, after);
		expect(diff.filesAdded).toContain("b.ts");
	});

	it("detects files removed between runs", () => {
		const before = makeScanResult(["a.ts", "b.ts"], [], {
			"a.ts": ["foo"],
			"b.ts": ["bar"],
		});
		const after = makeScanResult(["a.ts"], [], { "a.ts": ["foo"] });
		const diff = diffIncrementalResults(before, after);
		expect(diff.filesRemoved).toContain("b.ts");
	});

	it("detects new symbols", () => {
		const before = makeScanResult(["a.ts"], [], { "a.ts": ["foo"] });
		const after = makeScanResult(["a.ts"], ["a.ts"], {
			"a.ts": ["foo", "bar"],
		});
		const diff = diffIncrementalResults(before, after);
		expect(diff.symbolsAdded).toContain("a.ts::bar");
	});

	it("detects removed symbols", () => {
		const before = makeScanResult(["a.ts"], [], { "a.ts": ["foo", "bar"] });
		const after = makeScanResult(["a.ts"], ["a.ts"], { "a.ts": ["foo"] });
		const diff = diffIncrementalResults(before, after);
		expect(diff.symbolsRemoved).toContain("a.ts::bar");
	});

	it("returns empty diff for identical results", () => {
		const before = makeScanResult(["a.ts"], [], { "a.ts": ["foo"] });
		const after = makeScanResult(["a.ts"], [], { "a.ts": ["foo"] });
		const diff = diffIncrementalResults(before, after);
		expect(diff.filesAdded).toHaveLength(0);
		expect(diff.filesRemoved).toHaveLength(0);
		expect(diff.symbolsAdded).toHaveLength(0);
		expect(diff.symbolsRemoved).toHaveLength(0);
	});
});
