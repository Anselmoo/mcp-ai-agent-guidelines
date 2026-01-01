import type {
	MermaidModuleProvider,
	MermaidParseLike,
	ValidationResult,
} from "./types.js";

/**
 * Validator for Mermaid diagram syntax.
 * Optional runtime validation using mermaid.parse (if installed).
 */

let cachedMermaidParse: MermaidParseLike | null = null;
let mermaidLoadPromise: Promise<MermaidParseLike> | null = null;
let mermaidLoadError: Error | null = null;
let customMermaidModuleProvider: MermaidModuleProvider | null = null;

/**
 * Reset the mermaid loader state.
 * Used for testing purposes.
 */
function resetMermaidLoaderState(): void {
	cachedMermaidParse = null;
	mermaidLoadPromise = null;
	mermaidLoadError = null;
}

/**
 * Set a custom mermaid module provider for testing.
 *
 * **Exported for tests only** - Use via `import { __setMermaidModuleProvider } from '@/tools/test-utils/mermaid'`
 * This function is re-exported from test-utils for convenience. Direct import is discouraged.
 *
 * @param provider - Custom module provider function
 * @internal
 */
export function __setMermaidModuleProvider(
	provider: MermaidModuleProvider | null,
): void {
	customMermaidModuleProvider = provider;
	resetMermaidLoaderState();
}

/**
 * Import the mermaid module.
 * @returns Mermaid module or custom provider result
 */
function importMermaidModule(): Promise<unknown> {
	if (customMermaidModuleProvider) {
		return Promise.resolve(customMermaidModuleProvider());
	}
	return import("mermaid");
}

/**
 * Extract the parse function from mermaid module.
 * @param mod - Mermaid module object
 * @returns Parse function or null
 */
function extractMermaidParse(mod: unknown): MermaidParseLike | null {
	if (!mod) return null;

	// Direct function
	if (typeof mod === "function") {
		return mod as MermaidParseLike;
	}

	// Module with parse method
	if (typeof (mod as { parse?: unknown }).parse === "function") {
		const parse = (mod as { parse: MermaidParseLike }).parse;
		return parse.bind(mod);
	}

	// Check default export
	const defaultExport = (mod as { default?: unknown }).default;
	if (typeof defaultExport === "function") {
		return defaultExport as MermaidParseLike;
	}

	// Default export with parse method
	if (
		defaultExport &&
		typeof (defaultExport as { parse?: unknown }).parse === "function"
	) {
		const parse = (defaultExport as { parse: MermaidParseLike }).parse;
		return parse.bind(defaultExport);
	}

	return null;
}

/**
 * Load and cache the mermaid parse function.
 * @returns Mermaid parse function
 * @throws Error if mermaid cannot be loaded
 */
async function loadMermaidParse(): Promise<MermaidParseLike> {
	if (cachedMermaidParse) return cachedMermaidParse;
	if (mermaidLoadError) throw mermaidLoadError;

	if (!mermaidLoadPromise) {
		mermaidLoadPromise = importMermaidModule()
			.then((mod) => {
				const parse = extractMermaidParse(mod);
				if (!parse) {
					throw new Error("Mermaid parse function unavailable");
				}
				cachedMermaidParse = parse;
				return parse;
			})
			.catch((error) => {
				const err = error instanceof Error ? error : new Error(String(error));
				mermaidLoadError = err;
				mermaidLoadPromise = null;
				throw err;
			});
	}

	return mermaidLoadPromise;
}

/**
 * Validate Mermaid diagram syntax.
 * @param code - Mermaid diagram code
 * @returns Validation result
 */
export async function validateDiagram(code: string): Promise<ValidationResult> {
	try {
		const parse = await loadMermaidParse();
		// Some versions expose parse async; wrap in Promise.resolve
		await Promise.resolve(parse(code));
		return { valid: true };
	} catch (err) {
		const msg = (err as Error).message || String(err);

		// If mermaid is not installed/available, or requires DOM environment,
		// skip validation but allow diagram output
		if (
			/Cannot find module 'mermaid'|Cannot use import statement|module not found|DOMPurify|document is not defined|window is not defined|Mermaid parse function unavailable/i.test(
				msg,
			)
		) {
			return { valid: true, skipped: true };
		}

		return { valid: false, error: msg };
	}
}
