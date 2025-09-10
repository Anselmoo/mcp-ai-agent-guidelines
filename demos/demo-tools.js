// Generate demo reports into demos/*.md using built tools
// Requires: npm run build

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { strategyFrameworksBuilder } from "../dist/tools/analysis/strategy-frameworks-builder.js";
import { gapFrameworksAnalyzers } from "../dist/tools/analysis/gap-frameworks-analyzers.js";
import { codeHygieneAnalyzer } from "../dist/tools/code-hygiene-analyzer.js";
import { guidelinesValidator } from "../dist/tools/guidelines-validator.js";
import { memoryContextOptimizer } from "../dist/tools/memory-context-optimizer.js";
import { mermaidDiagramGenerator } from "../dist/tools/mermaid-diagram-generator.js";
import { modelCompatibilityChecker } from "../dist/tools/model-compatibility-checker.js";
import { domainNeutralPromptBuilder } from "../dist/tools/prompt/domain-neutral-prompt-builder.js";
import { hierarchicalPromptBuilder } from "../dist/tools/prompt/hierarchical-prompt-builder.js";
import { sparkPromptBuilder } from "../dist/tools/prompt/spark-prompt-builder.js";
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
		currentState: "Manual deployment processes with limited monitoring and basic CI/CD pipeline",
		desiredState: "Fully automated deployment with comprehensive monitoring, security scanning, and zero-downtime deployments",
		context: "DevOps transformation initiative to improve deployment reliability and speed",
		objectives: [
			"Reduce deployment time from 4 hours to 30 minutes",
			"Achieve 99.9% uptime",
			"Implement automated security scanning",
			"Enable multiple deployments per day"
		],
		timeframe: "12 months",
		stakeholders: ["Development Team", "Operations Team", "Security Team", "Product Management"],
		constraints: ["Limited downtime windows", "Compliance requirements", "Budget constraints"],
		includeReferences: true,
		includeMetadata: true,
		includeActionPlan: true,
	});
	await writeReport("demo-gap-analysis.md", getText(gapAnalysis));
}

main().catch((err) => {
	console.error("Generation failed:", err);
	process.exitCode = 1;
});
