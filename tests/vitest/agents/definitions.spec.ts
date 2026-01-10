/**
 * Tests for default agent definitions
 *
 * @module tests/agents/definitions
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	codeScorerAgent,
	defaultAgents,
	designAgent,
	registerDefaultAgents,
	securityAgent,
} from "../../../src/agents/definitions/index.js";
import { AgentRegistry, agentRegistry } from "../../../src/agents/index.js";

describe("Default Agent Definitions", () => {
	let registry: AgentRegistry;

	beforeEach(() => {
		registry = new AgentRegistry();
		// Clear global registry before each test
		agentRegistry.clear();
	});

	afterEach(() => {
		registry.clear();
		agentRegistry.clear();
	});

	describe("codeScorerAgent", () => {
		it("should have correct name", () => {
			expect(codeScorerAgent.name).toBe("code-scorer");
		});

		it("should have description", () => {
			expect(codeScorerAgent.description).toContain("clean code score");
		});

		it("should have code-analysis capability", () => {
			expect(codeScorerAgent.capabilities).toContain("code-analysis");
		});

		it("should reference clean-code-scorer tool", () => {
			expect(codeScorerAgent.toolName).toBe("clean-code-scorer");
		});

		it("should have valid inputSchema", () => {
			expect(codeScorerAgent.inputSchema).toBeDefined();
			expect(codeScorerAgent.inputSchema.type).toBe("object");
		});

		it("should have valid outputSchema", () => {
			expect(codeScorerAgent.outputSchema).toBeDefined();
			expect(codeScorerAgent.outputSchema?.type).toBe("object");
		});
	});

	describe("securityAgent", () => {
		it("should have correct name", () => {
			expect(securityAgent.name).toBe("security-analyzer");
		});

		it("should have description", () => {
			expect(securityAgent.description).toContain("OWASP");
		});

		it("should have security capability", () => {
			expect(securityAgent.capabilities).toContain("security");
		});

		it("should reference security-hardening-prompt-builder tool", () => {
			expect(securityAgent.toolName).toBe("security-hardening-prompt-builder");
		});

		it("should have valid inputSchema", () => {
			expect(securityAgent.inputSchema).toBeDefined();
			expect(securityAgent.inputSchema.type).toBe("object");
		});

		it("should require codeContext", () => {
			const schema = securityAgent.inputSchema as {
				required?: string[];
			};
			expect(schema.required).toContain("codeContext");
		});
	});

	describe("designAgent", () => {
		it("should have correct name", () => {
			expect(designAgent.name).toBe("design-assistant");
		});

		it("should have description", () => {
			expect(designAgent.description).toContain("design");
		});

		it("should have design capability", () => {
			expect(designAgent.capabilities).toContain("design");
		});

		it("should reference design-assistant tool", () => {
			expect(designAgent.toolName).toBe("design-assistant");
		});

		it("should have valid inputSchema", () => {
			expect(designAgent.inputSchema).toBeDefined();
			expect(designAgent.inputSchema.type).toBe("object");
		});

		it("should require action and sessionId", () => {
			const schema = designAgent.inputSchema as {
				required?: string[];
			};
			expect(schema.required).toContain("action");
			expect(schema.required).toContain("sessionId");
		});
	});

	describe("defaultAgents array", () => {
		it("should contain 3 agents", () => {
			expect(defaultAgents).toHaveLength(3);
		});

		it("should contain codeScorerAgent", () => {
			expect(defaultAgents).toContain(codeScorerAgent);
		});

		it("should contain securityAgent", () => {
			expect(defaultAgents).toContain(securityAgent);
		});

		it("should contain designAgent", () => {
			expect(defaultAgents).toContain(designAgent);
		});

		it("should have unique agent names", () => {
			const names = defaultAgents.map((agent) => agent.name);
			const uniqueNames = new Set(names);
			expect(uniqueNames.size).toBe(names.length);
		});

		it("should all be valid AgentDefinition objects", () => {
			for (const agent of defaultAgents) {
				expect(agent.name).toBeDefined();
				expect(agent.description).toBeDefined();
				expect(agent.capabilities).toBeDefined();
				expect(agent.toolName).toBeDefined();
				expect(agent.inputSchema).toBeDefined();
			}
		});
	});

	describe("registerDefaultAgents", () => {
		it("should register agents with global registry", () => {
			// Clear first
			agentRegistry.clear();

			// Register
			registerDefaultAgents();

			// Verify all 3 agents are registered
			expect(agentRegistry.getAgent("code-scorer")).toBeDefined();
			expect(agentRegistry.getAgent("security-analyzer")).toBeDefined();
			expect(agentRegistry.getAgent("design-assistant")).toBeDefined();
		});

		it("should register agents queryable by capability", () => {
			agentRegistry.clear();
			registerDefaultAgents();

			const codeAgents = agentRegistry.queryByCapability(["code-analysis"]);
			expect(codeAgents.length).toBeGreaterThan(0);
			expect(codeAgents.some((a) => a.name === "code-scorer")).toBe(true);

			const securityAgents = agentRegistry.queryByCapability(["security"]);
			expect(securityAgents.length).toBeGreaterThan(0);
			expect(securityAgents.some((a) => a.name === "security-analyzer")).toBe(
				true,
			);
		});

		it("should make agents available for listing", () => {
			agentRegistry.clear();
			registerDefaultAgents();

			const allAgents = agentRegistry.listAgents();
			expect(allAgents.length).toBe(3);

			const names = allAgents.map((a) => a.name);
			expect(names).toContain("code-scorer");
			expect(names).toContain("security-analyzer");
			expect(names).toContain("design-assistant");
		});
	});
});
