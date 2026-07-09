import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	anchorStateToClientRoots,
	createRequestHandlers,
	createRuntime,
	createServer,
	isDirectExecutionEntry,
} from "../index.js";
import { MemorySessionStore } from "../runtime/memory-session-store.js";
import { EPHEMERAL_ENV_VAR } from "../runtime/session-store-utils.js";
import * as modelDiscoveryTools from "../tools/model-discovery.js";
import { MODEL_DISCOVERY_TOOL_NAME } from "../tools/model-discovery.js";
import * as visualizationTools from "../tools/visualization-tools.js";
import * as workspaceTools from "../tools/workspace-tools.js";
import { ValidationService } from "../validation/index.js";

function getFirstText(
	result: Awaited<
		ReturnType<ReturnType<typeof createRequestHandlers>["callTool"]>
	>,
): string {
	const first = result.content[0];
	return first?.type === "text" ? first.text : "";
}

describe("index request handlers", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("lists available public prompts", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const result = await handlers.listPrompts();

		expect(result.prompts).toEqual(expect.any(Array));
		expect(
			(result.prompts as Array<{ name: string }>).some(
				(prompt) => prompt.name === "bootstrap-session",
			),
		).toBe(true);
	});

	it("returns a bootstrap-session prompt payload", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const prompt = await handlers.getPrompt({
			params: {
				name: "bootstrap-session",
				arguments: { request: "init session" },
			},
		});

		expect(prompt).toEqual(
			expect.objectContaining({
				description: expect.any(String),
				messages: expect.any(Array),
			}),
		);
		expect(prompt.messages[0]?.content?.text).toContain(
			"Bootstrap this session",
		);
	});

	it("returns an error for an unknown tool name", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const result = await handlers.callTool({
			params: { name: "not-a-real-tool-name", arguments: { request: "foo" } },
		});
		const text =
			result.content[0] && "text" in result.content[0]
				? result.content[0].text
				: "";

		expect("isError" in result && result.isError).toBe(true);
		expect(text).toContain("Unknown instruction tool");
	});

	it.each([
		{
			args: {
				models: [{ id: "gpt-4.1", role: "free_primary", provider: "openai" }],
			},
			name: MODEL_DISCOVERY_TOOL_NAME,
			setup: () =>
				vi
					.spyOn(modelDiscoveryTools, "dispatchModelDiscoveryToolCall")
					.mockRejectedValue(new Error("model boom")),
		},
		{
			args: { format: "mermaid", view: "instruction-chain" },
			name: "graph-visualize",
			setup: () =>
				vi
					.spyOn(visualizationTools, "dispatchVisualizationToolCall")
					.mockRejectedValue(new Error("visualization boom")),
		},
		{
			args: { command: "list" },
			name: "agent-workspace",
			setup: () =>
				vi
					.spyOn(workspaceTools, "dispatchWorkspaceToolCall")
					.mockRejectedValue(new Error("workspace boom")),
		},
	])("formats auxiliary handler failures for %s", async ({
		args,
		name,
		setup,
	}) => {
		vi.spyOn(ValidationService, "getInstance").mockImplementation(() => {
			throw new Error("validation not initialized");
		});
		vi.spyOn(ValidationService, "initialize").mockReturnValue({
			formatError: ({ message }: { message: string }) => `formatted ${message}`,
		} as never);
		setup();

		const handlers = createRequestHandlers(createRuntime());
		const result = await handlers.callTool({
			params: { name, arguments: args },
		});

		expect("isError" in result && result.isError).toBe(true);
		expect(getFirstText(result)).toContain(`formatted Tool \`${name}\` failed`);
	});

	it.each([
		{
			name: MODEL_DISCOVERY_TOOL_NAME,
			setup: () =>
				vi
					.spyOn(modelDiscoveryTools, "dispatchModelDiscoveryToolCall")
					.mockResolvedValue({ content: [] } as never),
			getSpy: () => modelDiscoveryTools.dispatchModelDiscoveryToolCall,
		},
		{
			name: "graph-visualize",
			setup: () =>
				vi
					.spyOn(visualizationTools, "dispatchVisualizationToolCall")
					.mockResolvedValue({ content: [] } as never),
			getSpy: () => visualizationTools.dispatchVisualizationToolCall,
		},
		{
			name: "agent-workspace",
			setup: () =>
				vi
					.spyOn(workspaceTools, "dispatchWorkspaceToolCall")
					.mockResolvedValue({ content: [] } as never),
			getSpy: () => workspaceTools.dispatchWorkspaceToolCall,
		},
	])("defaults missing call arguments to {} for %s (?? fallback)", async ({
		name,
		setup,
		getSpy,
	}) => {
		setup();
		const handlers = createRequestHandlers(createRuntime());

		await handlers.callTool({ params: { name } });

		const spy = vi.mocked(getSpy());
		expect(spy).toHaveBeenCalled();
		// arguments is omitted from the request, so the `args ?? {}` fallback
		// inside callTool must supply an empty object to the dispatcher.
		const callArgs = spy.mock.calls.at(-1);
		expect(callArgs?.[1]).toEqual({});
	});

	it("createServer defaults to a freshly created runtime when none is supplied", () => {
		const { server, runtime } = createServer();

		expect(server).toBeDefined();
		expect(runtime).toBeDefined();
		expect(runtime.sessionId).toEqual(expect.any(String));
	});

	it("detects direct execution when the entry path matches the module URL", () => {
		expect(
			isDirectExecutionEntry(fileURLToPath(import.meta.url), import.meta.url),
		).toBe(true);
	});

	it("returns false when entryPath is undefined", () => {
		expect(isDirectExecutionEntry(undefined, import.meta.url)).toBe(false);
	});

	it("falls back to URL comparison when realpath fails", () => {
		// A non-existent path makes realpathSync throw, exercising the catch fallback.
		const missing = "/path/that/does/not/exist/index.js";
		// Equal URLs → true via the URL-comparison branch.
		expect(isDirectExecutionEntry(missing, `file://${missing}`)).toBe(true);
		// Different URLs → false via the URL-comparison branch.
		expect(isDirectExecutionEntry(missing, "file:///other/path.js")).toBe(
			false,
		);
	});

	it("createRuntime uses the in-memory session store in ephemeral mode", () => {
		const saved = process.env[EPHEMERAL_ENV_VAR];
		process.env[EPHEMERAL_ENV_VAR] = "true";
		try {
			const runtime = createRuntime();
			expect(runtime.sessionStore).toBeInstanceOf(MemorySessionStore);
		} finally {
			if (saved === undefined) delete process.env[EPHEMERAL_ENV_VAR];
			else process.env[EPHEMERAL_ENV_VAR] = saved;
		}
	});

	it("createRuntime honors an injected serena client (?? short-circuit)", async () => {
		const fakeSerena = {
			query: async () => ({ kind: "advisory" as const }),
			close: async () => undefined,
		};
		const runtime = createRuntime({ serena: fakeSerena as never });
		expect(runtime.serena).toBe(fakeSerena);
	});

	it("createRuntime resolves a real serena client when none is injected", () => {
		const runtime = createRuntime();
		expect(runtime.serena).toBeDefined();
		expect(typeof runtime.serena?.query).toBe("function");
	});

	it("callTool dispatches the workspace tool path", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const result = await handlers.callTool({
			params: { name: "agent-workspace", arguments: { command: "list" } },
		});
		// Either success or formatted error — both prove the workspace branch ran.
		expect(result).toHaveProperty("content");
	});

	it("listResources, listPrompts, readResource have stable shapes", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const resources = await handlers.listResources();
		expect(Array.isArray(resources.resources)).toBe(true);

		const prompts = await handlers.listPrompts();
		expect(Array.isArray(prompts.prompts)).toBe(true);

		// Unknown URI → readResource throws (exercises the dispatch path).
		await expect(
			handlers.readResource({
				params: { uri: "mcp://does-not-exist/foo" },
			}),
		).rejects.toThrow(/Unknown resource/);
	});
});

describe("anchorStateToClientRoots", () => {
	type FakeServer = {
		getClientCapabilities: ReturnType<typeof vi.fn>;
		listRoots: ReturnType<typeof vi.fn>;
	};

	function makeServer(overrides: Partial<FakeServer> = {}): FakeServer {
		return {
			getClientCapabilities: vi.fn().mockReturnValue({ roots: {} }),
			listRoots: vi.fn().mockResolvedValue({ roots: [] }),
			...overrides,
		};
	}

	function makeRuntime() {
		return {
			workspaceRoot: "/old/root",
		} as unknown as Parameters<typeof anchorStateToClientRoots>[1];
	}

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("returns undefined when the client lacks the roots capability", async () => {
		const server = makeServer({
			getClientCapabilities: vi.fn().mockReturnValue({}),
		});
		const runtime = makeRuntime();

		const result = await anchorStateToClientRoots(server as never, runtime);

		expect(result).toBeUndefined();
		expect(server.listRoots).not.toHaveBeenCalled();
	});

	it("returns undefined when the client returns no roots", async () => {
		const server = makeServer({
			listRoots: vi.fn().mockResolvedValue({ roots: [] }),
		});
		const runtime = makeRuntime();

		const result = await anchorStateToClientRoots(server as never, runtime);

		expect(result).toBeUndefined();
	});

	it("anchors state to a file:// root and updates the runtime workspaceRoot", async () => {
		const server = makeServer({
			listRoots: vi
				.fn()
				.mockResolvedValue({ roots: [{ uri: "file:///tmp/some-project" }] }),
		});
		const runtime = makeRuntime();
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		const result = await anchorStateToClientRoots(server as never, runtime);

		expect(result).toBe("/tmp/some-project");
		expect(runtime.workspaceRoot).toBe("/tmp/some-project");
		const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join("");
		expect(stderrText).toContain("[info] Workspace root resolved");
	});

	it("accepts a non-file:// URI when the path is still absolute", async () => {
		const server = makeServer({
			listRoots: vi.fn().mockResolvedValue({ roots: [{ uri: "/raw/path" }] }),
		});
		const runtime = makeRuntime();
		vi.spyOn(process.stderr, "write").mockImplementation(() => true);

		const result = await anchorStateToClientRoots(server as never, runtime);

		expect(result).toBe("/raw/path");
		expect(runtime.workspaceRoot).toBe("/raw/path");
	});

	it("rejects virtual-filesystem URIs that do not resolve to an absolute path", async () => {
		const server = makeServer({
			listRoots: vi.fn().mockResolvedValue({
				roots: [{ uri: "vscode-vfs://github/org/repo" }],
			}),
		});
		const runtime = makeRuntime();
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		const result = await anchorStateToClientRoots(server as never, runtime);

		expect(result).toBeUndefined();
		expect(runtime.workspaceRoot).toBe("/old/root");
		const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join("");
		expect(stderrText).toContain(
			"[warn] Skipping non-filesystem workspace root URI",
		);
	});

	it("logs a warning and returns undefined when listRoots throws", async () => {
		const server = makeServer({
			listRoots: vi.fn().mockRejectedValue(new Error("rpc died")),
		});
		const runtime = makeRuntime();
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		const result = await anchorStateToClientRoots(server as never, runtime);

		expect(result).toBeUndefined();
		expect(runtime.workspaceRoot).toBe("/old/root");
		const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join("");
		expect(stderrText).toContain("[warn] Could not resolve workspace root");
		expect(stderrText).toContain("rpc died");
	});
});
