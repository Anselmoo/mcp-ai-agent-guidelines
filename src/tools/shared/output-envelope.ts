import type { TextToolResult } from "../tool-call-handler.js";

/**
 * Current envelope schema version. A single integer, mirrored in the text-block
 * prefix (`__ENVELOPE_V<n>__:`). See `docs/adr/0002-envelope-schema-versioning-policy.md`
 * for the bump / deprecation rules.
 *
 * Bump this (and add the new version to `SUPPORTED_ENVELOPE_VERSIONS`) only for a
 * BREAKING change — removing/renaming a field, or changing a field's type or
 * semantics. Additive changes (a new optional field) do NOT bump the version.
 */
export const ENVELOPE_VERSION = 1 as const;

/** Envelope versions this consumer knows how to parse. */
export const SUPPORTED_ENVELOPE_VERSIONS: readonly number[] = [
	ENVELOPE_VERSION,
];

/** Text-block marker for the current envelope version. Derived, never hand-typed. */
export const ENVELOPE_PREFIX = `__ENVELOPE_V${ENVELOPE_VERSION}__:`;

/**
 * A payload/meta field that is on its way out. Producers stamp the active set
 * into `meta.deprecations` so consumers get a machine-readable heads-up BEFORE
 * the field disappears — the deprecation window that closes the `situationMode`
 * silent-removal gap (ADR 0001).
 */
export interface FieldDeprecation {
	/** Dotted path of the deprecated field, e.g. `payload.situationMode`. */
	field: string;
	/** Version in which the field was first marked deprecated. */
	since: number;
	/** Version in which the field is scheduled for removal (must be `> since`). */
	removeInVersion: number;
	/** Preferred replacement field, if any. */
	replacement?: string;
	/** Free-text migration note. */
	note?: string;
}

/**
 * Central registry of currently-deprecated envelope fields. Intentionally EMPTY:
 * nothing is deprecated right now (`situationMode` was already removed in ADR
 * 0001, before this policy existed). New removals MUST land here for at least one
 * released version before the removing bump — see
 * `docs/adr/0002-envelope-schema-versioning-policy.md`.
 */
export const ENVELOPE_DEPRECATIONS: readonly FieldDeprecation[] = [];

export interface ToolEnvelope<T = unknown> {
	summaryMarkdown: string;
	payload: T;
	meta: {
		tool: string;
		ts: string;
		version: number;
		deprecations?: readonly FieldDeprecation[];
	};
}

/**
 * Build the envelope `meta` block from a single source of truth. Stamps the
 * current `version` and attaches `deprecations` only when the registry is
 * non-empty (keeps the wire format clean while nothing is deprecated).
 *
 * `deprecations` defaults to the global `ENVELOPE_DEPRECATIONS` registry;
 * production callers pass only `tool` (and optionally `ts`). The parameter is
 * exposed so the surfacing behaviour can be unit-tested without mutating the
 * global registry.
 */
export function buildEnvelopeMeta(
	tool: string,
	ts: string = new Date().toISOString(),
	deprecations: readonly FieldDeprecation[] = ENVELOPE_DEPRECATIONS,
): ToolEnvelope["meta"] {
	const meta: ToolEnvelope["meta"] = { tool, ts, version: ENVELOPE_VERSION };
	if (deprecations.length > 0) {
		meta.deprecations = deprecations;
	}
	return meta;
}

export function toToolResult<T>(env: ToolEnvelope<T>): TextToolResult {
	const encoded = Buffer.from(
		JSON.stringify({ payload: env.payload, meta: env.meta }),
		"utf8",
	).toString("base64");
	return {
		content: [
			{ type: "text", text: env.summaryMarkdown },
			{ type: "text", text: `${ENVELOPE_PREFIX}${encoded}` },
		],
	};
}

/** Matches any envelope text-block prefix, capturing the integer version. */
const ENVELOPE_PREFIX_PATTERN = /^__ENVELOPE_V(\d+)__:/;

/**
 * Parse an envelope text block. Version-aware and forward-compatible:
 * - Rejects a block whose version this consumer does not support with an
 *   explicit error, rather than silently mis-parsing or reporting "not an
 *   envelope".
 * - Preserves unknown payload/meta fields (additive changes never break an
 *   older parser).
 */
export function parseEnvelopeBlock<T = unknown>(text: string): ToolEnvelope<T> {
	const match = ENVELOPE_PREFIX_PATTERN.exec(text);
	if (!match) throw new Error("not an envelope block");
	const version = Number(match[1]);
	if (!SUPPORTED_ENVELOPE_VERSIONS.includes(version)) {
		throw new Error(
			`unsupported envelope version ${version} (this consumer supports v${SUPPORTED_ENVELOPE_VERSIONS.join(", v")})`,
		);
	}
	// Slice by the actually-matched prefix, not a rebuilt one, so a non-canonical
	// version token (e.g. a zero-padded `V01`) can't desync the base64 offset.
	const json = Buffer.from(text.slice(match[0].length), "base64").toString(
		"utf8",
	);
	const parsed = JSON.parse(json) as { payload: T; meta: ToolEnvelope["meta"] };
	return { summaryMarkdown: "", payload: parsed.payload, meta: parsed.meta };
}
