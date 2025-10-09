import { z } from "zod";
import {
	buildMetadataSection,
	buildReferencesSection,
	slugify,
} from "../shared/prompt-utils.js";

const ChainStepSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	prompt: z.string(),
	outputKey: z.string().optional(),
	dependencies: z.array(z.string()).optional().default([]),
	errorHandling: z.enum(["skip", "retry", "abort"]).optional().default("abort"),
});

const PromptChainingSchema = z.object({
	chainName: z.string(),
	description: z.string().optional(),
	steps: z.array(ChainStepSchema).min(1),
	context: z.string().optional(),
	globalVariables: z.record(z.string()).optional().default({}),
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

export async function promptChainingBuilder(args: unknown) {
	const input = PromptChainingSchema.parse(args);

	// Validate dependencies
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
}

function validateDependencies(steps: ChainStep[]): void {
	const stepNames = new Set(steps.map((s) => s.name));
	const outputKeys = new Set(
		steps.filter((s) => s.outputKey).map((s) => s.outputKey as string),
	);

	for (const step of steps) {
		for (const dep of step.dependencies || []) {
			// Check if dependency is a step name
			if (!stepNames.has(dep) && !outputKeys.has(dep)) {
				throw new Error(
					`Step "${step.name}" has invalid dependency "${dep}". Must reference an existing step name or output key.`,
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
		const cleanName = step.name.replace(/[^a-zA-Z0-9]/g, "_");

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
	return buildReferencesSection([
		"Prompt Chaining Patterns: https://www.promptingguide.ai/techniques/prompt_chaining",
		"Multi-step AI Workflows: https://arxiv.org/abs/2203.11171",
		"Claude Flow Orchestration: https://github.com/ruvnet/claude-flow",
	]);
}
