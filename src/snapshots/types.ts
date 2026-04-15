// ─── types.ts ───────────────────────────────────────────────────────────────
// All LSP + Serena-extended types. 100% mirrors ls_types.py + ls.py typedefs.

import type { SymbolBody } from "./symbol_body.js";

/** Zero-based line/character position (LSP §3.17) */
export interface Position {
	line: number;
	character: number;
}

/** Inclusive start, exclusive-ish end range (LSP §3.17) */
export interface Range {
	start: Position;
	end: Position;
}

/** LSP Location + Serena path extensions */
export interface Location {
	uri: string;
	range: Range;
	absolutePath: string;
	relativePath: string | null;
}

/**
 * SymbolKind mirrors the LSP enum exactly.
 * https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#symbolKind
 */
export enum SymbolKind {
	File = 1,
	Module = 2,
	Namespace = 3,
	Package = 4,
	Class = 5,
	Method = 6,
	Property = 7,
	Field = 8,
	Constructor = 9,
	Enum = 10,
	Interface = 11,
	Function = 12,
	Variable = 13,
	Constant = 14,
	String = 15,
	Number = 16,
	Boolean = 17,
	Array = 18,
	Object = 19,
	Key = 20,
	Null = 21,
	EnumMember = 22,
	Struct = 23,
	Event = 24,
	Operator = 25,
	TypeParameter = 26,
}

export enum SymbolTag {
	Deprecated = 1,
}

// ─── Raw LSP wire types ──────────────────────────────────────────────────────

/** Modern hierarchical format returned by the LS */
export interface RawDocumentSymbol {
	name: string;
	kind: SymbolKind;
	detail?: string;
	range: Range;
	selectionRange: Range;
	tags?: SymbolTag[];
	children?: RawDocumentSymbol[];
	deprecated?: boolean;
}

/** Legacy flat format (SymbolInformation) */
export interface RawSymbolInformation {
	name: string;
	kind: SymbolKind;
	tags?: SymbolTag[];
	deprecated?: boolean;
	location: { uri: string; range: Range };
	containerName?: string;
}

export type RawLspSymbol = RawDocumentSymbol | RawSymbolInformation;

// ─── Serena unified + enriched symbol ───────────────────────────────────────

/**
 * The PERSISTED shape of a unified symbol — everything safe to JSON.stringify.
 * This is what goes into document_symbols.json (analogue of document_symbols.pkl).
 * Fields marked TRANSIENT are NOT included here.
 */
export interface PersistedUnifiedSymbol {
	name: string;
	kind: SymbolKind;
	location: Location;
	range?: Range;
	selectionRange?: Range;
	detail?: string;
	tags?: SymbolTag[];
	containerName?: string;
	deprecated?: boolean;
	overload_idx?: number;
	children: PersistedUnifiedSymbol[]; // recursive, no parent here
}

/**
 * The RUNTIME shape — adds transient fields that are never serialized.
 * Analogous to UnifiedSymbolInformation TypedDict in ls_types.py.
 */
export interface UnifiedSymbolInformation extends PersistedUnifiedSymbol {
	children: UnifiedSymbolInformation[];
	/** TRANSIENT — not serialized. Populated after deserialization. */
	parent?: UnifiedSymbolInformation | null;
	/** TRANSIENT — not serialized. Lazy-loaded on demand. */
	body?: SymbolBody;
}
