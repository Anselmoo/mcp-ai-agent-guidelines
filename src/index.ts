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
import { gapFrameworksAnalyzers } from "./tools/analysis/gap-frameworks-analyzers.js";
import { strategyFrameworksBuilder } from "./tools/analysis/strategy-frameworks-builder.js";
import { codeHygieneAnalyzer } from "./tools/code-hygiene-analyzer.js";
import { guidelinesValidator } from "./tools/guidelines-validator.js";
import { memoryContextOptimizer } from "./tools/memory-context-optimizer.js";
import { mermaidDiagramGenerator } from "./tools/mermaid-diagram-generator.js";
import { modelCompatibilityChecker } from "./tools/model-compatibility-checker.js";
import { domainNeutralPromptBuilder } from "./tools/prompt/domain-neutral-prompt-builder.js";
// Import tool implementations
import { hierarchicalPromptBuilder } from "./tools/prompt/hierarchical-prompt-builder.js";
import { securityHardeningPromptBuilder } from "./tools/prompt/security-hardening-prompt-builder.js";
import { sparkPromptBuilder } from "./tools/prompt/spark-prompt-builder.js";
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
						// 2025 techniques integration
						techniques: {
							type: "array",
							items: {
								type: "string",
								enum: [
									"zero-shot",
									"few-shot",
									"chain-of-thought",
									"self-consistency",
									"in-context-learning",
									"generate-knowledge",
									"prompt-chaining",
									"tree-of-thoughts",
									"meta-prompting",
									"rag",
									"react",
									"art",
								],
							},
							description: "Optional list of technique hints to include",
						},
						includeTechniqueHints: {
							type: "boolean",
							description: "Include a Technique Hints section",
						},
						includePitfalls: {
							type: "boolean",
							description: "Include a Pitfalls section",
						},
						autoSelectTechniques: {
							type: "boolean",
							description:
								"Infer techniques automatically from context/goal/requirements",
						},
						provider: {
							type: "string",
							enum: [
								"gpt-5",
								"gpt-4.1",
								"claude-4",
								"claude-3.7",
								"gemini-2.5",
								"o4-mini",
								"o3-mini",
								"other",
							],
							description: "Model family for tailored tips",
						},
						style: {
							type: "string",
							enum: ["markdown", "xml"],
							description: "Preferred prompt formatting style",
						},
					},
					required: ["context", "goal"],
				},
			},
			{
				name: "strategy-frameworks-builder",
				description:
					"Compose strategy analysis sections from selected frameworks (SWOT, BSC, VRIO, etc.) with compliant aliases for certain trademarks",
				inputSchema: {
					type: "object",
					properties: {
						frameworks: {
							type: "array",
							items: {
								type: "string",
								enum: [
									"asIsToBe",
									"whereToPlayHowToWin",
									"balancedScorecard",
									"swot",
									"objectives",
									"portersFiveForces",
									"mckinsey7S",
									"marketAnalysis",
									"strategyMap",
									"visionToMission",
									"stakeholderTheory",
									"values",
									"gapAnalysis",
									"ansoffMatrix",
									"pest",
									"bcgMatrix",
									"blueOcean",
									"scenarioPlanning",
									"vrio",
									"goalBasedPlanning",
									"gartnerQuadrant",
								],
							},
							description: "Framework identifiers to include",
						},
						context: { type: "string", description: "Business context" },
						objectives: { type: "array", items: { type: "string" } },
						market: { type: "string" },
						stakeholders: { type: "array", items: { type: "string" } },
						constraints: { type: "array", items: { type: "string" } },
						includeReferences: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
					},
					required: ["frameworks", "context"],
				},
			},
			{
				name: "gap-frameworks-analyzers",
				description:
					"Analyze gaps between current and desired states using various frameworks (capability, performance, maturity, etc.)",
				inputSchema: {
					type: "object",
					properties: {
						frameworks: {
							type: "array",
							items: {
								type: "string",
								enum: [
									"capability",
									"performance",
									"maturity",
									"skills",
									"technology",
									"process",
									"market",
									"strategic",
									"operational",
									"cultural",
									"security",
									"compliance",
								],
							},
							description: "Gap analysis framework types to include",
						},
						currentState: {
							type: "string",
							description: "Current state description",
						},
						desiredState: {
							type: "string",
							description: "Desired state description",
						},
						context: { type: "string", description: "Analysis context" },
						objectives: { type: "array", items: { type: "string" } },
						timeframe: { type: "string" },
						stakeholders: { type: "array", items: { type: "string" } },
						constraints: { type: "array", items: { type: "string" } },
						includeReferences: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						includeActionPlan: { type: "boolean" },
						inputFile: { type: "string" },
					},
					required: ["frameworks", "currentState", "desiredState", "context"],
				},
			},
			{
				name: "spark-prompt-builder",
				description:
					"Build a generic UI/UX product prompt from structured inputs (title, features, colors, typography, etc.)",
				inputSchema: {
					type: "object",
					properties: {
						title: { type: "string", description: "Prompt title" },
						summary: { type: "string", description: "Brief summary / outlook" },
						experienceQualities: {
							type: "array",
							description: "List of UX qualities",
							items: {
								type: "object",
								properties: {
									quality: { type: "string" },
									detail: { type: "string" },
								},
								required: ["quality", "detail"],
							},
						},
						complexityLevel: { type: "string" },
						complexityDescription: { type: "string" },
						primaryFocus: { type: "string" },
						features: {
							type: "array",
							items: {
								type: "object",
								properties: {
									name: { type: "string" },
									functionality: { type: "string" },
									purpose: { type: "string" },
									trigger: { type: "string" },
									progression: { type: "array", items: { type: "string" } },
									successCriteria: { type: "string" },
								},
								required: [
									"name",
									"functionality",
									"purpose",
									"trigger",
									"progression",
									"successCriteria",
								],
							},
						},
						edgeCases: {
							type: "array",
							items: {
								type: "object",
								properties: {
									name: { type: "string" },
									handling: { type: "string" },
								},
								required: ["name", "handling"],
							},
						},
						designDirection: { type: "string" },
						colorSchemeType: { type: "string" },
						colorPurpose: { type: "string" },
						primaryColor: { type: "string" },
						primaryColorPurpose: { type: "string" },
						secondaryColors: {
							type: "array",
							items: {
								type: "object",
								properties: {
									name: { type: "string" },
									oklch: { type: "string" },
									usage: { type: "string" },
								},
								required: ["name", "oklch", "usage"],
							},
						},
						accentColor: { type: "string" },
						accentColorPurpose: { type: "string" },
						foregroundBackgroundPairings: {
							type: "array",
							items: {
								type: "object",
								properties: {
									container: { type: "string" },
									containerColor: { type: "string" },
									textColor: { type: "string" },
									ratio: { type: "string" },
								},
								required: ["container", "containerColor", "textColor", "ratio"],
							},
						},
						fontFamily: { type: "string" },
						fontIntention: { type: "string" },
						fontReasoning: { type: "string" },
						typography: {
							type: "array",
							items: {
								type: "object",
								properties: {
									usage: { type: "string" },
									font: { type: "string" },
									weight: { type: "string" },
									size: { type: "string" },
									spacing: { type: "string" },
								},
								required: ["usage", "font", "weight", "size", "spacing"],
							},
						},
						animationPhilosophy: { type: "string" },
						animationRestraint: { type: "string" },
						animationPurpose: { type: "string" },
						animationHierarchy: { type: "string" },
						components: {
							type: "array",
							items: {
								type: "object",
								properties: {
									type: { type: "string" },
									usage: { type: "string" },
									variation: { type: "string" },
									styling: { type: "string" },
									state: { type: "string" },
									functionality: { type: "string" },
									purpose: { type: "string" },
								},
								required: ["type", "usage"],
							},
						},
						customizations: { type: "string" },
						states: {
							type: "array",
							items: {
								type: "object",
								properties: {
									component: { type: "string" },
									states: { type: "array", items: { type: "string" } },
									specialFeature: { type: "string" },
								},
								required: ["component", "states"],
							},
						},
						icons: { type: "array", items: { type: "string" } },
						spacingRule: { type: "string" },
						spacingContext: { type: "string" },
						mobileLayout: { type: "string" },
						// Optional prompt md frontmatter controls
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeDisclaimer: { type: "boolean" },
						includeReferences: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
					},
					required: [
						"title",
						"summary",
						"complexityLevel",
						"designDirection",
						"colorSchemeType",
						"colorPurpose",
						"primaryColor",
						"primaryColorPurpose",
						"accentColor",
						"accentColorPurpose",
						"fontFamily",
						"fontIntention",
						"fontReasoning",
						"animationPhilosophy",
						"animationRestraint",
						"animationPurpose",
						"animationHierarchy",
						"spacingRule",
						"spacingContext",
						"mobileLayout",
					],
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
				name: "domain-neutral-prompt-builder",
				description:
					"Build a domain-neutral, non-visual prompt/template (objectives, scope, inputs/outputs, workflow, capabilities, risks, acceptance)",
				inputSchema: {
					type: "object",
					properties: {
						title: { type: "string", description: "Document title" },
						summary: { type: "string", description: "One-paragraph summary" },
						objectives: { type: "array", items: { type: "string" } },
						nonGoals: { type: "array", items: { type: "string" } },
						background: { type: "string" },
						stakeholdersUsers: { type: "string" },
						environment: { type: "string" },
						assumptions: { type: "string" },
						constraints: { type: "string" },
						dependencies: { type: "string" },
						inputs: { type: "string" },
						outputs: { type: "string" },
						dataSchemas: { type: "array", items: { type: "string" } },
						interfaces: {
							type: "array",
							items: {
								type: "object",
								properties: {
									name: { type: "string" },
									contract: { type: "string" },
								},
								required: ["name", "contract"],
							},
						},
						workflow: { type: "array", items: { type: "string" } },
						capabilities: {
							type: "array",
							items: {
								type: "object",
								properties: {
									name: { type: "string" },
									purpose: { type: "string" },
									preconditions: { type: "string" },
									inputs: { type: "string" },
									processing: { type: "string" },
									outputs: { type: "string" },
									successCriteria: { type: "string" },
									errors: { type: "string" },
									observability: { type: "string" },
								},
								required: ["name", "purpose"],
							},
						},
						edgeCases: {
							type: "array",
							items: {
								type: "object",
								properties: {
									name: { type: "string" },
									handling: { type: "string" },
								},
								required: ["name", "handling"],
							},
						},
						risks: {
							type: "array",
							items: {
								type: "object",
								properties: {
									description: { type: "string" },
									likelihoodImpact: { type: "string" },
									mitigation: { type: "string" },
								},
								required: ["description"],
							},
						},
						successMetrics: { type: "array", items: { type: "string" } },
						acceptanceTests: {
							type: "array",
							items: {
								type: "object",
								properties: {
									setup: { type: "string" },
									action: { type: "string" },
									expected: { type: "string" },
								},
								required: ["setup", "action", "expected"],
							},
						},
						manualChecklist: { type: "array", items: { type: "string" } },
						performanceScalability: { type: "string" },
						reliabilityAvailability: { type: "string" },
						securityPrivacy: { type: "string" },
						compliancePolicy: { type: "string" },
						observabilityOps: { type: "string" },
						costBudget: { type: "string" },
						versioningStrategy: { type: "string" },
						migrationCompatibility: { type: "string" },
						changelog: { type: "array", items: { type: "string" } },
						milestones: {
							type: "array",
							items: {
								type: "object",
								properties: {
									name: { type: "string" },
									deliverables: { type: "string" },
									eta: { type: "string" },
								},
								required: ["name"],
							},
						},
						openQuestions: { type: "array", items: { type: "string" } },
						nextSteps: { type: "array", items: { type: "string" } },
						// Optional prompt md frontmatter controls
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeDisclaimer: { type: "boolean" },
						includeReferences: { type: "boolean" },
						includeTechniqueHints: { type: "boolean" },
						includePitfalls: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
					},
					required: ["title", "summary"],
				},
			},
			{
				name: "security-hardening-prompt-builder",
				description:
					"Build specialized security hardening and vulnerability analysis prompts for AI-guided security assessment",
				inputSchema: {
					type: "object",
					properties: {
						codeContext: {
							type: "string",
							description:
								"The code context or description to analyze for security",
						},
						securityFocus: {
							type: "string",
							enum: [
								"vulnerability-analysis",
								"security-hardening",
								"compliance-check",
								"threat-modeling",
								"penetration-testing",
							],
							description: "Primary security analysis focus",
						},
						securityRequirements: {
							type: "array",
							items: { type: "string" },
							description: "Specific security requirements to check",
						},
						complianceStandards: {
							type: "array",
							items: {
								type: "string",
								enum: [
									"OWASP-Top-10",
									"NIST-Cybersecurity-Framework",
									"ISO-27001",
									"SOC-2",
									"GDPR",
									"HIPAA",
									"PCI-DSS",
								],
							},
							description: "Compliance standards to evaluate against",
						},
						language: {
							type: "string",
							description: "Programming language of the code",
						},
						framework: {
							type: "string",
							description: "Framework or technology stack",
						},
						riskTolerance: {
							type: "string",
							enum: ["low", "medium", "high"],
							description: "Risk tolerance level for security assessment",
						},
						analysisScope: {
							type: "array",
							items: {
								type: "string",
								enum: [
									"input-validation",
									"authentication",
									"authorization",
									"data-encryption",
									"session-management",
									"error-handling",
									"logging-monitoring",
									"dependency-security",
									"configuration-security",
									"api-security",
								],
							},
							description: "Specific security areas to focus analysis on",
						},
						includeCodeExamples: {
							type: "boolean",
							description: "Include secure code examples in output",
						},
						includeMitigations: {
							type: "boolean",
							description: "Include specific mitigation recommendations",
						},
						includeTestCases: {
							type: "boolean",
							description: "Include security test cases",
						},
						prioritizeFindings: {
							type: "boolean",
							description: "Prioritize findings by severity",
						},
						outputFormat: {
							type: "string",
							enum: ["detailed", "checklist", "annotated-code"],
							description: "Preferred output format for security assessment",
						},
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeDisclaimer: { type: "boolean" },
						includeReferences: { type: "boolean" },
						includeTechniqueHints: { type: "boolean" },
						includePitfalls: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
						techniques: {
							type: "array",
							items: {
								type: "string",
								enum: [
									"zero-shot",
									"few-shot",
									"chain-of-thought",
									"self-consistency",
									"in-context-learning",
									"generate-knowledge",
									"prompt-chaining",
									"tree-of-thoughts",
									"meta-prompting",
									"rag",
									"react",
									"art",
								],
							},
							description: "Optional list of technique hints to include",
						},
						autoSelectTechniques: {
							type: "boolean",
							description: "Automatically select appropriate techniques",
						},
						provider: {
							type: "string",
							enum: [
								"gpt-5",
								"gpt-4.1",
								"claude-4",
								"claude-3.7",
								"gemini-2.5",
								"o4-mini",
								"o3-mini",
								"other",
							],
							description: "Model family for tailored tips",
						},
						style: {
							type: "string",
							enum: ["markdown", "xml"],
							description: "Preferred prompt formatting style",
						},
					},
					required: ["codeContext"],
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
			case "strategy-frameworks-builder":
				return strategyFrameworksBuilder(args);
			case "gap-frameworks-analyzers":
				return gapFrameworksAnalyzers(args);
			case "spark-prompt-builder":
				return sparkPromptBuilder(args);
			case "domain-neutral-prompt-builder":
				return domainNeutralPromptBuilder(args);
			case "security-hardening-prompt-builder":
				return securityHardeningPromptBuilder(args);
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
