import { describe, expect, it } from "vitest";
import {
	exportAsCSV,
	exportAsLaTeX,
	objectsToCSV,
} from "../../src/tools/shared/export-utils.js";

describe("Export Utilities", () => {
	describe("exportAsLaTeX", () => {
		it("should generate a valid LaTeX document with title and author", () => {
			const result = exportAsLaTeX({
				title: "Test Document",
				author: "Test Author",
				content: "# Introduction\n\nThis is a test document.",
			});

			expect(result).toContain("\\documentclass[11pt]{article}");
			expect(result).toContain("\\title{Test Document}");
			expect(result).toContain("\\author{Test Author}");
			expect(result).toContain("\\begin{document}");
			expect(result).toContain("\\end{document}");
			expect(result).toContain("\\section{Introduction}");
		});

		it("should escape special LaTeX characters", () => {
			const result = exportAsLaTeX({
				title: "Test & Document #1",
				content: "Testing special characters: $ % & # _",
			});

			expect(result).toContain("Test \\& Document \\#1");
			expect(result).toContain("\\$");
			expect(result).toContain("\\%");
			expect(result).toContain("\\&");
		});

		it("should convert markdown headers to LaTeX sections", () => {
			const result = exportAsLaTeX({
				title: "Test",
				content:
					"# Section 1\n## Subsection 1.1\n### Subsubsection 1.1.1\n\nText content.",
			});

			expect(result).toContain("\\section{Section 1}");
			expect(result).toContain("\\subsection{Subsection 1.1}");
			expect(result).toContain("\\subsubsection{Subsubsection 1.1.1}");
		});

		it("should convert markdown bold and italic to LaTeX", () => {
			const result = exportAsLaTeX({
				title: "Test",
				content: "This is **bold text** and *italic text*.",
			});

			expect(result).toContain("\\textbf{bold text}");
			expect(result).toContain("\\textit{italic text}");
		});

		it("should handle code blocks", () => {
			const result = exportAsLaTeX({
				title: "Test",
				content: "```javascript\nconst x = 1;\n```",
			});

			expect(result).toContain("\\begin{verbatim}");
			expect(result).toContain("const x = 1;");
			expect(result).toContain("\\end{verbatim}");
		});

		it("should support different document classes and font sizes", () => {
			const result = exportAsLaTeX({
				title: "Test",
				content: "Content",
				documentClass: "report",
				fontSize: "12pt",
			});

			expect(result).toContain("\\documentclass[12pt]{report}");
		});
	});

	describe("exportAsCSV", () => {
		it("should generate CSV with headers", () => {
			const result = exportAsCSV({
				headers: ["Name", "Age", "City"],
				rows: [
					["Alice", "30", "New York"],
					["Bob", "25", "London"],
				],
			});

			const lines = result.split("\n");
			expect(lines[0]).toBe("Name,Age,City");
			expect(lines[1]).toBe("Alice,30,New York");
			expect(lines[2]).toBe("Bob,25,London");
		});

		it("should escape fields with special characters", () => {
			const result = exportAsCSV({
				headers: ["Name", "Description"],
				rows: [
					["Test", "This has, a comma"],
					["Quote", 'This has "quotes"'],
				],
			});

			expect(result).toContain('"This has, a comma"');
			expect(result).toContain('"This has ""quotes"""');
		});

		it("should support custom delimiters", () => {
			const result = exportAsCSV({
				headers: ["A", "B", "C"],
				rows: [["1", "2", "3"]],
				delimiter: ";",
			});

			expect(result).toBe("A;B;C\n1;2;3");
		});

		it("should handle multiline fields", () => {
			const result = exportAsCSV({
				headers: ["Name", "Notes"],
				rows: [["Alice", "Line 1\nLine 2"]],
			});

			expect(result).toContain('"Line 1\nLine 2"');
		});

		it("should skip headers when includeHeaders is false", () => {
			const result = exportAsCSV({
				headers: ["Name", "Age"],
				rows: [["Alice", "30"]],
				includeHeaders: false,
			});

			expect(result).toBe("Alice,30");
		});
	});

	describe("objectsToCSV", () => {
		it("should convert array of objects to CSV", () => {
			const data = [
				{ name: "Alice", age: 30, city: "New York" },
				{ name: "Bob", age: 25, city: "London" },
			];

			const result = objectsToCSV(data);

			const lines = result.split("\n");
			expect(lines[0]).toBe("name,age,city");
			expect(lines[1]).toBe("Alice,30,New York");
			expect(lines[2]).toBe("Bob,25,London");
		});

		it("should respect column selection", () => {
			const data = [
				{ name: "Alice", age: 30, city: "New York" },
				{ name: "Bob", age: 25, city: "London" },
			];

			const result = objectsToCSV(data, { columns: ["name", "city"] });

			const lines = result.split("\n");
			expect(lines[0]).toBe("name,city");
			expect(lines[1]).toBe("Alice,New York");
			expect(lines[2]).toBe("Bob,London");
		});

		it("should handle null and undefined values", () => {
			const data = [
				{ name: "Alice", age: null, city: undefined },
				{ name: "Bob", age: 25, city: "London" },
			];

			const result = objectsToCSV(data);

			const lines = result.split("\n");
			expect(lines[1]).toBe("Alice,,");
			expect(lines[2]).toBe("Bob,25,London");
		});

		it("should return empty string for empty array", () => {
			const result = objectsToCSV([]);
			expect(result).toBe("");
		});
	});
});
