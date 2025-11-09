import { z } from "zod";
import { DEFAULT_MODEL } from "../config/model-config.js";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildMetadataSection,
} from "../shared/prompt-utils.js";

// Mode enum for YAML frontmatter
const ModeEnum = z.enum(["agent", "tool", "workflow"]);

// Category enum for the 5 prompt categories
const CategoryEnum = z.enum([
	"strategy",
	"code-quality",
	"testing",
	"documentation",
	"devops",
	"all",
]);

const QuickDeveloperPromptsSchema = z.object({
	category: CategoryEnum.optional().default("all"),
	mode: ModeEnum.optional().default("tool"),
	model: z.string().optional().default(DEFAULT_MODEL),
	tools: z
		.array(z.string())
		.optional()
		.default(["codebase", "githubRepo", "editFiles"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),
});

type QuickDeveloperPromptsInput = z.infer<typeof QuickDeveloperPromptsSchema>;

// Define the 25 prompts organized by category
const PROMPT_CATEGORIES = {
	strategy: {
		title: "Strategy & High-Level Planning",
		prompts: [
			"List the 5 biggest **gaps** in the current project/feature.",
			"Identify the 5 biggest **opportunities** for improvement or growth.",
			"Outline the 5 most critical **next steps** to finish the current goal.",
			"Detail the top 5 **risks or concerns** that could impede progress.",
			"Summarize 5 key indicators of tangible **progress** made so far.",
		],
	},
	"code-quality": {
		title: "Code Quality & Refactoring",
		prompts: [
			"Suggest 5 immediate **code quality improvements**.",
			"Pinpoint 5 potential **technical debt hotspots** to address.",
			"Find 5 opportunities for **code reuse or simplification**.",
			"Propose 5 improvements for **variable or function naming**.",
			"Identify 5 areas to make code more **resilient or fault-tolerant**.",
		],
	},
	testing: {
		title: "Testing & Validation",
		prompts: [
			"List 5 critical user flows that need **end-to-end testing**.",
			"Brainstorm 5 edge cases that could **break the current logic**.",
			"Identify the 5 most likely **bugs** in this module.",
			"Suggest 5 **last-minute QA steps** to perform before deployment.",
			"Outline 5 key **security checks** relevant to this code.",
		],
	},
	documentation: {
		title: "Documentation & Onboarding",
		prompts: [
			"List 5 essential things to **document for new users** or developers.",
			"Create a 5-item **quick onboarding checklist** for this module.",
			"Suggest 5 helpful **peer review tips** for this change type.",
			"Name 5 stakeholders/teams who should be **notified** of this change.",
			"Propose 5 questions to ask in a **design/architecture review**.",
		],
	},
	devops: {
		title: "DevOps & Automation",
		prompts: [
			"Identify 5 potential **deployment blockers**.",
			"Suggest 5 manual processes that could be **automated** in this workflow.",
			"List 5 potential **configuration pitfalls** in the environment.",
			"Outline 5 key **monitoring metrics or alerts** to set up.",
			"Describe 5 steps for a safe **rollback plan** if things go wrong.",
		],
	},
};

function buildQuickPromptsFrontmatter(
	input: QuickDeveloperPromptsInput,
): string {
	const desc = "Quick developer prompts for rapid analysis and progress checks";
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

function buildQuickPromptsContent(input: QuickDeveloperPromptsInput): string {
	let content = "# Best of 25: Quick Developer Prompts\n\n";
	content +=
		"Ultra-efficient checklist prompts for rapid code, design, and planning analysis.\n\n";

	const categories =
		input.category === "all"
			? Object.keys(PROMPT_CATEGORIES)
			: [input.category];

	for (const catKey of categories) {
		const category =
			PROMPT_CATEGORIES[catKey as keyof typeof PROMPT_CATEGORIES];
		content += `## ${category.title}\n\n`;

		for (const prompt of category.prompts) {
			content += `- [ ] ${prompt}\n`;
		}
		content += "\n";
	}

	content += "---\n\n";
	content +=
		"**Usage:** Copy these prompts into your chat or code review flow. Each prompt is designed to be concise (<20 tokens) and actionable, minimizing cost while maximizing insight.\n\n";
	content +=
		"**Tip:** Check off items as you complete them, or use selected prompts for quick situational analysis.\n";

	return content;
}

export async function quickDeveloperPromptsBuilder(args: unknown) {
	const input = QuickDeveloperPromptsSchema.parse(args);

	// If enforcing *.prompt.md style, ensure frontmatter + metadata are on
	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const promptContent = buildQuickPromptsContent(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildQuickPromptsFrontmatter(input)}\n`
		: "";
	const filenameHint = `quick-developer-prompts-${input.category}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_quick-developer-prompts-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	const fullContent = `${frontmatter}## 🚀 Quick Developer Prompts Bundle\n\n${metadata}\n${promptContent}`;

	return {
		content: [
			{
				type: "text",
				text: fullContent,
			},
		],
	};
}
