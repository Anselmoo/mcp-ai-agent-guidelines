/**
 * Integration: Phase 1 Discoverability (P1-018)
 */
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hierarchicalPromptBuilder } from "../../../src/tools/prompt/hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "../../../src/tools/prompt/hierarchy-level-selector.js";
import { resetDeprecationWarnings } from "../../../src/tools/shared/deprecation.js";
import { logger } from "../../../src/tools/shared/logger.js";

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

function validateExample(schema: Record<string, unknown>, example: unknown, label: string) {
	if (Array.isArray(schema.enum)) {
		expect(schema.enum).toContain(example);
		return;
	}

	switch (schema.type) {
		case "string":
			expect(typeof example, `${label} should be a string`).toBe("string");
			break;
		case "boolean":
			expect(typeof example, `${label} should be a boolean`).toBe("boolean");
			break;
		case "number":
			expect(typeof example, `${label} should be a number`).toBe("number");
			break;
		case "array":
			expect(Array.isArray(example), `${label} should be an array`).toBe(true);
			break;
		case "object":
			expect(typeof example, `${label} should be an object`).toBe("object");
			break;
		default:
			throw new Error(`Unsupported schema type for examples in ${label}: ${String(schema.type)}`);
	}
}

describe("Phase 1 discoverability", () => {
beforeEach(() => {
	resetDeprecationWarnings();
	vi.restoreAllMocks();
	vi.spyOn(console, "error").mockImplementation(() => {});
});

	it("has no duplicate tool descriptions", async () => {
		const tools = await getRegisteredTools();
		expect(tools.length).toBeGreaterThan(0);

		const descriptions = new Map<string, string>();
		for (const tool of tools) {
			const existing = descriptions.get(tool.description);
			if (existing) {
				throw new Error(
					`Tools "${tool.name}" and "${existing}" share identical descriptions`,
				);
			}
			descriptions.set(tool.description, tool.name);
		}
	});

	it("emits deprecation warnings only once per deprecated tool", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await hierarchicalPromptBuilder({ context: "ctx", goal: "goal" });
		await hierarchicalPromptBuilder({ context: "ctx2", goal: "goal2" });

		await hierarchyLevelSelector({ taskDescription: "task a" });
		await hierarchyLevelSelector({ taskDescription: "task b" });

		const hierarchicalCalls = warnSpy.mock.calls.filter((call) =>
			typeof call[0] === "string" && call[0].includes("hierarchical-prompt-builder"),
		);
		const selectorCalls = warnSpy.mock.calls.filter((call) =>
			typeof call[0] === "string" && call[0].includes("hierarchy-level-selector"),
		);

		expect(hierarchicalCalls.length).toBe(1);
		expect(selectorCalls.length).toBe(1);
	});

	it("has valid schema examples", async () => {
		const tools = await getRegisteredTools();

		for (const tool of tools) {
			const properties = (tool.inputSchema as Record<string, unknown>)?.properties;
			if (!properties || typeof properties !== "object") {
				continue;
			}

			for (const [propertyName, schema] of Object.entries(properties)) {
				const examples = (schema as Record<string, unknown>).examples;
				if (!Array.isArray(examples) || examples.length === 0) {
					continue;
				}

				for (const example of examples) {
					validateExample(schema as Record<string, unknown>, example, `${tool.name}.${propertyName}`);
				}
			}
		}
	});
});
