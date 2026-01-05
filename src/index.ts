#!/usr/bin/env node

/**
 * AI Agent Development Guidelines MCP Server
 *
 * This MCP server provides tools, resources, and prompts for implementing
 * AI agent best practices including hierarchical prompting, code hygiene
 * analysis, mermaid diagram generation, memory optimization, and sprint planning.
 */

import { createRequire } from "node:module";
// Dynamic version from package.json using createRequire for ESM compatibility
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
import { PROVIDER_ENUM_VALUES } from "./tools/config/generated/index.js";
import { dependencyAuditor } from "./tools/dependency-auditor.js";
import {
	type DesignAssistantRequest,
	designAssistant,
} from "./tools/design/index.js";
import { guidelinesValidator } from "./tools/guidelines-validator.js";
import { iterativeCoverageEnhancer } from "./tools/iterative-coverage-enhancer.js";
import { memoryContextOptimizer } from "./tools/memory-context-optimizer.js";
import { mermaidDiagramGenerator } from "./tools/mermaid/index.js";
import { modeSwitcher } from "./tools/mode-switcher.js";
import { modelCompatibilityChecker } from "./tools/model-compatibility-checker.js";
import { projectOnboarding } from "./tools/project-onboarding.js";
import { architectureDesignPromptBuilder } from "./tools/prompt/architecture-design-prompt-builder.js";
import { codeAnalysisPromptBuilder } from "./tools/prompt/code-analysis-prompt-builder.js";
import { coverageDashboardDesignPromptBuilder } from "./tools/prompt/coverage-dashboard-design-prompt-builder.js";
import { debuggingAssistantPromptBuilder } from "./tools/prompt/debugging-assistant-prompt-builder.js";
import { documentationGeneratorPromptBuilder } from "./tools/prompt/documentation-generator-prompt-builder.js";
import { domainNeutralPromptBuilder } from "./tools/prompt/domain-neutral-prompt-builder.js";
import { enterpriseArchitectPromptBuilder } from "./tools/prompt/enterprise-architect-prompt-builder.js";
// Import tool implementations
import { hierarchicalPromptBuilder } from "./tools/prompt/hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "./tools/prompt/hierarchy-level-selector.js";
import {
	promptHierarchy,
	promptHierarchySchema,
} from "./tools/prompt/index.js";
import { l9DistinguishedEngineerPromptBuilder } from "./tools/prompt/l9-distinguished-engineer-prompt-builder.js";
import { promptChainingBuilder } from "./tools/prompt/prompt-chaining-builder.js";
import { promptFlowBuilder } from "./tools/prompt/prompt-flow-builder.js";
import { promptingHierarchyEvaluator } from "./tools/prompt/prompting-hierarchy-evaluator.js";
import { quickDeveloperPromptsBuilder } from "./tools/prompt/quick-developer-prompts-builder.js";
import { securityHardeningPromptBuilder } from "./tools/prompt/security-hardening-prompt-builder.js";
import { sparkPromptBuilder } from "./tools/prompt/spark-prompt-builder.js";
import { semanticCodeAnalyzer } from "./tools/semantic-code-analyzer.js";
// Import annotation presets
import {
	ANALYSIS_TOOL_ANNOTATIONS,
	FILESYSTEM_TOOL_ANNOTATIONS,
	GENERATION_TOOL_ANNOTATIONS,
	SESSION_TOOL_ANNOTATIONS,
} from "./tools/shared/annotation-presets.js";
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
					"Create AI prompts with context→goal→requirements hierarchy supporting chain-of-thought, few-shot, and zero-shot techniques. BEST FOR: code reviews, feature specifications, technical decisions, complex task breakdown. OUTPUTS: Structured markdown prompts for LLM injection.",
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
							enum: PROVIDER_ENUM_VALUES,
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Hierarchical Prompt Builder",
				},
			},
			{
				name: "code-analysis-prompt-builder",
				description:
					"Generate targeted code review prompts focusing on security vulnerabilities, performance bottlenecks, maintainability, and quality assessment. BEST FOR: security audits, performance optimization, refactoring planning, code quality gates. OUTPUTS: Comprehensive review checklist prompts.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Code Analysis Prompt Generator",
				},
			},
			{
				name: "architecture-design-prompt-builder",
				description:
					"Generate system architecture design prompts tailored to project scale with technology recommendations, scalability guidance, and architectural patterns. BEST FOR: microservices planning, system design, architecture decisions, tech stack evaluation. OUTPUTS: Architecture prompts with constraints.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Architecture Design Prompt Generator",
				},
			},
			{
				name: "digital-enterprise-architect-prompt-builder",
				description:
					"Guide enterprise architecture strategy with mentor insights, current research, and decision frameworks for digital transformation. BEST FOR: strategic IT planning, cloud migration, enterprise transformation, technology modernization. OUTPUTS: Architecture decision prompts with business alignment.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Enterprise Architect Prompt Generator",
				},
			},
			{
				name: "debugging-assistant-prompt-builder",
				description:
					"Create systematic debugging prompts with hypothesis generation, error reproduction steps, and root cause analysis workflows. BEST FOR: production bug investigation, error diagnosis, system failure analysis, intermittent issue debugging. OUTPUTS: Structured debug workflow prompts.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Debug Assistant Prompt Generator",
				},
			},
			{
				name: "l9-distinguished-engineer-prompt-builder",
				description:
					"Generate Distinguished Engineer (L9) technical design prompts for complex software architecture including distributed systems, platform engineering, and high-scale infrastructure. BEST FOR: staff-level architecture, distributed systems, platform strategy. OUTPUTS: Expert-level architecture prompts.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "L9 Engineer Prompt Generator",
				},
			},
			{
				name: "documentation-generator-prompt-builder",
				description:
					"Create documentation generation prompts for API references, user guides, README files, and technical specifications with audience-appropriate detail. BEST FOR: API documentation, user manuals, README generation, onboarding docs, technical writing. OUTPUTS: Structured documentation template prompts.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Documentation Prompt Generator",
				},
			},
			{
				name: "strategy-frameworks-builder",
				description:
					"Build strategic analysis using SWOT, Porter's Five Forces, Value Chain, and 20+ other frameworks for comprehensive business strategy evaluation. BEST FOR: market expansion, competitive analysis, strategic planning. OUTPUTS: Framework-based analysis sections.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Strategy Framework Builder",
				},
			},
			{
				name: "gap-frameworks-analyzers",
				description:
					"Analyze capability, performance, or technology gaps between current and target states to generate actionable roadmaps with prioritized recommendations. BEST FOR: digital transformation, capability assessment, migration planning. OUTPUTS: Gap analysis reports with remediation steps.",
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
				annotations: {
					...ANALYSIS_TOOL_ANNOTATIONS,
					title: "Gap Analysis Framework",
				},
			},
			{
				name: "spark-prompt-builder",
				description:
					"Build UI/UX product design prompts from structured inputs including color schemes, typography, spacing, component libraries, and interaction patterns. BEST FOR: design systems, developer tool interfaces, component libraries, UI style guides. OUTPUTS: Detailed design specification prompts.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Spark Design Prompt Builder",
				},
			},
			{
				name: "coverage-dashboard-design-prompt-builder",
				description:
					"Generate UI/UX design prompts for test coverage dashboards with accessibility, WCAG compliance, interactive visualizations, and responsive layouts. BEST FOR: test coverage interfaces, metrics dashboards, data visualization, accessibility-first UI. OUTPUTS: Accessible dashboard design prompts.",
				inputSchema: {
					type: "object",
					properties: {
						title: {
							type: "string",
							description: "Dashboard title",
							default: "Coverage Dashboard Design",
						},
						projectContext: {
							type: "string",
							description: "Project context or description",
						},
						targetUsers: {
							type: "array",
							items: { type: "string" },
							description:
								"Target user personas (e.g., developers, qa-engineers, managers)",
						},
						dashboardStyle: {
							type: "string",
							enum: ["card-based", "table-heavy", "hybrid", "minimal"],
							description: "Dashboard layout style",
						},
						primaryMetrics: {
							type: "array",
							items: { type: "string" },
							description:
								"Primary coverage metrics to display (e.g., statements, branches, functions, lines)",
						},
						colorScheme: {
							type: "string",
							enum: [
								"light",
								"dark",
								"auto",
								"high-contrast",
								"colorblind-safe",
								"custom",
							],
							description: "Color scheme preference",
						},
						primaryColor: {
							type: "string",
							description: "Primary color in OKLCH",
						},
						successColor: {
							type: "string",
							description: "Success/good coverage color",
						},
						warningColor: {
							type: "string",
							description: "Warning coverage color",
						},
						dangerColor: {
							type: "string",
							description: "Danger/critical coverage color",
						},
						useGradients: {
							type: "boolean",
							description: "Use gradient visual indicators",
						},
						visualIndicators: {
							type: "array",
							items: { type: "string" },
							description:
								"Visual indicator types (e.g., progress-bars, badges, sparklines, heat-maps)",
						},
						fontFamily: { type: "string", description: "UI font family" },
						codeFont: { type: "string", description: "Code font family" },
						accessibility: {
							type: "object",
							description: "Accessibility configuration",
							properties: {
								wcagLevel: { type: "string", enum: ["A", "AA", "AAA"] },
								colorBlindSafe: { type: "boolean" },
								keyboardNavigation: { type: "boolean" },
								screenReaderOptimized: { type: "boolean" },
								focusIndicators: { type: "boolean" },
								highContrastMode: { type: "boolean" },
							},
						},
						responsive: {
							type: "object",
							description: "Responsive design configuration",
							properties: {
								mobileFirst: { type: "boolean" },
								touchOptimized: { type: "boolean" },
								collapsibleNavigation: { type: "boolean" },
							},
						},
						interactiveFeatures: {
							type: "object",
							description: "Interactive feature configuration",
							properties: {
								filters: { type: "boolean" },
								sorting: { type: "boolean" },
								search: { type: "boolean" },
								tooltips: { type: "boolean" },
								expandCollapse: { type: "boolean" },
								drillDown: { type: "boolean" },
								exportOptions: { type: "array", items: { type: "string" } },
								realTimeUpdates: { type: "boolean" },
							},
						},
						performance: {
							type: "object",
							description: "Performance optimization settings",
							properties: {
								lazyLoading: { type: "boolean" },
								virtualScrolling: { type: "boolean" },
								dataCaching: { type: "boolean" },
								skeletonLoaders: { type: "boolean" },
								progressiveEnhancement: { type: "boolean" },
							},
						},
						framework: {
							type: "string",
							enum: ["react", "vue", "angular", "svelte", "static", "any"],
							description: "Preferred frontend framework",
						},
						componentLibrary: {
							type: "string",
							description: "Preferred component library",
						},
						iterationCycle: {
							type: "object",
							description: "Design iteration configuration",
							properties: {
								includeABTesting: { type: "boolean" },
								includeAnalytics: { type: "boolean" },
								includeFeedbackWidget: { type: "boolean" },
								includeUsabilityMetrics: { type: "boolean" },
							},
						},
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeDisclaimer: { type: "boolean" },
						includeReferences: { type: "boolean" },
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
							description: "Prompting techniques to include",
						},
						includeTechniqueHints: { type: "boolean" },
						autoSelectTechniques: { type: "boolean" },
						provider: {
							type: "string",
							enum: PROVIDER_ENUM_VALUES,
						},
						style: { type: "string", enum: ["markdown", "xml"] },
					},
					required: [],
				},
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Coverage Dashboard Design Prompt Builder",
				},
			},
			{
				name: "clean-code-scorer",
				description:
					"Calculate code quality scores (0-100) with metrics for hygiene, test coverage, TypeScript, linting, documentation, and security. BEST FOR: code review automation, refactoring prioritization, CI quality gates. OUTPUTS: Quality score, metrics, improvement recommendations.",
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
				annotations: {
					...ANALYSIS_TOOL_ANNOTATIONS,
					title: "Clean Code Quality Scorer",
				},
			},
			{
				name: "code-hygiene-analyzer",
				description:
					"Analyze codebase for outdated patterns, unused dependencies, deprecated APIs, code smells, and technical debt with modernization recommendations. BEST FOR: legacy code assessment, dependency cleanup, code modernization. OUTPUTS: Hygiene analysis with prioritized recommendations.",
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
				annotations: {
					...ANALYSIS_TOOL_ANNOTATIONS,
					title: "Code Hygiene Analyzer",
				},
			},
			{
				name: "dependency-auditor",
				description:
					"Multi-language dependency auditor for JavaScript, Python, Go, Rust, Ruby, C++, and Lua to detect vulnerabilities, deprecated packages, and outdated versions. BEST FOR: security scanning, dependency updates, vulnerability assessment. OUTPUTS: Vulnerability reports with remediation guidance.",
				inputSchema: {
					type: "object",
					properties: {
						dependencyContent: {
							type: "string",
							description:
								"Content of dependency file (package.json, requirements.txt, pyproject.toml, go.mod, Cargo.toml, Gemfile, vcpkg.json, or rockspec)",
						},
						packageJsonContent: {
							type: "string",
							description:
								"Content of package.json file (deprecated: use dependencyContent)",
						},
						fileType: {
							type: "string",
							enum: [
								"package.json",
								"requirements.txt",
								"pyproject.toml",
								"pipfile",
								"go.mod",
								"Cargo.toml",
								"Gemfile",
								"vcpkg.json",
								"conanfile.txt",
								"rockspec",
								"auto",
							],
							description:
								"Type of dependency file. Use 'auto' for automatic detection based on content.",
							default: "auto",
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
							description: "Suggest modern alternatives",
							default: true,
						},
						analyzeBundleSize: {
							type: "boolean",
							description: "Analyze bundle size concerns (JavaScript only)",
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
					required: [],
				},
				annotations: {
					...ANALYSIS_TOOL_ANNOTATIONS,
					title: "Dependency Security Auditor",
				},
			},
			{
				name: "iterative-coverage-enhancer",
				description:
					"Iteratively analyze test coverage gaps, detect dead code, generate test suggestions, and recommend adaptive coverage thresholds. BEST FOR: test coverage optimization, dead code elimination, test suite enhancement, coverage threshold management. OUTPUTS: Test suggestions with coverage gap analysis.",
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
				annotations: {
					...ANALYSIS_TOOL_ANNOTATIONS,
					title: "Test Coverage Enhancer",
				},
			},
			{
				name: "mermaid-diagram-generator",
				description:
					"Generate Mermaid diagrams from descriptions with support for flowcharts, sequence diagrams, class diagrams, state machines, and ERDs including auto-validation and repair. BEST FOR: architecture documentation, process flows, data modeling. OUTPUTS: Validated Mermaid syntax.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Mermaid Diagram Generator",
				},
			},
			{
				name: "memory-context-optimizer",
				description:
					"Optimize AI agent prompt caching and context window utilization for token efficiency, reduced API costs, and improved response quality. BEST FOR: token reduction, context management, API cost optimization, long-running sessions. OUTPUTS: Optimized context and caching recommendations.",
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
				annotations: {
					...ANALYSIS_TOOL_ANNOTATIONS,
					title: "Memory Context Optimizer",
				},
			},
			{
				name: "domain-neutral-prompt-builder",
				description:
					"Build domain-agnostic prompts from objectives, workflows, and capabilities without domain assumptions for flexible cross-domain execution. BEST FOR: cross-domain applications, general workflows, domain-independent tasks, flexible templates. OUTPUTS: Domain-neutral structured prompts.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Domain-Neutral Prompt Builder",
				},
			},
			{
				name: "security-hardening-prompt-builder",
				description:
					"Generate OWASP-aligned security assessment prompts with threat modeling, vulnerability analysis, compliance support (NIST, ISO-27001, SOC-2), and remediation guidance. BEST FOR: security audits, penetration testing, threat modeling. OUTPUTS: Security analysis prompts with threat matrices.",
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
							enum: PROVIDER_ENUM_VALUES,
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Security Hardening Prompt Generator",
				},
			},
			{
				name: "quick-developer-prompts-builder",
				description:
					"Generate 'Best of 25' developer prompts with checklist prompts across 5 categories: strategy & planning, code quality, testing, documentation, and DevOps. BEST FOR: rapid code analysis, daily standups, progress tracking, quick reviews. OUTPUTS: Category-organized actionable checklists.",
				inputSchema: {
					type: "object",
					properties: {
						category: {
							type: "string",
							enum: [
								"strategy",
								"code-quality",
								"testing",
								"documentation",
								"devops",
								"all",
							],
							description:
								"Category of prompts to generate. Use 'all' for all 25 prompts or select a specific category",
						},
						mode: { type: "string" },
						model: { type: "string" },
						tools: { type: "array", items: { type: "string" } },
						includeFrontmatter: { type: "boolean" },
						includeMetadata: { type: "boolean" },
						inputFile: { type: "string" },
						forcePromptMdStyle: { type: "boolean" },
					},
					required: [],
				},
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Quick Developer Prompts",
				},
			},
			{
				name: "sprint-timeline-calculator",
				description:
					"Calculate sprint timelines, velocity projections, and iteration schedules by inputting story points and team capacity to generate realistic delivery forecasts. BEST FOR: project estimation, sprint planning, capacity analysis. OUTPUTS: Timeline and resource allocation.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Sprint Timeline Calculator",
				},
			},
			{
				name: "model-compatibility-checker",
				description:
					"Recommend optimal AI models for tasks by comparing Claude, GPT-4, Gemini, and other models based on capabilities, context length, budget, and task-specific requirements. BEST FOR: model selection, cost optimization, capability matching. OUTPUTS: Ranked recommendations with rationale.",
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
				annotations: {
					...ANALYSIS_TOOL_ANNOTATIONS,
					title: "AI Model Compatibility Checker",
				},
			},
			{
				name: "guidelines-validator",
				description:
					"Validate development practices, workflows, and architectural decisions against AI agent guidelines for prompting strategies, code management, and architecture patterns. BEST FOR: practice auditing, workflow compliance, AI best practices validation. OUTPUTS: Detailed validation reports.",
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
				annotations: {
					...ANALYSIS_TOOL_ANNOTATIONS,
					title: "AI Guidelines Validator",
				},
			},
			{
				name: "semantic-code-analyzer",
				description:
					"Perform semantic code analysis with language server protocols to identify symbols, analyze structure, map dependencies, and find references. BEST FOR: code navigation, dependency analysis, symbol discovery, reference tracking. OUTPUTS: Comprehensive semantic analysis reports.",
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
				annotations: {
					...ANALYSIS_TOOL_ANNOTATIONS,
					title: "Semantic Code Analyzer",
				},
			},
			{
				name: "project-onboarding",
				description:
					"Execute comprehensive project onboarding including structure analysis, dependency detection, technology stack identification, and documentation generation. BEST FOR: new developer onboarding, project documentation, codebase exploration. OUTPUTS: Onboarding documentation with setup instructions.",
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
				annotations: {
					...FILESYSTEM_TOOL_ANNOTATIONS,
					title: "Project Onboarding Scanner",
				},
			},
			{
				name: "mode-switcher",
				description:
					"Switch between specialized agent modes (planning, editing, analysis, debugging, refactoring, documentation) with mode-appropriate tool sets and prompting strategies. BEST FOR: workflow transitions, context switching, mode-based optimization. OUTPUTS: Mode configuration with tailored toolsets.",
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
				annotations: {
					...SESSION_TOOL_ANNOTATIONS,
					title: "Agent Mode Switcher",
				},
			},
			{
				name: "prompting-hierarchy-evaluator",
				description:
					"Evaluate prompt quality with hierarchical taxonomy and numeric scoring based on clarity, specificity, completeness, and cognitive complexity. BEST FOR: prompt quality assessment, effectiveness measurement, prompt optimization. OUTPUTS: Detailed scores with improvement recommendations.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Prompt Quality Evaluator",
				},
			},
			{
				name: "prompt-hierarchy",
				description:
					"Unified prompting hierarchy tool with modes: 'build' (create prompts), 'select' (recommend level), 'evaluate' (score quality). BEST FOR: all hierarchy operations, prompt creation, level selection, quality assessment. OUTPUTS: Mode-specific structured responses.",
				inputSchema: {
					type: "object",
					properties: {
						mode: {
							type: "string",
							enum: ["build", "select", "evaluate"],
							description:
								"Operation mode: 'build' creates prompts, 'select' recommends hierarchy level, 'evaluate' scores prompts",
							examples: ["build", "evaluate", "select"],
						},
						// Build mode fields
						context: {
							type: "string",
							description: "Build mode: Broad context or domain",
						},
						goal: {
							type: "string",
							description: "Build mode: Specific goal or objective",
						},
						requirements: {
							type: "array",
							items: { type: "string" },
							description: "Build mode: Detailed requirements and constraints",
						},
						outputFormat: {
							type: "string",
							description: "Build mode: Desired output format",
						},
						audience: {
							type: "string",
							description: "Build mode: Target audience or expertise level",
						},
						// Select mode fields
						taskDescription: {
							type: "string",
							description: "Select mode: Description of the task",
							examples: [
								"Review code for security vulnerabilities",
								"Design a caching strategy for user sessions",
							],
						},
						agentCapability: {
							type: "string",
							enum: ["novice", "intermediate", "advanced", "expert"],
							description: "Select mode: Agent's capability level",
						},
						taskComplexity: {
							type: "string",
							enum: ["simple", "moderate", "complex", "very-complex"],
							description: "Select mode: Task complexity level",
						},
						autonomyPreference: {
							type: "string",
							enum: ["low", "medium", "high"],
							description: "Select mode: Desired autonomy level",
						},
						// Evaluate mode fields
						promptText: {
							type: "string",
							description: "Evaluate mode: The prompt text to evaluate",
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
							description: "Evaluate mode: Expected hierarchy level",
						},
						// Shared optional fields
						includeExamples: {
							type: "boolean",
							description: "Include examples in output",
						},
						includeReferences: {
							type: "boolean",
							description: "Include reference links",
						},
						includeRecommendations: {
							type: "boolean",
							description: "Include improvement recommendations",
						},
						includeMetadata: {
							type: "boolean",
							description: "Include metadata section",
						},
						includeFrontmatter: {
							type: "boolean",
							description: "Include YAML frontmatter",
						},
						includeDisclaimer: {
							type: "boolean",
							description: "Include disclaimer section",
						},
					},
					required: ["mode"],
				},
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Unified Prompt Hierarchy Tool",
				},
			},
			{
				name: "hierarchy-level-selector",
				description:
					"Select optimal prompting hierarchy level (independent, indirect, direct, modeling, scaffolding, full-physical) based on task complexity and agent capability. BEST FOR: prompt guidance calibration, autonomy tuning, task-capability matching. OUTPUTS: Recommended hierarchy level with justification.",
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
				annotations: {
					...GENERATION_TOOL_ANNOTATIONS,
					title: "Prompt Hierarchy Level Selector",
				},
			},
			promptChainingBuilderSchema,
			promptFlowBuilderSchema,
			{
				name: "design-assistant",
				description:
					"Orchestrate multi-phase design workflows with constraint validation, coverage enforcement, ADR generation, and specification creation. BEST FOR: architecture decisions, feature design, technical planning, design documentation. OUTPUTS: ADRs, specifications, roadmaps.",
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
				annotations: {
					...SESSION_TOOL_ANNOTATIONS,
					title: "Design Session Assistant",
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
			case "coverage-dashboard-design-prompt-builder":
				return coverageDashboardDesignPromptBuilder(args);
			case "domain-neutral-prompt-builder":
				return domainNeutralPromptBuilder(args);
			case "security-hardening-prompt-builder":
				return securityHardeningPromptBuilder(args);
			case "quick-developer-prompts-builder":
				return quickDeveloperPromptsBuilder(args);
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
			case "prompt-hierarchy":
				return promptHierarchy(args);
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

// Export server for testing
export { server };

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
