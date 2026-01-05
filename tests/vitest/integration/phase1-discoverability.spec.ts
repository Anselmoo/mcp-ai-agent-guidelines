/**
 * Integration: Phase 1 Discoverability (P1-018)
 *
 * Tests for tool discoverability features including:
 * - Unique tool descriptions
 * - Action-verb based descriptions
 * - Schema example validation
 */
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function validateExample(
	schema: Record<string, unknown>,
	example: unknown,
	label: string,
) {
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
			expect(
				typeof example === "object" &&
					example !== null &&
					!Array.isArray(example),
				`${label} should be a non-null object`,
			).toBe(true);
			break;
		default:
			throw new Error(
				`Unsupported schema type for examples in ${label}: ${String(schema.type)}`,
			);
	}
}

/**
 * Approved action verbs for tool descriptions.
 * All tool descriptions must start with one of these verbs.
 *
 * PR #807 Review Fix: Removed non-verbs "Multi-language" and "Unified".
 * Tools using those adjectives should be rewritten to start with proper
 * action verbs like "Audit", "Scan", or "Perform".
 */
const ACTION_VERBS = [
	"Analyze",
	"Audit",
	"Build",
	"Calculate",
	"Compose",
	"Create",
	"Evaluate",
	"Execute",
	"Generate",
	"Guide",
	"Iterate",
	"Manage",
	"Optimize",
	"Orchestrate",
	"Perform",
	"Recommend",
	"Scan",
	"Select",
	"Switch",
	"Track",
	"Use",
	"Validate",
];

describe("Phase 1 discoverability", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("has no duplicate tool descriptions", async () => {
		const tools = await getRegisteredTools();
		expect(tools.length).toBeGreaterThan(0);

		const descriptions = new Map<string, string>();
		for (const tool of tools) {
			const desc = tool.description ?? "";
			const existing = descriptions.get(desc);
			if (existing) {
				throw new Error(
					`Tools "${tool.name}" and "${existing}" share identical descriptions`,
				);
			}
			descriptions.set(desc, tool.name);
		}
	});

	it("uses action-verb tool descriptions", async () => {
		const tools = await getRegisteredTools();

		for (const tool of tools) {
			// PR #807 Review Fix: Guard against empty or whitespace-only descriptions
			const description = tool.description?.trim();
			expect(
				description && description.length > 0,
				`Tool "${tool.name}" has empty or missing description`,
			).toBeTruthy();

			// Safe to split after the truthy check above
			const firstWord = description?.split(/\s+/)[0] ?? "";
			expect(
				ACTION_VERBS,
				`Tool "${tool.name}" description starts with "${firstWord}" which is not an approved action verb. Approved verbs: ${ACTION_VERBS.join(", ")}`,
			).toContain(firstWord);
		}
	});

	it("has valid schema examples", async () => {
		const tools = await getRegisteredTools();

		for (const tool of tools) {
			const properties = (tool.inputSchema as Record<string, unknown>)
				?.properties;
			if (!properties || typeof properties !== "object") {
				continue;
			}

			for (const [propertyName, schema] of Object.entries(properties)) {
				const examples = (schema as Record<string, unknown>).examples;
				if (!Array.isArray(examples) || examples.length === 0) {
					continue;
				}

				for (const example of examples) {
					validateExample(
						schema as Record<string, unknown>,
						example,
						`${tool.name}.${propertyName}`,
					);
				}
			}
		}
	});
});
