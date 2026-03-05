/**
 * validate_annotations MCP tool.
 * Verifies all registered MCP tools have proper ToolAnnotations in src/index.ts.
 * @module
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";

// ============================================
// Schemas
// ============================================

export const validateAnnotationsRequestSchema = z
	.object({
		indexPath: z
			.string()
			.optional()
			.describe(
				"Path to src/index.ts (defaults to src/index.ts relative to cwd)",
			),
		strict: z
			.boolean()
			.default(false)
			.describe(
				"If true, fail when any tool is missing annotations. If false, return warnings.",
			),
	})
	.describe("Request to validate MCP tool annotations coverage");

export type ValidateAnnotationsRequest = z.infer<
	typeof validateAnnotationsRequestSchema
>;

// ============================================
// Types
// ============================================

export interface ToolAnnotationStatus {
	toolName: string;
	hasAnnotations: boolean;
	hasTitle: boolean;
	hasReadOnly: boolean;
}

export interface ValidateAnnotationsResult {
	passed: boolean;
	totalTools: number;
	annotatedTools: number;
	coveragePercent: number;
	tools: ToolAnnotationStatus[];
	summary: string;
}

// ============================================
// Core Logic
// ============================================

function parseAnnotations(content: string): ValidateAnnotationsResult {
	const toolNames: string[] = [];

	// Find all tool registration blocks (name + annotations nearby)
	const toolBlockRe =
		/\{\s*\n?\s*name:\s*["']([^"']+)["'][^}]*?annotations:\s*\{[^}]*title:[^}]*\}/gs;
	const annotatedSet = new Set<string>();

	let match = toolBlockRe.exec(content);
	while (match !== null) {
		annotatedSet.add(match[1]);
		match = toolBlockRe.exec(content);
	}

	// Find all tool names registered
	const allNamesRe = /name:\s*["']([^"']+)["']/g;
	let nm = allNamesRe.exec(content);
	while (nm !== null) {
		// Simple heuristic: only names that look like tool slugs (contain hyphen or underscore)
		if (/[-_]/.test(nm[1])) {
			toolNames.push(nm[1]);
		}
		nm = allNamesRe.exec(content);
	}

	const unique = [...new Set(toolNames)];
	const tools: ToolAnnotationStatus[] = unique.map((name) => ({
		toolName: name,
		hasAnnotations: annotatedSet.has(name),
		hasTitle: annotatedSet.has(name),
		hasReadOnly: annotatedSet.has(name),
	}));

	const annotated = tools.filter((t) => t.hasAnnotations).length;
	const pct = tools.length > 0 ? (annotated / tools.length) * 100 : 100;

	return {
		passed: pct >= 100,
		totalTools: tools.length,
		annotatedTools: annotated,
		coveragePercent: Math.round(pct * 10) / 10,
		tools,
		summary:
			pct >= 100
				? `✅ All ${tools.length} tools have annotations (100%)`
				: `⚠️  ${annotated}/${tools.length} tools annotated (${Math.round(pct)}%)`,
	};
}

// ============================================
// Tool Handler
// ============================================

export function validateAnnotations(
	request: ValidateAnnotationsRequest,
): ValidateAnnotationsResult {
	const indexFile =
		request.indexPath ?? path.join(process.cwd(), "src", "index.ts");

	if (!fs.existsSync(indexFile)) {
		return {
			passed: false,
			totalTools: 0,
			annotatedTools: 0,
			coveragePercent: 0,
			tools: [],
			summary: `❌ index.ts not found at ${indexFile}`,
		};
	}

	const content = fs.readFileSync(indexFile, "utf-8");
	const result = parseAnnotations(content);

	if (request.strict && !result.passed) {
		throw new Error(
			`validate_annotations: ${result.totalTools - result.annotatedTools} tools missing annotations`,
		);
	}

	return result;
}
