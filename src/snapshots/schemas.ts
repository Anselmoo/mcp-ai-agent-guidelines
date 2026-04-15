// ─── schemas.ts ───────────────────────────────────────────────────────────────
// Zod schemas for runtime-safe deserialization of both cache files.
// This is what Python's pickle "got for free" — here we are explicit.

import { z } from "zod";

// ── Primitives ────────────────────────────────────────────────────────────────

export const PositionSchema = z.object({
	line: z.number().int().nonnegative(),
	character: z.number().int().nonnegative(),
});

export const RangeSchema = z.object({
	start: PositionSchema,
	end: PositionSchema,
});

export const LocationSchema = z.object({
	uri: z.string(),
	range: RangeSchema,
	absolutePath: z.string(),
	relativePath: z.string().nullable(),
});

// ── Raw LSP symbol schemas (for raw_document_symbols.json) ────────────────────

// DocumentSymbol is hierarchical — needs lazy recursion
export type RawDocumentSymbolSerialized = {
	name: string;
	kind: number;
	detail?: string;
	range: z.infer<typeof RangeSchema>;
	selectionRange: z.infer<typeof RangeSchema>;
	tags?: number[];
	deprecated?: boolean;
	children?: RawDocumentSymbolSerialized[];
};

export const RawDocumentSymbolSchema: z.ZodType<RawDocumentSymbolSerialized> =
	z.lazy(() =>
		z.object({
			name: z.string(),
			kind: z.number().int(),
			detail: z.string().optional(),
			range: RangeSchema,
			selectionRange: RangeSchema,
			tags: z.array(z.number().int()).optional(),
			deprecated: z.boolean().optional(),
			children: z.array(RawDocumentSymbolSchema).optional(),
		}),
	);

export const RawSymbolInformationSchema = z.object({
	name: z.string(),
	kind: z.number().int(),
	tags: z.array(z.number().int()).optional(),
	deprecated: z.boolean().optional(),
	location: z.object({ uri: z.string(), range: RangeSchema }),
	containerName: z.string().optional(),
});

export const RawLspSymbolSchema = z.union([
	RawDocumentSymbolSchema,
	RawSymbolInformationSchema,
]);

/**
 * Schema for one entry in the raw cache dict:
 *   { [relativePath]: [contentHash, rawSymbols | null] }
 */
export const RawCacheEntrySchema = z.tuple([
	z.string(), // content_hash
	z.array(RawLspSymbolSchema).nullable(), // raw root symbols
]);

export const RawDocumentSymbolsCacheSchema = z.record(
	z.string(), // relative file path
	RawCacheEntrySchema,
);

// ── Processed symbol schemas (for document_symbols.json) ─────────────────────

// PersistedUnifiedSymbol is also recursive
export type PersistedUnifiedSymbolSerialized = {
	name: string;
	kind: number;
	location: z.infer<typeof LocationSchema>;
	range?: z.infer<typeof RangeSchema>;
	selectionRange?: z.infer<typeof RangeSchema>;
	detail?: string;
	tags?: number[];
	containerName?: string;
	deprecated?: boolean;
	overload_idx?: number;
	children: PersistedUnifiedSymbolSerialized[];
};

export const PersistedUnifiedSymbolSchema: z.ZodType<PersistedUnifiedSymbolSerialized> =
	z.lazy(() =>
		z.object({
			name: z.string(),
			kind: z.number().int(),
			location: LocationSchema,
			range: RangeSchema.optional(),
			selectionRange: RangeSchema.optional(),
			detail: z.string().optional(),
			tags: z.array(z.number().int()).optional(),
			containerName: z.string().optional(),
			deprecated: z.boolean().optional(),
			overload_idx: z.number().int().nonnegative().optional(),
			children: z.array(PersistedUnifiedSymbolSchema),
		}),
	);

/**
 * Schema for one entry in the high-level cache dict:
 *   { [relativePath]: [contentHash, DocumentSymbols] }
 */
export const DocumentSymbolsCacheEntrySchema = z.tuple([
	z.string(), // content_hash
	z.array(PersistedUnifiedSymbolSchema), // root symbols
]);

export const DocumentSymbolsCacheSchema = z.record(
	z.string(),
	DocumentSymbolsCacheEntrySchema,
);
