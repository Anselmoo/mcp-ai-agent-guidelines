import type { MarkdownSection, SessionState } from "../types.js";

export function generateAdr(state: SessionState): MarkdownSection {
	const { input } = state;
	const content = `# ADR: ${input.title}

## Status
Proposed

## Context
${input.overview}

## Decision
Adopt the SpecKit implementation plan to satisfy stated objectives.

## Consequences
- Positive: Clear implementation path
- Negative: Added documentation overhead
`;

	return {
		title: "adr.md",
		content,
		generatedAt: new Date(),
		tokenEstimate: Math.ceil(content.length / 4),
	};
}
