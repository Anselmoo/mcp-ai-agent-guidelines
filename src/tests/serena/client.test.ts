import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AdvisorySerenaClient,
	ChildSerenaClient,
	resolveSerenaClient,
	type SerenaQuery,
} from "../../serena/client.js";

const sdkClientMock = vi.hoisted(() => ({
	callTool: vi.fn(),
	connect: vi.fn(),
	close: vi.fn(),
}));
const sdkTransportMock = vi.hoisted(() => ({
	close: vi.fn(),
}));
const sdkConstructors = vi.hoisted(() => ({
	Client: vi.fn(),
	StdioClientTransport: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
	Client: sdkConstructors.Client,
}));
vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({
	StdioClientTransport: sdkConstructors.StdioClientTransport,
}));

describe("AdvisorySerenaClient", () => {
	const client = new AdvisorySerenaClient();

	it("shapes find_symbol queries into a Serena tool advisory", async () => {
		const result = await client.query({
			kind: "find_symbol",
			namePath: "WorkflowEngine.executeInstruction",
			relativePath: "src/workflows",
			includeBody: true,
		});

		expect(result.kind).toBe("advisory");
		expect(result.suggestedTool).toBe("mcp__serena__find_symbol");
		expect(result.suggestedArgs).toEqual({
			name_path: "WorkflowEngine.executeInstruction",
			relative_path: "src/workflows",
			include_body: true,
		});
		expect(result.rationale).toContain("WorkflowEngine.executeInstruction");
	});

	it("maps every supported query kind to a real Serena tool name", async () => {
		const kinds: SerenaQuery["kind"][] = [
			"find_symbol",
			"find_references",
			"overview",
			"diagnostics",
			"read_memory",
			"write_memory",
			"list_memories",
		];
		for (const kind of kinds) {
			const query = buildSampleQuery(kind);
			const result = await client.query(query);
			expect(result.kind).toBe("advisory");
			expect(result.suggestedTool.startsWith("mcp__serena__")).toBe(true);
			expect(result.rationale.length).toBeGreaterThan(0);
		}
	});

	it("emits no side effects when closed", async () => {
		await expect(client.close()).resolves.toBeUndefined();
	});

	it("shapes find_references with relativePath into advisory args (branch: relative_path present)", async () => {
		const result = await client.query({
			kind: "find_references",
			namePath: "Foo.bar",
			relativePath: "src/foo.ts",
		});

		expect(result.kind).toBe("advisory");
		if (result.kind === "advisory") {
			expect(result.suggestedArgs).toEqual({
				name_path: "Foo.bar",
				relative_path: "src/foo.ts",
			});
		}
	});
});

describe("resolveSerenaClient", () => {
	const ENV_KEYS = [
		"MCP_SERENA_COMMAND",
		"MCP_SERENA_ARGS",
		"MCP_SERENA_CWD",
	] as const;
	const saved: Record<string, string | undefined> = {};

	beforeEach(() => {
		for (const key of ENV_KEYS) {
			saved[key] = process.env[key];
			delete process.env[key];
		}
	});

	afterEach(() => {
		for (const key of ENV_KEYS) {
			if (saved[key] === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = saved[key];
			}
		}
	});

	it("returns AdvisorySerenaClient when MCP_SERENA_COMMAND is unset", () => {
		expect(resolveSerenaClient()).toBeInstanceOf(AdvisorySerenaClient);
	});

	it("returns ChildSerenaClient when MCP_SERENA_COMMAND is set", () => {
		process.env.MCP_SERENA_COMMAND = "uvx";
		process.env.MCP_SERENA_ARGS = "serena start-mcp-server";
		expect(resolveSerenaClient()).toBeInstanceOf(ChildSerenaClient);
	});

	it("returns ChildSerenaClient with empty args when MCP_SERENA_ARGS is empty", () => {
		process.env.MCP_SERENA_COMMAND = "uvx";
		// MCP_SERENA_ARGS unset → exercises the `argsRaw.length > 0 ? ... : []` branch
		expect(resolveSerenaClient()).toBeInstanceOf(ChildSerenaClient);
	});

	it("ignores empty MCP_SERENA_CWD (treated as undefined)", () => {
		process.env.MCP_SERENA_COMMAND = "uvx";
		process.env.MCP_SERENA_CWD = "   ";
		expect(resolveSerenaClient()).toBeInstanceOf(ChildSerenaClient);
	});

	it("returns AdvisorySerenaClient when MCP_SERENA_COMMAND is whitespace only", () => {
		process.env.MCP_SERENA_COMMAND = "   ";
		expect(resolveSerenaClient()).toBeInstanceOf(AdvisorySerenaClient);
	});
});

describe("ChildSerenaClient", () => {
	beforeEach(() => {
		sdkClientMock.callTool.mockReset();
		sdkClientMock.connect.mockReset();
		sdkClientMock.close.mockReset();
		sdkTransportMock.close.mockReset();
		sdkConstructors.Client.mockClear();
		sdkConstructors.StdioClientTransport.mockClear();
		// biome-ignore lint/complexity/useArrowFunction: new requires a [[Construct]] slot, which arrow functions lack
		sdkConstructors.Client.mockImplementation(function () {
			return sdkClientMock;
		});
		// biome-ignore lint/complexity/useArrowFunction: same constructor reason.
		sdkConstructors.StdioClientTransport.mockImplementation(function () {
			return sdkTransportMock;
		});
		sdkClientMock.connect.mockResolvedValue(undefined);
		sdkClientMock.close.mockResolvedValue(undefined);
		sdkTransportMock.close.mockResolvedValue(undefined);
	});

	it("proxies a query to the spawned Serena child and returns data", async () => {
		sdkClientMock.callTool.mockResolvedValue({ content: [{ text: "ok" }] });
		const client = new ChildSerenaClient({
			command: "uvx",
			args: ["serena", "start-mcp-server"],
			cwd: "/tmp/project",
		});

		const result = await client.query({
			kind: "find_symbol",
			namePath: "Foo.bar",
			relativePath: "src/foo.ts",
			includeBody: true,
		});

		expect(result.kind).toBe("data");
		if (result.kind === "data") {
			expect(result.tool).toBe("find_symbol");
			expect(result.data).toEqual({ content: [{ text: "ok" }] });
		}
		expect(sdkConstructors.StdioClientTransport).toHaveBeenCalledWith({
			command: "uvx",
			args: ["serena", "start-mcp-server"],
			cwd: "/tmp/project",
		});
		expect(sdkClientMock.callTool).toHaveBeenCalledWith({
			name: "find_symbol",
			arguments: {
				name_path: "Foo.bar",
				relative_path: "src/foo.ts",
				include_body: true,
			},
		});
	});

	it("falls back to an error result when the child call fails", async () => {
		sdkClientMock.callTool.mockRejectedValue(new Error("boom"));
		const client = new ChildSerenaClient({ command: "uvx", args: [] });

		const result = await client.query({
			kind: "read_memory",
			name: "notes",
		});

		expect(result.kind).toBe("error");
		if (result.kind === "error") {
			expect(result.tool).toBe("mcp__serena__read_memory");
			expect(result.error).toContain("boom");
			expect(result.error).toContain("advisory");
		}
	});

	it("falls back to an error result when the transport fails to connect", async () => {
		sdkClientMock.connect.mockRejectedValueOnce(new Error("spawn ENOENT"));
		const client = new ChildSerenaClient({ command: "missing", args: [] });

		const result = await client.query({ kind: "list_memories" });

		expect(result.kind).toBe("error");
		if (result.kind === "error") {
			expect(result.error).toContain("spawn ENOENT");
		}
	});

	it("only connects once across concurrent queries", async () => {
		sdkClientMock.callTool.mockResolvedValue({ data: 1 });
		const client = new ChildSerenaClient({ command: "uvx", args: [] });

		await Promise.all([
			client.query({ kind: "list_memories" }),
			client.query({ kind: "list_memories" }),
			client.query({ kind: "list_memories" }),
		]);

		expect(sdkConstructors.Client).toHaveBeenCalledTimes(1);
		expect(sdkConstructors.StdioClientTransport).toHaveBeenCalledTimes(1);
		expect(sdkClientMock.connect).toHaveBeenCalledTimes(1);
		expect(sdkClientMock.callTool).toHaveBeenCalledTimes(3);
	});

	it("closes the underlying client and transport and clears state", async () => {
		sdkClientMock.callTool.mockResolvedValue({ ok: true });
		const client = new ChildSerenaClient({ command: "uvx", args: [] });

		await client.query({ kind: "list_memories" });
		await client.close();

		expect(sdkClientMock.close).toHaveBeenCalledTimes(1);
		expect(sdkTransportMock.close).toHaveBeenCalledTimes(1);

		// A subsequent query should reconnect (i.e. state was cleared).
		await client.query({ kind: "list_memories" });
		expect(sdkConstructors.Client).toHaveBeenCalledTimes(2);
	});

	it("close() is safe before connect()", async () => {
		const client = new ChildSerenaClient({ command: "uvx", args: [] });
		await expect(client.close()).resolves.toBeUndefined();
		expect(sdkClientMock.close).not.toHaveBeenCalled();
		expect(sdkTransportMock.close).not.toHaveBeenCalled();
	});

	it("returns an error when client is null after connect (defensive guard branch)", async () => {
		sdkClientMock.callTool.mockResolvedValue({ ok: true });
		const client = new ChildSerenaClient({ command: "uvx", args: [] });

		// Establish connection so connectPromise is resolved.
		await client.query({ kind: "list_memories" });

		// Force the private field to null to trigger the !this.client guard.
		// connect() returns the cached resolved promise, but client is null.
		// biome-ignore lint/suspicious/noExplicitAny: accessing private field for test
		(client as any).client = null;

		const result = await client.query({ kind: "list_memories" });
		expect(result.kind).toBe("error");
		if (result.kind === "error") {
			expect(result.error).toContain("Serena client failed to initialise");
		}
	});

	it("includes String(error) in the error message when a non-Error value is thrown", async () => {
		sdkClientMock.callTool.mockRejectedValue("plain-string-error");
		const client = new ChildSerenaClient({ command: "uvx", args: [] });

		const result = await client.query({ kind: "list_memories" });

		expect(result.kind).toBe("error");
		if (result.kind === "error") {
			expect(result.error).toContain("plain-string-error");
		}
	});

	it("write_memory query forwards content in arguments", async () => {
		sdkClientMock.callTool.mockResolvedValue({ ok: true });
		const client = new ChildSerenaClient({ command: "uvx", args: [] });

		await client.query({
			kind: "write_memory",
			name: "decisions",
			content: "use Astro v5",
		});

		expect(sdkClientMock.callTool).toHaveBeenCalledWith({
			name: "write_memory",
			arguments: { memory_name: "decisions", content: "use Astro v5" },
		});
	});
});

function buildSampleQuery(kind: SerenaQuery["kind"]): SerenaQuery {
	switch (kind) {
		case "find_symbol":
			return { kind, namePath: "Foo.bar" };
		case "find_references":
			return { kind, namePath: "Foo.bar" };
		case "overview":
			return { kind, relativePath: "src/foo.ts" };
		case "diagnostics":
			return { kind, relativePath: "src/foo.ts" };
		case "read_memory":
			return { kind, name: "notes" };
		case "write_memory":
			return { kind, name: "notes", content: "hello" };
		case "list_memories":
			return { kind };
	}
}
