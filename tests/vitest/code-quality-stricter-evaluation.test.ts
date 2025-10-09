import { describe, expect, it } from "vitest";
import { codeHygieneAnalyzer } from "../../src/tools/code-hygiene-analyzer";
import { guidelinesValidator } from "../../src/tools/guidelines-validator";

describe("Stricter Code Quality Evaluation", () => {
	describe("Code Hygiene with Severity-Based Scoring", () => {
		it("should severely penalize critical security issues", async () => {
			const code = `
				const apiKey = 'sk-1234567890abcdef';
				const password = 'admin123';
				async function getData() {
					await fetch('/api/data');
				}
			`;
			const res = await codeHygieneAnalyzer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});
			const text = res.content[0].type === "text" ? res.content[0].text : "";

			// Critical issue (hardcoded credentials) = -20 points
			// Critical issue (no error handling) = -20 points
			// Total: 100 - 40 = 60 (Needs Improvement, not Good)
			expect(text).toMatch(/Security Risk/);
			expect(text).toMatch(/Error Handling/);
			expect(text).toMatch(/60\/100|Needs Improvement/);
		});

		it("should give lower scores for multiple major issues", async () => {
			const code = `
				console.log('debug1');
				console.log('debug2');
				console.log('debug3');
				function veryLongFunction() {
					${'  console.log("line");\n'.repeat(55)}
				}
			`;
			const res = await codeHygieneAnalyzer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});
			const text = res.content[0].type === "text" ? res.content[0].text : "";

			// Multiple debug statements (major -12) + complex function (major -12)
			// Score: 100 - 24 = 76 (Good)
			expect(text).toMatch(/Debug Code/);
			expect(text).toMatch(/Code Complexity/);
			expect(text).toMatch(/76\/100|Good/);
		});

		it("should detect commented out code as dead code", async () => {
			const code = `
				const active = true;
				// const oldVar = 1;
				// function oldFunc() { return 2; }
				// const unused = 3;
				// let anotherOne = 4;
			`;
			const res = await codeHygieneAnalyzer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});
			const text = res.content[0].type === "text" ? res.content[0].text : "";

			expect(text).toMatch(/Dead Code/);
			expect(text).toMatch(/commented code/);
		});

		it("should prioritize critical issues in next steps", async () => {
			const code = `
				const secret = 'secret-key-123';
				async function run() {
					await doSomething();
				}
			`;
			const res = await codeHygieneAnalyzer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});
			const text = res.content[0].type === "text" ? res.content[0].text : "";

			expect(text).toMatch(/critical issue\(s\) immediately/i);
		});

		it("should detect Python commented code", async () => {
			const code = `
def main():
    print("active")
# old_var = 1
# def old_func():
#     return 2
# unused = 3
			`;
			const res = await codeHygieneAnalyzer({
				codeContent: code,
				language: "python",
				includeReferences: false,
				includeMetadata: false,
			});
			const text = res.content[0].type === "text" ? res.content[0].text : "";

			expect(text).toMatch(/Dead Code/);
			expect(text).toMatch(/commented code/);
		});

		it("should give excellent score for clean code", async () => {
			const code = `
const add = (a, b) => a + b;
export default add;
			`;
			const res = await codeHygieneAnalyzer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});
			const text = res.content[0].type === "text" ? res.content[0].text : "";

			expect(text).toMatch(/100\/100|Excellent/);
		});

		it("should give poor score for severe issues", async () => {
			const code = `
const apiKey = 'key1';
const password = 'pass1';
const secret = 'secret1';
async function test1() { await fetch('/'); }
async function test2() { await fetch('/'); }
			`;
			const res = await codeHygieneAnalyzer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});
			const text = res.content[0].type === "text" ? res.content[0].text : "";

			// Credentials detected in one match + 2 async without error handling = 2 critical issues
			// Score: 100 - 40 = 60 (Fair)
			expect(text).toMatch(/Fair/);
			expect(text).toMatch(/critical issue\(s\)/);
		});

		it("should show major issues in next steps without critical issues", async () => {
			const code = `
console.log('debug1');
console.log('debug2');
const x = 1;
			`;
			const res = await codeHygieneAnalyzer({
				codeContent: code,
				language: "javascript",
				includeReferences: false,
				includeMetadata: false,
			});
			const text = res.content[0].type === "text" ? res.content[0].text : "";

			expect(text).toMatch(/Fix \d+ major issue\(s\) before merging/);
			expect(text).not.toMatch(/critical issue\(s\) immediately/);
		});
	});

	describe("Guidelines Validator with Lower Base Scores", () => {
		it("should not give good scores for minimal effort", async () => {
			const res = await guidelinesValidator({
				practiceDescription: "We use some patterns",
				category: "architecture",
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";

			// With base 30, this gets at most 30/100 = POOR
			expect(text).toMatch(/POOR|FAIR/);
			expect(text).not.toMatch(/GOOD|EXCELLENT/);
		});

		it("should require comprehensive practices for excellent rating", async () => {
			const res = await guidelinesValidator({
				practiceDescription:
					"We implement modular component architecture with clear separation of concerns and scalable maintainable design",
				category: "architecture",
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";

			// With new scoring, max for architecture is 65 (GOOD), not excellent
			expect(text).toMatch(/GOOD/);
			expect(text).not.toMatch(/EXCELLENT/);
		});

		it("should give poor scores for empty or irrelevant descriptions", async () => {
			const res = await guidelinesValidator({
				practiceDescription: "We do things",
				category: "code-management",
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";

			// Base 30, no keywords matched = 30/100 = POOR
			expect(text).toMatch(/POOR/);
			expect(text).toMatch(/30\/100/);
		});

		it("should require multiple best practices for good rating", async () => {
			const res = await guidelinesValidator({
				practiceDescription:
					"We maintain code hygiene with regular cleanup and refactor legacy code systematically",
				category: "code-management",
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";

			// Base 30 + hygiene 15 + refactor 10 = 55 (FAIR)
			expect(text).toMatch(/FAIR/);
			expect(text).toMatch(/55\/100/);
		});
	});
});
