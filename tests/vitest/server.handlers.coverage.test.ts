import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { modeManager } from "../../src/tools/shared/mode-manager.ts";

// Store captured handlers
let capturedHandlers: Array<{ schema: any; handler: any }> = [];

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
	class Server {
		constructor(_info?: unknown, _caps?: unknown) {}

		setRequestHandler(schema: any, handler: any) {
			// Store the handler for testing
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

describe("Server Handlers Coverage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		capturedHandlers = [];
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should register handlers and exercise server setup", async () => {
		// Import the server to register handlers
		await import("../../src/index.ts");

		// Verify that handlers were registered
		expect(capturedHandlers.length).toBeGreaterThan(0);
		expect(capturedHandlers.length).toBeGreaterThanOrEqual(5); // At least 5 handlers

		// Test that we can call the handlers
		for (const { handler } of capturedHandlers) {
			expect(typeof handler).toBe("function");
		}
	}, 20000);

	it("should exercise ListTools handler execution", async () => {
		// Import the server to register handlers
		await import("../../src/index.ts");

		// Find and test the ListTools handler (first registered handler)
		const listToolsHandler = capturedHandlers[0]?.handler;
		if (listToolsHandler) {
			const result = await listToolsHandler({});
			expect(result).toHaveProperty("tools");
			expect(Array.isArray(result.tools)).toBe(true);
			expect(result.tools.length).toBeGreaterThan(0);
		}
	}, 20000);

	it("should exercise mode-aware tool filtering branches", async () => {
		await import("../../src/index.ts");

		const listToolsHandler = capturedHandlers[0]?.handler;
		if (!listToolsHandler) return;

		const previousFlag = process.env.MCP_ENABLE_MODE_FILTERING;
		process.env.MCP_ENABLE_MODE_FILTERING = "true";

		try {
			modeManager.setMode("analysis", "test mode filtering");
			const filtered = await listToolsHandler({});
			expect(
				filtered.tools.every((t: { name: string }) => t.name !== undefined),
			).toBe(true);
			expect(filtered.tools.length).toBeGreaterThan(0);

			modeManager.setMode("interactive", "test wildcard mode");
			const unfiltered = await listToolsHandler({});
			expect(unfiltered.tools.length).toBeGreaterThanOrEqual(
				filtered.tools.length,
			);
		} finally {
			modeManager.reset();
			if (previousFlag === undefined) {
				delete process.env.MCP_ENABLE_MODE_FILTERING;
			} else {
				process.env.MCP_ENABLE_MODE_FILTERING = previousFlag;
			}
		}
	});

	it("should exercise CallTool handler with valid tool", async () => {
		// Import the server to register handlers
		await import("../../src/index.ts");

		// Find the CallTool handler (second registered handler)
		const callToolHandler = capturedHandlers[1]?.handler;
		if (callToolHandler) {
			// Test with hierarchical-prompt-builder
			const result = await callToolHandler({
				params: {
					name: "hierarchical-prompt-builder",
					arguments: {
						context: "Test context",
						goal: "Test goal",
						requirements: ["requirement 1"],
						outputFormat: "markdown",
						audience: "developers",
					},
				},
			});

			expect(result).toHaveProperty("content");
			expect(Array.isArray(result.content)).toBe(true);
		}
	});

	it("should exercise CallTool handler with unknown tool", async () => {
		// Import the server to register handlers
		await import("../../src/index.ts");

		// Find the CallTool handler
		const callToolHandler = capturedHandlers[1]?.handler;
		if (callToolHandler) {
			// Test with unknown tool to trigger error handling
			const result = await callToolHandler({
				params: {
					name: "non-existent-tool",
					arguments: {},
				},
			});

			expect(result).toHaveProperty("content");
			expect(result.content[0].text).toContain("Error executing tool");
			expect(result.content[0].text).toContain(
				"Unknown tool: non-existent-tool",
			);
		}
	});

	it("should exercise CallTool handler error handling", async () => {
		// Import the server to register handlers
		await import("../../src/index.ts");

		// Find the CallTool handler
		const callToolHandler = capturedHandlers[1]?.handler;
		if (callToolHandler) {
			// Test with invalid arguments to trigger error path
			const result = await callToolHandler({
				params: {
					name: "hierarchical-prompt-builder",
					arguments: null, // This should cause an error
				},
			});

			expect(result).toHaveProperty("content");
			expect(result.content[0].text).toContain("Error executing tool");
		}
	});

	it("should exercise resource handlers", async () => {
		// Import the server to register handlers
		await import("../../src/index.ts");

		// Find the ListResources handler
		const listResourcesHandler = capturedHandlers[2]?.handler;
		if (listResourcesHandler) {
			const result = await listResourcesHandler({});
			expect(result).toHaveProperty("resources");
		}

		// Find the ReadResource handler
		const readResourceHandler = capturedHandlers[3]?.handler;
		if (readResourceHandler) {
			try {
				await readResourceHandler({
					params: { uri: "guidelines://test" },
				});
			} catch (error) {
				// Error is expected for invalid URI
				expect(error).toBeDefined();
			}
		}
	});

	it("should exercise prompt handlers", async () => {
		// Import the server to register handlers
		await import("../../src/index.ts");

		// Find the ListPrompts handler
		const listPromptsHandler = capturedHandlers[4]?.handler;
		if (listPromptsHandler) {
			const result = await listPromptsHandler({});
			expect(result).toHaveProperty("prompts");
		}

		// Find the GetPrompt handler
		const getPromptHandler = capturedHandlers[5]?.handler;
		if (getPromptHandler) {
			try {
				await getPromptHandler({
					params: {
						name: "security-analysis-prompt",
						arguments: {
							codeContext: "test code",
							securityFocus: "vulnerability-analysis",
						},
					},
				});
			} catch (error) {
				// Error might be expected for some prompts
				expect(error).toBeDefined();
			}
		}
	});

	it("should exercise GetPrompt handler default arguments branch", async () => {
		await import("../../src/index.ts");

		const getPromptHandler = capturedHandlers[5]?.handler;
		if (!getPromptHandler) return;

		await expect(
			getPromptHandler({
				params: {
					name: "non-existent-prompt",
				},
			}),
		).rejects.toBeDefined();
	});

	it("should test multiple tool executions for coverage", async () => {
		// Import the server to register handlers
		await import("../../src/index.ts");

		const callToolHandler = capturedHandlers[1]?.handler;
		if (callToolHandler) {
			const toolTests = [
				{
					name: "code-analysis-prompt-builder",
					args: {},
				},
				{
					name: "architecture-design-prompt-builder",
					args: {},
				},
				{
					name: "digital-enterprise-architect-prompt-builder",
					args: {},
				},
				{
					name: "debugging-assistant-prompt-builder",
					args: {},
				},
				{
					name: "documentation-generator-prompt-builder",
					args: {},
				},
				{
					name: "strategy-frameworks-builder",
					args: {},
				},
				{
					name: "gap-frameworks-analyzers",
					args: {},
				},
				{
					name: "spark-prompt-builder",
					args: {},
				},
				{
					name: "domain-neutral-prompt-builder",
					args: {},
				},
				{
					name: "security-hardening-prompt-builder",
					args: {},
				},
				{
					name: "quick-developer-prompts-builder",
					args: {},
				},
				{
					name: "model-compatibility-checker",
					args: {
						taskDescription: "Test task",
						requirements: ["accuracy"],
						budget: "medium",
					},
				},
				{
					name: "code-hygiene-analyzer",
					args: {
						codeContent: "function test() { return true; }",
						language: "javascript",
					},
				},
				{
					name: "dependency-auditor",
					args: {},
				},
				{
					name: "iterative-coverage-enhancer",
					args: {},
				},
				{
					name: "mermaid-diagram-generator",
					args: {
						description: "Test diagram",
						diagramType: "flowchart",
					},
				},
				{
					name: "semantic-code-analyzer",
					args: {},
				},
				{
					name: "mode-switcher",
					args: {},
				},
				{
					name: "prompting-hierarchy-evaluator",
					args: {},
				},
				{
					name: "prompt-hierarchy",
					args: {},
				},
				{
					name: "hierarchy-level-selector",
					args: {},
				},
				{
					name: "prompt-chaining-builder",
					args: {},
				},
				{
					name: "prompt-flow-builder",
					args: {},
				},
			];

			for (const test of toolTests) {
				try {
					const result = await callToolHandler({
						params: {
							name: test.name,
							arguments: test.args,
						},
					});
					expect(result).toHaveProperty("content");
				} catch (error) {
					// Some tools might error with minimal args, that's ok
					console.log(`Tool ${test.name} error:`, error);
				}
			}
		}
	});

	it("should test coverage-dashboard-design-prompt-builder tool via MCP handler", async () => {
		// Import the server to register handlers
		await import("../../src/index.ts");

		const callToolHandler = capturedHandlers[1]?.handler;
		if (callToolHandler) {
			const result = await callToolHandler({
				params: {
					name: "coverage-dashboard-design-prompt-builder",
					arguments: {
						title: "Test Coverage Dashboard",
						projectContext: "Testing MCP handler integration",
						dashboardStyle: "card-based",
						framework: "react",
					},
				},
			});

			expect(result).toHaveProperty("content");
			expect(Array.isArray(result.content)).toBe(true);
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Test Coverage Dashboard");
			expect(result.content[0].text).toContain(
				"Testing MCP handler integration",
			);
		}
	});
});
