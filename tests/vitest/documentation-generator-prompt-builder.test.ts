import { describe, expect, it } from "vitest";
import { documentationGeneratorPromptBuilder } from "../../src/tools/prompt/documentation-generator-prompt-builder.js";

describe("documentation-generator-prompt-builder", () => {
	it("should generate API documentation prompt", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "API",
			targetAudience: "API consumers",
			existingContent: "Basic endpoint list available",
			includeReferences: true,
		});

		const text = result.content[0].text;

		// Check for basic structure
		expect(text).toContain("Documentation Generator Prompt");
		expect(text).toContain("Documentation Generation Request");

		// Check for content type - matches "API" exactly
		expect(text).toContain("Documentation Type");
		expect(text).toContain("API");
		expect(text).toMatch(
			/API.*Overview.*purpose|Authentication methods|Endpoint documentation/s,
		);

		// Check for audience
		expect(text).toContain("API consumers");

		// Check for existing content
		expect(text).toContain("Basic endpoint list");

		// Check for references
		expect(text).toContain("Further Reading");
	});

	it("should generate user guide documentation prompt", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "user guide",
			targetAudience: "end-users",
		});

		const text = result.content[0].text;

		expect(text).toContain("user guide");
		expect(text).toContain("Getting started guide");
		expect(text).toContain("Feature walkthrough");
		expect(text).toContain("screenshots");
		expect(text).toContain("Troubleshooting");
	});

	it("should generate technical specification prompt", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "technical spec",
			targetAudience: "developers",
		});

		const text = result.content[0].text;

		expect(text).toContain("technical spec");
		expect(text).toContain("System overview");
		expect(text).toContain("Technical requirements");
		expect(text).toContain("Implementation details");
		expect(text).toContain("Configuration options");
	});

	it("should handle developers as target audience", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "API",
			targetAudience: "developers",
		});

		const text = result.content[0].text;

		expect(text).toContain("developers");
		expect(text).toContain("Technical depth");
		expect(text).toContain("Code examples");
		expect(text).toContain("Integration patterns");
	});

	it("should handle end-users as target audience", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "user manual",
			targetAudience: "end-users",
		});

		const text = result.content[0].text;

		expect(text).toContain("end-users");
		expect(text).toContain("jargon-free");
		expect(text).toContain("Step-by-step");
		expect(text).toContain("Visual aids");
	});

	it("should handle administrators as target audience", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "admin guide",
			targetAudience: "administrators",
		});

		const text = result.content[0].text;

		expect(text).toContain("administrators");
		expect(text).toContain("Configuration");
		expect(text).toContain("Maintenance");
		expect(text).toContain("Security considerations");
	});

	it("should handle general audience", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "overview",
			targetAudience: "general",
		});

		const text = result.content[0].text;

		expect(text).toContain("Balanced technical depth");
		expect(text).toContain("Clear explanations");
	});

	it("should include documentation requirements section", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "API reference",
		});

		const text = result.content[0].text;

		expect(text).toContain("Documentation Requirements");
		expect(text).toContain("Content Structure");
		expect(text).toContain("Audience Considerations");
		expect(text).toContain("Quality Standards");
	});

	it("should include quality standards", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "tutorial",
		});

		const text = result.content[0].text;

		expect(text).toContain("Clarity");
		expect(text).toContain("Completeness");
		expect(text).toContain("Accuracy");
		expect(text).toContain("Usability");
	});

	it("should include output format with structure", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "guide",
		});

		const text = result.content[0].text;

		expect(text).toContain("Documentation Structure");
		expect(text).toContain("Introduction");
		expect(text).toContain("Main Content");
		expect(text).toContain("Supporting Materials");
	});

	it("should include content guidelines", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "manual",
		});

		const text = result.content[0].text;

		expect(text).toContain("Content Guidelines");
		expect(text).toContain("clear, concise language");
		expect(text).toContain("practical examples");
		expect(text).toContain("consistent formatting");
	});

	it("should include visual elements section", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "documentation",
		});

		const text = result.content[0].text;

		expect(text).toContain("Visual Elements");
		expect(text).toContain("Diagrams");
		expect(text).toContain("Screenshots");
		expect(text).toContain("Code blocks");
		expect(text).toContain("Tables");
	});

	it("should include quality checklist", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "docs",
		});

		const text = result.content[0].text;

		expect(text).toContain("Quality Checklist");
		expect(text).toContain("accurate and up-to-date");
		expect(text).toContain("appropriate for target audience");
		expect(text).toContain("Examples are practical");
		expect(text).toContain("Navigation");
		expect(text).toContain("accessibility");
	});

	it("should respect includeMetadata flag", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "test",
			includeMetadata: false,
		});

		const text = result.content[0].text;

		expect(text).not.toMatch(/\*\*Source Tool\*\*/);
	});

	it("should respect includeFrontmatter flag", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "test",
			includeFrontmatter: false,
			forcePromptMdStyle: false,
		});

		const text = result.content[0].text;

		expect(text).not.toMatch(/^---/);
	});

	it("should handle empty existing content gracefully", async () => {
		const result = await documentationGeneratorPromptBuilder({
			contentType: "new docs",
			existingContent: "",
		});

		const text = result.content[0].text;

		expect(text).toContain("Starting from scratch");
	});
});
