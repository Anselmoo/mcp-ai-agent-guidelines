#!/usr/bin/env node

/**
 * Tool Documentation Generator
 *
 * Generates comprehensive documentation for all MCP tools based on README.md metadata
 * and established template patterns from dependency-auditor.md and hierarchical-prompt-builder.md
 *
 * Usage: node scripts/generate-tool-docs.js [--dry-run] [--tool=<name>]
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

// Template sections
const TEMPLATE_SECTIONS = {
	header: (tool) => `# ${tool.name}

> **${tool.title}**

**Complexity**: ${tool.complexity} ${tool.complexity.includes("⭐⭐⭐⭐⭐") ? "Master" : tool.complexity.includes("⭐⭐⭐⭐") ? "Expert" : tool.complexity.includes("⭐⭐⭐") ? "Advanced" : tool.complexity.includes("⭐⭐") ? "Moderate" : "Simple"} | **Category**: ${tool.category} | **Time to Learn**: ${tool.time}

---

## Overview

${tool.description}

${
	tool.keyFeatures
		? `### Key Capabilities

${tool.keyFeatures.map((f) => `- ${f}`).join("\n")}`
		: ""
}

---`,

	whenToUse: () => `## When to Use

✅ **Good for:**
- [Use case 1]
- [Use case 2]
- [Use case 3]

❌ **Not ideal for:**
- [Anti-pattern 1]
- [Anti-pattern 2]

---`,

	basicUsage: (tool) => `## Basic Usage

### Example 1: [Use Case Name]

\`\`\`json
{
  "tool": "${tool.name}",
  ${tool.parameters.required.map((p) => `"${p}": "[value]"`).join(",\n  ")}${
		tool.parameters.optional.length > 0
			? `,\n  ${tool.parameters.optional
					.slice(0, 2)
					.map((p) => `"${p}": "[value]"`)
					.join(",\n  ")}`
			: ""
	}
}
\`\`\`

**Output**: [Description of what you get]

---`,

	parameters: (tool) => `## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
${tool.parameters.required.map((p) => `| \`${p}\` | [type] | ✅ Yes | - | [Description] |`).join("\n")}
${tool.parameters.optional.map((p) => `| \`${p}\` | [type] | No | \`[default]\` | [Description] |`).join("\n")}

---`,

	output: () => `## What You Get

The tool returns a structured report with:

1. **[Section 1]** - [Description]
2. **[Section 2]** - [Description]
3. **[Section 3]** - [Description]

---`,

	examples: () => `## Real-World Examples

### Example 1: [Scenario Name]

**Before:**
\`\`\`[language]
[code or data before]
\`\`\`

**After:**
\`\`\`[language]
[code or data after]
\`\`\`

**Impact**: [What improved]

---`,

	tips: () => `## Tips & Tricks

### 💡 Best Practices

1. **[Practice 1]** - [Explanation]
2. **[Practice 2]** - [Explanation]
3. **[Practice 3]** - [Explanation]

### 🚫 Common Mistakes

- ❌ [Mistake] → ✅ [Correct approach]
- ❌ [Mistake] → ✅ [Correct approach]

### ⚡ Pro Tips

- [Pro tip 1]
- [Pro tip 2]

---`,

	relatedTools: (tool) => `## Related Tools

${
	tool.relatedTools && tool.relatedTools.length > 0
		? tool.relatedTools
				.map((t) => `- **[${t}](./${t}.md)** - [Brief description]`)
				.join("\n")
		: "_No directly related tools_"
}

---`,

	footer:
		() => `**[← Back to Tools](../README.md)** • **[📖 Complete Tools Reference](../../TOOLS_REFERENCE.md)** • **[🏠 Main README](../../../README.md)**
`,
};

/**
 * Generate documentation for a single tool
 */
function generateToolDoc(tool) {
	const sections = [
		TEMPLATE_SECTIONS.header(tool),
		TEMPLATE_SECTIONS.whenToUse(),
		TEMPLATE_SECTIONS.basicUsage(tool),
		TEMPLATE_SECTIONS.parameters(tool),
		TEMPLATE_SECTIONS.output(),
		TEMPLATE_SECTIONS.examples(),
		TEMPLATE_SECTIONS.tips(),
		TEMPLATE_SECTIONS.relatedTools(tool),
		TEMPLATE_SECTIONS.footer(),
	];

	return sections.join("\n");
}

/**
 * Main execution
 */
async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
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

	for (const tool of toolsToGenerate) {
		const filePath = path.join(docsDir, `${tool.name}.md`);
		const content = generateToolDoc(tool);

		if (dryRun) {
			console.log(`📄 [DRY RUN] Would create: ${filePath}`);
			console.log(
				`   Complexity: ${tool.complexity} | Category: ${tool.category}`,
			);
		} else {
			// Check if file already exists and is comprehensive (>100 lines)
			let shouldWrite = true;
			try {
				const existing = await fs.readFile(filePath, "utf-8");
				const lineCount = existing.split("\n").length;
				if (lineCount > 100) {
					console.log(
						`⏭️  Skipping ${tool.name} (existing comprehensive doc: ${lineCount} lines)`,
					);
					shouldWrite = false;
				}
			} catch {
				// File doesn't exist, proceed with creation
			}

			if (shouldWrite) {
				await fs.writeFile(filePath, content, "utf-8");
				console.log(
					`✅ Created: ${tool.name}.md (${tool.complexity} ${tool.category})`,
				);
			}
		}
	}

	console.log(
		`\n✨ Done! ${
			dryRun
				? "Dry run complete."
				: `Generated ${
						toolsToGenerate.filter((t) => {
							const filePath = path.join(docsDir, `${t.name}.md`);
							try {
								const existing = require("fs").readFileSync(filePath, "utf-8");
								return existing.split("\n").length <= 100;
							} catch {
								return true;
							}
						}).length
					} tool documentation files.`
		}\n`,
	);

	if (!dryRun) {
		console.log("📝 Next steps:");
		console.log("   1. Review generated files in docs/tools/");
		console.log("   2. Fill in placeholder sections with actual content");
		console.log("   3. Add real examples and use cases");
		console.log("   4. Test tool documentation links from README.md\n");
	}
}

main().catch(console.error);
