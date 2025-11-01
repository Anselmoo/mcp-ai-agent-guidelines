// Coverage Optimization Test - Focused on increasing function coverage for main user-facing tools
import { describe, expect, it } from "vitest";

// Import main tools that users interact with directly - using src imports for reliability
import { codeHygieneAnalyzer } from "../../src/tools/analysis/code-hygiene-analyzer.js";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder";
import { guidelinesValidator } from "../../src/tools/utility/guidelines-validator.js";
import { memoryContextOptimizer } from "../../src/tools/utility/memory-context-optimizer.js";
import { mermaidDiagramGenerator } from "../../src/tools/utility/mermaid-diagram-generator.js";
import { modelCompatibilityChecker } from "../../src/tools/utility/model-compatibility-checker.js";
import { sprintTimelineCalculator } from "../../src/tools/utility/sprint-timeline-calculator.js";

describe("Coverage Optimization - Core Tool Functions", () => {
	// Code Hygiene Analyzer - comprehensive testing to hit internal functions
	describe("Code Hygiene Analyzer Comprehensive", () => {
		it("should analyze different code types and languages", async () => {
			const testCases = [
				{
					language: "javascript",
					framework: "react",
					codeContent: `
import React, { useState } from 'react';
function Component() {
  const [state, setState] = useState();
  console.log('debug'); // Should be flagged
  return <div>Hello</div>;
}
export default Component;`,
				},
				{
					language: "typescript",
					framework: "node",
					codeContent: `
interface User {
  id: number;
  name: string;
}
function getUser(id: number): User | null {
  // TODO: implement
  return null;
}`,
				},
				{
					language: "python",
					framework: "django",
					codeContent: `
def process_data(data):
    print("Processing:", data)  # Debug statement
    return data
`,
				},
			];

			for (const testCase of testCases) {
				const result = await codeHygieneAnalyzer(testCase);
				expect(result).toBeDefined();
				expect(result.content).toBeInstanceOf(Array);
				expect(result.content.length).toBeGreaterThan(0);
			}
		});

		it("should handle different analysis configurations", async () => {
			const configurations = [
				{ includeReferences: true },
				{ includeReferences: false },
				{ language: "javascript" },
				{ language: "typescript" },
				{ language: "python" },
			];

			for (const config of configurations) {
				const result = await codeHygieneAnalyzer({
					codeContent: "function test() { console.log('test'); }",
					language: config.language || "javascript",
					...config,
				});
				expect(result).toBeDefined();
				expect(result.content).toBeInstanceOf(Array);
			}
		});
	});

	// Guidelines Validator - test different practice types
	describe("Guidelines Validator Comprehensive", () => {
		it("should validate different development practices", async () => {
			const practices = [
				{
					category: "prompting",
					description: "Using chain-of-thought prompting for complex reasoning",
				},
				{
					category: "code-management",
					description: "Following git flow branching strategy",
				},
				{
					category: "architecture",
					description: "Implementing microservices with proper separation",
				},
				{
					category: "workflow",
					description: "Using CI/CD pipelines for automated deployment",
				},
			];

			for (const practice of practices) {
				const result = await guidelinesValidator(practice);
				expect(result).toBeDefined();
				expect(result.content).toBeInstanceOf(Array);
				expect(result.content.length).toBeGreaterThan(0);
			}
		});
	});

	// Hierarchical Prompt Builder - test different prompt configurations
	describe("Hierarchical Prompt Builder Comprehensive", () => {
		it("should build prompts with various techniques and configurations", async () => {
			const promptConfigs = [
				{
					context: "Software development",
					goal: "Create a REST API",
					techniques: ["chain-of-thought", "few-shot"],
					provider: "claude-3.7",
					style: "markdown",
				},
				{
					context: "Data analysis",
					goal: "Analyze user behavior patterns",
					techniques: ["self-consistency", "generate-knowledge"],
					provider: "gpt-4.1",
					style: "xml",
					includeReferences: true,
				},
				{
					context: "UI/UX design",
					goal: "Design responsive interface",
					autoSelectTechniques: true,
					includePitfalls: true,
					includeTechniqueHints: true,
				},
			];

			for (const config of promptConfigs) {
				const result = await hierarchicalPromptBuilder(config);
				expect(result).toBeDefined();
				expect(result.content).toBeInstanceOf(Array);
				expect(result.content.length).toBeGreaterThan(0);
			}
		});
	});

	// Memory Context Optimizer - test different content sizes and strategies
	describe("Memory Context Optimizer Comprehensive", () => {
		it("should optimize different content types and sizes", async () => {
			const testContents = [
				{
					contextContent: "Short content for testing basic optimization.",
					maxTokens: 50,
				},
				{
					contextContent: `
Long technical documentation that needs to be optimized for memory usage.
This includes detailed explanations of complex algorithms, implementation details,
architectural decisions, and comprehensive examples that demonstrate usage patterns.
The content should be condensed while maintaining essential information.
`.repeat(10),
					maxTokens: 200,
				},
				{
					contextContent: "Medium length content with specific requirements.",
					maxTokens: 100,
					preserveStructure: true,
				},
			];

			for (const content of testContents) {
				const result = await memoryContextOptimizer(content);
				expect(result).toBeDefined();
				expect(result.content).toBeInstanceOf(Array);
				expect(result.content.length).toBeGreaterThan(0);
			}
		});
	});

	// Mermaid Diagram Generator - test all diagram types
	describe("Mermaid Diagram Generator Comprehensive", () => {
		it("should generate different types of diagrams", async () => {
			const diagramTypes = [
				{
					description: "User authentication flow",
					diagramType: "flowchart",
				},
				{
					description: "Database relationships",
					diagramType: "erDiagram",
				},
				{
					description: "System components",
					diagramType: "graph",
				},
				{
					description: "Process timeline",
					diagramType: "gantt",
				},
			];

			for (const diagram of diagramTypes) {
				const result = await mermaidDiagramGenerator(diagram);
				expect(result).toBeDefined();
				expect(result.content).toBeInstanceOf(Array);
				expect(result.content.length).toBeGreaterThan(0);
			}
		});
	});

	// Model Compatibility Checker - test different scenarios
	describe("Model Compatibility Checker Comprehensive", () => {
		it("should recommend models for different tasks and requirements", async () => {
			const scenarios = [
				{
					taskDescription: "Code generation and review",
					requirements: ["long context", "code understanding"],
					budget: "medium",
					includeCodeExamples: true,
					language: "typescript",
				},
				{
					taskDescription: "Creative writing and storytelling",
					requirements: ["creative output", "narrative flow"],
					budget: "high",
					includeReferences: true,
				},
				{
					taskDescription: "Data analysis and insights",
					requirements: ["analytical reasoning", "numerical processing"],
					budget: "low",
					includeCodeExamples: false,
				},
			];

			for (const scenario of scenarios) {
				const result = await modelCompatibilityChecker(scenario);
				expect(result).toBeDefined();
				expect(result.content).toBeInstanceOf(Array);
				expect(result.content.length).toBeGreaterThan(0);
			}
		});
	});

	// Sprint Timeline Calculator - test different project configurations
	describe("Sprint Timeline Calculator Comprehensive", () => {
		it("should calculate timelines for different project types", async () => {
			const projectTypes = [
				{
					tasks: [
						{ name: "Setup", estimate: 2, priority: "high" },
						{ name: "Development", estimate: 8, priority: "high" },
						{ name: "Testing", estimate: 3, priority: "medium" },
					],
					sprintLength: 14,
					teamSize: 3,
					includeBuffer: true,
				},
				{
					tasks: [
						{ name: "Research", estimate: 5, priority: "high" },
						{ name: "Design", estimate: 8, priority: "high" },
						{ name: "Implementation", estimate: 13, priority: "high" },
						{ name: "Documentation", estimate: 2, priority: "low" },
					],
					sprintLength: 21,
					teamSize: 5,
					includeRisks: true,
				},
			];

			for (const project of projectTypes) {
				const result = await sprintTimelineCalculator(project);
				expect(result).toBeDefined();
				expect(result.content).toBeInstanceOf(Array);
				expect(result.content.length).toBeGreaterThan(0);
			}
		});
	});

	// Cross-tool integration testing
	describe("Cross-Tool Integration Scenarios", () => {
		it("should handle workflow combining multiple tools", async () => {
			// Simulate a development workflow using multiple tools
			const codeAnalysis = await codeHygieneAnalyzer({
				codeContent: "function example() { /* TODO: implement */ }",
				language: "javascript",
			});

			const guidelineCheck = await guidelinesValidator({
				practiceDescription: "Code review before merge",
				category: "code-management",
			});

			const timeline = await sprintTimelineCalculator({
				tasks: [
					{ name: "Code review implementation", estimate: 5, priority: "high" },
				],
				sprintLength: 14,
				teamSize: 3,
			});

			// Verify all tools work together
			expect(codeAnalysis).toBeDefined();
			expect(guidelineCheck).toBeDefined();
			expect(timeline).toBeDefined();

			// Verify they all return proper content arrays
			expect(codeAnalysis.content).toBeInstanceOf(Array);
			expect(guidelineCheck.content).toBeInstanceOf(Array);
			expect(timeline.content).toBeInstanceOf(Array);
		});
	});
});
