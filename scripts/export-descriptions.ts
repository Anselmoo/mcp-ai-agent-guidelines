#!/usr/bin/env node
/**
 * Export tool descriptions to CSV for documentation and LLM discoverability audits.
 * Usage: npx tsx scripts/export-descriptions.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const indexPath = join(root, "src", "index.ts");

const source = readFileSync(indexPath, "utf8");

// Extract tool name + description pairs
const toolPattern = /name:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"/g;
const rows: string[] = ["tool_name,description"];

let match = toolPattern.exec(source);
while (match !== null) {
	const name = match[1];
	const description = match[2].replace(/"/g, '""'); // escape CSV
	rows.push(`"${name}","${description}"`);
	match = toolPattern.exec(source);
}

const csvPath = join(root, "artifacts", "tool-descriptions.csv");
writeFileSync(csvPath, `${rows.join("\n")}\n`, "utf8");
console.log(`Exported ${rows.length - 1} tools to ${csvPath}`);
