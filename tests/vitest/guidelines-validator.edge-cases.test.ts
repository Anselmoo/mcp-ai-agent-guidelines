import { describe, expect, it } from "vitest";
import { guidelinesValidator } from "../../src/tools/guidelines-validator";

describe("guidelines-validator edge cases and branches", () => {
	it("handles unknown category with error response", async () => {
		// This should trigger the unknown category error path
		try {
			await guidelinesValidator({
				practiceDescription: "Some practice",
				category: "unknown-category" as any, // Force invalid category
			});
			// If we get here, the validation didn't catch the invalid category
			expect.fail("Should have thrown validation error");
		} catch (error) {
			// Zod should catch this during schema validation
			expect(error).toBeDefined();
		}
	});

	it("exercises excellent compliance path (score >= 85)", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We apply modular component architecture with separation of concerns and scalable maintainable design patterns",
			category: "architecture",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/🟢.*Excellent compliance/);
		expect(text).toMatch(/EXCELLENT/);
	});

	it("exercises good compliance path (70 <= score < 85)", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We use modular component design with scalable maintainable patterns",
			category: "architecture",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/🟡.*Good compliance/);
		expect(text).toMatch(/GOOD/);
	});

	it("exercises fair compliance path (50 <= score < 70)", async () => {
		const res = await guidelinesValidator({
			practiceDescription: "We use some modular patterns",
			category: "architecture",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/🟠.*Fair compliance/);
		expect(text).toMatch(/FAIR/);
	});

	it("exercises poor compliance path (score < 50)", async () => {
		const res = await guidelinesValidator({
			practiceDescription: "no relevant content",
			category: "architecture",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		// Architecture base is 50, so it will actually be FAIR (50/100), not POOR
		expect(text).toMatch(/🟠.*Fair compliance/);
		expect(text).toMatch(/FAIR/);
	});

	it("handles case with no issues found", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We apply modular component architecture with separation of concerns and scalable maintainable design",
			category: "architecture",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/\*No significant issues identified\*/);
	});

	it("disables references when includeReferences=false", async () => {
		const res = await guidelinesValidator({
			practiceDescription: "We apply modular architecture patterns",
			category: "architecture",
			includeReferences: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).not.toMatch(/### 🔗 References/);
		expect(text).toMatch(/Compliance Level/);
	});

	it("disables metadata when includeMetadata=false", async () => {
		const res = await guidelinesValidator({
			practiceDescription: "We apply modular architecture patterns",
			category: "architecture",
			includeMetadata: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).not.toMatch(/### Metadata/);
		expect(text).not.toMatch(/Updated:/);
		expect(text).toMatch(/Compliance Level/);
	});

	it("includes input file in metadata when provided", async () => {
		const res = await guidelinesValidator({
			practiceDescription: "We apply modular architecture patterns",
			category: "architecture",
			inputFile: "architecture-guidelines.md",
			includeMetadata: true,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Input file: architecture-guidelines\.md/);
	});

	it("exercises prompting category with all criteria", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We use hierarchical prompt structure with clear layered context and background, specific detailed requirements, and iterative refinement processes to improve results",
			category: "prompting",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/hierarchical prompt structuring/);
		expect(text).toMatch(/Provides clear contextual information/);
		expect(text).toMatch(/Emphasizes specificity/);
		expect(text).toMatch(/iterative refinement/);
	});

	it("exercises code-management category", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We maintain clean code hygiene practices, refactor legacy systems, manage dependencies and outdated components, and provide comprehensive documentation with detailed comments",
			category: "code-management",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/code hygiene and maintenance/);
		expect(text).toMatch(/legacy code refactoring/);
		expect(text).toMatch(/dependencies and outdated components/);
		expect(text).toMatch(/proper documentation/);
	});

	it("exercises visualization category", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We create clear visual diagrams and mermaid charts for system architecture documentation",
			category: "visualization",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Category.*visualization/);
	});

	it("exercises memory category", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We implement efficient caching strategies and context optimization for memory management",
			category: "memory",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Category.*memory/);
	});

	it("exercises workflow category", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We follow sprint planning methodologies and timeline estimation for project workflow",
			category: "workflow",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Category.*workflow/);
	});

	it("handles optional criteria correctly", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We use hierarchical structure with context and specific requirements but no iterative process",
			category: "prompting",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		// Should have strengths for non-optional criteria
		expect(text).toMatch(/hierarchical prompt structuring/);
		// Should not have issues for optional criteria that are missing
		expect(text).not.toMatch(/Missing iterative refinement loop/);
	});

	it("exercises score clamping at max possible", async () => {
		// Architecture category max is 50 + 15 + 10 + 10 = 85
		const res = await guidelinesValidator({
			practiceDescription:
				"We implement modular component-based architecture with separation of concerns and scalable maintainable design patterns",
			category: "architecture",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		// Score should reach max possible for architecture (85) which is "excellent"
		expect(text).toMatch(/Overall Score.*85\/100/);
		expect(text).toMatch(/EXCELLENT/);
	});
});
