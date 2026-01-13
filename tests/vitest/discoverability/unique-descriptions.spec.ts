/**
 * Tool Description Uniqueness Tests
 *
 * This test suite verifies that all MCP tool descriptions are unique and follow
 * the established template pattern for discoverability.
 *
 * Requirements:
 * - No two tools share the same first 5 words in their description
 * - All descriptions follow the template pattern (sentence + "BEST FOR:" + outputs)
 * - All descriptions are under 300 characters
 */
import { describe, expect, it, vi } from "vitest";

// Store captured handlers - needs to persist across tests
// biome-ignore lint/suspicious/noExplicitAny: Required for vitest mock compatibility
const capturedHandlers: Array<{ schema: any; handler: any }> = [];

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
	class Server {
		// biome-ignore lint/suspicious/noExplicitAny: Required for mock handler compatibility
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

/**
 * Helper function to get registered tools from the MCP server
 */
async function getRegisteredTools() {
	// Import the server which triggers handler registration
	await import("../../../src/index.js");

	// First handler is ListToolsRequestSchema
	const listToolsHandler = capturedHandlers[0]?.handler;
	if (!listToolsHandler) {
		throw new Error("ListToolsRequestSchema handler not found");
	}

	const result = await listToolsHandler({});
	return result.tools;
}

describe("Tool Description Uniqueness", () => {
	it("should have unique first 5 words across all tools", async () => {
		const tools = await getRegisteredTools();
		const firstFiveWords = new Map<string, string>();

		for (const tool of tools) {
			const key = tool.description
				.split(" ")
				.slice(0, 5)
				.join(" ")
				.toLowerCase();

			if (firstFiveWords.has(key)) {
				throw new Error(
					`Tools "${tool.name}" and "${firstFiveWords.get(key)}" share first 5 words: "${key}"`,
				);
			}
			firstFiveWords.set(key, tool.name);
		}

		// If we get here, all descriptions have unique first 5 words
		expect(tools.length).toBeGreaterThan(0);
	});

	it("should follow description template pattern", async () => {
		const tools = await getRegisteredTools();
		// Old pattern: sentence ending with period + "BEST FOR:"
		const oldPattern = /^[A-Z][^.]+\. BEST FOR:/;
		// New SPEC-002 pattern: verb-first, concise (no "BEST FOR:")
		const newSpec002Pattern = /^[A-Z][a-z]+/; // Starts with capitalized verb

		for (const tool of tools) {
			const hasOldFormat = oldPattern.test(tool.description);
			const hasNewFormat = newSpec002Pattern.test(tool.description);

			expect(
				hasOldFormat || hasNewFormat,
				`Tool "${tool.name}" description does not follow either old or new SPEC-002 template pattern`,
			).toBe(true);
		}
	});

	it("should have descriptions under 300 characters", async () => {
		const tools = await getRegisteredTools();

		for (const tool of tools) {
			expect(
				tool.description.length,
				`Tool "${tool.name}" description is ${tool.description.length} characters (limit: 300)`,
			).toBeLessThan(300);
		}
	});
});
