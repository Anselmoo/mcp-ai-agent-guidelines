/**
 * Spec Validator - validates specifications against constitutional constraints
 *
 * @module strategies/speckit/spec-validator
 */

import type {
	ArchitectureRule,
	Constitution,
	Constraint,
	DesignPrinciple,
	Principle,
	SpecContent,
	ValidationIssue,
	ValidationResult,
} from "./types.js";

/**
 * Validates specification documents against a design "constitution"
 * composed of principles, constraints, architecture rules, and design principles.
 *
 * Typical usage is to create an instance for a given {@link Constitution} and then
 * call {@link SpecValidator#validate} for each {@link SpecContent} you want to
 * check for alignment and coverage.
 *
 * @example
 * ```ts
 * import { SpecValidator } from "./spec-validator.js";
 * import type { Constitution, SpecContent } from "./types.js";
 *
 * const constitution: Constitution = loadConstitutionSomehow();
 * const validator = new SpecValidator(constitution);
 *
 * const spec: SpecContent = {
 *   title: "Payments Service ADR",
 *   overview: "Describes the architecture and design decisions for the payments service.",
 * };
 *
 * const result = validator.validate(spec);
 *
 * if (!result.valid) {
 *   // Inspect result.issues and result.score to understand gaps and violations.
 * }
 * ```
 */
export class SpecValidator {
	constructor(private constitution: Constitution) {}

	/**
	 * Validate a specification against the constitution
	 *
	 * @param spec - The specification content to validate
	 * @returns Validation result with score and issues
	 */
	validate(spec: SpecContent): ValidationResult {
		const issues: ValidationIssue[] = [];
		let checkedConstraints = 0;
		let passedConstraints = 0;

		// Validate against principles
		for (const principle of this.constitution.principles ?? []) {
			checkedConstraints++;
			const issue = this.checkPrinciple(spec, principle);
			if (issue) {
				issues.push(issue);
			} else {
				passedConstraints++;
			}
		}

		// Validate against constraints
		for (const constraint of this.constitution.constraints ?? []) {
			checkedConstraints++;
			const issue = this.checkConstraint(spec, constraint);
			if (issue) {
				issues.push(issue);
			} else {
				passedConstraints++;
			}
		}

		// Validate against architecture rules
		for (const rule of this.constitution.architectureRules ?? []) {
			checkedConstraints++;
			const issue = this.checkArchitectureRule(spec, rule);
			if (issue) {
				issues.push(issue);
			} else {
				passedConstraints++;
			}
		}

		// Validate against design principles
		for (const principle of this.constitution.designPrinciples ?? []) {
			checkedConstraints++;
			const issue = this.checkDesignPrinciple(spec, principle);
			if (issue) {
				issues.push(issue);
			} else {
				passedConstraints++;
			}
		}

		const score =
			checkedConstraints > 0
				? Math.round((passedConstraints / checkedConstraints) * 100)
				: 100;

		return {
			valid: issues.filter((i) => i.severity === "error").length === 0,
			score,
			issues,
			checkedConstraints,
			passedConstraints,
		};
	}

	/**
	 * Check if spec aligns with a principle
	 *
	 * @param spec - The specification content
	 * @param principle - The principle to check
	 * @returns ValidationIssue if violation found, null otherwise
	 */
	private checkPrinciple(
		spec: SpecContent,
		principle: Principle,
	): ValidationIssue | null {
		// Reserved for future validation logic that may need to analyze content
		// Currently placeholder checks are used; more sophisticated checks can be
		// added based on specific principle types and requirements
		const _content = spec.rawMarkdown || spec.overview || "";

		// Example check for principle alignment
		// TODO: Replace hardcoded ID checks with a validation rule registry
		// that maps principle types/titles to validation functions
		if (principle.id === "1" && !spec.title) {
			return {
				severity: "warning",
				code: `P${principle.id}-VIOLATION`,
				message: `Principle "${principle.title}" may not be fully addressed`,
				constraint: principle.id,
				suggestion: "Ensure spec has a clear title",
			};
		}

		return null; // No issue found
	}

	/**
	 * Check if spec violates a constraint
	 *
	 * @param spec - The specification content
	 * @param constraint - The constraint to check
	 * @returns ValidationIssue if violation found, null otherwise
	 */
	private checkConstraint(
		spec: SpecContent,
		constraint: Constraint,
	): ValidationIssue | null {
		const content = spec.rawMarkdown || spec.overview || "";

		// Check based on constraint severity
		const severity = constraint.severity === "must" ? "error" : "warning";

		// Example constraint checks
		// TODO: Replace hardcoded ID checks with a validation rule registry
		// TypeScript strict mode check (C1)
		if (constraint.id === "C1" && content.toLowerCase().includes("any type")) {
			return {
				severity,
				code: `${constraint.id}-VIOLATION`,
				message: `Constraint "${constraint.title}" violated: avoid 'any' types`,
				constraint: constraint.id,
				suggestion: "Use explicit TypeScript types instead of 'any'",
			};
		}

		// ESM module system check (C2)
		// Use regex to match actual require() function calls, not just the word "require"
		const requirePattern = /\brequire\s*\(/;
		if (
			constraint.id === "C2" &&
			requirePattern.test(content) &&
			!content.includes("// legacy")
		) {
			return {
				severity,
				code: `${constraint.id}-VIOLATION`,
				message: `Constraint "${constraint.title}" violated: avoid CommonJS require()`,
				constraint: constraint.id,
				suggestion: "Use ESM imports with .js extensions",
			};
		}

		return null; // No issue found
	}

	/**
	 * Check architecture compliance
	 *
	 * @param spec - The specification content
	 * @param rule - The architecture rule to check
	 * @returns ValidationIssue if violation found, null otherwise
	 */
	private checkArchitectureRule(
		spec: SpecContent,
		rule: ArchitectureRule,
	): ValidationIssue | null {
		const content = spec.rawMarkdown || spec.overview || "";

		// Example architecture rule check
		// TODO: Replace hardcoded ID checks with a validation rule registry
		// Layer dependency check (AR1)
		if (rule.id === "AR1") {
			// Use more precise pattern to detect invalid dependency flow
			// Matches "domain → ... → gateway" pattern indicating wrong order
			const invalidDependencyPattern = /domain\s*→.*→\s*gateway/i;
			if (invalidDependencyPattern.test(content)) {
				return {
					severity: "error",
					code: `${rule.id}-VIOLATION`,
					message: `Architecture rule "${rule.title}" violated: invalid layer dependency`,
					constraint: rule.id,
					suggestion:
						"Follow proper layer dependencies: MCPServer → Gateway → Domain",
				};
			}
		}

		return null; // No issue found
	}

	/**
	 * Check design principle compliance
	 *
	 * @param spec - The specification content
	 * @param principle - The design principle to check
	 * @returns ValidationIssue if violation found, null otherwise
	 */
	private checkDesignPrinciple(
		spec: SpecContent,
		principle: DesignPrinciple,
	): ValidationIssue | null {
		const content = spec.rawMarkdown || spec.overview || "";

		// Example design principle check
		// Single responsibility check (DP1)
		if (principle.id === "DP1") {
			// Check if spec describes multiple distinct responsibilities
			const responsibilityKeywords = ["and also", "in addition", "plus"];
			const hasMultipleResponsibilities = responsibilityKeywords.some((kw) =>
				content.toLowerCase().includes(kw),
			);

			if (hasMultipleResponsibilities && spec.objectives?.length) {
				const distinctObjectives = spec.objectives.length > 3;
				if (distinctObjectives) {
					return {
						severity: "info",
						code: `${principle.id}-VIOLATION`,
						message: `Design principle "${principle.title}": spec may have too many responsibilities`,
						constraint: principle.id,
						suggestion: "Consider splitting into focused, single-purpose specs",
					};
				}
			}
		}

		return null; // No issue found
	}
}

/**
 * Factory function to create a SpecValidator instance
 *
 * Convenience factory for instantiating a {@link SpecValidator}.
 * Equivalent to `new SpecValidator(constitution)`.
 *
 * @param constitution - The constitution to validate against
 * @returns A new SpecValidator instance
 *
 * @example
 * ```ts
 * import { createSpecValidator } from "./spec-validator.js";
 * import { parseConstitution } from "./constitution-parser.js";
 *
 * const constitution = parseConstitution(constitutionMarkdown);
 * const validator = createSpecValidator(constitution);
 *
 * const result = validator.validate(mySpec);
 * ```
 */
export function createSpecValidator(constitution: Constitution): SpecValidator {
	return new SpecValidator(constitution);
}
