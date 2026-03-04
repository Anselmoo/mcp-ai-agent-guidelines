import type {
	MarkdownSection,
	Objective,
	Requirement,
	SessionState,
} from "../types.js";

export function generateSpec(state: SessionState): MarkdownSection {
	const { input } = state;
	const lines: string[] = [];

	lines.push(`# ${input.title} - Specification`, "");
	lines.push("## Overview", "", input.overview, "");
	lines.push("## Objectives", "", formatObjectives(input.objectives), "");
	lines.push("## Requirements", "", "### Functional Requirements", "");
	lines.push(
		formatRequirements(
			input.requirements.filter((req) => req.type === "functional"),
		),
		"",
	);
	lines.push("### Non-Functional Requirements", "");
	lines.push(
		formatRequirements(
			input.requirements.filter((req) => req.type === "non-functional"),
		),
		"",
	);

	if (input.acceptanceCriteria.length > 0) {
		lines.push(
			"## Acceptance Criteria",
			"",
			formatChecklist(input.acceptanceCriteria),
			"",
		);
	}

	if (input.outOfScope.length > 0) {
		lines.push("## Out of Scope", "", formatBullets(input.outOfScope), "");
	}

	const content = lines.join("\n");
	return {
		title: "spec.md",
		content,
		generatedAt: new Date(),
		tokenEstimate: estimateTokens(content),
	};
}

function formatObjectives(objectives: Objective[]): string {
	const grouped: Record<"high" | "medium" | "low", Objective[]> = {
		high: [],
		medium: [],
		low: [],
	};

	for (const objective of objectives) {
		grouped[objective.priority ?? "medium"].push(objective);
	}

	const lines: string[] = [];
	for (const priority of ["high", "medium", "low"] as const) {
		const entries = grouped[priority];
		if (entries.length === 0) {
			continue;
		}
		lines.push(`### Priority: ${capitalize(priority)}`, "");
		for (const objective of entries) {
			lines.push(`- ${objective.description}`);
		}
		lines.push("");
	}
	return lines.join("\n");
}

function formatRequirements(requirements: Requirement[]): string {
	if (requirements.length === 0) {
		return "_No requirements specified._";
	}

	const lines = [
		"| ID | Description | Priority |",
		"|----|-------------|----------|",
	];

	requirements.forEach((requirement, index) => {
		const id = `REQ-${String(index + 1).padStart(3, "0")}`;
		lines.push(
			`| ${id} | ${requirement.description} | ${capitalize(requirement.priority ?? "medium")} |`,
		);
	});
	return lines.join("\n");
}

function formatChecklist(items: string[]): string {
	return items
		.map((item, index) => `- [ ] **AC-${index + 1}**: ${item}`)
		.join("\n");
}

function formatBullets(items: string[]): string {
	return items.map((item) => `- ❌ ${item}`).join("\n");
}

function capitalize(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function estimateTokens(content: string): number {
	return Math.ceil(content.length / 4);
}
