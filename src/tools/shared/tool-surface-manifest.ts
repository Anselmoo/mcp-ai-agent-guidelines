/**
 * HIDDEN_TOOLS env-var filtering for the public tool surface.
 *
 * Reads the comma-separated `HIDDEN_TOOLS` environment variable and removes
 * matching tool names from the surface before it is handed to the MCP SDK.
 * Comparison is case-insensitive and trims whitespace.
 *
 * Example:
 *   HIDDEN_TOOLS="physics-analysis,enterprise,govern"
 *
 * External tool validation (P2 fix):
 *   EXPECTED_EXTERNAL_TOOLS="github-pull-request_,memory_"  — comma-separated
 *     prefix or exact-match patterns for tools injected by the host environment
 *     (e.g. VS Code extensions).  When set, validateExternalToolSurface() will
 *     warn on unrecognised names.  Set STRICT_TOOL_SURFACE=true to throw
 *     instead of warn.
 */

export interface HideableToolDefinition {
	name: string;
	[key: string]: unknown;
}

/**
 * Parse the `HIDDEN_TOOLS` environment variable into a normalised set of
 * lower-cased tool names.
 */
function parseHiddenTools(envValue: string | undefined): Set<string> {
	if (!envValue) return new Set();
	return new Set(
		envValue
			.split(",")
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean),
	);
}

/**
 * Filter `tools` against the HIDDEN_TOOLS env-var.
 *
 * @param tools  Full list of tool definitions
 * @param env    Optional override (defaults to `process.env.HIDDEN_TOOLS`)
 * @returns      Filtered list with hidden tools removed
 */
export function filterHiddenTools<T extends HideableToolDefinition>(
	tools: T[],
	env?: string,
): T[] {
	const hidden = parseHiddenTools(env ?? process.env.HIDDEN_TOOLS);
	if (hidden.size === 0) return tools;

	return tools.filter((t) => !hidden.has(t.name.toLowerCase()));
}

/**
 * Returns `true` when the given tool name is present in the current
 * HIDDEN_TOOLS configuration.
 */
export function isToolHidden(toolName: string, env?: string): boolean {
	const hidden = parseHiddenTools(env ?? process.env.HIDDEN_TOOLS);
	return hidden.has(toolName.toLowerCase());
}

/**
 * Return the current set of hidden tool names (normalised to lower-case).
 * Useful for diagnostics / logging.
 */
export function getHiddenToolNames(env?: string): ReadonlySet<string> {
	return parseHiddenTools(env ?? process.env.HIDDEN_TOOLS);
}

/**
 * Compute the effective HIDDEN_TOOLS value by combining the explicit
 * `HIDDEN_TOOLS` env-var with policy-driven hiding:
 *
 * - `routing-adapt` is auto-hidden unless `ENABLE_ADAPTIVE_ROUTING=true`.
 *
 * Returns a comma-separated string suitable for passing to `filterHiddenTools`.
 */
export function computeEffectiveHiddenTools(): string {
	const parts: string[] = [];
	const explicit = process.env.HIDDEN_TOOLS;
	if (explicit) {
		parts.push(explicit);
	}
	if (process.env.ENABLE_ADAPTIVE_ROUTING !== "true") {
		parts.push("routing-adapt");
	}
	return parts.join(",");
}

// ---------------------------------------------------------------------------
// External tool surface validation (P2: github-pull-request_ bias fix)
// ---------------------------------------------------------------------------

/**
 * Parse a comma-separated list of allowed external tool name patterns into a
 * normalised array of lower-cased strings.
 */
function parseExpectedExternalTools(envValue: string | undefined): string[] {
	if (!envValue) return [];
	return envValue
		.split(",")
		.map((t) => t.trim().toLowerCase())
		.filter(Boolean);
}

/**
 * Return true when `toolName` matches at least one entry in `patterns`.
 * Each pattern is tested as a prefix (e.g. "github-pull-request_") or as an
 * exact name match.
 */
function matchesExternalPattern(toolName: string, patterns: string[]): boolean {
	const lower = toolName.toLowerCase();
	return patterns.some((p) => lower === p || lower.startsWith(p));
}

/**
 * Validate that every name in `externalToolNames` is covered by the
 * EXPECTED_EXTERNAL_TOOLS allowlist.
 *
 * Returns an array of warning strings for unrecognised tool names.  An empty
 * array means no issues were found.
 *
 * When `STRICT_TOOL_SURFACE=true` is set in the environment, this function
 * throws the first warning as an Error instead of returning an array.
 *
 * @param externalToolNames  Tool names injected by the host (e.g. VS Code extension tools)
 * @param env                Optional env-var override map (defaults to `process.env`)
 */
export function validateExternalToolSurface(
	externalToolNames: readonly string[],
	env: Record<string, string | undefined> = process.env,
): string[] {
	const patterns = parseExpectedExternalTools(env.EXPECTED_EXTERNAL_TOOLS);

	// No allowlist configured — skip validation.
	if (patterns.length === 0) return [];

	const warnings: string[] = [];
	for (const name of externalToolNames) {
		if (!matchesExternalPattern(name, patterns)) {
			warnings.push(
				`Unexpected external tool on surface: "${name}" — add its prefix to EXPECTED_EXTERNAL_TOOLS or audit its permissions.`,
			);
		}
	}

	if (warnings.length > 0 && env.STRICT_TOOL_SURFACE === "true") {
		throw new Error(warnings[0]);
	}

	return warnings;
}

/**
 * Compute a diagnostic summary of the current external tool configuration.
 * Returns a plain-object report suitable for logging at startup.
 */
export function computeExternalToolDiagnostics(
	externalToolNames: readonly string[],
	env: Record<string, string | undefined> = process.env,
): {
	allowlistConfigured: boolean;
	totalExternal: number;
	unrecognised: string[];
	strictMode: boolean;
} {
	const patterns = parseExpectedExternalTools(env.EXPECTED_EXTERNAL_TOOLS);
	const unrecognised =
		patterns.length > 0
			? externalToolNames.filter(
					(name) => !matchesExternalPattern(name, patterns),
				)
			: [];

	return {
		allowlistConfigured: patterns.length > 0,
		totalExternal: externalToolNames.length,
		unrecognised,
		strictMode: env.STRICT_TOOL_SURFACE === "true",
	};
}
