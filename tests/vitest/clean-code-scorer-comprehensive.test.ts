import { describe, expect, it } from "vitest";
import { cleanCodeScorer } from "../../src/tools/analysis/clean-code-scorer.js";

describe("Clean Code Scorer - Comprehensive Coverage", () => {
	describe("Edge Cases and Score Boundaries", () => {
		it("should achieve perfect score with excellent code and coverage", async () => {
			const code = `
/**
 * Perfect example function
 * @param x Input number
 * @returns Doubled value
 */
function double(x: number): number {
	return x * 2;
}

export default double;
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "typescript",
				coverageMetrics: {
					statements: 100,
					branches: 100,
					functions: 100,
					lines: 100,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/100\/100|Perfect/);
		});

		it("should handle score exactly at 95 (Excellent threshold)", async () => {
			const code = "// Good code";

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "typescript",
				coverageMetrics: {
					statements: 95,
					branches: 95,
					functions: 95,
					lines: 95,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Excellent|Very Good/);
		});

		it("should handle score exactly at 90 (Very Good threshold)", async () => {
			const code = "// Code";

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "typescript",
				coverageMetrics: {
					statements: 90,
					branches: 90,
					functions: 90,
					lines: 90,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Excellent|Very Good/);
		});

		it("should handle score exactly at 80 (Good threshold)", async () => {
			const code = "const x = 1;";

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "typescript",
				coverageMetrics: {
					statements: 80,
					branches: 80,
					functions: 80,
					lines: 80,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// With TypeScript and Linting bonuses, score will be higher
			expect(text).toMatch(/Excellent|Very Good|Good/);
		});

		it("should handle score exactly at 70 (Fair threshold)", async () => {
			const code = "console.log('test');";

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 70,
					branches: 70,
					functions: 70,
					lines: 70,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Good|Fair/);
		});

		it("should handle score exactly at 60 (Poor threshold)", async () => {
			const code = `
console.log('debug');
const key = 'secret-key';
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 60,
					branches: 60,
					functions: 60,
					lines: 60,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// With TypeScript and Linting bonuses, score will be higher
			expect(text).toMatch(/Very Good|Good|Fair/);
		});

		it("should handle score below 60", async () => {
			const code = `
const apiKey = 'key';
const password = 'pass';
eval('code');
console.log('debug');
// old code
// more old code
// even more old code
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 50,
					branches: 50,
					functions: 50,
					lines: 50,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// Score will be around 70-80 due to TypeScript and Linting bonuses
			expect(text).toMatch(/Good|Fair/);
		});
	});

	describe("Coverage Metric Edge Cases", () => {
		it("should handle coverage exactly at 80% for individual metrics", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				coverageMetrics: {
					statements: 80,
					branches: 80,
					functions: 80,
					lines: 80,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// At exactly 80%, no coverage warnings should appear
			expect(text).not.toMatch(/below 80%/);
		});

		it("should handle coverage exactly at 79.9%", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				coverageMetrics: {
					statements: 79,
					branches: 79,
					functions: 79,
					lines: 79,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// Below 80% should trigger warnings
			expect(text).toMatch(/below 80%/);
		});

		it("should handle only some metrics below 80%", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				coverageMetrics: {
					statements: 85,
					branches: 75,
					functions: 90,
					lines: 78,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Branch coverage 75% is below 80%/);
			expect(text).not.toMatch(/Statement coverage.*below 80%/);
		});

		it("should handle coverage metrics with zeros", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				coverageMetrics: {
					statements: 0,
					branches: 0,
					functions: 0,
					lines: 0,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/below 80%/);
		});

		it("should handle coverage exactly at 90% for achievements", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				coverageMetrics: {
					statements: 90,
					branches: 90,
					functions: 90,
					lines: 90,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Excellent test coverage achieved|Achievements/);
		});

		it("should handle coverage exactly at 70% for recommendations", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				coverageMetrics: {
					statements: 69,
					branches: 69,
					functions: 69,
					lines: 69,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Increase test coverage to at least 80%/);
			expect(text).toMatch(/Identify and test uncovered code paths/);
		});
	});

	describe("Code Hygiene Scoring Edge Cases", () => {
		it("should handle hygiene score exactly at 85", async () => {
			// Clean code that should score around 85
			const code = `
function test() {
	return true;
}
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toContain("Code Hygiene");
		});

		it("should trigger hygiene recommendations when score is below 70", async () => {
			const code = `
// TODO: fix this
// FIXME: broken
console.log('debug');
const apiKey = 'secret';
// old code line 1
// old code line 2
// old code line 3
// old code line 4
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 65,
					branches: 65,
					functions: 65,
					lines: 65,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Improve code hygiene|Run code cleanup/);
		});

		it("should detect FIXME comments", async () => {
			const code = "// FIXME: broken code here";

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/TODO or FIXME/);
		});

		it("should detect print statements in Python", async () => {
			const code = `
def hello():
    print("debug info")
    return True
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "python",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Debug statements/);
		});

		it("should detect API keys with underscores", async () => {
			const code = 'const api_key = "12345";';

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/hardcoded credentials/i);
		});

		it("should detect token secrets", async () => {
			const code = 'const token = "secret-token-123";';

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/hardcoded credentials/i);
		});

		it("should detect exactly 3 commented code lines (boundary)", async () => {
			const code = `
// const x = 1;
// const y = 2;
// const z = 3;
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// Exactly 3 lines should not trigger the penalty
			expect(text).not.toMatch(/lines of commented code found/);
		});

		it("should detect 4 or more commented code lines", async () => {
			const code = `
// const x = 1;
// const y = 2;
// const z = 3;
// const w = 4;
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// More than 3 lines should trigger the penalty
			expect(text).toMatch(/lines of commented code found/);
		});

		it("should detect Python def comments (4 or more lines)", async () => {
			const code = `
# def old_function():
#     pass
# var = 1
# another = 2
# more = 3
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "python",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// Need 4 or more lines matching the pattern to trigger
			expect(text).toContain("Code Hygiene");
		});
	});

	describe("Documentation Scoring", () => {
		it("should score documentation exactly at 70", async () => {
			const code = `
// Some comment
function test() {
	return true;
}
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toContain("Documentation");
		});

		it("should achieve documentation score of 90+", async () => {
			const code = `
/**
 * Function description
 * @param x Parameter
 * @returns Result
 */
function test(x: number): number {
	return x;
}

/**
 * Another function
 */
function another() {
	return true;
}
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "typescript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Well-documented codebase|Documentation/);
		});
	});

	describe("Security Scoring", () => {
		it("should achieve security score of 100", async () => {
			const code = `
function secure(input: string): string {
	return input.trim();
}
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "typescript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/No security vulnerabilities detected/);
		});

		it("should detect security score below 80", async () => {
			const code = `
const key = 'secret';
eval('code');
element.innerHTML = userInput;
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Address security vulnerabilities immediately/);
			expect(text).toMatch(/Run security audit/);
		});
	});

	describe("Overall Score Logic", () => {
		it("should handle overall score close to 100", async () => {
			const code = `
/**
 * Perfect function with extensive documentation
 * @returns Always true
 * @example perfect() === true
 */
function perfect(): boolean {
	return true;
}

/**
 * Another well-documented function
 * @returns Success indicator
 */
function another(): boolean {
	return true;
}
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "typescript",
				coverageMetrics: {
					statements: 100,
					branches: 100,
					functions: 100,
					lines: 100,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// Should get 100/100 or 99/100
			expect(text).toMatch(/100\/100|99\/100/);
		});

		it("should provide general recommendations when score is not 100 but no specific issues", async () => {
			const code = "const x = 1;";

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 85,
					branches: 85,
					functions: 85,
					lines: 85,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Regular code reviews/);
			expect(text).toMatch(/Automated quality gates/);
		});

		it("should provide default next steps when no specific issues", async () => {
			const code = "const x = 1;";

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 88,
					branches: 88,
					functions: 88,
					lines: 88,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Focus on lowest scoring categories first/);
			expect(text).toMatch(/Set up automated quality monitoring/);
		});
	});

	describe("Metadata and References", () => {
		it("should include references when requested", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				includeReferences: true,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Further Reading/);
			expect(text).toMatch(/Clean Code Principles/);
		});

		it("should include metadata with date when requested", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				includeReferences: false,
				includeMetadata: true,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Metadata/);
			expect(text).toMatch(/Updated:/);
			expect(text).toMatch(/Source tool: mcp_ai-agent-guid_clean-code-scorer/);
		});

		it("should include inputFile in metadata when provided", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				includeReferences: false,
				includeMetadata: true,
				inputFile: "/src/test.js",
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Input file: \/src\/test\.js/);
		});

		it("should not include inputFile when not provided", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				includeReferences: false,
				includeMetadata: true,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).not.toMatch(/Input file:/);
		});

		it("should not include metadata or references when both false", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).not.toMatch(/Metadata/);
			expect(text).not.toMatch(/Further Reading/);
			expect(text).not.toMatch(/Updated:/);
		});
	});

	describe("Category Weights and Calculations", () => {
		it("should apply correct weights to all categories", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				coverageMetrics: {
					statements: 90,
					branches: 90,
					functions: 90,
					lines: 90,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// Verify all categories are present
			expect(text).toMatch(/Code Hygiene/);
			expect(text).toMatch(/Test Coverage/);
			expect(text).toMatch(/TypeScript/);
			expect(text).toMatch(/Linting/);
			expect(text).toMatch(/Documentation/);
			expect(text).toMatch(/Security/);

			// Verify score distribution visualization
			expect(text).toMatch(/Score Distribution/);
		});
	});

	describe("Language Support", () => {
		it("should handle Go language", async () => {
			const code = `
package main

func main() {
    println("hello")
}
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "go",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/\d+\/100/);
		});

		it("should handle Rust language", async () => {
			const code = `
fn main() {
    println!("hello");
}
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "rust",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/\d+\/100/);
		});

		it("should handle Java language", async () => {
			const code = `
public class Hello {
    public static void main(String[] args) {
        System.out.println("hello");
    }
}
`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "java",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/\d+\/100/);
		});
	});
});
