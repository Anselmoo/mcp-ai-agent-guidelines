/**
 * MCP Prompt Handlers
 *
 * This module provides MCP prompt capability handlers that delegate to tool builders
 * to generate structured prompts. This ensures a single source of truth for prompt
 * generation logic and maintains consistency across both MCP prompts and tools.
 *
 * Architecture:
 * - Prompt definitions (metadata only) are maintained here for MCP listPrompts
 * - Prompt generation delegates to corresponding tool builders in src/tools/prompt/
 * - Output is cleaned to remove tool-specific metadata (frontmatter, refs, etc.)
 *
 * Benefits:
 * - No code duplication between prompts and tools
 * - Consistent, high-quality prompt generation
 * - Single place to update prompt logic
 * - Tools can be used directly or via MCP prompts
 */

import { architectureDesignPromptBuilder } from "../tools/prompt/architecture-design-prompt-builder.js";
import { codeAnalysisPromptBuilder } from "../tools/prompt/code-analysis-prompt-builder.js";
import { debuggingAssistantPromptBuilder } from "../tools/prompt/debugging-assistant-prompt-builder.js";
import { documentationGeneratorPromptBuilder } from "../tools/prompt/documentation-generator-prompt-builder.js";
import { hierarchicalPromptBuilder } from "../tools/prompt/hierarchical-prompt-builder.js";
import { securityHardeningPromptBuilder } from "../tools/prompt/security-hardening-prompt-builder.js";
import { sparkPromptBuilder } from "../tools/prompt/spark-prompt-builder.js";

const prompts = [
	{
		name: "code-analysis-prompt",
		description: "Comprehensive code analysis and review prompt template",
		arguments: [
			{
				name: "codebase",
				description: "The codebase or code snippet to analyze",
				required: true,
			},
			{
				name: "focus_area",
				description:
					"Specific area to focus on (security, performance, maintainability)",
				required: false,
			},
			{
				name: "language",
				description: "Programming language of the code",
				required: false,
			},
		],
	},
	{
		name: "spark-ui-prompt",
		description:
			"Spark UI prompt template for designing developer-centric experiences",
		arguments: [
			{
				name: "title",
				description: "Prompt title",
				required: true,
			},
			{
				name: "summary",
				description: "Short summary of the Spark prompt",
				required: true,
			},
			{
				name: "design_direction",
				description: "Design direction statement",
				required: true,
			},
			{
				name: "color_scheme",
				description: "Color scheme type (light/dark) and purpose",
				required: false,
			},
		],
	},
	{
		name: "hierarchical-task-prompt",
		description: "Structured prompt template for complex task breakdown",
		arguments: [
			{
				name: "task_description",
				description: "The main task to be broken down",
				required: true,
			},
			{
				name: "complexity_level",
				description: "Task complexity level (simple, medium, complex)",
				required: false,
			},
			{
				name: "target_audience",
				description: "Target audience expertise level",
				required: false,
			},
		],
	},
	{
		name: "architecture-design-prompt",
		description: "System architecture design and planning prompt",
		arguments: [
			{
				name: "system_requirements",
				description: "System requirements and constraints",
				required: true,
			},
			{
				name: "scale",
				description: "Expected system scale (small, medium, large)",
				required: false,
			},
			{
				name: "technology_stack",
				description: "Preferred or required technology stack",
				required: false,
			},
		],
	},
	{
		name: "debugging-assistant-prompt",
		description: "Systematic debugging and troubleshooting prompt",
		arguments: [
			{
				name: "error_description",
				description: "Description of the error or issue",
				required: true,
			},
			{
				name: "context",
				description: "Additional context about the problem",
				required: false,
			},
			{
				name: "attempted_solutions",
				description: "Solutions already attempted",
				required: false,
			},
		],
	},
	{
		name: "documentation-generator-prompt",
		description: "Technical documentation generation prompt template",
		arguments: [
			{
				name: "content_type",
				description: "Type of documentation (API, user guide, technical spec)",
				required: true,
			},
			{
				name: "target_audience",
				description: "Intended audience for the documentation",
				required: false,
			},
			{
				name: "existing_content",
				description: "Any existing content to build upon",
				required: false,
			},
		],
	},
	{
		name: "security-analysis-prompt",
		description:
			"Security-focused code analysis prompt template with vulnerability assessment",
		arguments: [
			{
				name: "codebase",
				description: "The codebase or code snippet to analyze for security",
				required: true,
			},
			{
				name: "security_focus",
				description:
					"Specific security focus area (vulnerability-analysis, compliance-check, threat-modeling)",
				required: false,
			},
			{
				name: "language",
				description: "Programming language of the code",
				required: false,
			},
			{
				name: "compliance_standards",
				description:
					"Compliance standards to check against (OWASP-Top-10, NIST, etc.)",
				required: false,
			},
			{
				name: "risk_tolerance",
				description: "Risk tolerance level (low, medium, high)",
				required: false,
			},
		],
	},
	{
		name: "agent-workflow-prompt",
		description:
			"Multi-tool agent workflow prompt template demonstrating agent-relative calls for complex tasks",
		arguments: [
			{
				name: "workflow_goal",
				description: "The overall goal of the multi-tool workflow",
				required: true,
			},
			{
				name: "context",
				description: "Project context and background information",
				required: false,
			},
			{
				name: "tools_needed",
				description:
					"Comma-separated list of tools needed (e.g., code-analysis, architecture-design, testing)",
				required: false,
			},
		],
	},
];

export async function listPrompts() {
	return prompts.map((p) => ({
		name: p.name,
		description: p.description,
		arguments: p.arguments,
	}));
}

type PromptArgs = Record<string, unknown>;

export async function getPrompt(name: string, args: PromptArgs) {
	const prompt = prompts.find((p) => p.name === name);

	if (!prompt) {
		throw new Error(`Prompt not found: ${name}`);
	}

	// Validate required arguments
	const missingArgs = prompt.arguments
		.filter((arg) => arg.required && !(arg.name in args))
		.map((arg) => arg.name);

	if (missingArgs.length > 0) {
		throw new Error(`Missing required arguments: ${missingArgs.join(", ")}`);
	}

	let result: { content: Array<{ type: string; text: string }> };

	// Delegate to the appropriate tool builder
	switch (name) {
		case "code-analysis-prompt":
			result = await codeAnalysisPromptBuilder({
				codebase: args.codebase as string,
				focusArea: args.focus_area as
					| "security"
					| "performance"
					| "maintainability"
					| "general"
					| undefined,
				language: args.language as string | undefined,
				includeFrontmatter: false,
				includeMetadata: false,
				forcePromptMdStyle: false,
			});
			break;
		case "hierarchical-task-prompt":
			result = await hierarchicalPromptBuilder({
				context: "Task Breakdown",
				goal: args.task_description as string,
				audience: args.target_audience as string | undefined,
				includeFrontmatter: false,
				includeMetadata: false,
				forcePromptMdStyle: false,
			});
			break;
		case "architecture-design-prompt":
			result = await architectureDesignPromptBuilder({
				systemRequirements: args.system_requirements as string,
				scale: args.scale as "small" | "medium" | "large" | undefined,
				technologyStack: args.technology_stack as string | undefined,
				includeFrontmatter: false,
				includeMetadata: false,
				forcePromptMdStyle: false,
			});
			break;
		case "debugging-assistant-prompt":
			result = await debuggingAssistantPromptBuilder({
				errorDescription: args.error_description as string,
				context: args.context as string | undefined,
				attemptedSolutions: args.attempted_solutions as string | undefined,
				includeFrontmatter: false,
				includeMetadata: false,
				forcePromptMdStyle: false,
			});
			break;
		case "documentation-generator-prompt":
			result = await documentationGeneratorPromptBuilder({
				contentType: args.content_type as string,
				targetAudience: args.target_audience as string | undefined,
				existingContent: args.existing_content as string | undefined,
				includeFrontmatter: false,
				includeMetadata: false,
				forcePromptMdStyle: false,
			});
			break;
		case "spark-ui-prompt":
			result = await sparkPromptBuilder({
				title: args.title as string,
				summary: args.summary as string,
				complexityLevel: "medium",
				designDirection: args.design_direction as string,
				colorSchemeType: "dark",
				colorPurpose: "readability",
				primaryColor: "oklch(0.7 0.2 240)",
				primaryColorPurpose: "brand identity",
				accentColor: "oklch(0.75 0.25 180)",
				accentColorPurpose: "highlights",
				fontFamily: "system-ui",
				fontIntention: "readability",
				fontReasoning: "standard readable font",
				animationPhilosophy: "subtle",
				animationRestraint: "minimal",
				animationPurpose: "feedback",
				animationHierarchy: "secondary",
				spacingRule: "8px base",
				spacingContext: "consistent",
				mobileLayout: "responsive",
				includeFrontmatter: false,
				includeMetadata: false,
				forcePromptMdStyle: false,
			});
			break;
		case "security-analysis-prompt":
			result = await securityHardeningPromptBuilder({
				codeContext: args.codebase as string,
				securityFocus:
					(args.security_focus as
						| "vulnerability-analysis"
						| "security-hardening"
						| "compliance-check"
						| "threat-modeling"
						| "penetration-testing"
						| undefined) || "vulnerability-analysis",
				language: args.language as string | undefined,
				complianceStandards: Array.isArray(args.compliance_standards)
					? (args.compliance_standards as Array<
							| "OWASP-Top-10"
							| "NIST-Cybersecurity-Framework"
							| "ISO-27001"
							| "SOC-2"
							| "GDPR"
							| "HIPAA"
							| "PCI-DSS"
						>)
					: args.compliance_standards
						? [
								args.compliance_standards as
									| "OWASP-Top-10"
									| "NIST-Cybersecurity-Framework"
									| "ISO-27001"
									| "SOC-2"
									| "GDPR"
									| "HIPAA"
									| "PCI-DSS",
							]
						: undefined,
				riskTolerance: args.risk_tolerance as
					| "low"
					| "medium"
					| "high"
					| undefined,
				includeFrontmatter: false,
				includeMetadata: false,
				forcePromptMdStyle: false,
			});
			break;
		case "agent-workflow-prompt": {
			// Generate a multi-tool workflow prompt demonstrating agent-relative calls
			const goal = args.workflow_goal as string;
			const context = args.context as string | undefined;
			const toolsNeeded = args.tools_needed as string | undefined;

			const workflowPrompt = `# Multi-Tool Agent Workflow

${context ? `## Context\n${context}\n\n` : ""}## Goal
${goal}

## Workflow Steps

This workflow demonstrates agent-relative call patterns for the AI Agent Guidelines MCP server.

### Step 1: Initial Analysis
Use the clean-code-scorer MCP to establish baseline quality metrics.
Use the code-hygiene-analyzer MCP to identify technical debt and outdated patterns.

### Step 2: Strategic Planning
${toolsNeeded?.includes("strategy") ? "Use the strategy-frameworks-builder MCP to generate SWOT analysis and other strategic frameworks.\n" : ""}Use the gap-frameworks-analyzers MCP to identify gaps between current and desired state.

### Step 3: Design & Architecture
${toolsNeeded?.includes("architecture") ? "Use the architecture-design-prompt-builder MCP to create detailed architecture planning prompts.\n" : ""}Use the design-assistant MCP for multi-phase design workflow management.
Use the mermaid-diagram-generator MCP to visualize architecture and workflows.

### Step 4: Implementation Guidance
Use the hierarchical-prompt-builder MCP to create structured implementation prompts.
${toolsNeeded?.includes("security") ? "Use the security-hardening-prompt-builder MCP for security-focused analysis.\n" : ""}Use the model-compatibility-checker MCP to select appropriate AI models for different tasks.

### Step 5: Quality Assurance
${toolsNeeded?.includes("testing") ? "Use the iterative-coverage-enhancer MCP to plan and improve test coverage.\n" : ""}Use the dependency-auditor MCP to check for security vulnerabilities.
Use the guidelines-validator MCP to ensure adherence to best practices.

### Step 6: Timeline & Planning
Use the sprint-timeline-calculator MCP to estimate implementation timeline.
Use the memory-context-optimizer MCP to optimize prompts for efficiency.

### Step 7: Documentation
Use the documentation-generator-prompt-builder MCP to create comprehensive documentation.
Use the mermaid-diagram-generator MCP for visual documentation artifacts.

## Expected Outputs
- Baseline quality assessment
- Strategic analysis and gap identification
- Architecture diagrams and design artifacts
- Implementation prompts and guidelines
- Test coverage plan
- Security audit results
- Timeline estimates
- Complete documentation

## Agent Instructions
1. Execute steps sequentially, using outputs from earlier steps to inform later ones
2. Request confirmation before proceeding with major decisions
3. Provide summary reports after each phase
4. Flag any missing information or ambiguities
5. Suggest additional tools if needed for comprehensive coverage`;

			result = {
				content: [{ type: "text", text: workflowPrompt }],
			};
			break;
		}
		default:
			throw new Error(`Unknown prompt: ${name}`);
	}

	// Extract the text content from the tool result and strip frontmatter/metadata
	const text = result.content[0].text;

	// Remove frontmatter, headers, and metadata sections for cleaner prompt output
	let cleanText = text;

	// Remove YAML frontmatter (everything between --- markers at the start)
	cleanText = cleanText.replace(/^---[\s\S]*?---\s*/m, "");

	// Remove markdown headers with emojis - use alternation instead of character class
	cleanText = cleanText.replace(
		/^##\s*(?:🔍|🏗️|🐛|📚|⚡|🔒|🧭)\s*[^\n]*\n+/gmu,
		"",
	);

	// Remove metadata blocks (lines starting with >)
	cleanText = cleanText.replace(/^>.*\n/gm, "");

	// Remove empty lines at the start
	cleanText = cleanText.replace(/^\s+/, "");

	// Remove technique hints, model tips, pitfalls, references, and disclaimer sections
	// These are added by the builders but not needed in the simple prompt format
	cleanText = cleanText.split(
		/\n+#\s+(Technique Hints|Model-Specific Tips|Pitfalls to Avoid|References|Disclaimer)/,
	)[0];

	// Also remove "## References" and "## Disclaimer" sections if they appear
	cleanText = cleanText.split(/\n+##\s+(References|Disclaimer)/)[0];

	cleanText = cleanText.trim();

	return {
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: cleanText,
				},
			},
		],
	};
}
