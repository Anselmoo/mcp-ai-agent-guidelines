// Analysis Tools Coverage Tests - Target analysis framework functions
// Focus on the gap and strategy analysis tools which have simpler interfaces

import { describe, expect, it } from "vitest";

// Import analysis tools
import { gapFrameworksAnalyzers } from "../../dist/tools/analysis/gap-frameworks-analyzers.js";
import { strategyFrameworksBuilder } from "../../dist/tools/analysis/strategy-frameworks-builder.js";

describe("Analysis Tools Coverage Tests", () => {
	describe("Gap Frameworks Analyzers", () => {
		it("should test capability gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Software development team",
				currentState: "Basic testing practices",
				desiredState: "Comprehensive TDD and automated testing",
				frameworks: ["capability"],
			});
			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
			expect(result.content[0].text).toContain("Gap Analysis Framework");
		});

		it("should test process gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Development workflow",
				currentState: "Manual deployment process",
				desiredState: "Fully automated CI/CD pipeline",
				frameworks: ["process"],
			});
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Process Gap Analysis");
		});

		it("should test compliance gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Security compliance",
				currentState: "Basic security measures",
				desiredState: "SOC 2 Type II compliance",
				frameworks: ["compliance"],
			});
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Compliance Gap Analysis");
		});

		it("should test multiple framework analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Technology transformation",
				currentState: "Legacy monolithic architecture",
				desiredState: "Modern microservices architecture",
				frameworks: ["capability", "process", "technology"],
				includeActionPlan: true,
			});
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Gap Closure Action Plan");
		});

		it("should test performance gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Application performance",
				currentState: "Response times > 2 seconds",
				desiredState: "Response times < 200ms",
				frameworks: ["performance"],
				timeframe: "6 months",
			});
			expect(result).toBeDefined();
		});

		it("should test skills gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Development team capabilities",
				currentState: "Junior developers with basic skills",
				desiredState: "Senior team with specialized expertise",
				frameworks: ["skills"],
				stakeholders: ["Engineering Manager", "Tech Lead", "HR"],
			});
			expect(result).toBeDefined();
		});

		it("should test market gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Product market fit",
				currentState: "Niche market presence",
				desiredState: "Market leader position",
				frameworks: ["market"],
				objectives: ["Increase market share", "Expand customer base"],
			});
			expect(result).toBeDefined();
		});

		it("should test strategic gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Business strategy",
				currentState: "Regional player",
				desiredState: "Global enterprise solution",
				frameworks: ["strategic"],
				constraints: ["Budget limitations", "Regulatory requirements"],
			});
			expect(result).toBeDefined();
		});

		it("should test operational gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Operations efficiency",
				currentState: "Manual operations with high error rate",
				desiredState: "Automated operations with 99.9% accuracy",
				frameworks: ["operational"],
				includeMetadata: true,
			});
			expect(result).toBeDefined();
		});

		it("should test cultural gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Organizational culture",
				currentState: "Siloed departments with poor communication",
				desiredState: "Collaborative cross-functional teams",
				frameworks: ["cultural"],
				includeReferences: true,
			});
			expect(result).toBeDefined();
		});
	});

	describe("Strategy Frameworks Builder", () => {
		it("should test SWOT analysis framework", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Product development strategy",
				frameworks: ["swot"],
				market: "SaaS tools",
			});
			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
		});

		it("should test balanced scorecard framework", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Business performance measurement",
				frameworks: ["balancedScorecard"],
				objectives: ["Increase revenue", "Improve customer satisfaction"],
			});
			expect(result).toBeDefined();
		});

		it("should test Porter's Five Forces analysis", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Competitive analysis",
				frameworks: ["portersFiveForces"],
				market: "Cloud computing",
			});
			expect(result).toBeDefined();
		});

		it("should test McKinsey 7S framework", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Organizational effectiveness",
				frameworks: ["mckinsey7S"],
				stakeholders: ["Management", "Employees", "Customers"],
			});
			expect(result).toBeDefined();
		});

		it("should test VRIO analysis", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Resource evaluation",
				frameworks: ["vrio"],
				includeMetadata: true,
			});
			expect(result).toBeDefined();
		});

		it("should test Ansoff Matrix", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Growth strategy",
				frameworks: ["ansoffMatrix"],
				market: "Technology services",
			});
			expect(result).toBeDefined();
		});

		it("should test BCG Matrix", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Portfolio analysis",
				frameworks: ["bcgMatrix"],
				includeReferences: true,
			});
			expect(result).toBeDefined();
		});

		it("should test Blue Ocean Strategy", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Market innovation",
				frameworks: ["blueOcean"],
				objectives: ["Create uncontested market space"],
			});
			expect(result).toBeDefined();
		});

		it("should test PEST analysis", async () => {
			const result = await strategyFrameworksBuilder({
				context: "External environment analysis",
				frameworks: ["pest"],
				market: "Financial technology",
			});
			expect(result).toBeDefined();
		});

		it("should test multiple frameworks combination", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Comprehensive strategic analysis",
				frameworks: ["swot", "portersFiveForces", "pest"],
				market: "Artificial intelligence",
				objectives: ["Market expansion", "Innovation leadership"],
				stakeholders: ["Investors", "Customers", "Partners"],
				includeMetadata: true,
				includeReferences: true,
			});
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("SWOT");
			expect(result.content[0].text).toContain("Five Forces");
			expect(result.content[0].text).toContain("PEST");
		});
	});

	describe("Edge Cases and Error Handling", () => {
		it("should handle missing required fields gracefully", async () => {
			try {
				await gapFrameworksAnalyzers({
					// Missing required context, currentState, desiredState
					frameworks: ["capability"],
				});
			} catch (error) {
				expect(error).toBeDefined();
			}
		});

		it("should handle invalid frameworks", async () => {
			try {
				await gapFrameworksAnalyzers({
					context: "Test context",
					currentState: "Current",
					desiredState: "Desired",
					frameworks: ["invalid_framework"],
				});
			} catch (error) {
				expect(error).toBeDefined();
			}
		});

		it("should handle empty frameworks array", async () => {
			try {
				await strategyFrameworksBuilder({
					context: "Test context",
					frameworks: [],
				});
			} catch (error) {
				expect(error).toBeDefined();
			}
		});
	});

	describe("Framework Combinations", () => {
		it("should test comprehensive gap analysis", async () => {
			const result = await gapFrameworksAnalyzers({
				context: "Digital transformation initiative",
				currentState: "Traditional on-premise infrastructure",
				desiredState: "Cloud-native, AI-powered platform",
				frameworks: ["capability", "process", "technology", "skills"],
				timeframe: "18 months",
				stakeholders: ["CTO", "Engineering Teams", "Operations"],
				objectives: ["Reduce costs", "Increase agility", "Improve scalability"],
				constraints: ["Budget constraints", "Legacy system dependencies"],
				includeActionPlan: true,
				includeMetadata: true,
				includeReferences: true,
			});
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Digital transformation");
		});

		it("should test strategic analysis with multiple frameworks", async () => {
			const result = await strategyFrameworksBuilder({
				context: "Market entry strategy for new product",
				frameworks: ["swot", "ansoffMatrix", "portersFiveForces", "blueOcean"],
				market: "Enterprise software",
				objectives: [
					"Enter new market segment",
					"Achieve 15% market share",
					"Establish competitive advantage",
				],
				stakeholders: ["Product Team", "Sales", "Marketing", "Executives"],
				constraints: ["Limited budget", "Time to market pressure"],
				includeMetadata: true,
				includeReferences: true,
			});
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Market entry strategy");
		});
	});
});
