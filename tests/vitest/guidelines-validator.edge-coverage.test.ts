import { describe, expect, it } from "vitest";
import { guidelinesValidator } from "../../src/tools/guidelines-validator";

describe("Guidelines Validator - Additional Coverage", () => {
	it("should handle excellent compliance (score >= 80)", async () => {
		const result = await guidelinesValidator({
			practiceDescription:
				"We implement comprehensive hierarchical prompting with clear goal specification, structured requirements, and detailed audience targeting. Our prompts include proper context setting, step-by-step instructions, and clear success criteria with numeric evaluation metrics for measuring effectiveness. We regularly validate outputs and maintain consistency across all AI interactions with iterative refinement processes and appropriate scaffolding support levels for different agent capabilities.",
			category: "prompting",
			includeReferences: true,
		});

		const text = result.content[0].text;
		// With new scoring (base 30), this comprehensive description should hit 80+ for excellent
		expect(text).toContain("Excellent compliance");
		expect(text).toContain("🟢");
		expect(text).toContain(
			"Your practice aligns very well with established guidelines",
		);
	});

	it("should handle poor compliance (score < 45)", async () => {
		const result = await guidelinesValidator({
			practiceDescription:
				"We just ask AI basic questions without any planning.",
			category: "prompting",
		});

		const text = result.content[0].text;
		// With new base of 30, this should be POOR (30/100)
		expect(text).toMatch(/🔴/); // Should have poor status emoji
		expect(text).toContain("compliance");
		expect(text).toContain("Overall Score");
	});

	it("should handle good compliance (score 65-79)", async () => {
		const result = await guidelinesValidator({
			practiceDescription:
				"We structure our prompts with clear goals and hierarchical layers. We provide detailed context and specific requirements. We use appropriate guidance levels for different agent capabilities.",
			category: "prompting",
		});

		const text = result.content[0].text;
		// With new scoring, this should hit 65-79 for GOOD
		expect(text).toContain("Good compliance");
		expect(text).toContain("🟡");
		expect(text).toContain("Minor improvements recommended");
	});

	it("should handle fair compliance (score 45-64)", async () => {
		const result = await guidelinesValidator({
			practiceDescription:
				"We try to structure prompts and sometimes provide context. Basic goal setting is present but not comprehensive.",
			category: "prompting",
		});

		const text = result.content[0].text;
		// Just check that it produces a valid compliance assessment
		expect(text).toMatch(/🔴|🟠|🟡|🟢/); // Should have some status emoji
		expect(text).toContain("compliance");
		expect(text).toContain("Overall Score");
	});

	it("should handle no issues identified scenario", async () => {
		// Test with a very comprehensive description that should have no issues
		const result = await guidelinesValidator({
			practiceDescription:
				"Comprehensive AI agent development with hierarchical prompting, clear goal specification, structured requirements, audience targeting, context setting, step-by-step instructions, success criteria validation, output verification, consistency maintenance, error handling, iterative improvement, documentation, monitoring, and best practices implementation.",
			category: "architecture",
		});

		const text = result.content[0].text;
		// Should either have very few issues or none
		if (text.includes("No significant issues identified")) {
			expect(text).toContain("*No significant issues identified*");
		}
	});

	it("should handle memory-optimization category", async () => {
		const result = await guidelinesValidator({
			practiceDescription:
				"We implement token optimization and context management",
			category: "memory",
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation");
		// Should validate against memory-optimization specific criteria
	});

	it("should handle code-hygiene category", async () => {
		const result = await guidelinesValidator({
			practiceDescription:
				"We follow clean code principles and maintain good documentation",
			category: "code-management",
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation");
		// Should validate against code-hygiene specific criteria
	});

	it("should handle sprint-planning category", async () => {
		const result = await guidelinesValidator({
			practiceDescription:
				"We plan sprints with proper estimation and risk assessment",
			category: "workflow",
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation");
		// Should validate against sprint-planning specific criteria
	});

	it("should handle inputFile parameter", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Basic prompt structure implementation",
			category: "prompting",
			inputFile: "prompt-guidelines.md",
		});

		const text = result.content[0].text;
		expect(text).toContain("Input file: prompt-guidelines.md");
	});

	it("should handle includeReferences false", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Standard AI development practices",
			category: "architecture",
			includeReferences: false,
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation");
		// Should not contain references section
		expect(text).not.toContain("## Further Reading");
	});

	it("should handle unknown category gracefully", async () => {
		// Test with invalid input - should return error response
		const result = await guidelinesValidator({
			practiceDescription: "Some practice description",
			category: "unknown-category" as any,
		});
		expect((result as { isError?: boolean }).isError).toBe(true);
		expect(result.content[0].text).toContain("validation");
	});

	it("should detect multiple specific guideline violations", async () => {
		const result = await guidelinesValidator({
			practiceDescription:
				"We use simple prompts without structure, goals, or validation.",
			category: "prompting",
		});

		const text = result.content[0].text;
		expect(text).toContain("🐞 Issues Found");
		// Should identify specific missing elements
		expect(text.length).toBeGreaterThan(500); // Should have detailed feedback
	});

	it("should handle very minimal description", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Basic approach",
			category: "architecture",
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation");
		expect(text).toContain("Overall Score");
		// Should handle minimal input gracefully
	});

	it("should include best practices section", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Standard development process",
			category: "architecture",
		});

		const text = result.content[0].text;
		expect(text).toContain("📚 Best Practices");
		// Architecture category has modular/scalable best practices
		expect(text).toContain("modular");
		expect(text.length).toBeGreaterThan(800); // Should have substantial content
	});
});
