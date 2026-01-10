/**
 * Tests for Code Review Chain Workflow
 *
 * @module tests/agents/workflows/code-review-chain
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AgentDefinition,
	AgentOrchestrator,
	agentRegistry,
	codeReviewChainWorkflow,
} from "../../../../src/agents/index.js";

describe("codeReviewChainWorkflow", () => {
	let orchestrator: AgentOrchestrator;
	let mockToolExecutor: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		orchestrator = new AgentOrchestrator();
		mockToolExecutor = vi.fn();
		orchestrator.setToolExecutor(mockToolExecutor);
		agentRegistry.clear();

		// Register required agents
		const codeScorerAgent: AgentDefinition = {
			name: "code-scorer",
			description: "Analyzes code quality",
			capabilities: ["code-analysis", "quality-metrics"],
			inputSchema: {},
			toolName: "clean-code-scorer",
		};

		const securityAgent: AgentDefinition = {
			name: "security-analyzer",
			description: "Security analysis",
			capabilities: ["security", "compliance"],
			inputSchema: {},
			toolName: "security-hardening-prompt-builder",
		};

		const docAgent: AgentDefinition = {
			name: "documentation-generator",
			description: "Generates documentation",
			capabilities: ["documentation"],
			inputSchema: {},
			toolName: "documentation-generator",
		};

		agentRegistry.registerAgent(codeScorerAgent);
		agentRegistry.registerAgent(securityAgent);
		agentRegistry.registerAgent(docAgent);
	});

	afterEach(() => {
		agentRegistry.clear();
		vi.clearAllMocks();
	});

	describe("workflow definition", () => {
		it("should have correct name and description", () => {
			expect(codeReviewChainWorkflow.name).toBe("code-review-chain");
			expect(codeReviewChainWorkflow.description).toContain("quality scoring");
			expect(codeReviewChainWorkflow.description).toContain(
				"security analysis",
			);
			expect(codeReviewChainWorkflow.description).toContain("documentation");
		});

		it("should have three steps in correct order", () => {
			expect(codeReviewChainWorkflow.steps).toHaveLength(3);
			expect(codeReviewChainWorkflow.steps[0].agent).toBe("code-scorer");
			expect(codeReviewChainWorkflow.steps[1].agent).toBe("security-analyzer");
			expect(codeReviewChainWorkflow.steps[2].agent).toBe(
				"documentation-generator",
			);
		});

		it("should have correct input mappings", () => {
			const step2 = codeReviewChainWorkflow.steps[1];
			const step3 = codeReviewChainWorkflow.steps[2];

			expect(step2.inputMapping).toBeDefined();
			expect(step2.inputMapping?.codeContext).toBe("_initial.codeContext");

			expect(step3.inputMapping).toBeDefined();
			expect(step3.inputMapping?.projectPath).toBe("_initial.projectPath");
			expect(step3.inputMapping?.analysisResults).toBe("code-scorer");
			expect(step3.inputMapping?.securityResults).toBe("security-analyzer");
		});
	});

	describe("workflow execution", () => {
		it("should execute complete code review chain", async () => {
			const scorerOutput = {
				overallScore: 85,
				breakdown: {
					hygiene: 25,
					coverage: 22,
					typescript: 18,
					documentation: 12,
					security: 8,
				},
				recommendations: ["Improve test coverage", "Add JSDoc comments"],
			};

			const securityOutput = {
				prompt: "Security analysis prompt for OWASP compliance",
				findings: [],
			};

			const docOutput = {
				prompt: "Documentation generation prompt",
				suggestions: ["Add API documentation", "Update README"],
			};

			mockToolExecutor
				.mockResolvedValueOnce(scorerOutput)
				.mockResolvedValueOnce(securityOutput)
				.mockResolvedValueOnce(docOutput);

			const input = {
				projectPath: "/path/to/project",
				coverageMetrics: {
					lines: 85,
					branches: 80,
					functions: 90,
					statements: 85,
				},
				codeContext: "Authentication module implementation",
			};

			const result = await orchestrator.executeWorkflow(
				codeReviewChainWorkflow,
				input,
			);

			expect(result.success).toBe(true);
			expect(result.steps).toHaveLength(3);
			expect(result.outputs["code-scorer"]).toEqual(scorerOutput);
			expect(result.outputs["security-analyzer"]).toEqual(securityOutput);
			expect(result.outputs["documentation-generator"]).toEqual(docOutput);
		});

		it("should pass initial context to security analyzer", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ overallScore: 80 })
				.mockResolvedValueOnce({ findings: [] })
				.mockResolvedValueOnce({ suggestions: [] });

			const input = {
				projectPath: "/project",
				codeContext: "Payment processing module",
				coverageMetrics: {
					lines: 90,
					branches: 85,
					functions: 88,
					statements: 90,
				},
			};

			await orchestrator.executeWorkflow(codeReviewChainWorkflow, input);

			// Second call should be to security-analyzer with codeContext from initial
			expect(mockToolExecutor).toHaveBeenNthCalledWith(
				2,
				"security-hardening-prompt-builder",
				{
					codeContext: "Payment processing module",
				},
			);
		});

		it("should pass analysis results to documentation generator", async () => {
			const scorerOutput = {
				overallScore: 75,
				breakdown: {},
				recommendations: [],
			};
			const securityOutput = { findings: ["Missing input validation"] };

			mockToolExecutor
				.mockResolvedValueOnce(scorerOutput)
				.mockResolvedValueOnce(securityOutput)
				.mockResolvedValueOnce({ suggestions: [] });

			const input = {
				projectPath: "/my-project",
				codeContext: "API endpoints",
				coverageMetrics: {
					lines: 70,
					branches: 65,
					functions: 75,
					statements: 70,
				},
			};

			await orchestrator.executeWorkflow(codeReviewChainWorkflow, input);

			// Third call should be to documentation-generator with all results
			expect(mockToolExecutor).toHaveBeenNthCalledWith(
				3,
				"documentation-generator",
				{
					projectPath: "/my-project",
					analysisResults: scorerOutput,
					securityResults: securityOutput,
				},
			);
		});

		it("should stop execution if code scorer fails", async () => {
			mockToolExecutor.mockRejectedValueOnce(new Error("Code scoring failed"));

			const input = {
				projectPath: "/project",
				codeContext: "Module",
				coverageMetrics: {
					lines: 80,
					branches: 75,
					functions: 85,
					statements: 80,
				},
			};

			const result = await orchestrator.executeWorkflow(
				codeReviewChainWorkflow,
				input,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Workflow failed at step: code-scorer");
			expect(result.steps).toHaveLength(1);
			expect(result.steps[0].success).toBe(false);

			// Should not proceed to security analyzer or doc generator
			expect(mockToolExecutor).toHaveBeenCalledTimes(1);
		});

		it("should stop execution if security analyzer fails", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ overallScore: 90 })
				.mockRejectedValueOnce(new Error("Security analysis failed"));

			const input = {
				projectPath: "/project",
				codeContext: "Module",
				coverageMetrics: {
					lines: 95,
					branches: 90,
					functions: 92,
					statements: 94,
				},
			};

			const result = await orchestrator.executeWorkflow(
				codeReviewChainWorkflow,
				input,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"Workflow failed at step: security-analyzer",
			);
			expect(result.steps).toHaveLength(2);
			expect(result.steps[0].success).toBe(true);
			expect(result.steps[1].success).toBe(false);

			// Should not proceed to documentation generator
			expect(mockToolExecutor).toHaveBeenCalledTimes(2);
		});

		it("should record execution times for all steps", async () => {
			mockToolExecutor.mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return { result: "done" };
			});

			const input = {
				projectPath: "/project",
				codeContext: "Module",
				coverageMetrics: {
					lines: 85,
					branches: 80,
					functions: 90,
					statements: 85,
				},
			};

			const result = await orchestrator.executeWorkflow(
				codeReviewChainWorkflow,
				input,
			);

			expect(result.success).toBe(true);
			expect(result.executionTime).toBeGreaterThanOrEqual(0);
			expect(result.steps[0].executionTime).toBeGreaterThanOrEqual(0);
			expect(result.steps[1].executionTime).toBeGreaterThanOrEqual(0);
			expect(result.steps[2].executionTime).toBeGreaterThanOrEqual(0);
		});
	});

	describe("edge cases", () => {
		it("should handle missing optional fields in input", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ overallScore: 70 })
				.mockResolvedValueOnce({ findings: [] })
				.mockResolvedValueOnce({ suggestions: [] });

			// Minimal input without optional fields
			const input = {
				projectPath: "/project",
			};

			const result = await orchestrator.executeWorkflow(
				codeReviewChainWorkflow,
				input,
			);

			expect(result.success).toBe(true);
		});

		it("should preserve initial input in outputs", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ overallScore: 80 })
				.mockResolvedValueOnce({ findings: [] })
				.mockResolvedValueOnce({ suggestions: [] });

			const input = {
				projectPath: "/project",
				codeContext: "Test module",
				customField: "custom value",
			};

			const result = await orchestrator.executeWorkflow(
				codeReviewChainWorkflow,
				input,
			);

			expect(result.outputs._initial).toEqual(input);
		});
	});
});
