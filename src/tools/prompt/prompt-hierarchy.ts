import { z } from "zod";
import { hierarchicalPromptBuilder } from "./hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "./hierarchy-level-selector.js";
import { promptChainingBuilder } from "./prompt-chaining-builder.js";
import { promptFlowBuilder } from "./prompt-flow-builder.js";
import { promptingHierarchyEvaluator } from "./prompting-hierarchy-evaluator.js";
import { quickDeveloperPromptsBuilder } from "./quick-developer-prompts-builder.js";

/**
 * Unified Prompt Hierarchy Tool
 *
 * Consolidates prompt hierarchy tools into a single interface with mode-based routing:
 * - 'build': Create structured hierarchical prompts (context → goal → requirements)
 * - 'select': (Deprecated) Alias for 'select-level', use 'select-level' instead
 * - 'select-level': Recommend optimal hierarchy level based on task and agent characteristics
 * - 'evaluate': Score and analyze existing prompts against hierarchy criteria
 * - 'chain': Build sequential prompt chains with dependencies
 * - 'flow': Build declarative prompt flows with branching and parallelism
 * - 'quick': Generate quick developer prompts from the Best of 25 bundle
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
			"Operation mode: 'build' creates prompts, 'select-level' recommends hierarchy level (note: 'select' is deprecated, use 'select-level'), 'evaluate' scores prompts, 'chain' builds prompt chains, 'flow' builds prompt flows, 'quick' returns quick prompts",
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

	// Chain mode fields (from prompt-chaining-builder)
	chainName: z.string().optional().describe("Chain mode: Name of the chain"),
	steps: z
		.array(
			z.object({
				name: z.string(),
				description: z.string().optional(),
				prompt: z.string(),
				outputKey: z.string().optional(),
				dependencies: z.array(z.string()).optional(),
				errorHandling: z.enum(["skip", "retry", "abort"]).optional(),
			}),
		)
		.optional()
		.describe("Chain mode: Steps in the prompt chain"),
	executionStrategy: z
		.enum(["sequential", "parallel-where-possible"])
		.optional()
		.describe("Chain mode: Execution strategy"),

	// Flow mode fields (from prompt-flow-builder)
	flowName: z.string().optional().describe("Flow mode: Name of the flow"),
	nodes: z
		.array(
			z.object({
				id: z.string(),
				type: z.enum([
					"prompt",
					"condition",
					"loop",
					"parallel",
					"merge",
					"transform",
				]),
				name: z.string(),
				description: z.string().optional(),
				config: z.record(z.unknown()).optional(),
			}),
		)
		.optional()
		.describe("Flow mode: Nodes in the flow"),
	edges: z
		.array(
			z.object({
				from: z.string(),
				to: z.string(),
				condition: z.string().optional(),
			}),
		)
		.optional()
		.describe("Flow mode: Edges connecting nodes"),
	entryPoint: z.string().optional().describe("Flow mode: Entry node ID"),

	// Quick mode fields (from quick-developer-prompts-builder)
	category: z
		.enum([
			"all",
			"strategy-planning",
			"code-quality",
			"testing",
			"documentation",
			"devops",
		])
		.optional()
		.describe("Quick mode: Category of prompts to return"),

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
	includeVisualization: z
		.boolean()
		.optional()
		.describe("Include visualization (Mermaid diagrams)"),
	includeExecutionGuide: z
		.boolean()
		.optional()
		.describe("Include execution guide"),
});

export type PromptHierarchyInput = z.infer<typeof promptHierarchySchema>;

type PromptHierarchyMode = PromptHierarchyInput["mode"];

/**
 * Normalize tool results into a structured shape.
 *
 * PR #807 Review Fix: Added comprehensive documentation about precedence rules.
 *
 * Precedence rules:
 * - Top-level `mode` and `prompt` on the returned object always override any
 *   same-named fields from `result`.
 * - Metadata is merged in the following order:
 *   1) `result.metadata` (if present)
 *   2) `metadata` argument
 *   3) wrapper-controlled fields: `mode` and `source`
 *
 * This ensures callers can rely on consistent `mode`/`prompt` semantics while
 * still preserving metadata produced by underlying tools.
 */
function toStructuredResult(
	mode: PromptHierarchyMode,
	result: {
		content?: Array<{ type: string; text: string }>;
		mode?: PromptHierarchyMode;
		prompt?: string;
		metadata?: Record<string, unknown>;
	},
	metadata: Record<string, unknown> = {},
) {
	const promptText = result.content?.[0]?.text ?? "";
	const existingMetadata = (result.metadata ?? {}) as Record<string, unknown>;

	return {
		// Spread the original result first so we can override specific fields below
		...result,
		// Enforce canonical top-level fields
		mode,
		prompt: promptText,
		metadata: {
			// Preserve metadata from underlying tools
			...existingMetadata,
			// Allow caller-provided metadata to augment/override tool metadata
			...metadata,
			// Wrapper-controlled metadata fields
			source: "prompt-hierarchy",
		},
	};
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
				{ strategy: "select" },
			);

		case "evaluate":
			// Validate evaluate mode required fields
			if (!input.promptText) {
				throw new Error("Evaluate mode requires 'promptText' field");
			}
			return toStructuredResult(
				input.mode,
				await promptingHierarchyEvaluator(input),
				{ strategy: "evaluate" },
			);

		case "chain": {
			// PR #807 Review Fix: Properly delegate to prompt-chaining-builder
			if (!input.chainName || !input.steps || input.steps.length === 0) {
				throw new Error(
					"Chain mode requires 'chainName' and at least one step in 'steps'",
				);
			}
			return toStructuredResult(
				input.mode,
				await promptChainingBuilder({
					chainName: input.chainName,
					steps: input.steps,
					context: input.context,
					executionStrategy: input.executionStrategy,
					includeMetadata: input.includeMetadata,
					includeReferences: input.includeReferences,
					includeVisualization: input.includeVisualization,
				}),
				{ strategy: "chain" },
			);
		}

		case "flow": {
			// PR #807 Review Fix: Properly delegate to prompt-flow-builder
			if (!input.flowName || !input.nodes || input.nodes.length === 0) {
				throw new Error(
					"Flow mode requires 'flowName' and at least one node in 'nodes'",
				);
			}
			return toStructuredResult(
				input.mode,
				await promptFlowBuilder({
					flowName: input.flowName,
					nodes: input.nodes,
					edges: input.edges,
					entryPoint: input.entryPoint,
					includeMetadata: input.includeMetadata,
					includeReferences: input.includeReferences,
					includeExecutionGuide: input.includeExecutionGuide,
				}),
				{ strategy: "flow" },
			);
		}

		case "quick": {
			// PR #807 Review Fix: Properly delegate to quick-developer-prompts-builder
			return toStructuredResult(
				input.mode,
				await quickDeveloperPromptsBuilder({
					category: input.category ?? "all",
					includeMetadata: input.includeMetadata,
					includeFrontmatter: input.includeFrontmatter,
				}),
				{ strategy: "quick" },
			);
		}

		/* c8 ignore next 3 */
		default:
			// TypeScript ensures this is unreachable, but add for runtime safety
			throw new Error(`Unknown mode: ${String(input.mode)}`);
	}
}
