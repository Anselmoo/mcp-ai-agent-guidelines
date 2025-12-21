import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Handler for pie chart diagrams.
 * Generates pie charts showing distributions and percentages.
 */
export class PieHandler extends BaseDiagramHandler {
	readonly diagramType = "pie";

	generate(description: string, theme?: string): string {
		this.validateInput(description);

		const lines: string[] = [];
		if (theme) lines.push(`%%{init: {'theme':'${theme}'}}%%`);

		// Parse description to extract categories and values
		const { title, data } = this.parsePieDescription(description);

		lines.push(`pie title ${title || "Sample Distribution"}`);

		if (data.length > 0) {
			for (const item of data) {
				lines.push(`"${item.label}" : ${item.value}`);
			}
		} else {
			// Fallback to default template
			lines.push(
				'"Category A" : 45',
				'"Category B" : 30',
				'"Category C" : 15',
				'"Category D" : 10',
			);
		}

		return lines.join("\n");
	}

	/**
	 * Parse natural language description to extract pie chart data.
	 * @param description - Natural language description
	 * @returns Parsed pie chart configuration
	 */
	private parsePieDescription(description: string): {
		title: string;
		data: Array<{ label: string; value: number }>;
	} {
		let title = "Distribution";
		const data: Array<{ label: string; value: number }> = [];

		// Extract title if mentioned
		const titleMatch = description.match(
			/(?:chart|distribution|breakdown)(?:\s+of|\s+for)?\s*:\s*([^.\n]+)/i,
		);
		if (titleMatch) title = titleMatch[1].trim();

		// Extract percentages or numbers
		const percentMatches = description.matchAll(
			/(\\w+[\\w\\s]*?)[\\s:]+(\\d+)%/gi,
		);
		for (const match of percentMatches) {
			data.push({
				label: match[1].trim(),
				value: Number.parseInt(match[2], 10),
			});
		}

		// Extract explicit counts
		if (data.length === 0) {
			const countMatches = description.matchAll(/(\\d+)\\s+(\\w+[\\w\\s]*)/gi);
			const items: Array<{ label: string; value: number }> = [];
			for (const match of countMatches) {
				items.push({
					label: match[2].trim(),
					value: Number.parseInt(match[1], 10),
				});
			}

			// Convert to percentages
			if (items.length > 0) {
				const total = items.reduce((sum, item) => sum + item.value, 0);
				for (const item of items) {
					data.push({
						label: item.label,
						value: Math.round((item.value / total) * 100),
					});
				}
			}
		}

		return { title, data };
	}
}
