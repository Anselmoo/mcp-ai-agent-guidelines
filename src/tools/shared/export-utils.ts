/**
 * Export utilities for converting markdown and structured data to various formats
 */

/**
 * Escape special LaTeX characters in text, but preserve markdown formatting
 * This is used after markdown conversion to escape remaining special chars
 */
function escapeLatexSpecialChars(text: string): string {
	// Only escape characters that would cause LaTeX errors
	// but preserve already-converted LaTeX commands
	if (text.startsWith("\\")) {
		// This is likely a LaTeX command, don't escape it
		return text;
	}

	return text
		.replace(/([&%$#_])/g, "\\$1")
		.replace(/\^/g, "\\textasciicircum{}")
		.replace(/~/g, "\\textasciitilde{}");
}

/**
 * Convert markdown text to LaTeX
 */
function markdownToLaTeX(markdown: string): string {
	let latex = markdown;

	// First, protect code blocks by replacing them with placeholders
	// Using a unique string that's unlikely to appear in normal text
	const codeBlocks: string[] = [];
	const PLACEHOLDER_PREFIX = "___CODEBLOCK_";
	const PLACEHOLDER_SUFFIX = "___";

	latex = latex.replace(/```(\w+)?\n([\s\S]+?)```/g, (_match, _lang, code) => {
		const index = codeBlocks.length;
		codeBlocks.push(code.trim());
		return `${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`;
	});

	// Convert headers
	latex = latex.replace(/^### (.+)$/gm, (_match, title) => {
		return `\\subsubsection{${escapeLatexSpecialChars(title)}}`;
	});
	latex = latex.replace(/^## (.+)$/gm, (_match, title) => {
		return `\\subsection{${escapeLatexSpecialChars(title)}}`;
	});
	latex = latex.replace(/^# (.+)$/gm, (_match, title) => {
		return `\\section{${escapeLatexSpecialChars(title)}}`;
	});

	// Convert bold
	latex = latex.replace(/\*\*(.+?)\*\*/g, (_match, text) => {
		return `\\textbf{${escapeLatexSpecialChars(text)}}`;
	});

	// Convert italic (but after bold to avoid conflicts)
	latex = latex.replace(/\*(.+?)\*/g, (_match, text) => {
		return `\\textit{${escapeLatexSpecialChars(text)}}`;
	});

	// Convert inline code
	latex = latex.replace(/`(.+?)`/g, (_match, code) => {
		return `\\texttt{${code}}`;
	});

	// Convert unordered lists
	latex = latex.replace(/^(\s*)[-*]\s+(.+)$/gm, (_match, indent, item) => {
		const depth = indent.length / 2;
		const escapedItem = escapeLatexSpecialChars(item);
		if (depth === 0) {
			return `\\item ${escapedItem}`;
		}
		return `${"  ".repeat(depth)}\\item ${escapedItem}`;
	});

	// Convert ordered lists
	latex = latex.replace(/^\d+\.\s+(.+)$/gm, (_match, item) => {
		return `\\item ${escapeLatexSpecialChars(item)}`;
	});

	// Wrap list items in itemize/enumerate environments
	latex = latex.replace(
		/((?:^\\item .+$\n?)+)/gm,
		"\\begin{itemize}\n$1\\end{itemize}\n",
	);

	// Escape special chars in regular text (lines not starting with \ or containing placeholders)
	latex = latex
		.split("\n")
		.map((line) => {
			// Skip lines that are LaTeX commands, empty, or contain placeholders
			if (
				line.trim() === "" ||
				line.trim().startsWith("\\") ||
				line.includes(PLACEHOLDER_PREFIX)
			) {
				return line;
			}
			// Escape special characters in regular text
			return escapeLatexSpecialChars(line);
		})
		.join("\n");

	// Restore code blocks with proper verbatim environment
	// Escape the underscores in the pattern for regex
	const placeholderRegex = new RegExp(
		`${PLACEHOLDER_PREFIX.replace(/_/g, "\\_")}(\\d+)${PLACEHOLDER_SUFFIX.replace(/_/g, "\\_")}`,
		"g",
	);
	latex = latex.replace(placeholderRegex, (_match, index) => {
		const code = codeBlocks[Number.parseInt(index, 10)];
		return `\\begin{verbatim}\n${code}\n\\end{verbatim}`;
	});

	return latex;
}

/**
 * Options for LaTeX export
 */
export interface LaTeXExportOptions {
	title?: string;
	author?: string;
	date?: string;
	content: string;
	documentClass?: "article" | "report" | "book";
	fontSize?: "10pt" | "11pt" | "12pt";
}

/**
 * Export content as a full LaTeX document
 */
export function exportAsLaTeX(options: LaTeXExportOptions): string {
	const {
		title = "Document",
		author = "",
		date = "\\today",
		content,
		documentClass = "article",
		fontSize = "11pt",
	} = options;

	// Escape special characters in metadata using the same function
	const escapedTitle = escapeLatexSpecialChars(title);
	const escapedAuthor = author ? escapeLatexSpecialChars(author) : "";

	// Convert markdown content to LaTeX
	const latexContent = markdownToLaTeX(content);

	// Build the complete LaTeX document
	const lines: string[] = [
		`\\documentclass[${fontSize}]{${documentClass}}`,
		"",
		"% Packages",
		"\\usepackage[utf8]{inputenc}",
		"\\usepackage[T1]{fontenc}",
		"\\usepackage{graphicx}",
		"\\usepackage{amsmath}",
		"\\usepackage{hyperref}",
		"\\usepackage{listings}",
		"\\usepackage{xcolor}",
		"",
		"% Listings configuration for code blocks",
		"\\lstset{",
		"  basicstyle=\\ttfamily\\small,",
		"  breaklines=true,",
		"  frame=single,",
		"  backgroundcolor=\\color{gray!10}",
		"}",
		"",
		"% Metadata",
		`\\title{${escapedTitle}}`,
	];

	if (escapedAuthor) {
		lines.push(`\\author{${escapedAuthor}}`);
	}

	lines.push(`\\date{${date}}`, "", "\\begin{document}", "", "\\maketitle", "");

	// Add content
	lines.push(latexContent);

	// Close document
	lines.push("", "\\end{document}");

	return lines.join("\n");
}

/**
 * Options for CSV export
 */
export interface CSVExportOptions {
	headers: string[];
	rows: string[][];
	delimiter?: string;
	includeHeaders?: boolean;
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: string, delimiter = ","): string {
	// If the value contains delimiter, quotes, or newlines, it must be quoted
	if (
		value.includes(delimiter) ||
		value.includes('"') ||
		value.includes("\n") ||
		value.includes("\r")
	) {
		// Escape quotes by doubling them
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

/**
 * Export data as CSV
 */
export function exportAsCSV(options: CSVExportOptions): string {
	const { headers, rows, delimiter = ",", includeHeaders = true } = options;

	const lines: string[] = [];

	// Add headers if requested
	if (includeHeaders) {
		lines.push(headers.map((h) => escapeCSV(h, delimiter)).join(delimiter));
	}

	// Add data rows
	for (const row of rows) {
		lines.push(row.map((cell) => escapeCSV(cell, delimiter)).join(delimiter));
	}

	return lines.join("\n");
}

/**
 * Convert structured data to CSV-compatible format
 * This is a helper for converting objects to row format
 */
export function objectsToCSV<T extends Record<string, unknown>>(
	objects: T[],
	options?: {
		columns?: (keyof T)[];
		delimiter?: string;
	},
): string {
	if (objects.length === 0) {
		return "";
	}

	const columns = options?.columns || (Object.keys(objects[0]) as (keyof T)[]);
	const headers = columns.map((c) => String(c));

	const rows = objects.map((obj) =>
		columns.map((col) => {
			const value = obj[col];
			return value === null || value === undefined ? "" : String(value);
		}),
	);

	return exportAsCSV({
		headers,
		rows,
		delimiter: options?.delimiter,
		includeHeaders: true,
	});
}
