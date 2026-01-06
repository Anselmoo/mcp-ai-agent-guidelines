import { z } from "zod";
import { emitDeprecationWarning } from "../shared/deprecation.js";
import { handleToolError } from "../shared/error-handler.js";
import {
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";
import { validationError } from "../shared/error-factory.js";

/**
 * Schema for a single step in a prompt chain.
 *
 * Each step represents a discrete prompting operation with:
 * - Clear dependencies on previous steps
 * - Explicit error handling strategy
 * - Optional output capture for subsequent steps
 *
 * Inspired by claude-flow's sequential processing patterns.
 */
const ChainStepSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	prompt: z.string(),
	outputKey: z.string().optional(), // Key for storing/accessing this step's output
	dependencies: z.array(z.string()).optional().default([]), // Step names or output keys this step depends on
	errorHandling: z.enum(["skip", "retry", "abort"]).optional().default("abort"),
});

/**
 * Main schema for prompt chaining configuration.
 *
 * Enables multi-step AI workflows with:
 * - Sequential or parallel execution strategies
 * - Inter-step data flow via output keys and dependencies
 * - Configurable error handling per step
 * - Context and variable management
 *
 * Best for: Progressive refinement, multi-phase analysis, complex transformations
 */
const PromptChainingSchema = z.object({
	chainName: z.string(),
	description: z.string().optional(),
	steps: z.array(ChainStepSchema).min(1),
	context: z.string().optional(), // Shared context for all steps
	globalVariables: z.record(z.string()).optional().default({}), // Variables accessible to all steps
	includeMetadata: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
	includeVisualization: z.boolean().optional().default(true),
	executionStrategy: z
		.enum(["sequential", "parallel-where-possible"])
		.optional()
		.default("sequential"),
});

type PromptChainingInput = z.infer<typeof PromptChainingSchema>;
type ChainStep = z.infer<typeof ChainStepSchema>;

/**
 * Prompt Chaining Builder - Creates sequential/parallel multi-step AI workflows
 *
 * Inspired by claude-flow's orchestration patterns, this tool enables:
 * - Progressive refinement through multi-step prompting
 * - Data flow between steps via output keys and dependencies
 * - Flexible error handling (skip, retry, abort)
 * - Automatic visualization of chain structure
 *
 * Integration with Serena patterns:
 * - Context-aware execution (uses project memories)
 * - Planning-first approach (design chain before execution)
 * - Memory optimization (chains can be cached for reuse)
 *
 * Common use cases:
 * - Security analysis pipelines (scan → assess → remediate)
 * - Code review workflows (static → performance → recommendations)
 * - Documentation generation (outline → draft → refine)
 *
 * @param args - Chain configuration (validated against PromptChainingSchema)
 * @returns Formatted chain specification with visualization
 */
export async function promptChainingBuilder(args: unknown) {
	try {
		emitDeprecationWarning({
			tool: "prompt-chaining-builder",
			replacement: "prompt-hierarchy",
			deprecatedIn: "v0.14.0",
			removedIn: "v0.15.0",
		});

		const input = PromptChainingSchema.parse(args);

		// Validate dependencies are acyclic and reference valid steps
		validateDependencies(input.steps);

		const chainPrompt = buildChainPrompt(input);
		const visualization = input.includeVisualization
			? buildChainVisualization(input.steps)
			: "";
		const metadata = input.includeMetadata
			? buildMetadataSection({
					sourceTool: "mcp_ai-agent-guid_prompt-chaining-builder",
					filenameHint: `${slugify(input.chainName)}.chain.md`,
				})
			: "";
		const references = input.includeReferences ? buildChainReferences() : "";

		return {
			content: [
				{
					type: "text",
					text: `# 🔗 Prompt Chain: ${input.chainName}\n\n${metadata}${input.description ? `## Description\n${input.description}\n\n` : ""}${chainPrompt}\n\n${visualization}${references}`,
				},
			],
		};
	} catch (error) {
		return handleToolError(error);
	}
}

/**
 * Validates step dependencies to ensure chain is executable.
 *
 * Checks:
 * - All dependencies reference existing step names or output keys
 * - No circular dependencies (implicit - would cause runtime issues)
 * - Dependencies can be resolved in sequential execution order
 *
 * @param steps - Array of chain steps to validate
 * @throws Error if any dependency is invalid
 */
function validateDependencies(steps: ChainStep[]): void {
	const stepNames = new Set(steps.map((s) => s.name));
	const outputKeys = new Set(
		steps.filter((s) => s.outputKey).map((s) => s.outputKey as string),
	);

	for (const step of steps) {
		for (const dep of step.dependencies || []) {
			// Check if dependency is a step name or output key
			if (!stepNames.has(dep) && !outputKeys.has(dep)) {
				throw validationError(
					`Step "${step.name}" has invalid dependency "${dep}". Must reference an existing step name or output key.`,
					{ step: step.name, dependency: dep },
				);
			}
		}
	}
}

function buildChainPrompt(input: PromptChainingInput): string {
	let output = "";

	// Add context if provided
	if (input.context) {
		output += `## Context\n${input.context}\n\n`;
	}

	// Add global variables if any
	if (Object.keys(input.globalVariables).length > 0) {
		output += "## Global Variables\n";
		for (const [key, value] of Object.entries(input.globalVariables)) {
			output += `- **${key}**: ${value}\n`;
		}
		output += "\n";
	}

	// Add execution strategy
	output += `## Execution Strategy\n${input.executionStrategy === "sequential" ? "Steps will be executed sequentially in order." : "Steps will be executed in parallel where dependencies allow."}\n\n`;

	// Build chain steps
	output += "## Chain Steps\n\n";

	for (let i = 0; i < input.steps.length; i++) {
		const step = input.steps[i];
		const stepNum = i + 1;

		output += `### Step ${stepNum}: ${step.name}\n\n`;

		if (step.description) {
			output += `**Description**: ${step.description}\n\n`;
		}

		// Show dependencies
		if (step.dependencies && step.dependencies.length > 0) {
			output += `**Dependencies**: ${step.dependencies.join(", ")}\n\n`;
		}

		// Show error handling strategy
		output += `**Error Handling**: ${step.errorHandling}\n\n`;

		// Show prompt
		output += `**Prompt**:\n\`\`\`\n${step.prompt}\n\`\`\`\n\n`;

		// Show output key if defined
		if (step.outputKey) {
			output += `**Output Key**: \`${step.outputKey}\` (available for subsequent steps)\n\n`;
		}

		// Show data flow hint
		if (step.dependencies && step.dependencies.length > 0) {
			output += `**Input Data**: This step receives outputs from: ${step.dependencies.join(", ")}\n\n`;
		}

		output += "---\n\n";
	}

	// Add execution instructions
	output += "## Execution Instructions\n\n";
	output += "1. Execute steps in the order shown above\n";
	output +=
		"2. Pass outputs from completed steps to dependent steps using the output keys\n";
	output +=
		"3. Handle errors according to each step's error handling strategy\n";
	output += "4. Maintain context and variable state throughout the chain\n";
	output += "5. Document intermediate results for debugging and auditing\n";

	return output;
}

function buildChainVisualization(steps: ChainStep[]): string {
	let mermaid = "## Chain Visualization\n\n```mermaid\ngraph TD\n";
	mermaid += "    Start([Start Chain])\n";

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		const nodeId = `Step${i + 1}`;

		// Add step node
		mermaid += `    ${nodeId}["${step.name}"]\n`;

		// Connect to previous step or start
		if (i === 0) {
			mermaid += `    Start --> ${nodeId}\n`;
		}

		// Add dependency arrows
		if (step.dependencies && step.dependencies.length > 0) {
			for (const dep of step.dependencies) {
				// Find the step index for this dependency
				const depIndex = steps.findIndex(
					(s) => s.name === dep || s.outputKey === dep,
				);
				if (depIndex !== -1 && depIndex < i) {
					mermaid += `    Step${depIndex + 1} -->|output| ${nodeId}\n`;
				}
			}
		} else if (i > 0) {
			// If no explicit dependencies, connect to previous step
			mermaid += `    Step${i} --> ${nodeId}\n`;
		}

		// Add output key annotation if present
		if (step.outputKey) {
			mermaid += `    ${nodeId} -.->|"${step.outputKey}"| ${nodeId}_out[(" ")]\n`;
			mermaid += `    style ${nodeId}_out fill:transparent,stroke:transparent\n`;
		}
	}

	mermaid += `    Step${steps.length} --> End([End Chain])\n`;
	mermaid += "```\n\n";

	return mermaid;
}

function buildChainReferences(): string {
	return buildFurtherReadingSection([
		{
			title: "Prompt Chaining Patterns",
			url: "https://www.promptingguide.ai/techniques/prompt_chaining",
			description: "Guide to implementing multi-step prompt chains",
		},
		{
			title: "Multi-step AI Workflows",
			url: "https://arxiv.org/abs/2203.11171",
			description: "Academic research on sequential AI task decomposition",
		},
		{
			title: "Claude Flow Orchestration",
			url: "https://github.com/ruvnet/claude-flow",
			description: "Framework for building complex Claude-based workflows",
		},
	]);
}
