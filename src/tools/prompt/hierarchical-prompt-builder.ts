import { z } from "zod";
import {
	buildProviderTipsSection as buildSharedProviderTips,
	inferTechniquesFromText,
	ProviderEnum,
	StyleEnum,
	TechniqueEnum,
} from "../shared/prompt-sections.js";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildMetadataSection,
	buildReferencesSection,
	slugify,
} from "../shared/prompt-utils.js";

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

	// 2025 Prompting Techniques integration (optional hints)
	// Support both single string and array of strings, coerce to array
	techniques: z.preprocess((val) => {
		if (typeof val === "string") return [val];
		return val;
	}, z.array(TechniqueEnum).optional()),
	includeTechniqueHints: z.boolean().optional().default(true),
	includePitfalls: z.boolean().optional().default(true),
	autoSelectTechniques: z.boolean().optional().default(false),
	provider: ProviderEnum.optional().default("gpt-4.1"),
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
 */
function buildActionableInstructions(input: HierarchicalPromptInput): string {
	const contextText = [
		input.context,
		input.goal,
		(input.requirements || []).join("\n"),
		input.outputFormat || "",
		input.audience || "",
	].join("\n");

	// Determine which techniques to use
	const selectedList = input.techniques?.length
		? input.techniques
		: input.autoSelectTechniques
			? inferTechniquesFromText(contextText)
			: [];

	if (selectedList.length === 0) {
		return ""; // No techniques selected, no additional instructions
	}

	const selected = new Set(selectedList.map((t) => t.toLowerCase()));
	let instructions = "";

	// Chain-of-Thought: Generate specific step-by-step plan
	if (selected.has("chain-of-thought")) {
		instructions += buildChainOfThoughtInstructions(input);
	}

	// Few-Shot: Generate example-based instructions
	if (selected.has("few-shot")) {
		instructions += buildFewShotInstructions(input);
	}

	// RAG: Provide specific document handling instructions
	if (selected.has("rag")) {
		instructions += buildRAGInstructions(input);
	}

	// Prompt Chaining: Break down into sequential steps
	if (selected.has("prompt-chaining")) {
		instructions += buildPromptChainingInstructions(input);
	}

	// Tree of Thoughts: Generate exploration framework
	if (selected.has("tree-of-thoughts")) {
		instructions += buildTreeOfThoughtsInstructions(input);
	}

	// Generate Knowledge: Create fact-gathering framework
	if (selected.has("generate-knowledge")) {
		instructions += buildGenerateKnowledgeInstructions(input);
	}

	// Self-Consistency: Add verification steps
	if (selected.has("self-consistency")) {
		instructions += buildSelfConsistencyInstructions(input);
	}

	// ReAct: Tool-use pattern
	if (selected.has("react")) {
		instructions += buildReActInstructions(input);
	}

	return instructions;
}

/**
 * Generate specific chain-of-thought instructions based on the task context.
 */
function buildChainOfThoughtInstructions(
	input: HierarchicalPromptInput,
): string {
	const steps: string[] = [];

	// Analyze the context to generate relevant thinking steps
	steps.push("1. Analyze the current state:");
	steps.push(`   - Review the context: ${input.context}`);

	if (input.issues && input.issues.length > 0) {
		steps.push(`   - Identify the key problems: ${input.issues.join(", ")}`);
	}

	steps.push("\n2. Break down the goal:");
	steps.push(`   - Main objective: ${input.goal}`);

	if (input.requirements && input.requirements.length > 0) {
		steps.push("   - Key requirements to address:");
		input.requirements.forEach((req, idx) => {
			steps.push(`     ${idx + 1}. ${req}`);
		});
	}

	steps.push("\n3. Plan your approach:");
	steps.push("   - Identify the main components or modules involved");
	steps.push("   - Determine the sequence of changes needed");
	steps.push("   - Consider dependencies and potential impacts");

	steps.push("\n4. Execute step-by-step:");
	steps.push("   - Address each requirement methodically");
	steps.push("   - Explain your reasoning for each decision");
	steps.push("   - Validate each step before proceeding");

	if (input.outputFormat) {
		steps.push("\n5. Format your output:");
		steps.push(
			`   - Ensure it matches the required format: ${input.outputFormat}`,
		);
	}

	return `# Approach\n\nThink through this problem step-by-step:\n\n${steps.join("\n")}\n\n`;
}

/**
 * Generate few-shot examples based on the output format and goal.
 */
function buildFewShotInstructions(input: HierarchicalPromptInput): string {
	let section = "# Examples\n\n";
	section +=
		"Here are examples of how to approach similar tasks. Follow these patterns:\n\n";

	// Generate 1-2 simple examples based on the context
	const isCodeTask = /code|refactor|implement|function|class|method/i.test(
		input.goal,
	);
	const isAnalysisTask = /analyz|review|assess|evaluat|audit/i.test(input.goal);
	const isDocTask = /document|write|describe|explain/i.test(input.goal);

	if (isCodeTask) {
		section += "**Example 1: Code Refactoring**\n";
		section += "```\n";
		section += "Task: Refactor authentication logic\n";
		section += "Approach:\n";
		section +=
			"1. Identify current authentication mechanism (e.g., Passport.js strategy)\n";
		section += "2. Extract authentication logic into separate module\n";
		section += "3. Create clear interfaces for auth providers\n";
		section += "4. Update tests to cover new structure\n";
		section += "Output: Modular auth system with separated concerns\n";
		section += "```\n\n";
	} else if (isAnalysisTask) {
		section += "**Example 1: Code Analysis**\n";
		section += "```\n";
		section += "Task: Analyze module dependencies\n";
		section += "Approach:\n";
		section += "1. Map all import/require statements\n";
		section += "2. Identify circular dependencies\n";
		section += "3. Assess coupling between modules\n";
		section += "4. Recommend decoupling strategies\n";
		section +=
			"Output: Dependency graph with recommendations for improvement\n";
		section += "```\n\n";
	} else if (isDocTask) {
		section += "**Example 1: Documentation**\n";
		section += "```\n";
		section += "Task: Document API endpoints\n";
		section += "Approach:\n";
		section += "1. List all endpoints with HTTP methods\n";
		section += "2. Document request/response formats\n";
		section += "3. Include authentication requirements\n";
		section += "4. Provide example requests and responses\n";
		section += "Output: Comprehensive API documentation\n";
		section += "```\n\n";
	} else {
		// Generic example
		section += "**Example: Task Execution**\n";
		section += "```\n";
		section += `Task: ${input.goal}\n`;
		section += "Approach:\n";
		section += "1. Understand the current state\n";
		section += "2. Identify what needs to change\n";
		section += "3. Plan the sequence of actions\n";
		section += "4. Execute and validate\n";
		section += "Output: Completed task meeting all requirements\n";
		section += "```\n\n";
	}

	return section;
}

/**
 * Generate RAG-specific instructions.
 */
function buildRAGInstructions(input: HierarchicalPromptInput): string {
	let section = "# Document Handling\n\n";
	section += "When working with documents or external knowledge sources:\n\n";
	section += "1. **Retrieve Relevant Information**:\n";
	section += `   - Extract information relevant to: ${input.goal}\n`;
	section += "   - Focus on content that addresses the requirements\n\n";
	section += "2. **Quote and Cite**:\n";
	section += "   - Include direct quotes where appropriate\n";
	section += "   - Always cite the source of information\n";
	section += "   - Use clear markers like [Source: ...]\n\n";
	section += "3. **Synthesize Information**:\n";
	section += "   - Combine information from multiple sources\n";
	section += "   - Resolve any conflicts or contradictions\n";
	section += "   - Provide a coherent answer\n\n";
	return section;
}

/**
 * Generate prompt chaining instructions.
 */
function buildPromptChainingInstructions(
	input: HierarchicalPromptInput,
): string {
	let section = "# Step-by-Step Workflow\n\n";
	section += "Break this task into sequential steps:\n\n";
	section += `1. **Analyze**: Examine ${input.context}\n`;
	section += `2. **Plan**: Design approach to ${input.goal}\n`;

	if (input.requirements && input.requirements.length > 0) {
		section += "3. **Implement**: Address each requirement:\n";
		input.requirements.forEach((req, idx) => {
			section += `   - Step ${idx + 1}: ${req}\n`;
		});
	} else {
		section += "3. **Implement**: Execute the planned changes\n";
	}

	section += "4. **Validate**: Verify all requirements are met\n";
	section += "5. **Document**: Explain changes and decisions\n\n";

	section +=
		"Complete each step fully before moving to the next. Each step should build on the previous one.\n\n";

	return section;
}

/**
 * Generate tree of thoughts instructions.
 */
function buildTreeOfThoughtsInstructions(
	input: HierarchicalPromptInput,
): string {
	let section = "# Explore Alternative Approaches\n\n";
	section += `For the goal "${input.goal}", consider multiple paths:\n\n`;
	section += "1. **Generate Alternatives**:\n";
	section += "   - Brainstorm 2-3 different approaches\n";
	section += "   - Consider both conservative and innovative solutions\n\n";
	section += "2. **Evaluate Each Path**:\n";
	section += "   - Pros: What are the benefits?\n";
	section += "   - Cons: What are the drawbacks or risks?\n";
	section += "   - Complexity: How difficult is implementation?\n\n";
	section += "3. **Select Best Path**:\n";
	section += "   - Compare alternatives against requirements\n";
	section += "   - Choose the optimal solution\n";
	section += "   - Justify your choice\n\n";
	return section;
}

/**
 * Generate knowledge generation instructions.
 */
function buildGenerateKnowledgeInstructions(
	input: HierarchicalPromptInput,
): string {
	let section = "# Knowledge Gathering\n\n";
	section +=
		"Before solving the task, gather and document relevant knowledge:\n\n";
	section += "1. **List Key Facts**:\n";
	section += `   - What do we know about ${input.context}?\n`;
	section += "   - What are the established patterns or conventions?\n";
	section += "   - What are the constraints or limitations?\n\n";
	section += "2. **Identify Assumptions**:\n";
	section += "   - What assumptions are we making?\n";
	section += "   - What additional information might we need?\n\n";
	section += "3. **Apply Knowledge**:\n";
	section += "   - Use the gathered facts to inform your solution\n";
	section += `   - Ensure the approach aligns with: ${input.goal}\n\n`;
	return section;
}

/**
 * Generate self-consistency instructions.
 */
function buildSelfConsistencyInstructions(
	_input: HierarchicalPromptInput,
): string {
	let section = "# Verification and Consistency\n\n";
	section += "Ensure accuracy through multiple approaches:\n\n";
	section += "1. **Generate Multiple Solutions**:\n";
	section += "   - Approach the problem from 2-3 different angles\n";
	section += "   - Use different reasoning paths\n\n";
	section += "2. **Compare Results**:\n";
	section += "   - Identify commonalities across solutions\n";
	section += "   - Note any significant differences\n\n";
	section += "3. **Select Consensus**:\n";
	section += "   - Choose the solution that appears most consistently\n";
	section += "   - If solutions differ significantly, analyze why\n";
	section += "   - Provide the most reliable answer\n\n";
	return section;
}

/**
 * Generate ReAct (Reasoning + Acting) instructions.
 */
function buildReActInstructions(input: HierarchicalPromptInput): string {
	let section = "# Reasoning and Tool Use\n\n";
	section += "Interleave thinking and action when tools are available:\n\n";
	section += "1. **Thought**: What do I need to accomplish?\n";
	section += `   - Current goal: ${input.goal}\n\n`;
	section += "2. **Action**: What tool or action should I use?\n";
	section +=
		"   - Choose the appropriate tool (e.g., search, code execution, file access)\n\n";
	section += "3. **Observation**: What did I learn?\n";
	section += "   - Analyze the results from the action\n\n";
	section +=
		"4. **Repeat**: Continue the Thought → Action → Observation cycle\n";
	section += "   - Keep iterating until the goal is achieved\n\n";
	section +=
		"**Note**: Only use tools when they add value to solving the task.\n\n";
	return section;
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
	return buildReferencesSection([
		"Hierarchical Prompting overview: https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions",
		"Prompt engineering best practices: https://kanerika.com/blogs/ai-prompt-engineering-best-practices/",
		"Techniques round-up (2025): https://www.dataunboxed.io/blog/the-complete-guide-to-prompt-engineering-15-essential-techniques-for-2025",
	]);
}

// --- Section builders for 2025 techniques & model tips ---

// Test-only exports (marked as internal)
/** @internal - For testing purposes only */
export { normalizeOutputFormat as _normalizeOutputFormat };
/** @internal - For testing purposes only */
export { buildHierarchicalFrontmatter as _buildHierarchicalFrontmatter };
