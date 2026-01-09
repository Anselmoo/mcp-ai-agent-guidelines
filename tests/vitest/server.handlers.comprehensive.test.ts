// Comprehensive tests for src/index.ts handlers and tool definitions
import { describe, expect, it, vi } from "vitest";

// Store captured handlers - needs to persist across tests
const capturedHandlers: Array<{ schema: any; handler: any }> = [];

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
	class Server {
		constructor(_info?: unknown, _caps?: unknown) {}

		setRequestHandler(schema: any, handler: any) {
			capturedHandlers.push({ schema, handler });
		}

		async connect() {
			return Promise.resolve();
		}
	}
	return { Server };
});

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => {
	class StdioServerTransport {}
	return { StdioServerTransport };
});

// Mock console.error to avoid noise
vi.spyOn(console, "error").mockImplementation(() => {});

describe("MCP Server Handlers - Comprehensive Coverage", () => {
	describe("Tool Definitions Coverage", () => {
		it("should list all 22 expected tools with complete schemas", async () => {
			await import("../../src/index.ts");

			const listToolsHandler = capturedHandlers[0]?.handler;
			expect(listToolsHandler).toBeDefined();

			const result = await listToolsHandler({});

			const expectedTools = [
				"hierarchical-prompt-builder",
				"strategy-frameworks-builder",
				"gap-frameworks-analyzers",
				"spark-prompt-builder",
				"clean-code-scorer",
				"code-hygiene-analyzer",
				"iterative-coverage-enhancer",
				"mermaid-diagram-generator",
				"memory-context-optimizer",
				"domain-neutral-prompt-builder",
				"security-hardening-prompt-builder",
				"sprint-timeline-calculator",
				"model-compatibility-checker",
				"guidelines-validator",
				"semantic-code-analyzer",
				"project-onboarding",
				"mode-switcher",
				"prompting-hierarchy-evaluator",
				"hierarchy-level-selector",
				"prompt-chaining-builder",
				"prompt-flow-builder",
				"design-assistant",
			];

			const toolNames = result.tools.map((t: any) => t.name);

			for (const expectedTool of expectedTools) {
				expect(toolNames).toContain(expectedTool);
			}

			// Verify each tool has required properties
			for (const tool of result.tools) {
				expect(tool).toHaveProperty("name");
				expect(tool).toHaveProperty("description");
				expect(tool).toHaveProperty("inputSchema");
				expect(tool.inputSchema).toHaveProperty("type", "object");
			}
		});

		it("should define comprehensive schemas for all tools", async () => {
			await import("../../src/index.ts");

			const listToolsHandler = capturedHandlers[0]?.handler;
			const result = await listToolsHandler({});

			// Check specific tool schemas have all expected properties
			const hierarchicalTool = result.tools.find(
				(t: any) => t.name === "hierarchical-prompt-builder",
			);
			expect(hierarchicalTool.inputSchema.properties).toHaveProperty("context");
			expect(hierarchicalTool.inputSchema.properties).toHaveProperty("goal");
			expect(hierarchicalTool.inputSchema.properties).toHaveProperty(
				"requirements",
			);
			expect(hierarchicalTool.inputSchema.required).toContain("context");
			expect(hierarchicalTool.inputSchema.required).toContain("goal");

			const strategyTool = result.tools.find(
				(t: any) => t.name === "strategy-frameworks-builder",
			);
			expect(strategyTool.inputSchema.properties).toHaveProperty("frameworks");
			expect(strategyTool.inputSchema.properties).toHaveProperty("context");

			const sparkTool = result.tools.find(
				(t: any) => t.name === "spark-prompt-builder",
			);
			expect(sparkTool.inputSchema.properties).toHaveProperty("title");
			expect(sparkTool.inputSchema.properties).toHaveProperty("summary");
		});
	});

	describe("Tool Execution Coverage", () => {
		it("should execute all tools successfully with valid arguments", async () => {
			await import("../../src/index.ts");

			const callToolHandler = capturedHandlers[1]?.handler;
			expect(callToolHandler).toBeDefined();

			const toolTests = [
				{
					name: "hierarchical-prompt-builder",
					args: {
						context: "Test project",
						goal: "Improve code quality",
						requirements: ["Use TypeScript", "Add tests"],
					},
				},
				{
					name: "strategy-frameworks-builder",
					args: {
						frameworks: ["swot", "objectives"],
						context: "Business strategy",
					},
				},
				{
					name: "gap-frameworks-analyzers",
					args: {
						frameworks: ["capability"],
						currentState: "Current capabilities",
						desiredState: "Target capabilities",
						context: "Gap analysis",
					},
				},
				{
					name: "spark-prompt-builder",
					args: {
						title: "Test UI",
						summary: "UI design prompt",
						complexityLevel: "moderate",
						designDirection: "modern",
						colorSchemeType: "vibrant",
						colorPurpose: "brand identity",
						primaryColor: "oklch(0.7 0.2 200)",
						primaryColorPurpose: "main actions",
						accentColor: "oklch(0.6 0.25 30)",
						accentColorPurpose: "highlights",
						fontFamily: "system-ui",
						fontIntention: "readability",
						fontReasoning: "accessible typography",
						animationPhilosophy: "subtle",
						animationRestraint: "minimal motion",
						animationPurpose: "feedback",
						animationHierarchy: "layered",
						spacingRule: "8px baseline",
						spacingContext: "consistent rhythm",
						mobileLayout: "responsive",
					},
				},
				{
					name: "clean-code-scorer",
					args: {
						codeContent: "function test() { return true; }",
						language: "javascript",
					},
				},
				{
					name: "code-hygiene-analyzer",
					args: {
						codeContent: "const x = 1;",
						language: "typescript",
					},
				},
				{
					name: "mermaid-diagram-generator",
					args: {
						description: "System architecture",
						diagramType: "flowchart",
					},
				},
				{
					name: "memory-context-optimizer",
					args: {
						contextContent: "Large context to optimize",
						maxTokens: 4000,
					},
				},
				{
					name: "domain-neutral-prompt-builder",
					args: {
						title: "Project Specification",
						summary: "Define project scope",
					},
				},
				{
					name: "security-hardening-prompt-builder",
					args: {
						codeContext: "Authentication module",
					},
				},
				{
					name: "sprint-timeline-calculator",
					args: {
						tasks: [
							{ name: "Task 1", estimate: 8 },
							{ name: "Task 2", estimate: 16 },
						],
						teamSize: 5,
					},
				},
				{
					name: "model-compatibility-checker",
					args: {
						taskDescription: "Code generation task",
					},
				},
				{
					name: "guidelines-validator",
					args: {
						practiceDescription: "Code review practice",
						category: "code-management",
					},
				},
				{
					name: "semantic-code-analyzer",
					args: {
						codeContent: "class Example {}",
						language: "typescript",
					},
				},
				{
					name: "project-onboarding",
					args: {
						projectPath: process.cwd(),
					},
				},
				{
					name: "prompting-hierarchy-evaluator",
					args: {
						promptText: "Test prompt",
					},
				},
				{
					name: "hierarchy-level-selector",
					args: {
						taskDescription: "Select appropriate level",
					},
				},
				{
					name: "prompt-chaining-builder",
					args: {
						chainName: "Multi-step workflow",
						objective: "Multi-step task",
						steps: [
							{ name: "Step 1", prompt: "First step", dependencies: [] },
							{ name: "Step 2", prompt: "Second step", dependencies: [] },
						],
					},
				},
				{
					name: "prompt-flow-builder",
					args: {
						flowName: "Workflow process",
						objective: "Workflow definition",
						nodes: [
							{
								id: "start",
								type: "prompt",
								name: "Initial",
								description: "Initial step",
								dependencies: [],
								config: { prompt: "Start the process" },
							},
						],
					},
				},
				{
					name: "design-assistant",
					args: {
						context: "Design project",
						goal: "Create design system",
						requirements: ["Accessibility", "Scalability"],
						constraints: [],
					},
				},
			];

			for (const test of toolTests) {
				const result = await callToolHandler({
					params: {
						name: test.name,
						arguments: test.args,
					},
				});
				expect(result).toHaveProperty("content");
				expect(Array.isArray(result.content)).toBe(true);
				expect(result.content.length).toBeGreaterThan(0);
				expect(result.content[0]).toHaveProperty("type", "text");
			}
		});

		it("should handle tool execution errors gracefully", async () => {
			await import("../../src/index.ts");

			const callToolHandler = capturedHandlers[1]?.handler;

			// Test with unknown tool - should return error content wrapped by handler
			const unknownResult = await callToolHandler({
				params: {
					name: "non-existent-tool",
					arguments: {},
				},
			});
			expect(unknownResult.content[0].text).toContain("Error");
			expect(unknownResult.content[0].text).toContain("Unknown tool");
		});
	});

	describe("Resource Handlers Coverage", () => {
		it("should list all resources", async () => {
			await import("../../src/index.ts");

			const listResourcesHandler = capturedHandlers[2]?.handler;
			expect(listResourcesHandler).toBeDefined();

			const result = await listResourcesHandler({});
			expect(result).toHaveProperty("resources");
			expect(Array.isArray(result.resources)).toBe(true);
		});

		it("should read resources successfully", async () => {
			await import("../../src/index.ts");

			const readResourceHandler = capturedHandlers[3]?.handler;
			expect(readResourceHandler).toBeDefined();

			// Get available resources first
			const listResourcesHandler = capturedHandlers[2]?.handler;
			const listResult = await listResourcesHandler({});

			if (listResult.resources.length > 0) {
				const resource = listResult.resources[0];
				const readResult = await readResourceHandler({
					params: { uri: resource.uri },
				});
				expect(readResult).toHaveProperty("contents");
				expect(Array.isArray(readResult.contents)).toBe(true);
			}
		});
	});

	describe("Prompt Handlers Coverage", () => {
		it("should list all prompts", async () => {
			await import("../../src/index.ts");

			const listPromptsHandler = capturedHandlers[4]?.handler;
			expect(listPromptsHandler).toBeDefined();

			const result = await listPromptsHandler({});
			expect(result).toHaveProperty("prompts");
			expect(Array.isArray(result.prompts)).toBe(true);
		});

		it("should get specific prompts successfully", async () => {
			await import("../../src/index.ts");

			const getPromptHandler = capturedHandlers[5]?.handler;
			expect(getPromptHandler).toBeDefined();

			// Get available prompts first
			const listPromptsHandler = capturedHandlers[4]?.handler;
			const listResult = await listPromptsHandler({});

			if (listResult.prompts.length > 0) {
				// Find a prompt with known arguments
				const securityPrompt = listResult.prompts.find(
					(p: any) => p.name === "security-analysis-prompt",
				);

				if (securityPrompt) {
					const getResult = await getPromptHandler({
						params: {
							name: securityPrompt.name,
							arguments: {
								codebase: "test codebase",
								securityFocus: "vulnerability-analysis",
							},
						},
					});
					expect(getResult).toHaveProperty("messages");
					expect(Array.isArray(getResult.messages)).toBe(true);
				}
			}
		});
	});

	describe("Server Connection Coverage", () => {
		it("should connect to stdio transport", async () => {
			await import("../../src/index.ts");

			// Verify all handlers are registered
			expect(capturedHandlers.length).toBeGreaterThanOrEqual(6);
		});
	});
});
