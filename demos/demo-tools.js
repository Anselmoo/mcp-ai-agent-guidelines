// Generate demo reports into demos/*.md using built tools
// Requires: npm run build

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gapFrameworksAnalyzers } from "../dist/tools/analysis/gap-frameworks-analyzers.js";
import { strategyFrameworksBuilder } from "../dist/tools/analysis/strategy-frameworks-builder.js";
import { cleanCodeScorer } from "../dist/tools/clean-code-scorer.js";
import { codeHygieneAnalyzer } from "../dist/tools/code-hygiene-analyzer.js";
import { dependencyAuditor } from "../dist/tools/dependency-auditor.js";
import { designAssistant } from "../dist/tools/design/index.js";
import { guidelinesValidator } from "../dist/tools/guidelines-validator.js";
import { iterativeCoverageEnhancer } from "../dist/tools/iterative-coverage-enhancer.js";
import { memoryContextOptimizer } from "../dist/tools/memory-context-optimizer.js";
import { mermaidDiagramGenerator } from "../dist/tools/mermaid-diagram-generator.js";
import { modeSwitcher } from "../dist/tools/mode-switcher.js";
import { modelCompatibilityChecker } from "../dist/tools/model-compatibility-checker.js";
import { projectOnboarding } from "../dist/tools/project-onboarding.js";
import { architectureDesignPromptBuilder } from "../dist/tools/prompt/architecture-design-prompt-builder.js";
import { codeAnalysisPromptBuilder } from "../dist/tools/prompt/code-analysis-prompt-builder.js";
import { debuggingAssistantPromptBuilder } from "../dist/tools/prompt/debugging-assistant-prompt-builder.js";
import { documentationGeneratorPromptBuilder } from "../dist/tools/prompt/documentation-generator-prompt-builder.js";
import { domainNeutralPromptBuilder } from "../dist/tools/prompt/domain-neutral-prompt-builder.js";
import { hierarchicalPromptBuilder } from "../dist/tools/prompt/hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "../dist/tools/prompt/hierarchy-level-selector.js";
import { promptingHierarchyEvaluator } from "../dist/tools/prompt/prompting-hierarchy-evaluator.js";
import { securityHardeningPromptBuilder } from "../dist/tools/prompt/security-hardening-prompt-builder.js";
import { sparkPromptBuilder } from "../dist/tools/prompt/spark-prompt-builder.js";
import { semanticCodeAnalyzer } from "../dist/tools/semantic-code-analyzer.js";
import { sprintTimelineCalculator } from "../dist/tools/sprint-timeline-calculator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getText(output) {
	const item = output?.content?.[0];
	return typeof item?.text === "string" ? item.text : String(item || "");
}

async function writeReport(filename, text) {
	const outPath = path.resolve(__dirname, filename);
	await fs.writeFile(outPath, text, "utf8");
	console.log("Wrote", path.relative(process.cwd(), outPath));
}

async function main() {
	const demoPyPath = path.resolve(__dirname, "./demo-code-analysis.py");
	const demoPy = await fs.readFile(demoPyPath, "utf8");

	const hierarchical = await hierarchicalPromptBuilder({
		context: "Refactor a small Python script for clarity and safety",
		goal: "Produce a step-by-step refactor plan and a checklist",
		requirements: [
			"Keep behavior the same",
			"Reduce complexity",
			"Add docstrings and type hints",
		],
		outputFormat: "1. Summary\n2. Steps\n3. Checklist",
		audience: "Senior engineer",
		inputFile: demoPyPath,
	});
	await writeReport(
		"demo-code-analysis.hierarchical.prompt.md",
		getText(hierarchical),
	);

	const hygiene = await codeHygieneAnalyzer({
		codeContent: demoPy,
		language: "python",
		framework: "none",
		inputFile: demoPyPath,
	});
	await writeReport("demo-code-analysis.hygiene.md", getText(hygiene));

	// Domain-neutral prompt template
	const domainNeutral = await domainNeutralPromptBuilder({
		title: "Domain-Neutral Code Hygiene Review Prompt",
		summary:
			"Template to run consistent, security-first code hygiene reviews across languages",
		objectives: [
			"Identify hygiene, security, maintainability issues",
			"Prioritize risks (High/Med/Low)",
			"Output a crisp, language-agnostic checklist",
		],
		background:
			"Analyze arbitrary code snippets; produce a summary and prioritized checklist",
		inputs: "Code snippet(s) or diffs",
		outputs: "Summary + prioritized checklist + acceptance criteria",
		workflow: [
			"Summarize code purpose",
			"Identify issues by category",
			"Prioritize by risk",
			"Produce fixes and acceptance criteria",
		],
		includeReferences: true,
		inputFile: demoPyPath,
	});
	await writeReport(
		"demo-code-analysis.domain-neutral.prompt.md",
		getText(domainNeutral),
	);

	// Spark prompt card
	const spark = await sparkPromptBuilder({
		title: "Spark Prompt — Code Hygiene Review Card",
		summary:
			"A compact, skimmable card with risk badges, prioritized checklist, and a tiny plan",
		complexityLevel: "compact",
		designDirection: "Clean, minimal, accessible",
		colorSchemeType: "light",
		colorPurpose: "Improve scan-ability",
		primaryColor: "#111111",
		primaryColorPurpose: "Body text",
		accentColor: "#6E56CF",
		accentColorPurpose: "Highlight section headers and key calls to action.",
		fontFamily:
			"Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
		fontIntention: "Legible at small sizes",
		fontReasoning: "System-default stack ensures availability",
		typography: [
			{
				usage: "body",
				font: "Inter",
				weight: "400",
				size: "14px",
				spacing: "1.4",
			},
			{
				usage: "heading",
				font: "Inter",
				weight: "600",
				size: "16px",
				spacing: "1.3",
			},
		],
		animationPhilosophy: "Subtle emphasis only",
		animationRestraint: "Avoid distracting motion",
		animationPurpose: "Draw attention to the most important recommendations",
		animationHierarchy: "minimal",
		spacingRule: "tight",
		spacingContext: "dense",
		mobileLayout: "single-column",
		experienceQualities: [
			{ quality: "clarity", detail: "Fast to scan" },
			{ quality: "responsiveness", detail: "Works on small screens" },
		],
		features: [
			{
				name: "Code Hygiene Review Card",
				functionality:
					"Intro summary + risk badges + prioritized checklist + short plan",
				purpose: "Present a compact actionable review",
				trigger: "User submits code snippet",
				progression: ["summary", "risks", "checklist", "plan"],
				successCriteria: "Easy to skim, actionable, no fluff",
			},
		],
		states: [{ component: "risk-badge", states: ["high", "medium", "low"] }],
		icons: ["⚠️", "✅", "🔒", "⚙️", "🧹"],
		customizations:
			"Use compact sections, bold category labels, and checklist bullets.",
		includeFrontmatter: false,
		model: "gpt-4.1",
	});
	await writeReport("demo-code-analysis.spark.prompt.md", getText(spark));

	const diagram = await mermaidDiagramGenerator({
		description:
			"User submits data -> Validate -> Process -> Save -> Return summary",
		diagramType: "flowchart",
	});
	await writeReport("demo-code-analysis.diagram.md", getText(diagram));

	const memory = await memoryContextOptimizer({
		contextContent:
			"Python repo. Fix security issues; add validation and logging. Key: calculate_discount, process_user_data.",
		cacheStrategy: "balanced",
		language: "markdown",
	});
	await writeReport("demo-code-analysis.memory.md", getText(memory));

	const modelCompat = await modelCompatibilityChecker({
		taskDescription: "Code refactoring and analysis with long files",
		requirements: ["large context", "analysis", "structured output"],
		budget: "medium",
		language: "typescript",
	});
	await writeReport("demo-code-analysis.model-compat.md", getText(modelCompat));

	const guidelines = await guidelinesValidator({
		practiceDescription:
			"We use hierarchical prompts, prompt caching, and diagramming",
		category: "workflow",
		inputFile: demoPyPath,
	});
	await writeReport("demo-code-analysis.guidelines.md", getText(guidelines));

	const sprint = await sprintTimelineCalculator({
		tasks: [
			{ name: "Refactor functions", estimate: 5, priority: "high" },
			{ name: "Add tests", estimate: 8, priority: "high" },
			{ name: "Improve logging", estimate: 3, priority: "medium" },
			{ name: "Docs", estimate: 2, priority: "low" },
		],
		teamSize: 3,
		sprintLength: 14,
	});
	await writeReport("demo-code-analysis.sprint.md", getText(sprint));

	// Strategy frameworks demo
	const strategy = await strategyFrameworksBuilder({
		frameworks: [
			"swot",
			"whereToPlayHowToWin",
			"balancedScorecard",
			"mckinsey7S",
			"bcgMatrix",
			"ansoffMatrix",
			"strategyMap",
			"pest",
			"vrio",
		],
		context: "AI DevTools SaaS expanding in EU/US mid-market",
		objectives: [
			"Grow ARR 30%",
			"Expand to two new segments",
			"Improve NRR 5pp",
		],
		stakeholders: ["Buyers", "Users", "Partners"],
		includeReferences: true,
		includeMetadata: true,
		includeDiagrams: true,
	});
	await writeReport("demo-strategy-frameworks.md", getText(strategy));

	// Gap analysis demo
	const gapAnalysis = await gapFrameworksAnalyzers({
		frameworks: ["capability", "performance", "maturity", "technology"],
		currentState:
			"Manual deployment processes with limited monitoring and basic CI/CD pipeline",
		desiredState:
			"Fully automated deployment with comprehensive monitoring, security scanning, and zero-downtime deployments",
		context:
			"DevOps transformation initiative to improve deployment reliability and speed",
		objectives: [
			"Reduce deployment time from 4 hours to 30 minutes",
			"Achieve 99.9% uptime",
			"Implement automated security scanning",
			"Enable multiple deployments per day",
		],
		timeframe: "12 months",
		stakeholders: [
			"Development Team",
			"Operations Team",
			"Security Team",
			"Product Management",
		],
		constraints: [
			"Limited downtime windows",
			"Compliance requirements",
			"Budget constraints",
		],
		includeReferences: true,
		includeMetadata: true,
		includeActionPlan: true,
	});
	await writeReport("demo-gap-analysis.md", getText(gapAnalysis));

	// Security Hardening Demo
	const securityHardening = await securityHardeningPromptBuilder({
		codeContext: `Express.js API endpoint handling user authentication and payment processing:

\`\`\`javascript
app.post('/api/login', (req, res) => {
	const { username, password } = req.body;
	const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
	db.query(query, (err, result) => {
		if (result.length > 0) {
			req.session.user = result[0];
			res.json({ success: true, token: result[0].id });
		} else {
			res.json({ success: false });
		}
	});
});

app.post('/api/payment', (req, res) => {
	const { amount, cardNumber, cvv } = req.body;
	// Process payment without validation
	processPayment(amount, cardNumber, cvv);
	res.json({ status: 'processed' });
});
\`\`\``,
		securityFocus: "vulnerability-analysis",
		language: "javascript",
		securityRequirements: [
			"Prevent SQL injection attacks",
			"Implement secure session management",
			"Validate all user inputs",
			"Protect sensitive payment data",
		],
		complianceStandards: ["OWASP-Top-10", "PCI-DSS"],
		riskTolerance: "low",
		analysisScope: [
			"input-validation",
			"authentication",
			"authorization",
			"data-encryption",
			"session-management",
		],
		includeCodeExamples: true,
		includeMitigations: true,
		includeTestCases: true,
		prioritizeFindings: true,
		outputFormat: "detailed",
		includeReferences: true,
		includeMetadata: true,
	});
	await writeReport(
		"demo-code-analysis.security-hardening.prompt.md",
		getText(securityHardening),
	);

	// Demo: Hierarchy Level Selector
	const hierarchySelection = await hierarchyLevelSelector({
		taskDescription:
			"Implement JWT authentication with token refresh and session management for a user login system",
		agentCapability: "intermediate",
		taskComplexity: "complex",
		autonomyPreference: "medium",
		includeExamples: true,
		includeReferences: true,
	});
	await writeReport(
		"demo-hierarchy-level-selection.md",
		getText(hierarchySelection),
	);

	// Demo: Prompting Hierarchy Evaluator
	const promptEvaluation = await promptingHierarchyEvaluator({
		promptText: `# Context
We need to refactor the authentication module to improve security and maintainability.

# Goal
Enhance the authentication system with JWT token support and proper session management.

# Requirements
1. Implement JWT token generation and validation
2. Add refresh token mechanism
3. Implement proper session management
4. Add comprehensive error handling
5. Include unit tests with 90% coverage

# Expected Output
- Updated authentication module with JWT support
- Refresh token implementation
- Session management layer
- Error handling middleware
- Comprehensive test suite`,
		targetLevel: "scaffolding",
		includeRecommendations: true,
		includeReferences: true,
	});
	await writeReport("demo-prompt-evaluation.md", getText(promptEvaluation));

	// Semantic code analyzer demo
	const semanticAnalysis = await semanticCodeAnalyzer({
		codeContent: demoPy,
		language: "python",
		analysisType: "all",
		includeReferences: true,
		inputFile: demoPyPath,
	});
	await writeReport("demo-semantic-analysis.md", getText(semanticAnalysis));

	// Project onboarding demo
	const onboarding = await projectOnboarding({
		projectPath: path.resolve(__dirname, ".."),
		projectName: "MCP AI Agent Guidelines",
		projectType: "library",
		analysisDepth: "standard",
		includeMemories: true,
		includeReferences: true,
	});
	await writeReport("demo-project-onboarding.md", getText(onboarding));

	// Mode switcher demo
	const modeSwitching = await modeSwitcher({
		targetMode: "analysis",
		context: "ide-assistant",
		reason: "Reviewing codebase for refactoring opportunities",
		includeReferences: true,
	});
	await writeReport("demo-mode-switcher.md", getText(modeSwitching));

	// Architecture design prompt builder demo
	const architectureDesign = await architectureDesignPromptBuilder({
		systemRequirements:
			"Design a scalable microservices architecture for an e-commerce platform with high availability requirements",
		scale: "large",
		technologyStack: "Node.js, PostgreSQL, Redis, Kubernetes",
		includeReferences: true,
		includeMetadata: true,
	});
	await writeReport(
		"demo-architecture-design.prompt.md",
		getText(architectureDesign),
	);

	// Clean code scorer demo
	const cleanScore = await cleanCodeScorer({
		codeContent: demoPy,
		language: "python",
		includeRecommendations: true,
		inputFile: demoPyPath,
	});
	await writeReport("demo-clean-code-score.md", getText(cleanScore));

	// Code analysis prompt builder demo
	const codeAnalysisPrompt = await codeAnalysisPromptBuilder({
		codebase: demoPy,
		focusArea: "security",
		language: "python",
		includeReferences: true,
		includeMetadata: true,
	});
	await writeReport(
		"demo-code-analysis.analysis-prompt.md",
		getText(codeAnalysisPrompt),
	);

	// Debugging assistant prompt builder demo
	const debuggingPrompt = await debuggingAssistantPromptBuilder({
		errorDescription:
			"AttributeError: 'NoneType' object has no attribute 'calculate_discount' when processing user orders",
		context:
			"E-commerce checkout flow with discount calculation for logged-in users",
		attemptedSolutions:
			"Added null checks, verified user session exists, checked discount table",
		includeReferences: true,
		includeMetadata: true,
	});
	await writeReport(
		"demo-debugging-assistant.prompt.md",
		getText(debuggingPrompt),
	);

	// Dependency auditor demo
	const packageJsonPath = path.resolve(__dirname, "../package.json");
	const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
	const depAudit = await dependencyAuditor({
		packageJsonContent,
		auditLevel: "moderate",
		includeDevDependencies: true,
		outputFormat: "detailed",
	});
	await writeReport("demo-dependency-audit.md", getText(depAudit));

	// Design assistant demo (start session example)
	await designAssistant.initialize();
	const designSession = await designAssistant.processRequest({
		action: "start-session",
		sessionId: "demo-design-001",
		config: {
			sessionId: "demo-design-001",
			context: "AI Agent Framework for developer tools",
			goal: "Create modular architecture for AI agents with multi-LLM support",
			requirements: [
				"Support multiple LLM providers (OpenAI, Anthropic, Google)",
				"Enable easy extensibility for custom agents",
				"Provide structured prompt templates",
				"Include memory and context management",
			],
			constraints: [],
			coverageThreshold: 80,
			enablePivots: false,
		},
	});
	await writeReport("demo-design-session.md", getText(designSession));

	// Documentation generator prompt builder demo
	const docGenPrompt = await documentationGeneratorPromptBuilder({
		contentType: "API documentation",
		targetAudience: "Backend developers integrating the MCP server",
		existingContent: "Tool definitions in src/index.ts",
		includeReferences: true,
		includeMetadata: true,
	});
	await writeReport(
		"demo-documentation-generator.prompt.md",
		getText(docGenPrompt),
	);

	// Iterative coverage enhancer demo
	const coverageEnhancer = await iterativeCoverageEnhancer({
		currentCoverage: {
			lines: 72,
			statements: 70,
			functions: 68,
			branches: 65,
		},
		targetCoverage: {
			lines: 90,
			statements: 90,
			functions: 85,
			branches: 80,
		},
		language: "typescript",
		framework: "vitest",
		analyzeCoverageGaps: true,
		detectDeadCode: true,
		generateTestSuggestions: true,
		includeCodeExamples: true,
		includeReferences: true,
	});
	await writeReport("demo-coverage-enhancement.md", getText(coverageEnhancer));
}

main().catch((err) => {
	console.error("Generation failed:", err);
	process.exitCode = 1;
});
