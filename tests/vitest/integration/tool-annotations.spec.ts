/**
 * Integration: Tool Annotations Coverage (P1-018)
 */
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it, vi } from "vitest";

// Capture handlers registered by the MCP server
// biome-ignore lint/suspicious/noExplicitAny: Test mock compatibility
const capturedHandlers: Array<{ schema: any; handler: any }> = [];

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
	class Server {
		// biome-ignore lint/suspicious/noExplicitAny: Test mock compatibility
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

vi.spyOn(console, "error").mockImplementation(() => {});

async function getRegisteredTools(): Promise<Tool[]> {
	if (capturedHandlers.length === 0) {
		await import("../../../src/index.js");
	}

	const listToolsHandler = capturedHandlers[0]?.handler;
	if (!listToolsHandler) {
		throw new Error("ListToolsRequestSchema handler not found");
	}

	const result = await listToolsHandler({});
	return result.tools as Tool[];
}

describe("Tool annotations", () => {
	it("every registered tool exposes ToolAnnotations with required flags", async () => {
		const tools = await getRegisteredTools();

		expect(tools).toHaveLength(32);

		const missing: string[] = [];
		for (const tool of tools) {
			const annotations = tool.annotations as Tool["annotations"];
			if (!annotations) {
				missing.push(tool.name);
				continue;
			}

			expect(typeof annotations.title).toBe("string");
			expect(annotations.title?.length).toBeGreaterThan(0);
			expect(typeof annotations.readOnlyHint).toBe("boolean");
		}

		if (missing.length > 0) {
			throw new Error(`Tools without annotations: ${missing.join(", ")}`);
		}
	});
});
