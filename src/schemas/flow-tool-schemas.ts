// Tool schemas for flow-based prompting tools

import { GENERATION_TOOL_ANNOTATIONS } from "../tools/shared/annotation-presets.js";

export const promptChainingBuilderSchema = {
	name: "prompt-chaining-builder",
	description:
		"Multi-step prompt chains with output passing, dependencies, and error handling. BEST FOR: sequential workflows, chain-of-thought, multi-step analysis. OUTPUTS: Prompt chain definitions.",
	inputSchema: {
		type: "object" as const,
		properties: {
			chainName: {
				type: "string",
				description: "Name of the prompt chain",
			},
			description: {
				type: "string",
				description: "Description of what the chain accomplishes",
			},
			steps: {
				type: "array",
				items: {
					type: "object",
					properties: {
						name: { type: "string" },
						description: { type: "string" },
						prompt: { type: "string" },
						outputKey: { type: "string" },
						dependencies: {
							type: "array",
							items: { type: "string" },
						},
						errorHandling: {
							type: "string",
							enum: ["skip", "retry", "abort"],
						},
					},
					required: ["name", "prompt"],
				},
				description: "Array of chain steps",
			},
			context: {
				type: "string",
				description: "Global context for the chain",
			},
			globalVariables: {
				type: "object",
				description: "Global variables accessible to all steps",
			},
			includeMetadata: {
				type: "boolean",
				description: "Include metadata section",
			},
			includeReferences: {
				type: "boolean",
				description: "Include reference links",
			},
			includeVisualization: {
				type: "boolean",
				description: "Include Mermaid flow visualization",
			},
			executionStrategy: {
				type: "string",
				enum: ["sequential", "parallel-where-possible"],
				description: "How to execute the chain",
			},
		},
		required: ["chainName", "steps"],
	},
	annotations: {
		...GENERATION_TOOL_ANNOTATIONS,
		title: "Prompt Chain Builder",
	},
};

export const promptFlowBuilderSchema = {
	name: "prompt-flow-builder",
	description:
		"Declarative prompt flows with conditional branching, loops, and parallel execution. BEST FOR: non-linear workflows, complex orchestration, parallel processing. OUTPUTS: Prompt flow definitions.",
	inputSchema: {
		type: "object" as const,
		properties: {
			flowName: {
				type: "string",
				description: "Name of the prompt flow",
			},
			description: {
				type: "string",
				description: "Description of the flow purpose",
			},
			nodes: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique identifier for the node",
						},
						type: {
							type: "string",
							enum: [
								"prompt",
								"condition",
								"loop",
								"parallel",
								"merge",
								"transform",
							],
							description: "Node type determines required config properties",
						},
						name: {
							type: "string",
							description: "Human-readable name for the node",
						},
						description: {
							type: "string",
							description: "Optional description of the node's purpose",
						},
						config: {
							type: "object",
							description:
								"Node configuration (type-specific requirements): " +
								"prompt nodes require 'prompt' property; " +
								"condition nodes require 'expression' property; " +
								"loop nodes require either 'condition' or 'iterations' property; " +
								"parallel, merge, and transform nodes have no required config properties",
							properties: {
								prompt: {
									type: "string",
									description:
										"Required for prompt nodes: the actual prompt text",
								},
								expression: {
									type: "string",
									description:
										"Required for condition nodes: boolean expression to evaluate",
								},
								condition: {
									type: "string",
									description:
										"Required for loop nodes (alternative to iterations): condition to evaluate for loop continuation",
								},
								iterations: {
									type: "number",
									description:
										"Required for loop nodes (alternative to condition): maximum number of iterations",
								},
							},
						},
					},
					required: ["id", "type", "name"],
				},
				description:
					"Flow nodes (processing units). Each node type has specific config requirements - see config property description for details.",
			},
			edges: {
				type: "array",
				items: {
					type: "object",
					properties: {
						from: { type: "string" },
						to: { type: "string" },
						condition: { type: "string" },
						label: { type: "string" },
					},
					required: ["from", "to"],
				},
				description: "Flow edges (connections between nodes)",
			},
			entryPoint: {
				type: "string",
				description: "ID of the starting node",
			},
			variables: {
				type: "object",
				description: "Flow-level variables",
			},
			includeMetadata: {
				type: "boolean",
				description: "Include metadata section",
			},
			includeReferences: {
				type: "boolean",
				description: "Include reference links",
			},
			includeExecutionGuide: {
				type: "boolean",
				description: "Include execution guide",
			},
			outputFormat: {
				type: "string",
				enum: ["markdown", "mermaid", "both"],
				description: "Output format preference",
			},
		},
		required: ["flowName", "nodes"],
	},
	annotations: {
		...GENERATION_TOOL_ANNOTATIONS,
		title: "Prompt Flow Builder",
	},
};
