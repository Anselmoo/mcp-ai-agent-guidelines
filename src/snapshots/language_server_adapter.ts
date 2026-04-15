// ─── language_server_adapter.ts ───────────────────────────────────────────────
// The high-level orchestration layer — mirrors request_document_symbols() and
// _request_document_symbols() in ls.py (lines 1262–1469).
//
// This is the "user-facing" API your LS integration would call.
//
// Flow:
//
//   requestDocumentSymbols(path)
//     ├─ check _docCache → HIT? return DocumentSymbols
//     ├─ requestRawDocumentSymbols(path)
//     │     ├─ check _rawCache → HIT? return raw
//     │     └─ send LSP textDocument/documentSymbol → store in raw cache
//     └─ convert raw → UnifiedSymbolInformation → DocumentSymbols
//           └─ store in doc cache

import * as fs from "node:fs";
import * as path from "node:path";
import { computeContentHash } from "./content_hash.js";
import { DocumentSymbols } from "./document_symbols.js";
import type { RawDocumentSymbolSerialized } from "./schemas.js";
import { SymbolBodyFactory } from "./symbol_body.js";
import { SymbolCacheManager } from "./symbol_cache.js";
import type {
	Location,
	Range,
	RawLspSymbol,
	SymbolKind,
	SymbolTag,
	UnifiedSymbolInformation,
} from "./types.js";

// ─── Minimal LSP client interface ────────────────────────────────────────────
// In a real implementation this would be provided by vscode-languageclient or
// a custom LSP transport. Here we keep it abstract.

export interface LspClient {
	requestDocumentSymbol(fileUri: string): Promise<RawLspSymbol[] | null>;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export interface LanguageServerAdapterOptions {
	repositoryRoot: string;
	cacheDir: string;
	lsClient: LspClient;
	lsSpecificRawVersion?: number;
	cacheFingerprint?: string | number | null;
	encoding?: BufferEncoding;
}

export class LanguageServerAdapter {
	private readonly root: string;
	private readonly encoding: BufferEncoding;
	private readonly lsClient: LspClient;
	private readonly cache: SymbolCacheManager;

	constructor(opts: LanguageServerAdapterOptions) {
		this.root = opts.repositoryRoot;
		this.encoding = opts.encoding ?? "utf8";
		this.lsClient = opts.lsClient;
		this.cache = new SymbolCacheManager({
			cacheDir: opts.cacheDir,
			repositoryRoot: opts.repositoryRoot,
			lsSpecificRawVersion: opts.lsSpecificRawVersion,
			cacheFingerprint: opts.cacheFingerprint,
			encoding: this.encoding,
		});
	}

	// ── Public API ───────────────────────────────────────────────────────────────

	/**
	 * Main entry point. Returns the full processed symbol tree for a file.
	 * Mirrors `request_document_symbols()` in ls.py.
	 */
	async requestDocumentSymbols(relativePath: string): Promise<DocumentSymbols> {
		const fileContents = this._readFile(relativePath);
		const contentHash = computeContentHash(fileContents, this.encoding);

		// ── Layer 2: check processed doc cache ──
		const cached = this.cache.getCachedDocumentSymbols(
			relativePath,
			contentHash,
		);
		if (cached) {
			process.stderr.write(
				`[perf] document_symbols_cache HIT path=${relativePath}\n`,
			);
			return cached;
		}
		process.stderr.write(
			`[perf] document_symbols_cache MISS path=${relativePath}\n`,
		);

		// ── Layer 1: get raw symbols (from cache or LSP) ──
		const rawSymbols = await this._requestRawDocumentSymbols(
			relativePath,
			contentHash,
		);

		if (!rawSymbols) {
			console.warn(
				`[ls] LS returned null for ${relativePath} — returning empty`,
			);
			return new DocumentSymbols([]);
		}

		// ── Process: raw → unified ──
		const bodyFactory = new SymbolBodyFactory(fileContents);
		const absolutePath = path.join(this.root, relativePath);
		const unifiedRoots = this._convertSymbolsWithCommonParent(
			rawSymbols,
			null,
			relativePath,
			absolutePath,
			bodyFactory,
		);

		const docSymbols = new DocumentSymbols(unifiedRoots);

		// ── Store in layer 2 cache ──
		this.cache.setDocumentSymbols(relativePath, contentHash, docSymbols);
		process.stderr.write(
			`[perf] document_symbols_cache STORE path=${relativePath}\n`,
		);

		return docSymbols;
	}

	/** Flush caches to disk on shutdown. */
	saveCache(): void {
		this.cache.saveAll();
	}

	// ── Private: Layer 1 ─────────────────────────────────────────────────────────

	/**
	 * Returns raw LSP symbols from cache or live LSP.
	 * Mirrors `_request_document_symbols()` in ls.py.
	 */
	private async _requestRawDocumentSymbols(
		relativePath: string,
		contentHash: string,
	): Promise<RawLspSymbol[] | null> {
		// Check layer 1 cache
		const cached = this.cache.getCachedRawSymbols(relativePath, contentHash);
		if (cached !== undefined) {
			process.stderr.write(
				`[perf] raw_document_symbols_cache HIT path=${relativePath}\n`,
			);
			return cached;
		}
		process.stderr.write(
			`[perf] raw_document_symbols_cache MISS path=${relativePath}\n`,
		);
		// Query live LSP
		const fileUri = pathToUri(path.join(this.root, relativePath));
		process.stderr.write(
			`[ls] Requesting document symbols for ${relativePath} from LS\n`,
		);
		const response = await this.lsClient.requestDocumentSymbol(fileUri);

		// Store in layer 1 cache
		this.cache.setRawSymbols(relativePath, contentHash, response);

		return response;
	}

	// ── Private: conversion pipeline ─────────────────────────────────────────────

	/**
	 * Recursively converts a flat/hierarchical raw LSP symbol list into the
	 * UnifiedSymbolInformation tree, wiring parent/children + overload indices.
	 * Mirrors `convert_symbols_with_common_parent()` in ls.py (lines 1428–1459).
	 */
	private _convertSymbolsWithCommonParent(
		symbols: RawLspSymbol[],
		parent: UnifiedSymbolInformation | null,
		relativePath: string,
		absolutePath: string,
		bodyFactory: SymbolBodyFactory,
	): UnifiedSymbolInformation[] {
		// Count occurrences of each name to detect overloads
		const totalNameCounts = new Map<string, number>();
		for (const symbol of symbols) {
			const name = this._normalizeSymbolName(symbol);
			totalNameCounts.set(name, (totalNameCounts.get(name) ?? 0) + 1);
		}

		const nameCounts = new Map<string, number>();
		const result: UnifiedSymbolInformation[] = [];

		for (const symbol of symbols) {
			const unified = this._convertToUnifiedSymbol(
				symbol,
				relativePath,
				absolutePath,
				bodyFactory,
			);

			const count = totalNameCounts.get(unified.name) ?? 1;
			if (count > 1) {
				unified.overload_idx = nameCounts.get(unified.name) ?? 0;
			}
			nameCounts.set(unified.name, (nameCounts.get(unified.name) ?? 0) + 1);

			unified.parent = parent;

			// Recurse into children
			const rawChildren =
				(symbol as RawDocumentSymbolSerialized).children ?? [];
			unified.children = this._convertSymbolsWithCommonParent(
				rawChildren as RawLspSymbol[],
				unified,
				relativePath,
				absolutePath,
				bodyFactory,
			);

			result.push(unified);
		}

		return result;
	}

	/**
	 * Converts a single raw LSP symbol to UnifiedSymbolInformation.
	 * Mirrors `convert_to_unified_symbol()` in ls.py (lines 1388–1426).
	 */
	private _convertToUnifiedSymbol(
		raw: RawLspSymbol,
		relativePath: string,
		absolutePath: string,
		bodyFactory: SymbolBodyFactory,
	): UnifiedSymbolInformation {
		const name = this._normalizeSymbolName(raw);

		// Build the location (DocumentSymbol has range/selectionRange but no location;
		// SymbolInformation has location but no selectionRange)
		let location: Location;
		let range: Range | undefined;
		let selectionRange: Range | undefined;

		if ("location" in raw && raw.location) {
			// SymbolInformation path
			location = {
				uri: raw.location.uri,
				range: raw.location.range,
				absolutePath,
				relativePath,
			};
			range = raw.location.range;
			selectionRange = raw.location.range;
		} else {
			// DocumentSymbol path
			const ds = raw as import("./schemas.js").RawDocumentSymbolSerialized;
			const fileUri = pathToUri(absolutePath);
			location = {
				uri: fileUri,
				range: ds.range,
				absolutePath,
				relativePath,
			};
			range = ds.range;
			selectionRange = ds.selectionRange ?? ds.range;
		}

		const unified: UnifiedSymbolInformation = {
			name,
			kind: raw.kind as SymbolKind,
			location,
			range,
			selectionRange,
			children: [], // filled by caller
			parent: null,
		};

		if ("detail" in raw && raw.detail !== undefined)
			unified.detail = raw.detail;
		if ("tags" in raw && raw.tags) unified.tags = raw.tags as SymbolTag[];
		if ("deprecated" in raw && raw.deprecated !== undefined)
			unified.deprecated = raw.deprecated;
		if ("containerName" in raw && raw.containerName)
			unified.containerName = raw.containerName;

		// Attach lazy body — same as Python's SymbolBodyFactory.create_symbol_body()
		unified.body = bodyFactory.createSymbolBody(unified);

		return unified;
	}

	/**
	 * Normalize symbol names — override in subclass for language-specific logic.
	 * Mirrors `_normalize_symbol_name()` in ls.py.
	 */
	protected _normalizeSymbolName(symbol: RawLspSymbol): string {
		return symbol.name;
	}

	// ── Utility ──────────────────────────────────────────────────────────────────

	private _readFile(relativePath: string): string {
		const abs = path.join(this.root, relativePath);
		return fs.readFileSync(abs, this.encoding);
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pathToUri(absPath: string): string {
	return `file://${absPath.replace(/\\/g, "/")}`;
}

// Re-export for convenience
export type { RawDocumentSymbolSerialized } from "./schemas.js";
export type { RawLspSymbol } from "./types.js";
