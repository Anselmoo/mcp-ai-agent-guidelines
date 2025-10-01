import { describe, expect, it } from "vitest";
import { _normalizeOutputFormat } from "../../../src/tools/prompt/hierarchical-prompt-builder";

describe("normalizeOutputFormat - Fenced Code Block Edge Cases", () => {
	describe("Fenced code blocks should remain unchanged", () => {
		it("should not modify content inside single fenced code block", () => {
			const input = `Here is some text 1) Item one
\`\`\`json
{
  "outputFormat": "json",
  "items": [
    "1) First item",
    "2) Second item"
  ]
}
\`\`\`
And more text 2) Item two`;

			const result = _normalizeOutputFormat(input);

			// Code block content should remain unchanged
			expect(result).toContain('"1) First item"');
			expect(result).toContain('"2) Second item"');
			// Non-code text should be normalized
			expect(result).toContain("1. Item one");
			expect(result).toContain("2. Item two");
		});

		it("should preserve multiple fenced code blocks", () => {
			const input = `Text 1) First
\`\`\`javascript
const list = "1) Item, 2) Item";
\`\`\`
Middle text 2) Second
\`\`\`python
items = ["1) One", "2) Two"]
\`\`\`
Final text 3) Third`;

			const result = _normalizeOutputFormat(input);

			// All code blocks should be preserved
			expect(result).toContain('const list = "1) Item, 2) Item";');
			expect(result).toContain('items = ["1) One", "2) Two"]');
			// Non-code text should be normalized
			expect(result).toContain("1. First");
			expect(result).toContain("2. Second");
			expect(result).toContain("3. Third");
		});

		it("should handle fenced blocks with language specifiers", () => {
			const input = `Example output format:
\`\`\`typescript
interface Output {
  format: "1) Structured, 2) Detailed";
}
\`\`\`
Use format 1) JSON or 2) YAML`;

			const result = _normalizeOutputFormat(input);

			// Code block unchanged
			expect(result).toContain('format: "1) Structured, 2) Detailed"');
			// Non-code normalized
			expect(result).toContain("1. JSON");
			expect(result).toContain("2. YAML");
		});

		it("should handle empty fenced code blocks", () => {
			const input = `Text 1) Item
\`\`\`
\`\`\`
More text 2) Another`;

			const result = _normalizeOutputFormat(input);

			expect(result).toContain("1. Item");
			expect(result).toContain("2. Another");
		});
	});

	describe("Triple backticks in text should not break parsing", () => {
		it("should handle inline triple backticks in normal text", () => {
			const input = "Use ``` for code blocks. List: 1) First, 2) Second";
			const result = _normalizeOutputFormat(input);

			// Should normalize the list
			expect(result).toContain("1. First");
			expect(result).toContain("2. Second");
		});

		it("should handle unclosed code fence gracefully", () => {
			const input = `Text 1) Item
\`\`\`json
{
  "unclosed": true
}`;

			const result = _normalizeOutputFormat(input);

			// Should treat everything after opening fence as code
			expect(result).toContain('"unclosed": true');
			// Text before fence should be normalized
			expect(result).toContain("1. Item");
		});
	});

	describe("Markdown lists in code blocks", () => {
		it("should not normalize markdown lists inside code blocks", () => {
			const input = `Output format:
\`\`\`markdown
1) First step
2) Second step
3) Third step
\`\`\`
Instructions: 1) Review, 2) Edit`;

			const result = _normalizeOutputFormat(input);

			// Inside code block - should remain unchanged
			expect(result).toContain("1) First step");
			expect(result).toContain("2) Second step");
			expect(result).toContain("3) Third step");
			// Outside code block - should be normalized
			expect(result).toContain("1. Review");
			expect(result).toContain("2. Edit");
		});

		it("should preserve complex markdown inside code blocks", () => {
			const input = `Example:
\`\`\`
# Header
1) Item one, 2) Item two, 3) Item three
- Bullet point 1) with number
\`\`\`
Follow: 1) Step one, 2) Step two`;

			const result = _normalizeOutputFormat(input);

			// Code block content preserved
			expect(result).toContain("1) Item one, 2) Item two, 3) Item three");
			expect(result).toContain("- Bullet point 1) with number");
			// Non-code normalized
			expect(result).toContain("1. Step one");
			expect(result).toContain("2. Step two");
		});
	});

	describe("Only non-code text normalization", () => {
		it("should normalize text outside code blocks", () => {
			const input = "1) First item 2) Second item";
			const result = _normalizeOutputFormat(input);

			expect(result).toContain("1. First item");
			expect(result).toContain("2. Second item");
		});

		it("should handle mixed content correctly", () => {
			const input = `Before: 1) Item A
\`\`\`
Code: 1) Not normalized
\`\`\`
After: 2) Item B`;

			const result = _normalizeOutputFormat(input);

			expect(result).toContain("1. Item A");
			expect(result).toContain("Code: 1) Not normalized");
			expect(result).toContain("2. Item B");
		});
	});

	describe("Edge cases with outputFormat JSON content", () => {
		it('should preserve outputFormat: "json" inside code blocks', () => {
			const input = `Configuration:
\`\`\`json
{
  "outputFormat": "json",
  "style": "1) Numbered lists"
}
\`\`\`
Select: 1) JSON, 2) YAML`;

			const result = _normalizeOutputFormat(input);

			expect(result).toContain('"outputFormat": "json"');
			expect(result).toContain('"style": "1) Numbered lists"');
			expect(result).toContain("1. JSON");
			expect(result).toContain("2. YAML");
		});

		it("should handle nested structures in JSON code blocks", () => {
			const input = `\`\`\`json
{
  "format": {
    "type": "1) First, 2) Second",
    "items": ["3) Third", "4) Fourth"]
  }
}
\`\`\``;

			const result = _normalizeOutputFormat(input);

			// All content should be preserved
			expect(result).toContain('"type": "1) First, 2) Second"');
			expect(result).toContain('"3) Third"');
			expect(result).toContain('"4) Fourth"');
		});
	});

	describe("Backward compatibility - existing behavior preserved", () => {
		it("should convert '1) Item' to '1. Item' in plain text", () => {
			const input = "1) First item 2) Second item";
			const result = _normalizeOutputFormat(input);

			expect(result).toContain("1. First item");
			expect(result).toContain("2. Second item");
		});

		it("should split inline enumerated lists with commas", () => {
			const input = "1. First, 2. Second, 3. Third";
			const result = _normalizeOutputFormat(input);

			expect(result).toContain("1. First");
			expect(result).toContain("2. Second");
			expect(result).toContain("3. Third");
		});

		it("should preserve existing line breaks", () => {
			const input = "1) First\n2) Second\n3) Third";
			const result = _normalizeOutputFormat(input);

			expect(result).toContain("1. First");
			expect(result).toContain("2. Second");
			expect(result).toContain("3. Third");
		});

		it("should handle empty string", () => {
			const result = _normalizeOutputFormat("");
			expect(result).toBe("");
		});

		it("should handle text without list markers", () => {
			const input = "Just plain text without any markers";
			const result = _normalizeOutputFormat(input);
			expect(result).toBe(input);
		});
	});

	describe("Complex scenarios", () => {
		it("should handle alternating code and text sections", () => {
			const input = `1) Step one
\`\`\`
1) Code step one
\`\`\`
2) Step two
\`\`\`
2) Code step two
\`\`\`
3) Step three`;

			const result = _normalizeOutputFormat(input);

			// Text normalized
			expect(result).toContain("1. Step one");
			expect(result).toContain("2. Step two");
			expect(result).toContain("3. Step three");
			// Code preserved
			expect(result).toContain("1) Code step one");
			expect(result).toContain("2) Code step two");
		});

		it("should handle code blocks at the start and end", () => {
			const input = `\`\`\`
Start code 1) Item
\`\`\`
Middle text 1) Normal
\`\`\`
End code 2) Item
\`\`\``;

			const result = _normalizeOutputFormat(input);

			expect(result).toContain("Start code 1) Item");
			expect(result).toContain("End code 2) Item");
			expect(result).toContain("1. Normal");
		});
	});
});
