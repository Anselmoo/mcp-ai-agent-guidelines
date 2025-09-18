// Utility Functions Coverage Tests - Target simple, pure functions
import { describe, expect, it } from "vitest";

// Import utility functions that are more likely to be testable
import {
	buildFrontmatter,
	buildFrontmatterWithPolicy,
	buildMetadataSection,
	buildReferencesSection,
	slugify,
	validateAndNormalizeFrontmatter,
} from "../../dist/tools/shared/prompt-utils.js";

describe("Utility Functions Coverage", () => {
	describe("Slugify Function", () => {
		it("should handle various text inputs", () => {
			expect(slugify("Hello World")).toBe("hello-world");
			expect(slugify("Test@#$%^&*()")).toBe("test");
			expect(slugify("Multiple   Spaces")).toBe("multiple-spaces");
			expect(slugify("Special-Characters!@#")).toBe("special-characters");
			expect(slugify("")).toBe("");
			expect(slugify("CamelCase")).toBe("camelcase");
			expect(slugify("123-456-789")).toBe("123-456-789");
			expect(slugify("   Leading and trailing   ")).toBe(
				"leading-and-trailing",
			);
		});
	});

	describe("Build Frontmatter Function", () => {
		it("should build frontmatter with various options", () => {
			const result1 = buildFrontmatter({
				description: "Test description",
			});
			expect(result1).toContain("description: 'Test description'");

			const result2 = buildFrontmatter({
				mode: "agent",
				model: "gpt-4",
				tools: ["tool1", "tool2"],
				description: "Complex description",
			});
			expect(result2).toContain("mode: 'agent'");
			expect(result2).toContain("model: gpt-4");
			expect(result2).toContain("tools: ['tool1', 'tool2']");

			const result3 = buildFrontmatter({
				description: "Description with 'quotes'",
			});
			expect(result3).toContain("description: 'Description with ''quotes'''");
		});
	});

	describe("Validate and Normalize Frontmatter Function", () => {
		it("should validate and normalize various frontmatter options", () => {
			const result1 = validateAndNormalizeFrontmatter({
				description: "Test",
			});
			expect(result1.description).toBe("Test");

			const result2 = validateAndNormalizeFrontmatter({
				mode: "agent",
				model: "gpt-4.1",
				tools: ["githubRepo"],
				description: "Normalized test",
			});
			expect(result2.mode).toBe("agent");

			const result3 = validateAndNormalizeFrontmatter({
				mode: "invalid-mode",
				description: "Invalid mode test",
			});
			expect(result3.comments).toBeDefined();
		});
	});

	describe("Build Frontmatter with Policy Function", () => {
		it("should build frontmatter with policy enforcement", () => {
			const result1 = buildFrontmatterWithPolicy({
				description: "Policy test",
			});
			expect(result1).toContain("description:");

			const result2 = buildFrontmatterWithPolicy({
				mode: "agent",
				model: "claude-4",
				description: "Policy test with mode",
			});
			expect(result2).toContain("mode:");
		});
	});

	describe("Build Metadata Section Function", () => {
		it("should build metadata sections with various options", () => {
			const result1 = buildMetadataSection({
				updatedDate: new Date("2024-01-01"),
				sourceFile: "test.ts",
			});
			expect(result1).toContain("2024");

			const result2 = buildMetadataSection({
				deterministic: true,
			});
			expect(result2).toBeDefined();

			const result3 = buildMetadataSection({
				sourceFile: "complex-file.ts",
				additionalMeta: "extra info",
			});
			expect(result3).toBeDefined();
		});
	});

	describe("Build References Section Function", () => {
		it("should build references sections", () => {
			const result1 = buildReferencesSection([]);
			expect(result1).toBeDefined();

			const result2 = buildReferencesSection([
				"Reference 1",
				"Reference 2",
				"Reference 3",
			]);
			expect(result2).toContain("Reference 1");
			expect(result2).toContain("Reference 2");
			expect(result2).toContain("Reference 3");

			const result3 = buildReferencesSection([
				"https://example.com/doc1",
				"https://example.com/doc2",
			]);
			expect(result3).toContain("https://example.com/doc1");
		});
	});

	describe("Edge Cases and Error Handling", () => {
		it("should handle edge cases gracefully", () => {
			// Test slugify with edge cases
			expect(slugify("   ")).toBe("");
			expect(slugify("---")).toBe("");
			expect(slugify("a")).toBe("a");

			// Test frontmatter with edge cases
			const edgeResult = buildFrontmatter({
				description: "",
				tools: [],
			});
			expect(edgeResult).toContain("description: ''");

			// Test validation with edge cases
			const validationResult = validateAndNormalizeFrontmatter({
				description: "Edge case test",
				mode: undefined,
				model: undefined,
				tools: undefined,
			});
			expect(validationResult.description).toBe("Edge case test");
		});
	});
});
