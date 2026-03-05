/**
 * validate_schema_examples MCP tool.
 * Checks Zod schemas across src/ to verify .describe() coverage.
 * @module
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";

// ============================================
// Schemas
// ============================================

export const validateSchemaExamplesRequestSchema = z
	.object({
		sourceDir: z
			.string()
			.optional()
			.describe("Source directory to scan (defaults to src/)"),
		targetPercent: z
			.number()
			.min(0)
			.max(100)
			.default(80)
			.describe("Minimum percentage of fields requiring .describe() calls"),
		includeGlob: z
			.string()
			.optional()
			.describe("Glob pattern for files to include (e.g. 'src/tools/**/*.ts')"),
	})
	.describe("Request to validate Zod schema description coverage");

export type ValidateSchemaExamplesRequest = z.infer<
	typeof validateSchemaExamplesRequestSchema
>;

// ============================================
// Types
// ============================================

export interface FileSchemaStats {
	filePath: string;
	totalFields: number;
	describedFields: number;
	coveragePercent: number;
}

export interface ValidateSchemaExamplesResult {
	passed: boolean;
	totalFields: number;
	describedFields: number;
	coveragePercent: number;
	targetPercent: number;
	files: FileSchemaStats[];
	summary: string;
}

// ============================================
// Core Logic
// ============================================

const ZOD_FIELD_RE =
	/z\.(string|number|boolean|enum|array|object|record|union|literal|date|bigint|symbol|null|undefined|any|unknown)\s*\(/g;
const DESCRIBE_RE = /\.describe\s*\(/g;

function scanFile(filePath: string): FileSchemaStats {
	const content = fs.readFileSync(filePath, "utf-8");

	// Count zod field declarations
	const fieldMatches = content.match(ZOD_FIELD_RE) ?? [];
	const totalFields = fieldMatches.length;

	// Count .describe() calls
	const descMatches = content.match(DESCRIBE_RE) ?? [];
	const describedFields = descMatches.length;

	const coveragePercent =
		totalFields > 0 ? (describedFields / totalFields) * 100 : 100;

	return {
		filePath,
		totalFields,
		describedFields,
		coveragePercent: Math.round(coveragePercent * 10) / 10,
	};
}

function walkDir(dir: string, results: string[] = []): string[] {
	if (!fs.existsSync(dir)) return results;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkDir(fullPath, results);
		} else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
			results.push(fullPath);
		}
	}
	return results;
}

// ============================================
// Tool Handler
// ============================================

export function validateSchemaExamples(
	request: ValidateSchemaExamplesRequest,
): ValidateSchemaExamplesResult {
	const srcDir = request.sourceDir ?? path.join(process.cwd(), "src");
	const target = request.targetPercent ?? 80;

	const tsFiles = walkDir(srcDir).filter((f) => {
		// Only scan files that import zod
		try {
			const c = fs.readFileSync(f, "utf-8");
			return c.includes("from 'zod'") || c.includes('from "zod"');
		} catch {
			return false;
		}
	});

	const fileStats = tsFiles.map(scanFile).filter((s) => s.totalFields > 0);

	const totalFields = fileStats.reduce((acc, s) => acc + s.totalFields, 0);
	const describedFields = fileStats.reduce(
		(acc, s) => acc + s.describedFields,
		0,
	);
	const coveragePercent =
		totalFields > 0 ? (describedFields / totalFields) * 100 : 100;
	const rounded = Math.round(coveragePercent * 10) / 10;
	const passed = rounded >= target;

	return {
		passed,
		totalFields,
		describedFields,
		coveragePercent: rounded,
		targetPercent: target,
		files: fileStats,
		summary: passed
			? `✅ Schema description coverage ${rounded}% meets target ${target}%`
			: `❌ Schema description coverage ${rounded}% below target ${target}%`,
	};
}
