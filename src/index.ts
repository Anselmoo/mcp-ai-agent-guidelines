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
// Import tool schemas
import {
	promptChainingBuilderSchema,
	promptFlowBuilderSchema,
} from "./schemas/flow-tool-schemas.js";
import { gapFrameworksAnalyzers } from "./tools/analysis/gap-frameworks-analyzers.js";
import { strategyFrameworksBuilder } from "./tools/analysis/strategy-frameworks-builder.js";
import { cleanCodeScorer } from "./tools/clean-code-scorer.js";
import { codeHygieneAnalyzer } from "./tools/code-hygiene-analyzer.js";
import { dependencyAuditor } from "./tools/dependency-auditor.js";
import {
	type DesignAssistantRequest,
	designAssistant,
} from "./tools/design/index.js";
import { guidelinesValidator } from "./tools/guidelines-validator.js";
import { iterativeCoverageEnhancer } from "./tools/iterative-coverage-enhancer.js";
import { memoryContextOptimizer } from "./tools/memory-context-optimizer.js";
import { mermaidDiagramGenerator } from "./tools/mermaid-diagram-generator.js";
import { modeSwitcher } from "./tools/mode-switcher.js";
import { modelCompatibilityChecker } from "./tools/model-compatibility-checker.js";
import { projectOnboarding } from "./tools/project-onboarding.js";
import { architectureDesignPromptBuilder } from "./tools/prompt/architecture-design-prompt-builder.js";
import { codeAnalysisPromptBuilder } from "./tools/prompt/code-analysis-prompt-builder.js";
import { debuggingAssistantPromptBuilder } from "./tools/prompt/debugging-assistant-prompt-builder.js";
import { documentationGeneratorPromptBuilder } from "./tools/prompt/documentation-generator-prompt-builder.js";
import { domainNeutralPromptBuilder } from "./tools/prompt/domain-neutral-prompt-builder.js";
import { enterpriseArchitectPromptBuilder } from "./tools/prompt/enterprise-architect-prompt-builder.js";
// Import tool implementations
import { hierarchicalPromptBuilder } from "./tools/prompt/hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "./tools/prompt/hierarchy-level-selector.js";
import { l9DistinguishedEngineerPromptBuilder } from "./tools/prompt/l9-distinguished-engineer-prompt-builder.js";
import { promptChainingBuilder } from "./tools/prompt/prompt-chaining-builder.js";
import { promptFlowBuilder } from "./tools/prompt/prompt-flow-builder.js";
import { promptingHierarchyEvaluator } from "./tools/prompt/prompting-hierarchy-evaluator.js";
import { securityHardeningPromptBuilder } from "./tools/prompt/security-hardening-prompt-builder.js";
import { sparkPromptBuilder } from "./tools/prompt/spark-prompt-builder.js";
import { semanticCodeAnalyzer } from "./tools/semantic-code-analyzer.js";
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
					"Build structured prompts with clear hierarchies and layers of specificity. Use this MCP to create prompts with context → goal → requirements hierarchy, supporting multiple prompting techniques (chain-of-thought, few-shot, etc.). Example: 'Use the hierarchical-prompt-builder MCP to create a code review prompt for React components focusing on performance optimization'",
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
				name: "code-analysis-prompt-builder",
				description:
					"Generate comprehensive code analysis prompts with customizable focus areas (security, performance, maintainability). Use this MCP to create targeted code review prompts for specific quality concerns. Example: 'Use the code-analysis-prompt-builder MCP to analyze authentication code for security vulnerabilities'",
				inputSchema: {
					type: "object",
					properties: {
						codebase: {
							type: "string",
							description: "The codebase or code snippet to analyze",
						},
						focusArea: {
							type: "string",
							enum: ["security", "performance", "maintainability", "general"],
							description: "Specific area to focus on",
						},
						language: {
							type: "string",
							description: "Programming language of the code",
						},
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeReferences: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
					},
					required: ["codebase"],
				},
			},
			{
				name: "architecture-design-prompt-builder",
				description:
					"Generate system architecture design prompts with scale-appropriate guidance. Use this MCP to create architecture planning prompts for different system scales and technology stacks. Example: 'Use the architecture-design-prompt-builder MCP to design a microservices architecture for a medium-scale e-commerce platform'",
				inputSchema: {
					type: "object",
					properties: {
						systemRequirements: {
							type: "string",
							description: "System requirements and constraints",
						},
						scale: {
							type: "string",
							enum: ["small", "medium", "large"],
							description: "Expected system scale",
						},
						technologyStack: {
							type: "string",
							description: "Preferred or required technology stack",
						},
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeReferences: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
					},
					required: ["systemRequirements"],
				},
			},
			{
				name: "digital-enterprise-architect-prompt-builder",
				description:
					"Guide enterprise architecture strategy with mentor perspectives and current research. Use this MCP to create strategic architecture prompts from an enterprise architect perspective. Example: 'Use the digital-enterprise-architect-prompt-builder MCP to guide cloud migration strategy for our legacy CRM system'",
				inputSchema: {
					type: "object",
					properties: {
						initiativeName: {
							type: "string",
							description: "Name or focus of the architecture initiative",
						},
						problemStatement: {
							type: "string",
							description: "Strategic problem or opportunity being addressed",
						},
						businessDrivers: {
							type: "array",
							items: { type: "string" },
							description: "Key business objectives and desired outcomes",
						},
						currentLandscape: {
							type: "string",
							description: "Summary of the current ecosystem or architecture",
						},
						targetUsers: {
							type: "string",
							description: "Primary stakeholders or user segments",
						},
						differentiators: {
							type: "array",
							items: { type: "string" },
							description: "Innovation themes or competitive differentiators",
						},
						constraints: {
							type: "array",
							items: { type: "string" },
							description:
								"Constraints or guardrails the solution must respect",
						},
						complianceObligations: {
							type: "array",
							items: { type: "string" },
							description: "Regulatory or policy considerations",
						},
						technologyGuardrails: {
							type: "array",
							items: { type: "string" },
							description:
								"Existing technology standards or preferred platforms",
						},
						innovationThemes: {
							type: "array",
							items: { type: "string" },
							description: "Innovation themes to explore",
						},
						timeline: {
							type: "string",
							description: "Timeline or planning horizon",
						},
						researchFocus: {
							type: "array",
							items: { type: "string" },
							description:
								"Research topics to benchmark against current best practices",
						},
						decisionDrivers: {
							type: "array",
							items: { type: "string" },
							description:
								"Decision drivers or evaluation criteria to emphasize",
						},
						knownRisks: {
							type: "array",
							items: { type: "string" },
							description: "Known risks or assumptions to monitor",
						},
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeReferences: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
					},
					required: ["initiativeName", "problemStatement"],
				},
			},
			{
				name: "debugging-assistant-prompt-builder",
				description:
					"Generate systematic debugging and troubleshooting prompts with structured analysis. Use this MCP to create diagnostic prompts for error investigation and root cause analysis. Example: 'Use the debugging-assistant-prompt-builder MCP to troubleshoot a production database connection timeout issue'",
				inputSchema: {
					type: "object",
					properties: {
						errorDescription: {
							type: "string",
							description: "Description of the error or issue",
						},
						context: {
							type: "string",
							description: "Additional context about the problem",
						},
						attemptedSolutions: {
							type: "string",
							description: "Solutions already attempted",
						},
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeReferences: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
					},
					required: ["errorDescription"],
				},
			},
			{
				name: "l9-distinguished-engineer-prompt-builder",
				description:
					"Generate Distinguished Engineer (L9) technical design prompts for high-level software architecture and system design. Use this MCP to create expert-level technical architecture prompts. Example: 'Use the l9-distinguished-engineer-prompt-builder MCP to design a globally distributed real-time data processing platform'",
				inputSchema: {
					type: "object",
					properties: {
						projectName: {
							type: "string",
							description: "Name of the software project or system initiative",
						},
						technicalChallenge: {
							type: "string",
							description:
								"Core technical problem, architectural complexity, or scale challenge",
						},
						technicalDrivers: {
							type: "array",
							items: { type: "string" },
							description:
								"Key technical objectives: performance targets, scalability goals, reliability requirements",
						},
						currentArchitecture: {
							type: "string",
							description:
								"Existing system architecture, tech stack, and known pain points",
						},
						userScale: {
							type: "string",
							description:
								"Scale context: users, requests/sec, data volume, geographical distribution",
						},
						technicalDifferentiators: {
							type: "array",
							items: { type: "string" },
							description:
								"Technical innovations, performance advantages, or unique capabilities",
						},
						engineeringConstraints: {
							type: "array",
							items: { type: "string" },
							description:
								"Technical constraints: latency budgets, backward compatibility, migration windows",
						},
						securityRequirements: {
							type: "array",
							items: { type: "string" },
							description: "Security, privacy, and compliance requirements",
						},
						techStack: {
							type: "array",
							items: { type: "string" },
							description:
								"Current/preferred technologies, languages, frameworks, and platforms",
						},
						experimentationAreas: {
							type: "array",
							items: { type: "string" },
							description:
								"Emerging technologies or patterns worth prototyping",
						},
						deliveryTimeline: {
							type: "string",
							description:
								"Engineering timeline: sprints, milestones, or release windows",
						},
						benchmarkingFocus: {
							type: "array",
							items: { type: "string" },
							description:
								"Systems/companies to benchmark against or research areas requiring investigation",
						},
						tradeoffPriorities: {
							type: "array",
							items: { type: "string" },
							description:
								"Engineering trade-off priorities: latency vs throughput, consistency vs availability, etc.",
						},
						technicalRisks: {
							type: "array",
							items: { type: "string" },
							description:
								"Known technical risks, debt, or areas of uncertainty",
						},
						teamContext: {
							type: "string",
							description:
								"Team size, skill distribution, and organizational dependencies",
						},
						observabilityRequirements: {
							type: "array",
							items: { type: "string" },
							description:
								"Monitoring, logging, tracing, and debugging requirements",
						},
						performanceTargets: {
							type: "array",
							items: { type: "string" },
							description:
								"Specific performance SLOs/SLAs: p99 latency, throughput, availability",
						},
						migrationStrategy: {
							type: "string",
							description:
								"Migration or rollout strategy if re-architecting existing system",
						},
						codeQualityStandards: {
							type: "array",
							items: { type: "string" },
							description:
								"Code quality expectations: test coverage, documentation, design patterns",
						},
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeReferences: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
					},
					required: ["projectName", "technicalChallenge"],
				},
			},
			{
				name: "documentation-generator-prompt-builder",
				description:
					"Generate technical documentation prompts tailored to content type and audience. Use this MCP to create structured documentation generation prompts for API docs, user guides, or technical specs. Example: 'Use the documentation-generator-prompt-builder MCP to create API documentation for our REST endpoints'",
				inputSchema: {
					type: "object",
					properties: {
						contentType: {
							type: "string",
							description:
								"Type of documentation (API, user guide, technical spec)",
						},
						targetAudience: {
							type: "string",
							description: "Intended audience for the documentation",
						},
						existingContent: {
							type: "string",
							description: "Any existing content to build upon",
						},
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeReferences: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
					},
					required: ["contentType"],
				},
			},
			{
				name: "strategy-frameworks-builder",
				description:
					"Compose strategy analysis sections from selected frameworks (SWOT, BSC, VRIO, Porter's Five Forces, etc.). Use this MCP to generate strategic business analysis using established frameworks. Example: 'Use the strategy-frameworks-builder MCP to create a SWOT analysis and Balanced Scorecard for our market expansion plan'",
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
					"Analyze gaps between current and desired states using various frameworks (capability, performance, maturity, skills, technology, process, etc.). Use this MCP to identify and analyze gaps in capabilities, processes, or technologies. Example: 'Use the gap-frameworks-analyzers MCP to analyze the technology gap between our current monolith and desired microservices architecture'",
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
					"Build comprehensive UI/UX product design prompts from structured inputs (title, features, colors, typography, animation, spacing, etc.). Use this MCP to create detailed design system prompts for developer tools and user interfaces. Example: 'Use the spark-prompt-builder MCP to design a dark-mode code editor with syntax highlighting and accessibility features'",
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
				name: "clean-code-scorer",
				description:
					"Calculate comprehensive Clean Code score (0-100) based on multiple quality metrics including code hygiene, test coverage, TypeScript, linting, documentation, and security. Use this MCP to get an overall quality assessment of your codebase. Example: 'Use the clean-code-scorer MCP to evaluate the quality of our authentication module and identify improvement areas'",
				inputSchema: {
					type: "object",
					properties: {
						projectPath: {
							type: "string",
							description: "Path to the project root directory",
						},
						codeContent: {
							type: "string",
							description: "Code content to analyze",
						},
						language: {
							type: "string",
							description: "Programming language",
						},
						framework: {
							type: "string",
							description: "Framework or technology stack",
						},
						coverageMetrics: {
							type: "object",
							description: "Test coverage metrics",
							properties: {
								statements: {
									type: "number",
									description: "Statement coverage percentage (0-100)",
								},
								branches: {
									type: "number",
									description: "Branch coverage percentage (0-100)",
								},
								functions: {
									type: "number",
									description: "Function coverage percentage (0-100)",
								},
								lines: {
									type: "number",
									description: "Line coverage percentage (0-100)",
								},
							},
						},
						includeReferences: {
							type: "boolean",
							description: "Include external best-practice links",
						},
						includeMetadata: {
							type: "boolean",
							description: "Include metadata in output",
						},
						inputFile: {
							type: "string",
							description: "Input file path for reference",
						},
					},
					required: [],
				},
			},
			{
				name: "code-hygiene-analyzer",
				description:
					"Analyze codebase for outdated patterns, unused dependencies, and code hygiene issues. Use this MCP to identify technical debt, code smells, and modernization opportunities. Example: 'Use the code-hygiene-analyzer MCP to scan our legacy codebase for outdated patterns and unused dependencies'",
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
				name: "dependency-auditor",
				description:
					"Analyze package.json for outdated, deprecated, or insecure packages and recommend modern, secure alternatives with ESM compatibility and bundle size insights. Use this MCP to audit project dependencies for security vulnerabilities and modernization opportunities. Example: 'Use the dependency-auditor MCP to check our package.json for security vulnerabilities and deprecated packages'",
				inputSchema: {
					type: "object",
					properties: {
						packageJsonContent: {
							type: "string",
							description: "Content of package.json file",
						},
						checkOutdated: {
							type: "boolean",
							description: "Check for outdated version patterns",
							default: true,
						},
						checkDeprecated: {
							type: "boolean",
							description: "Check for deprecated packages",
							default: true,
						},
						checkVulnerabilities: {
							type: "boolean",
							description: "Check for known vulnerabilities",
							default: true,
						},
						suggestAlternatives: {
							type: "boolean",
							description: "Suggest ESM-compatible alternatives",
							default: true,
						},
						analyzeBundleSize: {
							type: "boolean",
							description: "Analyze bundle size concerns",
							default: true,
						},
						includeReferences: {
							type: "boolean",
							description: "Include external reference links",
							default: true,
						},
						includeMetadata: {
							type: "boolean",
							description: "Include metadata section",
							default: true,
						},
						inputFile: {
							type: "string",
							description: "Input file path for reference",
						},
					},
					required: ["packageJsonContent"],
				},
			},
			{
				name: "iterative-coverage-enhancer",
				description:
					"Iteratively analyze code coverage, detect dead code, generate test suggestions, and adapt coverage thresholds for continuous improvement. Use this MCP to identify test coverage gaps and generate actionable test improvement suggestions. Example: 'Use the iterative-coverage-enhancer MCP to analyze test coverage gaps in our payment processing module and suggest new test cases'",
				inputSchema: {
					type: "object",
					properties: {
						projectPath: {
							type: "string",
							description: "Path to the project root directory",
						},
						language: {
							type: "string",
							description: "Primary programming language",
						},
						framework: {
							type: "string",
							description: "Framework or technology stack",
						},
						analyzeCoverageGaps: {
							type: "boolean",
							description: "Analyze and identify coverage gaps",
						},
						detectDeadCode: {
							type: "boolean",
							description: "Detect unused code for elimination",
						},
						generateTestSuggestions: {
							type: "boolean",
							description: "Generate test suggestions for uncovered code",
						},
						adaptThresholds: {
							type: "boolean",
							description: "Recommend adaptive coverage threshold adjustments",
						},
						currentCoverage: {
							type: "object",
							description: "Current coverage metrics",
							properties: {
								statements: { type: "number", minimum: 0, maximum: 100 },
								functions: { type: "number", minimum: 0, maximum: 100 },
								lines: { type: "number", minimum: 0, maximum: 100 },
								branches: { type: "number", minimum: 0, maximum: 100 },
							},
						},
						targetCoverage: {
							type: "object",
							description: "Target coverage goals",
							properties: {
								statements: { type: "number", minimum: 0, maximum: 100 },
								functions: { type: "number", minimum: 0, maximum: 100 },
								lines: { type: "number", minimum: 0, maximum: 100 },
								branches: { type: "number", minimum: 0, maximum: 100 },
							},
						},
						outputFormat: {
							type: "string",
							enum: ["markdown", "json", "text"],
							description: "Output format for the report",
						},
						includeReferences: {
							type: "boolean",
							description: "Include references and best practice links",
						},
						includeCodeExamples: {
							type: "boolean",
							description: "Include code examples in suggestions",
						},
						generateCIActions: {
							type: "boolean",
							description: "Generate CI/CD integration actions",
						},
					},
					required: [],
				},
			},
			{
				name: "mermaid-diagram-generator",
				description:
					"Generate Mermaid diagrams from text descriptions following best practices. Supports flowcharts, sequence diagrams, class diagrams, state machines, ER diagrams, and more with validation and auto-repair. Use this MCP to create visual documentation and architecture diagrams. Example: 'Use the mermaid-diagram-generator MCP to create a sequence diagram showing the OAuth authentication flow'",
				inputSchema: {
					type: "object",
					properties: {
						description: {
							type: "string",
							description:
								"Description of the system or process to diagram. Be specific and detailed for better diagram generation.",
						},
						diagramType: {
							type: "string",
							enum: [
								"flowchart",
								"sequence",
								"class",
								"state",
								"gantt",
								"pie",
								"er",
								"journey",
								"quadrant",
								"git-graph",
								"mindmap",
								"timeline",
							],
							description: "Type of diagram to generate",
						},
						theme: {
							type: "string",
							description:
								"Visual theme for the diagram (e.g., 'default', 'dark', 'forest', 'neutral')",
						},
						direction: {
							type: "string",
							enum: ["TD", "TB", "BT", "LR", "RL"],
							description:
								"Direction for flowcharts: TD/TB (top-down), BT (bottom-top), LR (left-right), RL (right-left)",
						},
						strict: {
							type: "boolean",
							description:
								"If true, never emit invalid diagram; fallback to minimal diagram if needed (default: true)",
							default: true,
						},
						repair: {
							type: "boolean",
							description:
								"Attempt auto-repair on diagram validation failure (default: true)",
							default: true,
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
						customStyles: {
							type: "string",
							description:
								"Custom CSS/styling directives for advanced customization",
						},
						advancedFeatures: {
							type: "object",
							description:
								"Type-specific advanced features (e.g., {autonumber: true} for sequence diagrams)",
						},
					},
					required: ["description", "diagramType"],
				},
			},
			{
				name: "memory-context-optimizer",
				description:
					"Optimize prompt caching and context window usage for AI agents. Use this MCP to reduce token usage and improve context efficiency in long conversations or large codebases. Example: 'Use the memory-context-optimizer MCP to compress our system architecture documentation for efficient AI agent context'",
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
					"Build comprehensive domain-neutral prompts with objectives, scope, inputs/outputs, workflow, capabilities, risks, and acceptance criteria. Use this MCP to create structured specification documents or technical requirements. Example: 'Use the domain-neutral-prompt-builder MCP to create a technical specification for our API gateway service'",
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
					"Build specialized security hardening and vulnerability analysis prompts for AI-guided security assessment with OWASP Top 10, NIST, and compliance framework support. Use this MCP to create comprehensive security analysis prompts with threat modeling and compliance checks. Example: 'Use the security-hardening-prompt-builder MCP to analyze our API endpoints for OWASP Top 10 vulnerabilities and PCI-DSS compliance'",
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
					"Calculate optimal development cycles and sprint timelines with dependency-aware scheduling, team velocity, and complexity analysis. Use this MCP to estimate project timelines and plan sprint allocations. Example: 'Use the sprint-timeline-calculator MCP to estimate the timeline for our microservices migration with a team of 6 developers'",
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
						optimizationStrategy: {
							type: "string",
							enum: ["greedy", "linear-programming"],
							description:
								"Optimization strategy: 'greedy' (default, deterministic bin-packing) or 'linear-programming' (future MILP optimization)",
						},
						includeMetadata: {
							type: "boolean",
							description: "Include metadata in output",
						},
						inputFile: {
							type: "string",
							description: "Input file reference",
						},
					},
					required: ["tasks", "teamSize"],
				},
			},
			{
				name: "model-compatibility-checker",
				description:
					"Recommend best AI models for specific tasks and requirements based on capabilities, budget, and use case. Use this MCP to select optimal AI models for different development tasks. Example: 'Use the model-compatibility-checker MCP to recommend the best AI model for code generation with long context windows on a medium budget'",
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
					"Validate development practices against established AI agent guidelines for prompting, code management, architecture, visualization, memory, and workflow. Use this MCP to ensure your practices follow AI agent best practices. Example: 'Use the guidelines-validator MCP to validate our code review workflow against AI agent best practices'",
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
			{
				name: "semantic-code-analyzer",
				description:
					"Perform semantic code analysis to identify symbols, structure, dependencies, and patterns using language server-based analysis for precise code understanding. Use this MCP to analyze code semantics, find references, and understand code structure. Example: 'Use the semantic-code-analyzer MCP to map dependencies and identify tightly coupled components in our codebase'",
				inputSchema: {
					type: "object",
					properties: {
						codeContent: {
							type: "string",
							description: "Code content to analyze",
						},
						language: {
							type: "string",
							description:
								"Programming language (auto-detected if not provided)",
						},
						analysisType: {
							type: "string",
							enum: ["symbols", "structure", "dependencies", "patterns", "all"],
							description: "Type of semantic analysis to perform",
						},
						includeReferences: {
							type: "boolean",
							description: "Include external reference links",
						},
						includeMetadata: {
							type: "boolean",
							description: "Include metadata section",
						},
						inputFile: {
							type: "string",
							description: "Optional input file path",
						},
					},
					required: ["codeContent"],
				},
			},
			{
				name: "project-onboarding",
				description:
					"Perform comprehensive project onboarding including structure analysis, dependency detection, and documentation generation for efficient developer onboarding. Use this MCP to analyze and document project structure for new developers. Example: 'Use the project-onboarding MCP to generate onboarding documentation for our microservices repository'",
				inputSchema: {
					type: "object",
					properties: {
						projectPath: {
							type: "string",
							description: "Path to the project directory",
						},
						projectName: {
							type: "string",
							description: "Name of the project",
						},
						projectType: {
							type: "string",
							enum: ["library", "application", "service", "tool", "other"],
							description: "Type of project",
						},
						analysisDepth: {
							type: "string",
							enum: ["quick", "standard", "deep"],
							description: "Depth of analysis",
						},
						includeMemories: {
							type: "boolean",
							description: "Generate project memories",
						},
						includeReferences: {
							type: "boolean",
							description: "Include external reference links",
						},
						includeMetadata: {
							type: "boolean",
							description: "Include metadata section",
						},
					},
					required: ["projectPath"],
				},
			},
			{
				name: "mode-switcher",
				description:
					"Switch between different agent operation modes (planning, editing, analysis, debugging, refactoring, documentation, etc.) with tailored tool sets and prompting strategies for context-appropriate workflows. Use this MCP to transition between development workflows. Example: 'Use the mode-switcher MCP to transition from planning mode to implementation mode'",
				inputSchema: {
					type: "object",
					properties: {
						currentMode: {
							type: "string",
							enum: [
								"planning",
								"editing",
								"analysis",
								"interactive",
								"one-shot",
								"debugging",
								"refactoring",
								"documentation",
							],
							description: "Current active mode",
						},
						targetMode: {
							type: "string",
							enum: [
								"planning",
								"editing",
								"analysis",
								"interactive",
								"one-shot",
								"debugging",
								"refactoring",
								"documentation",
							],
							description: "Mode to switch to",
						},
						context: {
							type: "string",
							enum: [
								"desktop-app",
								"ide-assistant",
								"agent",
								"terminal",
								"collaborative",
							],
							description: "Operating context",
						},
						reason: {
							type: "string",
							description: "Reason for mode switch",
						},
						includeReferences: {
							type: "boolean",
							description: "Include external reference links",
						},
						includeMetadata: {
							type: "boolean",
							description: "Include metadata section",
						},
					},
					required: ["targetMode"],
				},
			},
			{
				name: "prompting-hierarchy-evaluator",
				description:
					"Evaluate prompts using hierarchical taxonomy and provide numeric scoring based on clarity, specificity, completeness, and cognitive complexity with reinforcement learning-inspired metrics. Use this MCP to assess and improve prompt quality. Example: 'Use the prompting-hierarchy-evaluator MCP to evaluate and score our code review prompt for effectiveness'",
				inputSchema: {
					type: "object",
					properties: {
						promptText: {
							type: "string",
							description: "The prompt text to evaluate",
						},
						targetLevel: {
							type: "string",
							enum: [
								"independent",
								"indirect",
								"direct",
								"modeling",
								"scaffolding",
								"full-physical",
							],
							description: "Expected hierarchy level (if known)",
						},
						context: {
							type: "string",
							description: "Additional context about the task",
						},
						includeRecommendations: {
							type: "boolean",
							description: "Include improvement recommendations",
						},
						includeReferences: {
							type: "boolean",
							description: "Include reference links",
						},
					},
					required: ["promptText"],
				},
			},
			{
				name: "hierarchy-level-selector",
				description:
					"Select the most appropriate prompting hierarchy level (independent, indirect, direct, modeling, scaffolding, full-physical) based on task characteristics, agent capability, and autonomy preferences. Use this MCP to determine optimal prompt guidance level for different scenarios. Example: 'Use the hierarchy-level-selector MCP to determine the best prompting level for a junior developer working on complex refactoring'",
				inputSchema: {
					type: "object",
					properties: {
						taskDescription: {
							type: "string",
							description: "Description of the task the prompt will address",
						},
						agentCapability: {
							type: "string",
							enum: ["novice", "intermediate", "advanced", "expert"],
							description: "Agent's capability level",
						},
						taskComplexity: {
							type: "string",
							enum: ["simple", "moderate", "complex", "very-complex"],
							description: "Complexity of the task",
						},
						autonomyPreference: {
							type: "string",
							enum: ["low", "medium", "high"],
							description: "Desired level of agent autonomy",
						},
						includeExamples: {
							type: "boolean",
							description: "Include example prompts for the recommended level",
						},
						includeReferences: {
							type: "boolean",
							description: "Include reference links",
						},
					},
					required: ["taskDescription"],
				},
			},
			promptChainingBuilderSchema,
			promptFlowBuilderSchema,
			{
				name: "design-assistant",
				description:
					"Comprehensive multi-phase design workflow orchestration with constraint validation, coverage enforcement, and artifact generation (ADRs, specifications, roadmaps). This deterministic, context-driven design assistant utilizes a constraint framework for structured design sessions, providing context-aware design recommendations tailored to language, framework, and code patterns—including SOLID principles, design patterns, and framework-specific best practices. Use this MCP to manage complex design processes through discovery, requirements, architecture, and implementation phases. Example: 'Use the design-assistant MCP to start a design session for our new API gateway and guide it through all design phases'"
				inputSchema: {
					type: "object",
					properties: {
						action: {
							type: "string",
							enum: [
								"start-session",
								"advance-phase",
								"validate-phase",
								"evaluate-pivot",
								"generate-strategic-pivot-prompt",
								"generate-artifacts",
								"enforce-coverage",
								"enforce-consistency",
								"get-status",
								"load-constraints",
								"select-methodology",
								"enforce-cross-session-consistency",
								"generate-enforcement-prompts",
								"generate-constraint-documentation",
								"generate-context-aware-guidance",
							],
							description: "Action to perform",
						},
						sessionId: {
							type: "string",
							description: "Unique session identifier",
						},
						config: {
							type: "object",
							description:
								"Design session configuration (required for start-session)",
							properties: {
								sessionId: { type: "string" },
								context: { type: "string" },
								goal: { type: "string" },
								requirements: { type: "array", items: { type: "string" } },
								coverageThreshold: { type: "number", default: 85 },
								enablePivots: { type: "boolean", default: true },
								templateRefs: { type: "array", items: { type: "string" } },
								outputFormats: { type: "array", items: { type: "string" } },
							},
						},
						content: {
							type: "string",
							description: "Content to validate or analyze",
						},
						phaseId: {
							type: "string",
							description: "Target phase ID for advance or validate actions",
						},
						constraintId: {
							type: "string",
							description: "Specific constraint ID for consistency enforcement",
						},
						constraintConfig: {
							type: "object",
							description:
								"Custom constraint configuration in YAML/JSON format",
						},
						artifactTypes: {
							type: "array",
							items: {
								type: "string",
								enum: ["adr", "specification", "roadmap"],
							},
							description: "Types of artifacts to generate",
							default: ["adr", "specification", "roadmap"],
						},
						methodologySignals: {
							type: "object",
							description:
								"Methodology signals for select-methodology action (e.g., team size, project complexity, domain)",
						},
						includeTemplates: {
							type: "boolean",
							description:
								"Include templates in generated prompts (for generate-strategic-pivot-prompt)",
						},
						includeSpace7Instructions: {
							type: "boolean",
							description:
								"Include Space7 instructions in prompts (for generate-strategic-pivot-prompt)",
						},
						customInstructions: {
							type: "array",
							items: { type: "string" },
							description:
								"Custom instructions for prompt generation (for generate-strategic-pivot-prompt)",
						},
					},
					required: ["action", "sessionId"],
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
			case "code-analysis-prompt-builder":
				return codeAnalysisPromptBuilder(args);
			case "architecture-design-prompt-builder":
				return architectureDesignPromptBuilder(args);
			case "digital-enterprise-architect-prompt-builder":
				return enterpriseArchitectPromptBuilder(args);
			case "debugging-assistant-prompt-builder":
				return debuggingAssistantPromptBuilder(args);
			case "l9-distinguished-engineer-prompt-builder":
				return l9DistinguishedEngineerPromptBuilder(args);
			case "documentation-generator-prompt-builder":
				return documentationGeneratorPromptBuilder(args);
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
			case "clean-code-scorer":
				return cleanCodeScorer(args);
			case "code-hygiene-analyzer":
				return codeHygieneAnalyzer(args);
			case "dependency-auditor":
				return dependencyAuditor(args);
			case "iterative-coverage-enhancer":
				return iterativeCoverageEnhancer(args);
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
			case "semantic-code-analyzer":
				return semanticCodeAnalyzer(args);
			case "project-onboarding":
				return projectOnboarding(args);
			case "mode-switcher":
				return modeSwitcher(args);
			case "prompting-hierarchy-evaluator":
				return promptingHierarchyEvaluator(args);
			case "hierarchy-level-selector":
				return hierarchyLevelSelector(args);
			case "prompt-chaining-builder":
				return promptChainingBuilder(args);
			case "prompt-flow-builder":
				return promptFlowBuilder(args);
			case "design-assistant": {
				const result = await designAssistant.processRequest(
					args as unknown as DesignAssistantRequest,
				);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			}
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
