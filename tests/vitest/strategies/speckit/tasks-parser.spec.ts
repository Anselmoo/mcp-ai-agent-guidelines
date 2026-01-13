/**
 * Unit tests for tasks-parser
 */

import { describe, expect, it } from "vitest";
import { parseTasksFromMarkdown } from "../../../../src/strategies/speckit/tasks-parser.js";

describe("parseTasksFromMarkdown", () => {
	describe("basic task parsing", () => {
		it("should parse task with all metadata", () => {
			const markdown = `# Tasks

## Phase 1

### TASK-001: Setup database
- **Priority**: high
- **Estimate**: 2 days
- **Description**: Initialize PostgreSQL database
- **Phase**: Phase 1
- **Dependencies**: TASK-000
- **Acceptance Criteria**:
  - Database is running
  - Schema is created
`;

			const result = parseTasksFromMarkdown(markdown);

			expect(result.items).toHaveLength(1);
			const task = result.items[0];
			expect(task.id).toBe("TASK-001");
			expect(task.title).toBe("Setup database");
			expect(task.description).toBe("Initialize PostgreSQL database");
			expect(task.priority).toBe("high");
			expect(task.estimate).toBe("2 days");
			expect(task.phase).toBe("Phase 1");
			expect(task.dependencies).toEqual(["TASK-000"]);
			expect(task.acceptanceCriteria).toEqual([
				"Database is running",
				"Schema is created",
			]);
		});

		it("should parse multiple tasks", () => {
			const markdown = `# Tasks

### P4-001: First task
- **Priority**: high

### P4-002: Second task
- **Priority**: medium

### TASK-003: Third task
- **Priority**: low
`;

			const result = parseTasksFromMarkdown(markdown);

			expect(result.items).toHaveLength(3);
			expect(result.items[0].id).toBe("P4-001");
			expect(result.items[1].id).toBe("P4-002");
			expect(result.items[2].id).toBe("TASK-003");
		});

		it("should handle tasks with no metadata", () => {
			const markdown = `# Tasks

### TASK-001: Minimal task
`;

			const result = parseTasksFromMarkdown(markdown);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].id).toBe("TASK-001");
			expect(result.items[0].title).toBe("Minimal task");
			expect(result.items[0].description).toBe("");
			expect(result.items[0].priority).toBe("medium"); // default
			expect(result.items[0].estimate).toBe("");
		});
	});

	describe("extractDescription", () => {
		it("should extract description with bullet point", () => {
			const markdown = `### TASK-001: Test
- **Description**: This is a description
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].description).toBe("This is a description");
		});

		it("should extract description without bullet point", () => {
			const markdown = `### TASK-001: Test
**Description**: This is a description without bullet
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].description).toBe(
				"This is a description without bullet",
			);
		});

		it("should use fallback for description (first paragraph)", () => {
			const markdown = `### TASK-001: Test

This is the first paragraph and should be used as description.

More content here.
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].description).toBe(
				"This is the first paragraph and should be used as description.",
			);
		});

		it("should skip bullets when finding fallback description", () => {
			const markdown = `### TASK-001: Test
- Some bullet
- Another bullet
This should be the description
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].description).toBe(
				"This should be the description",
			);
		});

		it("should return empty string if no description found", () => {
			const markdown = `### TASK-001: Test
- **Priority**: high
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].description).toBe("");
		});
	});

	describe("extractPriority", () => {
		it("should extract high priority", () => {
			const markdown = `### TASK-001: Test
- **Priority**: high
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].priority).toBe("high");
		});

		it("should extract medium priority", () => {
			const markdown = `### TASK-001: Test
- **Priority**: medium
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].priority).toBe("medium");
		});

		it("should extract low priority", () => {
			const markdown = `### TASK-001: Test
- **Priority**: low
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].priority).toBe("low");
		});

		it("should default to medium for invalid priority", () => {
			const markdown = `### TASK-001: Test
- **Priority**: urgent
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].priority).toBe("medium");
		});

		it("should default to medium if no priority specified", () => {
			const markdown = `### TASK-001: Test
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].priority).toBe("medium");
		});
	});

	describe("extractEstimate", () => {
		it("should extract estimate", () => {
			const markdown = `### TASK-001: Test
- **Estimate**: 3 days
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].estimate).toBe("3 days");
		});

		it("should return empty string if no estimate", () => {
			const markdown = `### TASK-001: Test
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].estimate).toBe("");
		});
	});

	describe("extractPhase", () => {
		it("should extract phase", () => {
			const markdown = `### TASK-001: Test
- **Phase**: Phase 2: Implementation
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].phase).toBe("Phase 2: Implementation");
		});

		it("should return undefined if no phase", () => {
			const markdown = `### TASK-001: Test
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].phase).toBeUndefined();
		});
	});

	describe("extractAcceptanceCriteria", () => {
		it("should extract multiple acceptance criteria", () => {
			const markdown = `### TASK-001: Test
- **Acceptance Criteria**:
  - First criterion
  - Second criterion
  - Third criterion
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].acceptanceCriteria).toEqual([
				"First criterion",
				"Second criterion",
				"Third criterion",
			]);
		});

		it("should handle acceptance criteria with asterisks", () => {
			const markdown = `### TASK-001: Test
- **Acceptance Criteria**:
  * First criterion
  * Second criterion
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].acceptanceCriteria).toEqual([
				"First criterion",
				"Second criterion",
			]);
		});

		it("should return empty array if no acceptance criteria", () => {
			const markdown = `### TASK-001: Test
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].acceptanceCriteria).toEqual([]);
		});

		it("should handle acceptance criteria with extra indentation", () => {
			const markdown = `### TASK-001: Test
- **Acceptance Criteria**:
    - Indented criterion
      - More indented
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].acceptanceCriteria).toHaveLength(2);
		});
	});

	describe("extractDependencies", () => {
		it("should extract single dependency", () => {
			const markdown = `### TASK-001: Test
- **Dependencies**: TASK-000
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].dependencies).toEqual(["TASK-000"]);
		});

		it("should extract multiple dependencies", () => {
			const markdown = `### TASK-001: Test
- **Dependencies**: TASK-000, P4-001, TASK-999
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].dependencies).toEqual([
				"TASK-000",
				"P4-001",
				"TASK-999",
			]);
		});

		it("should extract dependencies from free text", () => {
			const markdown = `### TASK-001: Test
- **Dependencies**: Depends on TASK-000 and P4-001
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].dependencies).toEqual(["TASK-000", "P4-001"]);
		});

		it("should return undefined if no dependencies", () => {
			const markdown = `### TASK-001: Test
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items[0].dependencies).toBeUndefined();
		});
	});

	describe("edge cases", () => {
		it("should handle empty markdown", () => {
			const result = parseTasksFromMarkdown("");
			expect(result.items).toEqual([]);
		});

		it("should handle markdown with no tasks", () => {
			const markdown = `# Tasks

This is just some text with no task headings.
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items).toEqual([]);
		});

		it("should handle tasks at end of file", () => {
			const markdown = `### TASK-001: Last task
- **Priority**: high`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items).toHaveLength(1);
			expect(result.items[0].priority).toBe("high");
		});

		it("should include metadata timestamps", () => {
			const result = parseTasksFromMarkdown("### TASK-001: Test");
			expect(result.metadata).toBeDefined();
			expect(result.metadata.createdAt).toBeDefined();
			expect(result.metadata.lastUpdated).toBeDefined();
		});

		it("should handle section boundary with ## heading", () => {
			const markdown = `### TASK-001: First task
- **Priority**: high

## New Section

### TASK-002: Second task
- **Priority**: low
`;

			const result = parseTasksFromMarkdown(markdown);
			expect(result.items).toHaveLength(2);
			expect(result.items[0].priority).toBe("high");
			expect(result.items[1].priority).toBe("low");
		});
	});
});
