#!/usr/bin/env node

/**
 * Tool Documentation Generator
 *
 * Generates comprehensive documentation for all MCP tools following the gold standard
 * established by hierarchical-prompt-builder.md. This generator creates detailed,
 * consistent documentation including:
 * - Header with images and badges
 * - Overview with key capabilities
 * - When to Use section (good for / not ideal for)
 * - Basic Usage with JSON examples
 * - Parameters table with detailed descriptions
 * - What You Get section (output structure)
 * - Real-World Examples
 * - Tips & Tricks
 * - Related Tools
 * - Workflow Integration with mermaid diagrams
 * - Related Documentation (collapsible)
 * - Footer with links
 *
 * Usage: node scripts/generate-tool-docs.js [--dry-run] [--tool=<name>] [--force] [--clean]
 *
 * Options:
 *   --dry-run    Preview changes without writing files
 *   --tool=NAME  Generate docs for a specific tool only
 *   --force      Overwrite existing documentation even if comprehensive
 *   --clean      Remove existing file before generating (complete overwrite)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tool metadata extracted from README.md
const TOOLS_METADATA = [
	// Prompt Builders
	{
		name: "hierarchical-prompt-builder",
		title: "Build structured prompts with clear hierarchies",
		complexity: "⭐⭐",
		category: "Prompt Builders",
		time: "15-30 minutes",
		description: "Create prompts with context → goal → requirements structure",
		keyFeatures: [
			"Multi-level specificity (context, goal, requirements)",
			"Supports markdown and XML output formats",
			"Auto-technique selection or manual override",
			"Model-specific optimizations",
		],
		parameters: {
			required: ["context", "goal"],
			optional: [
				"requirements",
				"audience",
				"style",
				"outputFormat",
				"techniques",
				"autoSelectTechniques",
				"provider",
			],
		},
		relatedTools: [
			"prompt-chaining-builder",
			"prompt-flow-builder",
			"prompting-hierarchy-evaluator",
		],
	},
	{
		name: "prompt-chaining-builder",
		title: "Build multi-step prompt chains",
		complexity: "⭐⭐",
		category: "Prompt Builders",
		time: "15-30 minutes",
		description: "Sequential workflows with output passing and error handling",
		keyFeatures: [
			"Multi-step sequences with dependencies",
			"Output passing between steps",
			"Error handling (skip, retry, abort)",
			"Global variables and context",
		],
		parameters: {
			required: ["chainName", "steps"],
			optional: [
				"context",
				"description",
				"executionStrategy",
				"globalVariables",
				"includeVisualization",
			],
		},
		relatedTools: ["prompt-flow-builder", "hierarchical-prompt-builder"],
	},
	{
		name: "prompt-flow-builder",
		title: "Declarative prompt flows with branching",
		complexity: "⭐⭐⭐",
		category: "Prompt Builders",
		time: "1-2 hours",
		description: "Conditional branching, loops, and parallel execution",
		keyFeatures: [
			"Conditional branching logic",
			"Loop constructs",
			"Parallel execution nodes",
			"Mermaid flow visualization",
		],
		parameters: {
			required: ["flowName", "nodes"],
			optional: [
				"description",
				"edges",
				"entryPoint",
				"variables",
				"outputFormat",
			],
		},
		relatedTools: ["prompt-chaining-builder", "mermaid-diagram-generator"],
	},
	{
		name: "security-hardening-prompt-builder",
		title: "Security analysis and hardening prompts",
		complexity: "⭐⭐⭐",
		category: "Prompt Builders",
		time: "1-2 hours",
		description: "OWASP Top 10, compliance checks, threat modeling",
		keyFeatures: [
			"OWASP Top 10 coverage",
			"Compliance standards (NIST, ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS)",
			"Vulnerability analysis and threat modeling",
			"Secure code examples and test cases",
		],
		parameters: {
			required: ["codeContext"],
			optional: [
				"securityFocus",
				"analysisScope",
				"complianceStandards",
				"riskTolerance",
				"includeMitigations",
			],
		},
		relatedTools: ["code-analysis-prompt-builder", "clean-code-scorer"],
	},
	{
		name: "domain-neutral-prompt-builder",
		title: "Domain-neutral prompts and templates",
		complexity: "⭐⭐⭐",
		category: "Prompt Builders",
		time: "1-2 hours",
		description: "Objectives, scope, workflow, capabilities, risks, acceptance",
		keyFeatures: [
			"Comprehensive prompt structure (objectives, scope, I/O, workflow)",
			"Risk and compliance sections",
			"Acceptance tests and success metrics",
			"Flexible milestone tracking",
		],
		parameters: {
			required: ["title", "summary"],
			optional: [
				"objectives",
				"workflow",
				"capabilities",
				"risks",
				"acceptanceTests",
				"milestones",
			],
		},
		relatedTools: [
			"hierarchical-prompt-builder",
			"debugging-assistant-prompt-builder",
		],
	},
	{
		name: "spark-prompt-builder",
		title: "UI/UX product prompts",
		complexity: "⭐⭐⭐",
		category: "Prompt Builders",
		time: "1-2 hours",
		description: "Features, colors, typography, animations, components",
		keyFeatures: [
			"Color scheme and palette definitions",
			"Typography and spacing rules",
			"Animation philosophy and hierarchy",
			"Component states and variations",
		],
		parameters: {
			required: [
				"title",
				"summary",
				"complexityLevel",
				"designDirection",
				"colorSchemeType",
			],
			optional: ["features", "components", "typography", "states", "edgeCases"],
		},
		relatedTools: ["mermaid-diagram-generator"],
	},
	{
		name: "architecture-design-prompt-builder",
		title: "System architecture design prompts",
		complexity: "⭐⭐⭐",
		category: "Prompt Builders",
		time: "1-2 hours",
		description: "Scale-appropriate guidance (small/medium/large)",
		keyFeatures: [
			"Scale-based recommendations",
			"Technology stack considerations",
			"System requirements and constraints",
			"Architecture patterns and best practices",
		],
		parameters: {
			required: ["systemRequirements"],
			optional: ["scale", "technologyStack"],
		},
		relatedTools: [
			"l9-distinguished-engineer-prompt-builder",
			"digital-enterprise-architect-prompt-builder",
		],
	},
	{
		name: "debugging-assistant-prompt-builder",
		title: "Systematic debugging prompts",
		complexity: "⭐⭐",
		category: "Prompt Builders",
		time: "15-30 minutes",
		description: "Structured analysis for troubleshooting",
		keyFeatures: [
			"Error description templates",
			"Attempted solutions tracking",
			"Context gathering",
			"Systematic debugging steps",
		],
		parameters: {
			required: ["errorDescription"],
			optional: ["context", "attemptedSolutions"],
		},
		relatedTools: ["code-analysis-prompt-builder"],
	},
	{
		name: "documentation-generator-prompt-builder",
		title: "Technical documentation prompts",
		complexity: "⭐⭐",
		category: "Prompt Builders",
		time: "15-30 minutes",
		description: "API docs, user guides, technical specs",
		keyFeatures: [
			"Content type templates (API, user guide, technical spec)",
			"Audience targeting",
			"Existing content integration",
			"Structured documentation formats",
		],
		parameters: {
			required: ["contentType"],
			optional: ["targetAudience", "existingContent"],
		},
		relatedTools: [],
	},
	{
		name: "code-analysis-prompt-builder",
		title: "Code analysis prompts",
		complexity: "⭐⭐",
		category: "Prompt Builders",
		time: "15-30 minutes",
		description: "Security, performance, maintainability focus",
		keyFeatures: [
			"Focus area selection (security, performance, maintainability)",
			"Language-specific analysis",
			"Codebase context awareness",
			"Structured analysis output",
		],
		parameters: {
			required: ["codebase"],
			optional: ["focusArea", "language"],
		},
		relatedTools: ["security-hardening-prompt-builder", "clean-code-scorer"],
	},
	{
		name: "digital-enterprise-architect-prompt-builder",
		title: "Enterprise architecture strategy",
		complexity: "⭐⭐⭐⭐",
		category: "Prompt Builders",
		time: "Half day",
		description: "Mentor perspectives and current research",
		keyFeatures: [
			"Strategic problem framing",
			"Business drivers and stakeholders",
			"Compliance and technology guardrails",
			"Innovation themes and research benchmarking",
		],
		parameters: {
			required: ["initiativeName", "problemStatement"],
			optional: [
				"businessDrivers",
				"targetUsers",
				"complianceObligations",
				"innovationThemes",
			],
		},
		relatedTools: [
			"architecture-design-prompt-builder",
			"l9-distinguished-engineer-prompt-builder",
		],
	},
	{
		name: "l9-distinguished-engineer-prompt-builder",
		title: "L9 Distinguished Engineer prompts",
		complexity: "⭐⭐⭐⭐⭐",
		category: "Prompt Builders",
		time: "1-2 days",
		description: "High-level software architecture and system design",
		keyFeatures: [
			"Technical challenge framing",
			"Performance targets (SLOs/SLAs)",
			"Security and observability requirements",
			"Migration strategy and team context",
		],
		parameters: {
			required: ["projectName", "technicalChallenge"],
			optional: [
				"techStack",
				"performanceTargets",
				"securityRequirements",
				"migrationStrategy",
			],
		},
		relatedTools: [
			"digital-enterprise-architect-prompt-builder",
			"architecture-design-prompt-builder",
		],
	},

	// Code Analysis & Quality Tools
	{
		name: "dependency-auditor",
		title: "Analyze package.json for issues",
		complexity: "⭐",
		category: "Code Analysis",
		time: "5-10 minutes",
		description:
			"Outdated, deprecated, or insecure packages with modern alternatives",
		keyFeatures: [
			"Outdated version detection",
			"Deprecated package identification",
			"Known vulnerability checks",
			"ESM-compatible alternatives",
			"Bundle size analysis",
		],
		parameters: {
			required: ["packageJsonContent"],
			optional: [
				"checkOutdated",
				"checkDeprecated",
				"checkVulnerabilities",
				"suggestAlternatives",
				"analyzeBundleSize",
			],
		},
		relatedTools: ["code-hygiene-analyzer", "iterative-coverage-enhancer"],
	},
	{
		name: "clean-code-scorer",
		title: "Calculate Clean Code score (0-100)",
		complexity: "⭐⭐",
		category: "Code Analysis",
		time: "15-30 minutes",
		description:
			"Code hygiene, test coverage, TypeScript, linting, docs, security",
		keyFeatures: [
			"Comprehensive 0-100 score",
			"Multiple quality metrics (hygiene, coverage, linting)",
			"TypeScript type safety analysis",
			"Documentation completeness",
			"Security best practices",
		],
		parameters: {
			required: [],
			optional: [
				"projectPath",
				"codeContent",
				"coverageMetrics",
				"language",
				"framework",
			],
		},
		relatedTools: ["code-hygiene-analyzer", "iterative-coverage-enhancer"],
	},
	{
		name: "code-hygiene-analyzer",
		title: "Outdated patterns and unused dependencies",
		complexity: "⭐⭐",
		category: "Code Analysis",
		time: "15-30 minutes",
		description: "Detect code smells and hygiene issues",
		keyFeatures: [
			"Outdated pattern detection",
			"Unused dependency identification",
			"Code smell analysis",
			"Best practice recommendations",
		],
		parameters: {
			required: ["codeContent", "language"],
			optional: ["framework", "includeReferences"],
		},
		relatedTools: ["dependency-auditor", "clean-code-scorer"],
	},
	{
		name: "iterative-coverage-enhancer",
		title: "Analyze coverage gaps and suggest tests",
		complexity: "⭐⭐",
		category: "Code Analysis",
		time: "15-30 minutes",
		description: "Gap detection, test suggestions, adaptive thresholds",
		keyFeatures: [
			"Coverage gap analysis",
			"Test case suggestions",
			"Dead code detection",
			"Adaptive threshold recommendations",
			"CI/CD integration guidance",
		],
		parameters: {
			required: [],
			optional: [
				"projectPath",
				"currentCoverage",
				"targetCoverage",
				"analyzeCoverageGaps",
				"generateTestSuggestions",
			],
		},
		relatedTools: ["clean-code-scorer", "dependency-auditor"],
	},
	{
		name: "semantic-code-analyzer",
		title: "Semantic code analysis",
		complexity: "⭐⭐",
		category: "Code Analysis",
		time: "15-30 minutes",
		description: "Symbols, structure, dependencies, patterns",
		keyFeatures: [
			"Symbol extraction and analysis",
			"Code structure mapping",
			"Dependency graph generation",
			"Pattern detection",
		],
		parameters: {
			required: ["codeContent"],
			optional: ["analysisType", "language", "includeMetadata"],
		},
		relatedTools: ["code-hygiene-analyzer"],
	},

	// Strategy & Planning Tools
	{
		name: "strategy-frameworks-builder",
		title: "Strategy analysis frameworks",
		complexity: "⭐⭐⭐",
		category: "Strategy & Planning",
		time: "1-2 hours",
		description: "SWOT, BSC, VRIO, Porter Five Forces, McKinsey 7S, etc.",
		keyFeatures: [
			"15+ strategy frameworks (SWOT, BSC, VRIO, Porter, McKinsey 7S)",
			"Multi-framework composition",
			"Context-aware analysis",
			"Actionable insights generation",
		],
		parameters: {
			required: ["frameworks", "context"],
			optional: ["objectives", "stakeholders", "constraints"],
		},
		relatedTools: ["gap-frameworks-analyzers", "sprint-timeline-calculator"],
	},
	{
		name: "gap-frameworks-analyzers",
		title: "Gap analysis frameworks",
		complexity: "⭐⭐⭐",
		category: "Strategy & Planning",
		time: "1-2 hours",
		description: "Capability, performance, maturity, skills, technology gaps",
		keyFeatures: [
			"Current vs desired state analysis",
			"12 framework types (capability, performance, maturity, skills, technology)",
			"Action plan generation",
			"Stakeholder impact assessment",
		],
		parameters: {
			required: ["frameworks", "currentState", "desiredState", "context"],
			optional: [
				"objectives",
				"stakeholders",
				"timeframe",
				"includeActionPlan",
			],
		},
		relatedTools: ["strategy-frameworks-builder", "sprint-timeline-calculator"],
	},
	{
		name: "sprint-timeline-calculator",
		title: "Sprint timelines and development cycles",
		complexity: "⭐",
		category: "Strategy & Planning",
		time: "5-10 minutes",
		description: "Dependency-aware scheduling, optimal cycles",
		keyFeatures: [
			"Dependency-aware task scheduling",
			"Velocity-based planning",
			"Sprint capacity calculation",
			"Optimization strategies (greedy, linear programming)",
		],
		parameters: {
			required: ["tasks", "teamSize"],
			optional: ["sprintLength", "velocity", "optimizationStrategy"],
		},
		relatedTools: ["strategy-frameworks-builder", "project-onboarding"],
	},

	// Design & Workflow Tools
	{
		name: "design-assistant",
		title: "Deterministic design sessions",
		complexity: "⭐⭐⭐⭐",
		category: "Design & Workflow",
		time: "Half day",
		description:
			"Constraint-based workflow, session/phase management, artifacts",
		keyFeatures: [
			"Multi-phase design sessions",
			"YAML-based constraint framework",
			"Coverage enforcement (85% threshold)",
			"Artifact generation (ADRs, specs, roadmaps)",
			"Cross-session consistency validation",
		],
		parameters: {
			required: ["action", "sessionId"],
			optional: ["config", "phaseId", "artifactTypes", "constraintConfig"],
		},
		relatedTools: [
			"mermaid-diagram-generator",
			"domain-neutral-prompt-builder",
		],
	},
	{
		name: "mermaid-diagram-generator",
		title: "Generate Mermaid diagrams",
		complexity: "⭐⭐",
		category: "Design & Workflow",
		time: "15-30 minutes",
		description: "12+ diagram types with accessibility and customization",
		keyFeatures: [
			"12+ diagram types (flowchart, sequence, class, state, gantt, pie, ER)",
			"Accessibility support (accTitle, accDescr)",
			"Theme customization",
			"Auto-repair on validation errors",
		],
		parameters: {
			required: ["description", "diagramType"],
			optional: [
				"theme",
				"direction",
				"customStyles",
				"advancedFeatures",
				"repair",
			],
		},
		relatedTools: ["design-assistant", "prompt-flow-builder"],
	},

	// Utility Tools
	{
		name: "model-compatibility-checker",
		title: "Recommend AI models for tasks",
		complexity: "⭐",
		category: "Utilities",
		time: "5-10 minutes",
		description: "Best model for task, budget, context length requirements",
		keyFeatures: [
			"Task-based model recommendations",
			"Budget considerations",
			"Context length requirements",
			"Multimodal capability checks",
		],
		parameters: {
			required: ["taskDescription"],
			optional: ["requirements", "budget", "language", "includeCodeExamples"],
		},
		relatedTools: [],
	},
	{
		name: "guidelines-validator",
		title: "Validate against AI agent guidelines",
		complexity: "⭐",
		category: "Utilities",
		time: "5-10 minutes",
		description: "Prompting, code, architecture, visualization best practices",
		keyFeatures: [
			"Practice validation against established guidelines",
			"Category-specific rules (prompting, code, architecture, viz, memory, workflow)",
			"Actionable recommendations",
			"Best practice references",
		],
		parameters: {
			required: ["practiceDescription", "category"],
			optional: [],
		},
		relatedTools: ["prompting-hierarchy-evaluator"],
	},
	{
		name: "hierarchy-level-selector",
		title: "Select prompting hierarchy level",
		complexity: "⭐",
		category: "Utilities",
		time: "5-10 minutes",
		description:
			"Independent, indirect, direct, modeling, scaffolding, full-physical",
		keyFeatures: [
			"Task complexity assessment",
			"Agent capability matching",
			"Autonomy preference consideration",
			"Level recommendations with examples",
		],
		parameters: {
			required: ["taskDescription"],
			optional: [
				"taskComplexity",
				"agentCapability",
				"autonomyPreference",
				"includeExamples",
			],
		},
		relatedTools: [
			"prompting-hierarchy-evaluator",
			"hierarchical-prompt-builder",
		],
	},
	{
		name: "prompting-hierarchy-evaluator",
		title: "Evaluate prompt quality",
		complexity: "⭐⭐",
		category: "Utilities",
		time: "15-30 minutes",
		description:
			"Numeric scoring (clarity, specificity, completeness, complexity)",
		keyFeatures: [
			"Multi-dimensional scoring (clarity, specificity, completeness, cognitive complexity)",
			"Hierarchical taxonomy evaluation",
			"Improvement recommendations",
			"Reinforcement learning-inspired metrics",
		],
		parameters: {
			required: ["promptText"],
			optional: ["targetLevel", "context", "includeRecommendations"],
		},
		relatedTools: ["hierarchy-level-selector", "hierarchical-prompt-builder"],
	},
	{
		name: "mode-switcher",
		title: "Switch agent operation modes",
		complexity: "⭐",
		category: "Utilities",
		time: "5-10 minutes",
		description:
			"Planning, editing, analysis, debugging, refactoring, documentation",
		keyFeatures: [
			"Mode switching (planning, editing, analysis, interactive, debugging)",
			"Context-aware tool sets",
			"Prompting strategy adjustment",
			"Workflow optimization",
		],
		parameters: {
			required: ["targetMode"],
			optional: ["currentMode", "context", "reason"],
		},
		relatedTools: [],
	},
	{
		name: "project-onboarding",
		title: "Comprehensive project onboarding",
		complexity: "⭐⭐",
		category: "Utilities",
		time: "15-30 minutes",
		description: "Structure analysis, dependencies, memory generation",
		keyFeatures: [
			"Project structure scanning",
			"Dependency detection",
			"Technology stack identification",
			"Memory generation for quick context",
		],
		parameters: {
			required: ["projectPath"],
			optional: [
				"projectName",
				"projectType",
				"analysisDepth",
				"includeMemories",
			],
		},
		relatedTools: ["sprint-timeline-calculator", "semantic-code-analyzer"],
	},
	{
		name: "memory-context-optimizer",
		title: "Optimize prompt caching",
		complexity: "⭐⭐",
		category: "Utilities",
		time: "15-30 minutes",
		description: "Context window usage optimization, caching strategies",
		keyFeatures: [
			"Prompt caching optimization",
			"Context window usage analysis",
			"Caching strategies (aggressive, conservative, balanced)",
			"Token limit management",
		],
		parameters: {
			required: ["contextContent"],
			optional: ["maxTokens", "cacheStrategy", "includeReferences"],
		},
		relatedTools: [],
	},
];

/**
 * Threshold for considering a documentation file "comprehensive" (in lines).
 * Files with more lines than this threshold won't be overwritten unless --force is used.
 * Based on gold standard: hierarchical-prompt-builder.md has ~338 lines.
 */
const COMPREHENSIVE_DOC_THRESHOLD = 200;

/**
 * Category badge colors for consistent styling
 */
const CATEGORY_COLORS = {
	"Prompt Builders": "purple",
	"Code Analysis": "orange",
	"Strategy & Planning": "blue",
	"Design & Workflow": "green",
	Utilities: "gray",
};

/**
 * Get category anchor for README links
 */
function getCategoryAnchor(category) {
	const anchors = {
		"Prompt Builders": "prompt-builders",
		"Code Analysis": "code-analysis",
		"Strategy & Planning": "strategy-planning",
		"Design & Workflow": "design-workflow",
		Utilities: "utilities",
	};
	return anchors[category] || "tools";
}

/**
 * Get complexity level description
 */
function getComplexityLevel(complexity) {
	if (complexity.includes("⭐⭐⭐⭐⭐")) return "Master";
	if (complexity.includes("⭐⭐⭐⭐")) return "Expert";
	if (complexity.includes("⭐⭐⭐")) return "Advanced";
	if (complexity.includes("⭐⭐")) return "Moderate";
	return "Simple";
}

/**
 * Generate parameter type inference based on parameter name
 */
function inferParameterType(paramName) {
	const typeMap = {
		// Boolean patterns
		include: "boolean",
		auto: "boolean",
		force: "boolean",
		enable: "boolean",
		analyze: "boolean",
		generate: "boolean",
		check: "boolean",
		detect: "boolean",
		adapt: "boolean",
		prioritize: "boolean",
		// Array patterns
		requirements: "array",
		techniques: "array",
		steps: "array",
		nodes: "array",
		edges: "array",
		objectives: "array",
		stakeholders: "array",
		constraints: "array",
		frameworks: "array",
		complianceStandards: "array",
		analysisScope: "array",
		securityRequirements: "array",
		tools: "array",
		issues: "array",
		// Object patterns
		globalVariables: "object",
		variables: "object",
		coverageMetrics: "object",
		currentCoverage: "object",
		targetCoverage: "object",
		config: "object",
		// Enum patterns
		style: "enum",
		provider: "enum",
		outputFormat: "enum",
		executionStrategy: "enum",
		securityFocus: "enum",
		riskTolerance: "enum",
		category: "enum",
		targetMode: "enum",
		analysisType: "enum",
		optimizationStrategy: "enum",
		cacheStrategy: "enum",
		// Number patterns
		maxTokens: "number",
		velocity: "number",
		teamSize: "number",
		sprintLength: "number",
		// String patterns (default)
	};

	for (const [pattern, type] of Object.entries(typeMap)) {
		if (
			paramName.toLowerCase().includes(pattern.toLowerCase()) ||
			paramName === pattern
		) {
			return type;
		}
	}
	return "string";
}

/**
 * Generate smart parameter description based on parameter name and tool context
 */
function generateParameterDescription(paramName, _tool) {
	const descriptionMap = {
		// Common parameters
		context: "Broad context or domain background for the task",
		goal: "Specific objective or target outcome",
		requirements:
			"Detailed requirements and constraints as an array of strings",
		audience: "Target audience or expertise level (e.g., 'Senior engineers')",
		style: "Output format style: `markdown` or `xml`",
		outputFormat: "Desired output format specification",
		provider:
			"AI model provider for optimizations (e.g., `gpt-5`, `claude-4`, `gemini-2.5`)",
		techniques:
			"Prompting techniques to apply (e.g., `chain-of-thought`, `few-shot`)",
		autoSelectTechniques:
			"Automatically select optimal techniques based on context",
		includeDisclaimer: "Append third-party disclaimer section",
		includePitfalls: "Include common pitfalls section",
		includeReferences: "Add external references and documentation links",
		includeTechniqueHints: "Include technique-specific guidance",
		includeMetadata: "Include metadata section with timestamps and source info",
		includeVisualization: "Generate mermaid diagram visualization",
		includeCodeExamples: "Include code examples in output",
		includeExamples: "Include example scenarios",

		// Prompt chaining parameters
		chainName: "Name identifier for the prompt chain",
		steps: "Array of chain step objects with name, prompt, and dependencies",
		executionStrategy:
			"Execution mode: `sequential` or `parallel-where-possible`",
		globalVariables: "Variables accessible to all steps in the chain",

		// Flow builder parameters
		flowName: "Name identifier for the prompt flow",
		nodes: "Array of flow node definitions with conditions and actions",
		edges: "Connections between nodes defining flow transitions",
		entryPoint: "Starting node for flow execution",
		variables: "Flow-level variables for state management",

		// Security parameters
		codeContext: "Code snippet or description for security analysis",
		securityFocus:
			"Analysis focus: `vulnerability-analysis`, `security-hardening`, `compliance-check`, `threat-modeling`, or `penetration-testing`",
		complianceStandards:
			"Compliance frameworks to check (e.g., `OWASP-Top-10`, `PCI-DSS`, `HIPAA`)",
		riskTolerance: "Risk acceptance level: `low`, `medium`, or `high`",
		analysisScope:
			"Security areas to analyze (e.g., `input-validation`, `authentication`)",
		securityRequirements: "Specific security requirements to validate",
		includeMitigations: "Include specific mitigation recommendations",
		includeTestCases: "Generate security test cases",
		prioritizeFindings: "Prioritize findings by severity",

		// Code analysis parameters
		codeContent: "Source code content to analyze",
		language: "Programming language (e.g., `typescript`, `python`, `java`)",
		framework:
			"Framework or technology stack (e.g., `express`, `react`, `django`)",
		packageJsonContent: "Content of package.json file for dependency analysis",
		checkOutdated: "Check for outdated package versions",
		checkDeprecated: "Check for deprecated packages",
		checkVulnerabilities: "Check for known security vulnerabilities",
		suggestAlternatives: "Suggest modern alternatives for outdated packages",
		analyzeBundleSize: "Analyze bundle size impact",
		projectPath: "Path to the project root directory",
		coverageMetrics: "Current test coverage metrics object",
		currentCoverage: "Current coverage percentages by type",
		targetCoverage: "Target coverage goals to achieve",
		analyzeCoverageGaps: "Analyze and identify coverage gaps",
		generateTestSuggestions: "Generate test suggestions for uncovered code",
		detectDeadCode: "Detect unused code for elimination",
		adaptThresholds: "Recommend adaptive coverage threshold adjustments",
		generateCIActions: "Generate CI/CD integration actions",

		// Strategy parameters
		frameworks:
			"Strategy frameworks to apply (e.g., `swot`, `balancedScorecard`, `vrio`)",
		objectives: "Strategic objectives to analyze",
		stakeholders: "Key stakeholders to consider",
		currentState: "Description of current state for gap analysis",
		desiredState: "Description of desired future state",
		timeframe: "Analysis timeframe (e.g., '6 months', '1 year')",
		includeActionPlan: "Generate actionable implementation plan",

		// Sprint/planning parameters
		tasks: "Array of task objects with estimates and dependencies",
		teamSize: "Number of team members available",
		sprintLength: "Sprint duration in days (default: 14)",
		velocity: "Team velocity in story points per sprint",
		optimizationStrategy:
			"Scheduling optimization: `greedy` or `linear-programming`",

		// Design assistant parameters
		action:
			"Design action: `start-session`, `advance-phase`, `check-coverage`, `generate-artifact`",
		sessionId: "Unique session identifier",
		phaseId: "Current design phase identifier",
		artifactTypes:
			"Types of artifacts to generate (e.g., `adr`, `spec`, `roadmap`)",
		constraintConfig: "Custom constraint configuration",

		// Mermaid parameters
		description: "Description of the diagram to generate",
		diagramType:
			"Diagram type: `flowchart`, `sequence`, `class`, `state`, `gantt`, `pie`, `er`",
		theme: "Visual theme: `default`, `dark`, `forest`, `neutral`",
		direction: "Flow direction: `TB`, `LR`, `BT`, `RL`",
		customStyles: "Custom CSS styles for diagram elements",
		advancedFeatures: "Enable advanced mermaid features",
		repair: "Auto-repair on validation errors",

		// Utility parameters
		taskDescription: "Description of the task for model selection",
		budget: "Budget constraint: `low`, `medium`, or `high`",
		practiceDescription: "Description of the development practice to validate",
		category:
			"Practice category: `prompting`, `code-management`, `architecture`, `visualization`, `memory`, `workflow`",
		taskComplexity:
			"Task complexity: `simple`, `moderate`, `complex`, or `very-complex`",
		agentCapability:
			"Agent capability level: `novice`, `intermediate`, `advanced`, or `expert`",
		autonomyPreference: "Desired autonomy level: `low`, `medium`, or `high`",
		targetMode:
			"Target mode: `planning`, `editing`, `analysis`, `debugging`, `refactoring`, `documentation`",
		currentMode: "Current agent operation mode",
		reason: "Reason for the operation",
		promptText: "Prompt text to evaluate",
		targetLevel: "Target hierarchy level for evaluation",
		contextContent: "Context content for optimization",
		maxTokens: "Maximum token limit for context",
		cacheStrategy:
			"Caching strategy: `aggressive`, `conservative`, or `balanced`",
		projectName: "Project or initiative name",
		projectType: "Type of project for onboarding",
		analysisDepth: "Depth of analysis: `shallow`, `standard`, or `deep`",
		includeMemories: "Generate memory entries for quick context",
		inputFile: "Input file path for reference",

		// Domain neutral parameters
		title: "Document or prompt title",
		summary: "Brief summary or overview",
		capabilities: "Array of capability definitions",
		risks: "Risk factors and mitigation strategies",
		acceptanceTests: "Acceptance test scenarios",
		milestones: "Project milestones and deliverables",
		workflow: "Workflow steps as an array of strings",
		inputs: "Expected inputs specification",
		outputs: "Expected outputs specification",
		interfaces: "Interface contracts and definitions",
	};

	return (
		descriptionMap[paramName] ||
		`${paramName.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} parameter`
	);
}

/**
 * Generate use cases based on tool category and features
 */
function generateUseCases(tool) {
	const useCaseMap = {
		"Prompt Builders": {
			good: [
				"Complex tasks requiring detailed instructions",
				"Multi-step workflows with dependencies",
				"Standardizing prompt patterns across teams",
				"Generating consistent AI interactions",
			],
			bad: [
				"Simple, single-line questions",
				"Quick clarifications without context",
				"Tasks with obvious, minimal requirements",
			],
		},
		"Code Analysis": {
			good: [
				"Identifying code quality issues and technical debt",
				"Analyzing test coverage gaps",
				"Security vulnerability scanning",
				"Dependency health checks",
			],
			bad: [
				"Real-time code execution",
				"Replacing comprehensive security audits",
				"Performance benchmarking",
			],
		},
		"Strategy & Planning": {
			good: [
				"Strategic planning sessions",
				"Gap analysis between current and desired states",
				"Sprint and resource planning",
				"Multi-framework business analysis",
			],
			bad: [
				"Quick operational decisions",
				"Real-time project tracking",
				"Budget calculations",
			],
		},
		"Design & Workflow": {
			good: [
				"Multi-phase design sessions with constraints",
				"Generating visual diagrams and documentation",
				"Enforcing design consistency across projects",
				"Creating architecture decision records (ADRs)",
			],
			bad: [
				"Simple one-off diagrams",
				"Quick wireframe sketches",
				"Real-time collaboration",
			],
		},
		Utilities: {
			good: [
				"AI model selection based on task requirements",
				"Validating practices against established guidelines",
				"Context window optimization",
				"Project onboarding and analysis",
			],
			bad: [
				"Complex business logic decisions",
				"Security-critical operations",
				"Production deployment automation",
			],
		},
	};

	return useCaseMap[tool.category] || useCaseMap.Utilities;
}

/**
 * Generate tips based on tool category
 */
function generateTips(tool) {
	const tipsMap = {
		"Prompt Builders": {
			bestPractices: [
				"Be Specific in Goals - Vague goals lead to vague outputs",
				"Prioritize Requirements - Use keywords like CRITICAL, HIGH, NICE-TO-HAVE",
				"Define Success Criteria - How will you know when it's done?",
				"Match Style to Use Case - XML for complex structures, Markdown for readability",
			],
			mistakes: [
				"Vague context → Be specific about the domain and constraints",
				"Too many requirements → Focus on top 3-5 critical ones",
				"Mixing goals → One clear objective per prompt",
				"Ignoring audience → Tailor detail level to expertise",
			],
			proTips: [
				`Combine with related tools for comprehensive workflows`,
				`Use \`autoSelectTechniques: true\` for optimal technique selection`,
				`Enable \`includePitfalls: true\` for complex tasks`,
			],
		},
		"Code Analysis": {
			bestPractices: [
				"Provide Complete Code - Partial snippets may miss context",
				"Specify Language and Framework - Enables targeted analysis",
				"Review All Severity Levels - Not just critical issues",
				"Integrate with CI/CD - Automate quality checks",
			],
			mistakes: [
				"Ignoring low severity issues → They accumulate as tech debt",
				"Skipping context → Always specify framework and patterns",
				"One-time analysis → Regular monitoring catches regressions",
				"Trusting blindly → Validate recommendations with tests",
			],
			proTips: [
				"Combine with security hardening for comprehensive reviews",
				"Use coverage metrics to prioritize testing efforts",
				"Export results to tracking systems for follow-up",
			],
		},
		"Strategy & Planning": {
			bestPractices: [
				"Define Clear Objectives - Measurable goals drive better analysis",
				"Involve Stakeholders - List all affected parties",
				"Set Realistic Timeframes - Be honest about constraints",
				"Use Multiple Frameworks - Cross-validate insights",
			],
			mistakes: [
				"Skipping context → Always provide business background",
				"Ignoring constraints → List real limitations upfront",
				"Over-planning → Focus on actionable next steps",
				"Static analysis → Strategy needs regular review",
			],
			proTips: [
				"Combine SWOT with gap analysis for comprehensive views",
				"Use sprint calculator for realistic timelines",
				"Include action plans for implementation guidance",
			],
		},
		"Design & Workflow": {
			bestPractices: [
				"Start with Clear Goals - What should the design accomplish?",
				"Follow Phase Order - Don't skip design phases",
				"Check Coverage - Ensure all constraints are addressed",
				"Generate Artifacts - Document decisions as you go",
			],
			mistakes: [
				"Skipping phases → Each phase builds on previous ones",
				"Ignoring constraints → They exist for good reasons",
				"No artifacts → Undocumented decisions get forgotten",
				"Solo design → Get feedback early and often",
			],
			proTips: [
				"Use mermaid diagrams to visualize workflows",
				"Generate ADRs for important decisions",
				"Cross-reference with strategy frameworks",
			],
		},
		Utilities: {
			bestPractices: [
				"Match Tool to Task - Choose the right utility for the job",
				"Provide Complete Context - Utilities need information to help",
				"Review Recommendations - Don't blindly accept suggestions",
				"Integrate into Workflow - Make utilities part of your process",
			],
			mistakes: [
				"Using wrong tool → Check tool descriptions carefully",
				"Incomplete input → Provide all relevant context",
				"Ignoring output → Act on recommendations",
				"One-off usage → Build into regular workflow",
			],
			proTips: [
				"Combine utilities for more comprehensive analysis",
				"Use validation tools before committing changes",
				"Cache results for frequently used configurations",
			],
		},
	};

	return tipsMap[tool.category] || tipsMap.Utilities;
}

/**
 * Get related documentation links based on category
 */
function getRelatedDocs(tool) {
	const docsMap = {
		"Prompt Builders": [
			{
				name: "Prompting Hierarchy Guide",
				path: "../tips/PROMPTING_HIERARCHY.md",
			},
			{
				name: "Flow Prompting Examples",
				path: "../tips/FLOW_PROMPTING_EXAMPLES.md",
			},
			{ name: "AI Interaction Tips", path: "../tips/AI_INTERACTION_TIPS.md" },
		],
		"Code Analysis": [
			{
				name: "Clean Code Initiative",
				path: "../tips/CLEAN_CODE_INITIATIVE.md",
			},
			{
				name: "Code Quality Improvements",
				path: "../tips/CODE_QUALITY_IMPROVEMENTS.md",
			},
			{ name: "AI Interaction Tips", path: "../tips/AI_INTERACTION_TIPS.md" },
		],
		"Strategy & Planning": [
			{
				name: "Sprint Planning Reliability",
				path: "../tips/SPRINT_PLANNING_RELIABILITY.md",
			},
			{ name: "AI Interaction Tips", path: "../tips/AI_INTERACTION_TIPS.md" },
		],
		"Design & Workflow": [
			{ name: "Design Module Status", path: "../tips/DESIGN_MODULE_STATUS.md" },
			{
				name: "Mermaid Diagram Examples",
				path: "../tips/MERMAID_DIAGRAM_EXAMPLES.md",
			},
			{ name: "AI Interaction Tips", path: "../tips/AI_INTERACTION_TIPS.md" },
		],
		Utilities: [
			{ name: "AI Interaction Tips", path: "../tips/AI_INTERACTION_TIPS.md" },
		],
	};

	return docsMap[tool.category] || docsMap.Utilities;
}

/**
 * Generate tool description for related tools section
 */
function getToolDescription(toolName) {
	const tool = TOOLS_METADATA.find((t) => t.name === toolName);
	return tool ? tool.title : "Related tool";
}

// Template sections following gold standard (hierarchical-prompt-builder.md)
const TEMPLATE_SECTIONS = {
	// Header section with image, title, badges
	header: (tool) => {
		const categoryColor = CATEGORY_COLORS[tool.category] || "gray";
		const categoryAnchor = getCategoryAnchor(tool.category);
		const complexityLevel = getComplexityLevel(tool.complexity);
		const titleCase = tool.name
			.split("-")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ");

		return `<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# ${titleCase}

> **${tool.title}**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![${tool.category}](https://img.shields.io/badge/Category-${tool.category.replace(/ /g, "_")}-${categoryColor}?style=flat-square)](./README.md#${categoryAnchor})
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

**Complexity**: ${tool.complexity} ${complexityLevel} | **Category**: ${tool.category} | **Time to Learn**: ${tool.time}

---

## Overview

The \`${tool.name}\` ${tool.description.charAt(0).toLowerCase() + tool.description.slice(1)}.

${
	tool.keyFeatures && tool.keyFeatures.length > 0
		? `### Key Capabilities

${tool.keyFeatures.map((f) => `- ${f}`).join("\n")}`
		: ""
}

---`;
	},

	// When to Use section with good/bad use cases

	whenToUse: (tool) => {
		const useCases = generateUseCases(tool);

		return `## When to Use

✅ **Good for:**

${useCases.good.map((uc) => `- ${uc}`).join("\n")}

❌ **Not ideal for:**

${useCases.bad.map((uc) => `- ${uc}`).join("\n")}

---`;
	},

	// Basic Usage section with JSON examples

	basicUsage: (tool) => {
		const requiredParams =
			tool.parameters.required.length > 0
				? tool.parameters.required
						.map(
							(p) =>
								`  "${p}": "your-${p.replace(/([A-Z])/g, "-$1").toLowerCase()}-here"`,
						)
						.join(",\n")
				: "";
		const optionalParams = tool.parameters.optional
			.slice(0, 3)
			.map((p) => {
				const type = inferParameterType(p);
				let value;
				if (type === "boolean") value = "true";
				else if (type === "array") value = '["item1", "item2"]';
				else if (type === "object") value = '{ "key": "value" }';
				else if (type === "number") value = "10";
				else value = `"your-${p.replace(/([A-Z])/g, "-$1").toLowerCase()}"`;
				return `  "${p}": ${value}`;
			})
			.join(",\n");

		// Build params string, handling comma placement correctly
		const paramsContent = [requiredParams, optionalParams]
			.filter(Boolean)
			.join(",\n");

		return `## Basic Usage

### Example 1: Basic ${tool.category} Task

\`\`\`json
{
  "tool": "${tool.name}"${paramsContent ? `,\n${paramsContent}` : ""}
}
\`\`\`

**Output**: Structured ${tool.category.toLowerCase()} output with:

${
	tool.keyFeatures
		? tool.keyFeatures
				.slice(0, 3)
				.map((f) => `- ${f}`)
				.join("\n")
		: "- Generated content based on your inputs"
}

---`;
	},

	// Parameters table with detailed descriptions

	parameters: (tool) => {
		const requiredRows = tool.parameters.required.map((p) => {
			const type = inferParameterType(p);
			const desc = generateParameterDescription(p, tool);
			return `| \`${p}\` | ${type} | ✅ Yes | - | ${desc} |`;
		});

		const optionalRows = tool.parameters.optional.map((p) => {
			const type = inferParameterType(p);
			const desc = generateParameterDescription(p, tool);
			let defaultVal = "-";
			if (type === "boolean") defaultVal = "`false`";
			else if (p.includes("include") || p.includes("auto"))
				defaultVal = type === "boolean" ? "`false`" : "-";
			return `| \`${p}\` | ${type} | No | ${defaultVal} | ${desc} |`;
		});

		return `## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
${requiredRows.join("\n")}
${optionalRows.join("\n")}

---`;
	},

	// What You Get section showing output structure

	output: (tool) => {
		return `## What You Get

The tool returns a structured ${tool.category.toLowerCase()} output with:

${
	tool.keyFeatures
		? tool.keyFeatures
				.map((f, i) => `${i + 1}. **${f.split(" ")[0]}** - ${f}`)
				.join("\n")
		: `1. **Structured Output** - Formatted response based on inputs
2. **Recommendations** - Actionable suggestions
3. **References** - Links to relevant documentation`
}

### Output Structure

\`\`\`markdown
## ${tool.name
			.split("-")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ")} Output

### Summary
[High-level summary of analysis/output]

### Details
[Detailed content based on your inputs]

### Recommendations
[Actionable next steps]

### References (if enabled)
[Links to external resources]
\`\`\`

---`;
	},

	// Real-World Examples section

	examples: (tool) => {
		const exampleTitle =
			tool.category === "Prompt Builders"
				? "Code Review Workflow"
				: tool.category === "Code Analysis"
					? "Security Analysis"
					: tool.category === "Strategy & Planning"
						? "Strategic Planning Session"
						: tool.category === "Design & Workflow"
							? "Design Session"
							: "Common Use Case";

		// Build required params string
		const requiredParamsStr =
			tool.parameters.required.length > 0
				? tool.parameters.required
						.map(
							(p) =>
								`  "${p}": "Example ${p} value for ${exampleTitle.toLowerCase()}"`,
						)
						.join(",\n")
				: "";

		// Build optional params string
		const optionalParamsStr =
			tool.parameters.optional.length > 0
				? tool.parameters.optional
						.slice(0, 2)
						.map((p) => {
							const type = inferParameterType(p);
							return type === "boolean"
								? `  "${p}": true`
								: type === "array"
									? `  "${p}": ["example1", "example2"]`
									: `  "${p}": "example-value"`;
						})
						.join(",\n")
				: "";

		// Combine params with proper comma handling
		const exampleParams = [requiredParamsStr, optionalParamsStr]
			.filter(Boolean)
			.join(",\n");

		return `## Real-World Examples

### Example 1: ${exampleTitle}

\`\`\`json
{
  "tool": "${tool.name}"${exampleParams ? `,\n${exampleParams}` : ""}
}
\`\`\`

**Generated Output Excerpt**:

\`\`\`markdown
## ${exampleTitle} Results

### Summary
Analysis complete with actionable insights...

### Key Findings
1. [Finding 1 based on ${tool.category.toLowerCase()} analysis]
2. [Finding 2 with specific recommendations]
3. [Finding 3 with priority indicators]

### Next Steps
- Implement recommended changes
- Review and validate results
- Integrate into workflow
\`\`\`

---`;
	},

	// Tips & Tricks section

	tips: (tool) => {
		const tips = generateTips(tool);

		return `## Tips & Tricks

### 💡 Best Practices

${tips.bestPractices.map((bp, i) => `${i + 1}. **${bp.split(" - ")[0]}** - ${bp.split(" - ")[1] || bp}`).join("\n")}

### 🚫 Common Mistakes

${tips.mistakes.map((m) => `- ❌ ${m.split(" → ")[0]} → ✅ ${m.split(" → ")[1] || "Fix this issue"}`).join("\n")}

### ⚡ Pro Tips

${tips.proTips.map((pt) => `- ${pt}`).join("\n")}

---`;
	},

	// Related Tools section with links and descriptions

	relatedTools: (tool) => {
		if (!tool.relatedTools || tool.relatedTools.length === 0) {
			return `## Related Tools

_No directly related tools. Check the [Tools Overview](./README.md) for other options._

---`;
		}

		return `## Related Tools

${tool.relatedTools.map((t) => `- **[${t}](./${t}.md)** - ${getToolDescription(t)}`).join("\n")}

---`;
	},

	// Workflow Integration section with mermaid diagram

	workflowIntegration: (tool) => {
		const related =
			tool.relatedTools && tool.relatedTools.length > 0
				? tool.relatedTools.slice(0, 2)
				: [];

		if (related.length === 0) {
			return "";
		}

		return `## Workflow Integration

### With Other Tools

\`\`\`mermaid
graph LR
  A[${tool.name}] --> B[${related[0] || "next-tool"}]
${related[1] ? `  B --> C[${related[1]}]` : ""}
${related[1] ? "  C --> D[Execute/Apply]" : "  B --> C[Execute/Apply]"}
\`\`\`

1. **${tool.name}** - ${tool.title}
${related.map((r, i) => `${i + 2}. **${r}** - ${getToolDescription(r)}`).join("\n")}
${related.length + 2}. Execute combined output with your AI model or apply changes

---`;
	},

	// Related Documentation section (collapsible)

	relatedDocs: (tool) => {
		const docs = getRelatedDocs(tool);
		const categoryAnchor = getCategoryAnchor(tool.category);

		return `<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [All ${tool.category} Tools](./README.md#${categoryAnchor})
${docs.map((d) => `- [${d.name}](${d.path})`).join("\n")}

</details>

<sub>**MCP AI Agent Guidelines** • Licensed under [MIT](../../LICENSE) • [Disclaimer](../../DISCLAIMER.md) • [Contributing](../../CONTRIBUTING.md)</sub>

---

## Related Documentation

- [All ${tool.category} Tools](./README.md#${categoryAnchor})
${docs.map((d) => `- [${d.name}](${d.path})`).join("\n")}

---`;
	},

	// Footer section with image

	footer: () => `<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->`,
};

/**
 * Generate documentation for a single tool following gold standard structure
 */
function generateToolDoc(tool) {
	const sections = [
		TEMPLATE_SECTIONS.header(tool),
		TEMPLATE_SECTIONS.whenToUse(tool),
		TEMPLATE_SECTIONS.basicUsage(tool),
		TEMPLATE_SECTIONS.parameters(tool),
		TEMPLATE_SECTIONS.output(tool),
		TEMPLATE_SECTIONS.examples(tool),
		TEMPLATE_SECTIONS.tips(tool),
		TEMPLATE_SECTIONS.relatedTools(tool),
		TEMPLATE_SECTIONS.workflowIntegration(tool),
		TEMPLATE_SECTIONS.relatedDocs(tool),
		TEMPLATE_SECTIONS.footer(),
	];

	return sections.filter(Boolean).join("\n\n");
}

/**
 * Main execution
 */
async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const forceOverwrite = args.includes("--force");
	const cleanMode = args.includes("--clean");
	const specificTool = args
		.find((arg) => arg.startsWith("--tool="))
		?.split("=")[1];

	const docsDir = path.join(__dirname, "..", "docs", "tools");

	// Ensure docs/tools directory exists
	try {
		await fs.access(docsDir);
	} catch {
		await fs.mkdir(docsDir, { recursive: true });
		console.log(`✅ Created directory: ${docsDir}`);
	}

	// Filter tools if specific tool requested
	const toolsToGenerate = specificTool
		? TOOLS_METADATA.filter((t) => t.name === specificTool)
		: TOOLS_METADATA;

	if (toolsToGenerate.length === 0) {
		console.error(`❌ Tool "${specificTool}" not found in metadata`);
		process.exit(1);
	}

	console.log(
		`\n🔨 Generating documentation for ${toolsToGenerate.length} tools...\n`,
	);
	if (forceOverwrite) {
		console.log(
			"⚠️  Force mode enabled - will overwrite existing comprehensive docs\n",
		);
	}
	if (cleanMode) {
		console.log("🧹 Clean mode enabled - will remove and recreate files\n");
	}

	let generatedCount = 0;
	let skippedCount = 0;

	// Gold standard file that should not be overwritten
	const GOLD_STANDARD = "hierarchical-prompt-builder";

	for (const tool of toolsToGenerate) {
		const filePath = path.join(docsDir, `${tool.name}.md`);
		const content = generateToolDoc(tool);

		if (dryRun) {
			console.log(`📄 [DRY RUN] Would create: ${filePath}`);
			console.log(
				`   Complexity: ${tool.complexity} | Category: ${tool.category}`,
			);
			generatedCount++;
		} else {
			// Never overwrite the gold standard unless explicitly forced or clean mode
			if (tool.name === GOLD_STANDARD && !forceOverwrite && !cleanMode) {
				console.log(
					`⭐ Skipping ${tool.name} (gold standard - use --force or --clean to overwrite)`,
				);
				skippedCount++;
				continue;
			}

			// In clean mode, remove existing file first
			if (cleanMode) {
				try {
					await fs.unlink(filePath);
					console.log(`🗑️  Removed existing ${tool.name}.md`);
				} catch {
					// File doesn't exist, that's fine
				}
				// Write new content
				await fs.writeFile(filePath, content, "utf-8");
				const newLineCount = content.split("\n").length;
				console.log(
					`✅ Created: ${tool.name}.md (${newLineCount} lines, ${tool.complexity} ${tool.category})`,
				);
				generatedCount++;
				continue;
			}

			// Check if file already exists and is comprehensive
			// Skip comprehensive docs unless --force is specified
			let shouldWrite = true;
			try {
				const existing = await fs.readFile(filePath, "utf-8");
				const lineCount = existing.split("\n").length;
				if (lineCount > COMPREHENSIVE_DOC_THRESHOLD && !forceOverwrite) {
					console.log(
						`⏭️  Skipping ${tool.name} (existing comprehensive doc: ${lineCount} lines)`,
					);
					shouldWrite = false;
					skippedCount++;
				} else if (lineCount > COMPREHENSIVE_DOC_THRESHOLD && forceOverwrite) {
					console.log(
						`🔄 Overwriting ${tool.name} (--force enabled, was ${lineCount} lines)`,
					);
				}
			} catch {
				// File doesn't exist, proceed with creation
			}

			if (shouldWrite) {
				await fs.writeFile(filePath, content, "utf-8");
				const newLineCount = content.split("\n").length;
				console.log(
					`✅ Created: ${tool.name}.md (${newLineCount} lines, ${tool.complexity} ${tool.category})`,
				);
				generatedCount++;
			}
		}
	}

	console.log(`\n✨ Done!`);
	console.log(`   📝 Generated: ${generatedCount} files`);
	if (skippedCount > 0) {
		console.log(
			`   ⏭️  Skipped: ${skippedCount} files (use --force or --clean to overwrite)`,
		);
	}

	if (!dryRun && generatedCount > 0) {
		console.log("\n📝 Next steps:");
		console.log("   1. Review generated files in docs/tools/");
		console.log("   2. Verify content accuracy for your specific tools");
		console.log("   3. Test documentation links");
		console.log("   4. Run 'npm run docs:lint' to check for issues\n");
	}
}

main().catch(console.error);
