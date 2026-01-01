import { REFERENCE_DISCLAIMER } from "./constants.js";
import { exportAsCSV, exportAsLaTeX } from "./export-utils.js";
import type { OutputOptions } from "./types/export-format.types.js";
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

// Import MODEL_ALIASES from generated types
import { MODEL_ALIASES } from "../config/generated/index.js";

// Policy: enforce allowed modes/models/tools and normalize casing
const ALLOWED_MODES = new Set(["agent"]);
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
 * Apply export format to content based on output options
 *
 * @param content - The markdown content to export
 * @param options - Output options including format and headers
 * @returns Formatted content according to the specified export format
 */
export function applyExportFormat(
	content: string,
	options?: OutputOptions,
): string {
	// Default to markdown with headers
	if (!options) {
		return content;
	}

	const { exportFormat = "markdown", includeHeaders = true } = options;

	// Remove headers if requested (for chat outputs)
	let processedContent = content;
	if (!includeHeaders) {
		// Remove YAML frontmatter block (lines between --- ... ---)
		// Handle different line endings and spacing variations
		processedContent = processedContent.replace(
			/^---\r?\n[\s\S]*?\r?\n---\r?\n*/m,
			"",
		);

		// Remove markdown headers (lines starting with #)
		processedContent = processedContent
			.split("\n")
			.filter((line) => !line.match(/^#{1,6}\s+/))
			.join("\n")
			.trim();
	}

	// Apply format-specific transformations
	switch (exportFormat) {
		case "latex":
			return exportAsLaTeX({
				title: options.documentTitle || "Document",
				author: options.documentAuthor,
				date: options.documentDate,
				content: processedContent,
			});

		case "csv":
			// For CSV export, we need structured data
			// This is a basic implementation that converts simple markdown tables
			// More complex data should use objectsToCSV from export-utils
			return convertMarkdownTableToCSV(processedContent);

		case "json":
			// Return content as JSON string
			return JSON.stringify(
				{
					content: processedContent,
					metadata: {
						title: options.documentTitle,
						author: options.documentAuthor,
						date: options.documentDate,
						format: "json",
					},
				},
				null,
				2,
			);

		default:
			return processedContent;
	}
}

/**
 * Convert a simple markdown table to CSV format
 * This is a basic implementation for simple use cases
 */
function convertMarkdownTableToCSV(markdown: string): string {
	const lines = markdown.split("\n");
	const tableLines: string[] = [];

	// Find table lines (lines containing |)
	for (const line of lines) {
		if (line.includes("|")) {
			// Skip separator lines (e.g., |---|---|)
			if (!line.match(/^\|[\s-:|]+\|$/)) {
				tableLines.push(line);
			}
		}
	}

	if (tableLines.length === 0) {
		// No table found, return simple CSV with content as single cell
		return `"${markdown.replace(/"/g, '""')}"`;
	}

	// Parse table rows
	const rows = tableLines.map((line) =>
		line
			.split("|")
			.map((cell) => cell.trim())
			.filter((cell) => cell !== ""),
	);

	return exportAsCSV({
		headers: rows[0] || [],
		rows: rows.slice(1),
		includeHeaders: true,
	});
}

/**
 * Section builder definition for buildOptionalSections
 */
export interface SectionBuilder<T extends Record<string, unknown>> {
	/** Config key to check (e.g., 'includeMetadata') */
	key: keyof T;
	/** Function to build the section when key is truthy */
	builder: (config: T) => string;
}

/**
 * Build optional sections based on config flags.
 * Reduces repetitive conditional logic like:
 *   const metadata = config.includeMetadata ? buildMetadata(config) : "";
 *
 * @example
 * const sections = buildOptionalSections(config, [
 *   { key: 'includeMetadata', builder: (c) => buildMetadata(c) },
 *   { key: 'includeReferences', builder: (c) => buildReferences(c) }
 * ]);
 */
export function buildOptionalSections<T extends Record<string, unknown>>(
	config: T,
	sectionMap: Array<SectionBuilder<T>>,
): string[] {
	return sectionMap
		.filter(({ key }) => config[key])
		.map(({ builder }) => builder(config));
}

/**
 * Build optional sections as an object with named keys.
 * Similar to buildOptionalSections but returns an object instead of array,
 * making it safer for destructuring with specific section names.
 *
 * @example
 * const { metadata, references } = buildOptionalSectionsMap(config, {
 *   metadata: { key: 'includeMetadata', builder: (c) => buildMetadata(c) },
 *   references: { key: 'includeReferences', builder: (c) => buildReferences(c) }
 * });
 */
export function buildOptionalSectionsMap<
	T extends Record<string, unknown>,
	K extends string,
>(config: T, sectionMap: Record<K, SectionBuilder<T>>): Record<K, string> {
	const result = {} as Record<K, string>;
	for (const [name, builder] of Object.entries(sectionMap) as Array<
		[K, SectionBuilder<T>]
	>) {
		result[name] = config[builder.key] ? builder.builder(config) : "";
	}
	return result;
}
