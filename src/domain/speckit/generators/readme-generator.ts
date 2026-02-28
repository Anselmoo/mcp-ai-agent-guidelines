import type { MarkdownSection, SessionState } from "../types.js";

export function generateReadme(state: SessionState): MarkdownSection {
	const { input } = state;
	const content = `# ${input.title}

${input.overview}

## Artifacts

- spec.md
- plan.md
- tasks.md
- progress.md
- adr.md
- roadmap.md
`;

	return {
		title: "README.md",
		content,
		generatedAt: new Date(),
		tokenEstimate: Math.ceil(content.length / 4),
	};
}
