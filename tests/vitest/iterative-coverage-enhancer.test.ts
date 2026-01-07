import { describe, expect, it } from "vitest";
import { iterativeCoverageEnhancer } from "../../src/tools/iterative-coverage-enhancer.js";

describe("Iterative Coverage Enhancer", () => {
	it("should generate a comprehensive coverage enhancement report with default settings", async () => {
		const result = await iterativeCoverageEnhancer({
			language: "typescript",
			currentCoverage: {
				statements: 42.41,
				functions: 26.98,
				lines: 42.41,
				branches: 88.29,
			},
		});

		expect(result).toBeDefined();
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain(
			"# 🎯 Iterative Coverage Enhancement Report",
		);
		expect(result.content[0].text).toContain("Executive Summary");
		expect(result.content[0].text).toContain("Coverage Gaps Analysis");
		expect(result.content[0].text).toContain("Dead Code Detection");
		expect(result.content[0].text).toContain("Test Generation Suggestions");
		expect(result.content[0].text).toContain(
			"Adaptive Threshold Recommendations",
		);
		expect(result.content[0].text).toContain("Iterative Enhancement Plan");
		expect(result.content[0].text).toContain("CI/CD Integration Actions");
	});

	it("should handle custom current and target coverage metrics", async () => {
		const result = await iterativeCoverageEnhancer({
			language: "javascript",
			framework: "react",
			currentCoverage: {
				statements: 60.5,
				functions: 45.2,
				lines: 62.1,
				branches: 75.8,
			},
			targetCoverage: {
				statements: 80.0,
				functions: 70.0,
				lines: 80.0,
				branches: 85.0,
			},
		});

		expect(result.content[0].text).toContain("60.5%");
		expect(result.content[0].text).toContain("45.2%");
		expect(result.content[0].text).toContain("80.0%");
		expect(result.content[0].text).toContain("70.0%");
		// Check that gaps are calculated correctly in the table
		expect(result.content[0].text).toContain("| 19.5% |");
		expect(result.content[0].text).toContain("| 24.8% |");
	});

	it("should allow selective analysis with configuration flags", async () => {
		const result = await iterativeCoverageEnhancer({
			language: "python",
			analyzeCoverageGaps: false,
			detectDeadCode: true,
			generateTestSuggestions: false,
			adaptThresholds: true,
			generateCIActions: false,
		});

		expect(result.content[0].text).toContain("Dead Code Detection");
		expect(result.content[0].text).toContain(
			"Adaptive Threshold Recommendations",
		);
		expect(result.content[0].text).not.toContain("Coverage Gaps Analysis");
		expect(result.content[0].text).not.toContain("Test Generation Suggestions");
		expect(result.content[0].text).not.toContain("CI/CD Integration Actions");
	});

	it("should generate output in different formats", async () => {
		const markdownResult = await iterativeCoverageEnhancer({
			outputFormat: "markdown",
		});
		expect(markdownResult.content[0].text).toContain("#");
		expect(markdownResult.content[0].text).toContain("##");

		// Note: In this implementation, all formats return markdown
		// but the schema supports json and text for future enhancement
		const jsonResult = await iterativeCoverageEnhancer({
			outputFormat: "json",
		});
		expect(jsonResult.content[0].type).toBe("text");
	});

	it("should handle projects without current coverage data", async () => {
		const result = await iterativeCoverageEnhancer({
			language: "go",
			framework: "gin",
		});

		// Should use default coverage values
		expect(result.content[0].text).toContain("42.4%"); // Default statements coverage
		expect(result.content[0].text).toContain("27.0%"); // Default functions coverage
		expect(result.content[0].text).toContain("Executive Summary");
	});

	it("should include references when enabled", async () => {
		const withReferences = await iterativeCoverageEnhancer({
			includeReferences: true,
		});
		expect(withReferences.content[0].text).toContain("## Further Reading");
		expect(withReferences.content[0].text).toContain("martinfowler.com");
		expect(withReferences.content[0].text).toContain("testdriven.io");
		const withoutReferences = await iterativeCoverageEnhancer({
			includeReferences: false,
		});
		expect(withoutReferences.content[0].text).not.toContain("## References");
	});

	it("should generate CI/CD integration examples", async () => {
		const result = await iterativeCoverageEnhancer({
			generateCIActions: true,
		});

		expect(result.content[0].text).toContain("GitHub Actions Workflow Example");
		expect(result.content[0].text).toContain(
			"name: Iterative Coverage Enhancement",
		);
		expect(result.content[0].text).toContain("npm run test:coverage:vitest");
		expect(result.content[0].text).toContain("Automated Threshold Updates");
		expect(result.content[0].text).toContain("Integration with Existing Tools");
	});

	it("should generate comprehensive dead code analysis", async () => {
		const result = await iterativeCoverageEnhancer({
			detectDeadCode: true,
		});

		expect(result.content[0].text).toContain("🗑️ Dead Code Detection");
		expect(result.content[0].text).toContain("High Confidence Removals");
		expect(result.content[0].text).toContain("Medium Confidence Removals");
		expect(result.content[0].text).toContain("oldFormatFunction");
		expect(result.content[0].text).toContain("unusedLibrary");
	});

	it("should provide detailed test suggestions with prioritization", async () => {
		const result = await iterativeCoverageEnhancer({
			generateTestSuggestions: true,
		});

		expect(result.content[0].text).toContain("🧪 Test Generation Suggestions");
		expect(result.content[0].text).toContain("Prioritized Test Development");
		expect(result.content[0].text).toContain("High Priority");
		expect(result.content[0].text).toContain("Medium Priority");
		expect(result.content[0].text).toContain("handleErrorCase");
		expect(result.content[0].text).toContain("validateInput");
	});

	it("should generate adaptive threshold recommendations", async () => {
		const result = await iterativeCoverageEnhancer({
			adaptThresholds: true,
			currentCoverage: {
				statements: 30,
				functions: 20,
				lines: 30,
				branches: 80,
			},
		});

		expect(result.content[0].text).toContain(
			"⚙️ Adaptive Threshold Recommendations",
		);
		expect(result.content[0].text).toContain(
			"Proposed Coverage Threshold Updates",
		);
		expect(result.content[0].text).toContain("Configuration Update");
		expect(result.content[0].text).toContain("vitest.config.ts");
		expect(result.content[0].text).toContain("thresholds:");
	});

	it("should create iterative enhancement plan with phases", async () => {
		const result = await iterativeCoverageEnhancer({});

		expect(result.content[0].text).toContain("📋 Iterative Enhancement Plan");
		expect(result.content[0].text).toContain("Phase 1:");
		expect(result.content[0].text).toContain("Phase 2:");
		expect(result.content[0].text).toContain(
			"Dead Code Cleanup & High-Priority Gaps",
		);
		expect(result.content[0].text).toContain(
			"Medium Priority Coverage Expansion",
		);
		expect(result.content[0].text).toContain("**Timeline**:");
		expect(result.content[0].text).toContain("**Expected Impact**:");
		expect(result.content[0].text).toContain("Coverage increase:");
		expect(result.content[0].text).toContain("Dead code reduction:");
	});

	it("should validate input schema correctly", async () => {
		// Valid input should work
		const validResult = await iterativeCoverageEnhancer({
			language: "typescript",
			currentCoverage: {
				statements: 50,
				functions: 40,
				lines: 50,
				branches: 60,
			},
		});
		expect(validResult).toBeDefined();

		// Invalid coverage values should be handled by Zod validation
		const invalidResult = (await iterativeCoverageEnhancer({
			currentCoverage: {
				statements: 150, // Invalid: > 100
				functions: -10, // Invalid: < 0
				lines: 50,
				branches: 60,
			},
		})) as { isError?: boolean; content: { text: string }[] };
		expect(invalidResult.isError).toBe(true);
	});

	it("should handle different programming languages and frameworks", async () => {
		const languages = ["typescript", "javascript", "python", "java", "go"];
		const frameworks = [
			"react",
			"vue",
			"angular",
			"express",
			"django",
			"spring",
		];

		for (const language of languages) {
			const result = await iterativeCoverageEnhancer({ language });
			expect(result.content[0].text).toContain("Executive Summary");
		}

		for (const framework of frameworks) {
			const result = await iterativeCoverageEnhancer({
				language: "javascript",
				framework,
			});
			expect(result.content[0].text).toContain("Executive Summary");
		}
	});

	it("should generate executive summary with proper metrics calculations", async () => {
		const result = await iterativeCoverageEnhancer({
			currentCoverage: {
				statements: 40.0,
				functions: 25.0,
				lines: 40.0,
				branches: 85.0,
			},
			targetCoverage: {
				statements: 60.0,
				functions: 45.0,
				lines: 60.0,
				branches: 90.0,
			},
		});

		const text = result.content[0].text;
		expect(text).toContain("40.0%"); // Current statements
		expect(text).toContain("60.0%"); // Target statements
		expect(text).toContain("20.0%"); // Gap = 60 - 40
		expect(text).toContain("25.0%"); // Current functions
		expect(text).toContain("45.0%"); // Target functions
		expect(text).toContain("| 20.0% |"); // Function gap = 45 - 25
	});

	it("should handle edge case with very high current coverage", async () => {
		const result = await iterativeCoverageEnhancer({
			currentCoverage: {
				statements: 95.0,
				functions: 90.0,
				lines: 95.0,
				branches: 98.0,
			},
		});

		// Should still generate recommendations for maintaining high coverage
		expect(result.content[0].text).toContain("95.0%");
		expect(result.content[0].text).toContain("90.0%");
		expect(result.content[0].text).toContain("98.0%");
		expect(result.content[0].text).toContain("Executive Summary");
	});
});
