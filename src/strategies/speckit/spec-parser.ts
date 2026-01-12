/**
 * Spec parser - extracts structured data from spec.md markdown
 *
 * @module strategies/speckit/spec-parser
 */

import type { SpecContent } from "./types.js";

/**
 * Parse spec.md markdown content into structured SpecContent
 *
 * @param markdown - The markdown content to parse
 * @returns Structured spec content for validation
 *
 * @example
 * ```typescript
 * const markdown = `
 * # My Specification
 *
 * ## Overview
 * This is a sample spec.
 *
 * ## Objectives
 * - Implement feature X
 * - Improve performance
 * `;
 *
 * const spec = parseSpecFromMarkdown(markdown);
 * // Returns: { title: "My Specification", overview: "This is a sample spec.", ... }
 * ```
 */
export function parseSpecFromMarkdown(markdown: string): SpecContent {
	const spec: SpecContent = {
		rawMarkdown: markdown,
	};

	// Extract title (first H1 heading)
	const titleMatch = markdown.match(/^#\s+(.+)$/m);
	if (titleMatch) {
		spec.title = titleMatch[1].trim();
	}

	// Extract overview section
	const overviewMatch = markdown.match(
		/##\s+Overview\s*\n+([\s\S]*?)(?=\n##|$)/i,
	);
	if (overviewMatch) {
		spec.overview = overviewMatch[1].trim();
	}

	// Extract objectives
	const objectiveItems = extractListItems(markdown, "Objectives");
	if (objectiveItems.length > 0) {
		spec.objectives = objectiveItems.map((desc) => ({
			description: desc,
		}));
	}

	// Extract requirements (from Requirements or Functional Requirements sections)
	const requirements = extractListItems(markdown, "Requirements");
	const functionalReqs = extractListItems(markdown, "Functional Requirements");
	const allRequirements = [...requirements, ...functionalReqs];

	if (allRequirements.length > 0) {
		spec.requirements = allRequirements.map((desc) => ({
			description: desc,
			type: "functional",
		}));
	}

	// Extract acceptance criteria
	spec.acceptanceCriteria = extractListItems(markdown, "Acceptance Criteria");

	return spec;
}

/**
 * Extract list items from a markdown section
 *
 * @param markdown - The markdown content
 * @param sectionTitle - The section title to extract from
 * @returns Array of list items (without bullets)
 */
function extractListItems(markdown: string, sectionTitle: string): string[] {
	// Match section heading followed by content until next heading or end
	const sectionPattern = new RegExp(
		`##\\s+${sectionTitle}\\s*\\n+([\\s\\S]*?)(?=\\n##|$)`,
		"i",
	);
	const sectionMatch = markdown.match(sectionPattern);

	if (!sectionMatch) {
		return [];
	}

	const content = sectionMatch[1];
	const items: string[] = [];

	// Extract bullet list items (- or *)
	const bulletPattern = /^[\s]*[-*]\s+(.+)$/gm;
	let match: RegExpExecArray | null = bulletPattern.exec(content);

	while (match !== null) {
		items.push(match[1].trim());
		match = bulletPattern.exec(content);
	}

	return items;
}
