import { describe, expect, it } from "vitest";
import { domainNeutralPromptBuilder } from "../../../../src/tools/prompt/domain-neutral-prompt-builder.js";
import { hierarchicalPromptBuilder } from "../../../../src/tools/prompt/hierarchical-prompt-builder.js";
import { sparkPromptBuilder } from "../../../../src/tools/prompt/spark-prompt-builder.js";

/**
 * Test suite for frontmatter suppression feature.
 *
 * This addresses the issue where chat outputs should omit prompt headers
 * for clearer conversation flow.
 */
describe("Frontmatter Suppression", () => {
	describe("domainNeutralPromptBuilder", () => {
		it("should suppress frontmatter when includeFrontmatter=false", async () => {
			const result = await domainNeutralPromptBuilder({
				title: "Test Prompt",
				summary: "Testing frontmatter suppression",
				includeFrontmatter: false,
				includeMetadata: false,
			});

			const text = result.content[0].text;

			// Should NOT contain frontmatter markers
			expect(text).not.toContain("---");
			expect(text).not.toContain("mode:");
			expect(text).not.toContain("model:");
			expect(text).not.toContain("tools:");

			// Should still contain the actual content
			expect(text).toContain("Domain-Neutral Prompt");
			expect(text).toContain("Test Prompt");
		});

		it("should include frontmatter by default", async () => {
			const result = await domainNeutralPromptBuilder({
				title: "Test Prompt",
				summary: "Testing default behavior",
			});

			const text = result.content[0].text;

			// Should contain frontmatter with GPT-5
			expect(text).toContain("---");
			expect(text).toContain("mode:");
			expect(text).toContain("model: GPT-5");
			expect(text).toContain("tools:");
		});

		it("should suppress frontmatter even with forcePromptMdStyle=true", async () => {
			const result = await domainNeutralPromptBuilder({
				title: "Test Prompt",
				summary: "Testing frontmatter suppression with forcePromptMdStyle",
				includeFrontmatter: false,
				forcePromptMdStyle: true, // This should NOT override explicit false
				includeMetadata: false,
			});

			const text = result.content[0].text;

			// Should NOT contain frontmatter even though forcePromptMdStyle=true
			expect(text).not.toContain("---");
			expect(text).not.toContain("mode:");
			expect(text).not.toContain("model:");
		});
	});

	describe("hierarchicalPromptBuilder", () => {
		it("should suppress frontmatter when includeFrontmatter=false", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Testing context",
				goal: "Test frontmatter suppression",
				includeFrontmatter: false,
				includeMetadata: false,
			});

			const text = result.content[0].text;

			// Should NOT contain frontmatter markers
			expect(text).not.toContain("---");
			expect(text).not.toContain("mode:");
			expect(text).not.toContain("model:");

			// Should still contain the actual content
			expect(text).toContain("Hierarchical Prompt");
		});

		it("should include frontmatter with GPT-5 by default", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Testing context",
				goal: "Test default model",
			});

			const text = result.content[0].text;

			// Should contain frontmatter with GPT-5
			expect(text).toContain("---");
			expect(text).toContain("model: GPT-5");
		});
	});

	describe("sparkPromptBuilder", () => {
		it("should suppress frontmatter when includeFrontmatter=false", async () => {
			const result = await sparkPromptBuilder({
				title: "Test UI",
				summary: "Testing frontmatter suppression",
				complexityLevel: "simple",
				designDirection: "minimal",
				colorSchemeType: "monochrome",
				colorPurpose: "test",
				primaryColor: "oklch(0.5 0.1 200)",
				primaryColorPurpose: "test",
				accentColor: "oklch(0.6 0.1 210)",
				accentColorPurpose: "test",
				fontFamily: "Arial",
				fontIntention: "test",
				fontReasoning: "test",
				animationPhilosophy: "subtle",
				animationRestraint: "minimal",
				animationPurpose: "test",
				animationHierarchy: "test",
				spacingRule: "8px base",
				spacingContext: "test",
				mobileLayout: "responsive",
				includeFrontmatter: false,
				includeMetadata: false,
			});

			const text = result.content[0].text;

			// Should NOT contain frontmatter markers
			expect(text).not.toContain("---");
			expect(text).not.toContain("mode:");
			expect(text).not.toContain("model:");
		});
	});

	describe("Metadata Suppression", () => {
		it("should suppress metadata when includeMetadata=false", async () => {
			const result = await domainNeutralPromptBuilder({
				title: "Test Prompt",
				summary: "Testing metadata suppression",
				includeMetadata: false,
			});

			const text = result.content[0].text;

			// Should NOT contain metadata section
			expect(text).not.toContain("### Metadata");
			expect(text).not.toContain("Source tool:");
			expect(text).not.toContain("Suggested filename:");
		});

		it("should suppress metadata even with forcePromptMdStyle=true", async () => {
			const result = await domainNeutralPromptBuilder({
				title: "Test Prompt",
				summary: "Testing metadata suppression with forcePromptMdStyle",
				includeMetadata: false,
				forcePromptMdStyle: true,
			});

			const text = result.content[0].text;

			// Should NOT contain metadata even though forcePromptMdStyle=true
			expect(text).not.toContain("### Metadata");
			expect(text).not.toContain("Source tool:");
		});
	});
});
