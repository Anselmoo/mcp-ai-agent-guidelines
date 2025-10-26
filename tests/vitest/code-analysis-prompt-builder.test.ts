import { describe, expect, it } from "vitest";
import { codeAnalysisPromptBuilder } from "../../src/tools/prompt/code-analysis-prompt-builder.js";

describe("code-analysis-prompt-builder", () => {
	it("should generate a code analysis prompt with security focus", async () => {
		const result = await codeAnalysisPromptBuilder({
			codebase:
				"function login(user, pass) { return db.query('SELECT * FROM users WHERE user=' + user); }",
			focusArea: "security",
			language: "javascript",
			includeReferences: true,
		});

		const text = result.content[0].text;

		// Check for basic structure
		expect(text).toContain("Code Analysis Prompt");
		expect(text).toContain("Code Analysis Request");

		// Check for security focus
		expect(text).toContain("security");
		expect(text).toContain("Security Analysis");

		// Check for code inclusion
		expect(text).toContain("```javascript");
		expect(text).toContain("function login");

		// Check for analysis sections
		expect(text).toContain("Code Quality Assessment");
		expect(text).toContain("Best Practices Compliance");
		expect(text).toContain("Output Format");
		expect(text).toContain("Scoring");

		// Check for references when included
		expect(text).toContain("References");
	});

	it("should generate a code analysis prompt with performance focus", async () => {
		const result = await codeAnalysisPromptBuilder({
			codebase:
				"for (let i = 0; i < array.length; i++) { processItem(array[i]); }",
			focusArea: "performance",
			language: "typescript",
		});

		const text = result.content[0].text;

		expect(text).toContain("performance");
		expect(text).toContain("Performance Analysis");
		expect(text).toContain("performance bottlenecks");
		expect(text).toContain("algorithm complexity");
	});

	it("should generate a code analysis prompt with maintainability focus", async () => {
		const result = await codeAnalysisPromptBuilder({
			codebase: "class DataProcessor { process() { /* complex logic */ } }",
			focusArea: "maintainability",
			language: "python",
		});

		const text = result.content[0].text;

		expect(text).toContain("maintainability");
		expect(text).toContain("Maintainability Analysis");
		expect(text).toContain("code maintainability");
		expect(text).toContain("technical debt");
	});

	it("should generate a general code analysis prompt", async () => {
		const result = await codeAnalysisPromptBuilder({
			codebase:
				"def calculate_total(items): return sum(item.price for item in items)",
			focusArea: "general",
		});

		const text = result.content[0].text;

		expect(text).toContain("Code Analysis Request");
		expect(text).toContain("General");
		expect(text).toContain("Code Quality Assessment");
	});

	it("should handle auto-detect language", async () => {
		const result = await codeAnalysisPromptBuilder({
			codebase: "const add = (a, b) => a + b;",
		});

		const text = result.content[0].text;

		expect(text).toContain("auto-detect");
	});

	it("should respect includeMetadata flag", async () => {
		const result = await codeAnalysisPromptBuilder({
			codebase: "test code",
			includeMetadata: false,
		});

		const text = result.content[0].text;

		// Should not contain metadata markers
		expect(text).not.toMatch(/\*\*Source Tool\*\*/);
	});

	it("should respect includeFrontmatter flag", async () => {
		const result = await codeAnalysisPromptBuilder({
			codebase: "test code",
			includeFrontmatter: false,
			forcePromptMdStyle: false,
		});

		const text = result.content[0].text;

		// Should not start with YAML frontmatter
		expect(text).not.toMatch(/^---/);
	});

	it("should include all required analysis sections", async () => {
		const result = await codeAnalysisPromptBuilder({
			codebase: "sample code",
			focusArea: "security",
		});

		const text = result.content[0].text;

		expect(text).toContain("Code Quality Assessment");
		expect(text).toContain("Readability and maintainability");
		expect(text).toContain("Code structure and organization");
		expect(text).toContain("Best Practices Compliance");
		expect(text).toContain("Output Format");
		expect(text).toContain("Summary");
		expect(text).toContain("Issues Found");
		expect(text).toContain("Recommendations");
		expect(text).toContain("Scoring");
	});
});
