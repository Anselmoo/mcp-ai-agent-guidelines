import type { MarkdownSection, SessionState } from "../types.js";

export function generateTasks(state: SessionState): MarkdownSection {
	const { input } = state;
	const lines: string[] = [`# ${input.title} - Tasks`, ""];

	input.requirements.forEach((requirement, index) => {
		lines.push(`- [ ] T-${index + 1}: ${requirement.description}`);
	});

	const content = lines.join("\n");
	return {
		title: "tasks.md",
		content,
		generatedAt: new Date(),
		tokenEstimate: Math.ceil(content.length / 4),
	};
}
