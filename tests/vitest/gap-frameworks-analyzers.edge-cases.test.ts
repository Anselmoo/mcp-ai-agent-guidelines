import { describe, expect, it } from "vitest";
import { gapFrameworksAnalyzer } from "../../src/tools/analysis/gap-frameworks-analyzer.js";

describe("gap-frameworks-analyzers edge cases", () => {
	it("should handle single framework analysis", async () => {
		const result = await gapFrameworksAnalyzer({
			frameworks: ["capability"],
			currentState: "Basic manual processes",
			desiredState: "Advanced automated workflows",
			context: "Process improvement initiative",
		});

		const text = result.content[0].text;
		expect(text).toContain("Capability Gap Analysis");
		expect(text).toContain("Map current capabilities vs required capabilities");
		expect(text).not.toContain("Performance Gap Analysis");
	});

	it("should handle very long text inputs", async () => {
		const longText = "A".repeat(10000);
		const result = await gapFrameworksAnalyzer({
			frameworks: ["strategic"],
			currentState: longText,
			desiredState: longText,
			context: longText,
		});

		const text = result.content[0].text;
		expect(text).toContain("Strategic Gap Analysis");
		expect(text).toContain(longText);
	});

	it("should handle special characters in inputs", async () => {
		const specialText =
			"Test with special chars: @#$%^&*()[]{}|\\:;\"'<>,.?/~`";
		const result = await gapFrameworksAnalyzer({
			frameworks: ["process"],
			currentState: specialText,
			desiredState: specialText,
			context: specialText,
		});

		const text = result.content[0].text;
		expect(text).toContain("Process Gap Analysis");
		expect(text).toContain(specialText);
	});

	it("should handle unicode and emoji characters", async () => {
		const unicodeText = "Testing 🚀 unicode ñáéíóú and 中文 characters";
		const result = await gapFrameworksAnalyzer({
			frameworks: ["cultural"],
			currentState: unicodeText,
			desiredState: unicodeText,
			context: unicodeText,
		});

		const text = result.content[0].text;
		expect(text).toContain("Cultural Gap Analysis");
		expect(text).toContain(unicodeText);
	});

	it("should handle large arrays of objectives and stakeholders", async () => {
		const manyObjectives = Array.from(
			{ length: 50 },
			(_, i) => `Objective ${i + 1}`,
		);
		const manyStakeholders = Array.from(
			{ length: 30 },
			(_, i) => `Stakeholder ${i + 1}`,
		);
		const manyConstraints = Array.from(
			{ length: 20 },
			(_, i) => `Constraint ${i + 1}`,
		);

		const result = await gapFrameworksAnalyzer({
			frameworks: ["operational"],
			currentState: "Current operational state",
			desiredState: "Desired operational state",
			context: "Large scale transformation",
			objectives: manyObjectives,
			stakeholders: manyStakeholders,
			constraints: manyConstraints,
		});

		const text = result.content[0].text;
		expect(text).toContain("Operational Gap Analysis");
		expect(text).toContain("Objective 1");
		expect(text).toContain("Objective 50");
		expect(text).toContain("Stakeholder 1");
		expect(text).toContain("Stakeholder 30");
		expect(text).toContain("Constraint 1");
		expect(text).toContain("Constraint 20");
	});

	it("should generate appropriate content for each framework type", async () => {
		// Test each framework individually to ensure content is specific
		const frameworkTests = [
			{
				framework: "capability",
				expectedContent: "capability maturity levels",
			},
			{
				framework: "performance",
				expectedContent: "performance metrics and benchmarks",
			},
			{ framework: "maturity", expectedContent: "maturity level" },
			{ framework: "skills", expectedContent: "team skills and competencies" },
			{ framework: "technology", expectedContent: "technology stack" },
			{ framework: "process", expectedContent: "process flows" },
			{ framework: "market", expectedContent: "market position" },
			{ framework: "strategic", expectedContent: "strategic position" },
			{ framework: "operational", expectedContent: "operational efficiency" },
			{ framework: "cultural", expectedContent: "organizational culture" },
			{ framework: "security", expectedContent: "security posture" },
			{ framework: "compliance", expectedContent: "compliance status" },
		];

		for (const { framework, expectedContent } of frameworkTests) {
			const result = await gapFrameworksAnalyzer({
				frameworks: [framework as any],
				currentState: "Current state",
				desiredState: "Desired state",
				context: "Test context",
			});

			const text = result.content[0].text;
			expect(text).toContain(expectedContent);
		}
	});

	it("should handle mixed case and duplicate frameworks", async () => {
		const result = await gapFrameworksAnalyzer({
			frameworks: ["capability", "capability"], // Duplicate should be handled
			currentState: "Current state",
			desiredState: "Desired state",
			context: "Test context",
		});

		const text = result.content[0].text;
		// Should contain capability analysis (duplicates handled by schema validation)
		expect(text).toContain("Capability Gap Analysis");
	});

	it("should properly format filename hints with complex framework combinations", async () => {
		const result = await gapFrameworksAnalyzer({
			frameworks: ["capability", "performance", "maturity", "skills"],
			currentState: "Current state",
			desiredState: "Desired state",
			context: "Complex analysis",
			includeMetadata: true,
		});

		const text = result.content[0].text;
		expect(text).toContain(
			"gap-analysis-capability-performance-maturity-skills.md",
		);
	});
});
