import type { MarkdownSection, SessionState } from "../types.js";

export function generateProgress(state: SessionState): MarkdownSection {
	const { input } = state;
	const total = input.requirements.length;
	const content = `# ${input.title} - Progress

## Overview

- Total tasks: ${total}
- Completed: 0
- In progress: 0
- Blocked: 0

## Checklist

${input.requirements.map((req) => `- [ ] ${req.description}`).join("\n")}
`;

	return {
		title: "progress.md",
		content,
		generatedAt: new Date(),
		tokenEstimate: Math.ceil(content.length / 4),
	};
}
