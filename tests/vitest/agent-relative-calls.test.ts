import { describe, expect, it } from "vitest";

/**
 * Test suite for agent-relative calls support
 * Validates new resources, prompts, and documentation
 */

describe("Agent-Relative Calls Support", () => {
	describe("Resource Availability", () => {
		it("should include agent-relative-calls resource in structured resources", async () => {
			const { structuredResources } = await import(
				"../../src/resources/structured.js"
			);

			const agentCallsResource = structuredResources.find(
				(r) => r.id === "agent-relative-calls",
			);

			expect(agentCallsResource).toBeDefined();
			expect(agentCallsResource?.title).toBe(
				"Agent-Relative Call Patterns for MCP Tools",
			);
			expect(agentCallsResource?.tags).toContain("mcp");
			expect(agentCallsResource?.tags).toContain("agent");
			expect(agentCallsResource?.tags).toContain("patterns");
		});

		it("should have comprehensive content in agent-relative-calls resource", async () => {
			const { structuredResources, renderStructuredToMarkdown } = await import(
				"../../src/resources/structured.js"
			);

			const agentCallsResource = structuredResources.find(
				(r) => r.id === "agent-relative-calls",
			);

			expect(agentCallsResource).toBeDefined();
			if (!agentCallsResource) return;

			const markdown = renderStructuredToMarkdown(agentCallsResource);

			// Check for key sections
			expect(markdown).toContain("Agent-Relative Call Patterns");
			expect(markdown).toContain("What Are Agent-Relative Calls?");
			expect(markdown).toContain("Core Prompt Patterns");
			expect(markdown).toContain("Tool Categories & Usage");
			expect(markdown).toContain("Multi-Tool Workflow Examples");
			expect(markdown).toContain("Best Practices");
			expect(markdown).toContain("Integration with Other MCP Servers");

			// Check for tool categories
			expect(markdown).toContain("Prompt Building Tools");
			expect(markdown).toContain("Code Analysis & Quality Tools");
			expect(markdown).toContain("Strategy & Planning Tools");
			expect(markdown).toContain("Visualization & Documentation Tools");
			expect(markdown).toContain("Development Workflow Tools");
			expect(markdown).toContain("Design & Architecture Tools");

			// Check for examples
			expect(markdown).toContain("Example 1: Complete Code Review");
			expect(markdown).toContain("Example 2: New Feature Development");
			expect(markdown).toContain("Example 3: Legacy System Modernization");
		});

		it("should be accessible via resources index", async () => {
			const { listResources } = await import("../../src/resources/index.js");

			const resources = await listResources();
			const agentCallsResource = resources.find(
				(r) => r.uri === "guidelines://agent-relative-calls",
			);

			expect(agentCallsResource).toBeDefined();
			expect(agentCallsResource?.name).toBe(
				"Agent-Relative Call Patterns for MCP Tools",
			);
			expect(agentCallsResource?.description).toContain("agent-relative calls");
			expect(agentCallsResource?.mimeType).toBe("text/markdown");
		});

		it("should be retrievable via getResource", async () => {
			const { getResource } = await import("../../src/resources/index.js");

			const result = await getResource("guidelines://agent-relative-calls");

			expect(result.contents).toBeDefined();
			expect(result.contents.length).toBeGreaterThan(0);
			expect(result.contents[0].mimeType).toBe("text/markdown");
			expect(result.contents[0].text).toContain("Agent-Relative Call Patterns");
		});
	});

	describe("Prompt Availability", () => {
		it("should include agent-workflow-prompt in prompts list", async () => {
			const { listPrompts } = await import("../../src/prompts/index.js");

			const prompts = await listPrompts();
			const workflowPrompt = prompts.find(
				(p) => p.name === "agent-workflow-prompt",
			);

			expect(workflowPrompt).toBeDefined();
			expect(workflowPrompt?.description).toContain("agent-relative calls");
			expect(workflowPrompt?.arguments).toBeDefined();

			const args = workflowPrompt?.arguments || [];
			expect(args.some((a) => a.name === "workflow_goal")).toBe(true);
			expect(args.some((a) => a.name === "context")).toBe(true);
			expect(args.some((a) => a.name === "tools_needed")).toBe(true);
		});

		it("should generate workflow prompt with valid structure", async () => {
			const { getPrompt } = await import("../../src/prompts/index.js");

			const result = await getPrompt("agent-workflow-prompt", {
				workflow_goal: "Implement user authentication system",
				context: "Node.js API with Express and PostgreSQL",
				tools_needed: "architecture,security,testing",
			});

			expect(result.messages).toBeDefined();
			expect(result.messages.length).toBeGreaterThan(0);
			expect(result.messages[0].role).toBe("user");
			expect(result.messages[0].content.type).toBe("text");

			const text = result.messages[0].content.text;
			expect(text).toContain("Multi-Tool Agent Workflow");
			expect(text).toContain("Implement user authentication system");
			expect(text).toContain("Node.js API with Express and PostgreSQL");
			expect(text).toContain("Use the");
			expect(text).toContain("MCP to");
		});

		it("should handle minimal workflow prompt parameters", async () => {
			const { getPrompt } = await import("../../src/prompts/index.js");

			const result = await getPrompt("agent-workflow-prompt", {
				workflow_goal: "Simple code review",
			});

			expect(result.messages).toBeDefined();
			const text = result.messages[0].content.text;
			expect(text).toContain("Simple code review");
			expect(text).toContain("Use the clean-code-scorer MCP");
			expect(text).toContain("Use the code-hygiene-analyzer MCP");
		});
	});

	describe("Documentation Content", () => {
		it("should have tool call patterns documented", async () => {
			const { structuredResources, renderStructuredToMarkdown } = await import(
				"../../src/resources/structured.js"
			);

			const resource = structuredResources.find(
				(r) => r.id === "agent-relative-calls",
			);
			if (!resource) throw new Error("Resource not found");

			const markdown = renderStructuredToMarkdown(resource);

			// Check for pattern documentation
			expect(markdown).toContain("Use the [Tool] MCP to");
			expect(markdown).toContain("Analyze using");
			expect(markdown).toContain("Generate with");
			expect(markdown).toContain("Validate using");
			expect(markdown).toContain("Check with");
		});

		it("should document all major tool categories", async () => {
			const { structuredResources, renderStructuredToMarkdown } = await import(
				"../../src/resources/structured.js"
			);

			const resource = structuredResources.find(
				(r) => r.id === "agent-relative-calls",
			);
			if (!resource) throw new Error("Resource not found");

			const markdown = renderStructuredToMarkdown(resource);

			// All 6 main tool categories should be documented
			expect(markdown).toContain("hierarchical-prompt-builder");
			expect(markdown).toContain("clean-code-scorer");
			expect(markdown).toContain("strategy-frameworks-builder");
			expect(markdown).toContain("mermaid-diagram-generator");
			expect(markdown).toContain("guidelines-validator");
			expect(markdown).toContain("design-assistant");
		});

		it("should include multi-MCP integration examples", async () => {
			const { structuredResources, renderStructuredToMarkdown } = await import(
				"../../src/resources/structured.js"
			);

			const resource = structuredResources.find(
				(r) => r.id === "agent-relative-calls",
			);
			if (!resource) throw new Error("Resource not found");

			const markdown = renderStructuredToMarkdown(resource);

			// Check for integration with other MCP servers
			expect(markdown).toContain("Figma MCP");
			expect(markdown).toContain("GitHub MCP");
			expect(markdown).toContain("Playwright MCP");
			expect(markdown).toContain("Accessibility Compliance");
		});

		it("should have references to official documentation", async () => {
			const { structuredResources } = await import(
				"../../src/resources/structured.js"
			);

			const resource = structuredResources.find(
				(r) => r.id === "agent-relative-calls",
			);
			if (!resource) throw new Error("Resource not found");

			// Find references segment
			const referencesSegment = resource.segments.find(
				(s) => s.type === "references",
			);

			expect(referencesSegment).toBeDefined();
			if (referencesSegment?.type !== "references") return;

			const refs = referencesSegment.items;

			// Should have GitHub, Anthropic, MCP docs, etc.
			expect(refs.some((r) => r.url?.includes("github.com"))).toBe(true);
			expect(refs.some((r) => r.url?.includes("anthropic.com"))).toBe(true);
			expect(refs.some((r) => r.url?.includes("modelcontextprotocol.io"))).toBe(
				true,
			);
		});
	});

	describe("Best Practices Documentation", () => {
		it("should document best practices for agent calls", async () => {
			const { structuredResources, renderStructuredToMarkdown } = await import(
				"../../src/resources/structured.js"
			);

			const resource = structuredResources.find(
				(r) => r.id === "agent-relative-calls",
			);
			if (!resource) throw new Error("Resource not found");

			const markdown = renderStructuredToMarkdown(resource);

			// Best practices should be included
			expect(markdown).toContain("Best Practices");
			expect(markdown).toContain("Be Specific About Goals");
			expect(markdown).toContain("Provide Context");
			expect(markdown).toContain("Chain Tools Logically");
			expect(markdown).toContain("Set Boundaries");
			expect(markdown).toContain("Request Confirmations");
		});

		it("should include troubleshooting guidance", async () => {
			const { structuredResources, renderStructuredToMarkdown } = await import(
				"../../src/resources/structured.js"
			);

			const resource = structuredResources.find(
				(r) => r.id === "agent-relative-calls",
			);
			if (!resource) throw new Error("Resource not found");

			const markdown = renderStructuredToMarkdown(resource);

			expect(markdown).toContain("Tool Discovery");
		});

		it("should include performance optimization tips", async () => {
			const { structuredResources, renderStructuredToMarkdown } = await import(
				"../../src/resources/structured.js"
			);

			const resource = structuredResources.find(
				(r) => r.id === "agent-relative-calls",
			);
			if (!resource) throw new Error("Resource not found");

			const markdown = renderStructuredToMarkdown(resource);

			expect(markdown).toContain("Performance");
		});
	});
});
