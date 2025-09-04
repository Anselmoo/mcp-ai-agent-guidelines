import { describe, expect, it } from "vitest";
import { domainNeutralPromptBuilder } from "../../src/tools/prompt/domain-neutral-prompt-builder";

describe("domain-neutral-prompt-builder", () => {
	it("includes frontmatter and metadata by default due to enforcement", async () => {
		const res = await domainNeutralPromptBuilder({
			title: "Project",
			summary: "Summary text",
			includeFrontmatter: false,
			includeMetadata: false,
			includeReferences: true,
			includeTechniqueHints: true,
			includePitfalls: true,
			tools: ["githubRepo", "codebase", "unknown"],
			model: "gpt-4.1",
		});
		const text = res.content[0].text;
		expect(text).toMatch(/^---/m); // frontmatter enforced
		expect(text).toMatch(/### Metadata/);
		expect(text).toMatch(/## References/);
		expect(text).toMatch(/# Technique Hints/);
		expect(text).toMatch(/# Pitfalls to Avoid/);
	});
});
