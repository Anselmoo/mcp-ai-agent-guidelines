import { describe, expect, it } from "vitest";
import { applyExportFormat } from "../../src/tools/shared/prompt-utils.js";

describe("applyExportFormat", () => {
	const sampleContent = `# Test Document

## Introduction

This is a test document with **bold** and *italic* text.

## Code Example

\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`

## List

- Item 1
- Item 2
- Item 3`;

	describe("Markdown format (default)", () => {
		it("should return content unchanged when format is markdown", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "markdown",
			});

			expect(result).toBe(sampleContent);
		});

		it("should return content unchanged when no options provided", () => {
			const result = applyExportFormat(sampleContent);

			expect(result).toBe(sampleContent);
		});
	});

	describe("Header suppression", () => {
		it("should remove markdown headers when includeHeaders is false", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "markdown",
				includeHeaders: false,
			});

			expect(result).not.toContain("# Test Document");
			expect(result).not.toContain("## Introduction");
			expect(result).not.toContain("## Code Example");
			expect(result).toContain("This is a test document");
		});

		it("should preserve content when includeHeaders is true", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "markdown",
				includeHeaders: true,
			});

			expect(result).toContain("# Test Document");
			expect(result).toContain("## Introduction");
		});
	});

	describe("LaTeX export", () => {
		it("should convert to LaTeX document when format is latex", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "latex",
				documentTitle: "My Document",
				documentAuthor: "Test Author",
			});

			expect(result).toContain("\\documentclass");
			expect(result).toContain("\\begin{document}");
			expect(result).toContain("\\end{document}");
			expect(result).toContain("My Document");
			expect(result).toContain("Test Author");
		});

		it("should convert markdown sections to LaTeX sections", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "latex",
			});

			expect(result).toContain("\\section{Test Document}");
			expect(result).toContain("\\subsection{Introduction}");
		});

		it("should use default title when not provided", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "latex",
			});

			expect(result).toContain("\\title{Document}");
		});
	});

	describe("CSV export", () => {
		it("should convert markdown table to CSV", () => {
			const tableContent = `| Name | Age | City |
|------|-----|------|
| Alice | 30 | NYC |
| Bob | 25 | LA |`;

			const result = applyExportFormat(tableContent, {
				exportFormat: "csv",
			});

			expect(result).toContain("Name,Age,City");
			expect(result).toContain("Alice,30,NYC");
			expect(result).toContain("Bob,25,LA");
		});

		it("should handle content without tables", () => {
			const result = applyExportFormat("Simple text without tables", {
				exportFormat: "csv",
			});

			// Should return the content as a single CSV cell
			expect(result).toBe('"Simple text without tables"');
		});
	});

	describe("JSON export", () => {
		it("should convert to JSON format", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "json",
				documentTitle: "Test Doc",
			});

			const parsed = JSON.parse(result);

			expect(parsed).toHaveProperty("content");
			expect(parsed).toHaveProperty("metadata");
			expect(parsed.metadata.title).toBe("Test Doc");
			expect(parsed.metadata.format).toBe("json");
		});

		it("should include metadata when provided", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "json",
				documentTitle: "My Title",
				documentAuthor: "My Author",
				documentDate: "2025-01-01",
			});

			const parsed = JSON.parse(result);

			expect(parsed.metadata.title).toBe("My Title");
			expect(parsed.metadata.author).toBe("My Author");
			expect(parsed.metadata.date).toBe("2025-01-01");
		});
	});

	describe("Combined options", () => {
		it("should remove headers before converting to LaTeX", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "latex",
				includeHeaders: false,
			});

			expect(result).toContain("\\documentclass");
			expect(result).not.toContain("\\section{Test Document}");
			expect(result).toContain("This is a test document");
		});

		it("should remove headers before converting to JSON", () => {
			const result = applyExportFormat(sampleContent, {
				exportFormat: "json",
				includeHeaders: false,
			});

			const parsed = JSON.parse(result);
			expect(parsed.content).not.toContain("# Test Document");
		});
	});
});
