/**
 * Auto-repair utilities for Mermaid diagrams.
 */

/**
 * Attempt to repair a diagram with common syntax issues.
 * @param diagram - Mermaid diagram code
 * @returns Repaired diagram code
 */
export function repairDiagram(diagram: string): string {
	let repaired = diagram;

	// Normalize classDef syntax (convert fill= to fill: etc.)
	repaired = repaired.replace(
		/classDef (\w+) ([^\n;]+);?/g,
		(_m, name, body) => {
			const fixed = body
				.split(/[, ]+/)
				.filter(Boolean)
				.map((pair: string) => pair.replace(/=/g, ":"))
				.join(",");
			return `classDef ${name} ${fixed};`;
		},
	);

	// Ensure flowchart header present
	if (!/^\s*flowchart /.test(repaired) && /\bflowchart\b/.test(repaired)) {
		repaired = `flowchart TD\n${repaired}`;
	}

	return repaired;
}

/**
 * Generate a fallback minimal diagram.
 * Used when repair attempts fail.
 * @returns Minimal valid flowchart
 */
export function fallbackDiagram(): string {
	return [
		"flowchart TD",
		"A([Start]) --> B[Fallback Diagram]",
		"B --> C([End])",
	].join("\n");
}

/**
 * Check if diagram needs repair.
 * @param diagram - Mermaid diagram code
 * @returns True if diagram has known issues
 */
export function needsRepair(diagram: string): boolean {
	// Check for classDef with = instead of :
	if (/classDef \w+ [^:]*=/.test(diagram)) {
		return true;
	}

	// Check for missing flowchart header
	if (!/^\s*flowchart /.test(diagram) && /\bflowchart\b/.test(diagram)) {
		return true;
	}

	return false;
}
