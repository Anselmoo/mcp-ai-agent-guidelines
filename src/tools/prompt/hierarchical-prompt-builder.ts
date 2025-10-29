import { z } from "zod";
import {
	buildProviderTipsSection as buildSharedProviderTips,
	ProviderEnum,
	StyleEnum,
	TechniqueEnum,
} from "../shared/prompt-sections.js";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";
import { applyTechniques } from "./technique-applicator.js";

// Strict mode enum for YAML frontmatter
const ModeEnum = z.enum(["agent", "tool", "workflow"]);

const HierarchicalPromptSchema = z.object({
	context: z.string(),
	goal: z.string(),
	requirements: z.array(z.string()).optional(),
	outputFormat: z.string().optional(),
	audience: z.string().optional(),
	// YAML prompt frontmatter (experimental prompt file support)
	mode: ModeEnum.optional().default("agent"),
	model: z.string().optional().default("GPT-4o"),
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

	// 2025 Prompting Techniques integration (optional hints)
	// Support both single string and array of strings, coerce to array
	techniques: z.preprocess((val) => {
		if (typeof val === "string") return [val];
		return val;
	}, z.array(TechniqueEnum).optional()),
	includeTechniqueHints: z.boolean().optional().default(true),
	includePitfalls: z.boolean().optional().default(true),
	autoSelectTechniques: z.boolean().optional().default(false),
	provider: ProviderEnum.optional().default("gpt-4o"),
	style: StyleEnum.optional(),
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

/**
 * Build context-aware, actionable instructions based on selected techniques.
 * This generates specific, tailored guidance rather than generic advice.
 *
 * @deprecated This function is deprecated. Use applyTechniques from technique-applicator.ts instead.
 */
function buildActionableInstructions(input: HierarchicalPromptInput): string {
	return applyTechniques({
		context: {
			context: input.context,
			goal: input.goal,
			requirements: input.requirements,
			outputFormat: input.outputFormat,
			audience: input.audience,
			issues: input.issues,
		},
		techniques: input.techniques,
		autoSelectTechniques: input.autoSelectTechniques,
	});
}

export async function hierarchicalPromptBuilder(args: unknown) {
	const input = HierarchicalPromptSchema.parse(args);

	// If enforcing *.prompt.md style, ensure frontmatter + metadata are on
	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildHierarchicalPrompt(input);
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

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🧭 Hierarchical Prompt Structure\n\n${metadata}\n${prompt}\n\n${input.includeExplanation ? `## Explanation\nThis prompt follows hierarchical structuring principles (context → goal → requirements → format → audience) to reduce ambiguity and align responses with constraints.\n\n` : ""}${references ? `${references}\n` : ""}${disclaimer}`,
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

	// Optional: Context-aware actionable instructions based on techniques
	if (input.includeTechniqueHints !== false) {
		prompt += buildActionableInstructions(input);
	}

	// Optional: Model-specific tips based on provider/style
	prompt += buildSharedProviderTips(input.provider, input.style);

	// Final instruction
	prompt += `# Instructions\nFollow the structure above. If you detect additional issues in the codebase, explicitly add them under Problem Indicators, propose minimal diffs, and flag risky changes. Treat tools/models as recommendations to validate against current provider documentation.`;

	return prompt;
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
