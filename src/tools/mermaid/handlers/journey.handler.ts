import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Handler for user journey diagrams.
 * Generates user experience journey maps.
 */
export class JourneyHandler extends BaseDiagramHandler {
	readonly diagramType = "journey";

	generate(description: string, theme?: string): string {
		this.validateInput(description);

		const lines: string[] = ["journey"];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		const { title, steps } = this.parseJourneyDescription(description);
		lines.push(`title ${title}`);

		if (steps.length > 0) {
			for (const step of steps) {
				lines.push(step);
			}
		} else {
			// Fallback template
			lines.push(
				"section Discover",
				"Find product: 5: User",
				"Read reviews: 3: User",
				"section Purchase",
				"Add to cart: 4: User",
				"Checkout: 2: User, System",
			);
		}

		return lines.join("\n");
	}

	/**
	 * Parse natural language description to extract journey information.
	 */
	private parseJourneyDescription(description: string): {
		title: string;
		steps: string[];
	} {
		const title = description.split(/[.!?\n]/)[0] || "User Journey";
		const steps: string[] = [];

		const sentences = description
			.split(/[.!?\n]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0)
			.slice(1);

		let section = "Journey";

		for (const sentence of sentences) {
			if (
				sentence.toLowerCase().includes("section") ||
				sentence.toLowerCase().includes("phase")
			) {
				section = sentence.replace(/section|phase/gi, "").trim();
				steps.push(`section ${section}`);
			} else {
				const score = 3 + Math.floor(Math.random() * 3); // Random score 3-5
				const step =
					sentence.length > 30 ? `${sentence.substring(0, 27)}...` : sentence;
				steps.push(`${step}: ${score}: User`);
			}
		}

		return { title, steps };
	}
}
