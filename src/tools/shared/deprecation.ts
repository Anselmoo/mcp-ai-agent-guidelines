/**
 * Deprecation warning utility
 * Emits warnings once per tool per session to avoid spam
 */

import { logger } from "./logger.js";

/**
 * Set of tools that have already emitted deprecation warnings in this session
 */
const warned = new Set<string>();

/**
 * Options for deprecation warning
 */
export interface DeprecationOptions {
	/** Name of the deprecated tool */
	tool: string;
	/** Name of the replacement tool */
	replacement: string;
	/** Version when the tool was deprecated */
	deprecatedIn: string;
	/** Version when the tool will be removed */
	removedIn: string;
}

/**
 * Emit a deprecation warning for a tool
 * Warning is emitted only once per tool per session
 *
 * @param options - Deprecation configuration
 */
export function emitDeprecationWarning(options: DeprecationOptions): void {
	if (warned.has(options.tool)) {
		return;
	}

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
 * This clears the set of warned tools
 */
export function resetDeprecationWarnings(): void {
	warned.clear();
}
