/**
 * Test: Comprehensive Tool Annotation Coverage
 *
 * Validates that ALL registered tools have proper ToolAnnotations
 * with required fields (title, readOnlyHint, etc.).
 *
 * Part of: Anselmoo/mcp-ai-agent-guidelines#695 (P1-005)
 */

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Tool Annotation Coverage", () => {
	/**
	 * Helper to get tools from the MCP server
	 */
	async function getTools(): Promise<Tool[]> {
		// Start the server
		const serverPath = join(__dirname, "../../../dist/index.js");
		const serverProcess = spawn("node", [serverPath], {
			stdio: ["pipe", "pipe", "pipe"],
		});

		// Create client transport
		const transport = new StdioClientTransport({
			command: "node",
			args: [serverPath],
		});

		// Create and connect client
		const client = new Client(
			{
				name: "test-client",
				version: "1.0.0",
			},
			{
				capabilities: {},
			},
		);

		try {
			await client.connect(transport);

			// List all tools
			const response = await client.listTools();

			// Clean up
			await client.close();
			serverProcess.kill();

			return response.tools;
		} catch (error) {
			serverProcess.kill();
			throw error;
		}
	}

	it("should have annotations on all registered tools", async () => {
		const tools = await getTools();

		expect(tools).toBeDefined();
		expect(tools.length).toBeGreaterThan(0);

		// Track tools without annotations for better error reporting
		const toolsWithoutAnnotations: string[] = [];
		const toolsWithoutTitle: string[] = [];
		const toolsWithInvalidReadOnlyHint: string[] = [];

		// Verify each tool has proper annotations
		for (const tool of tools) {
			if (!tool.annotations) {
				toolsWithoutAnnotations.push(tool.name);
				continue;
			}

			// Check for title
			if (!tool.annotations.title) {
				toolsWithoutTitle.push(tool.name);
			}

			// Check readOnlyHint is a boolean
			if (typeof tool.annotations.readOnlyHint !== "boolean") {
				toolsWithInvalidReadOnlyHint.push(tool.name);
			}

			// All annotations should have these fields as booleans
			expect(typeof tool.annotations.readOnlyHint).toBe("boolean");
			expect(typeof tool.annotations.destructiveHint).toBe("boolean");
			expect(typeof tool.annotations.idempotentHint).toBe("boolean");
			expect(typeof tool.annotations.openWorldHint).toBe("boolean");
		}

		// Report all tools without annotations
		if (toolsWithoutAnnotations.length > 0) {
			throw new Error(
				`Tools without annotations: ${toolsWithoutAnnotations.join(", ")}`,
			);
		}

		// Report all tools without titles
		if (toolsWithoutTitle.length > 0) {
			throw new Error(
				`Tools without title in annotations: ${toolsWithoutTitle.join(", ")}`,
			);
		}

		// Report all tools with invalid readOnlyHint
		if (toolsWithInvalidReadOnlyHint.length > 0) {
			throw new Error(
				`Tools with invalid readOnlyHint: ${toolsWithInvalidReadOnlyHint.join(", ")}`,
			);
		}
	});

	it("should have at least 30+ tools registered", async () => {
		const tools = await getTools();

		// We expect at least 30 tools in this MCP server
		expect(tools.length).toBeGreaterThanOrEqual(30);
	});

	it("should use appropriate annotation presets", async () => {
		const tools = await getTools();

		// Define expected annotation patterns for specific tools
		const expectedAnnotations: Record<
			string,
			{ readOnly: boolean; idempotent: boolean; openWorld: boolean }
		> = {
			// GENERATION tools - read-only, idempotent, not open world
			"strategy-frameworks-builder": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},
			"sprint-timeline-calculator": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},
			"mermaid-diagram-generator": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},
			"prompt-chaining-builder": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},
			"prompt-flow-builder": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},
			"l9-distinguished-engineer-prompt-builder": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},
			"digital-enterprise-architect-prompt-builder": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},

			// ANALYSIS tools - read-only, idempotent, not open world
			"model-compatibility-checker": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},
			"memory-context-optimizer": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},
			"guidelines-validator": {
				readOnly: true,
				idempotent: true,
				openWorld: false,
			},

			// FILESYSTEM tools - read-only, idempotent, open world
			"project-onboarding": {
				readOnly: true,
				idempotent: true,
				openWorld: true,
			},
		};

		// Verify each tool has the expected annotation pattern
		for (const [toolName, expected] of Object.entries(expectedAnnotations)) {
			const tool = tools.find((t) => t.name === toolName);
			expect(tool).toBeDefined();
			expect(tool?.annotations).toBeDefined();

			expect(tool?.annotations?.readOnlyHint).toBe(expected.readOnly);
			expect(tool?.annotations?.idempotentHint).toBe(expected.idempotent);
			expect(tool?.annotations?.openWorldHint).toBe(expected.openWorld);
			expect(tool?.annotations?.destructiveHint).toBe(false); // All should be non-destructive
		}
	});

	it("should have unique titles for all tools", async () => {
		const tools = await getTools();

		// Collect all titles
		const titles = new Set<string>();
		const duplicateTitles: string[] = [];

		for (const tool of tools) {
			if (tool.annotations?.title) {
				if (titles.has(tool.annotations.title)) {
					duplicateTitles.push(tool.annotations.title);
				}
				titles.add(tool.annotations.title);
			}
		}

		// Report duplicates
		if (duplicateTitles.length > 0) {
			throw new Error(
				`Duplicate annotation titles found: ${duplicateTitles.join(", ")}`,
			);
		}
	});
});
