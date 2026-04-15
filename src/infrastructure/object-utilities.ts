/**
 * Object and data utilities using `ohash`, `remeda`, and `jsonpath-plus`.
 *
 * - `ohash`        — deterministic object hashing (content-addressable keys)
 * - `remeda`       — type-safe functional data transformations
 * - `jsonpath-plus` — JSONPath extraction from nested structures
 */

import { JSONPath } from "jsonpath-plus";
import { hash, serialize } from "ohash";
import { filter, groupBy, map, pipe, sortBy, unique } from "remeda";

export type QueryPathGuard<T> = (value: unknown) => value is T;

function isBalancedExpression(expression: string): boolean {
	let bracketDepth = 0;
	let parenDepth = 0;

	for (const character of expression) {
		if (character === "[") {
			bracketDepth += 1;
		} else if (character === "]") {
			bracketDepth -= 1;
		} else if (character === "(") {
			parenDepth += 1;
		} else if (character === ")") {
			parenDepth -= 1;
		}

		if (bracketDepth < 0 || parenDepth < 0) {
			return false;
		}
	}

	return bracketDepth === 0 && parenDepth === 0;
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { filter, groupBy, map, pipe, sortBy, unique };

// ---------------------------------------------------------------------------
// Hashing helpers (ohash)
// ---------------------------------------------------------------------------

/**
 * Produce a deterministic, content-addressable hash string for any value.
 *
 * Useful for cache keys, deduplication, and change detection.
 *
 * ```ts
 * const key = contentHash({ skillId: "qm-entanglement-mapper", request: "..." });
 * ```
 */
export function contentHash(value: unknown): string {
	return hash(value);
}

/**
 * Produce a shorter object-specific hash.
 */
export function objectHashKey(obj: Record<string, unknown>): string {
	return hash(obj);
}

/**
 * Serialise a value to a stable JSON-like string (used internally by ohash).
 * Useful for logging / diff comparisons.
 */
export function stableSerialize(value: unknown): string {
	return serialize(value);
}

// ---------------------------------------------------------------------------
// JSONPath extraction helpers (jsonpath-plus)
// ---------------------------------------------------------------------------

/**
 * Extract values from `data` matching the given JSONPath `expression`.
 *
 * Returns an empty array when nothing matches.
 *
 * ```ts
 * const models = queryPath(config, "$.models[*].id");
 * ```
 */
export function queryPath(data: unknown, expression: string): unknown[];
export function queryPath<T>(
	data: unknown,
	expression: string,
	guard: QueryPathGuard<T>,
): T[];
export function queryPath<T>(
	data: unknown,
	expression: string,
	guard?: QueryPathGuard<T>,
): unknown[] | T[] {
	if (typeof expression !== "string" || expression.trim().length === 0) {
		return [];
	}

	if (!expression.trim().startsWith("$") || !isBalancedExpression(expression)) {
		return [];
	}

	if (typeof data !== "object" || data === null) {
		return [];
	}

	try {
		const results = JSONPath<unknown[]>({
			path: expression,
			json: data,
			resultType: "value",
			wrap: true,
		});

		if (!Array.isArray(results)) {
			return [];
		}

		return guard ? results.filter(guard) : results;
	} catch {
		return [];
	}
}

/**
 * Extract the first matching value for a JSONPath expression, or `undefined`
 * if nothing matches.
 */
export function queryFirst(
	data: unknown,
	expression: string,
): unknown | undefined;
export function queryFirst<T>(
	data: unknown,
	expression: string,
	guard: QueryPathGuard<T>,
): T | undefined;
export function queryFirst<T>(
	data: unknown,
	expression: string,
	guard?: QueryPathGuard<T>,
): unknown | T | undefined {
	const results = guard
		? queryPath(data, expression, guard)
		: queryPath(data, expression);
	return results[0];
}

/**
 * Check whether a JSONPath expression matches at least one value.
 */
export function hasPath(data: unknown, expression: string): boolean {
	return queryPath(data, expression).length > 0;
}

// ---------------------------------------------------------------------------
// Functional pipeline helpers (remeda)
// ---------------------------------------------------------------------------

/**
 * Filter an array to unique items using a key extractor function.
 *
 * ```ts
 * const deduped = uniqueBy(skills, (s) => s.id);
 * ```
 */
export function uniqueBy<T>(
	items: T[],
	keyFn: (item: T) => string | number,
): T[] {
	return pipe(items, unique()).filter((item, idx, arr) => {
		const key = keyFn(item);
		return arr.findIndex((x) => keyFn(x) === key) === idx;
	});
}

/**
 * Group an array of items by a derived string key.
 *
 * ```ts
 * const byDomain = groupByKey(skills, (s) => s.domain);
 * ```
 */
export function groupByKey<T>(
	items: T[],
	keyFn: (item: T) => string,
): Record<string, T[]> {
	return groupBy(items, keyFn) as Record<string, T[]>;
}

/**
 * Sort an array by a numeric key in ascending order.
 */
export function sortAscBy<T>(
	items: T[],
	keyFn: (item: T) => number | string,
): T[] {
	return sortBy(items, keyFn);
}

/**
 * Filter nullish values from an array and narrow the type.
 */
export function compact<T>(items: Array<T | null | undefined>): T[] {
	return filter(items, (x): x is T => x != null);
}

/**
 * Map an array through a transform and remove null/undefined results.
 */
export function filterMap<T, U>(
	items: T[],
	fn: (item: T) => U | null | undefined,
): U[] {
	return compact(map(items, fn));
}

/**
 * Convert any thrown value into a human-readable error message.
 */
export function toErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
