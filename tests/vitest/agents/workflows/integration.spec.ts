/**
 * Integration Tests for Workflow Execution
 *
 * @module tests/agents/workflows/integration
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AgentDefinition,
	agentOrchestrator,
	agentRegistry,
	codeReviewChainWorkflow,
	designToSpecWorkflow,
	getWorkflow,
	listWorkflows,
} from "../../../../src/agents/index.js";

describe("Workflow Integration Tests", () => {
	let mockToolExecutor: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockToolExecutor = vi.fn();
		agentOrchestrator.setToolExecutor(mockToolExecutor);
		agentRegistry.clear();

		// Register all required agents
		const agents: AgentDefinition[] = [
			{
				name: "code-scorer",
				description: "Code quality analyzer",
				capabilities: ["code-analysis"],
				inputSchema: {},
				toolName: "clean-code-scorer",
			},
			{
				name: "security-analyzer",
				description: "Security analyzer",
				capabilities: ["security"],
				inputSchema: {},
				toolName: "security-hardening-prompt-builder",
			},
			{
				name: "documentation-generator",
				description: "Documentation generator",
				capabilities: ["documentation"],
				inputSchema: {},
				toolName: "documentation-generator",
			},
			{
				name: "design-assistant",
				description: "Design assistant",
				capabilities: ["design"],
				inputSchema: {},
				toolName: "design-assistant",
			},
		];

		for (const agent of agents) {
			agentRegistry.registerAgent(agent);
		}
	});

	afterEach(() => {
		agentRegistry.clear();
		vi.clearAllMocks();
	});

	describe("workflow discovery and execution", () => {
		it("should list all available workflows", () => {
			const workflows = listWorkflows();

			expect(workflows).toContain("code-review-chain");
			expect(workflows).toContain("design-to-spec");
		});

		it("should retrieve workflow by name and execute it", async () => {
			const workflow = getWorkflow("code-review-chain");
			expect(workflow).toBeDefined();

			if (!workflow) {
				throw new Error("Workflow not found");
			}

			mockToolExecutor
				.mockResolvedValueOnce({ overallScore: 90 })
				.mockResolvedValueOnce({ findings: [] })
				.mockResolvedValueOnce({ suggestions: [] });

			const input = {
				projectPath: "/test/project",
				codeContext: "Test module",
				coverageMetrics: {
					lines: 90,
					branches: 85,
					functions: 88,
					statements: 90,
				},
			};

			const result = await agentOrchestrator.executeWorkflow(workflow, input);

			expect(result.success).toBe(true);
			expect(result.steps).toHaveLength(3);
		});

		it("should execute code-review-chain workflow directly", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ overallScore: 85 })
				.mockResolvedValueOnce({ findings: ["Issue 1"] })
				.mockResolvedValueOnce({ suggestions: ["Suggestion 1"] });

			const input = {
				projectPath: "/project",
				codeContext: "API module",
				coverageMetrics: {
					lines: 85,
					branches: 80,
					functions: 90,
					statements: 85,
				},
			};

			const result = await agentOrchestrator.executeWorkflow(
				codeReviewChainWorkflow,
				input,
			);

			expect(result.success).toBe(true);
			expect(result.outputs["code-scorer"]).toEqual({ overallScore: 85 });
			expect(result.outputs["security-analyzer"]).toEqual({
				findings: ["Issue 1"],
			});
			expect(result.outputs["documentation-generator"]).toEqual({
				suggestions: ["Suggestion 1"],
			});
		});

		it("should execute design-to-spec workflow directly", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ sessionId: "s1", phase: "discovery" })
				.mockResolvedValueOnce({ sessionId: "s1", phase: "requirements" })
				.mockResolvedValueOnce({ artifacts: [{ type: "spec" }] });

			const input = {
				action: "start-session",
				sessionId: "s1",
				config: {
					context: "Test",
					goal: "Test goal",
					requirements: [],
					sessionId: "s1",
				},
				advanceAction: "advance-phase",
				targetPhase: "requirements",
				generateAction: "generate-artifacts",
				artifactTypes: ["specification"],
			};

			const result = await agentOrchestrator.executeWorkflow(
				designToSpecWorkflow,
				input,
			);

			expect(result.success).toBe(true);
			expect(result.steps).toHaveLength(3);
		});
	});

	describe("workflow orchestration with singleton orchestrator", () => {
		it("should use singleton orchestrator instance", async () => {
			mockToolExecutor.mockResolvedValue({ result: "ok" });

			const workflow = getWorkflow("code-review-chain");

			if (!workflow) {
				throw new Error("Workflow not found");
			}

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

			const result = await agentOrchestrator.executeWorkflow(workflow, input);

			expect(result.success).toBe(true);
			expect(mockToolExecutor).toHaveBeenCalled();
		});
	});

	describe("workflow error handling", () => {
		it("should handle workflow not found", () => {
			const workflow = getWorkflow("non-existent-workflow");
			expect(workflow).toBeUndefined();
		});

		it("should handle missing agents in workflow", async () => {
			agentRegistry.clear();

			const result = await agentOrchestrator.executeWorkflow(
				codeReviewChainWorkflow,
				{ projectPath: "/test" },
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Workflow failed");
		});
	});
});
