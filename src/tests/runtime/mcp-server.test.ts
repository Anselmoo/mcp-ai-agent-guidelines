import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	anchorStateToClientRoots,
	createRequestHandlers,
	createRuntime,
	createServer,
} from "../../index.js";

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
	it("lists public, workspace, model-discover, and graph-visualize tools", async () => {
		const saved = process.env.MCP_FULL_SURFACE;
		try {
			process.env.MCP_FULL_SURFACE = "true";
			const handlers = createRequestHandlers(createRuntime());

			const result = await handlers.listTools();
			const names = result.tools.map((tool) => tool.name);

			expect(names).toContain("feature-implement");
			expect(names).toContain("agent-workspace");
			expect(names).toContain("model-discover");
			expect(names).toContain("graph-visualize");
		} finally {
			if (saved === undefined) delete process.env.MCP_FULL_SURFACE;
			else process.env.MCP_FULL_SURFACE = saved;
		}
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

	it("routes graph-visualize through its dedicated handler", async () => {
		const handlers = createRequestHandlers(createRuntime());

		const visualizationResult = await handlers.callTool({
			params: {
				name: "graph-visualize",
				arguments: {
					view: "instruction-chain",
					format: "mermaid",
				},
			},
		});

		expect(
			"isError" in visualizationResult ? visualizationResult.isError : false,
		).toBe(false);
		expect(JSON.stringify(visualizationResult.content)).toContain("graph LR");
	});

	it("routes instruction tool calls through the default dispatcher", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const result = await handlers.callTool({
			params: {
				name: "feature-implement",
				arguments: {
					request: "Create a small demo feature",
				},
			},
		});

		expect("isError" in result ? result.isError : false).toBe(false);
		expect(JSON.stringify(result.content)).toContain("Implement");
	});

	it("creates an MCP server bound to the supplied runtime", () => {
		const runtime = createRuntime();
		const { server, runtime: returnedRuntime } = createServer(runtime);

		expect(server).toBeDefined();
		expect(returnedRuntime).toBe(runtime);
	});

	describe("adapt tool visibility", () => {
		const savedAdaptive = process.env.DISABLE_ADAPTIVE_ROUTING;
		const savedFullSurface = process.env.MCP_FULL_SURFACE;

		afterEach(() => {
			if (savedAdaptive === undefined)
				delete process.env.DISABLE_ADAPTIVE_ROUTING;
			else process.env.DISABLE_ADAPTIVE_ROUTING = savedAdaptive;
			if (savedFullSurface === undefined) delete process.env.MCP_FULL_SURFACE;
			else process.env.MCP_FULL_SURFACE = savedFullSurface;
		});

		it("lists adapt by default (opt-out model)", async () => {
			delete process.env.DISABLE_ADAPTIVE_ROUTING;
			process.env.MCP_FULL_SURFACE = "true";
			const handlers = createRequestHandlers(createRuntime());
			const result = await handlers.listTools();
			const names = result.tools.map((tool) => tool.name);
			expect(names).toContain("routing-adapt");
		});

		it("hides adapt when DISABLE_ADAPTIVE_ROUTING is true", async () => {
			process.env.DISABLE_ADAPTIVE_ROUTING = "true";
			process.env.MCP_FULL_SURFACE = "true";
			const handlers = createRequestHandlers(createRuntime());
			const result = await handlers.listTools();
			const names = result.tools.map((tool) => tool.name);
			expect(names).not.toContain("routing-adapt");
		});
	});
});

// ---------------------------------------------------------------------------
// anchorStateToClientRoots — unit tests
// ---------------------------------------------------------------------------

describe("anchorStateToClientRoots", () => {
	let server: Server;

	beforeAll(() => {
		// createServer() returns a Server wired with all handlers — reuse it for
		// the helper tests so we don't need to configure capabilities manually.
		({ server } = createServer());
	});

	it("returns undefined when client has no roots capability", async () => {
		const mockCaps = vi
			.spyOn(server, "getClientCapabilities")
			.mockReturnValue(undefined);
		const runtime = createRuntime();

		const result = await anchorStateToClientRoots(server, runtime, {
			setBaseDir: vi.fn(),
		});

		expect(result).toBeUndefined();
		mockCaps.mockRestore();
	});

	it("returns undefined when client has roots capability but empty roots list", async () => {
		const mockCaps = vi
			.spyOn(server, "getClientCapabilities")
			.mockReturnValue({ roots: {} });
		const mockRoots = vi
			.spyOn(server, "listRoots")
			.mockResolvedValue({ roots: [] });
		const runtime = createRuntime();

		const result = await anchorStateToClientRoots(server, runtime, {
			setBaseDir: vi.fn(),
		});

		expect(result).toBeUndefined();
		mockCaps.mockRestore();
		mockRoots.mockRestore();
	});

	it("anchors state when roots list contains a file:// URI", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "anchor-roots-test-"));
		const fileUri = pathToFileURL(tmpDir).href;
		const mockCaps = vi
			.spyOn(server, "getClientCapabilities")
			.mockReturnValue({ roots: {} });
		const mockRoots = vi
			.spyOn(server, "listRoots")
			.mockResolvedValue({ roots: [{ uri: fileUri, name: "test" }] });
		const setBaseDir = vi.fn();
		const runtime = createRuntime();

		const result = await anchorStateToClientRoots(server, runtime, {
			setBaseDir,
		});

		expect(result).toBe(tmpDir);
		expect(setBaseDir).toHaveBeenCalledWith(
			expect.stringContaining(".mcp-ai-agent-guidelines"),
		);
		expect(runtime.workspaceRoot).toBe(tmpDir);
		rmSync(tmpDir, { recursive: true, force: true });
		mockCaps.mockRestore();
		mockRoots.mockRestore();
	});

	it("anchors state when roots list contains a plain (non-file://) URI", async () => {
		const mockCaps = vi
			.spyOn(server, "getClientCapabilities")
			.mockReturnValue({ roots: {} });
		const plainRoot = "/some/plain/path";
		const mockRoots = vi
			.spyOn(server, "listRoots")
			.mockResolvedValue({ roots: [{ uri: plainRoot, name: "test" }] });
		const setBaseDir = vi.fn();
		const runtime = createRuntime();

		const result = await anchorStateToClientRoots(server, runtime, {
			setBaseDir,
		});

		expect(result).toBe(plainRoot);
		expect(setBaseDir).toHaveBeenCalledWith(
			expect.stringContaining(".mcp-ai-agent-guidelines"),
		);
		mockCaps.mockRestore();
		mockRoots.mockRestore();
	});

	it("returns undefined and logs a warning when listRoots throws", async () => {
		const mockCaps = vi
			.spyOn(server, "getClientCapabilities")
			.mockReturnValue({ roots: {} });
		const mockRoots = vi
			.spyOn(server, "listRoots")
			.mockRejectedValue(new Error("transport error"));
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);
		const runtime = createRuntime();

		const result = await anchorStateToClientRoots(server, runtime, {
			setBaseDir: vi.fn(),
		});

		expect(result).toBeUndefined();
		expect(stderrSpy).toHaveBeenCalledWith(
			expect.stringContaining("Could not resolve workspace root"),
		);
		stderrSpy.mockRestore();
		mockCaps.mockRestore();
		mockRoots.mockRestore();
	});
});
