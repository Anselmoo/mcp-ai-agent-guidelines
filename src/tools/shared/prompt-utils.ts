import { REFERENCE_DISCLAIMER } from "./constants.js";
import type { FrontmatterOptions } from "./types/index.js";

export type { FrontmatterOptions };

/**
 * Escape a string value for safe use in YAML frontmatter.
 * Handles special YAML characters, multiline strings, and YAML terminators.
 */
export function escapeYamlValue(value: string): string {
	// Handle empty strings
	if (!value) return "''";

	// Check if the value contains characters that need escaping
	const needsEscaping =
		value.includes("'") ||
		value.includes('"') ||
		value.includes("\n") ||
		value.includes("\r") ||
		value.includes("---") ||
		value.includes(":") ||
		value.includes("[") ||
		value.includes("]") ||
		value.includes("{") ||
		value.includes("}") ||
		value.includes("#") ||
		value.includes("&") ||
		value.includes("*") ||
		value.includes("!") ||
		value.includes("|") ||
		value.includes(">") ||
		value.includes("@") ||
		value.includes("`") ||
		value.trim() !== value; // Leading/trailing whitespace

	if (!needsEscaping) {
		return `'${value}'`;
	}

	// For multiline strings or strings with YAML terminators, use literal block scalar
	if (value.includes("\n") || value.includes("---")) {
		// Use literal block scalar (|) for multiline strings
		// Indent each line by 2 spaces
		const lines = value.split("\n");
		return `|\n  ${lines.join("\n  ")}`;
	}

	// For single-line strings with quotes, escape single quotes by doubling them
	return `'${value.replace(/'/g, "''")}'`;
}

export function slugify(text: string, maxLength = 80): string {
	const slug = text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	// Truncate to maxLength if necessary
	return slug.length > maxLength ? slug.slice(0, maxLength) : slug;
}

export function buildFrontmatter({
	mode,
	model,
	tools,
	description,
}: FrontmatterOptions): string {
	const lines: string[] = ["---"];
	if (mode) lines.push(`mode: ${escapeYamlValue(mode)}`);
	if (model) lines.push(`model: ${model}`);
	if (tools?.length)
		lines.push(`tools: [${tools.map((t) => escapeYamlValue(t)).join(", ")}]`);

	// Escape and add description
	lines.push(`description: ${escapeYamlValue(description)}`);

	lines.push("---");
	return lines.join("\n");
}

// Policy: enforce allowed modes/models/tools and normalize casing
const ALLOWED_MODES = new Set(["agent"]);
const MODEL_ALIASES: Record<string, string> = {
	// Latest models
	"gpt-4o": "GPT-4o",
	"gpt-4o-mini": "GPT-4o-mini",
	"o1-preview": "o1-preview",
	"o1-mini": "o1-mini",
	"o3-mini": "o3-mini",
	"claude-3.5-sonnet": "Claude-3.5-Sonnet",
	"claude-3.5-haiku": "Claude-3.5-Haiku",
	"gemini-1.5-pro": "Gemini-1.5-Pro",
	"gemini-2.0-flash": "Gemini-2.0-Flash",
	// Legacy aliases for backward compatibility
	"gpt-4.1": "GPT-4o",
	"gpt-5": "o1-preview",
	"claude-4": "Claude-3.5-Sonnet",
	"claude-3.7": "Claude-3.5-Sonnet",
	"gemini-2.5": "Gemini-2.0-Flash",
	"o4-mini": "o1-mini",
};
const ALLOWED_TOOLS = new Set(["githubRepo", "codebase", "editFiles"]);

export function validateAndNormalizeFrontmatter(
	opts: FrontmatterOptions,
): FrontmatterOptions & { comments?: string[] } {
	const comments: string[] = [];
	// Mode
	let mode = opts.mode;
	if (mode && !ALLOWED_MODES.has(mode)) {
		comments.push(`# Note: Unrecognized mode '${mode}', defaulting to 'agent'`);
		mode = "agent";
	}
	// Model normalization
	let model = opts.model;
	if (model) {
		const key = model.toLowerCase();
		model = MODEL_ALIASES[key] || model;
		if (!MODEL_ALIASES[key] && !Object.values(MODEL_ALIASES).includes(model)) {
			comments.push(`# Note: Unrecognized model '${opts.model}'.`);
		}
	}
	// Tools filtering
	let tools = opts.tools;
	if (tools?.length) {
		const unknown = tools.filter((t) => !ALLOWED_TOOLS.has(t));
		tools = tools.filter((t) => ALLOWED_TOOLS.has(t));
		if (unknown.length) {
			comments.push(`# Note: Dropped unknown tools: ${unknown.join(", ")}`);
		}
	}
	return {
		...opts,
		mode,
		model,
		tools,
		comments: comments.length ? comments : undefined,
	};
}

export function buildFrontmatterWithPolicy(opts: FrontmatterOptions): string {
	const normalized = validateAndNormalizeFrontmatter(opts);
	const fm = buildFrontmatter(normalized);
	if (!normalized.comments?.length) return fm;
	// Insert comments after the starting '---' for visibility
	const lines = fm.split("\n");
	lines.splice(1, 0, ...normalized.comments);
	return lines.join("\n");
}

export function buildMetadataSection(opts: {
	sourceTool: string;
	inputFile?: string;
	filenameHint?: string;
	updatedDate?: Date;
}): string {
	const updated = (opts.updatedDate || new Date()).toISOString().slice(0, 10);
	const lines: string[] = [
		"### Metadata",
		`- Updated: ${updated}`,
		`- Source tool: ${opts.sourceTool}`,
	];
	if (opts.inputFile) lines.push(`- Input file: ${opts.inputFile}`);
	if (opts.filenameHint)
		lines.push(`- Suggested filename: ${opts.filenameHint}`);
	lines.push("");
	return lines.join("\n");
}

/**
 * Builds a "Further Reading" section with a disclaimer about external references.
 *
 * The disclaimer clarifies that:
 * - References are provided for informational purposes only
 * - No endorsement or affiliation is implied
 * - Information may change over time
 * - Users should verify with official sources
 *
 * This approach follows open-source best practices for referencing external resources
 * without creating legal liability or implying endorsement.
 */
export function buildFurtherReadingSection(
	refs: Array<{ title: string; url: string; description?: string } | string>,
): string {
	if (!refs || refs.length === 0) return "";
	const lines: string[] = [
		"## Further Reading",
		"",
		REFERENCE_DISCLAIMER,
		"",
		...refs.map((r) => {
			if (typeof r === "string") {
				// Legacy format: "Title: URL"
				return `- ${r}`;
			}
			// New format: object with title, url, and optional description
			const link = `**[${r.title}](${r.url})**`;
			return r.description ? `- ${link}: ${r.description}` : `- ${link}`;
		}),
		"",
		"",
	];
	return lines.join("\n");
}

/**
 * Escape special LaTeX characters in a string.
 * Handles: \ { } $ & # ^ _ % ~
 */
export function escapeLatex(text: string): string {
	// Replace backslashes first, but use a placeholder to avoid double-escaping
	let result = text.replace(/\\/g, "BACKSLASHPLACEHOLDER");

	// Replace other special characters
	result = result
		.replace(/\{/g, "\\{")
		.replace(/\}/g, "\\}")
		.replace(/\$/g, "\\$")
		.replace(/&/g, "\\&")
		.replace(/#/g, "\\#")
		.replace(/\^/g, "\\textasciicircum{}")
		.replace(/_/g, "\\_")
		.replace(/%/g, "\\%")
		.replace(/~/g, "\\textasciitilde{}")
		// Finally replace the placeholder with the escaped backslash
		.replace(/BACKSLASHPLACEHOLDER/g, "\\textbackslash{}");

	return result;
}

/**
 * Build a LaTeX-formatted section without GitHub-specific headers.
 * Optimized for inline use in chat contexts.
 */
export function buildLatexSection(
	title: string,
	content: string,
	level = 1,
): string {
	const sectionCmd =
		level === 1 ? "section" : level === 2 ? "subsection" : "subsubsection";
	return `\\${sectionCmd}{${escapeLatex(title)}}\n${content}\n`;
}

/**
 * Convert markdown-style content to LaTeX format.
 * Handles basic markdown formatting: headers, lists, code blocks.
 */
export function markdownToLatex(markdown: string): string {
	let latex = markdown;

	// Replace code blocks
	latex = latex.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
		return `\\begin{verbatim}\n${code}\\end{verbatim}`;
	});

	// Replace inline code
	latex = latex.replace(/`([^`]+)`/g, (_, code) => {
		return `\\texttt{${escapeLatex(code)}}`;
	});

	// Replace headers (### -> \subsubsection, ## -> \subsection, # -> \section)
	latex = latex.replace(/^### (.+)$/gm, (_, title) => {
		return `\\subsubsection{${escapeLatex(title)}}`;
	});
	latex = latex.replace(/^## (.+)$/gm, (_, title) => {
		return `\\subsection{${escapeLatex(title)}}`;
	});
	latex = latex.replace(/^# (.+)$/gm, (_, title) => {
		return `\\section{${escapeLatex(title)}}`;
	});

	// Replace bold
	latex = latex.replace(/\*\*([^*]+)\*\*/g, (_, text) => {
		return `\\textbf{${escapeLatex(text)}}`;
	});

	// Replace italic
	latex = latex.replace(/\*([^*]+)\*/g, (_, text) => {
		return `\\textit{${escapeLatex(text)}}`;
	});

	// Replace unordered lists
	latex = latex.replace(/^- (.+)$/gm, (_, item) => {
		return `\\item ${item}`;
	});

	// Wrap consecutive \item lines in itemize environment
	latex = latex.replace(/(\\item .+\n)+/g, (match) => {
		return `\\begin{itemize}\n${match}\\end{itemize}\n`;
	});

	// Replace numbered lists
	latex = latex.replace(/^\d+\. (.+)$/gm, (_, item) => {
		return `\\item ${item}`;
	});

	// Wrap consecutive numbered \item lines in enumerate environment
	// This is a simplified approach - may need refinement

	return latex;
}
