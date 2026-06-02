import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	AdvisorySerenaClient,
	ChildSerenaClient,
	resolveSerenaClient,
	type SerenaQuery,
} from "../../serena/client.js";

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
