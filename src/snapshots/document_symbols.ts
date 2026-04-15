// ─── document_symbols.ts ─────────────────────────────────────────────────────
// Mirrors the DocumentSymbols class in ls.py (lines 233–270).

import {
	componentToString,
	type MatchOptions,
	type MatchResult,
	type NamePathComponent,
	NamePathMatcher,
} from "./name_path_matcher.js";
import type { UnifiedSymbolInformation } from "./types.js";

/**
 * Holds the processed symbol tree for one file.
 * Analogous to the Python `DocumentSymbols` class.
 *
 * - `rootSymbols` → persisted
 * - `_allSymbols` → lazily computed, transient (not serialized)
 */
export class DocumentSymbols {
	private _allSymbols: UnifiedSymbolInformation[] | null = null;

	constructor(public readonly rootSymbols: UnifiedSymbolInformation[]) {}

	/** Depth-first iteration over the entire symbol tree. */
	*iterSymbols(): IterableIterator<UnifiedSymbolInformation> {
		if (this._allSymbols !== null) {
			yield* this._allSymbols;
			return;
		}

		function* traverse(
			s: UnifiedSymbolInformation,
		): IterableIterator<UnifiedSymbolInformation> {
			yield s;
			for (const child of s.children) yield* traverse(child);
		}

		for (const root of this.rootSymbols) yield* traverse(root);
	}

	/** Returns a flat list + the root symbols. Caches the flat list. */
	getAllSymbolsAndRoots(): [
		UnifiedSymbolInformation[],
		UnifiedSymbolInformation[],
	] {
		if (this._allSymbols === null) {
			this._allSymbols = [...this.iterSymbols()];
		}
		return [this._allSymbols, this.rootSymbols];
	}

	getSymbolPathComponents(
		symbol: UnifiedSymbolInformation,
	): NamePathComponent[] {
		const components: NamePathComponent[] = [];
		let current: UnifiedSymbolInformation | null | undefined = symbol;

		while (current) {
			components.unshift({
				name: current.name,
				overloadIdx: current.overload_idx ?? null,
			});
			current = current.parent ?? null;
		}

		return components;
	}

	getNamePath(symbol: UnifiedSymbolInformation): string {
		return this.getSymbolPathComponents(symbol)
			.map((component) => componentToString(component))
			.join("/");
	}

	explainNamePathMatch(
		symbol: UnifiedSymbolInformation,
		namePathPattern: string,
		options: MatchOptions = {},
	): MatchResult {
		const matcher = new NamePathMatcher(namePathPattern, options);
		return matcher.matchesComponents(this.getSymbolPathComponents(symbol));
	}

	findByNamePath(
		namePathPattern: string,
		options: MatchOptions = {},
	): UnifiedSymbolInformation[] {
		const matcher = new NamePathMatcher(namePathPattern, options);
		return [...this.iterSymbols()].filter(
			(symbol) =>
				matcher.matchesComponents(this.getSymbolPathComponents(symbol)).matched,
		);
	}
}
