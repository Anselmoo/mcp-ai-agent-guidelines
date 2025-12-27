import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Handler for timeline diagrams.
 * Generates chronological event timelines.
 */
export class TimelineHandler extends BaseDiagramHandler {
	readonly diagramType = "timeline";

	generate(description: string, theme?: string): string {
		this.validateInput(description);

		const lines: string[] = ["timeline"];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		const { title, events } = this.parseTimelineDescription(description);
		lines.push(`title ${title}`);

		if (events.length > 0) {
			for (const event of events) {
				lines.push(event);
			}
		} else {
			// Fallback template
			lines.push(
				"section 2024",
				"Q1 : Planning : Research",
				"Q2 : Development : Testing",
				"section 2025",
				"Q1 : Launch : Marketing",
			);
		}

		return lines.join("\n");
	}

	/**
	 * Parse natural language description to extract timeline events.
	 * @param description - Natural language description
	 * @returns Parsed timeline configuration
	 */
	private parseTimelineDescription(description: string): {
		title: string;
		events: string[];
	} {
		const title = description.split(/[.!?\n]/)[0] || "Timeline";
		const events: string[] = [];

		const sentences = description
			.split(/[.!?\n]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0)
			.slice(1);

		let currentYear = new Date().getFullYear();
		let section = `section ${currentYear}`;
		events.push(section);

		for (let i = 0; i < sentences.length; i++) {
			if (i % 3 === 0 && i > 0) {
				currentYear++;
				section = `section ${currentYear}`;
				events.push(section);
			}
			const event =
				sentences[i].length > 40
					? `${sentences[i].substring(0, 37)}...`
					: sentences[i];
			events.push(event);
		}

		return { title, events };
	}
}
