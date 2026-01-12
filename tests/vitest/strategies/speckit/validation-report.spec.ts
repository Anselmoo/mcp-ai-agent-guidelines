/**
 * Tests for ValidationReport generation and formatting
 *
 * @module tests/strategies/speckit/validation-report
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

describe("ValidationReport", () => {
	describe("generateReport", () => {
		it("should generate comprehensive report with all required fields", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Test Spec",
				overview: "Clean specification",
			};

			const report = validator.generateReport(spec);

			expect(report).toHaveProperty("valid");
			expect(report).toHaveProperty("score");
			expect(report).toHaveProperty("timestamp");
			expect(report).toHaveProperty("metrics");
			expect(report).toHaveProperty("byType");
			expect(report).toHaveProperty("issues");
			expect(report).toHaveProperty("recommendations");
		});

		it("should generate ISO-8601 timestamp", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const report = validator.generateReport({});

			expect(report.timestamp).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
			);
		});

		it("should calculate metrics correctly", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Spec with errors",
				rawMarkdown: "Use any type and require() everywhere",
			};

			const report = validator.generateReport(spec);

			expect(report.metrics.total).toBe(9); // 2 principles + 3 constraints + 2 arch rules + 2 design principles
			expect(report.metrics.passed).toBeLessThan(report.metrics.total);
			expect(report.metrics.failed).toBeGreaterThan(0);
			expect(report.metrics.total).toBe(
				report.metrics.passed +
					report.metrics.failed +
					report.metrics.warnings +
					report.metrics.info,
			);
		});

		it("should categorize results by type", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const report = validator.generateReport({});

			expect(report.byType.principles.checked).toBe(2);
			expect(report.byType.constraints.checked).toBe(3);
			expect(report.byType.architectureRules.checked).toBe(2);
			expect(report.byType.designPrinciples.checked).toBe(2);

			expect(report.byType.principles.passed).toBeGreaterThanOrEqual(0);
			expect(report.byType.constraints.passed).toBeGreaterThanOrEqual(0);
			expect(report.byType.architectureRules.passed).toBeGreaterThanOrEqual(0);
			expect(report.byType.designPrinciples.passed).toBeGreaterThanOrEqual(0);
		});

		it("should include recommendations for specs with errors", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				rawMarkdown: "Use any type here",
			};

			const report = validator.generateReport(spec);

			expect(report.recommendations).toBeDefined();
			expect(Array.isArray(report.recommendations)).toBe(true);
			if (report.recommendations) {
				expect(report.recommendations.length).toBeGreaterThan(0);
			}
		});

		it("should not include recommendations for perfect specs", () => {
			const emptyConstitution: Constitution = {
				principles: [],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};
			const validator = createSpecValidator(emptyConstitution);
			const report = validator.generateReport({
				title: "Perfect spec",
				overview: "Clean and valid",
			});

			expect(report.recommendations).toBeUndefined();
		});

		it("should preserve enhanced ValidationIssue structure", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				rawMarkdown: "Use any type",
			};

			const report = validator.generateReport(spec);

			const issue = report.issues.find((i) => i.code === "C1-VIOLATION");
			if (issue) {
				expect(issue.constraint).toBeDefined();
				expect(issue.constraint?.id).toBe("C1");
				expect(issue.constraint?.type).toBe("constraint");
				expect(issue.constraint?.description).toBeDefined();
			}
		});
	});

	describe("formatReportAsMarkdown", () => {
		it("should format report as valid markdown", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Test Spec",
				rawMarkdown: "Use any type",
			};

			const report = validator.generateReport(spec);
			const markdown = validator.formatReportAsMarkdown(report);

			expect(markdown).toContain("# Validation Report");
			expect(markdown).toContain("**Generated**:");
			expect(markdown).toContain("**Status**:");
			expect(markdown).toContain("**Score**:");
		});

		it("should include summary table", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const report = validator.generateReport({});
			const markdown = validator.formatReportAsMarkdown(report);

			expect(markdown).toContain("## Summary");
			expect(markdown).toContain("| Metric | Count |");
			expect(markdown).toContain("| Total Constraints |");
			expect(markdown).toContain("| Passed |");
			expect(markdown).toContain("| Errors |");
			expect(markdown).toContain("| Warnings |");
			expect(markdown).toContain("| Info |");
		});

		it("should format errors with ❌ icon", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				rawMarkdown: "Use any type",
			};

			const report = validator.generateReport(spec);
			const markdown = validator.formatReportAsMarkdown(report);

			if (report.metrics.failed > 0) {
				expect(markdown).toContain("### ❌ Errors");
			}
		});

		it("should format warnings with ⚠️ icon", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				overview: "No title",
			};

			const report = validator.generateReport(spec);
			const markdown = validator.formatReportAsMarkdown(report);

			if (report.metrics.warnings > 0) {
				expect(markdown).toContain("### ⚠️ Warnings");
			}
		});

		it("should format info with ℹ️ icon", () => {
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

			const report = validator.generateReport(spec);
			const markdown = validator.formatReportAsMarkdown(report);

			if (report.metrics.info > 0) {
				expect(markdown).toContain("### ℹ️ Infos");
			}
		});

		it("should include constraint details in issue listings", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				rawMarkdown: "Use any type",
			};

			const report = validator.generateReport(spec);
			const markdown = validator.formatReportAsMarkdown(report);

			expect(markdown).toContain("**C1-VIOLATION**:");
			expect(markdown).toContain("Constraint: C1 (constraint)");
			expect(markdown).toContain("Suggestion:");
		});

		it("should include recommendations section when present", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				rawMarkdown: "Use any type",
			};

			const report = validator.generateReport(spec);
			const markdown = validator.formatReportAsMarkdown(report);

			if (report.recommendations && report.recommendations.length > 0) {
				expect(markdown).toContain("## Recommendations");
				for (const rec of report.recommendations) {
					expect(markdown).toContain(`- ${rec}`);
				}
			}
		});

		it("should show valid status with ✅", () => {
			const emptyConstitution: Constitution = {
				principles: [],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};
			const validator = createSpecValidator(emptyConstitution);
			const report = validator.generateReport({});
			const markdown = validator.formatReportAsMarkdown(report);

			expect(markdown).toContain("**Status**: ✅ Valid");
		});

		it("should show invalid status with ❌", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				rawMarkdown: "Use any type",
			};

			const report = validator.generateReport(spec);
			const markdown = validator.formatReportAsMarkdown(report);

			if (!report.valid) {
				expect(markdown).toContain("**Status**: ❌ Invalid");
			}
		});

		it("should not include issues section when no issues exist", () => {
			const emptyConstitution: Constitution = {
				principles: [],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};
			const validator = createSpecValidator(emptyConstitution);
			const report = validator.generateReport({});
			const markdown = validator.formatReportAsMarkdown(report);

			expect(markdown).not.toContain("## Issues");
		});
	});

	describe("recommendations generation", () => {
		it("should recommend addressing errors first", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				rawMarkdown: "Use any type",
			};

			const report = validator.generateReport(spec);

			const hasErrorRecommendation = report.recommendations?.some((r) =>
				r.includes("error"),
			);
			if (report.metrics.failed > 0) {
				expect(hasErrorRecommendation).toBe(true);
			}
		});

		it("should recommend reviewing warnings", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				overview: "No title",
			};

			const report = validator.generateReport(spec);

			const hasWarningRecommendation = report.recommendations?.some((r) =>
				r.includes("warning"),
			);
			if (report.metrics.warnings > 0) {
				expect(hasWarningRecommendation).toBe(true);
			}
		});

		it("should include score-based recommendations", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				rawMarkdown: "Use any type and require() and domain → gateway",
			};

			const report = validator.generateReport(spec);

			if (report.score < 70) {
				const hasScoreRecommendation = report.recommendations?.some((r) =>
					r.includes("score"),
				);
				expect(hasScoreRecommendation).toBe(true);
			}
		});
	});

	describe("edge cases", () => {
		it("should handle empty constitution", () => {
			const emptyConstitution: Constitution = {
				principles: [],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};
			const validator = createSpecValidator(emptyConstitution);
			const report = validator.generateReport({});

			expect(report.valid).toBe(true);
			expect(report.score).toBe(100);
			expect(report.metrics.total).toBe(0);
			expect(report.metrics.passed).toBe(0);
			expect(report.byType.principles.checked).toBe(0);
		});

		it("should handle spec with multiple severity types", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const spec: SpecContent = {
				title: "Test Spec",
				// Put keywords in rawMarkdown so they're found
				rawMarkdown:
					"Use any type and require() and domain → gateway. This tool does X and also Y in addition to Z plus W",
				objectives: [
					{ description: "Obj 1" },
					{ description: "Obj 2" },
					{ description: "Obj 3" },
					{ description: "Obj 4" },
					{ description: "Obj 5" },
				],
			};

			const report = validator.generateReport(spec);

			// Should have errors from constraint violations
			expect(report.issues.some((i) => i.severity === "error")).toBe(true);
			// Info-level issues from design principles
			const hasInfo = report.issues.some((i) => i.severity === "info");
			expect(hasInfo).toBe(true);
		});

		it("should serialize report to JSON correctly", () => {
			const validator = createSpecValidator(SAMPLE_CONSTITUTION);
			const report = validator.generateReport({});

			const json = JSON.stringify(report);
			const parsed = JSON.parse(json);

			expect(parsed.valid).toBe(report.valid);
			expect(parsed.score).toBe(report.score);
			expect(parsed.timestamp).toBe(report.timestamp);
		});
	});
});
