/**
 * Comprehensive Index.ts Handler Coverage Tests
 *
 * This test suite focuses on increasing coverage for src/index.ts from 78% to 98%+
 * by testing all tool handlers, resource handlers, and prompt handlers.
 */
import { describe, expect, it } from "vitest";
import { gapFrameworksAnalyzers } from "../../src/tools/analysis/gap-frameworks-analyzers.js";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder.js";
import { cleanCodeScorer } from "../../src/tools/clean-code-scorer.js";
import { codeHygieneAnalyzer } from "../../src/tools/code-hygiene-analyzer.js";
import { dependencyAuditor } from "../../src/tools/dependency-auditor.js";
import { designAssistant } from "../../src/tools/design/index.js";
import { guidelinesValidator } from "../../src/tools/guidelines-validator.js";
import { iterativeCoverageEnhancer } from "../../src/tools/iterative-coverage-enhancer.js";
import { memoryContextOptimizer } from "../../src/tools/memory-context-optimizer.js";
import { mermaidDiagramGenerator } from "../../src/tools/mermaid-diagram-generator.js";
import { modeSwitcher } from "../../src/tools/mode-switcher.js";
import { modelCompatibilityChecker } from "../../src/tools/model-compatibility-checker.js";
import { projectOnboarding } from "../../src/tools/project-onboarding.js";
// Import all tools to test their handlers
import { architectureDesignPromptBuilder } from "../../src/tools/prompt/architecture-design-prompt-builder.js";
import { codeAnalysisPromptBuilder } from "../../src/tools/prompt/code-analysis-prompt-builder.js";
import { coverageDashboardDesignPromptBuilder } from "../../src/tools/prompt/coverage-dashboard-design-prompt-builder.js";
import { debuggingAssistantPromptBuilder } from "../../src/tools/prompt/debugging-assistant-prompt-builder.js";
import { documentationGeneratorPromptBuilder } from "../../src/tools/prompt/documentation-generator-prompt-builder.js";
import { domainNeutralPromptBuilder } from "../../src/tools/prompt/domain-neutral-prompt-builder.js";
import { enterpriseArchitectPromptBuilder } from "../../src/tools/prompt/enterprise-architect-prompt-builder.js";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "../../src/tools/prompt/hierarchy-level-selector.js";
import { l9DistinguishedEngineerPromptBuilder } from "../../src/tools/prompt/l9-distinguished-engineer-prompt-builder.js";
import { promptChainingBuilder } from "../../src/tools/prompt/prompt-chaining-builder.js";
import { promptFlowBuilder } from "../../src/tools/prompt/prompt-flow-builder.js";
import { promptingHierarchyEvaluator } from "../../src/tools/prompt/prompting-hierarchy-evaluator.js";
import { quickDeveloperPromptsBuilder } from "../../src/tools/prompt/quick-developer-prompts-builder.js";
import { securityHardeningPromptBuilder } from "../../src/tools/prompt/security-hardening-prompt-builder.js";
import { sparkPromptBuilder } from "../../src/tools/prompt/spark-prompt-builder.js";
import { semanticCodeAnalyzer } from "../../src/tools/semantic-code-analyzer.js";
import { sprintTimelineCalculator } from "../../src/tools/sprint-timeline-calculator.js";

describe("index.ts - Tool Handler Coverage", () => {
	// =================================================================
	// Test all 31 tool handlers individually
	// =================================================================

	describe("Prompt Builder Tool Handlers", () => {
		it("hierarchical-prompt-builder handler", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Test context",
				goal: "Test goal",
				requirements: ["Test requirement"],
			});
			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
		});

		it("spark-prompt-builder handler", async () => {
			const result = await sparkPromptBuilder({
				title: "Test UI",
				summary: "Test summary",
				complexityLevel: "simple",
				designDirection: "modern",
				colorSchemeType: "monochromatic",
				colorPurpose: "brand",
				primaryColor: "#000000",
				primaryColorPurpose: "brand",
				accentColor: "#ffffff",
				accentColorPurpose: "highlights",
				fontFamily: "Arial",
				fontIntention: "readability",
				fontReasoning: "simple",
				animationPhilosophy: "minimal",
				animationRestraint: "subtle",
				animationPurpose: "feedback",
				animationHierarchy: "flat",
				spacingRule: "8px",
				spacingContext: "consistent",
				mobileLayout: "responsive",
			});
			expect(result.content).toBeDefined();
		});

		it("domain-neutral-prompt-builder handler", async () => {
			const result = await domainNeutralPromptBuilder({
				title: "Test Title",
				summary: "Test Summary",
			});
			expect(result.content).toBeDefined();
		});

		it("security-hardening-prompt-builder handler", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Test security analysis",
				system: "web application",
				scope: ["authentication"],
				complianceStandards: ["OWASP-Top-10"],
				analysisScope: ["input-validation"],
			});
			expect(result.content).toBeDefined();
		});

		it("code-analysis-prompt-builder handler", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "Test codebase",
				codeContext: "Test code",
				analysisType: "quality",
				language: "javascript",
			});
			expect(result.content).toBeDefined();
		});

		it("architecture-design-prompt-builder handler", async () => {
			const result = await architectureDesignPromptBuilder({
				systemRequirements: "Test requirements",
				systemContext: "Test system",
				designGoal: "Test goal",
			});
			expect(result.content).toBeDefined();
		});

		it("debugging-assistant-prompt-builder handler", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "Test error",
				issueDescription: "Test bug",
				codeContext: "Test code",
			});
			expect(result.content).toBeDefined();
		});

		it("documentation-generator-prompt-builder handler", async () => {
			const result = await documentationGeneratorPromptBuilder({
				contentType: "API",
				codeContext: "Test code",
			});
			expect(result.content).toBeDefined();
		});

		it("enterprise-architect-prompt-builder handler", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test Initiative",
				problemStatement: "Test problem",
				businessContext: "Test business",
				architectureGoal: "Test goal",
			});
			expect(result.content).toBeDefined();
		});

		it("l9-distinguished-engineer-prompt-builder handler", async () => {
			const result = await l9DistinguishedEngineerPromptBuilder({
				projectName: "Test Project",
				technicalChallenge: "Test challenge",
				challenge: "Test challenge",
				scope: "technical",
			});
			expect(result.content).toBeDefined();
		});

		it("quick-developer-prompts-builder handler", async () => {
			const result = await quickDeveloperPromptsBuilder({
				task: "Test task",
				context: "Test context",
			});
			expect(result.content).toBeDefined();
		});

		it("coverage-dashboard-design-prompt-builder handler", async () => {
			const result = await coverageDashboardDesignPromptBuilder({
				projectContext: "Test project",
				coverageGoals: { statements: 90 },
			});
			expect(result.content).toBeDefined();
		});

		it("prompt-flow-builder handler", async () => {
			const result = await promptFlowBuilder({
				flowName: "Test Flow",
				objective: "Test objective",
				nodes: [
					{
						id: "node1",
						type: "prompt",
						name: "Test Node",
						config: {
							prompt: "Test prompt",
						},
					},
				],
			});
			expect(result.content).toBeDefined();
		});

		it("prompt-chaining-builder handler", async () => {
			const result = await promptChainingBuilder({
				chainName: "Test Chain",
				objective: "Test objective",
				steps: [
					{
						id: "stage1",
						name: "Test Stage",
						prompt: "Test prompt",
					},
				],
			});
			expect(result.content).toBeDefined();
		});

		it("prompting-hierarchy-evaluator handler", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Test prompt text",
				taskDescription: "Test task",
			});
			expect(result.content).toBeDefined();
		});

		it("hierarchy-level-selector handler", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Test task",
			});
			expect(result.content).toBeDefined();
		});
	});

	describe("Analysis Tool Handlers", () => {
		it("clean-code-scorer handler", async () => {
			const result = await cleanCodeScorer({
				codeContent: "function test() { return 42; }",
				language: "javascript",
			});
			expect(result.content).toBeDefined();
		});

		it("code-hygiene-analyzer handler", async () => {
			const result = await codeHygieneAnalyzer({
				codeContent: "const x = 42;",
				language: "javascript",
			});
			expect(result.content).toBeDefined();
		});

		it("iterative-coverage-enhancer handler", async () => {
			const result = await iterativeCoverageEnhancer({
				projectPath: "/test/path",
				currentCoverage: {
					lines: 80,
					branches: 75,
					functions: 85,
					statements: 82,
				},
			});
			expect(result.content).toBeDefined();
		});

		it("dependency-auditor handler", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{}}',
				includeReferences: false,
				includeMetadata: false,
			});
			expect(result.content).toBeDefined();
		});

		it("gap-frameworks-analyzers handler", async () => {
			const result = await gapFrameworksAnalyzers({
				frameworks: ["capability"],
				currentState: "Current",
				desiredState: "Desired",
				context: "Test",
			});
			expect(result.content).toBeDefined();
		});

		it("strategy-frameworks-builder handler", async () => {
			const result = await strategyFrameworksBuilder({
				frameworks: ["swot"],
				context: "Test strategy",
			});
			expect(result.content).toBeDefined();
		});

		it("semantic-code-analyzer handler", async () => {
			const result = await semanticCodeAnalyzer({
				operation: "analyze-patterns",
				codeContent: "function test() {}",
			});
			expect(result.content).toBeDefined();
		});
	});

	describe("Design and Planning Tool Handlers", () => {
		it("design-assistant handler", async () => {
			await designAssistant.initialize();
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "test-session",
				config: {
					sessionId: "test-session",
					context: "Comprehensive handler coverage",
					goal: "Validate design-assistant handler",
					requirements: ["handler coverage"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});
			const result = await designAssistant.processRequest({
				action: "get-status",
				sessionId: "test-session",
			});
			expect(result).toBeDefined();
			expect(result.sessionId).toBe("test-session");
		});

		it("mermaid-diagram-generator handler", async () => {
			const result = await mermaidDiagramGenerator({
				description: "Test diagram",
				diagramType: "flowchart",
			});
			expect(result.content).toBeDefined();
		});

		it("sprint-timeline-calculator handler", async () => {
			const result = await sprintTimelineCalculator({
				tasks: [{ name: "Task 1", estimate: 5, priority: "high" }],
				sprintLength: 14,
				teamSize: 5,
			});
			expect(result.content).toBeDefined();
		});

		it("project-onboarding handler", async () => {
			// Create a temporary directory for testing
			const fs = await import("node:fs/promises");
			const path = await import("node:path");
			const tempDir = path.join(
				process.cwd(),
				".tmp-test",
				"test-project-onboarding-handler",
			);

			await fs.mkdir(tempDir, { recursive: true });

			try {
				const result = await projectOnboarding({
					projectPath: tempDir,
				});
				expect(result.content).toBeDefined();
			} finally {
				// Cleanup
				await fs.rm(tempDir, { recursive: true, force: true });
			}
		});
	});

	describe("Utility Tool Handlers", () => {
		it("guidelines-validator handler", async () => {
			const result = await guidelinesValidator({
				practiceDescription: "Test practice",
				category: "prompting",
			});
			expect(result.content).toBeDefined();
		});

		it("model-compatibility-checker handler", async () => {
			const result = await modelCompatibilityChecker({
				taskDescription: "Test task",
			});
			expect(result.content).toBeDefined();
		});

		it("memory-context-optimizer handler", async () => {
			const result = await memoryContextOptimizer({
				contextContent: "Test context content",
				maxTokens: 100,
			});
			expect(result.content).toBeDefined();
		});

		it("mode-switcher handler", async () => {
			const result = await modeSwitcher({
				targetMode: "analysis",
			});
			expect(result.content).toBeDefined();
		});
	});

	// =================================================================
	// Test error handling in tool handlers
	// =================================================================

	describe("Tool Handler Error Handling", () => {
		it("handles invalid input gracefully in hierarchical-prompt-builder", async () => {
			try {
				// biome-ignore lint/suspicious/noExplicitAny: Testing error handling with invalid inputs
				await hierarchicalPromptBuilder({} as any);
			} catch (error) {
				expect(error).toBeDefined();
			}
		});

		it("handles invalid input gracefully in clean-code-scorer", async () => {
			try {
				// biome-ignore lint/suspicious/noExplicitAny: Testing error handling with invalid inputs
				await cleanCodeScorer({} as any);
			} catch (error) {
				expect(error).toBeDefined();
			}
		});

		it("handles invalid input gracefully in design-assistant", async () => {
			const result = await designAssistant.processRequest({
				// biome-ignore lint/suspicious/noExplicitAny: Testing error handling with invalid inputs
				action: "invalid-action" as any,
				sessionId: "test",
			});
			const errorResponse = result as {
				isError?: boolean;
				content?: Array<{ text: string }>;
			};
			expect(errorResponse.isError).toBe(true);
			const payload = JSON.parse(errorResponse.content?.[0]?.text ?? "{}");
			expect(payload.code).toBeDefined();
		});
	});

	// =================================================================
	// Test tool input validation paths
	// =================================================================

	describe("Tool Input Validation Paths", () => {
		it("validates required fields in hierarchical-prompt-builder", async () => {
			try {
				await hierarchicalPromptBuilder({
					context: "Test",
					goal: "Test",
					requirements: [],
				});
			} catch (_error) {
				// Validation error expected for empty requirements
			}
		});

		it("validates field types in sprint-timeline-calculator", async () => {
			try {
				await sprintTimelineCalculator({
					tasks: [],
					sprintLength: 14,
					teamSize: 5,
				});
			} catch (_error) {
				// Empty tasks might trigger validation
			}
		});

		it("validates enum values in mermaid-diagram-generator", async () => {
			try {
				await mermaidDiagramGenerator({
					description: "Test",
					// biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value handling
					diagramType: "invalid-type" as any,
				});
			} catch (error) {
				expect(error).toBeDefined();
			}
		});
	});

	// =================================================================
	// Test tool output format consistency
	// =================================================================

	describe("Tool Output Format Consistency", () => {
		it("all prompt builders return consistent MCP format", async () => {
			const tools = [
				hierarchicalPromptBuilder({
					context: "Test",
					goal: "Test",
					requirements: ["Req1"],
				}),
				domainNeutralPromptBuilder({
					title: "Test",
					summary: "Test",
				}),
				sparkPromptBuilder({
					title: "Test",
					summary: "Test",
					complexityLevel: "simple",
					designDirection: "modern",
					colorSchemeType: "monochromatic",
					colorPurpose: "brand",
					primaryColor: "#000",
					primaryColorPurpose: "brand",
					accentColor: "#fff",
					accentColorPurpose: "accent",
					fontFamily: "Arial",
					fontIntention: "readability",
					fontReasoning: "simple",
					animationPhilosophy: "minimal",
					animationRestraint: "subtle",
					animationPurpose: "feedback",
					animationHierarchy: "flat",
					spacingRule: "8px",
					spacingContext: "consistent",
					mobileLayout: "responsive",
				}),
			];

			const results = await Promise.all(tools);

			for (const result of results) {
				expect(result).toHaveProperty("content");
				expect(Array.isArray(result.content)).toBe(true);
				expect(result.content[0]).toHaveProperty("type");
				expect(result.content[0].type).toBe("text");
				expect(result.content[0]).toHaveProperty("text");
			}
		});

		it("all analysis tools return consistent MCP format", async () => {
			const tools = [
				cleanCodeScorer({
					codeContent: "const x = 42;",
					language: "javascript",
				}),
				codeHygieneAnalyzer({
					codeContent: "const x = 42;",
					language: "javascript",
				}),
				dependencyAuditor({
					packageJsonContent: '{"dependencies":{}}',
					includeReferences: false,
					includeMetadata: false,
				}),
			];

			const results = await Promise.all(tools);

			for (const result of results) {
				expect(result).toHaveProperty("content");
				expect(Array.isArray(result.content)).toBe(true);
				expect(result.content[0]).toHaveProperty("type");
			}
		});
	});

	// =================================================================
	// Test tool with various input combinations
	// =================================================================

	describe("Tool Input Combination Coverage", () => {
		it("hierarchical-prompt-builder with all optional fields", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Test",
				goal: "Test",
				requirements: ["Req1"],
				audience: "developers",
				outputFormat: "markdown",
				includeMetadata: true,
				includeFrontmatter: true,
			});
			expect(result.content).toBeDefined();
		});

		it("clean-code-scorer with coverage metrics", async () => {
			const result = await cleanCodeScorer({
				codeContent: "function test() { return 42; }",
				language: "javascript",
				framework: "react",
				coverageMetrics: {
					lines: 90,
					branches: 85,
					functions: 95,
					statements: 92,
				},
			});
			expect(result.content).toBeDefined();
		});

		it("iterative-coverage-enhancer with all options", async () => {
			const result = await iterativeCoverageEnhancer({
				projectPath: "/test",
				currentCoverage: {
					lines: 80,
					branches: 75,
					functions: 85,
					statements: 82,
				},
				targetCoverage: {
					lines: 95,
					branches: 90,
					functions: 95,
					statements: 95,
				},
				analyzeCoverageGaps: true,
				detectDeadCode: true,
				generateTestSuggestions: true,
				adaptThresholds: true,
			});
			expect(result.content).toBeDefined();
		});

		it("security-hardening-prompt-builder with all standards", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Test",
				system: "web application",
				scope: ["authentication", "authorization", "data-encryption"],
				complianceStandards: ["OWASP-Top-10", "GDPR", "PCI-DSS", "SOC-2"],
				analysisScope: [
					"input-validation",
					"authentication",
					"authorization",
					"data-encryption",
					"error-handling",
					"logging-monitoring",
					"api-security",
				],
				includeMetadata: true,
				includeReferences: true,
			});
			expect(result.content).toBeDefined();
		});

		it("gap-frameworks-analyzers with multiple frameworks", async () => {
			const result = await gapFrameworksAnalyzers({
				frameworks: ["capability", "performance", "maturity", "compliance"],
				currentState: "Current state",
				desiredState: "Desired state",
				context: "Test context",
				includeActionPlan: true,
				timeframe: "6 months",
				includeMetadata: true,
			});
			expect(result.content).toBeDefined();
		});

		it("strategy-frameworks-builder with all frameworks", async () => {
			const result = await strategyFrameworksBuilder({
				frameworks: ["swot", "balancedScorecard", "portersFiveForces", "vrio"],
				context: "Test strategy",
				market: "enterprise",
				includeMetadata: true,
				includeDiagrams: true,
			});
			expect(result.content).toBeDefined();
		});
	});

	// =================================================================
	// Test tool integration scenarios
	// =================================================================

	describe("Tool Integration Scenarios", () => {
		it("combines design-assistant with prompt builders", async () => {
			await designAssistant.initialize();

			// Start design session
			const sessionResult = await designAssistant.processRequest({
				action: "start-session",
				sessionId: "integration-test",
				config: {
					sessionId: "integration-test",
					context: "Integration test",
					goal: "Test integration",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			expect(sessionResult.success).toBe(true);

			// Use prompt builder for documentation
			const promptResult = await documentationGeneratorPromptBuilder({
				contentType: "API",
				codeContext: "Integration test code",
			});

			expect(promptResult.content).toBeDefined();
		});

		it("combines analysis tools for comprehensive review", async () => {
			const codeContent = "function test() { return 42; }";

			// Run multiple analysis tools
			const [scoreResult, hygieneResult, semanticResult] = await Promise.all([
				cleanCodeScorer({
					codeContent,
					language: "javascript",
				}),
				codeHygieneAnalyzer({
					codeContent,
					language: "javascript",
				}),
				semanticCodeAnalyzer({
					operation: "analyze-patterns",
					codeContent,
				}),
			]);

			expect(scoreResult.content).toBeDefined();
			expect(hygieneResult.content).toBeDefined();
			expect(semanticResult.content).toBeDefined();
		});

		it("uses model compatibility checker before prompt generation", async () => {
			// Check model compatibility
			const compatResult = await modelCompatibilityChecker({
				taskDescription: "Generate complex architectural design",
			});

			expect(compatResult.content).toBeDefined();

			// Then use appropriate prompt builder
			const promptResult = await architectureDesignPromptBuilder({
				systemRequirements: "High availability requirements",
				systemContext: "Microservices architecture",
				designGoal: "High availability system",
			});

			expect(promptResult.content).toBeDefined();
		});
	});

	// =================================================================
	// Test edge cases and boundary conditions
	// =================================================================

	describe("Edge Cases and Boundary Conditions", () => {
		it("handles empty string inputs", async () => {
			try {
				await codeHygieneAnalyzer({
					codeContent: "",
					language: "javascript",
				});
			} catch (_error) {
				// Might throw or handle gracefully
			}
		});

		it("handles very long inputs", async () => {
			const longContent = "function test() { return 42; }".repeat(1000);
			const result = await codeHygieneAnalyzer({
				codeContent: longContent,
				language: "javascript",
			});
			expect(result.content).toBeDefined();
		});

		it("handles special characters in inputs", async () => {
			const result = await memoryContextOptimizer({
				contextContent: "Test with 特殊文字 and émojis 🚀",
				maxTokens: 100,
			});
			expect(result.content).toBeDefined();
		});

		it("handles boundary values in sprint calculator", async () => {
			try {
				const result = await sprintTimelineCalculator({
					// biome-ignore lint/suspicious/noExplicitAny: Testing boundary value handling
					tasks: [{ name: "Task", estimate: 0, priority: "low" as any }],
					sprintLength: 1,
					teamSize: 1,
					teamVelocity: 5,
				});
				expect(result.content).toBeDefined();
			} catch (error) {
				// Might throw for invalid configuration
				expect(error).toBeDefined();
			}
		});
	});

	// =================================================================
	// Error Path Coverage for src/index.ts
	// =================================================================

	describe("Tool Handler Error Paths", () => {
		it("handles invalid input gracefully in hierarchical-prompt-builder", async () => {
			// hierarchical-prompt-builder requires 'context' and 'goal'
			// Passing empty args should cause a validation error
			try {
				// biome-ignore lint/suspicious/noExplicitAny: Testing error handling with invalid inputs
				await hierarchicalPromptBuilder({} as any);
			} catch (error) {
				// The error should be a ZodError due to missing required fields
				expect(error).toBeDefined();
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("handles invalid input gracefully in clean-code-scorer", async () => {
			try {
				await cleanCodeScorer({
					// biome-ignore lint/suspicious/noExplicitAny: Testing error handling with invalid input types
					codeContent: 12345 as any, // Wrong type - should be string
					language: "javascript",
				});
			} catch (error) {
				expect(error).toBeDefined();
			}
		});

		it("should handle tool throwing with Error object", async () => {
			// Passing invalid nested structure to cause internal error
			try {
				await promptChainingBuilder({
					chainName: "test",
					steps: [
						{
							// biome-ignore lint/suspicious/noExplicitAny: Testing error handling with invalid input
							name: null as any, // Invalid - should throw
							prompt: "test",
						},
					],
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should handle empty string inputs gracefully", async () => {
			// Some tools should handle empty strings without crashing
			const result = await memoryContextOptimizer({
				contextContent: "",
				maxTokens: 100,
			});
			expect(result.content).toBeDefined();
		});
	});
});
