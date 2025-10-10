import { z } from "zod";
import { logger } from "../shared/logger.js";
import {
	buildMetadataSection,
	buildReferencesSection,
	slugify,
} from "../shared/prompt-utils.js";

/**
 * Schema for a flow node - represents a single step/operation in the prompt flow.
 * Inspired by claude-flow's node-based architecture for declarative AI workflows.
 *
 * Node types:
 * - prompt: Execute a prompt and capture output
 * - condition: Branch execution based on boolean expression
 * - loop: Repeat execution with iteration limit or condition
 * - parallel: Execute multiple branches concurrently
 * - merge: Synchronization point for parallel branches
 * - transform: Apply data transformation to flow state
 */
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

/**
 * Schema for flow edges - defines connections between nodes with optional conditions.
 * Edges create the control flow graph that determines execution order.
 */
const FlowEdgeSchema = z.object({
	from: z.string(),
	to: z.string(),
	condition: z.string().optional(), // Boolean expression for conditional edges
	label: z.string().optional(), // Human-readable label for visualization
});

/**
 * Main schema for prompt flow configuration.
 * Defines a declarative, graph-based approach to complex AI workflows.
 *
 * Key features:
 * - Declarative flow definition with nodes and edges
 * - Support for branching, loops, and parallel execution
 * - Automatic visualization generation (Mermaid diagrams)
 * - Built-in validation and error handling
 */
const PromptFlowSchema = z.object({
	flowName: z.string(),
	description: z.string().optional(),
	nodes: z.array(FlowNodeSchema).min(1),
	edges: z.array(FlowEdgeSchema).optional().default([]),
	entryPoint: z.string().optional(), // If not specified, uses first node
	variables: z.record(z.string()).optional().default({}), // Flow-level variables
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

/**
 * Prompt Flow Builder - Creates declarative, graph-based AI workflows
 *
 * Inspired by claude-flow's architecture, this tool enables complex prompting strategies through:
 * - Declarative flow definition with nodes and edges
 * - Conditional branching and loops for adaptive behavior
 * - Parallel execution for independent operations
 * - Automatic visualization and execution guides
 *
 * Integration with Serena patterns:
 * - Memory-aware execution (stores flow results for context retention)
 * - Mode-appropriate flow design (planning vs. execution flows)
 * - Symbol-based operations (flows can reference code symbols)
 *
 * @param args - Flow configuration (validated against PromptFlowSchema)
 * @returns Formatted flow specification with visualization and execution guide
 */
export async function promptFlowBuilder(args: unknown) {
	const input = PromptFlowSchema.parse(args);

	// Validate flow structure (edges, reachability, node configs)
	validateFlow(input);

	// Build comprehensive flow specification
	const flowSpec = buildFlowSpecification(input);

	// Generate Mermaid visualization (unless markdown-only format)
	const visualization =
		input.outputFormat !== "markdown" ? buildFlowDiagram(input) : "";

	// Include execution guide with best practices
	const executionGuide = input.includeExecutionGuide
		? buildExecutionGuide(input)
		: "";

	// Add metadata for traceability
	const metadata = input.includeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_prompt-flow-builder",
				filenameHint: `${slugify(input.flowName)}.flow.md`,
			})
		: "";

	// Include references to flow-based programming resources
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

/**
 * Validates flow structure for correctness and safety.
 *
 * Validation checks:
 * 1. Edge integrity - all edges reference existing nodes
 * 2. Entry point validity - entry point exists in node set
 * 3. Reachability analysis - detect unreachable nodes (warnings only)
 * 4. Node configuration - type-specific config requirements
 *
 * @param input - Flow configuration to validate
 * @throws Error if validation fails (invalid edges, missing configs)
 */
function validateFlow(input: PromptFlowInput): void {
	const nodeIds = new Set(input.nodes.map((n) => n.id));

	// Validate edges reference existing nodes (critical for execution)
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

	// Detect unreachable nodes (warning only - may be intentional for documentation)
	const entryNode = input.entryPoint || input.nodes[0]?.id;
	if (entryNode) {
		const reachable = findReachableNodes(entryNode, input.edges);
		const unreachable = Array.from(nodeIds).filter((id) => !reachable.has(id));
		if (unreachable.length > 0) {
			logger.warn("Unreachable nodes detected in flow", {
				unreachableNodes: unreachable,
				entryPoint: entryNode,
			});
		}
	}

	// Validate node type-specific configurations
	for (const node of input.nodes) {
		validateNodeConfig(node);
	}
}

/**
 * Validates node-specific configuration requirements.
 *
 * Each node type has different configuration requirements:
 * - condition: must have 'expression' (boolean logic)
 * - loop: must have 'condition' or 'iterations' (safety limit)
 * - prompt: must have 'prompt' (the actual prompt text)
 * - Others: no strict requirements (merge, parallel, transform are structural)
 *
 * @param node - Flow node to validate
 * @throws Error if required configuration is missing
 */
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
			// Other node types (merge, parallel, transform) don't require specific config validation
			// They are primarily structural/control flow nodes
			break;
	}
}

/**
 * Performs breadth-first search to find all reachable nodes from the start node.
 * Used to detect unreachable nodes that may indicate flow design issues.
 *
 * @param startNode - Entry point node ID
 * @param edges - Flow edges defining connections
 * @returns Set of reachable node IDs
 */
function findReachableNodes(startNode: string, edges: FlowEdge[]): Set<string> {
	const reachable = new Set<string>([startNode]);
	const queue = [startNode];

	while (queue.length > 0) {
		const current = queue.shift();
		if (!current) break; // Safety check for empty queue

		for (const edge of edges) {
			if (edge.from === current && !reachable.has(edge.to)) {
				reachable.add(edge.to);
				queue.push(edge.to);
			}
		}
	}

	return reachable;
}

/**
 * Builds human-readable flow specification with all node and edge details.
 *
 * Output includes:
 * - Flow variables (context shared across all nodes)
 * - Entry point (where execution begins)
 * - Node specifications (type, config, connections)
 * - Edge information (conditions, labels)
 *
 * @param input - Validated flow configuration
 * @returns Markdown-formatted flow specification
 */
function buildFlowSpecification(input: PromptFlowInput): string {
	let output = "";

	// Add variables if any (flow-level context available to all nodes)
	if (Object.keys(input.variables).length > 0) {
		output += "## Flow Variables\n";
		for (const [key, value] of Object.entries(input.variables)) {
			output += `- **${key}**: ${value}\n`;
		}
		output += "\n";
	}

	// Entry point (determines where flow execution begins)
	const entry = input.entryPoint || input.nodes[0]?.id;
	output += `## Entry Point\nFlow begins at node: **${entry}**\n\n`;

	// Node specifications (detailed view of each node's purpose and configuration)
	output += "## Flow Nodes\n\n";

	for (const node of input.nodes) {
		output += `### ${node.id}: ${node.name}\n\n`;
		output += `**Type**: ${node.type}\n\n`;

		if (node.description) {
			output += `**Description**: ${node.description}\n\n`;
		}

		// Node configuration (type-specific parameters)
		if (node.config && Object.keys(node.config).length > 0) {
			output += "**Configuration**:\n";
			output += "```json\n";
			output += JSON.stringify(node.config, null, 2);
			output += "\n```\n\n";
		}

		// Find outgoing edges (shows control flow from this node)
		const outgoing = input.edges.filter((e) => e.from === node.id);
		if (outgoing.length > 0) {
			output += "**Outgoing Edges**:\n";
			for (const edge of outgoing) {
				output += `- To **${edge.to}** ${edge.condition ? `(if: ${edge.condition})` : ""} ${edge.label ? `[${edge.label}]` : ""}\n`;
			}
			output += "\n";
		}

		output += "---\n\n";
	}

	return output;
}

/**
 * Generates Mermaid flowchart visualization of the prompt flow.
 *
 * Features:
 * - Node shapes based on type (diamonds for conditions, etc.)
 * - Color-coded node types for easy identification
 * - Edge styling (dashed for conditional, solid for unconditional)
 * - Comprehensive legend for interpretation
 *
 * Mermaid syntax reference: https://mermaid.js.org/syntax/flowchart.html
 *
 * @param input - Validated flow configuration
 * @returns Mermaid diagram in markdown code block with legend
 */
function buildFlowDiagram(input: PromptFlowInput): string {
	let mermaid = "## Flow Visualization\n\n```mermaid\nflowchart TD\n";

	// Add nodes with appropriate shapes based on type
	for (const node of input.nodes) {
		const shape = getNodeShape(node.type);
		const label = node.name || node.id;
		mermaid += `    ${node.id}${shape[0]}"${label}"${shape[1]}\n`;
	}

	// Add edges with conditional vs. unconditional styling
	for (const edge of input.edges) {
		const arrow = edge.condition ? "-." : "-->"; // Dashed for conditional, solid for unconditional
		const label = edge.label || edge.condition || "";
		const labelText = label ? `|"${label}"| ` : " ";
		mermaid += `    ${edge.from} ${arrow}${labelText}${edge.to}\n`;
	}

	// Style different node types with distinct colors
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

	// Add legend for node shape interpretation
	mermaid += "### Legend\n";
	mermaid += "- **Rectangle**: Prompt node\n";
	mermaid += "- **Diamond**: Condition node\n";
	mermaid += "- **Rounded**: Loop node\n";
	mermaid += "- **Parallelogram**: Parallel execution\n";
	mermaid += "- **Circle**: Merge point\n";
	mermaid += "- **Trapezoid**: Transform node\n\n";

	return mermaid;
}

/**
 * Maps node types to Mermaid shape syntax.
 *
 * Shape semantics:
 * - Rectangles: Standard operations (prompts)
 * - Diamonds: Decision points (conditions)
 * - Rounded: Iteration (loops)
 * - Parallelograms: Parallel processing
 * - Circles: Synchronization (merge)
 * - Trapezoids: Data transformation
 *
 * @param type - Node type from FlowNodeSchema
 * @returns Tuple of [opening, closing] shape delimiters
 */
function getNodeShape(type: string): [string, string] {
	switch (type) {
		case "prompt":
			return ["[", "]"]; // Rectangle
		case "condition":
			return ["{", "}"]; // Diamond
		case "loop":
			return ["(", ")"]; // Rounded
		case "parallel":
			return ["[/", "/]"]; // Parallelogram
		case "merge":
			return ["((", "))"]; // Circle
		case "transform":
			return ["[\\", "/]"]; // Trapezoid
		default:
			return ["[", "]"]; // Default to rectangle
	}
}

/**
 * Generates comprehensive execution guide for flow implementation.
 *
 * Includes:
 * - Step-by-step execution instructions
 * - Error handling strategies per node type
 * - Best practices for flow design and debugging
 * - Performance optimization tips
 *
 * Integrates Serena best practices:
 * - Planning-first approach (analyze before executing)
 * - Context management (memory optimization for long flows)
 * - Incremental execution (test nodes individually)
 *
 * @param input - Validated flow configuration
 * @returns Markdown-formatted execution guide
 */
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
	guide += "- Monitor performance and optimize bottlenecks\n";
	guide +=
		"- **Memory optimization**: Use context summarization for long flows (see memory-context-optimizer)\n";
	guide +=
		"- **Mode switching**: Select appropriate mode (planning/execution) before flow start (see mode-switcher)\n";
	guide +=
		"- **Project context**: Load relevant project memories for better results (see project-onboarding)\n\n";

	return guide;
}

/**
 * Builds references section with flow-based programming resources.
 *
 * @returns Markdown-formatted references section
 */
function buildFlowReferences(): string {
	return buildReferencesSection([
		"Flow-based Programming: https://en.wikipedia.org/wiki/Flow-based_programming",
		"AI Workflow Patterns: https://www.anthropic.com/research/prompting-patterns",
		"Claude Flow Architecture: https://github.com/ruvnet/claude-flow",
		"Prompt Engineering Workflows: https://www.promptingguide.ai/techniques",
	]);
}
