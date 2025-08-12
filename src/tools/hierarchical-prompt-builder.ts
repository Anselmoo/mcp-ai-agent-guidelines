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

	// 2025 Prompting Techniques integration (optional hints)
	techniques: z
		.array(
			z.enum([
				"zero-shot",
				"few-shot",
				"chain-of-thought",
				"self-consistency",
				"in-context-learning",
				"generate-knowledge",
				"prompt-chaining",
				"tree-of-thoughts",
				"meta-prompting",
				"rag",
				"react",
				"art",
			])
		)
		.optional(),
	includeTechniqueHints: z.boolean().optional().default(true),
	includePitfalls: z.boolean().optional().default(true),
	autoSelectTechniques: z.boolean().optional().default(false),
	provider: z
		.enum([
			"gpt-5",
			"gpt-4.1",
			"claude-4",
			"claude-3.7",
			"gemini-2.5",
			"o4-mini",
			"o3-mini",
			"other",
		])
		.optional()
		.default("gpt-4.1"),
	style: z.enum(["markdown", "xml"]).optional(),
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

	// Optional: 2025 Prompting Techniques (hint sections)
	if (input.includeTechniqueHints !== false) {
		prompt += buildTechniqueHintsSection(input);
	}

	// Optional: Model-specific tips based on provider/style
	prompt += buildProviderTipsSection(input);

	// Optional: Common pitfalls to avoid
	if (input.includePitfalls !== false) {
		prompt += buildPitfallsSection();
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

// --- Section builders for 2025 techniques & model tips ---
function buildTechniqueHintsSection(input: HierarchicalPromptInput): string {
	const selectedList = input.techniques?.length
		? input.techniques
		: input.autoSelectTechniques
			? inferTechniquesFromInput(input)
			: [
					"zero-shot",
					"few-shot",
					"chain-of-thought",
					"prompt-chaining",
					"rag",
				];
	const selected = new Set(selectedList.map((t) => t.toLowerCase()));

	const lines: string[] = [];
	lines.push(`# Technique Hints (2025)`);
	lines.push("");

	const add = (title: string, body: string) => {
		lines.push(`## ${title}`);
		lines.push(body);
		lines.push("");
	};

	if (selected.has("zero-shot"))
		add(
			"Zero-Shot",
			"Use for simple tasks or baselines. Keep instructions crisp. Example: 'Summarize the following text in 3 bullets focused on findings.'",
		);
	if (selected.has("few-shot"))
		add(
			"Few-Shot",
			"Provide 2–5 diverse examples that exactly match the desired output format.",
		);
	if (selected.has("chain-of-thought"))
		add(
			"Chain-of-Thought",
			"Ask for step-by-step reasoning on complex problems. For GPT add 'think carefully step by step'.",
		);
	if (selected.has("self-consistency"))
		add(
			"Self-Consistency",
			"Request multiple approaches and select the consensus answer for higher reliability.",
		);
	if (selected.has("in-context-learning"))
		add(
			"In-Context Learning",
			"Embed patterns in the prompt. Keep examples varied to avoid overfitting.",
		);
	if (selected.has("generate-knowledge"))
		add(
			"Generate Knowledge",
			"Have the model list relevant facts first, then answer using that scratchpad.",
		);
	if (selected.has("prompt-chaining"))
		add(
			"Prompt Chaining",
			"Split multi-step workflows into sequential prompts (analyze ➜ hypothesize ➜ recommend ➜ plan).",
		);
	if (selected.has("tree-of-thoughts"))
		add(
			"Tree of Thoughts",
			"Explore branches with pros/cons and choose the best path for open-ended tasks.",
		);
	if (selected.has("meta-prompting"))
		add(
			"Meta Prompting",
			"Ask the model to improve your prompt for clarity, examples, and structure.",
		);
	if (selected.has("rag"))
		add(
			"Retrieval Augmented Generation (RAG)",
			"Separate instructions from documents. Quote sources and include citations/anchors.",
		);
	if (selected.has("react"))
		add(
			"ReAct",
			"Interleave Thought/Action/Observation when tools are available. Prefer larger models for stability.",
		);
	if (selected.has("art"))
		add(
			"Automatic Reasoning and Tool-use (ART)",
			"Let the model pick tools automatically; optionally add 'Only use tools when needed' to curb overuse.",
		);

	return lines.join("\n");
}

// Heuristic: infer suitable techniques from context/goal/requirements
function inferTechniquesFromInput(input: HierarchicalPromptInput): string[] {
	const text = [
		input.context || "",
		input.goal || "",
		(input.requirements || []).join("\n"),
		input.outputFormat || "",
		input.audience || "",
	].join("\n").toLowerCase();

	const picks: string[] = [];

	// RAG
	if (
		/(document|docs|policy|manual|pdf|cite|citation|reference|source|kb|dataset|quote)/.test(
			text,
		)
	) {
		picks.push("rag");
	}

	// CoT
	if (/(reason|step|derive|calculate|proof|logic|why|explain)/.test(text)) {
		picks.push("chain-of-thought");
	}

	// Prompt chaining
	if (
		/(pipeline|workflow|multi-step|then|analyze\s+then|plan\s+then|timeline)/.test(
			text,
		)
	) {
		picks.push("prompt-chaining");
	}

	// Few-shot / ICL
	if (/(example|examples|like this|pattern|format|consistent formatting)/.test(text)) {
		picks.push("few-shot", "in-context-learning");
	}

	// Self-consistency
	if (/(accuracy|verify|consensus|multiple approaches|critical)/.test(text)) {
		picks.push("self-consistency");
	}

	// Generate knowledge first
	if (/(facts first|assumptions|prior knowledge|before answering)/.test(text)) {
		picks.push("generate-knowledge");
	}

	// ToT
	if (/(brainstorm|alternatives|options|pros and cons|tradeoffs)/.test(text)) {
		picks.push("tree-of-thoughts");
	}

	// Tools (ReAct/ART)
	if (/(use tools|search|web|browser|calculator|execute|run code|call api)/.test(text)) {
		picks.push("react", "art");
	}

	// Fallbacks
	if (picks.length === 0) picks.push("zero-shot");

	// Deduplicate and cap to ~6 to keep prompt compact
	const order = [
		"rag",
		"chain-of-thought",
		"prompt-chaining",
		"few-shot",
		"in-context-learning",
		"self-consistency",
		"generate-knowledge",
		"tree-of-thoughts",
		"react",
		"art",
		"zero-shot",
	];
	const unique = Array.from(new Set(picks));
	unique.sort((a, b) => order.indexOf(a) - order.indexOf(b));
	return unique.slice(0, 6);
}

function buildProviderTipsSection(input: HierarchicalPromptInput): string {
	const p = (input.provider || "gpt-4.1").toLowerCase();
	const style = input.style || (p === "claude-4" ? "xml" : "markdown");
	const lines: string[] = [];
	lines.push(`# Model-Specific Tips`);
	lines.push("");
	if (p === "gpt-4.1") {
		lines.push("- Prefer Markdown with clear headings and sections");
		lines.push("- Place instructions at the beginning (and optionally re-assert at the end) in long contexts");
		lines.push("- Use explicit step numbering for CoT where helpful");
	} else if (p === "claude-4") {
		lines.push("- Prefer XML-like structuring for clarity (e.g., <instructions>, <context>, <examples>)");
		lines.push("- Be very specific about expectations and use extended thinking tags where appropriate");
		lines.push("- Tag documents distinctly when doing RAG");
	} else if (p === "gemini-2.5") {
		lines.push("- Use consistent formatting throughout; keep queries at the end of long contexts");
		lines.push("- Experiment with example quantities and placement");
	}
	lines.push("")
	lines.push(`- Preferred Style: ${style.toUpperCase()}`);
	lines.push("");
	lines.push(
		style === "xml"
			? "```xml\n<instructions>...your task...</instructions>\n<context>...data...</context>\n<output_format>JSON fields ...</output_format>\n```\n"
			: "```md\n# Instructions\n...your task...\n\n# Context\n...data...\n\n# Output Format\nJSON fields ...\n```\n",
	);
	lines.push("");
	return lines.join("\n");
}

function buildPitfallsSection(): string {
	return `# Pitfalls to Avoid\n\n- Vague instructions → replace with precise, positive directives\n- Forced behaviors (e.g., 'always use a tool') → say 'Use tools when needed'\n- Context mixing → separate Instructions vs Data clearly\n- Limited examples → vary few-shot examples to avoid overfitting\n- Repetitive sample phrases → add 'vary language naturally'\n- Negative instructions → state what to do, not just what not to do\n\n`;
}
