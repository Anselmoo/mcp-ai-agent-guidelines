#!/usr/bin/env node
/**
 * Demo script to showcase the constitution parser
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseConstitution } from "../dist/strategies/speckit/constitution-parser.js";

async function main() {
	try {
		console.log("🔍 Constitution Parser Demo\n");
		console.log("Reading CONSTITUTION.md...");

		const constitutionPath = join(
			process.cwd(),
			"plan-v0.13.x",
			"CONSTITUTION.md",
		);
		const content = await readFile(constitutionPath, "utf-8");

		console.log("✅ File loaded successfully\n");
		console.log("Parsing constitution...");

		const constitution = parseConstitution(content);

		console.log("✅ Constitution parsed successfully\n");

		// Display summary
		console.log("📊 PARSING RESULTS:");
		console.log("=".repeat(50));
		console.log(`Title: ${constitution.metadata?.title || "N/A"}`);
		console.log(`Applies To: ${constitution.metadata?.appliesTo || "N/A"}`);
		console.log("\n📈 Counts:");
		console.log(`  - Principles: ${constitution.principles.length}`);
		console.log(`  - Constraints: ${constitution.constraints.length}`);
		console.log(
			`  - Architecture Rules: ${constitution.architectureRules.length}`,
		);
		console.log(
			`  - Design Principles: ${constitution.designPrinciples.length}`,
		);

		// Show sample principle
		console.log("\n🎯 Sample Principle:");
		console.log("=".repeat(50));
		const principle = constitution.principles[0];
		console.log(`ID: ${principle.id}`);
		console.log(`Title: ${principle.title}`);
		console.log(
			`Description Preview: ${principle.description.substring(0, 100)}...`,
		);

		// Show sample constraint
		console.log("\n🚫 Sample Constraint:");
		console.log("=".repeat(50));
		const constraint = constitution.constraints[0];
		console.log(`ID: ${constraint.id}`);
		console.log(`Title: ${constraint.title}`);
		console.log(
			`Description Preview: ${constraint.description.substring(0, 100)}...`,
		);

		// List all IDs
		console.log("\n📋 All Extracted IDs:");
		console.log("=".repeat(50));
		console.log(
			"Principles:",
			constitution.principles.map((p) => p.id).join(", "),
		);
		console.log(
			"Constraints:",
			constitution.constraints.map((c) => c.id).join(", "),
		);
		console.log(
			"Architecture Rules:",
			constitution.architectureRules.map((r) => r.id).join(", "),
		);
		console.log(
			"Design Principles:",
			constitution.designPrinciples.map((dp) => dp.id).join(", "),
		);

		console.log("\n✨ Demo complete!");
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

main();
