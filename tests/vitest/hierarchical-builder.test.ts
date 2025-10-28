import { describe, expect, it } from "vitest";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder";

describe("hierarchical-prompt-builder", () => {
	it("generates a well-structured prompt with optional sections", async () => {
		const res = await hierarchicalPromptBuilder({
			context: "Repo analysis",
			goal: "Summarize modules",
			requirements: ["List files", "Summarize responsibilities"],
			issues: ["Missing tests", "Outdated docs"],
			outputFormat: "1) JSON object, 2) Include fields: name, desc",
			audience: "engineers",
			includeExplanation: true,
			includeReferences: true,
		});
		const text = res.content[0].text;
		expect(text).toMatch(/# Context/);
		expect(text).toMatch(/# Goal/);
		expect(text).toMatch(/# Requirements/); // includes numbered list
		expect(text).toMatch(/# Problem Indicators/);
		expect(text).toMatch(
			/# Output Format\n1\. JSON object\n2\. Include fields: name, desc/,
		); // normalization
		expect(text).toMatch(/# Target Audience/);
		expect(text).toMatch(/## Explanation/);
		expect(text).toMatch(/## Further Reading/);
		// No longer checking for "Pitfalls to Avoid" - removed in favor of actionable instructions
	});
});
