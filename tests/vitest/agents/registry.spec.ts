/**
 * Tests for AgentRegistry
 *
 * @module tests/agents/registry
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	type AgentDefinition,
	AgentRegistry,
	agentRegistry,
} from "../../../src/agents/index.js";
import { ErrorCode } from "../../../src/tools/shared/error-codes.js";
import { McpToolError } from "../../../src/tools/shared/errors.js";

describe("AgentRegistry", () => {
	let registry: AgentRegistry;

	beforeEach(() => {
		registry = new AgentRegistry();
	});

	afterEach(() => {
		registry.clear();
	});

	describe("singleton instance", () => {
		it("should export a singleton instance", () => {
			expect(agentRegistry).toBeInstanceOf(AgentRegistry);
		});
	});

	describe("registerAgent", () => {
		it("should register a new agent", () => {
			const agent: AgentDefinition = {
				name: "test-agent",
				description: "A test agent",
				capabilities: ["testing", "validation"],
				inputSchema: { type: "object" },
				toolName: "test-tool",
			};

			registry.registerAgent(agent);

			const retrieved = registry.getAgent("test-agent");
			expect(retrieved).toEqual(agent);
		});

		it("should throw McpToolError when registering duplicate agent", () => {
			const agent: AgentDefinition = {
				name: "duplicate-agent",
				description: "First agent",
				capabilities: ["test"],
				inputSchema: {},
				toolName: "tool-1",
			};

			registry.registerAgent(agent);

			expect(() => registry.registerAgent(agent)).toThrow(McpToolError);
		});

		it("should throw DOMAIN_ERROR code for duplicate agent", () => {
			const agent: AgentDefinition = {
				name: "duplicate-agent",
				description: "First agent",
				capabilities: ["test"],
				inputSchema: {},
				toolName: "tool-1",
			};

			registry.registerAgent(agent);

			try {
				registry.registerAgent(agent);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(McpToolError);
				expect((error as McpToolError).code).toBe(ErrorCode.DOMAIN_ERROR);
				expect((error as McpToolError).message).toContain("duplicate-agent");
			}
		});

		it("should register agent with optional outputSchema", () => {
			const agent: AgentDefinition = {
				name: "agent-with-output",
				description: "Agent with output schema",
				capabilities: ["output"],
				inputSchema: { type: "object" },
				outputSchema: { type: "string" },
				toolName: "output-tool",
			};

			registry.registerAgent(agent);

			const retrieved = registry.getAgent("agent-with-output");
			expect(retrieved?.outputSchema).toEqual({ type: "string" });
		});
	});

	describe("getAgent", () => {
		it("should return agent by name", () => {
			const agent: AgentDefinition = {
				name: "get-test",
				description: "Get test agent",
				capabilities: ["retrieve"],
				inputSchema: {},
				toolName: "get-tool",
			};

			registry.registerAgent(agent);

			const retrieved = registry.getAgent("get-test");
			expect(retrieved).toBeDefined();
			expect(retrieved?.name).toBe("get-test");
		});

		it("should return undefined for non-existent agent", () => {
			const retrieved = registry.getAgent("non-existent");
			expect(retrieved).toBeUndefined();
		});

		it("should return complete agent definition", () => {
			const agent: AgentDefinition = {
				name: "complete-agent",
				description: "Complete test agent",
				capabilities: ["cap1", "cap2"],
				inputSchema: { required: ["field1"] },
				outputSchema: { type: "object" },
				toolName: "complete-tool",
			};

			registry.registerAgent(agent);

			const retrieved = registry.getAgent("complete-agent");
			expect(retrieved).toEqual(agent);
		});
	});

	describe("queryByCapability", () => {
		beforeEach(() => {
			const agents: AgentDefinition[] = [
				{
					name: "agent-1",
					description: "Agent 1",
					capabilities: ["coding", "testing"],
					inputSchema: {},
					toolName: "tool-1",
				},
				{
					name: "agent-2",
					description: "Agent 2",
					capabilities: ["documentation", "testing"],
					inputSchema: {},
					toolName: "tool-2",
				},
				{
					name: "agent-3",
					description: "Agent 3",
					capabilities: ["security", "audit"],
					inputSchema: {},
					toolName: "tool-3",
				},
			];

			for (const agent of agents) {
				registry.registerAgent(agent);
			}
		});

		it("should find agents by single capability", () => {
			const results = registry.queryByCapability(["testing"]);
			expect(results).toHaveLength(2);
			expect(results.map((a) => a.name)).toContain("agent-1");
			expect(results.map((a) => a.name)).toContain("agent-2");
		});

		it("should find agents by multiple capabilities", () => {
			const results = registry.queryByCapability(["coding", "security"]);
			expect(results).toHaveLength(2);
			expect(results.map((a) => a.name)).toContain("agent-1");
			expect(results.map((a) => a.name)).toContain("agent-3");
		});

		it("should return empty array when no agents match", () => {
			const results = registry.queryByCapability(["non-existent"]);
			expect(results).toHaveLength(0);
		});

		it("should return agents that match any of the capabilities", () => {
			const results = registry.queryByCapability(["documentation", "audit"]);
			expect(results).toHaveLength(2);
			expect(results.map((a) => a.name)).toContain("agent-2");
			expect(results.map((a) => a.name)).toContain("agent-3");
		});

		it("should return empty array for empty capability list", () => {
			const results = registry.queryByCapability([]);
			expect(results).toHaveLength(0);
		});

		it("should not return duplicate agents", () => {
			// Agent with testing capability
			const results = registry.queryByCapability(["testing", "documentation"]);
			const agent2Count = results.filter((a) => a.name === "agent-2").length;
			expect(agent2Count).toBe(1);
		});
	});

	describe("listAgents", () => {
		it("should return empty array when no agents registered", () => {
			const list = registry.listAgents();
			expect(list).toHaveLength(0);
		});

		it("should list all registered agents", () => {
			const agents: AgentDefinition[] = [
				{
					name: "agent-1",
					description: "First agent",
					capabilities: ["cap1"],
					inputSchema: {},
					toolName: "tool-1",
				},
				{
					name: "agent-2",
					description: "Second agent",
					capabilities: ["cap2"],
					inputSchema: {},
					toolName: "tool-2",
				},
			];

			for (const agent of agents) {
				registry.registerAgent(agent);
			}

			const list = registry.listAgents();
			expect(list).toHaveLength(2);
		});

		it("should return AgentInfo with correct structure", () => {
			const agent: AgentDefinition = {
				name: "info-test",
				description: "Info test agent",
				capabilities: ["info", "test"],
				inputSchema: {},
				outputSchema: { type: "string" },
				toolName: "info-tool",
			};

			registry.registerAgent(agent);

			const list = registry.listAgents();
			expect(list).toHaveLength(1);
			expect(list[0]).toEqual({
				name: "info-test",
				description: "Info test agent",
				capabilities: ["info", "test"],
				available: true,
			});
		});

		it("should not include inputSchema and toolName in AgentInfo", () => {
			const agent: AgentDefinition = {
				name: "minimal-info",
				description: "Minimal info agent",
				capabilities: ["minimal"],
				inputSchema: { required: ["field"] },
				toolName: "minimal-tool",
			};

			registry.registerAgent(agent);

			const list = registry.listAgents();
			expect(list[0]).not.toHaveProperty("inputSchema");
			expect(list[0]).not.toHaveProperty("outputSchema");
			expect(list[0]).not.toHaveProperty("toolName");
		});

		it("should mark all agents as available", () => {
			const agents: AgentDefinition[] = [
				{
					name: "available-1",
					description: "First available",
					capabilities: ["test"],
					inputSchema: {},
					toolName: "tool-1",
				},
				{
					name: "available-2",
					description: "Second available",
					capabilities: ["test"],
					inputSchema: {},
					toolName: "tool-2",
				},
			];

			for (const agent of agents) {
				registry.registerAgent(agent);
			}

			const list = registry.listAgents();
			expect(list.every((info) => info.available)).toBe(true);
		});
	});

	describe("unregisterAgent", () => {
		it("should unregister an existing agent", () => {
			const agent: AgentDefinition = {
				name: "to-remove",
				description: "Will be removed",
				capabilities: ["temp"],
				inputSchema: {},
				toolName: "temp-tool",
			};

			registry.registerAgent(agent);
			expect(registry.getAgent("to-remove")).toBeDefined();

			const result = registry.unregisterAgent("to-remove");
			expect(result).toBe(true);
			expect(registry.getAgent("to-remove")).toBeUndefined();
		});

		it("should return false when unregistering non-existent agent", () => {
			const result = registry.unregisterAgent("non-existent");
			expect(result).toBe(false);
		});

		it("should allow re-registration after unregistering", () => {
			const agent: AgentDefinition = {
				name: "re-register",
				description: "Can be re-registered",
				capabilities: ["reuse"],
				inputSchema: {},
				toolName: "reuse-tool",
			};

			registry.registerAgent(agent);
			registry.unregisterAgent("re-register");

			// Should not throw error
			expect(() => registry.registerAgent(agent)).not.toThrow();
			expect(registry.getAgent("re-register")).toBeDefined();
		});
	});

	describe("clear", () => {
		it("should remove all agents", () => {
			const agents: AgentDefinition[] = [
				{
					name: "agent-1",
					description: "First",
					capabilities: ["test"],
					inputSchema: {},
					toolName: "tool-1",
				},
				{
					name: "agent-2",
					description: "Second",
					capabilities: ["test"],
					inputSchema: {},
					toolName: "tool-2",
				},
			];

			for (const agent of agents) {
				registry.registerAgent(agent);
			}

			expect(registry.listAgents()).toHaveLength(2);

			registry.clear();

			expect(registry.listAgents()).toHaveLength(0);
			expect(registry.getAgent("agent-1")).toBeUndefined();
			expect(registry.getAgent("agent-2")).toBeUndefined();
		});

		it("should allow registration after clearing", () => {
			const agent: AgentDefinition = {
				name: "post-clear",
				description: "After clear",
				capabilities: ["test"],
				inputSchema: {},
				toolName: "post-tool",
			};

			registry.registerAgent(agent);
			registry.clear();

			// Should not throw error
			expect(() => registry.registerAgent(agent)).not.toThrow();
			expect(registry.listAgents()).toHaveLength(1);
		});
	});

	describe("edge cases", () => {
		it("should handle agent with empty capabilities array", () => {
			const agent: AgentDefinition = {
				name: "no-caps",
				description: "No capabilities",
				capabilities: [],
				inputSchema: {},
				toolName: "no-caps-tool",
			};

			registry.registerAgent(agent);

			const retrieved = registry.getAgent("no-caps");
			expect(retrieved?.capabilities).toEqual([]);
		});

		it("should handle agent with many capabilities", () => {
			const capabilities = Array.from({ length: 100 }, (_, i) => `cap-${i}`);
			const agent: AgentDefinition = {
				name: "many-caps",
				description: "Many capabilities",
				capabilities,
				inputSchema: {},
				toolName: "many-caps-tool",
			};

			registry.registerAgent(agent);

			const results = registry.queryByCapability(["cap-50"]);
			expect(results).toHaveLength(1);
			expect(results[0].name).toBe("many-caps");
		});

		it("should handle complex inputSchema", () => {
			const complexSchema = {
				type: "object",
				properties: {
					name: { type: "string" },
					age: { type: "number" },
					nested: {
						type: "object",
						properties: {
							field: { type: "boolean" },
						},
					},
				},
				required: ["name"],
			};

			const agent: AgentDefinition = {
				name: "complex-schema",
				description: "Complex schema agent",
				capabilities: ["complex"],
				inputSchema: complexSchema,
				toolName: "complex-tool",
			};

			registry.registerAgent(agent);

			const retrieved = registry.getAgent("complex-schema");
			expect(retrieved?.inputSchema).toEqual(complexSchema);
		});

		it("should handle special characters in agent name", () => {
			const agent: AgentDefinition = {
				name: "agent-with-dashes_and_underscores.v1",
				description: "Special name",
				capabilities: ["special"],
				inputSchema: {},
				toolName: "special-tool",
			};

			registry.registerAgent(agent);

			const retrieved = registry.getAgent(
				"agent-with-dashes_and_underscores.v1",
			);
			expect(retrieved).toBeDefined();
		});
	});
});
