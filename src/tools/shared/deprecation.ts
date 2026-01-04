/**
 * Deprecation warning utility for MCP tools
 * Provides consistent deprecation messaging with once-per-session warnings
 */

import { logger } from "./logger.js";

const warned = new Set<string>();

export interface DeprecationOptions {
	tool: string;
	replacement: string;
	deprecatedIn: string;
	removedIn: string;
}

/**
 * Emit a deprecation warning for a tool
 * Warnings are emitted only once per tool per session to avoid spam
 */
export function emitDeprecationWarning(options: DeprecationOptions): void {
	if (warned.has(options.tool)) return;

	warned.add(options.tool);

	logger.warn(
		`Tool "${options.tool}" is deprecated since ${options.deprecatedIn}. ` +
			`Use "${options.replacement}" instead. ` +
			`Will be removed in ${options.removedIn}.`,
		{
			type: "deprecation",
			tool: options.tool,
			replacement: options.replacement,
			deprecatedIn: options.deprecatedIn,
			removedIn: options.removedIn,
		},
	);
}

/**
 * Reset deprecation warnings (for testing)
 * @internal
 */
export function resetDeprecationWarnings(): void {
	warned.clear();
}
