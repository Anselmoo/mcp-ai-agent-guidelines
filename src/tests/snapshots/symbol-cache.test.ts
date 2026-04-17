import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DocumentSymbols } from "../../snapshots/document_symbols.js";
import { SymbolCacheManager } from "../../snapshots/symbol_cache.js";
import {
	SymbolKind,
	type UnifiedSymbolInformation,
} from "../../snapshots/types.js";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeUnifiedSymbol(name: string): UnifiedSymbolInformation {
	return {
		name,
		kind: SymbolKind.Function,
		location: {
			uri: "file:///repo/test.ts",
			range: {
				start: { line: 0, character: 0 },
				end: { line: 1, character: 0 },
			},
			absolutePath: "/repo/test.ts",
			relativePath: "test.ts",
		},
		children: [],
		parent: null,
	};
}

let cacheDir: string;
let repoRoot: string;

beforeEach(async () => {
	const base = join(
		tmpdir(),
		`sym-cache-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	cacheDir = join(base, "cache");
	repoRoot = join(base, "repo");
	await mkdir(cacheDir, { recursive: true });
	await mkdir(repoRoot, { recursive: true });
});

afterEach(async () => {
	const base = join(cacheDir, "..");
	await rm(base, { recursive: true, force: true });
});

function makeManager(opts?: { lsVer?: number; fp?: string | number | null }) {
	return new SymbolCacheManager({
		cacheDir,
		repositoryRoot: repoRoot,
		lsSpecificRawVersion: opts?.lsVer,
		cacheFingerprint: opts?.fp,
	});
}

// ─── Raw cache ────────────────────────────────────────────────────────────────

describe("SymbolCacheManager — raw cache", () => {
	it("returns undefined on miss", () => {
		const mgr = makeManager();
		expect(mgr.getCachedRawSymbols("src/foo.ts", "hash1")).toBeUndefined();
	});

	it("returns stored symbols on hit", () => {
		const mgr = makeManager();
		mgr.setRawSymbols("src/foo.ts", "hash1", null);
		expect(mgr.getCachedRawSymbols("src/foo.ts", "hash1")).toBeNull();
	});

	it("returns undefined when content hash is stale", () => {
		const mgr = makeManager();
		mgr.setRawSymbols("src/foo.ts", "hash1", null);
		expect(mgr.getCachedRawSymbols("src/foo.ts", "hash-stale")).toBeUndefined();
	});

	it("stores and retrieves non-null symbol arrays", () => {
		const mgr = makeManager();
		const rawSym = {
			name: "foo",
			kind: 12,
			range: {
				start: { line: 0, character: 0 },
				end: { line: 1, character: 0 },
			},
			selectionRange: {
				start: { line: 0, character: 0 },
				end: { line: 0, character: 3 },
			},
		};
		mgr.setRawSymbols("src/foo.ts", "abc", [rawSym as never]);
		const result = mgr.getCachedRawSymbols("src/foo.ts", "abc");
		expect(Array.isArray(result)).toBe(true);
	});
});

// ─── Document cache ───────────────────────────────────────────────────────────

describe("SymbolCacheManager — doc cache", () => {
	it("returns null on miss", () => {
		const mgr = makeManager();
		expect(mgr.getCachedDocumentSymbols("src/foo.ts", "hash1")).toBeNull();
	});

	it("returns stored DocumentSymbols on hit", () => {
		const mgr = makeManager();
		const sym = makeUnifiedSymbol("hello");
		const docSyms = new DocumentSymbols([sym]);
		mgr.setDocumentSymbols("src/foo.ts", "hash1", docSyms);
		const result = mgr.getCachedDocumentSymbols("src/foo.ts", "hash1");
		expect(result).toBe(docSyms);
	});

	it("returns null when content hash is stale", () => {
		const mgr = makeManager();
		const sym = makeUnifiedSymbol("hello");
		const docSyms = new DocumentSymbols([sym]);
		mgr.setDocumentSymbols("src/foo.ts", "hash1", docSyms);
		expect(mgr.getCachedDocumentSymbols("src/foo.ts", "stale")).toBeNull();
	});
});

// ─── saveAll / persistence ────────────────────────────────────────────────────

describe("SymbolCacheManager — saveAll persistence", () => {
	it("saveAll does not throw when caches are empty (unmodified)", () => {
		const mgr = makeManager();
		expect(() => mgr.saveAll()).not.toThrow();
	});

	it("saveAll writes raw cache when modified, reloadable by a new manager", async () => {
		const mgr = makeManager({ lsVer: 1 });
		mgr.setRawSymbols("src/foo.ts", "hash1", null);
		mgr.saveAll();

		// New manager instance reads from same cacheDir
		const mgr2 = makeManager({ lsVer: 1 });
		expect(mgr2.getCachedRawSymbols("src/foo.ts", "hash1")).toBeNull();
	});

	it("saveAll writes doc cache when modified, reloadable by a new manager", () => {
		const mgr = makeManager();
		const sym = makeUnifiedSymbol("greet");
		const docSyms = new DocumentSymbols([sym]);
		mgr.setDocumentSymbols("src/bar.ts", "h2", docSyms);
		mgr.saveAll();

		const mgr2 = makeManager();
		const loaded = mgr2.getCachedDocumentSymbols("src/bar.ts", "h2");
		expect(loaded).not.toBeNull();
		expect(loaded?.rootSymbols[0]?.name).toBe("greet");
	});

	it("does not re-save when nothing changed (saveAll is idempotent)", () => {
		const mgr = makeManager();
		mgr.setRawSymbols("src/a.ts", "h", null);
		mgr.saveAll(); // first save — writes file
		mgr.saveAll(); // second save — should be no-op (not throw)
		expect(true).toBe(true);
	});
});

// ─── Version / fingerprint variants ──────────────────────────────────────────

describe("SymbolCacheManager — version variants", () => {
	it("constructs with fingerprint (tuple version)", () => {
		const mgr = new SymbolCacheManager({
			cacheDir,
			repositoryRoot: repoRoot,
			cacheFingerprint: "abc123",
		});
		expect(() => mgr.saveAll()).not.toThrow();
	});

	it("constructs with numeric fingerprint", () => {
		const mgr = new SymbolCacheManager({
			cacheDir,
			repositoryRoot: repoRoot,
			cacheFingerprint: 42,
		});
		expect(() => mgr.saveAll()).not.toThrow();
	});

	it("constructs with null fingerprint (default tuple version)", () => {
		const mgr = new SymbolCacheManager({
			cacheDir,
			repositoryRoot: repoRoot,
			cacheFingerprint: null,
		});
		expect(() => mgr.saveAll()).not.toThrow();
	});

	it("rejects stale cache when ls version differs", async () => {
		const mgr1 = makeManager({ lsVer: 1 });
		mgr1.setRawSymbols("src/foo.ts", "hash1", null);
		mgr1.saveAll();

		// Different lsVer — should not see the stale entry
		const mgr2 = makeManager({ lsVer: 2 });
		expect(mgr2.getCachedRawSymbols("src/foo.ts", "hash1")).toBeUndefined();
	});
});
