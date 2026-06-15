import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	anchorStateToClientRoots,
	createRequestHandlers,
	createRuntime,
	isDirectExecutionEntry,
} from "../index.js";
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

	it("detects direct execution when the entry path matches the module URL", () => {
		expect(
			isDirectExecutionEntry(fileURLToPath(import.meta.url), import.meta.url),
		).toBe(true);
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

	function makeMemory() {
		return { setBaseDir: vi.fn() };
	}

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("returns undefined when the client lacks the roots capability", async () => {
		const server = makeServer({
			getClientCapabilities: vi.fn().mockReturnValue({}),
		});
		const runtime = makeRuntime();
		const memory = makeMemory();

		const result = await anchorStateToClientRoots(
			server as never,
			runtime,
			memory,
		);

		expect(result).toBeUndefined();
		expect(memory.setBaseDir).not.toHaveBeenCalled();
		expect(server.listRoots).not.toHaveBeenCalled();
	});

	it("returns undefined when the client returns no roots", async () => {
		const server = makeServer({
			listRoots: vi.fn().mockResolvedValue({ roots: [] }),
		});
		const runtime = makeRuntime();
		const memory = makeMemory();

		const result = await anchorStateToClientRoots(
			server as never,
			runtime,
			memory,
		);

		expect(result).toBeUndefined();
		expect(memory.setBaseDir).not.toHaveBeenCalled();
	});

	it("anchors state to a file:// root and updates the runtime workspaceRoot", async () => {
		const server = makeServer({
			listRoots: vi
				.fn()
				.mockResolvedValue({ roots: [{ uri: "file:///tmp/some-project" }] }),
		});
		const runtime = makeRuntime();
		const memory = makeMemory();
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		const result = await anchorStateToClientRoots(
			server as never,
			runtime,
			memory,
		);

		expect(result).toBe("/tmp/some-project");
		expect(runtime.workspaceRoot).toBe("/tmp/some-project");
		expect(memory.setBaseDir).toHaveBeenCalledTimes(1);
		const baseDir = memory.setBaseDir.mock.calls[0][0] as string;
		expect(baseDir.startsWith("/tmp/some-project/")).toBe(true);
		const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join("");
		expect(stderrText).toContain("[info] Workspace root resolved");
	});

	it("passes a non-file:// URI through unchanged", async () => {
		const server = makeServer({
			listRoots: vi.fn().mockResolvedValue({ roots: [{ uri: "/raw/path" }] }),
		});
		const runtime = makeRuntime();
		const memory = makeMemory();
		vi.spyOn(process.stderr, "write").mockImplementation(() => true);

		const result = await anchorStateToClientRoots(
			server as never,
			runtime,
			memory,
		);

		expect(result).toBe("/raw/path");
		expect(runtime.workspaceRoot).toBe("/raw/path");
	});

	it("logs a warning and returns undefined when listRoots throws", async () => {
		const server = makeServer({
			listRoots: vi.fn().mockRejectedValue(new Error("rpc died")),
		});
		const runtime = makeRuntime();
		const memory = makeMemory();
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		const result = await anchorStateToClientRoots(
			server as never,
			runtime,
			memory,
		);

		expect(result).toBeUndefined();
		expect(memory.setBaseDir).not.toHaveBeenCalled();
		expect(runtime.workspaceRoot).toBe("/old/root");
		const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join("");
		expect(stderrText).toContain("[warn] Could not resolve workspace root");
		expect(stderrText).toContain("rpc died");
	});
});
