import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createRequestHandlers, createRuntime } from "../../index.js";

let tempStateDir: string;

beforeAll(() => {
	tempStateDir = mkdtempSync(join(tmpdir(), "mcp-server-test-"));
	process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = tempStateDir;
});

afterAll(() => {
	delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
	rmSync(tempStateDir, { recursive: true, force: true });
});

describe("mcp server request handlers", () => {
	it("lists public, workspace, memory, session, snapshot, and orchestration tools", async () => {
		const handlers = createRequestHandlers(createRuntime());

		const result = await handlers.listTools();
		const names = result.tools.map((tool) => tool.name);

		expect(names).toContain("feature-implement");
		expect(names).toContain("agent-workspace");
		expect(names).toContain("agent-memory");
		expect(names).toContain("agent-session");
		expect(names).toContain("agent-snapshot");
		expect(names).toContain("orchestration-config");
	});

	it("routes canonical workspace tool calls through MCP-friendly error formatting", async () => {
		const handlers = createRequestHandlers(createRuntime());

		const result = await handlers.callTool({
			params: {
				name: "agent-workspace",
				arguments: {
					command: "read",
					path: "/etc/passwd",
				},
			},
		});
		const text = JSON.stringify(result.content);

		expect("isError" in result && result.isError).toBe(true);
		expect(text).toContain("Tool `agent-workspace` failed");
		expect(text).toContain("Absolute paths are not allowed");
	});

	it("routes model-discover through the model discovery handler", async () => {
		const handlers = createRequestHandlers(createRuntime());

		const result = await handlers.callTool({
			params: {
				name: "model-discover",
				arguments: {
					models: [
						{ id: "gpt-4.1", role: "free_primary", provider: "openai" },
						{
							id: "claude-sonnet-4-6",
							role: "strong_primary",
							provider: "anthropic",
						},
					],
				},
			},
		});
		const text =
			result.content[0] && "text" in result.content[0]
				? result.content[0].text
				: "";

		expect("isError" in result ? result.isError : false).toBe(false);
		expect(text).toContain('"assignedRoles"');
		expect(text).toContain("free_primary");
	});

	it("returns resources and prompts through the public MCP surface", async () => {
		const handlers = createRequestHandlers(createRuntime());

		const resources = await handlers.listResources();
		const taxonomy = await handlers.readResource({
			params: { uri: "mcp-guidelines://graph/taxonomy" },
		});
		const prompts = await handlers.listPrompts();
		const prompt = await handlers.getPrompt({
			params: {
				name: "review-runtime",
				arguments: {
					artifact: "review this code",
				},
			},
		});

		expect(
			resources.resources.some(
				(resource) => resource.uri === "mcp-guidelines://graph/taxonomy",
			),
		).toBe(true);
		expect(taxonomy.contents[0]?.text).toContain("Requirements Discovery");
		expect(
			prompts.prompts.some((entry) => entry.name === "review-runtime"),
		).toBe(true);
		expect(prompt.messages[0]?.content.text).toContain("review this code");
	});

	describe("adapt tool visibility", () => {
		const savedAdaptive = process.env.ENABLE_ADAPTIVE_ROUTING;

		afterEach(() => {
			if (savedAdaptive === undefined)
				delete process.env.ENABLE_ADAPTIVE_ROUTING;
			else process.env.ENABLE_ADAPTIVE_ROUTING = savedAdaptive;
		});

		it("hides adapt when ENABLE_ADAPTIVE_ROUTING is not set", async () => {
			delete process.env.ENABLE_ADAPTIVE_ROUTING;
			const handlers = createRequestHandlers(createRuntime());
			const result = await handlers.listTools();
			const names = result.tools.map((tool) => tool.name);
			expect(names).not.toContain("routing-adapt");
		});

		it("lists adapt when ENABLE_ADAPTIVE_ROUTING is true", async () => {
			process.env.ENABLE_ADAPTIVE_ROUTING = "true";
			const handlers = createRequestHandlers(createRuntime());
			const result = await handlers.listTools();
			const names = result.tools.map((tool) => tool.name);
			expect(names).toContain("routing-adapt");
		});
	});
});
