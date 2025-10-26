import { z } from "zod";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildMetadataSection,
	buildReferencesSection,
	slugify,
} from "../shared/prompt-utils.js";

const CodeAnalysisPromptSchema = z.object({
	codebase: z.string().describe("The codebase or code snippet to analyze"),
	focusArea: z
		.enum(["security", "performance", "maintainability", "general"])
		.optional()
		.default("general")
		.describe(
			"Specific area to focus on (security, performance, maintainability)",
		),
	language: z
		.string()
		.optional()
		.default("auto-detect")
		.describe("Programming language of the code"),
	// Optional frontmatter controls
	mode: z.enum(["agent", "tool", "workflow"]).optional().default("agent"),
	model: z.string().optional().default("GPT-4.1"),
	tools: z.array(z.string()).optional().default(["codebase", "editFiles"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(false),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),
});

type CodeAnalysisPromptInput = z.infer<typeof CodeAnalysisPromptSchema>;

function buildCodeAnalysisPrompt(input: CodeAnalysisPromptInput): string {
	const { codebase, focusArea, language } = input;

	return `# Code Analysis Request

## Context
You are an expert code reviewer analyzing ${language} code with a focus on ${focusArea} aspects.

## Code to Analyze
\`\`\`${language}
${codebase}
\`\`\`

## Analysis Requirements
1. **Code Quality Assessment**
   - Readability and maintainability
   - Code structure and organization
   - Naming conventions and clarity

2. **${focusArea === "security" ? "Security Analysis" : focusArea === "performance" ? "Performance Analysis" : "Maintainability Analysis"}**
   ${
			focusArea === "security"
				? "- Identify potential security vulnerabilities\n   - Check for input validation issues\n   - Review authentication and authorization\n   - Analyze data exposure risks"
				: focusArea === "performance"
					? "- Identify performance bottlenecks\n   - Analyze algorithm complexity\n   - Review resource usage patterns\n   - Suggest optimization opportunities"
					: "- Assess code maintainability\n   - Check for code duplication\n   - Review module coupling\n   - Analyze technical debt"
		}

3. **Best Practices Compliance**
   - Language-specific best practices
   - Design pattern usage
   - Error handling implementation

## Output Format
- **Summary**: Brief overview of code quality
- **Issues Found**: List of specific issues with severity levels
- **Recommendations**: Actionable improvement suggestions
- **Code Examples**: Improved code snippets where applicable

## Scoring
Provide an overall score from 1-10 for:
- Code Quality
- ${focusArea ? focusArea.charAt(0).toUpperCase() + focusArea.slice(1) : "General"}
- Best Practices Adherence`;
}

function buildCodeAnalysisFrontmatter(input: CodeAnalysisPromptInput): string {
	const desc = `Code analysis with focus on ${input.focusArea}`;
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function codeAnalysisPromptBuilder(args: unknown) {
	const input = CodeAnalysisPromptSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildCodeAnalysisPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildCodeAnalysisFrontmatter(input)}\n`
		: "";
	const references = input.includeReferences
		? buildReferencesSection([
				"Code Review Best Practices: https://google.github.io/eng-practices/review/",
			])
		: "";
	const filenameHint = `${slugify(`code-analysis-${input.focusArea}`)}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_code-analysis-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🔍 Code Analysis Prompt\n\n${metadata}\n${prompt}\n\n${references ? `${references}\n` : ""}`,
			},
		],
	};
}
