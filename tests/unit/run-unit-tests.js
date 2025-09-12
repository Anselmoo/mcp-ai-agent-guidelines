#!/usr/bin/env node
import assert from "node:assert";
import { domainNeutralPromptBuilder } from "../../dist/tools/prompt/domain-neutral-prompt-builder.js";
import { guidelinesValidator } from "../../dist/tools/guidelines-validator.js";
import { hierarchicalPromptBuilder } from "../../dist/tools/prompt/hierarchical-prompt-builder.js";
import { modelCompatibilityChecker } from "../../dist/tools/model-compatibility-checker.js";
import { buildDisclaimer as sharedBuildDisclaimer } from "../../dist/tools/shared/prompt-sections.js";
import { securityHardeningPromptBuilder } from "../../dist/tools/prompt/security-hardening-prompt-builder.js";
import { sparkPromptBuilder } from "../../dist/tools/prompt/spark-prompt-builder.js";

async function testModelCompatibility() {
	const result = await modelCompatibilityChecker({
		taskDescription: "High-speed code generation with large document context",
		requirements: ["fast responses", "process long documents", "cost aware"],
		budget: "low",
	});
	const text = result.content[0].text;
	assert.ok(
		/AI Model Compatibility (Analysis|Guidance)/i.test(text),
		"Missing header",
	);
	assert.ok(
		/Fit Summary|Suitable Options|official docs|links/i.test(text),
		"Qualitative sections not rendered",
	);
}

async function testGuidelinesValidator() {
	const result = await guidelinesValidator({
		practiceDescription:
			"We apply modular architecture and separation of concerns with scalability considerations",
		category: "architecture",
	});
	const text = result.content[0].text;
	assert.ok(/Compliance Level/i.test(text), "Missing compliance section");
	assert.ok(/Strengths Identified/i.test(text), "Missing strengths section");
}

async function run() {
	// New: simple smoke checks for Domain-neutral and Spark builders to raise coverage
	async function testDomainNeutralMinimal() {
		const res = await domainNeutralPromptBuilder({
			title: "Domain-Neutral Code Hygiene Review Prompt",
			summary: "Security-first hygiene review template",
			objectives: ["Identify issues", "Prioritize risks", "Checklist output"],
			includeReferences: true,
		});
		const text = res.content[0].text;
		assert.ok(/Domain-Neutral/i.test(text), "Domain-neutral: missing heading");
		assert.ok(/Objectives/i.test(text), "Domain-neutral: objectives missing");
	}

	async function testSparkMinimal() {
		const res = await sparkPromptBuilder({
			title: "Spark Prompt — Code Hygiene Review Card",
			summary: "Compact card with risks and checklist",
			complexityLevel: "compact",
			designDirection: "Clean, minimal",
			colorSchemeType: "light",
			colorPurpose: "scanability",
			primaryColor: "#111111",
			primaryColorPurpose: "text",
			accentColor: "#6E56CF",
			accentColorPurpose: "headers",
			fontFamily: "Inter",
			fontIntention: "legibility",
			fontReasoning: "system defaults",
			typography: [
				{
					usage: "body",
					font: "Inter",
					weight: "400",
					size: "14px",
					spacing: "1.4",
				},
			],
			animationPhilosophy: "subtle",
			animationRestraint: "avoid distraction",
			animationPurpose: "emphasis",
			animationHierarchy: "minimal",
			spacingRule: "tight",
			spacingContext: "dense",
			mobileLayout: "single-column",
			experienceQualities: [{ quality: "clarity", detail: "scan fast" }],
			features: [
				{
					name: "Card",
					functionality: "summary+risks+checklist+plan",
					purpose: "review",
					trigger: "submit",
					progression: ["summary", "risks", "checklist", "plan"],
					successCriteria: "actionable",
				},
			],
			states: [{ component: "risk-badge", states: ["high", "medium", "low"] }],
			includeFrontmatter: false,
		});
		const text = res.content[0].text;
		assert.ok(/Spark Prompt/i.test(text), "Spark: missing header");
		assert.ok(
			/Code Hygiene Review Card/i.test(text),
			"Spark: feature not rendered",
		);
	}
	async function testSparkBuilder() {
		const result = await sparkPromptBuilder({
			title: "Demo UI",
			summary: "Test prompt for UI spark template",
			complexityLevel: "medium",
			designDirection: "Clean, modern",
			colorSchemeType: "light",
			colorPurpose: "accessibility",
			primaryColor: "Blue oklch(0.6 0.12 250)",
			primaryColorPurpose: "primary actions",
			accentColor: "Green oklch(0.7 0.18 145)",
			accentColorPurpose: "success states",
			// Fonts & Typography
			fontFamily: "Inter",
			fontIntention: "readability",
			fontReasoning: "widely available, high legibility",
			typography: [
				{
					usage: "H1",
					font: "Inter",
					weight: "700",
					size: "32",
					spacing: "tight",
				},
			],
			// Animations
			animationPhilosophy: "subtle, purposeful",
			animationRestraint: "avoid distracting motion",
			animationPurpose: "feedback and state transitions",
			animationHierarchy: "primary > secondary",
			// Layout & spacing
			spacingRule: "8px grid",
			spacingContext: "mobile-first",
			mobileLayout: "stack with collapsible sections",
			experienceQualities: [
				{ quality: "clarity", detail: "concise and scannable" },
			],
			features: [
				{
					name: "Search",
					functionality: "Find content",
					purpose: "discoverability",
					trigger: "user input",
					progression: ["idle", "typing", "results"],
					successCriteria: "relevant results fast",
				},
			],
			edgeCases: [{ name: "Empty", handling: "show helpful empty state" }],
			tools: ["githubRepo", "codebase", "editFiles", "not-a-tool"],
			model: "gpt-4.1",
			includeReferences: true,
		});
		const text = result.content[0].text;
		// frontmatter present and normalized
		assert.ok(
			/^---[\s\S]*model:\s+GPT-4.1[\s\S]*tools:\s*\['githubRepo', 'codebase', 'editFiles'\][\s\S]*---/m.test(
				text,
			),
			"Frontmatter not normalized",
		);
		// single References section
		const refsCount = (text.match(/## References/g) || []).length;
		assert.strictEqual(refsCount, 1, "Spark: duplicate References section");
	}

	async function testHierarchicalBuilder() {
		const result = await hierarchicalPromptBuilder({
			context: "Project uses TypeScript and MCP.",
			goal: "Generate structured prompt",
			includeReferences: true,
			includeTechniqueHints: true,
			provider: "gpt-4.1",
			tools: ["githubRepo", "editFiles"],
		});
		const text = result.content[0].text;
		assert.ok(
			/## 🧭 Hierarchical Prompt Structure/.test(text),
			"Missing hierarchical header",
		);
		const refsCount = (text.match(/## References/g) || []).length;
		assert.strictEqual(
			refsCount,
			1,
			"Hierarchical: duplicate References section",
		);
		assert.ok(
			/# Technique Hints \(2025\)/.test(text),
			"Technique hints missing",
		);
	}

	async function testDomainNeutralBuilder() {
		const result = await domainNeutralPromptBuilder({
			title: "Project Alpha",
			summary: "Neutral spec template",
			objectives: ["Deliver MVP", "Minimize scope creep"],
			nonGoals: ["No visual design decisions"],
			background: "Legacy migration",
			stakeholdersUsers: "Ops, Devs",
			environment: "Node 20, Docker",
			inputs: "CSV files via S3",
			outputs: "JSON to API consumer",
			workflow: ["Ingest", "Transform", "Publish"],
			capabilities: [
				{
					name: "Ingest",
					purpose: "Pull files",
					inputs: "S3 path",
					outputs: "raw data",
				},
			],
			edgeCases: [{ name: "Empty file", handling: "Skip and log" }],
			risks: [{ description: "Large files", mitigation: "Chunking" }],
			successMetrics: ["<2m processing time"],
			acceptanceTests: [
				{ setup: "Given file", action: "Process", expected: "Outputs JSON" },
			],
			includeReferences: true,
		});
		const text = result.content[0].text;
		// Header and key sections
		if (!/# Project Alpha/.test(text)) throw new Error("Missing title");
		if (!/## Objectives[\s\S]*- Deliver MVP/m.test(text))
			throw new Error("Objectives missing");
		if (!/## Inputs and Outputs/.test(text))
			throw new Error("IO section missing");
		if (!/## Workflow[\s\S]*1\) Ingest/.test(text))
			throw new Error("Workflow numbering incorrect");
		const refsCount = (text.match(/## References/g) || []).length;
		if (refsCount !== 1)
			throw new Error("Domain-neutral: duplicate References section");
	}

	async function testModelCompatibilityCodeExamplesPython() {
		const result = await modelCompatibilityChecker({
			taskDescription: "Analyze task with python examples",
			includeCodeExamples: true,
			language: "python",
		});
		const text = result.content[0].text;
		assert.ok(
			/### Code Examples[\s\S]*#### Python \(pseudo-usage\)/m.test(text),
			"Missing Python code example",
		);
	}

	async function testModelCompatibilityCodeExamplesTS() {
		const result = await modelCompatibilityChecker({
			taskDescription: "Analyze task with ts examples",
			includeCodeExamples: true,
			language: "typescript",
		});
		const text = result.content[0].text;
		assert.ok(
			/### Code Examples[\s\S]*#### TypeScript \(pattern\)/m.test(text),
			"Missing TypeScript code example",
		);
	}

	async function testHierarchicalConditionalSections() {
		const result = await hierarchicalPromptBuilder({
			context: "Monorepo project",
			goal: "Refactor pipeline",
			requirements: ["Add CI step", "Normalize ESLint"],
			issues: ["Cyclic deps", "Long builds"],
			outputFormat: "1) Step one, 2) Step two",
			audience: "engineers",
			includeTechniqueHints: false,
		});
		const text = result.content[0].text;
		assert.ok(
			/# Requirements\n1\. Add CI step\n2\. Normalize ESLint\n/.test(text),
			"Requirements list not rendered correctly",
		);
		assert.ok(
			/# Problem Indicators\n1\. Cyclic deps\n2\. Long builds\n/.test(text),
			"Issues list not rendered correctly",
		);
		assert.ok(
			/# Output Format\n1\. Step one\n2\. Step two\n/.test(text),
			"Output format normalization/splitting failed",
		);
		assert.ok(
			/# Target Audience\nengineers\n/.test(text),
			"Audience section not rendered",
		);
	}

	// Additional branch coverage: provider tips variants (claude-4, gemini-2.5)
	async function testProviderTipsVariants() {
		const resClaude = await hierarchicalPromptBuilder({
			context: "Docs heavy project",
			goal: "Test provider tips",
			provider: "claude-4",
		});
		const textClaude = resClaude.content[0].text;
		assert.ok(
			/Model-Specific Tips[\s\S]*XML-like structuring/i.test(textClaude),
			"Claude tips missing or not XML-oriented",
		);
		assert.ok(
			/Preferred Style: XML/i.test(textClaude),
			"Claude preferred style not XML",
		);

		const resGemini = await hierarchicalPromptBuilder({
			context: "Long context",
			goal: "Test provider tips",
			provider: "gemini-2.5",
		});
		const textGemini = resGemini.content[0].text;
		assert.ok(
			/Use consistent formatting throughout/i.test(textGemini),
			"Gemini tips not present",
		);
	}

	// Additional branch coverage: normalizeOutputFormat paths
	async function testNormalizeOutputFormatPaths() {
		// Case 1: inline enumeration with commas should split into lines
		const resInline = await hierarchicalPromptBuilder({
			context: "",
			goal: "",
			outputFormat: "1) First, 2) Second, 3) Third",
		});
		const textInline = resInline.content[0].text;
		assert.ok(
			/# Output Format\n1\. First\n2\. Second\n3\. Third\n/.test(textInline),
			"Inline enumeration not split correctly",
		);

		// Case 2: already multiline list should remain multiline (no extra splitting)
		const resMultiline = await hierarchicalPromptBuilder({
			context: "",
			goal: "",
			outputFormat: "1) First\n2) Second",
		});
		const textMultiline = resMultiline.content[0].text;
		assert.ok(
			/# Output Format\n1\. First\n2\. Second\n/.test(textMultiline),
			"Multiline list not normalized as expected",
		);
	}

	// Additional branch coverage: auto-select techniques path in Technique Hints
	async function testTechniqueAutoSelect() {
		const res = await hierarchicalPromptBuilder({
			context:
				"This task references a document with sources and citations; reason step by step; analyze then plan; include examples; ensure accuracy with multiple approaches; list facts first; consider options with pros and cons; use tools to search the web.",
			goal: "Test auto technique selection",
			includeTechniqueHints: true,
			autoSelectTechniques: true,
		});
		const text = res.content[0].text;
		// Expect several technique sections to appear
		const expected = [
			/Technique Hints \(2025\)/,
			/Retrieval Augmented Generation \(RAG\)/i,
			/Chain-of-Thought/i,
			/Prompt Chaining/i,
			/Few-Shot/i,
			/Self-Consistency/i,
			/Generate Knowledge/i,
		];
		expected.forEach((re) =>
			assert.ok(re.test(text), `Missing technique section: ${re}`),
		);
	}

	// Additional branch coverage: shared disclaimer export
	async function testSharedDisclaimerExport() {
		const d = sharedBuildDisclaimer();
		assert.ok(
			/Disclaimer/.test(d),
			"Shared disclaimer should contain a heading",
		);
	}

	async function testGuidelinesValidatorIssuesBranch() {
		const result = await guidelinesValidator({
			practiceDescription: "We write code.",
			category: "architecture",
		});
		const text = result.content[0].text;
		// Expect Issues Found section to include at least one ❌ line
		const issues = (text.match(/Issues Found[\s\S]*\n(\d+\. ❌ .+)/) || [])[1];
		assert.ok(issues, "Expected issues to be reported for sparse description");
	}

	async function testSecurityHardeningPromptBuilder() {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Express.js API endpoint that handles user authentication",
			securityFocus: "vulnerability-analysis",
			language: "javascript",
			securityRequirements: ["Input validation", "SQL injection prevention"],
			complianceStandards: ["OWASP-Top-10"],
			riskTolerance: "medium",
			analysisScope: ["input-validation", "authentication", "authorization"],
		});
		const text = result.content[0].text;
		assert.ok(
			/Security.*Prompt Template/i.test(text),
			"Missing security prompt template header",
		);
		assert.ok(
			/Vulnerability Analysis/i.test(text),
			"Missing vulnerability analysis section",
		);
		assert.ok(
			/OWASP/i.test(text),
			"Missing OWASP compliance reference",
		);
		assert.ok(
			/Input validation|Authentication|Authorization/i.test(text),
			"Missing analysis scope sections",
		);
		assert.ok(
			/Critical\/High\/Medium\/Low/i.test(text),
			"Missing severity rating guidance",
		);
	}

	const tests = [
		["Domain Neutral Minimal", testDomainNeutralMinimal],
		["Spark Minimal", testSparkMinimal],
		["Model Compatibility Checker", testModelCompatibility],
		["Guidelines Validator", testGuidelinesValidator],
		["Spark Prompt Builder", testSparkBuilder],
		["Domain Neutral Prompt Builder", testDomainNeutralBuilder],
		["Hierarchical Prompt Builder", testHierarchicalBuilder],
		[
			"Model Compat Code Examples (Python)",
			testModelCompatibilityCodeExamplesPython,
		],
		["Model Compat Code Examples (TS)", testModelCompatibilityCodeExamplesTS],
		["Hierarchical Conditional Sections", testHierarchicalConditionalSections],
		["Guidelines Validator Issues Branch", testGuidelinesValidatorIssuesBranch],
		["Provider Tips Variants", testProviderTipsVariants],
		["Normalize Output Format Paths", testNormalizeOutputFormatPaths],
		["Technique Auto-Select", testTechniqueAutoSelect],
		["Shared Disclaimer Export", testSharedDisclaimerExport],
		["Security Hardening Prompt Builder", testSecurityHardeningPromptBuilder],
	];
	for (const [name, fn] of tests) {
		try {
			await fn();
			console.log(`✅ ${name} passed`);
		} catch (e) {
			console.error(`❌ ${name} failed:`, e.message);
			process.exitCode = 1;
		}
	}
	if (process.exitCode) {
		throw new Error("Unit tests failed");
	} else {
		console.log("🎉 All unit tests passed");
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
