/**
 * lsp-scan-bridge.ts
 *
 * Thin bridge between the coherence scanner and the LSP symbol adapter in
 * src/snapshots/. Extracts exported top-level symbol names from TypeScript
 * source files via two strategies:
 *
 *   1. Regex fallback (no runtime dependency) — always available.
 *   2. LanguageServerAdapter — richer, cached, used when an LspClient is
 *      injected (e.g. from a VS Code extension host).
 *
 * The result is a `symbolMap: Record<relativePath, string[]>` suitable for
 * inclusion in a `CodebaseFingerprint` and symbol-level drift detection.
 *
 * Enhanced features:
 *   - `extractMethodMap`   — tracks methods/properties inside classes
 *   - `extractAllSymbols`  — returns both exported + internal symbols
 *   - `buildSymbolIndex`   — builds a searchable index over a symbol map
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { LspClient } from "../snapshots/language_server_adapter.js";
import { LanguageServerAdapter } from "../snapshots/language_server_adapter.js";
import {
	extractSymbolsFromSource,
	type TrackedSymbol,
} from "../snapshots/symbol-change-tracker.js";
import { SymbolKind } from "../snapshots/types.js";

// ─── Symbol kinds to include in the map ──────────────────────────────────────

const TRACKED_KINDS = new Set<SymbolKind>([
	SymbolKind.Class,
	SymbolKind.Function,
	SymbolKind.Interface,
	SymbolKind.Enum,
	SymbolKind.Variable, // covers `export const`
	SymbolKind.Module,
	SymbolKind.Namespace,
]);

// ─── Regex fallback ──────────────────────────────────────────────────────────

const EXPORT_RE =
	/^export\s+(?:(?:async\s+)?function\*?\s+|class\s+|interface\s+|type\s+|enum\s+|(?:const|let|var)\s+)(\w+)/gm;

/**
 * Extract exported symbol names from TypeScript files using regex.
 */
export async function extractSymbolMapFallback(
	repositoryRoot: string,
	tsPaths: readonly string[],
	concurrency = 12,
): Promise<Record<string, string[]>> {
	const result: Record<string, string[]> = {};

	for (let i = 0; i < tsPaths.length; i += concurrency) {
		const batch = tsPaths.slice(i, i + concurrency);
		await Promise.all(
			batch.map(async (rel) => {
				try {
					const text = await readFile(join(repositoryRoot, rel), "utf8");
					const names: string[] = [];
					const re = new RegExp(EXPORT_RE.source, EXPORT_RE.flags);
					let match = re.exec(text);
					while (match !== null) {
						if (match[1]) names.push(match[1]);
						match = re.exec(text);
					}
					if (names.length > 0) result[rel] = names;
				} catch {
					// File unreadable — skip silently
				}
			}),
		);
	}

	return result;
}

/**
 * Extract exported symbol names using a live language-server client.
 */
export async function extractSymbolMapViaLsp(
	repositoryRoot: string,
	cacheDir: string,
	lsClient: LspClient,
	tsPaths: readonly string[],
): Promise<Record<string, string[]>> {
	const adapter = new LanguageServerAdapter({
		repositoryRoot,
		cacheDir,
		lsClient,
	});
	const result: Record<string, string[]> = {};

	for (const rel of tsPaths) {
		try {
			const docSymbols = await adapter.requestDocumentSymbols(rel);
			const names = docSymbols.rootSymbols
				.filter((s) => TRACKED_KINDS.has(s.kind))
				.map((s) => s.name);
			if (names.length > 0) result[rel] = names;
		} catch {
			// LS error for this file — skip
		}
	}

	adapter.saveCache();
	return result;
}

// ─── Enhanced: method map extraction ─────────────────────────────────────────

export interface MethodMapEntry {
	/** Method/property names inside the class. */
	members: string[];
	/** Public members only. */
	publicMembers: string[];
	/** Static members (placeholder for future static detection). */
	staticMembers: string[];
}

/**
 * Extract a class → method map for TypeScript files.
 * Returns `Record<relativePath, Record<className, MethodMapEntry>>`.
 */
export async function extractMethodMap(
	repositoryRoot: string,
	tsPaths: readonly string[],
	options: {
		includePrivate?: boolean;
		concurrency?: number;
	} = {},
): Promise<Record<string, Record<string, MethodMapEntry>>> {
	const concurrency = options.concurrency ?? 12;
	const includePrivate = options.includePrivate ?? false;
	const result: Record<string, Record<string, MethodMapEntry>> = {};

	for (let i = 0; i < tsPaths.length; i += concurrency) {
		const batch = tsPaths.slice(i, i + concurrency);
		await Promise.all(
			batch.map(async (rel) => {
				try {
					const text = await readFile(join(repositoryRoot, rel), "utf8");
					const symbols = extractSymbolsFromSource(text, includePrivate, true);

					const byContainer = new Map<string, TrackedSymbol[]>();
					for (const sym of symbols) {
						if (sym.container) {
							const group = byContainer.get(sym.container) ?? [];
							group.push(sym);
							byContainer.set(sym.container, group);
						}
					}

					if (byContainer.size > 0) {
						result[rel] = {};
						for (const [className, members] of byContainer) {
							const publicMembers = members
								.filter((m) => m.isPublic)
								.map((m) => m.name);

							result[rel][className] = {
								members: members.map((m) => m.name),
								publicMembers,
								staticMembers: [],
							};
						}
					}
				} catch {
					// File unreadable — skip
				}
			}),
		);
	}

	return result;
}

// ─── Enhanced: full symbol map ────────────────────────────────────────────────

/**
 * Extract ALL symbols (exported + internal + class members) from TypeScript files.
 *
 * Unlike `extractMethodMap` which returns class members keyed by class name, this
 * function returns a flat `Record<relativePath, TrackedSymbol[]>` containing every
 * symbol extracted from each file — including private functions, unexported constants,
 * and class methods.  Use this when you need the full symbol inventory for impact
 * analysis or drift detection rather than just the public API surface.
 */
export async function extractAllSymbolMap(
	repositoryRoot: string,
	tsPaths: readonly string[],
	options: {
		includePrivate?: boolean;
		includeMembers?: boolean;
		concurrency?: number;
	} = {},
): Promise<Record<string, TrackedSymbol[]>> {
	const concurrency = options.concurrency ?? 12;
	const includePrivate = options.includePrivate ?? false;
	const includeMembers = options.includeMembers ?? true;
	const result: Record<string, TrackedSymbol[]> = {};

	for (let i = 0; i < tsPaths.length; i += concurrency) {
		const batch = tsPaths.slice(i, i + concurrency);
		await Promise.all(
			batch.map(async (rel) => {
				try {
					const text = await readFile(join(repositoryRoot, rel), "utf8");
					const symbols = extractSymbolsFromSource(
						text,
						includePrivate,
						includeMembers,
					);
					if (symbols.length > 0) result[rel] = symbols;
				} catch {
					// File unreadable — skip
				}
			}),
		);
	}

	return result;
}

// ─── Symbol search index ──────────────────────────────────────────────────────

export interface SymbolIndexEntry {
	name: string;
	file: string;
	exported: boolean;
	container?: string;
}

/**
 * Build a flat symbol search index from a symbol map.
 */
export function buildSymbolIndex(
	symbolMap: Record<string, string[]>,
): SymbolIndexEntry[] {
	const entries: SymbolIndexEntry[] = [];
	for (const [file, symbols] of Object.entries(symbolMap)) {
		for (const name of symbols) {
			entries.push({ name, file, exported: true });
		}
	}
	return entries.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search the symbol index for names matching a query (case-insensitive substring).
 */
export function searchSymbolIndex(
	index: SymbolIndexEntry[],
	query: string,
	limit = 20,
): SymbolIndexEntry[] {
	const q = query.toLowerCase();
	return index.filter((e) => e.name.toLowerCase().includes(q)).slice(0, limit);
}
