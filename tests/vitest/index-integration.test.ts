// MCP Server Index Tests - Testing main server functionality
import { beforeAll, describe, expect, it } from "vitest";
import { gapFrameworksAnalyzers } from "../../src/tools/analysis/gap-frameworks-analyzers.ts";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder.ts";
import { codeHygieneAnalyzer } from "../../src/tools/code-hygiene-analyzer.ts";
// Note: We can't directly test the server index since it sets up an MCP server,
// but we can test the tool imports and basic functionality through the design assistant
import { designAssistant } from "../../src/tools/design/index.ts";
import { guidelinesValidator } from "../../src/tools/guidelines-validator.ts";
import { memoryContextOptimizer } from "../../src/tools/memory-context-optimizer.ts";
import { mermaidDiagramGenerator } from "../../src/tools/mermaid-diagram-generator.ts";
import { modelCompatibilityChecker } from "../../src/tools/model-compatibility-checker.ts";
import { domainNeutralPromptBuilder } from "../../src/tools/prompt/domain-neutral-prompt-builder.ts";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder.ts";
import { securityHardeningPromptBuilder } from "../../src/tools/prompt/security-hardening-prompt-builder.ts";
import { sparkPromptBuilder } from "../../src/tools/prompt/spark-prompt-builder.ts";
import { sprintTimelineCalculator } from "../../src/tools/sprint-timeline-calculator.ts";

describe("MCP Server Index Integration", () => {
	beforeAll(async () => {
		// Initialize design assistant which is one of the main tools
		await designAssistant.initialize();
	});

	it("should have all tools imported correctly", () => {
		expect(designAssistant).toBeDefined();
		expect(codeHygieneAnalyzer).toBeDefined();
		expect(memoryContextOptimizer).toBeDefined();
		expect(mermaidDiagramGenerator).toBeDefined();
		expect(modelCompatibilityChecker).toBeDefined();
		expect(sprintTimelineCalculator).toBeDefined();
		expect(guidelinesValidator).toBeDefined();
		expect(hierarchicalPromptBuilder).toBeDefined();
		expect(sparkPromptBuilder).toBeDefined();
		expect(domainNeutralPromptBuilder).toBeDefined();
		expect(securityHardeningPromptBuilder).toBeDefined();
		expect(gapFrameworksAnalyzers).toBeDefined();
		expect(strategyFrameworksBuilder).toBeDefined();
	});

	it("should test design assistant functionality", async () => {
		await designAssistant.processRequest({
			action: "start-session",
			sessionId: "index-test-session",
			config: {
				sessionId: "index-test-session",
				context: "Index integration test",
				goal: "Verify design assistant tool wiring",
				requirements: ["basic status"],
				constraints: [],
				coverageThreshold: 80,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});
		const response = await designAssistant.processRequest({
			action: "get-status",
			sessionId: "index-test-session",
		});

		expect(response).toBeDefined();
		expect(response.success).toBe(true);
		expect(response.sessionId).toBe("index-test-session");
	});

	it("should test code hygiene analyzer", async () => {
		const testCode = `
function testFunction() {
	console.log("Hello World");
	// TODO: Remove this debug code
	var oldVar = "legacy";
	return oldVar;
}
`;

		const result = await codeHygieneAnalyzer({
			codeContent: testCode,
			language: "javascript",
			framework: "vanilla",
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
		expect(result.content[0].type).toBe("text");
		const text = result.content[0].text;
		expect(text).toContain("Code Hygiene Analysis");
	});

	it("should test memory context optimizer", async () => {
		const testContext = "This is a test context for memory optimization";

		const result = await memoryContextOptimizer({
			contextContent: testContext,
			maxTokens: 50,
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
		expect(result.content[0].type).toBe("text");
	});

	it("should test mermaid diagram generator", async () => {
		const testDescription =
			"Create a flowchart showing user authentication process";

		const result = await mermaidDiagramGenerator({
			description: testDescription,
			diagramType: "flowchart",
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
		expect(result.content[0].type).toBe("text");
	});

	it("should test model compatibility checker", async () => {
		const result = await modelCompatibilityChecker({
			taskDescription: "Generate creative content with long context windows",
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
	});

	it("should test sprint timeline calculator", async () => {
		const testTasks = [
			{ name: "Task 1", estimate: 5, priority: "high" },
			{ name: "Task 2", estimate: 3, priority: "medium" },
		];

		const result = await sprintTimelineCalculator({
			tasks: testTasks,
			sprintLength: 14,
			teamSize: 5,
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
	});

	it("should test guidelines validator", async () => {
		const result = await guidelinesValidator({
			practiceDescription: "Using hierarchical prompting for complex AI tasks",
			category: "prompting",
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
	});

	it("should test hierarchical prompt builder", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "AI development",
			goal: "Build a task management system",
			requirements: ["User authentication", "Task creation"],
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
	});

	it("should test spark prompt builder", async () => {
		const result = await sparkPromptBuilder({
			title: "Test UI Design",
			summary: "Testing UI design prompt generation",
			complexityLevel: "medium",
			designDirection: "modern",
			colorSchemeType: "monochromatic",
			colorPurpose: "professional",
			primaryColor: "#2563eb",
			primaryColorPurpose: "brand identity",
			accentColor: "#7c3aed",
			accentColorPurpose: "highlights",
			fontFamily: "Inter",
			fontIntention: "readability",
			fontReasoning: "Clean and modern",
			animationPhilosophy: "subtle",
			animationRestraint: "minimal",
			animationPurpose: "feedback",
			animationHierarchy: "progressive",
			spacingRule: "8px grid",
			spacingContext: "consistent spacing",
			mobileLayout: "responsive",
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
	});

	it("should test domain neutral prompt builder", async () => {
		const result = await domainNeutralPromptBuilder({
			title: "Test Domain Neutral Prompt",
			summary: "Testing domain neutral prompt generation",
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
	});

	it("should test security hardening prompt builder", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Web application security analysis",
			system: "web application",
			scope: ["authentication", "authorization"],
			complianceStandards: ["OWASP-Top-10"],
			analysisScope: ["input-validation", "authentication", "authorization"],
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
	});

	it("should test gap frameworks analyzers", async () => {
		const result = await gapFrameworksAnalyzers({
			frameworks: ["capability"],
			currentState: "Basic functionality implemented",
			desiredState: "Full feature set with optimization",
			context: "Software development project",
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
	});

	it("should test strategy frameworks builder", async () => {
		const result = await strategyFrameworksBuilder({
			frameworks: ["swot"],
			context: "AI tool development",
		});

		expect(result).toBeDefined();
		expect(result.content).toBeInstanceOf(Array);
	});

	it("should handle error cases gracefully", async () => {
		// Test invalid requests to ensure error handling
		try {
			await codeHygieneAnalyzer({
				codeContent: "",
				language: "javascript",
			});
			// Should not throw for empty code
		} catch (_error) {
			// Error handling is acceptable
		}

		try {
			await memoryContextOptimizer({
				contextContent: "",
				maxTokens: 10,
			});
			// Should not throw for empty context
		} catch (_error) {
			// Error handling is acceptable
		}
	});

	it("should test tool integration scenarios", async () => {
		// Test a workflow that uses multiple tools

		// 1. Start with design assistant
		const designResponse = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "integration-test-session",
			config: {
				sessionId: "integration-test-session",
				context: "Integration testing",
				goal: "Test tool integration",
				requirements: ["Tool interoperability"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});

		expect(designResponse.success).toBe(true);

		// 2. Use mermaid generator for documentation
		const diagramResult = await mermaidDiagramGenerator({
			description: "Integration test workflow",
			diagramType: "flowchart",
		});

		expect(diagramResult.content).toBeDefined();

		// 3. Validate with guidelines validator
		const validationResult = await guidelinesValidator({
			practiceDescription: "Multi-tool integration workflow",
			category: "workflow",
		});

		expect(validationResult.content).toBeDefined();
	});

	it("should test prompt builders with various inputs", async () => {
		// Test hierarchical prompt with complex requirements
		const hierarchicalResult = await hierarchicalPromptBuilder({
			context: "Enterprise software development",
			goal: "Build scalable microservices architecture",
			requirements: [
				"High availability",
				"Horizontal scaling",
				"Service discovery",
				"Load balancing",
			],
			audience: "senior developers",
			outputFormat: "detailed specification",
		});

		expect(hierarchicalResult.content).toBeInstanceOf(Array);
		expect(hierarchicalResult.content[0].text.length).toBeGreaterThan(100);

		// Test domain neutral with metadata
		const domainNeutralResult = await domainNeutralPromptBuilder({
			title: "Complex Domain Analysis",
			summary: "Multi-domain analysis with cross-cutting concerns",
			includeMetadata: true,
			includeFrontmatter: true,
		});

		expect(domainNeutralResult.content).toBeInstanceOf(Array);
	});

	it("should test analysis tools with complex scenarios", async () => {
		// Test gap analysis with multiple frameworks
		const gapResult = await gapFrameworksAnalyzers({
			frameworks: ["capability", "performance", "maturity"],
			currentState: "Initial implementation with basic features",
			desiredState: "Production-ready system with advanced capabilities",
			context: "Enterprise application development",
			includeActionPlan: true,
			timeframe: "6 months",
		});

		expect(gapResult.content).toBeInstanceOf(Array);

		// Test strategy analysis with comprehensive frameworks
		const strategyResult = await strategyFrameworksBuilder({
			frameworks: ["swot", "balancedScorecard", "portersFiveForces"],
			context: "AI development platform launch",
			market: "enterprise software",
			includeMetadata: true,
		});

		expect(strategyResult.content).toBeInstanceOf(Array);
	});

	it("should test memory optimization with various contexts", async () => {
		const contexts = [
			"Short context for testing",
			"Medium length context that contains more information and details about the testing process and methodology being used",
			"Very long context that contains extensive information about the testing process, methodology, implementation details, architectural considerations, performance requirements, scalability concerns, security implications, and various other aspects that need to be considered during the development and testing phases of the project",
		];

		for (const context of contexts) {
			const result = await memoryContextOptimizer({
				contextContent: context,
				maxTokens: 100,
			});

			expect(result.content).toBeInstanceOf(Array);
		}
	});
});
