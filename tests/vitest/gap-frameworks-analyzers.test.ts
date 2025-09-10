import { describe, it, expect } from "vitest";
import { gapFrameworksAnalyzers } from "../../src/tools/analysis/gap-frameworks-analyzers.js";

describe("gap-frameworks-analyzers", () => {
	it("should generate a basic gap analysis", async () => {
		const result = await gapFrameworksAnalyzers({
			frameworks: ["capability", "performance"],
			currentState: "Manual processes with limited automation",
			desiredState: "Fully automated CI/CD pipeline with monitoring",
			context: "DevOps transformation for faster deployment cycles",
		});

		expect(result.content).toBeDefined();
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain("Gap Analysis Framework");
		expect(result.content[0].text).toContain("Capability Gap Analysis");
		expect(result.content[0].text).toContain("Performance Gap Analysis");
		expect(result.content[0].text).toContain("DevOps transformation for faster deployment cycles");
	});

	it("should generate analysis with all optional fields", async () => {
		const result = await gapFrameworksAnalyzers({
			frameworks: ["maturity", "skills", "technology"],
			currentState: "Legacy monolith system",
			desiredState: "Microservices architecture",
			context: "Digital transformation initiative",
			objectives: ["Improve scalability", "Reduce maintenance costs"],
			timeframe: "18 months",
			stakeholders: ["Development team", "Operations", "Product management"],
			constraints: ["Limited budget", "No downtime allowed"],
			includeReferences: true,
			includeMetadata: true,
			includeActionPlan: true,
			inputFile: "analysis-input.md",
		});

		const text = result.content[0].text;
		expect(text).toContain("Objectives:");
		expect(text).toContain("Improve scalability");
		expect(text).toContain("Timeframe: 18 months");
		expect(text).toContain("Stakeholders:");
		expect(text).toContain("Development team");
		expect(text).toContain("Constraints:");
		expect(text).toContain("Limited budget");
		expect(text).toContain("Maturity Gap Analysis");
		expect(text).toContain("Skills Gap Analysis");
		expect(text).toContain("Technology Gap Analysis");
		expect(text).toContain("Gap Closure Action Plan");
		expect(text).toContain("analysis-input.md");
	});

	it("should handle all supported framework types", async () => {
		const frameworks = [
			"capability", "performance", "maturity", "skills", "technology",
			"process", "market", "strategic", "operational", "cultural", 
			"security", "compliance"
		];

		const result = await gapFrameworksAnalyzers({
			frameworks,
			currentState: "Current state",
			desiredState: "Desired state",
			context: "Comprehensive analysis",
		});

		const text = result.content[0].text;
		expect(text).toContain("Capability Gap Analysis");
		expect(text).toContain("Performance Gap Analysis");
		expect(text).toContain("Maturity Gap Analysis");
		expect(text).toContain("Skills Gap Analysis");
		expect(text).toContain("Technology Gap Analysis");
		expect(text).toContain("Process Gap Analysis");
		expect(text).toContain("Market Gap Analysis");
		expect(text).toContain("Strategic Gap Analysis");
		expect(text).toContain("Operational Gap Analysis");
		expect(text).toContain("Cultural Gap Analysis");
		expect(text).toContain("Security Gap Analysis");
		expect(text).toContain("Compliance Gap Analysis");
	});

	it("should exclude optional sections when disabled", async () => {
		const result = await gapFrameworksAnalyzers({
			frameworks: ["capability"],
			currentState: "Current state",
			desiredState: "Desired state",
			context: "Minimal analysis",
			includeReferences: false,
			includeMetadata: false,
			includeActionPlan: false,
		});

		const text = result.content[0].text;
		expect(text).toContain("Capability Gap Analysis");
		expect(text).not.toContain("Gap Closure Action Plan");
		expect(text).not.toContain("### Metadata");
		expect(text).not.toContain("### References");
	});

	it("should generate appropriate filename hint", async () => {
		const result = await gapFrameworksAnalyzers({
			frameworks: ["capability", "security"],
			currentState: "Current state",
			desiredState: "Desired state",
			context: "Test analysis",
			includeMetadata: true,
		});

		const text = result.content[0].text;
		expect(text).toContain("gap-analysis-capability-security.md");
	});
});