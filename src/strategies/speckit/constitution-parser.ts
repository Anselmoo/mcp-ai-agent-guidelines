/**
 * Constitution parser - extracts structured data from CONSTITUTION.md
 *
 * @module strategies/speckit/constitution-parser
 */

import type {
	ArchitectureRule,
	Constitution,
	ConstitutionMetadata,
	Constraint,
	DesignPrinciple,
	Principle,
} from "./types.js";

// Pattern for numbered principles: ### 1. Title
const PRINCIPLE_PATTERN = /^### (\d+)\.\s+(.+)$/gm;

// Pattern for constraints: ### C1: Title
const CONSTRAINT_PATTERN = /^### (C\d+):\s+(.+)$/gm;

// Pattern for architecture rules: ### AR1: Title
const ARCH_RULE_PATTERN = /^### (AR\d+):\s+(.+)$/gm;

// Pattern for design principles: ### DP1: Title
const DESIGN_PRINCIPLE_PATTERN = /^### (DP\d+):\s+(.+)$/gm;

/**
 * Parse a CONSTITUTION.md document into structured data
 *
 * @param content - The markdown content of CONSTITUTION.md
 * @returns Structured constitution data
 */
export function parseConstitution(content: string): Constitution {
	return {
		principles: extractPrinciples(content),
		constraints: extractConstraints(content),
		architectureRules: extractArchitectureRules(content),
		designPrinciples: extractDesignPrinciples(content),
		metadata: extractMetadata(content),
	};
}

/**
 * Extract foundational principles (numbered 1-5)
 *
 * @param content - The markdown content
 * @returns Array of principles
 */
function extractPrinciples(content: string): Principle[] {
	const principles: Principle[] = [];
	const matches = Array.from(content.matchAll(PRINCIPLE_PATTERN));

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const [, id, title] = match;
		const startIndex = match.index ?? 0;
		const nextMatch = matches[i + 1];
		const endIndex = nextMatch?.index ?? content.length;

		const description = extractSectionContent(content, startIndex, endIndex);

		principles.push({
			id,
			title,
			description,
			type: "principle",
		});
	}

	return principles;
}

/**
 * Extract constraints (C1-C5)
 *
 * @param content - The markdown content
 * @returns Array of constraints
 */
function extractConstraints(content: string): Constraint[] {
	const constraints: Constraint[] = [];
	const matches = Array.from(content.matchAll(CONSTRAINT_PATTERN));

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const [, id, title] = match;
		const startIndex = match.index ?? 0;
		const nextMatch = matches[i + 1];
		const endIndex = nextMatch?.index ?? content.length;

		const description = extractSectionContent(content, startIndex, endIndex);

		constraints.push({
			id,
			title,
			description,
			type: "constraint",
		});
	}

	return constraints;
}

/**
 * Extract architecture rules (AR1-AR4)
 *
 * @param content - The markdown content
 * @returns Array of architecture rules
 */
function extractArchitectureRules(content: string): ArchitectureRule[] {
	const rules: ArchitectureRule[] = [];
	const matches = Array.from(content.matchAll(ARCH_RULE_PATTERN));

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const [, id, title] = match;
		const startIndex = match.index ?? 0;
		const nextMatch = matches[i + 1];
		const endIndex = nextMatch?.index ?? content.length;

		const description = extractSectionContent(content, startIndex, endIndex);

		rules.push({
			id,
			title,
			description,
			type: "architecture-rule",
		});
	}

	return rules;
}

/**
 * Extract design principles (DP1-DP5)
 *
 * @param content - The markdown content
 * @returns Array of design principles
 */
function extractDesignPrinciples(content: string): DesignPrinciple[] {
	const principles: DesignPrinciple[] = [];
	const matches = Array.from(content.matchAll(DESIGN_PRINCIPLE_PATTERN));

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const [, id, title] = match;
		const startIndex = match.index ?? 0;
		const nextMatch = matches[i + 1];
		const endIndex = nextMatch?.index ?? content.length;

		const description = extractSectionContent(content, startIndex, endIndex);

		principles.push({
			id,
			title,
			description,
			type: "design-principle",
		});
	}

	return principles;
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
		// Check if it mentions version information
		if (blockquoteText.toLowerCase().includes("v0.13")) {
			metadata.appliesTo = "v0.13.x and all future versions";
		}
	}

	// Return undefined if no metadata was found
	if (Object.keys(metadata).length === 0) {
		return undefined;
	}

	return metadata;
}
