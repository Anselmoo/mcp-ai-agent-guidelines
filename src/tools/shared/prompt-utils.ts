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
	"gpt-4.1": "GPT-4.1",
	"claude-4": "Claude-4",
	"gemini-2.5": "Gemini-2.5",
	"o4-mini": "o4-mini",
	"o3-mini": "o3-mini",
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

export function buildReferencesSection(refs: string[]): string {
	if (!refs || refs.length === 0) return "";
	const lines: string[] = [
		"## References",
		...refs.map((r) => `- ${r}`),
		"",
		"",
	];
	return lines.join("\n");
}
