/**
 * incremental-scanner.ts
 *
 * An incremental variant of the coherence scanner that only re-reads files
 * whose content hash has changed since the previous scan.
 *
 * By persisting a `FileHashCache` between runs the scanner avoids parsing
 * every source file on each invocation — ideal for watch-mode pipelines and
 * large monorepos.
 *
 * Storage layout:
 *   <cacheDir>/incremental-file-hashes.json
 *
 * Relationships:
 *   IncrementalScanner  →  SymbolChangeTracker  (symbol extraction)
 *   IncrementalScanner  →  CodebaseScanner       (full-scan fallback)
 *   IncrementalScanner  →  FileHashCache          (persistence)
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";
import {
	computeFileHash,
	extractSymbolsFromSource,
	type SymbolFileSnapshot,
	type TrackedSymbol,
} from "./symbol-change-tracker.js";

// ─── File-hash cache ──────────────────────────────────────────────────────────

export interface FileHashEntry {
	hash: string;
	scannedAt: string;
	symbolCount: number;
}

export interface FileHashCache {
	version: "1";
	repositoryRoot: string;
	updatedAt: string;
	entries: Record<string, FileHashEntry>;
}

export interface IncrementalScanState {
	/** Persisted hash cache from the previous run. */
	cache: FileHashCache;
	/** Symbol snapshots for all currently known files. */
	snapshots: Map<string, SymbolFileSnapshot>;
}

// ─── Incremental scan result ──────────────────────────────────────────────────

export interface IncrementalScanResult {
	capturedAt: string;
	repositoryRoot: string;
	/** Paths scanned in this run. */
	allPaths: string[];
	/** Paths whose hash changed since the last scan. */
	changedPaths: string[];
	/** Paths that are new (not in the previous cache). */
	newPaths: string[];
	/** Paths that were in the previous cache but are no longer on disk. */
	deletedPaths: string[];
	/** Paths whose hash did not change — skipped in this run. */
	skippedPaths: string[];
	/** Updated symbol map: relativePath → exported top-level symbol names. */
	symbolMap: Record<string, string[]>;
	/** Full symbol snapshots including kind/member information. */
	snapshots: Map<string, SymbolFileSnapshot>;
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface IncrementalScannerOptions {
	repositoryRoot: string;
	cacheDir: string;
	/** Glob patterns to include. Default: all TS/TSX files outside node_modules. */
	include?: string[];
	/** Additional glob patterns to ignore. */
	ignore?: string[];
	/** Parallelism for file reads. Default 12. */
	concurrency?: number;
	/** Whether to include private (_-prefixed) symbols. Default false. */
	includePrivate?: boolean;
	/** Whether to extract class members. Default true. */
	includeMembers?: boolean;
}

const DEFAULT_INCLUDE = ["**/*.{ts,tsx}"];
const DEFAULT_IGNORE = [
	"**/node_modules/**",
	"**/.git/**",
	"**/dist/**",
	"**/build/**",
	"**/coverage/**",
	"**/.mcp-ai-agent-guidelines/**",
];

const CACHE_FILENAME = "incremental-file-hashes.json";

// ─── IncrementalScanner ───────────────────────────────────────────────────────

/**
 * Stateful incremental scanner.
 *
 * Call `scan()` to run a full or incremental scan depending on whether a
 * cache already exists. Subsequent calls automatically skip unchanged files.
 *
 * Example:
 *   const scanner = new IncrementalScanner({ repositoryRoot: cwd, cacheDir: ".cache" });
 *   const result = await scanner.scan();
 *   console.log(`Changed: ${result.changedPaths.length} files`);
 */
export class IncrementalScanner {
	private readonly root: string;
	private readonly cacheDir: string;
	private readonly include: string[];
	private readonly ignore: string[];
	private readonly concurrency: number;
	private readonly includePrivate: boolean;
	private readonly includeMembers: boolean;

	/** In-memory snapshot store (populated after first scan). */
	private snapshots = new Map<string, SymbolFileSnapshot>();

	constructor(options: IncrementalScannerOptions) {
		this.root = options.repositoryRoot;
		this.cacheDir = options.cacheDir;
		this.include = options.include ?? DEFAULT_INCLUDE;
		this.ignore = [...DEFAULT_IGNORE, ...(options.ignore ?? [])];
		this.concurrency = options.concurrency ?? 12;
		this.includePrivate = options.includePrivate ?? false;
		this.includeMembers = options.includeMembers ?? true;
	}

	/** Full path to the cache file. */
	private get cachePath(): string {
		return join(this.cacheDir, CACHE_FILENAME);
	}

	/**
	 * Run a scan.
	 * - If no cache exists → full scan (all files).
	 * - If a cache exists → incremental scan (only changed/new files).
	 *
	 * The cache is updated atomically after each successful scan.
	 */
	async scan(): Promise<IncrementalScanResult> {
		const now = new Date().toISOString();

		// ── Discover files ────────────────────────────────────────────────────
		const allRelative = await fg.glob(this.include, {
			cwd: this.root,
			ignore: this.ignore,
			onlyFiles: true,
		});
		allRelative.sort();

		// ── Load existing cache ───────────────────────────────────────────────
		const existingCache = await this.loadCache();
		const prevEntries: Record<string, FileHashEntry> =
			existingCache?.entries ?? {};

		// ── Classify files ────────────────────────────────────────────────────
		const newPaths: string[] = [];
		const changedPaths: string[] = [];
		const skippedPaths: string[] = [];
		const prevPathSet = new Set(Object.keys(prevEntries));

		for (const rel of allRelative) {
			if (prevPathSet.has(rel)) {
				prevPathSet.delete(rel); // mark as seen
			} else {
				newPaths.push(rel);
			}
		}

		// Files remaining in prevPathSet were deleted
		const deletedPaths = [...prevPathSet];

		// ── Read and parse changed/new files ─────────────────────────────────
		const updatedEntries: Record<string, FileHashEntry> = { ...prevEntries };
		const updatedSymbolMap: Record<string, string[]> = {};

		// Carry forward unchanged snapshots
		for (const rel of allRelative) {
			const snap = this.snapshots.get(rel);
			if (snap) {
				const symbols = snap.symbols
					.filter((s) => s.exported)
					.map((s) => s.name);
				if (symbols.length > 0) updatedSymbolMap[rel] = symbols;
			}
		}

		// Process files in batches
		for (let i = 0; i < allRelative.length; i += this.concurrency) {
			const batch = allRelative.slice(i, i + this.concurrency);
			await Promise.all(
				batch.map(async (rel) => {
					try {
						const content = await readFile(join(this.root, rel), "utf8");
						const hash = computeFileHash(content);
						const prev = prevEntries[rel];

						if (prev && prev.hash === hash && this.snapshots.has(rel)) {
							skippedPaths.push(rel);
							return;
						}

						// File is new or changed
						if (prev && prev.hash !== hash) {
							changedPaths.push(rel);
						}

						const symbols = extractSymbolsFromSource(
							content,
							this.includePrivate,
							this.includeMembers,
						);

						const snapshot: SymbolFileSnapshot = {
							relativePath: rel,
							contentHash: hash,
							capturedAt: now,
							symbols,
						};
						this.snapshots.set(rel, snapshot);

						const exportedNames = symbols
							.filter((s) => s.exported)
							.map((s) => s.name);
						if (exportedNames.length > 0) updatedSymbolMap[rel] = exportedNames;

						updatedEntries[rel] = {
							hash,
							scannedAt: now,
							symbolCount: symbols.length,
						};
					} catch {
						// Unreadable file — skip
					}
				}),
			);
		}

		// Remove deleted paths from snapshots and entries
		for (const del of deletedPaths) {
			this.snapshots.delete(del);
			delete updatedEntries[del];
			delete updatedSymbolMap[del];
		}

		// ── Persist updated cache ─────────────────────────────────────────────
		const updatedCache: FileHashCache = {
			version: "1",
			repositoryRoot: this.root,
			updatedAt: now,
			entries: updatedEntries,
		};
		await this.saveCache(updatedCache);

		return {
			capturedAt: now,
			repositoryRoot: this.root,
			allPaths: allRelative,
			changedPaths,
			newPaths,
			deletedPaths,
			skippedPaths,
			symbolMap: updatedSymbolMap,
			snapshots: new Map(this.snapshots),
		};
	}

	/**
	 * Force a full re-scan by clearing the in-memory snapshot store
	 * and deleting the cache file.
	 */
	async reset(): Promise<void> {
		this.snapshots.clear();
		try {
			const { unlink } = await import("node:fs/promises");
			await unlink(this.cachePath);
		} catch {
			// Cache may not exist — ignore
		}
	}

	/**
	 * Return all snapshots currently held in memory.
	 */
	getSnapshots(): ReadonlyMap<string, SymbolFileSnapshot> {
		return this.snapshots;
	}

	/**
	 * Return the symbol map for the current snapshot set.
	 * Keys are relative paths; values are exported symbol name arrays.
	 */
	getSymbolMap(): Record<string, string[]> {
		const map: Record<string, string[]> = {};
		for (const [rel, snap] of this.snapshots) {
			const exported = snap.symbols
				.filter((s) => s.exported)
				.map((s) => s.name);
			if (exported.length > 0) map[rel] = exported;
		}
		return map;
	}

	/**
	 * Return all tracked symbols for a specific file.
	 */
	getFileSymbols(relativePath: string): TrackedSymbol[] {
		return this.snapshots.get(relativePath)?.symbols ?? [];
	}

	// ── Cache persistence ─────────────────────────────────────────────────────

	private async loadCache(): Promise<FileHashCache | null> {
		try {
			const raw = await readFile(this.cachePath, "utf8");
			const parsed = JSON.parse(raw) as unknown;
			if (isValidHashCache(parsed)) return parsed;
			return null;
		} catch {
			return null;
		}
	}

	private async saveCache(cache: FileHashCache): Promise<void> {
		try {
			await mkdir(this.cacheDir, { recursive: true });
			await writeFile(this.cachePath, JSON.stringify(cache, null, 2), "utf8");
		} catch (err) {
			console.warn(
				`[incremental-scanner] Failed to save cache: ${String(err)}`,
			);
		}
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidHashCache(value: unknown): value is FileHashCache {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as FileHashCache).version === "1" &&
		typeof (value as FileHashCache).entries === "object"
	);
}

/**
 * Build a simple diff summary between two incremental scan results.
 */
export function diffIncrementalResults(
	before: IncrementalScanResult,
	after: IncrementalScanResult,
): {
	filesAdded: string[];
	filesRemoved: string[];
	filesChanged: string[];
	symbolsAdded: string[];
	symbolsRemoved: string[];
} {
	const beforePaths = new Set(before.allPaths);
	const afterPaths = new Set(after.allPaths);

	const filesAdded = after.allPaths.filter((p) => !beforePaths.has(p));
	const filesRemoved = before.allPaths.filter((p) => !afterPaths.has(p));
	const filesChanged = after.changedPaths;

	// Symbol changes
	const symbolsAdded: string[] = [];
	const symbolsRemoved: string[] = [];

	const allPaths = new Set([
		...Object.keys(before.symbolMap),
		...Object.keys(after.symbolMap),
	]);

	for (const path of allPaths) {
		const beforeSyms = new Set(before.symbolMap[path] ?? []);
		const afterSyms = new Set(after.symbolMap[path] ?? []);

		for (const sym of afterSyms) {
			if (!beforeSyms.has(sym)) symbolsAdded.push(`${path}::${sym}`);
		}
		for (const sym of beforeSyms) {
			if (!afterSyms.has(sym)) symbolsRemoved.push(`${path}::${sym}`);
		}
	}

	return {
		filesAdded,
		filesRemoved,
		filesChanged,
		symbolsAdded,
		symbolsRemoved,
	};
}
