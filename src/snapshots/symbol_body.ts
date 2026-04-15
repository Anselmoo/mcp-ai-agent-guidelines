// ─── symbol_body.ts ──────────────────────────────────────────────────────────
// Mirrors SymbolBody + SymbolBodyFactory in ls.py (lines 174–230).
// Memory-efficient: all symbols in a file share the same `lines` array.

import type { UnifiedSymbolInformation } from "./types.js";

/**
 * Lazy, zero-copy view into the source text of a symbol.
 * Only stores 4 integers + a shared reference to the lines array.
 * ~40 bytes per symbol — identical design to the Python original.
 */
export class SymbolBody {
	constructor(
		private readonly lines: readonly string[],
		private readonly startLine: number,
		private readonly startCol: number,
		private readonly endLine: number,
		private readonly endCol: number,
	) {}

	getText(): string {
		const slice = this.lines.slice(this.startLine, this.endLine + 1).join("\n");

		// Remove content before startCol on the first line
		const trimmed = slice.slice(this.startCol);

		// Remove trailing content after endCol on the last line
		const lastLine = this.lines[this.endLine];
		const trailingLength = lastLine.length - this.endCol;
		return trailingLength > 0 ? trimmed.slice(0, -trailingLength) : trimmed;
	}
}

/**
 * Factory — creates SymbolBody instances that share the same lines buffer.
 * All symbols in one file share one string[] → memory-efficient.
 */
export class SymbolBodyFactory {
	private readonly lines: readonly string[];

	constructor(fileContents: string) {
		this.lines = fileContents.split("\n");
	}

	createSymbolBody(symbol: UnifiedSymbolInformation): SymbolBody {
		const range = symbol.location.range;
		return new SymbolBody(
			this.lines,
			range.start.line,
			range.start.character,
			range.end.line,
			range.end.character,
		);
	}
}
