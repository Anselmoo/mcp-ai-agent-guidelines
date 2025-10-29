import { describe, expect, it } from "vitest";
import {
	buildLatexSection,
	escapeLatex,
	markdownToLatex,
} from "../../src/tools/shared/prompt-utils.js";

describe("LaTeX utilities", () => {
	describe("escapeLatex", () => {
		it("should escape backslashes", () => {
			expect(escapeLatex("test\\value")).toBe("test\\textbackslash{}value");
		});

		it("should escape curly braces", () => {
			expect(escapeLatex("test{value}")).toBe("test\\{value\\}");
		});

		it("should escape dollar signs", () => {
			expect(escapeLatex("test$value")).toBe("test\\$value");
		});

		it("should escape ampersands", () => {
			expect(escapeLatex("test&value")).toBe("test\\&value");
		});

		it("should escape hash symbols", () => {
			expect(escapeLatex("test#value")).toBe("test\\#value");
		});

		it("should escape underscores", () => {
			expect(escapeLatex("test_value")).toBe("test\\_value");
		});

		it("should escape percent signs", () => {
			expect(escapeLatex("test%value")).toBe("test\\%value");
		});

		it("should escape multiple special characters", () => {
			const input = "Test: $100 & 50% of {data}_items #1";
			const expected = "Test: \\$100 \\& 50\\% of \\{data\\}\\_items \\#1";
			expect(escapeLatex(input)).toBe(expected);
		});

		it("should handle empty strings", () => {
			expect(escapeLatex("")).toBe("");
		});

		it("should handle strings with no special characters", () => {
			expect(escapeLatex("simple text")).toBe("simple text");
		});
	});

	describe("buildLatexSection", () => {
		it("should create a section with level 1", () => {
			const result = buildLatexSection("Introduction", "Content here", 1);
			expect(result).toBe("\\section{Introduction}\nContent here\n");
		});

		it("should create a subsection with level 2", () => {
			const result = buildLatexSection("Details", "Subsection content", 2);
			expect(result).toBe("\\subsection{Details}\nSubsection content\n");
		});

		it("should create a subsubsection with level 3", () => {
			const result = buildLatexSection("Notes", "Deep content", 3);
			expect(result).toBe("\\subsubsection{Notes}\nDeep content\n");
		});

		it("should escape special characters in titles", () => {
			const result = buildLatexSection("Test & Debug #1", "Content", 1);
			expect(result).toBe("\\section{Test \\& Debug \\#1}\nContent\n");
		});

		it("should default to section level when not specified", () => {
			const result = buildLatexSection("Default", "Content");
			expect(result).toBe("\\section{Default}\nContent\n");
		});
	});

	describe("markdownToLatex", () => {
		it("should convert headers to LaTeX sections", () => {
			const markdown = "# Main Title\n## Subtitle\n### Sub-subtitle";
			const result = markdownToLatex(markdown);
			expect(result).toContain("\\section{Main Title}");
			expect(result).toContain("\\subsection{Subtitle}");
			expect(result).toContain("\\subsubsection{Sub-subtitle}");
		});

		it("should convert inline code", () => {
			const markdown = "Use the `console.log()` function";
			const result = markdownToLatex(markdown);
			expect(result).toContain("\\texttt{console.log()}");
		});

		it("should convert code blocks to verbatim", () => {
			const markdown = "```javascript\nconst x = 1;\n```";
			const result = markdownToLatex(markdown);
			expect(result).toContain("\\begin{verbatim}");
			expect(result).toContain("const x = 1;");
			expect(result).toContain("\\end{verbatim}");
		});

		it("should convert bold text", () => {
			const markdown = "This is **bold** text";
			const result = markdownToLatex(markdown);
			expect(result).toContain("\\textbf{bold}");
		});

		it("should convert italic text", () => {
			const markdown = "This is *italic* text";
			const result = markdownToLatex(markdown);
			expect(result).toContain("\\textit{italic}");
		});

		it("should convert unordered lists", () => {
			const markdown = "- Item 1\n- Item 2\n- Item 3";
			const result = markdownToLatex(markdown);
			expect(result).toContain("\\begin{itemize}");
			expect(result).toContain("\\item Item 1");
			expect(result).toContain("\\item Item 2");
			expect(result).toContain("\\item Item 3");
			expect(result).toContain("\\end{itemize}");
		});

		it("should handle complex markdown", () => {
			const markdown = `# Introduction
This is **important** text.

## Code Example
Use \`const x = 1\` for variables.

- Point 1
- Point 2`;

			const result = markdownToLatex(markdown);
			expect(result).toContain("\\section{Introduction}");
			expect(result).toContain("\\textbf{important}");
			expect(result).toContain("\\subsection{Code Example}");
			expect(result).toContain("\\texttt{const x = 1}");
			expect(result).toContain("\\begin{itemize}");
		});

		it("should preserve plain text", () => {
			const markdown = "Just plain text without formatting";
			const result = markdownToLatex(markdown);
			expect(result).toContain("Just plain text without formatting");
		});
	});
});
