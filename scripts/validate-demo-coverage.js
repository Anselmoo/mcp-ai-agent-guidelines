#!/usr/bin/env node

/**
 * Validates that all tools registered in src/index.ts have corresponding demos in demos/demo-tools.js
 * 
 * This script ensures documentation coverage by checking that every MCP tool has a demo.
 * Exit code 0 = all tools have demos
 * Exit code 1 = some tools are missing demos
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tool names that should be excluded from demo validation
const EXCLUDED_TOOLS = [
	"ai-agent-guidelines", // This is the server name, not a tool
];

/**
 * Extract tool names from index.ts
 * @returns {string[]} Array of kebab-case tool names
 */
function getRegisteredTools() {
	const indexPath = resolve(__dirname, "../src/index.ts");
	const content = readFileSync(indexPath, "utf8");

	const toolNames = [];
	const lines = content.split("\n");

	for (const line of lines) {
		// Match lines like: name: "tool-name",
		const match = line.match(/^\s+name:\s+"([^"]+)"/);
		if (match) {
			const toolName = match[1];
			if (!EXCLUDED_TOOLS.includes(toolName)) {
				toolNames.push(toolName);
			}
		}
	}

	return toolNames.sort();
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str - kebab-case string
 * @returns {string} camelCase string
 */
function kebabToCamelCase(str) {
	return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Check if a tool is used in demo-tools.js
 * @param {string} toolName - kebab-case tool name
 * @returns {boolean} true if tool is used in demos
 */
function isToolInDemos(toolName) {
	const demoPath = resolve(__dirname, "../demos/demo-tools.js");
	const content = readFileSync(demoPath, "utf8");

	// Convert to camelCase for import/usage check
	const camelCase = kebabToCamelCase(toolName);

	// Check if tool is imported or used
	return content.includes(camelCase);
}

/**
 * Main validation function
 */
function main() {
	console.log("🔍 Validating demo coverage for all registered tools...\n");

	const registeredTools = getRegisteredTools();
	const missingDemos = [];

	console.log(`📊 Found ${registeredTools.length} registered tools in index.ts\n`);

	for (const tool of registeredTools) {
		if (!isToolInDemos(tool)) {
			missingDemos.push(tool);
		}
	}

	if (missingDemos.length === 0) {
		console.log("✅ All registered tools have demos!\n");
		console.log(`✨ Demo coverage: 100% (${registeredTools.length}/${registeredTools.length} tools)\n`);
		return 0;
	}

	console.log(`❌ Found ${missingDemos.length} tool(s) without demos:\n`);
	for (const tool of missingDemos) {
		console.log(`   - ${tool}`);
	}

	console.log(
		`\n📊 Demo coverage: ${Math.round(((registeredTools.length - missingDemos.length) / registeredTools.length) * 100)}% (${registeredTools.length - missingDemos.length}/${registeredTools.length} tools)\n`,
	);
	console.log("💡 To fix: Add demos for the missing tools in demos/demo-tools.js\n");

	return 1;
}

const exitCode = main();
process.exit(exitCode);
