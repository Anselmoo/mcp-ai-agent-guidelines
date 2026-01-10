/**
 * Tests for Design to Spec Workflow
 *
 * @module tests/agents/workflows/design-to-spec
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AgentDefinition,
	AgentOrchestrator,
	agentRegistry,
	designToSpecWorkflow,
} from "../../../../src/agents/index.js";

describe("designToSpecWorkflow", () => {
	let orchestrator: AgentOrchestrator;
	let mockToolExecutor: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		orchestrator = new AgentOrchestrator();
		mockToolExecutor = vi.fn();
		orchestrator.setToolExecutor(mockToolExecutor);
		agentRegistry.clear();

		// Register design-assistant agent
		const designAgent: AgentDefinition = {
			name: "design-assistant",
			description: "Orchestrates multi-phase design workflows",
			capabilities: ["design", "architecture", "specification"],
			inputSchema: {},
			toolName: "design-assistant",
		};

		agentRegistry.registerAgent(designAgent);
	});

	afterEach(() => {
		agentRegistry.clear();
		vi.clearAllMocks();
	});

	describe("workflow definition", () => {
		it("should have correct name and description", () => {
			expect(designToSpecWorkflow.name).toBe("design-to-spec");
			expect(designToSpecWorkflow.description).toContain("design workflow");
			expect(designToSpecWorkflow.description).toContain("specification");
		});

		it("should have three steps all using design-assistant", () => {
			expect(designToSpecWorkflow.steps).toHaveLength(3);
			expect(designToSpecWorkflow.steps[0].agent).toBe("design-assistant");
			expect(designToSpecWorkflow.steps[1].agent).toBe("design-assistant");
			expect(designToSpecWorkflow.steps[2].agent).toBe("design-assistant");
		});

		it("should have correct input mappings for each step", () => {
			const step1 = designToSpecWorkflow.steps[0];
			const step2 = designToSpecWorkflow.steps[1];
			const step3 = designToSpecWorkflow.steps[2];

			// Step 1: start-session
			expect(step1.inputMapping).toBeDefined();
			expect(step1.inputMapping?.action).toBe("_initial.action");
			expect(step1.inputMapping?.sessionId).toBe("_initial.sessionId");
			expect(step1.inputMapping?.config).toBe("_initial.config");

			// Step 2: advance-phase
			expect(step2.inputMapping).toBeDefined();
			expect(step2.inputMapping?.action).toBe("_initial.advanceAction");
			expect(step2.inputMapping?.sessionId).toBe("_initial.sessionId");
			expect(step2.inputMapping?.phaseId).toBe("_initial.targetPhase");

			// Step 3: generate-artifacts
			expect(step3.inputMapping).toBeDefined();
			expect(step3.inputMapping?.action).toBe("_initial.generateAction");
			expect(step3.inputMapping?.sessionId).toBe("_initial.sessionId");
			expect(step3.inputMapping?.artifactTypes).toBe("_initial.artifactTypes");
		});
	});

	describe("workflow execution", () => {
		it("should execute complete design-to-spec workflow", async () => {
			const sessionOutput = {
				sessionId: "session-123",
				phase: "discovery",
				status: "started",
			};

			const advanceOutput = {
				sessionId: "session-123",
				phase: "requirements",
				status: "advanced",
			};

			const artifactsOutput = {
				sessionId: "session-123",
				artifacts: [
					{ type: "specification", content: "Spec content..." },
					{ type: "adr", content: "ADR content..." },
				],
			};

			mockToolExecutor
				.mockResolvedValueOnce(sessionOutput)
				.mockResolvedValueOnce(advanceOutput)
				.mockResolvedValueOnce(artifactsOutput);

			const input = {
				action: "start-session",
				sessionId: "session-123",
				config: {
					context: "E-commerce platform",
					goal: "Implement checkout flow",
					requirements: ["Payment processing", "Cart validation"],
					sessionId: "session-123",
					coverageThreshold: 85,
					enablePivots: true,
				},
				advanceAction: "advance-phase",
				targetPhase: "requirements",
				generateAction: "generate-artifacts",
				artifactTypes: ["specification", "adr"],
			};

			const result = await orchestrator.executeWorkflow(
				designToSpecWorkflow,
				input,
			);

			expect(result.success).toBe(true);
			expect(result.steps).toHaveLength(3);
			expect(result.outputs["design-assistant"]).toEqual(artifactsOutput);
		});

		it("should pass correct parameters to start-session step", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ status: "started" })
				.mockResolvedValueOnce({ status: "advanced" })
				.mockResolvedValueOnce({ artifacts: [] });

			const config = {
				context: "Microservices architecture",
				goal: "Design API gateway",
				requirements: ["Rate limiting", "Authentication"],
				sessionId: "api-design-001",
				coverageThreshold: 90,
				enablePivots: false,
			};

			const input = {
				action: "start-session",
				sessionId: "api-design-001",
				config,
				advanceAction: "advance-phase",
				targetPhase: "architecture",
				generateAction: "generate-artifacts",
				artifactTypes: ["adr"],
			};

			await orchestrator.executeWorkflow(designToSpecWorkflow, input);

			// First call should be start-session with correct params
			expect(mockToolExecutor).toHaveBeenNthCalledWith(1, "design-assistant", {
				action: "start-session",
				sessionId: "api-design-001",
				config,
			});
		});

		it("should pass correct parameters to advance-phase step", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ status: "started" })
				.mockResolvedValueOnce({ status: "advanced" })
				.mockResolvedValueOnce({ artifacts: [] });

			const input = {
				action: "start-session",
				sessionId: "session-456",
				config: {
					context: "Test",
					goal: "Test",
					requirements: [],
					sessionId: "session-456",
				},
				advanceAction: "advance-phase",
				targetPhase: "implementation",
				generateAction: "generate-artifacts",
				artifactTypes: ["specification"],
			};

			await orchestrator.executeWorkflow(designToSpecWorkflow, input);

			// Second call should be advance-phase with correct params
			expect(mockToolExecutor).toHaveBeenNthCalledWith(2, "design-assistant", {
				action: "advance-phase",
				sessionId: "session-456",
				phaseId: "implementation",
			});
		});

		it("should pass correct parameters to generate-artifacts step", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ status: "started" })
				.mockResolvedValueOnce({ status: "advanced" })
				.mockResolvedValueOnce({ artifacts: [] });

			const input = {
				action: "start-session",
				sessionId: "session-789",
				config: {
					context: "Test",
					goal: "Test",
					requirements: [],
					sessionId: "session-789",
				},
				advanceAction: "advance-phase",
				targetPhase: "requirements",
				generateAction: "generate-artifacts",
				artifactTypes: ["specification", "adr", "roadmap"],
			};

			await orchestrator.executeWorkflow(designToSpecWorkflow, input);

			// Third call should be generate-artifacts with correct params
			expect(mockToolExecutor).toHaveBeenNthCalledWith(3, "design-assistant", {
				action: "generate-artifacts",
				sessionId: "session-789",
				artifactTypes: ["specification", "adr", "roadmap"],
			});
		});

		it("should stop execution if start-session fails", async () => {
			mockToolExecutor.mockRejectedValueOnce(
				new Error("Failed to start session"),
			);

			const input = {
				action: "start-session",
				sessionId: "fail-session",
				config: {
					context: "Test",
					goal: "Test",
					requirements: [],
					sessionId: "fail-session",
				},
				advanceAction: "advance-phase",
				targetPhase: "requirements",
				generateAction: "generate-artifacts",
				artifactTypes: ["specification"],
			};

			const result = await orchestrator.executeWorkflow(
				designToSpecWorkflow,
				input,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"Workflow failed at step: design-assistant",
			);
			expect(result.steps).toHaveLength(1);
			expect(result.steps[0].success).toBe(false);

			// Should not proceed to next steps
			expect(mockToolExecutor).toHaveBeenCalledTimes(1);
		});

		it("should stop execution if advance-phase fails", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ status: "started" })
				.mockRejectedValueOnce(new Error("Failed to advance phase"));

			const input = {
				action: "start-session",
				sessionId: "session-xyz",
				config: {
					context: "Test",
					goal: "Test",
					requirements: [],
					sessionId: "session-xyz",
				},
				advanceAction: "advance-phase",
				targetPhase: "requirements",
				generateAction: "generate-artifacts",
				artifactTypes: ["specification"],
			};

			const result = await orchestrator.executeWorkflow(
				designToSpecWorkflow,
				input,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"Workflow failed at step: design-assistant",
			);
			expect(result.steps).toHaveLength(2);
			expect(result.steps[0].success).toBe(true);
			expect(result.steps[1].success).toBe(false);

			// Should not proceed to generate-artifacts
			expect(mockToolExecutor).toHaveBeenCalledTimes(2);
		});

		it("should record execution times for all steps", async () => {
			mockToolExecutor.mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return { status: "success" };
			});

			const input = {
				action: "start-session",
				sessionId: "timed-session",
				config: {
					context: "Test",
					goal: "Test",
					requirements: [],
					sessionId: "timed-session",
				},
				advanceAction: "advance-phase",
				targetPhase: "requirements",
				generateAction: "generate-artifacts",
				artifactTypes: ["specification"],
			};

			const result = await orchestrator.executeWorkflow(
				designToSpecWorkflow,
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
		it("should handle minimal config", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ status: "started" })
				.mockResolvedValueOnce({ status: "advanced" })
				.mockResolvedValueOnce({ artifacts: [] });

			const input = {
				action: "start-session",
				sessionId: "minimal",
				config: {
					context: "Context",
					goal: "Goal",
					requirements: [],
					sessionId: "minimal",
				},
				advanceAction: "advance-phase",
				targetPhase: "requirements",
				generateAction: "generate-artifacts",
				artifactTypes: [],
			};

			const result = await orchestrator.executeWorkflow(
				designToSpecWorkflow,
				input,
			);

			expect(result.success).toBe(true);
		});

		it("should preserve initial input in outputs", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ status: "started" })
				.mockResolvedValueOnce({ status: "advanced" })
				.mockResolvedValueOnce({ artifacts: [] });

			const input = {
				action: "start-session",
				sessionId: "preserve-test",
				config: {
					context: "Test",
					goal: "Test",
					requirements: [],
					sessionId: "preserve-test",
				},
				advanceAction: "advance-phase",
				targetPhase: "requirements",
				generateAction: "generate-artifacts",
				artifactTypes: ["specification"],
				customField: "should be preserved",
			};

			const result = await orchestrator.executeWorkflow(
				designToSpecWorkflow,
				input,
			);

			expect(result.outputs._initial).toEqual(input);
			expect(result.outputs._initial.customField).toBe("should be preserved");
		});

		it("should handle different artifact type combinations", async () => {
			mockToolExecutor
				.mockResolvedValueOnce({ status: "started" })
				.mockResolvedValueOnce({ status: "advanced" })
				.mockResolvedValueOnce({ artifacts: [] });

			const artifactTypes = ["adr", "roadmap"];
			const input = {
				action: "start-session",
				sessionId: "artifacts-test",
				config: {
					context: "Test",
					goal: "Test",
					requirements: [],
					sessionId: "artifacts-test",
				},
				advanceAction: "advance-phase",
				targetPhase: "requirements",
				generateAction: "generate-artifacts",
				artifactTypes,
			};

			await orchestrator.executeWorkflow(designToSpecWorkflow, input);

			expect(mockToolExecutor).toHaveBeenNthCalledWith(3, "design-assistant", {
				action: "generate-artifacts",
				sessionId: "artifacts-test",
				artifactTypes,
			});
		});
	});
});
