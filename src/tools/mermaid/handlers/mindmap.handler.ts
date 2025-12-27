import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Handler for mindmap diagrams.
 * Generates hierarchical mindmap visualizations.
 */
export class MindmapHandler extends BaseDiagramHandler {
	readonly diagramType = "mindmap";

	generate(description: string, theme?: string): string {
		this.validateInput(description);

		const lines: string[] = ["mindmap"];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		const { root, children } = this.parseMindmapDescription(description);

		lines.push(`  root((${root}))`);

		if (children.length > 0) {
			for (const child of children) {
				lines.push(child);
			}
		} else {
			// Fallback template
			lines.push(
				"    Topic 1",
				"      Subtopic 1.1",
				"      Subtopic 1.2",
				"    Topic 2",
				"      Subtopic 2.1",
			);
		}

		return lines.join("\n");
	}

	/**
	 * Parse natural language description to extract mindmap structure.
	 * @param description - Natural language description
	 * @returns Parsed mindmap configuration
	 */
	private parseMindmapDescription(description: string): {
		root: string;
		children: string[];
	} {
		const sentences = description
			.split(/[.!?\n]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		const root = sentences[0] || "Main Topic";
		const children: string[] = [];

		for (let i = 1; i < Math.min(sentences.length, 6); i++) {
			const topic =
				sentences[i].length > 30
					? `${sentences[i].substring(0, 27)}...`
					: sentences[i];
			children.push(`    ${topic}`);
		}

		return { root, children };
	}
}
