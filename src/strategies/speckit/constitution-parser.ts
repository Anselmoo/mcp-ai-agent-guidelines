/**
 * Constitution parser - extracts structured data from CONSTITUTION.md
 *
 * @module strategies/speckit/constitution-parser
 */

import type { Constitution, ConstitutionMetadata } from "./types.js";

// Pattern for numbered principles: ### 1. Title
const PRINCIPLE_PATTERN = /^### (\d+)\.\s+(.+)$/gm;

// Pattern for constraints: ### C1: Title
const CONSTRAINT_PATTERN = /^### (C\d+):\s+(.+)$/gm;

// Pattern for architecture rules: ### AR1: Title
const ARCH_RULE_PATTERN = /^### (AR\d+):\s+(.+)$/gm;

// Pattern for design principles: ### DP1: Title
const DESIGN_PRINCIPLE_PATTERN = /^### (DP\d+):\s+(.+)$/gm;

// Pattern to find next heading boundary (level 2 or 3)
const NEXT_HEADING_PATTERN = /^##(?:#)?\s+/gm;

/**
 * Generic type for extracted items with id, title, description, and type
 */
type ExtractedItem<T extends string> = {
	id: string;
	title: string;
	description: string;
	type: T;
};

/**
 * Parse a CONSTITUTION.md document into structured data
 *
 * @param content - The markdown content of CONSTITUTION.md
 * @returns Structured constitution data
 */
export function parseConstitution(content: string): Constitution {
	return {
		principles: extractItems(content, PRINCIPLE_PATTERN, "principle"),
		constraints: extractItems(content, CONSTRAINT_PATTERN, "constraint"),
		architectureRules: extractItems(
			content,
			ARCH_RULE_PATTERN,
			"architecture-rule",
		),
		designPrinciples: extractItems(
			content,
			DESIGN_PRINCIPLE_PATTERN,
			"design-principle",
		),
		metadata: extractMetadata(content),
	};
}

/**
 * Generic extraction function for any item type
 *
 * @param content - The markdown content
 * @param pattern - The regex pattern to match items
 * @param type - The type identifier for the items
 * @returns Array of extracted items
 */
function extractItems<T extends string>(
	content: string,
	pattern: RegExp,
	type: T,
): ExtractedItem<T>[] {
	const items: ExtractedItem<T>[] = [];
	const matches = Array.from(content.matchAll(pattern));

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const [, id, title] = match;
		const startIndex = match.index ?? 0;

		// Find the end index: either the next heading or end of content
		const endIndex = findNextHeadingIndex(content, startIndex + 1);

		const description = extractSectionContent(content, startIndex, endIndex);

		items.push({
			id,
			title,
			description,
			type,
		});
	}

	return items;
}

/**
 * Find the index of the next heading (level 2 or 3) after the given start position
 *
 * @param content - The full markdown content
 * @param startIndex - Position to start searching from
 * @returns Index of next heading, or content.length if none found
 */
function findNextHeadingIndex(content: string, startIndex: number): number {
	// Reset the regex to start from the beginning
	const headingPattern = new RegExp(NEXT_HEADING_PATTERN.source, "gm");

	// Start searching from startIndex
	headingPattern.lastIndex = startIndex;

	const nextHeading = headingPattern.exec(content);
	return nextHeading?.index ?? content.length;
}

/**
 * Extract content from a section between start and end indices
 *
 * @param content - The full markdown content
 * @param startIndex - Start position in content
 * @param endIndex - End position in content (exclusive)
 * @returns Extracted and trimmed section content
 */
function extractSectionContent(
	content: string,
	startIndex: number,
	endIndex: number,
): string {
	// Extract the section content
	const section = content.substring(startIndex, endIndex);

	// Find the end of the first line (the heading)
	const firstNewline = section.indexOf("\n");
	if (firstNewline === -1) {
		return "";
	}

	// Get everything after the heading
	let sectionContent = section.substring(firstNewline + 1).trim();

	// Remove trailing separator lines (---) if present
	sectionContent = sectionContent.replace(/\n---\s*$/, "");

	return sectionContent;
}

/**
 * Extract metadata from document front matter or headers
 *
 * @param content - The markdown content
 * @returns Metadata object or undefined
 */
function extractMetadata(content: string): ConstitutionMetadata | undefined {
	const metadata: ConstitutionMetadata = {};

	// Extract title from first H1 heading
	const titleMatch = content.match(/^#\s+(.+)$/m);
	if (titleMatch) {
		metadata.title = titleMatch[1];
	}

	// Extract "applies to" information from blockquote at the start
	const blockquoteMatch = content.match(/^>\s+(.+)$/m);
	if (blockquoteMatch) {
		const blockquoteText = blockquoteMatch[1];
		// If the blockquote mentions a version, store the full text as appliesTo
		const versionPattern = /\bv\d+(?:\.\d+)*\b/i;
		if (versionPattern.test(blockquoteText)) {
			metadata.appliesTo = blockquoteText.trim();
		}
	}

	// Return undefined if no metadata was found
	if (Object.keys(metadata).length === 0) {
		return undefined;
	}

	return metadata;
}
