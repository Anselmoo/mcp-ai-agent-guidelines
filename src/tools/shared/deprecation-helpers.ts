/**
 * Deprecation warning helpers for MCP tools.
 * Tracks and emits deprecation warnings with removal timelines.
 *
 * Coexists with `deprecation.ts` (different API):
 * - `deprecation.ts`: `emitDeprecationWarning({tool, replacement, deprecatedIn, removedIn})`
 * - `deprecation-helpers.ts`: `warnDeprecated({oldName, newName, removalVersion})`
 *
 * @module
 */

import { logger } from "./logger.js";

/**
 * Options for deprecation warnings.
 */
export interface WarnDeprecatedOptions {
	/** The deprecated tool/symbol name */
	oldName: string;

	/** The recommended replacement */
	newName: string;

	/** Version when removal is planned */
	removalVersion: string;

	/** Optional migration guide URL */
	migrationUrl?: string;
}

/**
 * Tracks which deprecation warnings have been emitted in this process.
 * Prevents log flooding from repeated calls.
 */
export class DeprecationRegistry {
	private readonly emitted = new Set<string>();
	private readonly registry = new Map<string, WarnDeprecatedOptions>();

	/**
	 * Register a known deprecation.
	 */
	register(options: WarnDeprecatedOptions): void {
		this.registry.set(options.oldName, options);
	}

	/**
	 * Emit a deprecation warning (only once per oldName per process).
	 */
	warn(oldName: string): void {
		if (this.emitted.has(oldName)) {
			return;
		}

		const opts = this.registry.get(oldName);
		if (!opts) {
			logger.warn(
				`Deprecated tool used: ${oldName} (no replacement info registered)`,
			);
			this.emitted.add(oldName);
			return;
		}

		this.emitted.add(oldName);
		this.emitWarning(opts);
	}

	/**
	 * Emit a warning and add to registry in one step.
	 */
	warnOnce(options: WarnDeprecatedOptions): void {
		if (this.emitted.has(options.oldName)) {
			return;
		}

		if (!this.registry.has(options.oldName)) {
			this.registry.set(options.oldName, options);
		}

		this.emitted.add(options.oldName);
		this.emitWarning(options);
	}

	/**
	 * Check if a deprecation has already been emitted.
	 */
	hasEmitted(oldName: string): boolean {
		return this.emitted.has(oldName);
	}

	/**
	 * Get all registered deprecations.
	 */
	listRegistered(): WarnDeprecatedOptions[] {
		return Array.from(this.registry.values());
	}

	/**
	 * Reset all emitted warnings (for testing).
	 */
	reset(): void {
		this.emitted.clear();
	}

	/**
	 * Clear registry and emitted state (for testing).
	 */
	clear(): void {
		this.emitted.clear();
		this.registry.clear();
	}

	private emitWarning(opts: WarnDeprecatedOptions): void {
		const parts = [
			`[DEPRECATED] "${opts.oldName}" is deprecated.`,
			`Use "${opts.newName}" instead.`,
			`Scheduled for removal in v${opts.removalVersion}.`,
		];

		if (opts.migrationUrl) {
			parts.push(`Migration guide: ${opts.migrationUrl}`);
		}

		logger.warn(parts.join(" "), {
			deprecated: opts.oldName,
			replacement: opts.newName,
			removalVersion: opts.removalVersion,
		});
	}
}

/**
 * Singleton deprecation registry for the application.
 */
export const deprecationRegistry = new DeprecationRegistry();

/**
 * Emit a deprecation warning using the global registry.
 * Only emits once per `oldName` per process lifetime.
 *
 * @example
 * ```typescript
 * warnDeprecated({
 *   oldName: 'hierarchical_prompt_builder',
 *   newName: 'prompt_engineering_framework',
 *   removalVersion: '0.16.0',
 * });
 * ```
 */
export function warnDeprecated(options: WarnDeprecatedOptions): void {
	deprecationRegistry.warnOnce(options);
}
