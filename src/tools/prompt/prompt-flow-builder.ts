import { z } from "zod";
import {
	buildMetadataSection,
	buildReferencesSection,
	slugify,
} from "../shared/prompt-utils.js";

const FlowNodeSchema = z.object({
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
	config: z.record(z.any()).optional(),
});

const FlowEdgeSchema = z.object({
	from: z.string(),
	to: z.string(),
	condition: z.string().optional(),
	label: z.string().optional(),
});

const PromptFlowSchema = z.object({
	flowName: z.string(),
	description: z.string().optional(),
	nodes: z.array(FlowNodeSchema).min(1),
	edges: z.array(FlowEdgeSchema).optional().default([]),
	entryPoint: z.string().optional(),
	variables: z.record(z.string()).optional().default({}),
	includeMetadata: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
	includeExecutionGuide: z.boolean().optional().default(true),
	outputFormat: z
		.enum(["markdown", "mermaid", "both"])
		.optional()
		.default("both"),
});

type PromptFlowInput = z.infer<typeof PromptFlowSchema>;
type FlowNode = z.infer<typeof FlowNodeSchema>;
type FlowEdge = z.infer<typeof FlowEdgeSchema>;

export async function promptFlowBuilder(args: unknown) {
	const input = PromptFlowSchema.parse(args);

	// Validate flow structure
	validateFlow(input);

	const flowSpec = buildFlowSpecification(input);
	const visualization =
		input.outputFormat !== "markdown" ? buildFlowDiagram(input) : "";
	const executionGuide = input.includeExecutionGuide
		? buildExecutionGuide(input)
		: "";
	const metadata = input.includeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_prompt-flow-builder",
				filenameHint: `${slugify(input.flowName)}.flow.md`,
			})
		: "";
	const references = input.includeReferences ? buildFlowReferences() : "";

	return {
		content: [
			{
				type: "text",
				text: `# 🌊 Prompt Flow: ${input.flowName}\n\n${metadata}${input.description ? `## Description\n${input.description}\n\n` : ""}${flowSpec}\n\n${visualization}${executionGuide}${references}`,
			},
		],
	};
}

function validateFlow(input: PromptFlowInput): void {
	const nodeIds = new Set(input.nodes.map((n) => n.id));

	// Validate edges reference existing nodes
	for (const edge of input.edges) {
		if (!nodeIds.has(edge.from)) {
			throw new Error(`Edge references non-existent node: ${edge.from}`);
		}
		if (!nodeIds.has(edge.to)) {
			throw new Error(`Edge references non-existent node: ${edge.to}`);
		}
	}

	// Validate entry point if specified
	if (input.entryPoint && !nodeIds.has(input.entryPoint)) {
		throw new Error(
			`Entry point references non-existent node: ${input.entryPoint}`,
		);
	}

	// Detect unreachable nodes
	const entryNode = input.entryPoint || input.nodes[0]?.id;
	if (entryNode) {
		const reachable = findReachableNodes(entryNode, input.edges);
		const unreachable = Array.from(nodeIds).filter((id) => !reachable.has(id));
		if (unreachable.length > 0) {
			console.warn(
				`Warning: Unreachable nodes detected: ${unreachable.join(", ")}`,
			);
		}
	}

	// Validate node type-specific configurations
	for (const node of input.nodes) {
		validateNodeConfig(node);
	}
}

function validateNodeConfig(node: FlowNode): void {
	switch (node.type) {
		case "condition":
			if (!node.config?.expression) {
				throw new Error(
					`Condition node "${node.id}" must have an expression in config`,
				);
			}
			break;
		case "loop":
			if (!node.config?.condition && !node.config?.iterations) {
				throw new Error(
					`Loop node "${node.id}" must have either condition or iterations in config`,
				);
			}
			break;
		case "prompt":
			if (!node.config?.prompt) {
				throw new Error(
					`Prompt node "${node.id}" must have a prompt in config`,
				);
			}
			break;
		default:
			// Other node types don't require specific config validation
			break;
	}
}

function findReachableNodes(startNode: string, edges: FlowEdge[]): Set<string> {
	const reachable = new Set<string>([startNode]);
	const queue = [startNode];

	while (queue.length > 0) {
		const current = queue.shift()!;
		for (const edge of edges) {
			if (edge.from === current && !reachable.has(edge.to)) {
				reachable.add(edge.to);
				queue.push(edge.to);
			}
		}
	}

	return reachable;
}

function buildFlowSpecification(input: PromptFlowInput): string {
	let output = "";

	// Add variables if any
	if (Object.keys(input.variables).length > 0) {
		output += "## Flow Variables\n";
		for (const [key, value] of Object.entries(input.variables)) {
			output += `- **${key}**: ${value}\n`;
		}
		output += "\n";
	}

	// Entry point
	const entry = input.entryPoint || input.nodes[0]?.id;
	output += `## Entry Point\nFlow begins at node: **${entry}**\n\n`;

	// Node specifications
	output += "## Flow Nodes\n\n";

	for (const node of input.nodes) {
		output += `### ${node.id}: ${node.name}\n\n`;
		output += `**Type**: ${node.type}\n\n`;

		if (node.description) {
			output += `**Description**: ${node.description}\n\n`;
		}

		// Node configuration
		if (node.config && Object.keys(node.config).length > 0) {
			output += "**Configuration**:\n";
			output += "```json\n";
			output += JSON.stringify(node.config, null, 2);
			output += "\n```\n\n";
		}

		// Find outgoing edges
		const outgoing = input.edges.filter((e) => e.from === node.id);
		if (outgoing.length > 0) {
			output += "**Outgoing Edges**:\n";
			for (const edge of outgoing) {
				const label = edge.label || edge.condition || "→";
				output += `- To **${edge.to}** ${edge.condition ? `(if: ${edge.condition})` : ""} ${edge.label ? `[${edge.label}]` : ""}\n`;
			}
			output += "\n";
		}

		output += "---\n\n";
	}

	return output;
}

function buildFlowDiagram(input: PromptFlowInput): string {
	let mermaid = "## Flow Visualization\n\n```mermaid\nflowchart TD\n";

	// Add nodes with appropriate shapes based on type
	for (const node of input.nodes) {
		const shape = getNodeShape(node.type);
		const label = node.name || node.id;
		mermaid += `    ${node.id}${shape[0]}"${label}"${shape[1]}\n`;
	}

	// Add edges
	for (const edge of input.edges) {
		const arrow = edge.condition ? "-." : "-->";
		const label = edge.label || edge.condition || "";
		const labelText = label ? `|"${label}"| ` : " ";
		mermaid += `    ${edge.from} ${arrow}${labelText}${edge.to}\n`;
	}

	// Style different node types
	const conditionNodes = input.nodes
		.filter((n) => n.type === "condition")
		.map((n) => n.id);
	const loopNodes = input.nodes
		.filter((n) => n.type === "loop")
		.map((n) => n.id);
	const parallelNodes = input.nodes
		.filter((n) => n.type === "parallel")
		.map((n) => n.id);

	if (conditionNodes.length > 0) {
		mermaid += `    style ${conditionNodes.join(",")} fill:#ffe6cc,stroke:#d79b00\n`;
	}
	if (loopNodes.length > 0) {
		mermaid += `    style ${loopNodes.join(",")} fill:#dae8fc,stroke:#6c8ebf\n`;
	}
	if (parallelNodes.length > 0) {
		mermaid += `    style ${parallelNodes.join(",")} fill:#e1d5e7,stroke:#9673a6\n`;
	}

	mermaid += "```\n\n";

	// Add legend
	mermaid += "### Legend\n";
	mermaid += "- **Rectangle**: Prompt node\n";
	mermaid += "- **Diamond**: Condition node\n";
	mermaid += "- **Rounded**: Loop node\n";
	mermaid += "- **Parallelogram**: Parallel execution\n";
	mermaid += "- **Circle**: Merge point\n";
	mermaid += "- **Trapezoid**: Transform node\n\n";

	return mermaid;
}

function getNodeShape(type: string): [string, string] {
	switch (type) {
		case "prompt":
			return ["[", "]"];
		case "condition":
			return ["{", "}"];
		case "loop":
			return ["(", ")"];
		case "parallel":
			return ["[/", "/]"];
		case "merge":
			return ["((", "))"];
		case "transform":
			return ["[\\", "/]"];
		default:
			return ["[", "]"];
	}
}

function buildExecutionGuide(input: PromptFlowInput): string {
	let guide = "## Execution Guide\n\n";

	guide += "### How to Execute This Flow\n\n";
	guide += "1. **Initialize** flow variables and context\n";
	guide += `2. **Start** at the entry point (${input.entryPoint || input.nodes[0]?.id})\n`;
	guide += "3. **Execute** each node according to its type:\n";
	guide += "   - **Prompt nodes**: Execute the prompt and capture output\n";
	guide +=
		"   - **Condition nodes**: Evaluate condition and branch accordingly\n";
	guide +=
		"   - **Loop nodes**: Repeat until condition is met or max iterations reached\n";
	guide += "   - **Parallel nodes**: Execute branches concurrently\n";
	guide += "   - **Merge nodes**: Wait for all inputs before proceeding\n";
	guide += "   - **Transform nodes**: Apply transformation to data\n";
	guide += "4. **Track** intermediate results and state\n";
	guide += "5. **Handle** errors gracefully with fallbacks\n";
	guide += "6. **Log** execution path for debugging\n\n";

	guide += "### Error Handling\n\n";
	guide += "- Implement try-catch blocks around each node execution\n";
	guide += "- For condition nodes, ensure boolean evaluation is safe\n";
	guide +=
		"- For loop nodes, enforce max iteration limits to prevent infinite loops\n";
	guide += "- For parallel nodes, handle partial failures gracefully\n\n";

	guide += "### Best Practices\n\n";
	guide += "- Keep prompts modular and focused on single responsibilities\n";
	guide += "- Use descriptive node names and edge labels\n";
	guide += "- Document complex conditions and transformations\n";
	guide += "- Test flows with edge cases and error scenarios\n";
	guide += "- Monitor performance and optimize bottlenecks\n\n";

	return guide;
}

function buildFlowReferences(): string {
	return buildReferencesSection([
		"Flow-based Programming: https://en.wikipedia.org/wiki/Flow-based_programming",
		"AI Workflow Patterns: https://www.anthropic.com/research/prompting-patterns",
		"Claude Flow Architecture: https://github.com/ruvnet/claude-flow",
		"Prompt Engineering Workflows: https://www.promptingguide.ai/techniques",
	]);
}
