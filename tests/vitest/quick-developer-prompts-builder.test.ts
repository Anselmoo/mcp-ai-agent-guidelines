import { describe, expect, it } from "vitest";
import { quickDeveloperPromptsBuilder } from "../../src/tools/prompt/quick-developer-prompts-builder";

describe("quickDeveloperPromptsBuilder", () => {
	it("generates all 25 prompts by default", async () => {
		const res = await quickDeveloperPromptsBuilder({
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Check that all 5 categories are present
		expect(text).toMatch(/Strategy & High-Level Planning/);
		expect(text).toMatch(/Code Quality & Refactoring/);
		expect(text).toMatch(/Testing & Validation/);
		expect(text).toMatch(/Documentation & Onboarding/);
		expect(text).toMatch(/DevOps & Automation/);

		// Check for checklist format
		expect(text).toMatch(/- \[ \]/);

		// Check for key prompt elements
		expect(text).toMatch(/5 biggest \*\*gaps\*\*/);
		expect(text).toMatch(/\*\*opportunities\*\*/);
		expect(text).toMatch(/\*\*code quality improvements\*\*/);
		expect(text).toMatch(/\*\*end-to-end testing\*\*/);
		expect(text).toMatch(/\*\*deployment blockers\*\*/);
	});

	it("generates only strategy category when specified", async () => {
		const res = await quickDeveloperPromptsBuilder({
			category: "strategy",
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Should have Strategy category
		expect(text).toMatch(/Strategy & High-Level Planning/);
		expect(text).toMatch(/5 biggest \*\*gaps\*\*/);
		expect(text).toMatch(/\*\*opportunities\*\*/);

		// Should NOT have other categories
		expect(text).not.toMatch(/Code Quality & Refactoring/);
		expect(text).not.toMatch(/Testing & Validation/);
		expect(text).not.toMatch(/Documentation & Onboarding/);
		expect(text).not.toMatch(/DevOps & Automation/);
	});

	it("generates only code-quality category when specified", async () => {
		const res = await quickDeveloperPromptsBuilder({
			category: "code-quality",
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Should have Code Quality category
		expect(text).toMatch(/Code Quality & Refactoring/);
		expect(text).toMatch(/\*\*code quality improvements\*\*/);
		expect(text).toMatch(/\*\*technical debt hotspots\*\*/);

		// Should NOT have other categories
		expect(text).not.toMatch(/Strategy & High-Level Planning/);
		expect(text).not.toMatch(/Testing & Validation/);
	});

	it("generates only testing category when specified", async () => {
		const res = await quickDeveloperPromptsBuilder({
			category: "testing",
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Should have Testing category
		expect(text).toMatch(/Testing & Validation/);
		expect(text).toMatch(/\*\*end-to-end testing\*\*/);
		expect(text).toMatch(/edge cases/);

		// Should NOT have other categories
		expect(text).not.toMatch(/Strategy & High-Level Planning/);
		expect(text).not.toMatch(/Code Quality & Refactoring/);
	});

	it("generates only documentation category when specified", async () => {
		const res = await quickDeveloperPromptsBuilder({
			category: "documentation",
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Should have Documentation category
		expect(text).toMatch(/Documentation & Onboarding/);
		expect(text).toMatch(/\*\*document for new users\*\*/);
		expect(text).toMatch(/\*\*quick onboarding checklist\*\*/);

		// Should NOT have other categories
		expect(text).not.toMatch(/Strategy & High-Level Planning/);
		expect(text).not.toMatch(/DevOps & Automation/);
	});

	it("generates only devops category when specified", async () => {
		const res = await quickDeveloperPromptsBuilder({
			category: "devops",
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Should have DevOps category
		expect(text).toMatch(/DevOps & Automation/);
		expect(text).toMatch(/\*\*deployment blockers\*\*/);
		expect(text).toMatch(/\*\*automated\*\*/);
		expect(text).toMatch(/\*\*rollback plan\*\*/);

		// Should NOT have other categories
		expect(text).not.toMatch(/Strategy & High-Level Planning/);
		expect(text).not.toMatch(/Testing & Validation/);
	});

	it("includes frontmatter when requested", async () => {
		const res = await quickDeveloperPromptsBuilder({
			includeFrontmatter: true,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Check for frontmatter
		expect(text).toMatch(/---/);
		expect(text).toMatch(/mode:/);
	});

	it("includes metadata when requested", async () => {
		const res = await quickDeveloperPromptsBuilder({
			includeFrontmatter: false,
			includeMetadata: true,
		});
		const text = res.content[0].text;

		// Check for metadata section
		expect(text).toMatch(/quick-developer-prompts-builder/);
	});

	it("uses correct default category", async () => {
		const res = await quickDeveloperPromptsBuilder({
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Default is 'all', so should have all categories
		expect(text).toMatch(/Strategy & High-Level Planning/);
		expect(text).toMatch(/Code Quality & Refactoring/);
		expect(text).toMatch(/Testing & Validation/);
		expect(text).toMatch(/Documentation & Onboarding/);
		expect(text).toMatch(/DevOps & Automation/);
	});

	it("includes usage instructions", async () => {
		const res = await quickDeveloperPromptsBuilder({
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Check for usage tips
		expect(text).toMatch(/Usage:/);
		expect(text).toMatch(/Tip:/);
		expect(text).toMatch(/concise/);
		expect(text).toMatch(/actionable/);
	});

	it("includes all 25 prompts in checklist format", async () => {
		const res = await quickDeveloperPromptsBuilder({
			category: "all",
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Count checklist items (should be 25)
		const checklistMatches = text.match(/- \[ \]/g);
		expect(checklistMatches).not.toBeNull();
		expect(checklistMatches?.length).toBe(25);
	});
});
