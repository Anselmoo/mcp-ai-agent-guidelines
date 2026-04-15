export const EVAL_ADVISORY_DISCLAIMER =
	"This analysis is advisory only — evaluation guidance should be validated with your real prompts, benchmarks, and acceptance thresholds before it is enforced operationally.";

export function matchEvalRules(
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
