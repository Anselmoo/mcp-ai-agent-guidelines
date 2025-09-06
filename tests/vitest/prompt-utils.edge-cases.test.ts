import { describe, expect, it } from "vitest";
import { 
	slugify, 
	buildFrontmatter, 
	validateAndNormalizeFrontmatter,
	buildFrontmatterWithPolicy,
	buildMetadataSection,
	buildReferencesSection
} from "../../src/tools/shared/prompt-utils";

describe("prompt-utils edge cases and branches", () => {
	describe("slugify", () => {
		it("handles empty string", () => {
			expect(slugify("")).toBe("");
		});

		it("handles string with special characters", () => {
			expect(slugify("Hello, World! @#$%")).toBe("hello-world");
		});

		it("handles multiple spaces and dashes", () => {
			expect(slugify("  multiple   spaces  --  dashes  ")).toBe("multiple-spaces-dashes");
		});

		it("handles numbers and letters", () => {
			expect(slugify("Test123 ABC")).toBe("test123-abc");
		});

		it("removes leading and trailing dashes", () => {
			expect(slugify("-start and end-")).toBe("start-and-end");
		});
	});

	describe("buildFrontmatter", () => {
		it("handles minimal options", () => {
			const result = buildFrontmatter({
				description: "Test description"
			});
			expect(result).toMatch(/---/);
			expect(result).toMatch(/description: 'Test description'/);
		});

		it("includes all options when provided", () => {
			const result = buildFrontmatter({
				mode: "agent",
				model: "gpt-4.1",
				tools: ["githubRepo", "codebase"],
				description: "Full test"
			});
			expect(result).toMatch(/mode: 'agent'/);
			expect(result).toMatch(/model: gpt-4.1/);
			expect(result).toMatch(/tools: \['githubRepo', 'codebase'\]/);
			expect(result).toMatch(/description: 'Full test'/);
		});

		it("escapes single quotes in description", () => {
			const result = buildFrontmatter({
				description: "Test with 'quotes' inside"
			});
			expect(result).toMatch(/description: 'Test with ''quotes'' inside'/);
		});

		it("handles empty tools array", () => {
			const result = buildFrontmatter({
				description: "Test",
				tools: []
			});
			expect(result).not.toMatch(/tools:/);
		});
	});

	describe("validateAndNormalizeFrontmatter", () => {
		it("normalizes valid model aliases", () => {
			const result = validateAndNormalizeFrontmatter({
				description: "Test",
				model: "gpt-4.1"
			});
			expect(result.model).toBe("GPT-4.1");
		});

		it("handles invalid mode by defaulting to agent", () => {
			const result = validateAndNormalizeFrontmatter({
				description: "Test",
				mode: "invalid-mode"
			});
			expect(result.mode).toBe("agent");
			expect(result.comments).toContain("# Note: Unrecognized mode 'invalid-mode', defaulting to 'agent'");
		});

		it("handles unrecognized model", () => {
			const result = validateAndNormalizeFrontmatter({
				description: "Test",
				model: "unknown-model"
			});
			expect(result.model).toBe("unknown-model");
			expect(result.comments).toContain("# Note: Unrecognized model 'unknown-model'.");
		});

		it("filters invalid tools", () => {
			const result = validateAndNormalizeFrontmatter({
				description: "Test",
				tools: ["githubRepo", "invalid-tool", "codebase"]
			});
			expect(result.tools).toEqual(["githubRepo", "codebase"]);
			expect(result.comments).toContain("# Note: Dropped unknown tools: invalid-tool");
		});

		it("handles all invalid tools", () => {
			const result = validateAndNormalizeFrontmatter({
				description: "Test",
				tools: ["invalid1", "invalid2"]
			});
			expect(result.tools).toEqual([]);
			expect(result.comments).toContain("# Note: Dropped unknown tools: invalid1, invalid2");
		});

		it("returns no comments when all inputs are valid", () => {
			const result = validateAndNormalizeFrontmatter({
				description: "Test",
				mode: "agent",
				model: "gpt-4.1",
				tools: ["githubRepo"]
			});
			expect(result.comments).toBeUndefined();
		});
	});

	describe("buildFrontmatterWithPolicy", () => {
		it("includes comments when validation issues exist", () => {
			const result = buildFrontmatterWithPolicy({
				description: "Test",
				mode: "invalid-mode",
				model: "unknown-model"
			});
			expect(result).toMatch(/# Note: Unrecognized mode/);
			expect(result).toMatch(/# Note: Unrecognized model/);
		});

		it("returns clean frontmatter when no validation issues", () => {
			const result = buildFrontmatterWithPolicy({
				description: "Test",
				mode: "agent",
				model: "gpt-4.1"
			});
			expect(result).not.toMatch(/# Note:/);
			expect(result).toMatch(/---/);
			expect(result).toMatch(/mode: 'agent'/);
		});
	});

	describe("buildMetadataSection", () => {
		it("builds basic metadata", () => {
			const result = buildMetadataSection({
				sourceTool: "test-tool"
			});
			expect(result).toMatch(/### Metadata/);
			expect(result).toMatch(/Source tool: test-tool/);
			expect(result).toMatch(/Updated: \d{4}-\d{2}-\d{2}/);
		});

		it("includes input file when provided", () => {
			const result = buildMetadataSection({
				sourceTool: "test-tool",
				inputFile: "test.md"
			});
			expect(result).toMatch(/Input file: test\.md/);
		});

		it("includes filename hint when provided", () => {
			const result = buildMetadataSection({
				sourceTool: "test-tool",
				filenameHint: "output.md"
			});
			expect(result).toMatch(/Suggested filename: output\.md/);
		});

		it("uses custom date when provided", () => {
			const customDate = new Date("2023-01-01");
			const result = buildMetadataSection({
				sourceTool: "test-tool",
				updatedDate: customDate
			});
			expect(result).toMatch(/Updated: 2023-01-01/);
		});
	});

	describe("buildReferencesSection", () => {
		it("handles empty references array", () => {
			const result = buildReferencesSection([]);
			expect(result).toBe("");
		});

		it("handles null/undefined references", () => {
			const result = buildReferencesSection(null as any);
			expect(result).toBe("");
		});

		it("builds references section with multiple links", () => {
			const result = buildReferencesSection([
				"Link 1: https://example.com",
				"Link 2: https://test.com"
			]);
			expect(result).toMatch(/## References/);
			expect(result).toMatch(/- Link 1: https:\/\/example\.com/);
			expect(result).toMatch(/- Link 2: https:\/\/test\.com/);
		});
	});
});