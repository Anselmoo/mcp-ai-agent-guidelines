#!/usr/bin/env node

/**
 * AI Agent Development Guidelines MCP Server
 *
 * This MCP server provides tools, resources, and prompts for implementing
 * AI agent best practices including hierarchical prompting, code hygiene
 * analysis, mermaid diagram generation, memory optimization, and sprint planning.
 */

// Dynamic version from package.json using createRequire for ESM compatibility
import { createRequire } from "node:module";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires -- acceptable for package metadata
const pkg = require("../package.json");

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	GetPromptRequestSchema,
	ListPromptsRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
// Import prompts
import { getPrompt, listPrompts } from "./prompts/index.js";
// Import resources
import { getResource, listResources } from "./resources/index.js";
import { codeHygieneAnalyzer } from "./tools/code-hygiene-analyzer.js";
import { guidelinesValidator } from "./tools/guidelines-validator.js";
// Import tool implementations
import { hierarchicalPromptBuilder } from "./tools/hierarchical-prompt-builder.js";
import { memoryContextOptimizer } from "./tools/memory-context-optimizer.js";
import { mermaidDiagramGenerator } from "./tools/mermaid-diagram-generator.js";
import { modelCompatibilityChecker } from "./tools/model-compatibility-checker.js";
import { sprintTimelineCalculator } from "./tools/sprint-timeline-calculator.js";

const server = new Server(
	{
		name: "ai-agent-guidelines",
		version: pkg.version,
	},
	{
		capabilities: {
			tools: {},
			resources: {},
			prompts: {},
		},
	},
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: "hierarchical-prompt-builder",
				description:
					"Build structured prompts with clear hierarchies and layers of specificity",
				inputSchema: {
					type: "object",
					properties: {
						context: {
							type: "string",
							description: "The broad context or domain",
						},
						goal: {
							type: "string",
							description: "The specific goal or objective",
						},
						requirements: {
							type: "array",
							items: { type: "string" },
							description: "Detailed requirements and constraints",
						},
						outputFormat: {
							type: "string",
							description: "Desired output format",
						},
						audience: {
							type: "string",
							description: "Target audience or expertise level",
						},
						includeDisclaimer: {
							type: "boolean",
							description: "Append a third-party disclaimer section",
						},
						includeReferences: {
							type: "boolean",
							description: "Append a short references list",
						},
					},
					required: ["context", "goal"],
				},
			},
			{
				name: "code-hygiene-analyzer",
				description:
					"Analyze codebase for outdated patterns, unused dependencies, and code hygiene issues",
				inputSchema: {
					type: "object",
					properties: {
						codeContent: {
							type: "string",
							description: "Code content to analyze",
						},
						language: { type: "string", description: "Programming language" },
						framework: {
							type: "string",
							description: "Framework or technology stack",
						},
						includeReferences: {
							type: "boolean",
							description: "Include external best-practice links",
						},
					},
					required: ["codeContent", "language"],
				},
			},
			{
				name: "mermaid-diagram-generator",
				description:
					"Generate Mermaid diagrams from text descriptions following best practices",
				inputSchema: {
					type: "object",
					properties: {
						description: {
							type: "string",
							description: "Description of the system or process to diagram",
						},
						diagramType: {
							type: "string",
							enum: ["flowchart", "sequence", "class", "state", "gantt", "pie"],
							description: "Type of diagram to generate",
						},
						theme: {
							type: "string",
							description: "Visual theme for the diagram",
						},
						accTitle: {
							type: "string",
							description: "Accessibility title (added as a Mermaid comment)",
						},
						accDescr: {
							type: "string",
							description:
								"Accessibility description (added as a Mermaid comment)",
						},
					},
					required: ["description", "diagramType"],
				},
			},
			{
				name: "memory-context-optimizer",
				description:
					"Optimize prompt caching and context window usage for AI agents",
				inputSchema: {
					type: "object",
					properties: {
						contextContent: {
							type: "string",
							description: "Context content to optimize",
						},
						maxTokens: { type: "number", description: "Maximum token limit" },
						cacheStrategy: {
							type: "string",
							enum: ["aggressive", "conservative", "balanced"],
							description: "Caching strategy",
						},
						includeReferences: {
							type: "boolean",
							description: "Include external links on caching",
						},
					},
					required: ["contextContent"],
				},
			},
			{
				name: "sprint-timeline-calculator",
				description:
					"Calculate optimal development cycles and sprint timelines",
				inputSchema: {
					type: "object",
					properties: {
						tasks: {
							type: "array",
							items: { type: "object" },
							description: "List of tasks with estimates",
						},
						teamSize: { type: "number", description: "Number of team members" },
						sprintLength: {
							type: "number",
							description: "Sprint length in days",
						},
						velocity: {
							type: "number",
							description: "Team velocity (story points per sprint)",
						},
					},
					required: ["tasks", "teamSize"],
				},
			},
			{
				name: "model-compatibility-checker",
				description:
					"Recommend best AI models for specific tasks and requirements",
				inputSchema: {
					type: "object",
					properties: {
						taskDescription: {
							type: "string",
							description: "Description of the task",
						},
						requirements: {
							type: "array",
							items: { type: "string" },
							description:
								"Specific requirements (context length, multimodal, etc.)",
						},
						budget: {
							type: "string",
							enum: ["low", "medium", "high"],
							description: "Budget constraints",
						},
						language: {
							type: "string",
							description:
								"Preferred language for example snippets (e.g., typescript, python)",
						},
						includeReferences: {
							type: "boolean",
							description: "Include external documentation links",
						},
						includeCodeExamples: {
							type: "boolean",
							description: "Include language-specific example snippets",
						},
						linkFiles: {
							type: "boolean",
							description:
								"Include links to relevant files/resources in this repo",
						},
					},
					required: ["taskDescription"],
				},
			},
			{
				name: "guidelines-validator",
				description:
					"Validate development practices against established AI agent guidelines",
				inputSchema: {
					type: "object",
					properties: {
						practiceDescription: {
							type: "string",
							description: "Description of the development practice",
						},
						category: {
							type: "string",
							enum: [
								"prompting",
								"code-management",
								"architecture",
								"visualization",
								"memory",
								"workflow",
							],
							description: "Category of practice to validate",
						},
					},
					required: ["practiceDescription", "category"],
				},
			},
		],
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	try {
		switch (name) {
			case "hierarchical-prompt-builder":
				return hierarchicalPromptBuilder(args);
			case "code-hygiene-analyzer":
				return codeHygieneAnalyzer(args);
			case "mermaid-diagram-generator":
				return mermaidDiagramGenerator(args);
			case "memory-context-optimizer":
				return memoryContextOptimizer(args);
			case "sprint-timeline-calculator":
				return sprintTimelineCalculator(args);
			case "model-compatibility-checker":
				return modelCompatibilityChecker(args);
			case "guidelines-validator":
				return guidelinesValidator(args);
			default:
				throw new Error(`Unknown tool: ${name}`);
		}
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
		};
	}
});

// Register resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
	return { resources: await listResources() };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
	const { uri } = request.params;
	return await getResource(uri);
});

// Register prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => {
	return { prompts: await listPrompts() };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;
	return await getPrompt(name, args || {});
});

// Start the server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("MCP AI Agent Guide Server running on stdio");
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
