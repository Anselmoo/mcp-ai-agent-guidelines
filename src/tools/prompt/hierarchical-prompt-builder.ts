import { z } from "zod";
import {
	buildHierarchicalPrompt,
	type PromptMetadata,
	type PromptSection,
} from "../../domain/prompting/hierarchical-builder.js";
import { DEFAULT_MODEL, DEFAULT_MODEL_SLUG } from "../config/model-config.js";
import { emitDeprecationWarning } from "../shared/deprecation.js";
import { handleToolError } from "../shared/error-handler.js";
import {
	buildProviderTipsSection,
	ProviderEnum,
	StyleEnum,
	TechniqueEnum,
} from "../shared/prompt-sections.js";
import {
	applyExportFormat,
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";
import { ExportFormatEnum } from "../shared/types/export-format.types.js";
import { applyTechniques } from "./technique-applicator.js";

// Strict mode enum for YAML frontmatter
const ModeEnum = z.enum(["agent", "tool", "workflow"]);

const HierarchicalPromptSchema = z.object({
	context: z.string().describe("The broad context or domain for the prompt"),
	goal: z.string().describe("The specific goal or objective to achieve"),
	requirements: z
		.array(z.string())
		.describe("Detailed requirements and constraints as a list")
		.optional(),
	constraints: z
		.array(z.string())
		.describe("Constraints or limitations to consider")
		.optional(),
	outputFormat: z
		.string()
		.describe("Desired output format description")
		.optional(),
	audience: z
		.string()
		.describe("Target audience or expertise level")
		.optional(),
	// YAML prompt frontmatter (experimental prompt file support)
	mode: ModeEnum.describe("Execution mode: agent, tool, or workflow")
		.optional()
		.default("agent"),
	model: z
		.string()
		.describe("AI model identifier to use for generation")
		.optional()
		.default(DEFAULT_MODEL),
	tools: z
		.array(z.string())
		.describe("List of tools available to the agent")
		.optional()
		.default(["githubRepo", "codebase", "editFiles"]),
	description: z
		.string()
		.describe("Optional description for the prompt file frontmatter")
		.optional(),
	includeFrontmatter: z
		.boolean()
		.describe("Whether to include YAML frontmatter in output")
		.optional()
		.default(true),
	includeDisclaimer: z
		.boolean()
		.describe("Whether to include a disclaimer section")
		.optional()
		.default(true),
	includeReferences: z
		.boolean()
		.describe("Whether to include reference links")
		.optional()
		.default(false),
	issues: z
		.array(z.string())
		.describe("Related GitHub issue numbers")
		.optional(),
	includeExplanation: z
		.boolean()
		.describe("Whether to include technique explanations")
		.optional()
		.default(false),
	includeMetadata: z
		.boolean()
		.describe("Whether to include metadata section")
		.optional()
		.default(true),
	inputFile: z.string().describe("Input file path for reference").optional(),
	// Enforce *.prompt.md file style (frontmatter + markdown prompt body)
	forcePromptMdStyle: z
		.boolean()
		.describe("Force *.prompt.md file style with frontmatter")
		.optional()
		.default(true),

	// 2025 Prompting Techniques integration (optional hints)
	// Support both single string and array of strings, coerce to array
	techniques: z.preprocess((val) => {
		if (typeof val === "string") return [val];
		return val;
	}, z
		.array(TechniqueEnum)
		.describe("Prompting techniques to apply (e.g., chain-of-thought)")
		.optional()),
	includeTechniqueHints: z
		.boolean()
		.describe("Whether to include technique hint annotations")
		.optional()
		.default(true),
	includePitfalls: z
		.boolean()
		.describe("Whether to include common pitfalls section")
		.optional()
		.default(true),
	autoSelectTechniques: z
		.boolean()
		.describe("Automatically select appropriate techniques based on context")
		.optional()
		.default(false),
	provider: ProviderEnum.describe("AI provider family for tailored tips")
		.optional()
		.default(DEFAULT_MODEL_SLUG),
	style: StyleEnum.describe("Preferred prompt formatting style").optional(),

	// Export format options (NEW)
	exportFormat: ExportFormatEnum.describe(
		"Export format for the output (markdown, json, yaml)",
	)
		.optional()
		.default("markdown"),
	includeHeaders: z
		.boolean()
		.describe("Whether to include section headers in output")
		.optional()
		.default(true),
	documentTitle: z
		.string()
		.describe("Document title for export formats")
		.optional(),
	documentAuthor: z
		.string()
		.describe("Document author for export formats")
		.optional(),
	documentDate: z
		.string()
		.describe("Document date for export formats")
		.optional(),
});

type HierarchicalPromptInput = z.infer<typeof HierarchicalPromptSchema>;

function buildHierarchicalFrontmatter(input: HierarchicalPromptInput): string {
	const desc = input.description || input.goal || "Hierarchical task prompt";
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function hierarchicalPromptBuilder(args: unknown) {
	try {
		emitDeprecationWarning({
			tool: "hierarchical-prompt-builder",
			replacement: "prompt-hierarchy",
			deprecatedIn: "v0.14.0",
			removedIn: "v0.15.0",
		});

		const input = HierarchicalPromptSchema.parse(args);

		// If enforcing *.prompt.md style, ensure frontmatter + metadata are on
		const enforce = input.forcePromptMdStyle ?? true;
		const effectiveIncludeFrontmatter = enforce
			? true
			: input.includeFrontmatter;
		const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

		const normalizedOutputFormat = input.outputFormat
			? normalizeOutputFormat(input.outputFormat)
			: undefined;
		const techniqueContent =
			input.includeTechniqueHints !== false
				? applyTechniques({
						context: {
							context: input.context,
							goal: input.goal,
							requirements: input.requirements,
							outputFormat: normalizedOutputFormat,
							audience: input.audience,
							issues: input.issues,
						},
						techniques: input.techniques,
						autoSelectTechniques: input.autoSelectTechniques,
					})
				: undefined;
		const providerTipsContent = buildProviderTipsSection(
			input.provider,
			input.style,
		);
		const promptResult = buildHierarchicalPrompt({
			...input,
			outputFormat: normalizedOutputFormat,
			techniqueContent,
			techniqueTitle: "Approach",
			providerTipsContent,
			providerTipsTitle: "Model-Specific Tips",
		});
		const prompt = formatHierarchicalPrompt(promptResult.sections);
		const frontmatter = effectiveIncludeFrontmatter
			? `${buildHierarchicalFrontmatter(input)}\n`
			: "";
		const disclaimer = input.includeDisclaimer ? buildDisclaimer() : "";
		const references = input.includeReferences ? buildGeneralReferences() : "";
		const filenameHint = `${slugify(input.goal || input.description || "prompt")}.prompt.md`;
		const metadata = effectiveIncludeMetadata
			? buildMetadataSection({
					sourceTool: "mcp_ai-agent-guid_hierarchical-prompt-builder",
					inputFile: input.inputFile,
					filenameHint,
				})
			: "";
		const domainMetadata = effectiveIncludeMetadata
			? buildDomainMetadataSection(promptResult.metadata)
			: "";

		// Build the full content
		const fullContent = `${frontmatter}## 🧭 Hierarchical Prompt Structure\n\n${metadata}${domainMetadata}${prompt}\n\n${input.includeExplanation ? `## Explanation\nThis prompt follows hierarchical structuring principles (context → goal → requirements → format → audience) to reduce ambiguity and align responses with constraints.\n\n` : ""}${references ? `${references}\n` : ""}${disclaimer}`;

		// Apply export format if specified
		const formattedContent = applyExportFormat(fullContent, {
			exportFormat: input.exportFormat,
			includeHeaders: input.includeHeaders,
			includeFrontmatter: effectiveIncludeFrontmatter,
			documentTitle: input.documentTitle || input.goal || "Hierarchical Prompt",
			documentAuthor: input.documentAuthor,
			documentDate: input.documentDate,
		});

		return {
			content: [
				{
					type: "text",
					text: formattedContent,
				},
			],
		};
	} catch (error) {
		return handleToolError(error);
	}
}

function formatHierarchicalPrompt(sections: PromptSection[]): string {
	let prompt = "";
	for (const section of sections) {
		prompt += `# ${section.title}\n${section.body}\n\n`;
	}
	return prompt.trimEnd();
}

function buildDomainMetadataSection(meta: PromptMetadata): string {
	const techniques =
		meta.techniques.length > 0 ? meta.techniques.join(", ") : "none";
	return `### Prompt Metrics
- Complexity score: ${meta.complexity}
- Token estimate: ${meta.tokenEstimate}
- Sections: ${meta.sections}
- Techniques: ${techniques}
- Requirements: ${meta.requirementsCount}
- Issues: ${meta.issuesCount}

`;
}

/**
 * Normalize enumerated list styles in free-form text:
 * - Converts patterns like "1) Item" to "1. Item" to align with Markdown ordered lists.
 * - Preserves content inside fenced code blocks (```...```) unchanged.
 *   This is intentionally limited to simple numeric list markers to avoid unintended changes.
 */
function normalizeOutputFormat(text: string): string {
	// Split text into segments: code blocks and non-code text
	const segments = splitByFencedBlocks(text);

	// Apply normalization only to non-code segments
	const normalized = segments.map((segment) => {
		if (segment.isCode) {
			// Preserve code blocks unchanged
			return segment.raw;
		}

		// Normalize non-code text
		let t = segment.raw;
		// First, convert list markers like "1) " to "1. "
		t = t.replace(/(\d+)\)\s/g, "$1. ");
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
	});

	return normalized.join("");
}

/**
 * Split text into segments of code blocks and non-code text.
 * Handles fenced code blocks (``` ... ```) with optional language specifiers.
 */
function splitByFencedBlocks(
	text: string,
): Array<{ raw: string; isCode: boolean }> {
	const segments: Array<{ raw: string; isCode: boolean }> = [];
	// Match fenced code blocks: ``` followed by optional language, content, and closing ```
	// Use multiline and dotall flags to match across lines
	const fenceRegex = /^```[^\n]*\n([\s\S]*?)^```$/gm;

	let lastIndex = 0;
	let match = fenceRegex.exec(text);

	while (match !== null) {
		// Add non-code text before this code block
		if (match.index > lastIndex) {
			const nonCode = text.slice(lastIndex, match.index);
			if (nonCode) {
				segments.push({ raw: nonCode, isCode: false });
			}
		}

		// Add the entire code block (including fences)
		segments.push({ raw: match[0], isCode: true });
		lastIndex = fenceRegex.lastIndex;

		// Get next match
		match = fenceRegex.exec(text);
	}

	// Add any remaining non-code text after the last code block
	if (lastIndex < text.length) {
		const remaining = text.slice(lastIndex);
		if (remaining) {
			segments.push({ raw: remaining, isCode: false });
		}
	}

	// If no segments were found (no code blocks), return the entire text as non-code
	if (segments.length === 0) {
		return [{ raw: text, isCode: false }];
	}

	return segments;
}

function buildDisclaimer(): string {
	return `## Disclaimer\n- References to third-party tools, models, pricing, and limits are indicative and may change.\n- Validate choices with official docs and run a quick benchmark before production use.`;
}

function buildGeneralReferences(): string {
	return buildFurtherReadingSection([
		{
			title: "Hierarchical Prompting Overview",
			url: "https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions",
			description:
				"Master hierarchical prompting for better AI interactions and structured outputs",
		},
		{
			title: "AI Prompt Engineering Best Practices",
			url: "https://kanerika.com/blogs/ai-prompt-engineering-best-practices/",
			description:
				"Comprehensive guide to effective prompt engineering techniques",
		},
		{
			title: "Complete Guide to Prompt Engineering 2025",
			url: "https://www.dataunboxed.io/blog/the-complete-guide-to-prompt-engineering-15-essential-techniques-for-2025",
			description:
				"15 essential prompt engineering techniques for modern AI systems",
		},
	]);
}

// --- Section builders for 2025 techniques & model tips ---

// Test-only exports (marked as internal)
/** @internal - For testing purposes only */
export { normalizeOutputFormat as _normalizeOutputFormat };
/** @internal - For testing purposes only */
export { buildHierarchicalFrontmatter as _buildHierarchicalFrontmatter };
