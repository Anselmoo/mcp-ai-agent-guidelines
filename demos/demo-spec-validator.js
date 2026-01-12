#!/usr/bin/env node

/**
 * Demo script for SpecValidator
 *
 * Shows how to use the SpecValidator to validate specifications
 * against constitutional constraints.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseConstitution } from "../dist/strategies/speckit/constitution-parser.js";
import { createSpecValidator } from "../dist/strategies/speckit/spec-validator.js";

console.log("=".repeat(80));
console.log("SpecValidator Demo");
console.log("=".repeat(80));
console.log();

// Load the real CONSTITUTION.md
const constitutionPath = join(process.cwd(), "plan-v0.13.x", "CONSTITUTION.md");
const constitutionContent = readFileSync(constitutionPath, "utf-8");

console.log("📋 Loading CONSTITUTION.md...");
const constitution = parseConstitution(constitutionContent);
console.log(`✅ Loaded constitution with:`);
console.log(`   - ${constitution.principles.length} principles`);
console.log(`   - ${constitution.constraints.length} constraints`);
console.log(`   - ${constitution.architectureRules.length} architecture rules`);
console.log(`   - ${constitution.designPrinciples.length} design principles`);
console.log();

// Create validator
const validator = createSpecValidator(constitution);

// Test Case 1: Valid Spec
console.log("Test Case 1: Valid Specification");
console.log("-".repeat(80));

const validSpec = {
	title: "User Authentication Feature",
	overview: "Implement secure user authentication with OAuth 2.0",
	objectives: [
		{ description: "Provide secure login mechanism", priority: "high" },
	],
	requirements: [
		{
			description: "Use TypeScript strict mode with explicit types",
			type: "technical",
		},
		{
			description: "Follow ESM module system with .js extensions",
			type: "technical",
		},
	],
	acceptanceCriteria: [
		"Users can log in successfully",
		"Security tests pass",
		"Code coverage exceeds 90%",
	],
	rawMarkdown: `# User Authentication Feature

A focused specification for implementing OAuth 2.0 authentication.

## Technical Requirements
- TypeScript strict mode
- ESM imports with .js extensions
- Single responsibility: authentication only
`,
};

const validResult = validator.validate(validSpec);
console.log(`Score: ${validResult.score}/100`);
console.log(`Valid: ${validResult.valid ? "✅" : "❌"}`);
console.log(`Checked: ${validResult.checkedConstraints} constraints`);
console.log(`Passed: ${validResult.passedConstraints} constraints`);
console.log(`Issues: ${validResult.issues.length}`);
console.log();

// Test Case 2: Problematic Spec
console.log("Test Case 2: Problematic Specification");
console.log("-".repeat(80));

const problematicSpec = {
	title: "Multi-Purpose Utility",
	overview: "This tool does everything",
	rawMarkdown: `# Multi-Purpose Utility

This specification uses any type for flexibility.

We'll use require() to import modules.

Architecture: domain → presentation → gateway (wrong order)

This tool handles: validation, formatting, parsing, rendering, caching, logging, and also error handling plus monitoring.
`,
};

const problematicResult = validator.validate(problematicSpec);
console.log(`Score: ${problematicResult.score}/100`);
console.log(`Valid: ${problematicResult.valid ? "✅" : "❌"}`);
console.log(`Checked: ${problematicResult.checkedConstraints} constraints`);
console.log(`Passed: ${problematicResult.passedConstraints} constraints`);
console.log(`Issues: ${problematicResult.issues.length}`);
console.log();

if (problematicResult.issues.length > 0) {
	console.log("Issues Found:");
	for (const issue of problematicResult.issues) {
		const icon =
			issue.severity === "error"
				? "🔴"
				: issue.severity === "warning"
					? "🟡"
					: "ℹ️";
		console.log(
			`  ${icon} [${issue.severity.toUpperCase()}] ${issue.code}: ${issue.message}`,
		);
		if (issue.suggestion) {
			console.log(`     💡 Suggestion: ${issue.suggestion}`);
		}
	}
}

console.log();
console.log("=".repeat(80));
console.log("Demo Complete!");
console.log("=".repeat(80));
