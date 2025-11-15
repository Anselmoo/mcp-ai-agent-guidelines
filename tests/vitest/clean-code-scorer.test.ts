import { describe, expect, it } from "vitest";
import { cleanCodeScorer } from "../../src/tools/analysis/clean-code-scorer.js";

describe("Clean Code Scorer", () => {
	describe("Overall Score Calculation", () => {
		it("should give perfect score (100/100) for excellent code", async () => {
			const code = `
/**
 * Adds two numbers together
 * @param a First number
 * @param b Second number
 * @returns Sum of a and b
 */
function add(a: number, b: number): number {
	return a + b;
}

export default add;
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "typescript",
				coverageMetrics: {
					statements: 95,
					branches: 92,
					functions: 98,
					lines: 95,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/95\/100|96\/100|97\/100|98\/100|99\/100|100\/100/);
			expect(text).toMatch(/Perfect|Excellent|Very Good/);
		});

		it("should detect security issues and lower score", async () => {
			const code = `
const apiKey = 'sk-1234567890';
const password = 'admin123';

async function getData() {
	await fetch('/api/data');
}
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
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

			expect(text).toMatch(/Security Risk|Hardcoded secrets/);
			expect(text).toMatch(/\d+\/100/);
			// Should not be excellent due to security issues
			expect(text).not.toMatch(/Perfect/);
		});

		it("should penalize low test coverage", async () => {
			const code = `
function calculate(x) {
	if (x > 10) return x * 2;
	else if (x > 5) return x + 5;
	else return x;
}
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 50,
					branches: 45,
					functions: 60,
					lines: 50,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/coverage.*below 80%/i);
			expect(text).toMatch(/Test Coverage/);
		});

		it("should detect code hygiene issues", async () => {
			const code = `
// TODO: Fix this later
console.log('debug output');

// const oldCode = 1;
// const moreOldCode = 2;
// function oldFunction() { return 3; }

function reallyLongFunction() {
${'  console.log("line");\n'.repeat(55)}
}
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 85,
					branches: 82,
					functions: 88,
					lines: 85,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Code Hygiene/);
			expect(text).toMatch(/TODO|Debug statements|commented code/i);
		});
	});

	describe("Category Breakdown", () => {
		it("should show category breakdown with scores", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				coverageMetrics: {
					statements: 90,
					branches: 88,
					functions: 92,
					lines: 90,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Code Hygiene/);
			expect(text).toMatch(/Test Coverage/);
			expect(text).toMatch(/TypeScript/);
			expect(text).toMatch(/Linting/);
			expect(text).toMatch(/Documentation/);
			expect(text).toMatch(/Security/);
		});

		it("should identify issues in each category", async () => {
			const code = `
const apiKey = 'test-key';
console.log('debug');
// old code here
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 60,
					branches: 55,
					functions: 65,
					lines: 60,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Issues:/);
			expect(text).toMatch(/coverage.*below 80%/i);
		});
	});

	describe("Recommendations and Next Steps", () => {
		it("should provide recommendations for improvement", async () => {
			const result = await cleanCodeScorer({
				codeContent: "var x = 1; console.log(x);",
				language: "javascript",
				coverageMetrics: {
					statements: 65,
					branches: 60,
					functions: 70,
					lines: 65,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Recommendations/);
			expect(text).toMatch(/Next Steps/);
		});

		it("should show achievements for high-quality code", async () => {
			const code = `
/**
 * Well-documented function
 */
function clean() {
	return true;
}
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 92,
					branches: 90,
					functions: 95,
					lines: 92,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Achievements/);
			expect(text).toMatch(
				/Excellent test coverage|TypeScript strict mode|Biome linting/,
			);
		});
	});

	describe("Score Visualization", () => {
		it("should include score bar visualization", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				coverageMetrics: {
					statements: 85,
					branches: 82,
					functions: 88,
					lines: 85,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/█|░/); // Should contain bar characters
			expect(text).toMatch(/Score Distribution/);
		});

		it("should show percentage and status icons", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/🟢|🟡|🟠|🔴/); // Status icons
			expect(text).toMatch(/\d+%/); // Percentage
		});
	});

	describe("Edge Cases", () => {
		it("should handle missing code content", async () => {
			const result = await cleanCodeScorer({
				coverageMetrics: {
					statements: 85,
					branches: 82,
					functions: 88,
					lines: 85,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/\d+\/100/);
			expect(text).toMatch(/Overall Score/);
		});

		it("should handle missing coverage metrics", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/\d+\/100/);
			expect(text).toMatch(/Test Coverage/);
		});

		it("should handle minimal input", async () => {
			const result = await cleanCodeScorer({
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/\d+\/100/);
			expect(text).toMatch(/Overall Score/);
		});
	});

	describe("Score Descriptions", () => {
		it("should provide appropriate description for high scores", async () => {
			const result = await cleanCodeScorer({
				codeContent: "// Clean code",
				language: "javascript",
				coverageMetrics: {
					statements: 95,
					branches: 93,
					functions: 96,
					lines: 95,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Perfect|Excellent|Very Good/);
		});

		it("should provide appropriate description for low scores", async () => {
			const code = `
const apiKey = 'key1';
const password = 'pass1';
eval('dangerous');
console.log('debug');
// old code 1
// old code 2
// old code 3
// old code 4
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				coverageMetrics: {
					statements: 50,
					branches: 45,
					functions: 55,
					lines: 50,
				},
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			// Should show lower score description (not Excellent or Perfect)
			expect(text).toMatch(/Good|Fair|Poor/);
			expect(text).not.toMatch(/Perfect/);
		});
	});

	describe("Additional Coverage Tests", () => {
		it("should detect SQL injection vulnerabilities", async () => {
			const code = `
const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/SQL injection/i);
		});

		it("should detect XSS vulnerabilities", async () => {
			const code = `
element.innerHTML = userInput;
div.dangerouslySetInnerHTML = { __html: content };
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/XSS/i);
		});

		it("should detect eval usage", async () => {
			const code = `
eval('some code');
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/eval/i);
		});

		it("should handle Python code", async () => {
			const code = `
def hello():
    print("hello")
# old code
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "python",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/\d+\/100/);
		});

		it("should include inputFile in metadata when provided", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				includeReferences: false,
				includeMetadata: true,
				inputFile: "/path/to/file.js",
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/Input file: \/path\/to\/file\.js/);
		});

		it("should detect JSDoc comments", async () => {
			const code = `
/**
 * This is a JSDoc comment
 * @param x The parameter
 */
function test(x) {
	return x;
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

			// Should get bonus for documentation
			expect(text).toMatch(/Documentation/);
		});

		it("should give appropriate score based on quality", async () => {
			const code = `
console.log('debug');
var x = 1;
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

			// With 60% coverage and minor issues, should get a decent score
			expect(text).toMatch(/\d+\/100/);
			expect(text).toMatch(/Very Good|Good|Fair/);
		});

		it("should provide specific security recommendations", async () => {
			const code = `
const secret = 'my-secret-key';
eval('code');
			`;

			const result = await cleanCodeScorer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/security/i);
			expect(text).toMatch(/Recommendations/);
		});

		it("should handle TypeScript code", async () => {
			const code = `
const value: string = "test";
function typed(x: number): number {
	return x * 2;
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

			expect(text).toMatch(/\d+\/100/);
		});

		it("should handle framework parameter", async () => {
			const result = await cleanCodeScorer({
				codeContent: "const x = 1;",
				language: "javascript",
				framework: "react",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/\d+\/100/);
		});

		it("should handle projectPath parameter", async () => {
			const result = await cleanCodeScorer({
				projectPath: "/home/user/project",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";

			expect(text).toMatch(/\d+\/100/);
		});
	});
});
