#!/usr/bin/env node

/**
 * Demo script showing the new export format and YAML model features
 */

import { getModels } from "../dist/tools/config/model-loader.js";
import { hierarchicalPromptBuilder } from "../dist/tools/prompt/hierarchical-prompt-builder.js";
import {
	exportAsCSV,
	objectsToCSV,
} from "../dist/tools/shared/export-utils.js";

console.log("=".repeat(80));
console.log("DEMO: New Export Format and YAML Model Features");
console.log("=".repeat(80));
console.log();

// Demo 1: Show YAML-loaded models
console.log("📦 Demo 1: YAML-based Model Loading");
console.log("-".repeat(80));
const models = getModels();
console.log(`✓ Loaded ${models.length} models from YAML configuration`);
console.log(`✓ Model names: ${models.map((m) => m.name).join(", ")}`);
console.log();

// Demo 2: LaTeX export
console.log("📄 Demo 2: LaTeX Document Export");
console.log("-".repeat(80));
const latexResult = await hierarchicalPromptBuilder({
	context: "Building a REST API for a task management application",
	goal: "Create comprehensive API design guidelines",
	requirements: [
		"Follow RESTful principles",
		"Include authentication and authorization",
		"Document all endpoints with examples",
	],
	exportFormat: "latex",
	documentTitle: "REST API Design Guidelines",
	documentAuthor: "Development Team",
	documentDate: "2025-10-30",
	includeHeaders: true,
});

const latexOutput = latexResult.content[0].text;
console.log("✓ Generated LaTeX document");
console.log(`✓ Length: ${latexOutput.length} characters`);
console.log("✓ Preview (first 200 chars):");
console.log(latexOutput.substring(0, 200) + "...");
console.log();

// Demo 3: CSV export
console.log("📊 Demo 3: CSV Export from Model Data");
console.log("-".repeat(80));
const modelData = models.slice(0, 5).map((m) => ({
	name: m.name,
	provider: m.provider,
	tier: m.pricingTier,
	tokens: m.contextTokens,
	score: m.baseScore,
}));

const csv = objectsToCSV(modelData);
console.log("✓ Converted model data to CSV");
console.log("✓ CSV output:");
console.log(csv);
console.log();

// Demo 4: JSON export
console.log("📋 Demo 4: JSON Export");
console.log("-".repeat(80));
const jsonResult = await hierarchicalPromptBuilder({
	context: "Sprint planning for Q1 2025",
	goal: "Define sprint objectives and deliverables",
	exportFormat: "json",
	documentTitle: "Q1 2025 Sprint Plan",
	includeHeaders: true,
});

const jsonOutput = JSON.parse(jsonResult.content[0].text);
console.log("✓ Generated JSON output");
console.log(`✓ Has content: ${!!jsonOutput.content}`);
console.log(`✓ Has metadata: ${!!jsonOutput.metadata}`);
console.log(`✓ Metadata title: ${jsonOutput.metadata.title}`);
console.log();

// Demo 5: Header suppression for chat
console.log("💬 Demo 5: Clean Chat Output (No Headers)");
console.log("-".repeat(80));
const chatResult = await hierarchicalPromptBuilder({
	context: "User asked about Python best practices",
	goal: "Provide Python coding best practices",
	requirements: [
		"Use PEP 8 style guide",
		"Include type hints",
		"Write docstrings",
	],
	exportFormat: "markdown",
	includeHeaders: false,
	includeFrontmatter: false,
	includeMetadata: false,
});

const chatOutput = chatResult.content[0].text;
console.log("✓ Generated clean chat output (no headers)");
console.log("✓ Preview:");
console.log(chatOutput.substring(0, 300) + "...");
console.log();

// Demo 6: Multiple formats comparison
console.log("🔄 Demo 6: Same Content, Multiple Formats");
console.log("-".repeat(80));
const testContext = "Code review process";
const testGoal = "Establish code review guidelines";

const markdownResult = await hierarchicalPromptBuilder({
	context: testContext,
	goal: testGoal,
	exportFormat: "markdown",
});

const latexCompareResult = await hierarchicalPromptBuilder({
	context: testContext,
	goal: testGoal,
	exportFormat: "latex",
	documentTitle: "Code Review Guidelines",
});

const jsonCompareResult = await hierarchicalPromptBuilder({
	context: testContext,
	goal: testGoal,
	exportFormat: "json",
});

console.log("✓ Generated same content in 3 formats:");
console.log(`  - Markdown: ${markdownResult.content[0].text.length} chars`);
console.log(`  - LaTeX: ${latexCompareResult.content[0].text.length} chars`);
console.log(`  - JSON: ${jsonCompareResult.content[0].text.length} chars`);
console.log();

console.log("=".repeat(80));
console.log("✅ All demos completed successfully!");
console.log("=".repeat(80));
console.log();
console.log("📚 Documentation:");
console.log("  - Export Formats: docs/export-formats.md");
console.log("  - Model Maintenance: docs/maintaining-models.md");
console.log();
