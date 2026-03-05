#!/usr/bin/env tsx
/**
 * T-046: Schema Descriptions Audit (GAP-002)
 *
 * Audits Zod schemas in src/tools/ and src/schemas/ to report
 * how many fields have .describe() annotations.
 *
 * Outputs: artifacts/schema-audit.json + console summary.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { globSync } from "glob";

const ROOT = join(new URL(".", import.meta.url).pathname, "..");

interface FileAudit {
	file: string;
	totalFields: number;
	describedFields: number;
	coverage: number;
}

interface AuditReport {
	generatedAt: string;
	totalFiles: number;
	filesWithDescriptions: number;
	totalFields: number;
	describedFields: number;
	overallCoverage: number;
	targetCoverage: number;
	passed: boolean;
	files: FileAudit[];
}

const TARGET_COVERAGE = 0.8; // 80%

// Find all TypeScript files in src/tools/ and src/schemas/
const globs = [
	join(ROOT, "src/tools/**/*.ts"),
	join(ROOT, "src/schemas/**/*.ts"),
];

const files: string[] = [];
for (const pattern of globs) {
	files.push(...globSync(pattern));
}

const fileAudits: FileAudit[] = [];

for (const file of files) {
	const source = readFileSync(file, "utf8");

	// Count z.* field declarations (rough heuristic)
	const fieldMatches = source.match(
		/z\.(string|number|boolean|enum|array|object|union|literal|record|any|unknown)\(/g,
	);
	const totalFields = fieldMatches?.length ?? 0;

	// Count .describe( calls
	const describeMatches = source.match(/\.describe\(/g);
	const describedFields = describeMatches?.length ?? 0;

	if (totalFields > 0) {
		fileAudits.push({
			file: relative(ROOT, file),
			totalFields,
			describedFields,
			coverage: describedFields / totalFields,
		});
	}
}

const totalFiles = fileAudits.length;
const filesWithDescriptions = fileAudits.filter(
	(f) => f.describedFields > 0,
).length;
const totalFields = fileAudits.reduce((sum, f) => sum + f.totalFields, 0);
const describedFields = fileAudits.reduce(
	(sum, f) => sum + f.describedFields,
	0,
);
const overallCoverage = totalFields > 0 ? describedFields / totalFields : 0;
const passed = overallCoverage >= TARGET_COVERAGE;

const report: AuditReport = {
	generatedAt: new Date().toISOString(),
	totalFiles,
	filesWithDescriptions,
	totalFields,
	describedFields,
	overallCoverage,
	targetCoverage: TARGET_COVERAGE,
	passed,
	files: fileAudits.sort((a, b) => a.coverage - b.coverage),
};

const outPath = join(ROOT, "artifacts/schema-audit.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log("\n=== Schema Description Audit (T-046/GAP-002) ===");
console.log(`Files audited:       ${totalFiles}`);
console.log(`Files with .describe: ${filesWithDescriptions}`);
console.log(`Total Zod fields:    ${totalFields}`);
console.log(`Described fields:    ${describedFields}`);
console.log(`Coverage:            ${(overallCoverage * 100).toFixed(1)}%`);
console.log(`Target:              ${TARGET_COVERAGE * 100}%`);
console.log(`Status:              ${passed ? "✅ PASS" : "⚠️  BELOW TARGET"}`);
console.log(`\nReport saved to: ${outPath}`);

if (!passed) {
	console.log("\nFiles with lowest coverage:");
	for (const f of report.files.slice(0, 10)) {
		console.log(`  ${(f.coverage * 100).toFixed(0).padStart(3)}%  ${f.file}`);
	}
}
