import { z } from "zod";
import { hierarchicalPromptBuilder } from "./hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "./hierarchy-level-selector.js";
import { promptingHierarchyEvaluator } from "./prompting-hierarchy-evaluator.js";

/**
 * Unified Prompt Hierarchy Tool
 *
 * Consolidates three prompt hierarchy tools into a single interface with mode-based routing:
 * - 'build': Create structured hierarchical prompts (context → goal → requirements)
 * - 'select': Recommend optimal hierarchy level based on task and agent characteristics
 * - 'evaluate': Score and analyze existing prompts against hierarchy criteria
 *
 * This tool provides a unified API for all prompt hierarchy operations while maintaining
 * backward compatibility with existing tool implementations.
 */

// Define the unified schema with mode-specific optional fields
export const promptHierarchySchema = z.object({
	mode: z
		.enum([
			"build",
			"select",
			"select-level",
			"evaluate",
			"chain",
			"flow",
			"quick",
		])
		.describe(
			"Operation mode: 'build' creates prompts, 'select-level' recommends hierarchy level, 'evaluate' scores prompts, 'chain' builds prompt chains, 'flow' builds prompt flows, 'quick' returns quick prompts",
		),

	// Build mode fields (from hierarchical-prompt-builder)
	context: z
		.string()
		.optional()
		.describe("Build mode: Broad context or domain"),
	goal: z
		.string()
		.optional()
		.describe("Build mode: Specific goal or objective"),
	requirements: z
		.array(z.string())
		.optional()
		.describe("Build mode: Detailed requirements and constraints"),
	outputFormat: z
		.string()
		.optional()
		.describe("Build mode: Desired output format"),
	audience: z
		.string()
		.optional()
		.describe("Build mode: Target audience or expertise level"),

	// Select mode fields (from hierarchy-level-selector)
	taskDescription: z
		.string()
		.optional()
		.describe("Select mode: Description of the task"),
	agentCapability: z
		.enum(["novice", "intermediate", "advanced", "expert"])
		.optional()
		.describe("Select mode: Agent's capability level"),
	taskComplexity: z
		.enum(["simple", "moderate", "complex", "very-complex"])
		.optional()
		.describe("Select mode: Task complexity level"),
	autonomyPreference: z
		.enum(["low", "medium", "high"])
		.optional()
		.describe("Select mode: Desired autonomy level"),

	// Evaluate mode fields (from prompting-hierarchy-evaluator)
	promptText: z
		.string()
		.optional()
		.describe("Evaluate mode: The prompt text to evaluate"),
	targetLevel: z
		.enum([
			"independent",
			"indirect",
			"direct",
			"modeling",
			"scaffolding",
			"full-physical",
		])
		.optional()
		.describe("Evaluate mode: Expected hierarchy level"),

	// Shared optional fields
	includeExamples: z
		.boolean()
		.optional()
		.describe("Include examples in output"),
	includeReferences: z.boolean().optional().describe("Include reference links"),
	includeRecommendations: z
		.boolean()
		.optional()
		.describe("Include improvement recommendations"),
	includeMetadata: z.boolean().optional().describe("Include metadata section"),
	includeFrontmatter: z
		.boolean()
		.optional()
		.describe("Include YAML frontmatter"),
	includeDisclaimer: z
		.boolean()
		.optional()
		.describe("Include disclaimer section"),
});

export type PromptHierarchyInput = z.infer<typeof promptHierarchySchema>;

type PromptHierarchyMode = PromptHierarchyInput["mode"];

function toStructuredResult(
	mode: PromptHierarchyMode,
	result: { content?: Array<{ type: string; text: string }> },
	metadata: Record<string, unknown> = {},
) {
	const promptText = result.content?.[0]?.text ?? "";
	return {
		...result,
		mode,
		prompt: promptText,
		metadata: {
			mode,
			source: "prompt-hierarchy",
			...metadata,
		},
	};
}

function buildFallbackPrompt(
	mode: Exclude<
		PromptHierarchyMode,
		"build" | "select" | "select-level" | "evaluate"
	>,
	input: PromptHierarchyInput,
) {
	const task = input.taskDescription || input.goal || input.context || "task";
	const heading =
		mode === "chain"
			? "Prompt Chain"
			: mode === "flow"
				? "Prompt Flow"
				: "Quick Prompt Pack";
	return `# ${heading}\n${task}`;
}

/**
 * Unified prompt hierarchy tool handler
 * Routes to appropriate sub-tool based on mode parameter
 */
export async function promptHierarchy(args: unknown) {
	// Parse and validate the input
	const input = promptHierarchySchema.parse(args);

	// Route to the appropriate tool based on mode
	switch (input.mode) {
		case "build":
			// Validate build mode required fields
			if (!input.context || !input.goal) {
				throw new Error("Build mode requires 'context' and 'goal' fields");
			}
			return toStructuredResult(
				input.mode,
				await hierarchicalPromptBuilder({
					...input,
					mode: "tool",
				}),
				{ strategy: "build" },
			);

		case "select":
		case "select-level":
			// Validate select mode required fields
			if (!input.taskDescription) {
				throw new Error("Select mode requires 'taskDescription' field");
			}
			return toStructuredResult(
				input.mode,
				await hierarchyLevelSelector(input),
				{
					strategy: "select",
				},
			);

		case "evaluate":
			// Validate evaluate mode required fields
			if (!input.promptText) {
				throw new Error("Evaluate mode requires 'promptText' field");
			}
			return toStructuredResult(
				input.mode,
				await promptingHierarchyEvaluator(input),
				{
					strategy: "evaluate",
				},
			);

		case "chain":
		case "flow":
		case "quick": {
			const fallback = {
				content: [
					{
						type: "text",
						text: buildFallbackPrompt(input.mode, input),
					},
				],
			};
			return toStructuredResult(input.mode, fallback, { strategy: input.mode });
		}

		/* c8 ignore next 3 */
		default:
			// TypeScript ensures this is unreachable, but add for runtime safety
			throw new Error(`Unknown mode: ${input.mode}`);
	}
}
