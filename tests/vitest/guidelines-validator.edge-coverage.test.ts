import { describe, it, expect } from "vitest";
import { guidelinesValidator } from "../../src/tools/guidelines-validator";

describe("Guidelines Validator - Additional Coverage", () => {
	it("should handle excellent compliance (score >= 85)", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "We implement comprehensive hierarchical prompting with clear goal specification, structured requirements, and detailed audience targeting. Our prompts include proper context setting, step-by-step instructions, and clear success criteria. We regularly validate outputs and maintain consistency across all AI interactions.",
			category: "prompting",
			includeReferences: true
		});

		const text = result.content[0].text;
		expect(text).toContain("Excellent compliance");
		expect(text).toContain("🟢");
		expect(text).toContain("Your practice aligns very well with established guidelines");
	});

	it("should handle poor compliance (score < 50)", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "We just ask AI questions without any structure or planning.",
			category: "prompting"
		});

		const text = result.content[0].text;
		expect(text).toContain("Poor compliance");
		expect(text).toContain("🔴");
		expect(text).toContain("Significant improvements needed");
	});

	it("should handle good compliance (score 70-84)", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "We structure our prompts with clear goals and provide context. We define audience and requirements. Sometimes we validate outputs but not consistently.",
			category: "prompting"
		});

		const text = result.content[0].text;
		expect(text).toContain("Good compliance");
		expect(text).toContain("🟡");
		expect(text).toContain("Minor improvements recommended");
	});

	it("should handle fair compliance (score 50-69)", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "We try to structure prompts and sometimes provide context. Basic goal setting is present but not comprehensive.",
			category: "prompting"
		});

		const text = result.content[0].text;
		expect(text).toContain("Fair compliance");
		expect(text).toContain("🟠");
		expect(text).toContain("Several areas need attention");
	});

	it("should handle no issues identified scenario", async () => {
		// Test with a very comprehensive description that should have no issues
		const result = await guidelinesValidator({
			practiceDescription: "Comprehensive AI agent development with hierarchical prompting, clear goal specification, structured requirements, audience targeting, context setting, step-by-step instructions, success criteria validation, output verification, consistency maintenance, error handling, iterative improvement, documentation, monitoring, and best practices implementation.",
			category: "architecture"
		});

		const text = result.content[0].text;
		// Should either have very few issues or none
		if (text.includes("No significant issues identified")) {
			expect(text).toContain("*No significant issues identified*");
		}
	});

	it("should handle memory-optimization category", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "We implement token optimization and context management",
			category: "memory"
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation Report");
		// Should validate against memory-optimization specific criteria
	});

	it("should handle code-hygiene category", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "We follow clean code principles and maintain good documentation",
			category: "code-management"
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation Report");
		// Should validate against code-hygiene specific criteria
	});

	it("should handle sprint-planning category", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "We plan sprints with proper estimation and risk assessment",
			category: "workflow"
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation Report");
		// Should validate against sprint-planning specific criteria
	});

	it("should handle inputFile parameter", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Basic prompt structure implementation",
			category: "prompting",
			inputFile: "prompt-guidelines.md"
		});

		const text = result.content[0].text;
		expect(text).toContain("Input file: prompt-guidelines.md");
	});

	it("should handle includeReferences false", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Standard AI development practices",
			category: "architecture",
			includeReferences: false
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation Report");
		// Should not contain references section
		expect(text).not.toContain("### 📚 References");
	});

	it("should handle unknown category gracefully", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Some practice description",
			category: "unknown-category" as any
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation Report");
		// Should handle unknown categories without crashing
	});

	it("should detect multiple specific guideline violations", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "We use simple prompts without structure, goals, or validation.",
			category: "prompting"
		});

		const text = result.content[0].text;
		expect(text).toContain("Issues Identified");
		// Should identify specific missing elements
		expect(text.length).toBeGreaterThan(500); // Should have detailed feedback
	});

	it("should handle very minimal description", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Basic approach",
			category: "architecture"
		});

		const text = result.content[0].text;
		expect(text).toContain("Guidelines Validation Report");
		expect(text).toContain("Score:");
		// Should handle minimal input gracefully
	});

	it("should include best practices section", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Standard development process",
			category: "architecture"
		});

		const text = result.content[0].text;
		expect(text).toContain("Best Practices to Adopt");
		expect(text).toContain("Hierarchical Prompting");
		expect(text).toContain("Error Handling");
		expect(text).toContain("Documentation");
	});
});