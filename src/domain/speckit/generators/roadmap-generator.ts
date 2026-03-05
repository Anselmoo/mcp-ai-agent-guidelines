import type { MarkdownSection, SessionState } from "../types.js";

export function generateRoadmap(state: SessionState): MarkdownSection {
	const { input } = state;
	const content = `# ${input.title} - Roadmap

## Milestones

${input.objectives
	.map((objective, index) => `- M${index + 1}: ${objective.description}`)
	.join("\n")}
`;

	return {
		title: "roadmap.md",
		content,
		generatedAt: new Date(),
		tokenEstimate: Math.ceil(content.length / 4),
	};
}
