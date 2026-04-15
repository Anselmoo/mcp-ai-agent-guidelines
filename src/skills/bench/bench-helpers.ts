export const BENCH_ADVISORY_DISCLAIMER =
	"This analysis is advisory only — benchmark guidance should be validated against your real evaluation datasets, rater protocols, and release criteria before it becomes a production gate.";

export function matchBenchRules(
	rules: ReadonlyArray<{ pattern: RegExp; detail: string }>,
	combined: string,
): string[] {
	const seen = new Set<string>();
	const matched: string[] = [];

	for (const { pattern, detail } of rules) {
		if (pattern.test(combined) && !seen.has(detail)) {
			seen.add(detail);
			matched.push(detail);
		}
	}

	return matched;
}
