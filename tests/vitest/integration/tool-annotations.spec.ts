/**
 * Integration: Tool Registration Coverage (P1-018)
 *
 * Tests that tools are properly registered with expected counts.
 *
 * PR #807 Review Fix: Added comment explaining the expected tool count.
 * When adding or removing tools, update the expected count accordingly.
 *
 * Note: Full ToolAnnotations (title, readOnlyHint) coverage is a future enhancement.
 */
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it, vi } from "vitest";

// Capture handlers registered by the MCP server
const capturedHandlers: Array<{ schema: unknown; handler: unknown }> = [];

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
	class Server {
		setRequestHandler(schema: unknown, handler: unknown) {
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

vi.spyOn(console, "error").mockImplementation(() => {});

async function getRegisteredTools(): Promise<Tool[]> {
	if (capturedHandlers.length === 0) {
		await import("../../../src/index.js");
	}

	const listToolsHandler = capturedHandlers[0]?.handler as
		| (() => Promise<{ tools: Tool[] }>)
		| undefined;
	if (!listToolsHandler) {
		throw new Error("ListToolsRequestSchema handler not found");
	}

	const result = await listToolsHandler();
	return result.tools;
}

describe("Tool registration", () => {
	it("registers expected number of tools with valid structure", async () => {
		const tools = await getRegisteredTools();

		/**
		 * PR #807 Review Fix: Document the expected tool count.
		 *
		 * Expected tool count breakdown (update when adding/removing tools):
		 * - Prompt tools: hierarchical-prompt-builder, hierarchy-level-selector,
		 *   prompting-hierarchy-evaluator, prompt-chaining-builder, prompt-flow-builder,
		 *   quick-developer-prompts-builder, etc.
		 * - Analysis tools: clean-code-scorer, code-hygiene-analyzer, semantic-code-analyzer, etc.
		 * - Design tools: design-assistant, etc.
		 * - Agent tools: agent-orchestrator (added in P3-014)
		 * - Other tools: dependency-auditor, guidelines-validator, speckit-generator (added in P4-010),
		 *   validate-spec (added in P4-016), etc.
		 *
		 * Note: prompt-hierarchy (unified) is implemented but not yet registered.
		 * If this test fails after adding/removing tools, update the count below.
		 */
		const EXPECTED_TOOL_COUNT = 36; // Updated for update-progress tool (P4-019)
		expect(
			tools.length,
			`Expected ${EXPECTED_TOOL_COUNT} tools, got ${tools.length}. Update EXPECTED_TOOL_COUNT if tools were intentionally added/removed.`,
		).toBe(EXPECTED_TOOL_COUNT);

		// Validate each tool has required base properties
		for (const tool of tools) {
			expect(tool.name).toBeDefined();
			expect(typeof tool.name).toBe("string");
			expect(tool.name.length).toBeGreaterThan(0);

			expect(tool.description).toBeDefined();
			expect(typeof tool.description).toBe("string");

			expect(tool.inputSchema).toBeDefined();
			expect(tool.inputSchema.type).toBe("object");
		}
	});

	it("all tools have non-empty descriptions", async () => {
		const tools = await getRegisteredTools();

		const emptyDescriptions = tools.filter(
			(tool) => !tool.description || tool.description.trim().length === 0,
		);

		expect(
			emptyDescriptions.length,
			`Tools with empty descriptions: ${emptyDescriptions.map((t) => t.name).join(", ")}`,
		).toBe(0);
	});
});
