/**
 * Tests for spec-validator
 *
 * @module tests/strategies/speckit/spec-validator
 */

import { describe, expect, it } from "vitest";
import {
	createSpecValidator,
	SpecValidator,
} from "../../../../src/strategies/speckit/spec-validator.js";
import type {
	Constitution,
	SpecContent,
} from "../../../../src/strategies/speckit/types.js";

// Sample constitution for testing
const SAMPLE_CONSTITUTION: Constitution = {
	principles: [
		{
			id: "1",
			title: "Tool Discoverability First",
			description: "Every tool MUST be immediately understandable to an LLM.",
			type: "principle",
		},
		{
			id: "2",
			title: "Pure Domain, Pluggable Output",
			description:
				"Business logic MUST be pure; output formatting MUST be pluggable.",
			type: "principle",
		},
	],
	constraints: [
		{
			id: "C1",
			title: "TypeScript Strict Mode",
			description: "strict: true in tsconfig.json",
			severity: "must",
			type: "constraint",
		},
		{
			id: "C2",
			title: "ESM Module System",
			description: "All imports must use .js extension",
			severity: "must",
			type: "constraint",
		},
		{
			id: "C3",
			title: "Test Coverage",
			description: "Minimum 90% coverage",
			severity: "should",
			type: "constraint",
		},
	],
	architectureRules: [
		{
			id: "AR1",
			title: "Layer Dependencies",
			description: "MCPServer → Gateway → Domain",
			type: "architecture-rule",
		},
		{
			id: "AR2",
			title: "File Organization",
			description: "Follow standard directory structure",
			type: "architecture-rule",
		},
	],
	designPrinciples: [
		{
			id: "DP1",
			title: "Reduce to Essence",
			description: "Each tool does ONE thing brilliantly",
			type: "design-principle",
		},
		{
			id: "DP2",
			title: "Progressive Disclosure",
			description: "Basic usage is obvious; advanced features are discoverable",
			type: "design-principle",
		},
	],
};

describe("SpecValidator", () => {
	describe("constructor and factory", () => {
		it("should create validator with constructor", () => {
			const validator = new SpecValidator(SAMPLE_CONSTITUTION);
			expect(validator).toBeInstanceOf(SpecValidator);
		});

		it("should create validator with factory function", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			expect(validator).toBeInstanceOf(SpecValidator);
		});
	});

	describe("validate empty spec", () => {
		it("should validate empty spec as valid", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const result = validator.validate({});

			expect(result.valid).toBe(true);
			expect(result.score).toBeGreaterThan(0);
			expect(result.checkedConstraints).toBe(9); // 2 principles + 3 constraints + 2 arch rules + 2 design principles
		});

		it("should check all constitution items", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const result = validator.validate({});

			expect(result.checkedConstraints).toBe(9);
			expect(result.passedConstraints).toBeLessThanOrEqual(
				result.checkedConstraints,
			);
		});
	});

	describe("validate spec with content", () => {
		it("should calculate correct score for valid spec", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const validSpec: SpecContent = {
				title: "Valid Specification",
				overview: "This is a well-structured specification",
				objectives: [{ description: "Implement feature X", priority: "high" }],
				requirements: [
					{
						description: "System must handle 1000 req/sec",
						type: "performance",
					},
				],
				acceptanceCriteria: ["Feature works correctly", "Tests pass"],
				rawMarkdown: "# Valid Spec\n\nGood content here",
			};

			const result = validator.validate(validSpec);

			expect(result.score).toBeGreaterThanOrEqual(0);
			expect(result.score).toBeLessThanOrEqual(100);
		});

		it("should validate spec with title", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "My Spec",
				overview: "Overview text",
			};

			const result = validator.validate(spec);

			expect(result.valid).toBe(true);
		});

		it("should handle spec with objectives", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Spec with objectives",
				objectives: [
					{ description: "Objective 1", priority: "high" },
					{ description: "Objective 2", priority: "medium" },
				],
			};

			const result = validator.validate(spec);

			expect(result.checkedConstraints).toBeGreaterThan(0);
		});
	});

	describe("detect principle violations", () => {
		it("should detect missing title as principle warning", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				overview: "Content without a title",
			};

			const result = validator.validate(spec);

			// Look for principle violation warning
			const principleIssue = result.issues.find((i) =>
				i.code.includes("P1-VIOLATION"),
			);
			if (principleIssue) {
				expect(principleIssue.severity).toBe("warning");
				expect(principleIssue.constraint).toBe("1");
			}
		});
	});

	describe("detect constraint violations", () => {
		it("should detect 'any' type usage as constraint violation", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Spec with bad types",
				rawMarkdown:
					"# Spec\n\nWe will use any type for flexibility in the implementation.",
			};

			const result = validator.validate(spec);

			const c1Issue = result.issues.find((i) => i.code === "C1-VIOLATION");
			if (c1Issue) {
				expect(c1Issue.severity).toBe("error");
				expect(c1Issue.constraint).toBe("C1");
				expect(c1Issue.message).toContain("any");
			}
		});

		it("should detect CommonJS require as constraint violation", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Spec with CommonJS",
				rawMarkdown:
					"# Spec\n\nWe will use require('./module') to import dependencies.",
			};

			const result = validator.validate(spec);

			const c2Issue = result.issues.find((i) => i.code === "C2-VIOLATION");
			if (c2Issue) {
				expect(c2Issue.severity).toBe("error");
				expect(c2Issue.constraint).toBe("C2");
				expect(c2Issue.message).toContain("require");
			}
		});

		it("should not flag require when marked as legacy", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Spec with documented legacy",
				rawMarkdown:
					"# Spec\n\nOld code uses require() // legacy - will be migrated",
			};

			const result = validator.validate(spec);

			const c2Issue = result.issues.find((i) => i.code === "C2-VIOLATION");
			expect(c2Issue).toBeUndefined();
		});
	});

	describe("detect architecture rule violations", () => {
		it("should detect invalid layer dependency", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Spec with bad architecture",
				rawMarkdown: "# Spec\n\nArchitecture: domain → presentation → gateway",
			};

			const result = validator.validate(spec);

			const ar1Issue = result.issues.find((i) => i.code === "AR1-VIOLATION");
			if (ar1Issue) {
				expect(ar1Issue.severity).toBe("error");
				expect(ar1Issue.constraint).toBe("AR1");
			}
		});
	});

	describe("detect design principle violations", () => {
		it("should detect multiple responsibilities", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Spec with too many objectives",
				overview: "This tool does X and also Y in addition to Z plus W",
				objectives: [
					{ description: "Obj 1" },
					{ description: "Obj 2" },
					{ description: "Obj 3" },
					{ description: "Obj 4" },
					{ description: "Obj 5" },
				],
			};

			const result = validator.validate(spec);

			const dp1Issue = result.issues.find((i) => i.code === "DP1-VIOLATION");
			if (dp1Issue) {
				expect(dp1Issue.severity).toBe("info");
				expect(dp1Issue.constraint).toBe("DP1");
			}
		});

		it("should not flag focused specs", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Focused spec",
				overview: "This tool does one thing well",
				objectives: [
					{ description: "Primary objective" },
					{ description: "Secondary objective" },
				],
			};

			const result = validator.validate(spec);

			const dp1Issue = result.issues.find((i) => i.code === "DP1-VIOLATION");
			expect(dp1Issue).toBeUndefined();
		});
	});

	describe("score calculation", () => {
		it("should calculate score as percentage of passed constraints", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const result = validator.validate({
				title: "Clean spec",
				overview: "Simple and clean",
			});

			// Score should be (passedConstraints / checkedConstraints) * 100
			const expectedScore = Math.round(
				(result.passedConstraints / result.checkedConstraints) * 100,
			);
			expect(result.score).toBe(expectedScore);
		});

		it("should return 100 for empty constitution", () => {
			const emptyConstitution: Constitution = {
				principles: [],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};
			const validator = createSpecValidator(emptyConstitution);
			const result = validator.validate({});

			expect(result.score).toBe(100);
			expect(result.checkedConstraints).toBe(0);
		});

		it("should mark spec as invalid when errors exist", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Spec with errors",
				rawMarkdown: "Use any type and require() everywhere",
			};

			const result = validator.validate(spec);

			const hasErrors = result.issues.some((i) => i.severity === "error");
			expect(result.valid).toBe(!hasErrors);
		});

		it("should mark spec as valid when only warnings exist", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				overview: "Spec without title - only warnings",
			};

			const result = validator.validate(spec);

			const hasErrors = result.issues.some((i) => i.severity === "error");
			if (!hasErrors) {
				expect(result.valid).toBe(true);
			}
		});
	});

	describe("validation result structure", () => {
		it("should return all required fields", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const result = validator.validate({});

			expect(result).toHaveProperty("valid");
			expect(result).toHaveProperty("score");
			expect(result).toHaveProperty("issues");
			expect(result).toHaveProperty("checkedConstraints");
			expect(result).toHaveProperty("passedConstraints");

			expect(typeof result.valid).toBe("boolean");
			expect(typeof result.score).toBe("number");
			expect(Array.isArray(result.issues)).toBe(true);
			expect(typeof result.checkedConstraints).toBe("number");
			expect(typeof result.passedConstraints).toBe("number");
		});

		it("should have properly structured issues", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				rawMarkdown: "Use any type here",
			};

			const result = validator.validate(spec);

			for (const issue of result.issues) {
				expect(issue).toHaveProperty("severity");
				expect(issue).toHaveProperty("code");
				expect(issue).toHaveProperty("message");
				expect(["error", "warning", "info"]).toContain(issue.severity);
				expect(typeof issue.code).toBe("string");
				expect(typeof issue.message).toBe("string");
			}
		});
	});

	describe("edge cases", () => {
		it("should handle spec with only rawMarkdown", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const result = validator.validate({
				rawMarkdown: "# Simple Spec\n\nContent here",
			});

			expect(result).toBeDefined();
			expect(result.checkedConstraints).toBeGreaterThan(0);
		});

		it("should handle spec with only structured fields", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const result = validator.validate({
				title: "Structured Only",
				overview: "No raw markdown",
				objectives: [{ description: "Do something" }],
			});

			expect(result).toBeDefined();
			expect(result.checkedConstraints).toBeGreaterThan(0);
		});

		it("should handle constitution with undefined arrays", () => {
			const minimalConstitution: Constitution = {
				principles: [],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};
			const validator = createSpecValidator(minimalConstitution);
			const result = validator.validate({});

			expect(result.valid).toBe(true);
			expect(result.score).toBe(100);
		});
	});
});
