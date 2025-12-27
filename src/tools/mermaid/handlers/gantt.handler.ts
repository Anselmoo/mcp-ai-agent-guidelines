import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Handler for Gantt chart diagrams.
 * Generates project timeline and task scheduling visualizations.
 */
export class GanttHandler extends BaseDiagramHandler {
	readonly diagramType = "gantt";

	generate(
		description: string,
		theme?: string,
		_advancedFeatures?: Record<string, unknown>,
	): string {
		this.validateInput(description);

		const lines: string[] = ["gantt"];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		// Parse description to extract tasks and timeline
		const { title, tasks } = this.parseGanttDescription(description);

		lines.push(`title ${title || "Project Timeline"}`);
		lines.push("dateFormat  YYYY-MM-DD");

		if (tasks.length > 0) {
			// Use parsed tasks
			const sections = new Map<string, string[]>();

			for (const task of tasks) {
				if (!sections.has(task.section)) {
					sections.set(task.section, []);
				}
				sections.get(task.section)?.push(task.line);
			}

			for (const [section, taskLines] of sections) {
				lines.push(`section ${section}`);
				for (const taskLine of taskLines) {
					lines.push(taskLine);
				}
			}
		} else {
			// Fallback to default template with dynamic dates
			const today = new Date();
			const formatDate = (date: Date) => date.toISOString().split("T")[0];

			const startDate = formatDate(today);
			const researchEnd = formatDate(
				new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
			);
			const designStart = formatDate(
				new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
			);
			const designEnd = formatDate(
				new Date(today.getTime() + 11 * 24 * 60 * 60 * 1000),
			);
			const implementationStart = formatDate(
				new Date(new Date(designEnd).getTime() + 1 * 24 * 60 * 60 * 1000),
			);
			const implementationEnd = formatDate(
				new Date(new Date(designEnd).getTime() + 11 * 24 * 60 * 60 * 1000),
			);
			const testingStart = formatDate(
				new Date(
					new Date(implementationEnd).getTime() + 1 * 24 * 60 * 60 * 1000,
				),
			);
			const testingEnd = formatDate(
				new Date(
					new Date(implementationEnd).getTime() + 6 * 24 * 60 * 60 * 1000,
				),
			);

			lines.push(
				"section Planning",
				`Research :done, research, ${startDate}, ${researchEnd}`,
				`Design :active, design, ${designStart}, ${designEnd}`,
				"section Development",
				`Implementation :impl, ${implementationStart}, ${implementationEnd}`,
				`Testing :test, ${testingStart}, ${testingEnd}`,
			);
		}

		return lines.join("\n");
	}

	/**
	 * Parse natural language description to extract Gantt chart tasks.
	 */
	private parseGanttDescription(description: string): {
		title: string;
		tasks: Array<{ section: string; line: string }>;
	} {
		let title = "Project Timeline";
		const tasks: Array<{ section: string; line: string }> = [];

		// Extract title if mentioned
		if (description.toLowerCase().includes("project:")) {
			const match = description.match(/project:\s*([^.\n]+)/i);
			if (match) title = match[1].trim();
		}

		// Extract tasks (look for action verbs and time references)
		const sentences = description
			.split(/[.!?\n]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		const today = new Date();
		const formatDate = (date: Date) => date.toISOString().split("T")[0];

		let currentDate = today;
		let section = "Tasks";

		for (let i = 0; i < sentences.length; i++) {
			const sentence = sentences[i];
			const lower = sentence.toLowerCase();

			// Check for section keywords
			if (lower.includes("phase") || lower.includes("stage")) {
				section = sentence.split(/[:]/)[0].trim();
				continue;
			}

			// Extract task
			const taskName =
				sentence.length > 50 ? `${sentence.substring(0, 47)}...` : sentence;
			const startDate = formatDate(currentDate);
			const duration = 3 + Math.floor(Math.random() * 5); // 3-7 days
			const endDate = formatDate(
				new Date(currentDate.getTime() + duration * 24 * 60 * 60 * 1000),
			);

			const status = i === 0 ? "done" : i === 1 ? "active" : "";
			const statusPart = status ? `${status}, ` : "";

			tasks.push({
				section,
				line: `${taskName} :${statusPart}task${i}, ${startDate}, ${endDate}`,
			});

			// Move current date forward
			currentDate = new Date(
				currentDate.getTime() + (duration + 1) * 24 * 60 * 60 * 1000,
			);
		}

		return { title, tasks };
	}
}
