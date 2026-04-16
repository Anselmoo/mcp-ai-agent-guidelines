// ─── symbol_cache.ts ─────────────────────────────────────────────────────────
// The main two-layer cache manager.
// Direct analogue of the cache methods in SolidLanguageServer (ls.py lines 493–508,
// 1262–1469, 2361–2468).
//
// Architecture:
//
//   raw_document_symbols.json  ←→  _rawCache   (layer 1 — LSP wire output)
//   document_symbols.json      ←→  _docCache   (layer 2 — enriched symbol trees)

import * as path from "node:path";
import { type CacheVersion, loadCache, saveCache } from "./cache_io.js";
import { DocumentSymbols } from "./document_symbols.js";
import {
	DocumentSymbolsCacheSchema,
	type PersistedUnifiedSymbolSerialized,
	RawDocumentSymbolsCacheSchema,
} from "./schemas.js";
import type {
	RawLspSymbol,
	SymbolKind,
	UnifiedSymbolInformation,
} from "./types.js";

// ─── Version constants ────────────────────────────────────────────────────────
// Mirrors the Python class constants:
//   RAW_DOCUMENT_SYMBOLS_CACHE_VERSION = 1
//   DOCUMENT_SYMBOL_CACHE_VERSION = 4

const RAW_CACHE_VERSION_BASE = 1;
const DOC_CACHE_VERSION = 4;

const RAW_CACHE_FILENAME = "raw_document_symbols.json";
const DOC_CACHE_FILENAME = "document_symbols.json";

// ─── Internal cache map types ─────────────────────────────────────────────────

/** In-memory raw cache: relativePath → [contentHash, rawRootSymbols | null] */
type RawCacheMap = Map<string, [string, RawLspSymbol[] | null]>;

/** In-memory doc cache: relativePath → [contentHash, DocumentSymbols] */
type DocCacheMap = Map<string, [string, DocumentSymbols]>;

// ─── SymbolCacheManager ───────────────────────────────────────────────────────

export interface SymbolCacheManagerOptions {
	/** Directory where the .json files are stored */
	cacheDir: string;
	/** Repository root, used to build absolute paths */
	repositoryRoot: string;
	/**
	 * LS-specific version fragment for the raw cache.
	 * Increment this in your LS adapter whenever the LS changes its output format.
	 * Analogous to `cache_version_raw_document_symbols` constructor param.
	 */
	lsSpecificRawVersion?: number;
	/**
	 * Optional fingerprint for both caches (e.g. hash of build flags).
	 * Analogous to `_document_symbols_cache_fingerprint()`.
	 */
	cacheFingerprint?: string | number | null;
	/** Encoding used when reading files, for hash computation */
	encoding?: BufferEncoding;
}

export class SymbolCacheManager {
	private readonly cacheDir: string;
	private readonly repositoryRoot: string;
	private readonly encoding: BufferEncoding;
	private readonly rawCacheVersion: CacheVersion;
	private readonly docCacheVersion: CacheVersion;

	private _rawCache: RawCacheMap = new Map();
	private _rawCacheModified = false;

	private _docCache: DocCacheMap = new Map();
	private _docCacheModified = false;

	constructor(opts: SymbolCacheManagerOptions) {
		this.cacheDir = opts.cacheDir;
		this.repositoryRoot = opts.repositoryRoot;
		this.encoding = opts.encoding ?? "utf8";

		// Version tuples — same logic as Python:
		//   raw: (RAW_BASE, ls_specific[, fingerprint])
		//   doc: (DOC_VERSION[, fingerprint])
		const lsVer = opts.lsSpecificRawVersion ?? 1;
		const fp = opts.cacheFingerprint ?? null;

		this.rawCacheVersion =
			fp !== null
				? ([RAW_CACHE_VERSION_BASE, lsVer, fp] as const)
				: ([RAW_CACHE_VERSION_BASE, lsVer] as const);

		this.docCacheVersion =
			fp !== null ? ([DOC_CACHE_VERSION, fp] as const) : DOC_CACHE_VERSION;

		this._loadRawCache();
		this._loadDocCache();
	}

	// ── Public read API ──────────────────────────────────────────────────────────

	/**
	 * Layer 1 read: get cached raw LSP symbols for a file.
	 * Returns null on miss or stale (content hash mismatch).
	 */
	getCachedRawSymbols(
		relativePath: string,
		contentHash: string,
	): RawLspSymbol[] | null | undefined {
		const entry = this._rawCache.get(relativePath);
		if (!entry) return undefined; // miss
		const [cachedHash, symbols] = entry;
		if (cachedHash !== contentHash) return undefined; // stale
		return symbols; // hit (may be null if LS returned null)
	}

	/**
	 * Layer 2 read: get cached processed DocumentSymbols for a file.
	 * Returns null on miss or stale.
	 */
	getCachedDocumentSymbols(
		relativePath: string,
		contentHash: string,
	): DocumentSymbols | null {
		const entry = this._docCache.get(relativePath);
		if (!entry) return null;
		const [cachedHash, docSymbols] = entry;
		if (cachedHash !== contentHash) return null;
		return docSymbols;
	}

	// ── Public write API ─────────────────────────────────────────────────────────

	/** Layer 1 write: store raw LSP symbols. */
	setRawSymbols(
		relativePath: string,
		contentHash: string,
		symbols: RawLspSymbol[] | null,
	): void {
		this._rawCache.set(relativePath, [contentHash, symbols]);
		this._rawCacheModified = true;
	}

	/** Layer 2 write: store processed DocumentSymbols. */
	setDocumentSymbols(
		relativePath: string,
		contentHash: string,
		docSymbols: DocumentSymbols,
	): void {
		this._docCache.set(relativePath, [contentHash, docSymbols]);
		this._docCacheModified = true;
	}

	// ── Persistence ──────────────────────────────────────────────────────────────

	/** Flush both caches to disk (call on shutdown). */
	saveAll(): void {
		this._saveRawCache();
		this._saveDocCache();
	}

	// ── Private load / save ──────────────────────────────────────────────────────

	private _loadRawCache(): void {
		const filePath = path.join(this.cacheDir, RAW_CACHE_FILENAME);
		try {
			const data = loadCache(
				filePath,
				this.rawCacheVersion,
				RawDocumentSymbolsCacheSchema,
			);
			if (data) {
				this._rawCache = new Map(Object.entries(data));
				console.log(`[cache] Loaded ${this._rawCache.size} raw symbol entries`);
			}
		} catch (e) {
			console.warn(`[cache] Failed to load raw cache: ${e}`);
		}
	}

	private _saveRawCache(): void {
		if (!this._rawCacheModified) return;

		const filePath = path.join(this.cacheDir, RAW_CACHE_FILENAME);
		try {
			const obj = Object.fromEntries(this._rawCache.entries());
			saveCache(filePath, this.rawCacheVersion, obj);
			this._rawCacheModified = false;
			console.log(
				`[cache] Saved raw symbol cache (${this._rawCache.size} entries)`,
			);
		} catch (e) {
			console.error(`[cache] Failed to save raw cache: ${e}`);
		}
	}

	private _loadDocCache(): void {
		const filePath = path.join(this.cacheDir, DOC_CACHE_FILENAME);
		try {
			const data = loadCache(
				filePath,
				this.docCacheVersion,
				DocumentSymbolsCacheSchema,
			);
			if (data) {
				for (const [relPath, [hash, rootSymbolsRaw]] of Object.entries(data)) {
					// Deserialize: rehydrate the PersistedUnifiedSymbol tree → runtime tree
					const rootSymbols = rootSymbolsRaw.map((s) => hydrateSymbol(s, null));
					this._docCache.set(relPath, [hash, new DocumentSymbols(rootSymbols)]);
				}
				console.log(
					`[cache] Loaded ${this._docCache.size} document symbol entries`,
				);
			}
		} catch (e) {
			console.warn(`[cache] Failed to load doc cache: ${e}`);
		}
	}

	private _saveDocCache(): void {
		if (!this._docCacheModified) return;

		const filePath = path.join(this.cacheDir, DOC_CACHE_FILENAME);
		try {
			const obj: Record<string, [string, PersistedUnifiedSymbolSerialized[]]> =
				{};
			for (const [relPath, [hash, docSymbols]] of this._docCache.entries()) {
				obj[relPath] = [hash, docSymbols.rootSymbols.map(dehydrateSymbol)];
			}
			saveCache(filePath, this.docCacheVersion, obj);
			this._docCacheModified = false;
			console.log(
				`[cache] Saved document symbol cache (${this._docCache.size} entries)`,
			);
		} catch (e) {
			console.error(`[cache] Failed to save doc cache: ${e}`);
		}
	}
}

// ─── Hydrate / Dehydrate helpers ─────────────────────────────────────────────
//
// Python uses pickle which handles object graphs automatically.
// In JSON-land we need explicit (de)hydration since:
//   - `parent` is a circular reference → must be set at runtime, never stored
//   - `body` is a class instance → must be recreated lazily at runtime

/**
 * Persisted → Runtime:
 * Recursively convert a PersistedUnifiedSymbol tree into the full
 * UnifiedSymbolInformation graph, wiring up `parent` references.
 * `body` is left undefined (set lazily via SymbolBodyFactory when needed).
 */
function hydrateSymbol(
	persisted: PersistedUnifiedSymbolSerialized,
	parent: UnifiedSymbolInformation | null,
): UnifiedSymbolInformation {
	const runtime: UnifiedSymbolInformation = {
		...persisted,
		kind: persisted.kind as SymbolKind,
		parent,
		children: [], // filled below
		body: undefined,
	};
	runtime.children = persisted.children.map((child) =>
		hydrateSymbol(child, runtime),
	);
	return runtime;
}

/**
 * Runtime → Persisted:
 * Strip transient fields (`parent`, `body`) and convert to a plain JSON-safe object.
 * Analogous to DocumentSymbols.__getstate__ in Python.
 */
function dehydrateSymbol(
	symbol: UnifiedSymbolInformation,
): PersistedUnifiedSymbolSerialized {
	// Destructure to explicitly drop transient fields
	const { parent: _parent, body: _body, children, ...rest } = symbol;
	return {
		...rest,
		children: children.map(dehydrateSymbol), // recurse
	};
}
