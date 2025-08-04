import { z } from "zod";

const HierarchicalPromptSchema = z.object({
	context: z.string(),
	goal: z.string(),
	requirements: z.array(z.string()).optional(),
	outputFormat: z.string().optional(),
	audience: z.string().optional(),
	// YAML prompt frontmatter (experimental prompt file support)
	mode: z.string().optional().default("agent"),
	model: z.string().optional().default("GPT-4.1"),
	tools: z
		.array(z.string())
		.optional()
		.default(["githubRepo", "codebase", "editFiles"]),
	description: z.string().optional(),
	includeFrontmatter: z.boolean().optional().default(true),
	includeDisclaimer: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(false),
	issues: z.array(z.string()).optional(),
	includeExplanation: z.boolean().optional().default(false),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	// Enforce *.prompt.md file style (frontmatter + markdown prompt body)
	forcePromptMdStyle: z.boolean().optional().default(true),
});

type HierarchicalPromptInput = z.infer<typeof HierarchicalPromptSchema>;

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function buildFrontmatter(input: HierarchicalPromptInput): string {
	const lines: string[] = ["---"];
	if (input.mode) lines.push(`mode: '${input.mode}'`);
	if (input.model) lines.push(`model: ${input.model}`);
	if (input.tools?.length)
		lines.push(`tools: [${input.tools.map((t) => `'${t}'`).join(", ")}]`);
	const desc = input.description || input.goal || "Hierarchical task prompt";
	lines.push(`description: '${desc.replace(/'/g, "''")}'`);
	lines.push("---");
	return lines.join("\n");
}

export async function hierarchicalPromptBuilder(args: unknown) {
	const input = HierarchicalPromptSchema.parse(args);

	// If enforcing *.prompt.md style, ensure frontmatter + metadata are on
	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildHierarchicalPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildFrontmatter(input)}\n`
		: "";
	const disclaimer = input.includeDisclaimer ? buildDisclaimer() : "";
	const references = input.includeReferences ? buildGeneralReferences() : "";
	const filenameHint = `${slugify(input.goal || input.description || "prompt")}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? [
				"### Metadata",
				`- Updated: ${new Date().toISOString().slice(0, 10)}`,
				"- Source tool: mcp_ai-agent-guid_hierarchical-prompt-builder",
				input.inputFile ? `- Input file: ${input.inputFile}` : undefined,
				`- Suggested filename: ${filenameHint}`,
				"",
			]
				.filter(Boolean)
				.join("\n")
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🧭 Hierarchical Prompt Structure\n\n${metadata}\n${prompt}\n\n${input.includeExplanation ? `## Explanation\nThis prompt follows hierarchical structuring principles (context → goal → requirements → format → audience) to reduce ambiguity and align responses with constraints.\n\n` : ""}${references ? `## References\n${references}\n\n` : ""}${disclaimer}`,
			},
		],
	};
}

function buildHierarchicalPrompt(input: HierarchicalPromptInput): string {
	let prompt = "";

	// Layer 1: Context
	prompt += `# Context\n${input.context}\n\n`;

	// Layer 2: Goal
	prompt += `# Goal\n${input.goal}\n\n`;

	// Layer 3: Requirements (if provided)
	if (input.requirements && input.requirements.length > 0) {
		prompt += `# Requirements\n`;
		input.requirements.forEach((req, index) => {
			prompt += `${index + 1}. ${req}\n`;
		});
		prompt += "\n";
	}

	// Layer 3b: Problem Indicators (if provided)
	if (input.issues && input.issues.length > 0) {
		prompt += `# Problem Indicators\n`;
		input.issues.forEach((iss, index) => {
			prompt += `${index + 1}. ${iss}\n`;
		});
		prompt += "\n";
	}

	// Layer 4: Output Format (if provided)
	if (input.outputFormat) {
		// Normalize list numbering and layout: convert "1) Item" -> "1. Item"
		// and transform inline comma-separated enumerations into multi-line ordered lists.
		const normalizedOutputFormat = normalizeOutputFormat(input.outputFormat);
		prompt += `# Output Format\n${normalizedOutputFormat}\n\n`;
	}

	// Layer 5: Audience (if provided)
	if (input.audience) {
		prompt += `# Target Audience\n${input.audience}\n\n`;
	}

	// Final instruction
	prompt += `# Instructions\nFollow the structure above. If you detect additional issues in the codebase, explicitly add them under Problem Indicators, propose minimal diffs, and flag risky changes. Treat tools/models as recommendations to validate against current provider documentation.`;

	return prompt;
}

/**
 * Normalize enumerated list styles in free-form text:
 * - Converts patterns like "1) Item" to "1. Item" to align with Markdown ordered lists.
 *   This is intentionally limited to simple numeric list markers to avoid unintended changes.
 */
function normalizeOutputFormat(text: string): string {
	// First, convert list markers like "1) " to "1. "
	let t = text.replace(/(\d+)\)\s/g, "$1. ");
	// If content is a single line with inline enumerations separated by commas,
	// split them into lines when they look like "1. ... , 2. ... , 3. ..."
	// This keeps any existing line breaks intact otherwise.
	if (!t.includes("\n") && /(\d+)\.\s/.test(t) && /,\s*\d+\.\s/.test(t)) {
		// Split on comma followed by a list index pattern
		const parts = t.split(/,\s*(?=\d+\.\s)/);
		// Ensure they are trimmed and each on its own line
		t = parts.map((p) => p.trim()).join("\n");
	}
	return t;
}

function buildDisclaimer(): string {
	return `## Disclaimer\n- References to third-party tools, models, pricing, and limits are indicative and may change.\n- Validate choices with official docs and run a quick benchmark before production use.`;
}

function buildGeneralReferences(): string {
	return [
		"- Hierarchical Prompting overview: https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions",
		"- Prompt engineering best practices: https://kanerika.com/blogs/ai-prompt-engineering-best-practices/",
		"- Techniques round-up (2025): https://www.dataunboxed.io/blog/the-complete-guide-to-prompt-engineering-15-essential-techniques-for-2025",
	].join("\n");
}
