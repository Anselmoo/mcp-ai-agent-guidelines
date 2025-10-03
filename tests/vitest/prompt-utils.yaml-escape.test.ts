import { describe, expect, it } from "vitest";
import {
	buildFrontmatter,
	escapeYamlValue,
	slugify,
} from "../../src/tools/shared/prompt-utils";

describe("YAML escaping and slug sanitization", () => {
	describe("escapeYamlValue direct tests", () => {
		it("returns quoted empty string", () => {
			expect(escapeYamlValue("")).toBe("''");
		});

		it("quotes simple strings", () => {
			expect(escapeYamlValue("simple")).toBe("'simple'");
		});

		it("uses block scalar for multiline strings", () => {
			const result = escapeYamlValue("line1\nline2\nline3");
			expect(result).toContain("|\n");
			expect(result).toContain("  line1");
			expect(result).toContain("  line2");
			expect(result).toContain("  line3");
		});

		it("uses block scalar for strings with YAML terminators", () => {
			const result = escapeYamlValue("text with --- in it");
			expect(result).toContain("|\n");
			expect(result).toContain("  text with --- in it");
		});

		it("escapes single quotes by doubling them", () => {
			expect(escapeYamlValue("it's")).toBe("'it''s'");
			expect(escapeYamlValue("don't")).toBe("'don''t'");
		});

		it("handles strings with colons", () => {
			const result = escapeYamlValue("key: value");
			expect(result).toBe("'key: value'");
		});

		it("handles strings with special characters", () => {
			expect(escapeYamlValue("test@example.com")).toBe("'test@example.com'");
			expect(escapeYamlValue("a & b")).toBe("'a & b'");
			expect(escapeYamlValue("item #1")).toBe("'item #1'");
		});

		it("handles strings with leading/trailing whitespace", () => {
			const result = escapeYamlValue("  spaces  ");
			expect(result).toBe("'  spaces  '");
		});
	});

	describe("escapeYamlValue", () => {
		it("escapes values containing YAML terminators (---)", () => {
			const result = buildFrontmatter({
				description: "User input --- breaks YAML",
			});
			// Should not contain unescaped --- in the middle of the YAML
			const lines = result.split("\n");
			expect(lines[0]).toBe("---"); // Opening
			expect(lines[lines.length - 1]).toBe("---"); // Closing
			// The description line should be escaped or quoted safely
			expect(result).toMatch(/description:/);
			// The result should be valid YAML (no unescaped --- in middle)
			const middleLines = lines.slice(1, -1);
			const hasUnescapedDashes = middleLines.some(
				(line) => line.trim() === "---",
			);
			expect(hasUnescapedDashes).toBe(false);
		});

		it("escapes multiline strings safely", () => {
			const result = buildFrontmatter({
				description: "Line 1\nLine 2\nLine 3",
			});
			// Should handle newlines without breaking YAML structure
			expect(result).toMatch(/description:/);
			// Verify it doesn't create invalid YAML
			const lines = result.split("\n");
			expect(lines[0]).toBe("---");
			expect(lines[lines.length - 1]).toBe("---");
		});

		it("escapes special YAML characters (colons, quotes, brackets)", () => {
			const result = buildFrontmatter({
				description: 'Special: chars "quotes" [brackets] {braces}',
			});
			expect(result).toMatch(/description:/);
			// Should be safely quoted or escaped
			expect(result).toContain("Special");
		});

		it("handles very long strings without breaking YAML", () => {
			const longString = "A".repeat(500);
			const result = buildFrontmatter({
				description: longString,
			});
			expect(result).toMatch(/description:/);
			expect(result).toContain("A".repeat(100)); // Should contain the string
		});

		it("escapes strings with leading/trailing whitespace", () => {
			const result = buildFrontmatter({
				description: "  leading and trailing  ",
			});
			expect(result).toMatch(/description:/);
			// Should preserve or handle whitespace safely
		});

		it("handles empty strings", () => {
			const result = buildFrontmatter({
				description: "",
			});
			expect(result).toMatch(/description: ''/);
		});

		it("handles strings with only special characters", () => {
			const result = buildFrontmatter({
				description: "!@#$%^&*()_+-=[]{}|;:,.<>?",
			});
			expect(result).toMatch(/description:/);
		});
	});

	describe("slugify with length constraints", () => {
		it("truncates very long titles to maximum length", () => {
			const longTitle = "A".repeat(300);
			const result = slugify(longTitle);
			// Should be truncated to reasonable length (e.g., 80 chars)
			expect(result.length).toBeLessThanOrEqual(80);
			expect(result).toBe("a".repeat(80));
		});

		it("handles title with path-unfriendly characters", () => {
			const result = slugify("file/path\\name:with*special?chars");
			expect(result).toBe("filepathnamewithspecialchars");
			expect(result).not.toContain("/");
			expect(result).not.toContain("\\");
			expect(result).not.toContain(":");
			expect(result).not.toContain("*");
			expect(result).not.toContain("?");
		});

		it("handles title with unicode characters", () => {
			const result = slugify("Café ☕ München");
			// Should remove or replace unicode chars
			expect(result).toMatch(/^[a-z0-9-]+$/);
		});

		it("handles title that becomes empty after cleaning", () => {
			const result = slugify("!!!@@@###$$$%%%");
			// Should return empty or minimal string
			expect(result).toBe("");
		});

		it("handles title at exactly max length boundary", () => {
			const exactLength = "a".repeat(80);
			const result = slugify(exactLength);
			expect(result.length).toBeLessThanOrEqual(80);
			expect(result).toBe("a".repeat(80));
		});

		it("handles title just over max length boundary", () => {
			const overLength = "a".repeat(81);
			const result = slugify(overLength);
			expect(result.length).toBeLessThanOrEqual(80);
			expect(result).toBe("a".repeat(80));
		});

		it("handles title with mixed content that results in long slug", () => {
			const title =
				"This is a very long title with many words that will be converted to a slug and should be truncated properly";
			const result = slugify(title);
			expect(result.length).toBeLessThanOrEqual(80);
			// Should start with expected content
			expect(result).toMatch(/^this-is-a-very-long-title/);
		});
	});

	describe("buildFrontmatter with escaping integration", () => {
		it("safely handles all fields with special characters", () => {
			const result = buildFrontmatter({
				mode: "agent",
				model: "GPT-4.1",
				tools: ["tool-with-dash", "tool_with_underscore"],
				description: "Description with 'quotes' and --- and newlines\nLine 2",
			});
			expect(result).toMatch(/^---/);
			expect(result).toMatch(/---$/);
			expect(result).toMatch(/mode: 'agent'/);
			expect(result).toMatch(/model: GPT-4.1/);
			// Should be valid YAML structure
			const lines = result.split("\n");
			expect(lines.filter((l) => l.trim() === "---").length).toBe(2);
		});

		it("handles mode with special characters", () => {
			const result = buildFrontmatter({
				mode: "agent-test",
				description: "test",
			});
			expect(result).toMatch(/mode: 'agent-test'/);
		});

		it("handles tools array with special characters", () => {
			const result = buildFrontmatter({
				tools: ["tool'with'quotes", "tool-with-dashes"],
				description: "test",
			});
			expect(result).toMatch(/tools:/);
		});
	});
});
