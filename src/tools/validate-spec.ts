/**
 * Validate Spec Tool
 *
 * Dedicated MCP tool for validating spec.md content against
 * constitutional constraints without generating new artifacts.
 * Useful for iterative spec refinement and quality assurance.
 *
 * @module tools/validate-spec
 */

import { promises as fs } from "node:fs";
import type { ValidateSpecRequest } from "../schemas/validate-spec.js";
import {
	createSpecValidator,
	parseConstitution,
	parseSpecFromMarkdown,
} from "../strategies/speckit/index.js";
import type { ValidationReport } from "../strategies/speckit/types.js";
import type { McpResponse } from "./shared/error-handler.js";
import { createMcpResponse } from "./shared/response-utils.js";

/**
 * Validate spec.md content against constitutional constraints
 *
 * @param request - Validation request with spec content and constitution
 * @returns MCP response with validation results
 * @throws {Error} If neither constitutionPath nor constitutionContent is provided
 * @throws {Error} If constitution file cannot be read
 *
 * @example
 * ```typescript
 * const result = await validateSpec({
 *   specContent: "# My Spec\n\n## Overview\n...",
 *   constitutionPath: "./CONSTITUTION.md",
 *   outputFormat: "markdown"
 * });
 * ```
 */
export async function validateSpec(
	request: ValidateSpecRequest,
): Promise<McpResponse> {
	// Load constitution
	let constitutionContent: string;
	if (request.constitutionContent) {
		constitutionContent = request.constitutionContent;
	} else if (request.constitutionPath) {
		try {
			constitutionContent = await fs.readFile(
				request.constitutionPath,
				"utf-8",
			);
		} catch (error) {
			throw new Error(
				`Failed to read constitution file: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	} else {
		throw new Error(
			"Either constitutionPath or constitutionContent must be provided",
		);
	}

	// Parse constitution and spec
	const constitution = parseConstitution(constitutionContent);
	const specContent = parseSpecFromMarkdown(request.specContent);

	// Create validator and validate
	const validator = createSpecValidator(constitution);
	let report = validator.generateReport(specContent);

	// Remove recommendations if not requested
	if (!request.includeRecommendations && report.recommendations) {
		report = { ...report, recommendations: undefined };
	}

	// Format output
	let output: string;
	switch (request.outputFormat) {
		case "json":
			output = JSON.stringify(report, null, 2);
			break;
		case "markdown":
			output = validator.formatReportAsMarkdown(report);
			break;
		case "summary":
			output = formatSummary(report);
			break;
		default:
			output = validator.formatReportAsMarkdown(report);
	}

	return createMcpResponse({
		content: output,
	});
}

/**
 * Format validation report as a summary line
 *
 * @param report - Validation report to summarize
 * @returns Single-line summary of validation results
 */
function formatSummary(report: ValidationReport): string {
	const status = report.valid ? "✅ VALID" : "❌ INVALID";
	return `Validation: ${status} | Score: ${report.score}/100 | Errors: ${report.metrics.failed} | Warnings: ${report.metrics.warnings}`;
}
