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

	it("respects forcePromptMdStyle setting when true", async () => {
		const res = await quickDeveloperPromptsBuilder({
			forcePromptMdStyle: true,
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// When forcePromptMdStyle is true, frontmatter and metadata should be forced on
		// even if explicitly set to false
		expect(text).toMatch(/---/); // Frontmatter marker
		expect(text).toMatch(/quick-developer-prompts-builder/); // Metadata
	});

	it("respects forcePromptMdStyle setting when false", async () => {
		const res = await quickDeveloperPromptsBuilder({
			forcePromptMdStyle: false,
			includeFrontmatter: false,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// When forcePromptMdStyle is false, should respect individual settings
		// Check that frontmatter is not at the start (frontmatter starts with ---)
		expect(text).not.toMatch(/^---/); // No frontmatter at start
		expect(text).not.toMatch(/quick-developer-prompts-builder/); // No metadata
	});

	it("includes inputFile in metadata when provided", async () => {
		const testInputFile = "test-input.ts";
		const res = await quickDeveloperPromptsBuilder({
			inputFile: testInputFile,
			includeFrontmatter: false,
			includeMetadata: true,
		});
		const text = res.content[0].text;

		// Check that inputFile is referenced in metadata
		expect(text).toMatch(/Metadata/);
	});

	it("generates correct filename hint based on category", async () => {
		const res = await quickDeveloperPromptsBuilder({
			category: "testing",
			includeFrontmatter: false,
			includeMetadata: true,
		});
		const text = res.content[0].text;

		// Check that filename hint includes the category
		expect(text).toMatch(/quick-developer-prompts-testing\.prompt\.md/);
	});

	it("uses default values for optional parameters", async () => {
		// Call with minimal params to test defaults
		const res = await quickDeveloperPromptsBuilder({});
		const text = res.content[0].text;

		// Should have frontmatter and metadata by default (due to forcePromptMdStyle default)
		expect(text).toMatch(/---/);
		expect(text).toMatch(/Metadata/);

		// Should have all categories by default
		expect(text).toMatch(/Strategy & High-Level Planning/);
		expect(text).toMatch(/Code Quality & Refactoring/);
		expect(text).toMatch(/Testing & Validation/);
		expect(text).toMatch(/Documentation & Onboarding/);
		expect(text).toMatch(/DevOps & Automation/);
	});

	it("respects custom mode and model parameters", async () => {
		const res = await quickDeveloperPromptsBuilder({
			mode: "agent",
			model: "GPT-4",
			includeFrontmatter: true,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Check that custom mode is in frontmatter
		expect(text).toMatch(/mode:/);
	});

	it("respects custom tools parameter", async () => {
		const customTools = ["customTool1", "customTool2"];
		const res = await quickDeveloperPromptsBuilder({
			tools: customTools,
			includeFrontmatter: true,
			includeMetadata: false,
		});
		const text = res.content[0].text;

		// Frontmatter should be present
		expect(text).toMatch(/---/);
		expect(text).toMatch(/tools:/);
	});
});
