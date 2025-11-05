import { describe, expect, it } from "vitest";
import { applyExportFormat } from "../../src/tools/shared/prompt-utils.js";

describe("applyExportFormat - Header and Frontmatter Suppression", () => {
	const sampleContent = `---
mode: 'agent'
model: GPT-5
tools: ['codebase', 'editFiles']
description: 'Test prompt'
---
# Main Title

This is some content.

## Section Header

More content here.

### Subsection

Final content.`;

	it("should keep frontmatter and headers by default", () => {
		const result = applyExportFormat(sampleContent);
		expect(result).toContain("---");
		expect(result).toContain("mode: 'agent'");
		expect(result).toContain("model: GPT-5");
		expect(result).toContain("# Main Title");
		expect(result).toContain("## Section Header");
		expect(result).toContain("### Subsection");
	});

	it("should keep frontmatter and headers when includeHeaders is true", () => {
		const result = applyExportFormat(sampleContent, {
			includeHeaders: true,
		});
		expect(result).toContain("---");
		expect(result).toContain("mode: 'agent'");
		expect(result).toContain("# Main Title");
		expect(result).toContain("## Section Header");
	});

	it("should remove frontmatter when includeHeaders is false", () => {
		const result = applyExportFormat(sampleContent, {
			includeHeaders: false,
		});
		expect(result).not.toContain("---");
		expect(result).not.toContain("mode: 'agent'");
		expect(result).not.toContain("model: GPT-5");
		expect(result).not.toContain("tools:");
	});

	it("should remove markdown headers when includeHeaders is false", () => {
		const result = applyExportFormat(sampleContent, {
			includeHeaders: false,
		});
		expect(result).not.toContain("# Main Title");
		expect(result).not.toContain("## Section Header");
		expect(result).not.toContain("### Subsection");
	});

	it("should keep regular content when includeHeaders is false", () => {
		const result = applyExportFormat(sampleContent, {
			includeHeaders: false,
		});
		expect(result).toContain("This is some content.");
		expect(result).toContain("More content here.");
		expect(result).toContain("Final content.");
	});

	it("should work with content that has no frontmatter", () => {
		const noFrontmatter = `# Title

Content here.

## Section

More content.`;

		const result = applyExportFormat(noFrontmatter, {
			includeHeaders: false,
		});
		expect(result).not.toContain("# Title");
		expect(result).not.toContain("## Section");
		expect(result).toContain("Content here.");
		expect(result).toContain("More content.");
	});

	it("should handle frontmatter with comments", () => {
		const withComments = `---
# Note: Dropped unknown tools: mermaid
mode: 'agent'
model: GPT-5
tools: ['codebase', 'editFiles']
description: 'Architecture design for medium-scale system'
---
# Title

Content`;

		const result = applyExportFormat(withComments, {
			includeHeaders: false,
		});
		expect(result).not.toContain("---");
		expect(result).not.toContain("Note: Dropped");
		expect(result).not.toContain("mode:");
		expect(result).not.toContain("# Title");
		expect(result).toContain("Content");
	});

	it("should handle multiline frontmatter values", () => {
		const multiline = `---
mode: 'agent'
model: GPT-5
description: |
  This is a multiline
  description that spans
  multiple lines
---
# Content

Regular text.`;

		const result = applyExportFormat(multiline, {
			includeHeaders: false,
		});
		expect(result).not.toContain("---");
		expect(result).not.toContain("mode:");
		expect(result).not.toContain("multiline");
		expect(result).toContain("Regular text.");
	});

	it("should work correctly for chat output use case", () => {
		// Simulating the issue mentioned: chat output should not show frontmatter
		const chatContent = `---
# Note: Dropped unknown tools: mermaid
mode: 'agent'
model: GPT-5
tools: ['codebase', 'editFiles']
description: 'Architecture design for medium-scale system'
---
## System Architecture Design

### Context
Designing a medium-scale system architecture.

### Requirements
1. High availability
2. Scalability

The answer is here.`;

		const result = applyExportFormat(chatContent, {
			exportFormat: "markdown",
			includeHeaders: false,
		});

		// Should not contain frontmatter
		expect(result).not.toContain("---");
		expect(result).not.toContain("mode:");
		expect(result).not.toContain("model:");

		// Should not contain headers
		expect(result).not.toContain("##");
		expect(result).not.toContain("###");

		// Should contain the actual content
		expect(result).toContain("Designing a medium-scale system architecture.");
		expect(result).toContain("High availability");
		expect(result).toContain("The answer is here.");
	});
});
