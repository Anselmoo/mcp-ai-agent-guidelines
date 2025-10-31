import { buildFurtherReadingSection } from "./prompt-utils.js";
import {
	type Provider,
	ProviderEnum,
	type Style,
	StyleEnum,
	type Technique,
	TechniqueEnum,
} from "./types/index.js";

export { TechniqueEnum, ProviderEnum, StyleEnum };
export type { Technique, Provider, Style };

/**
 * Build generic technique hints section.
 *
 * @deprecated This function is deprecated. Use applyTechniques from technique-applicator.ts instead
 * for context-aware, actionable technique instructions rather than generic advice.
 *
 * This function provides static descriptions of techniques instead of applying them to the problem context.
 * The new TechniqueApplicator generates specific instructions tailored to the user's input.
 */
export function buildTechniqueHintsSection(options: {
	techniques?: Technique[];
	autoSelectTechniques?: boolean;
	contextText?: string;
}): string {
	const selectedList = options.techniques?.length
		? options.techniques
		: options.autoSelectTechniques
			? inferTechniquesFromText(options.contextText || "")
			: ["zero-shot", "few-shot", "chain-of-thought", "prompt-chaining", "rag"];
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

export function inferTechniquesFromText(text: string): Technique[] {
	const t = (text || "").toLowerCase();
	const picks: Technique[] = [] as Technique[];

	if (
		/(document|docs|policy|manual|pdf|cite|citation|reference|source|kb|dataset|quote)/.test(
			t,
		)
	)
		picks.push("rag");
	if (/(reason|step|derive|calculate|proof|logic|why|explain)/.test(t))
		picks.push("chain-of-thought");
	if (
		/(pipeline|workflow|multi-step|then|analyze\s+then|plan\s+then|timeline)/.test(
			t,
		)
	)
		picks.push("prompt-chaining");
	if (
		/(example|examples|like this|pattern|format|consistent formatting)/.test(t)
	)
		picks.push("few-shot");
	if (/(accuracy|verify|consensus|multiple approaches|critical)/.test(t))
		picks.push("self-consistency");
	if (/(facts first|assumptions|prior knowledge|before answering)/.test(t))
		picks.push("generate-knowledge");
	if (/(brainstorm|alternatives|options|pros and cons|tradeoffs)/.test(t))
		picks.push("tree-of-thoughts");
	if (
		/(use tools|search|web|browser|calculator|execute|run code|call api)/.test(
			t,
		)
	)
		picks.push("react");
	if (picks.length === 0) picks.push("zero-shot");

	const order: Technique[] = [
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
	return unique.slice(0, 6) as Technique[];
}

export function buildProviderTipsSection(
	provider: Provider = "gpt-5",
	style?: "markdown" | "xml",
): string {
	const p = (provider || "gpt-5").toLowerCase();
	const effectiveStyle = style || (p === "claude-4" ? "xml" : "markdown");
	const lines: string[] = [];
	lines.push(`# Model-Specific Tips`);
	lines.push("");
	if (p === "gpt-5" || p === "gpt-4.1") {
		lines.push("- Prefer Markdown with clear headings and sections");
		lines.push(
			"- Place instructions at the beginning (and optionally re-assert at the end) in long contexts",
		);
		lines.push("- Use explicit step numbering for CoT where helpful");
	} else if (p === "claude-4") {
		lines.push(
			"- Prefer XML-like structuring for clarity (e.g., <instructions>, <context>, <examples>)",
		);
		lines.push(
			"- Be very specific about expectations and use extended thinking tags where appropriate",
		);
		lines.push("- Tag documents distinctly when doing RAG");
	} else if (p === "gemini-2.5") {
		lines.push(
			"- Use consistent formatting throughout; keep queries at the end of long contexts",
		);
		lines.push("- Experiment with example quantities and placement");
	}
	lines.push("");
	lines.push(`- Preferred Style: ${effectiveStyle.toUpperCase()}`);
	lines.push("");
	lines.push(
		effectiveStyle === "xml"
			? "```xml\n<instructions>...your task...</instructions>\n<context>...data...</context>\n<output_format>JSON fields ...</output_format>\n```\n"
			: "```md\n# Instructions\n...your task...\n\n# Context\n...data...\n\n# Output Format\nJSON fields ...\n```\n",
	);
	lines.push("");
	return lines.join("\n");
}

export function buildPitfallsSection(): string {
	return `# Pitfalls to Avoid\n\n- Vague instructions → replace with precise, positive directives\n- Forced behaviors (e.g., 'always use a tool') → say 'Use tools when needed'\n- Context mixing → separate Instructions vs Data clearly\n- Limited examples → vary few-shot examples to avoid overfitting\n- Repetitive sample phrases → add 'vary language naturally'\n- Negative instructions → state what to do, not just what not to do\n\n`;
}

export function buildDisclaimer(): string {
	return `## Disclaimer\n- References to third-party tools, models, pricing, and limits are indicative and may change.\n- Validate choices with official docs and run a quick benchmark before production use.`;
}

// Shared reference section builders (centralize to avoid duplication across builders)
export function buildDesignReferencesSection(): string {
	return buildFurtherReadingSection([
		{
			title: "OKLCH Color Primer",
			url: "https://oklch.com/",
			description: "Introduction to OKLCH color space for modern design",
		},
		{
			title: "WCAG Contrast Guidelines",
			url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html",
			description: "Accessibility standards for minimum color contrast ratios",
		},
		{
			title: "Material Design Motion Principles",
			url: "https://www.material.io/design/motion/understanding-motion.html",
			description: "Best practices for interface animation and motion design",
		},
	]);
}

export function buildProjectReferencesSection(): string {
	return buildFurtherReadingSection([
		{
			title: "Project Scope Statement Best Practices",
			url: "https://www.pmi.org/learning/library/project-scope-statement-7017",
			description:
				"PMI guide to defining project scope and acceptance criteria",
		},
		{
			title: "ISO 31000 Risk Management",
			url: "https://www.iso.org/iso-31000-risk-management.html",
			description: "International standard for risk management principles",
		},
	]);
}
