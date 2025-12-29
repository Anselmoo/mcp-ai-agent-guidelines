import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Handler for quadrant chart diagrams.
 * Generates priority/urgency matrix visualizations.
 */
export class QuadrantHandler extends BaseDiagramHandler {
	readonly diagramType = "quadrant";

	generate(description: string, theme?: string): string {
		this.validateInput(description);

		const lines: string[] = ["quadrantChart"];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		const { title, xAxis, yAxis, quadrants, points } =
			this.parseQuadrantDescription(description);

		lines.push(`title ${title}`);
		lines.push(`x-axis ${xAxis[0]} --> ${xAxis[1]}`);
		lines.push(`y-axis ${yAxis[0]} --> ${yAxis[1]}`);

		if (quadrants.length === 4) {
			lines.push(`quadrant-1 ${quadrants[0]}`);
			lines.push(`quadrant-2 ${quadrants[1]}`);
			lines.push(`quadrant-3 ${quadrants[2]}`);
			lines.push(`quadrant-4 ${quadrants[3]}`);
		}

		if (points.length > 0) {
			for (const point of points) {
				lines.push(point);
			}
		} else {
			// Fallback template
			lines.push("Item A: [0.3, 0.6]");
			lines.push("Item B: [0.7, 0.8]");
			lines.push("Item C: [0.2, 0.3]");
		}

		return lines.join("\n");
	}

	/**
	 * Parse natural language description to extract quadrant data.
	 */
	private parseQuadrantDescription(description: string): {
		title: string;
		xAxis: [string, string];
		yAxis: [string, string];
		quadrants: string[];
		points: string[];
	} {
		const title = "Priority Matrix";
		const xAxis: [string, string] = ["Low", "High"];
		const yAxis: [string, string] = ["Low", "High"];
		const quadrants: string[] = ["Plan", "Do", "Delegate", "Delete"];
		const points: string[] = [];

		// Extract items to plot
		const sentences = description
			.split(/[.!?\n]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		for (let i = 0; i < Math.min(sentences.length, 8); i++) {
			const item =
				sentences[i].length > 20
					? `${sentences[i].substring(0, 17)}...`
					: sentences[i];
			const x = (0.2 + Math.random() * 0.6).toFixed(1);
			const y = (0.2 + Math.random() * 0.6).toFixed(1);
			points.push(`${item}: [${x}, ${y}]`);
		}

		return { title, xAxis, yAxis, quadrants, points };
	}
}
