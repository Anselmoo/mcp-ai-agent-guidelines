/**
 * Accessibility utilities for Mermaid diagrams.
 */

/**
 * Apply accessibility metadata to diagram.
 * Adds accTitle and accDescr as Mermaid comments.
 * @param diagram - Mermaid diagram code
 * @param accTitle - Optional accessibility title
 * @param accDescr - Optional accessibility description
 * @returns Diagram with accessibility comments prepended
 */
export function applyAccessibility(
	diagram: string,
	accTitle?: string,
	accDescr?: string,
): string {
	const accLines: string[] = [];
	if (accTitle) accLines.push(`%% AccTitle: ${accTitle} %%`);
	if (accDescr) accLines.push(`%% AccDescr: ${accDescr} %%`);

	if (accLines.length === 0) {
		return diagram;
	}

	return [accLines.join("\n"), diagram].join("\n");
}

/**
 * Prepare accessibility comments without applying to diagram.
 * @param accTitle - Optional accessibility title
 * @param accDescr - Optional accessibility description
 * @returns Accessibility comments string or empty string
 */
export function prepareAccessibilityComments(
	accTitle?: string,
	accDescr?: string,
): string {
	const accLines: string[] = [];
	if (accTitle) accLines.push(`%% AccTitle: ${accTitle} %%`);
	if (accDescr) accLines.push(`%% AccDescr: ${accDescr} %%`);
	return accLines.join("\n");
}

/**
 * Extract accessibility comments from diagram.
 * @param diagram - Mermaid diagram code
 * @returns Object with accTitle and accDescr if present
 */
export function extractAccessibility(diagram: string): {
	accTitle?: string;
	accDescr?: string;
} {
	const result: { accTitle?: string; accDescr?: string } = {};

	const titleMatch = diagram.match(/%% AccTitle: (.+?) %%/);
	if (titleMatch) {
		result.accTitle = titleMatch[1];
	}

	const descrMatch = diagram.match(/%% AccDescr: (.+?) %%/);
	if (descrMatch) {
		result.accDescr = descrMatch[1];
	}

	return result;
}
