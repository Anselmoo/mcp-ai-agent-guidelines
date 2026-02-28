import type {
	ConstitutionConstraints,
	SessionState,
	ValidationIssue,
	ValidationResult,
} from "../types.js";

export function validateAgainstConstitution(
	state: SessionState,
	constitution: ConstitutionConstraints,
): ValidationResult {
	const issues: ValidationIssue[] = [];

	for (const rule of constitution.rules) {
		if (!rule.check(state)) {
			issues.push({
				ruleId: rule.id,
				message: `Rule check failed: ${rule.description}`,
				severity: rule.severity,
			});
		}
	}

	const errors = issues.filter((issue) => issue.severity === "error");
	const warnings = issues.filter((issue) => issue.severity === "warning");
	const passed = constitution.rules.length - issues.length;
	const score =
		constitution.rules.length === 0
			? 100
			: Math.round((passed / constitution.rules.length) * 100);

	return {
		isValid: errors.length === 0,
		score,
		errors,
		warnings,
		recommendations:
			issues.length === 0
				? []
				: ["Review constitution constraints and update generated content."],
	};
}
