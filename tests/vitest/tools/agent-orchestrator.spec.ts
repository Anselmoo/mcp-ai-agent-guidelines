/**
 * Unit tests for agent-orchestrator tool with Zod schema validation
 * Tests cover all validation scenarios and error cases
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { agentOrchestrator } from "../../../src/agents/orchestrator.js";
import { agentRegistry } from "../../../src/agents/registry.js";
import type { AgentDefinition } from "../../../src/agents/types.js";
import { agentOrchestratorTool } from "../../../src/tools/agent-orchestrator.js";
import { ErrorCode } from "../../../src/tools/shared/error-codes.js";
import { McpToolError } from "../../../src/tools/shared/errors.js";

describe("agentOrchestratorTool - Unit Tests", () => {
	beforeEach(() => {
		agentRegistry.clear();
	});

	describe("Zod Schema Validation", () => {
		describe("list-agents action", () => {
			it("should validate list-agents with no additional parameters", async () => {
				const result = await agentOrchestratorTool({
					action: "list-agents",
				});
				expect(result).toBeDefined();
				expect(result.content[0].text).toContain("Available Agents");
			});

			it("should ignore extra parameters for list-agents", async () => {
				const result = await agentOrchestratorTool({
					action: "list-agents",
					// @ts-expect-error - testing runtime validation
					extraParam: "should be ignored",
				});
				expect(result).toBeDefined();
			});
		});

		describe("list-workflows action", () => {
			it("should validate list-workflows with no additional parameters", async () => {
				const result = await agentOrchestratorTool({
					action: "list-workflows",
				});
				expect(result).toBeDefined();
				expect(result.content[0].text).toContain("Available Workflows");
			});
		});

		describe("handoff action", () => {
			it("should validate handoff with targetAgent", async () => {
				const result = await agentOrchestratorTool({
					action: "handoff",
					targetAgent: "test-agent",
				});
				// Will fail at execution, but validation passes
				expect(result.isError).toBe(true);
			});

			it("should throw ZodError when targetAgent is empty string", async () => {
				await expect(
					agentOrchestratorTool({
						action: "handoff",
						targetAgent: "",
					}),
				).rejects.toThrow(ZodError);
			});

			it("should throw ZodError when targetAgent is missing", async () => {
				await expect(
					agentOrchestratorTool({
						action: "handoff",
						// @ts-expect-error - testing validation
						context: { data: "test" },
					}),
				).rejects.toThrow(ZodError);
			});

			it("should accept optional context parameter", async () => {
				const result = await agentOrchestratorTool({
					action: "handoff",
					targetAgent: "test-agent",
					context: { key: "value" },
				});
				expect(result.isError).toBe(true);
			});

			it("should accept optional reason parameter", async () => {
				const result = await agentOrchestratorTool({
					action: "handoff",
					targetAgent: "test-agent",
					reason: "Testing handoff",
				});
				expect(result.isError).toBe(true);
			});

			it("should accept all parameters together", async () => {
				const result = await agentOrchestratorTool({
					action: "handoff",
					targetAgent: "test-agent",
					context: { data: "test" },
					reason: "Full test",
				});
				expect(result.isError).toBe(true);
			});
		});

		describe("workflow action", () => {
			it("should throw ZodError when workflowName is missing", async () => {
				await expect(
					agentOrchestratorTool({
						action: "workflow",
						// @ts-expect-error - testing validation
						workflowInput: { data: "test" },
					}),
				).rejects.toThrow(ZodError);
			});

			it("should throw ZodError when workflowName is empty string", async () => {
				await expect(
					agentOrchestratorTool({
						action: "workflow",
						workflowName: "",
					}),
				).rejects.toThrow(ZodError);
			});

			it("should accept optional workflowInput parameter", async () => {
				// This will throw because workflow doesn't exist, but validation passes
				await expect(
					agentOrchestratorTool({
						action: "workflow",
						workflowName: "non-existent",
						workflowInput: { key: "value" },
					}),
				).rejects.toThrow(McpToolError);
			});
		});

		describe("invalid action", () => {
			it("should throw ZodError for invalid action string", async () => {
				await expect(
					agentOrchestratorTool({
						// @ts-expect-error - testing validation
						action: "invalid-action",
					}),
				).rejects.toThrow(ZodError);
			});

			it("should throw ZodError for missing action", async () => {
				await expect(
					// @ts-expect-error - testing validation
					agentOrchestratorTool({}),
				).rejects.toThrow(ZodError);
			});

			it("should throw ZodError for null action", async () => {
				await expect(
					agentOrchestratorTool({
						// @ts-expect-error - testing validation
						action: null,
					}),
				).rejects.toThrow(ZodError);
			});

			it("should throw ZodError for number action", async () => {
				await expect(
					agentOrchestratorTool({
						// @ts-expect-error - testing validation
						action: 123,
					}),
				).rejects.toThrow(ZodError);
			});
		});

		describe("type coercion", () => {
			it("should not coerce non-string targetAgent", async () => {
				await expect(
					agentOrchestratorTool({
						action: "handoff",
						// @ts-expect-error - testing validation
						targetAgent: 123,
					}),
				).rejects.toThrow(ZodError);
			});

			it("should not coerce non-string workflowName", async () => {
				await expect(
					agentOrchestratorTool({
						action: "workflow",
						// @ts-expect-error - testing validation
						workflowName: { name: "test" },
					}),
				).rejects.toThrow(ZodError);
			});
		});
	});

	describe("Error Handling", () => {
		it("should return error response when agent not found", async () => {
			const result = await agentOrchestratorTool({
				action: "handoff",
				targetAgent: "non-existent",
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Handoff failed");
		});

		it("should throw McpToolError when workflow not found", async () => {
			await expect(
				agentOrchestratorTool({
					action: "workflow",
					workflowName: "non-existent",
				}),
			).rejects.toThrow(McpToolError);

			try {
				await agentOrchestratorTool({
					action: "workflow",
					workflowName: "non-existent",
				});
			} catch (error) {
				expect(error).toBeInstanceOf(McpToolError);
				expect((error as McpToolError).code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
				expect((error as McpToolError).context).toHaveProperty(
					"availableWorkflows",
				);
			}
		});
	});

	describe("Success Paths", () => {
		it("should successfully execute handoff with registered agent", async () => {
			const agent: AgentDefinition = {
				name: "test-agent",
				description: "Test",
				capabilities: ["test"],
				inputSchema: {},
				toolName: "test-tool",
			};
			agentRegistry.registerAgent(agent);

			const mockExecutor = vi.fn().mockResolvedValue({ result: "success" });
			agentOrchestrator.setToolExecutor(mockExecutor);

			const result = await agentOrchestratorTool({
				action: "handoff",
				targetAgent: "test-agent",
				context: { data: "test" },
				reason: "testing",
			});

			expect(result.content[0].text).toContain("Handoff Completed");
			expect(result.content[0].text).toContain("test-agent");
		});

		it("should successfully execute workflow", async () => {
			const agent: AgentDefinition = {
				name: "code-scorer",
				description: "Scorer",
				capabilities: ["scoring"],
				inputSchema: {},
				toolName: "clean-code-scorer",
			};
			agentRegistry.registerAgent(agent);

			const mockExecutor = vi.fn().mockResolvedValue({ score: 90 });
			agentOrchestrator.setToolExecutor(mockExecutor);

			const result = await agentOrchestratorTool({
				action: "workflow",
				workflowName: "code-review-chain",
				workflowInput: { code: "test" },
			});

			expect(result.content[0].text).toContain("Workflow");
		});

		it("should return formatted workflow error when workflow fails", async () => {
			const agent: AgentDefinition = {
				name: "code-scorer",
				description: "Scorer",
				capabilities: ["scoring"],
				inputSchema: {},
				toolName: "clean-code-scorer",
			};
			agentRegistry.registerAgent(agent);

			const mockExecutor = vi
				.fn()
				.mockRejectedValue(new Error("Execution failed"));
			agentOrchestrator.setToolExecutor(mockExecutor);

			const result = await agentOrchestratorTool({
				action: "workflow",
				workflowName: "code-review-chain",
				workflowInput: { code: "test" },
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Workflow Failed");
		});
	});

	describe("Edge Cases", () => {
		it("should handle context with complex nested objects", async () => {
			const result = await agentOrchestratorTool({
				action: "handoff",
				targetAgent: "test",
				context: {
					nested: {
						deep: {
							value: [1, 2, 3],
							obj: { key: "value" },
						},
					},
				},
			});
			expect(result.isError).toBe(true);
		});

		it("should handle workflowInput with arrays", async () => {
			await expect(
				agentOrchestratorTool({
					action: "workflow",
					workflowName: "non-existent",
					workflowInput: [1, 2, 3, "test", { key: "value" }],
				}),
			).rejects.toThrow(McpToolError);
		});

		it("should handle unicode in targetAgent", async () => {
			const result = await agentOrchestratorTool({
				action: "handoff",
				targetAgent: "测试-agent-🚀",
			});
			expect(result.isError).toBe(true);
		});

		it("should handle very long reason strings", async () => {
			const longReason = "a".repeat(10000);
			const result = await agentOrchestratorTool({
				action: "handoff",
				targetAgent: "test",
				reason: longReason,
			});
			expect(result.isError).toBe(true);
		});
	});
});
