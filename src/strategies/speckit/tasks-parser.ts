/**
 * Tasks parser - extracts task data from tasks.md markdown
 *
 * @module strategies/speckit/tasks-parser
 */

import type { DerivedTask, Tasks } from "./types.js";

/**
 * Parse tasks.md markdown content into structured Tasks
 *
 * Extracts task items from markdown format with task ID patterns like
 * TASK-001, P4-019, etc.
 *
 * @param markdown - The tasks.md markdown content to parse
 * @returns Structured Tasks object with items array
 *
 * @example
 * ```typescript
 * const markdown = `
 * # Tasks
 *
 * ## Phase 1
 *
 * ### TASK-001: Setup database
 * - **Priority**: high
 * - **Estimate**: 2 days
 * - **Description**: Initialize PostgreSQL database
 * - **Acceptance Criteria**:
 *   - Database is running
 *   - Schema is created
 * `;
 *
 * const tasks = parseTasksFromMarkdown(markdown);
 * // Returns: { items: [{ id: "TASK-001", title: "Setup database", ... }] }
 * ```
 */
export function parseTasksFromMarkdown(markdown: string): Tasks {
	const items: DerivedTask[] = [];

	// Pattern to match task headings like "### TASK-001: Title" or "### P4-019: Title"
	const taskHeadingPattern = /^###\s+([A-Z0-9]+-\d+):\s*(.+)$/gm;

	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: Required for regex iteration
	while ((match = taskHeadingPattern.exec(markdown)) !== null) {
		const taskId = match[1];
		const title = match[2].trim();

		// Extract task details from the section following this heading
		const sectionStart = match.index + match[0].length;
		const nextHeadingMatch = markdown.slice(sectionStart).match(/^###?\s+/m);
		const sectionEnd = nextHeadingMatch
			? sectionStart + (nextHeadingMatch.index ?? 0)
			: markdown.length;
		const taskSection = markdown.slice(sectionStart, sectionEnd);

		// Extract task properties from bullet points
		const task: DerivedTask = {
			id: taskId,
			title,
			description: extractDescription(taskSection),
			priority: extractPriority(taskSection),
			estimate: extractEstimate(taskSection),
			phase: extractPhase(taskSection),
			acceptanceCriteria: extractAcceptanceCriteria(taskSection),
			dependencies: extractDependencies(taskSection),
		};

		items.push(task);
	}

	return {
		items,
		metadata: {
			createdAt: new Date().toISOString(),
			lastUpdated: new Date().toISOString(),
		},
	};
}

/**
 * Extract description from task section
 */
function extractDescription(section: string): string {
	// Look for "- **Description**: ..." or "**Description**: ..."
	const descMatch = section.match(/^\s*[-*]?\s*\*\*Description\*\*:\s*(.+)$/im);
	if (descMatch) {
		return descMatch[1].trim();
	}

	// Fallback: use first paragraph after heading
	const lines = section.trim().split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed && !trimmed.startsWith("-") && !trimmed.startsWith("*")) {
			return trimmed;
		}
	}

	return "";
}

/**
 * Extract priority from task section
 */
function extractPriority(section: string): "high" | "medium" | "low" {
	const priorityMatch = section.match(
		/^\s*[-*]?\s*\*\*Priority\*\*:\s*(\w+)/im,
	);
	if (priorityMatch) {
		const priority = priorityMatch[1].toLowerCase();
		if (priority === "high" || priority === "medium" || priority === "low") {
			return priority;
		}
	}
	return "medium"; // default
}

/**
 * Extract estimate from task section
 */
function extractEstimate(section: string): string {
	const estimateMatch = section.match(
		/^\s*[-*]?\s*\*\*Estimate\*\*:\s*(.+)$/im,
	);
	return estimateMatch ? estimateMatch[1].trim() : "";
}

/**
 * Extract phase from task section
 */
function extractPhase(section: string): string | undefined {
	const phaseMatch = section.match(/^\s*[-*]?\s*\*\*Phase\*\*:\s*(.+)$/im);
	return phaseMatch ? phaseMatch[1].trim() : undefined;
}

/**
 * Extract acceptance criteria from task section
 */
function extractAcceptanceCriteria(section: string): string[] {
	const criteria: string[] = [];

	// Look for "- **Acceptance Criteria**:" followed by nested bullets
	const criteriaMatch = section.match(
		/^\s*[-*]?\s*\*\*Acceptance Criteria\*\*:\s*$/im,
	);

	if (criteriaMatch) {
		const startIdx =
			(criteriaMatch.index !== undefined ? criteriaMatch.index : 0) +
			criteriaMatch[0].length;
		const remainingText = section.slice(startIdx);

		// Extract nested bullet points (indented with 2+ spaces)
		const nestedBulletPattern = /^\s{2,}[-*]\s+(.+)$/gm;
		let bulletMatch: RegExpExecArray | null;

		// biome-ignore lint/suspicious/noAssignInExpressions: Required for regex iteration
		while ((bulletMatch = nestedBulletPattern.exec(remainingText)) !== null) {
			criteria.push(bulletMatch[1].trim());
		}
	}

	return criteria;
}

/**
 * Extract dependencies from task section
 */
function extractDependencies(section: string): string[] | undefined {
	const dependencies: string[] = [];

	// Look for "- **Dependencies**: TASK-001, TASK-002" or similar
	const depsMatch = section.match(
		/^\s*[-*]?\s*\*\*Dependencies\*\*:\s*(.+)$/im,
	);

	if (depsMatch) {
		const depsText = depsMatch[1];
		// Extract task IDs from the text
		const taskIdPattern = /\b([A-Z0-9]+-\d+)\b/g;
		let idMatch: RegExpExecArray | null;

		// biome-ignore lint/suspicious/noAssignInExpressions: Required for regex iteration
		while ((idMatch = taskIdPattern.exec(depsText)) !== null) {
			dependencies.push(idMatch[1]);
		}
	}

	return dependencies.length > 0 ? dependencies : undefined;
}
