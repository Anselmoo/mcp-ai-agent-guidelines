import { describe, expect, it } from "vitest";
import {
	exportAsCSV,
	exportAsLaTeX,
	objectsToCSV,
} from "../../../../src/tools/shared/export-utils.js";

/**
 * Test suite for export format utilities.
 *
 * This tests the LaTeX and CSV export functionality that enables
 * users to export outputs in different formats for various use cases.
 */
describe("Export Format Utilities", () => {
	describe("LaTeX Export", () => {
		it("should export basic content as LaTeX document", () => {
			const latex = exportAsLaTeX({
				title: "Test Document",
				author: "Test Author",
				content:
					"# Introduction\n\nThis is a test.\n\n## Section 1\n\nSome content here.",
			});

			// Should have document structure
			expect(latex).toContain("\\documentclass");
			expect(latex).toContain("\\begin{document}");
			expect(latex).toContain("\\end{document}");

			// Should have metadata
			expect(latex).toContain("\\title{Test Document}");
			expect(latex).toContain("\\author{Test Author}");
			expect(latex).toContain("\\maketitle");

			// Should convert markdown headings to LaTeX sections
			expect(latex).toContain("\\section{Introduction}");
			expect(latex).toContain("\\subsection{Section 1}");
		});

		it("should handle code blocks", () => {
			const latex = exportAsLaTeX({
				title: "Code Example",
				content:
					"Here is some code:\n\n```javascript\nconst x = 42;\nconsole.log(x);\n```",
			});

			// Should use verbatim environment for code blocks
			expect(latex).toContain("\\begin{verbatim}");
			expect(latex).toContain("const x = 42;");
			expect(latex).toContain("\\end{verbatim}");
		});

		it("should escape special LaTeX characters", () => {
			const latex = exportAsLaTeX({
				title: "Special Characters",
				content: "Text with special chars: & % $ # _",
			});

			// Should escape special characters
			expect(latex).toContain("\\&");
			expect(latex).toContain("\\%");
			expect(latex).toContain("\\$");
			expect(latex).toContain("\\#");
			expect(latex).toContain("\\_");
		});

		it("should convert markdown bold and italic", () => {
			const latex = exportAsLaTeX({
				title: "Formatting Test",
				content: "This is **bold** and this is *italic*.",
			});

			// Should convert markdown formatting to LaTeX commands
			expect(latex).toContain("\\textbf{bold}");
			expect(latex).toContain("\\textit{italic}");
		});

		it("should convert inline code", () => {
			const latex = exportAsLaTeX({
				title: "Inline Code Test",
				content: "Use the `foo()` function.",
			});

			// Should use texttt for inline code
			expect(latex).toContain("\\texttt{foo()}");
		});

		it("should use custom document class and font size", () => {
			const latex = exportAsLaTeX({
				title: "Custom Options",
				content: "Test content",
				documentClass: "report",
				fontSize: "12pt",
			});

			expect(latex).toContain("\\documentclass[12pt]{report}");
		});
	});

	describe("CSV Export", () => {
		it("should export basic CSV", () => {
			const csv = exportAsCSV({
				headers: ["Name", "Age", "City"],
				rows: [
					["Alice", "30", "New York"],
					["Bob", "25", "Los Angeles"],
				],
			});

			const lines = csv.split("\n");

			// Should have header
			expect(lines[0]).toBe("Name,Age,City");

			// Should have data rows
			expect(lines[1]).toBe("Alice,30,New York");
			expect(lines[2]).toBe("Bob,25,Los Angeles");
		});

		it("should escape values with delimiters", () => {
			const csv = exportAsCSV({
				headers: ["Name", "Description"],
				rows: [["Alice", "Lives in New York, USA"]],
			});

			// Should quote values with commas
			expect(csv).toContain('"Lives in New York, USA"');
		});

		it("should escape values with quotes", () => {
			const csv = exportAsCSV({
				headers: ["Name", "Quote"],
				rows: [["Alice", 'She said "Hello"']],
			});

			// Should double internal quotes
			expect(csv).toContain('"She said ""Hello"""');
		});

		it("should support custom delimiters", () => {
			const csv = exportAsCSV({
				headers: ["Name", "Age"],
				rows: [["Alice", "30"]],
				delimiter: ";",
			});

			expect(csv).toContain("Name;Age");
			expect(csv).toContain("Alice;30");
		});

		it("should allow suppressing headers", () => {
			const csv = exportAsCSV({
				headers: ["Name", "Age"],
				rows: [["Alice", "30"]],
				includeHeaders: false,
			});

			// Should not include headers
			expect(csv).not.toContain("Name,Age");
			expect(csv).toBe("Alice,30");
		});
	});

	describe("Objects to CSV", () => {
		it("should convert array of objects to CSV", () => {
			const data = [
				{ name: "Alice", age: 30, city: "New York" },
				{ name: "Bob", age: 25, city: "Los Angeles" },
			];

			const csv = objectsToCSV(data);

			const lines = csv.split("\n");

			// Should have headers from object keys
			expect(lines[0]).toBe("name,age,city");

			// Should have data
			expect(lines[1]).toBe("Alice,30,New York");
			expect(lines[2]).toBe("Bob,25,Los Angeles");
		});

		it("should support custom column selection", () => {
			const data = [
				{ name: "Alice", age: 30, city: "New York", country: "USA" },
				{ name: "Bob", age: 25, city: "Los Angeles", country: "USA" },
			];

			const csv = objectsToCSV(data, {
				columns: ["name", "city"],
			});

			const lines = csv.split("\n");

			// Should only have selected columns
			expect(lines[0]).toBe("name,city");
			expect(lines[1]).toBe("Alice,New York");
			expect(lines[2]).toBe("Bob,Los Angeles");
		});

		it("should handle null and undefined values", () => {
			const data = [{ name: "Alice", age: null, city: undefined }];

			const csv = objectsToCSV(data);

			// Should convert null/undefined to empty strings
			expect(csv).toContain("Alice,,");
		});

		it("should handle empty array", () => {
			const csv = objectsToCSV([]);

			// Should return empty string for empty array
			expect(csv).toBe("");
		});
	});

	describe("Integration with applyExportFormat", () => {
		it("should be used by prompt builders for LaTeX export", async () => {
			const { hierarchicalPromptBuilder } = await import(
				"../../../../src/tools/prompt/hierarchical-prompt-builder.js"
			);

			const result = await hierarchicalPromptBuilder({
				context: "Test context",
				goal: "Test LaTeX export",
				exportFormat: "latex",
				documentTitle: "Test Document",
				documentAuthor: "Test Author",
				includeFrontmatter: false,
				includeMetadata: false,
			});

			const text = result.content[0].text;

			// Should be a LaTeX document
			expect(text).toContain("\\documentclass");
			expect(text).toContain("\\begin{document}");
			expect(text).toContain("\\end{document}");
			expect(text).toContain("\\title{Test Document}");
			expect(text).toContain("\\author{Test Author}");
		});
	});
});
