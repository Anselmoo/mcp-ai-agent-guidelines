import { describe, it, expect } from "vitest";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder.js";

describe("strategy-frameworks-builder additional coverage", () => {
	it("should handle all framework types with complex configurations", async () => {
		const result = await strategyFrameworksBuilder({
			frameworks: [
				"asIsToBe",
				"whereToPlayHowToWin", 
				"balancedScorecard",
				"swot",
				"objectives",
				"portersFiveForces",
				"mckinsey7S",
				"marketAnalysis",
				"strategyMap",
				"visionToMission",
				"stakeholderTheory",
				"values",
				"gapAnalysis",
				"ansoffMatrix",
				"pest",
				"bcgMatrix",
				"blueOcean",
				"scenarioPlanning",
				"vrio",
				"goalBasedPlanning",
				"gartnerQuadrant"
			],
			context: "Comprehensive strategic analysis for tech startup",
			objectives: ["Market penetration", "Product development", "Team scaling"],
			market: "SaaS B2B market",
			stakeholders: ["Investors", "Customers", "Employees", "Partners"],
			constraints: ["Limited funding", "Regulatory compliance", "Time to market"],
			includeReferences: true,
			includeMetadata: true,
			inputFile: "strategy-analysis.md"
		});

		expect(result).toHaveProperty("content");
		const content = result.content[0].text;
		expect(content).toContain("Strategy Toolkit"); // Check actual header
		
		// Check that some frameworks are mentioned (not all need exact text)
		expect(content).toContain("SWOT");
		expect(content).toContain("Five Forces");
		expect(content).toContain("7S");
		expect(content).toContain("Ansoff");
		expect(content).toContain("PEST");
		expect(content).toContain("Portfolio Prioritization"); // BCG matrix shows as Portfolio Prioritization 
		expect(content).toContain("VRIO");
	});

	it("should handle minimal configuration", async () => {
		const result = await strategyFrameworksBuilder({
			frameworks: ["swot"],
			context: "Basic analysis"
		});

		expect(result).toHaveProperty("content");
		expect(result.content[0].text).toContain("SWOT Analysis");
	});

	it("should include metadata when requested", async () => {
		const result = await strategyFrameworksBuilder({
			frameworks: ["swot", "pest"],
			context: "Analysis with metadata",
			includeMetadata: true,
			inputFile: "test-file.md"
		});

		const content = result.content[0].text;
		expect(content).toContain("## Metadata");
		expect(content).toContain("test-file.md");
	});

	it("should include references when requested", async () => {
		const result = await strategyFrameworksBuilder({
			frameworks: ["swot"],
			context: "Analysis with references",
			includeReferences: true
		});

		const content = result.content[0].text;
		expect(content).toContain("## References");
	});

	it("should handle empty objectives and constraints arrays", async () => {
		const result = await strategyFrameworksBuilder({
			frameworks: ["swot"],
			context: "Analysis with empty arrays",
			objectives: [],
			stakeholders: [],
			constraints: []
		});

		expect(result).toHaveProperty("content");
		expect(result.content[0].text).toContain("SWOT Analysis");
	});

	it("should handle all strategic frameworks comprehensively", async () => {
		// Test each framework individually to ensure coverage
		const frameworks = [
			"asIsToBe", "whereToPlayHowToWin", "balancedScorecard", "swot",
			"objectives", "portersFiveForces", "mckinsey7S", "marketAnalysis",
			"strategyMap", "visionToMission", "stakeholderTheory", "values",
			"gapAnalysis", "ansoffMatrix", "pest", "bcgMatrix", "blueOcean",
			"scenarioPlanning", "vrio", "goalBasedPlanning", "gartnerQuadrant"
		];

		for (const framework of frameworks) {
			const result = await strategyFrameworksBuilder({
				frameworks: [framework],
				context: `Testing ${framework} framework`,
				objectives: ["Test objective"],
				market: "Test market",
				stakeholders: ["Test stakeholder"],
				constraints: ["Test constraint"]
			});

			expect(result).toHaveProperty("content");
			expect(result.content[0].text.length).toBeGreaterThan(100);
		}
	});
});