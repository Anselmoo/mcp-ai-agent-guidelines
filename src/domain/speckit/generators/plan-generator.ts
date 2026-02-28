import type { MarkdownSection, SessionState } from "../types.js";

export function generatePlan(state: SessionState): MarkdownSection {
	const { input } = state;

	const lines = [
		`# ${input.title} - Implementation Plan`,
		"",
		"## Executive Summary",
		"",
		input.overview,
		"",
		"## Phases",
		"",
		formatPhases(input.objectives),
		"",
		"## Timeline",
		"",
		formatTimeline(input.objectives),
		"",
		"## Risks & Mitigations",
		"",
		formatRisks(input.requirements),
		"",
	];

	const content = lines.join("\n");
	return {
		title: "plan.md",
		content,
		generatedAt: new Date(),
		tokenEstimate: Math.ceil(content.length / 4),
	};
}

function formatPhases(
	objectives: Array<{ description: string; priority?: string }>,
): string {
	const high = objectives.filter((objective) => objective.priority === "high");
	const medium = objectives.filter(
		(objective) =>
			objective.priority !== "high" && objective.priority !== "low",
	);
	const low = objectives.filter((objective) => objective.priority === "low");

	const lines: string[] = [];
	if (high.length > 0) {
		lines.push("### Phase 1: Foundation", "");
		high.forEach((objective, index) => {
			lines.push(`${index + 1}. ${objective.description}`);
		});
		lines.push("");
	}
	if (medium.length > 0) {
		lines.push("### Phase 2: Core Implementation", "");
		medium.forEach((objective, index) => {
			lines.push(`${index + 1}. ${objective.description}`);
		});
		lines.push("");
	}
	if (low.length > 0) {
		lines.push("### Phase 3: Enhancement", "");
		low.forEach((objective, index) => {
			lines.push(`${index + 1}. ${objective.description}`);
		});
		lines.push("");
	}
	return lines.join("\n");
}

function formatTimeline(
	objectives: Array<{ description: string; priority?: string }>,
): string {
	const lines = [
		"```mermaid",
		"gantt",
		"    title Implementation Timeline",
		"    dateFormat YYYY-MM-DD",
		"    section Phase 1",
		"    Foundation tasks :p1, 2026-01-01, 1w",
		"    section Phase 2",
		`    Core tasks (${objectives.length}) :p2, after p1, 1w`,
		"```",
	];
	return lines.join("\n");
}

function formatRisks(
	requirements: Array<{ type?: string; description: string }>,
): string {
	const hasManyNfr =
		requirements.filter((requirement) => requirement.type === "non-functional")
			.length > 3;

	const lines = [
		"| Risk | Probability | Impact | Mitigation |",
		"|------|-------------|--------|------------|",
		"| Scope creep | Medium | High | Prioritize backlog and milestones |",
		"| Integration complexity | Medium | Medium | Stage integration and validation |",
	];
	if (hasManyNfr) {
		lines.push(
			"| Non-functional overload | Medium | High | Add targeted performance and quality gates |",
		);
	}
	return lines.join("\n");
}
