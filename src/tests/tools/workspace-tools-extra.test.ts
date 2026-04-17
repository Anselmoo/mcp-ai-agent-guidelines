import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { WorkflowExecutionRuntime } from "../../contracts/runtime.js";
import {
	buildWorkspaceToolSurface,
	dispatchWorkspaceToolCall,
	WORKSPACE_TOOL_NAME,
} from "../../tools/workspace-tools.js";

let tempStateDir: string | null = null;

beforeAll(() => {
	tempStateDir = mkdtempSync(join(tmpdir(), "workspace-tools-extra-"));
	process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = tempStateDir;
});

afterAll(() => {
	delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
	if (tempStateDir) {
		rmSync(tempStateDir, { recursive: true, force: true });
		tempStateDir = null;
	}
});

const makeRuntime = (
	sessionId = "session-ABCDEFGHJKMN",
): WorkflowExecutionRuntime =>
	({ sessionId } as WorkflowExecutionRuntime);

describe("workspace-tools extra branch coverage", () => {
	it("buildWorkspaceToolSurface returns array with at least one tool", () => {
		const tools = buildWorkspaceToolSurface();
		expect(tools.length).toBeGreaterThan(0);
		expect(tools[0]?.name).toBe(WORKSPACE_TOOL_NAME);
	});

	it("list command with default path (no path specified)", async () => {
		const runtime = makeRuntime();
		const result = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "list" },
			runtime,
		);
		expect(result.content[0]?.text).toContain('"entries"');
	});

	it("list command with explicit source scope", async () => {
		const runtime = makeRuntime();
		const result = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "list", scope: "source", path: "." },
			runtime,
		);
		expect(result.content[0]?.text).toContain('"entries"');
	});

	it("read command for a known source file", async () => {
		const runtime = makeRuntime();
		const result = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "read", path: "package.json" },
			runtime,
		);
		// The read command returns the file content
		expect(result.content[0]?.text).toContain("mcp-ai-agent-guidelines");
	});

	it("throws for unknown command", async () => {
		const runtime = makeRuntime();
		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "unknown-command" },
				runtime,
			),
		).rejects.toThrow();
	});

	it("throws for absolute path in list command", async () => {
		const runtime = makeRuntime();
		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "list", path: "/etc/passwd" },
				runtime,
			),
		).rejects.toThrow("Absolute paths are not allowed");
	});

	it("throws for unknown tool name", async () => {
		const runtime = makeRuntime();
		await expect(
			dispatchWorkspaceToolCall(
				"unknown-tool",
				{ command: "list" },
				runtime,
			),
		).rejects.toThrow();
	});

	it("throws when scope is invalid string", async () => {
		const runtime = makeRuntime();
		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				// Invalid scope value triggers parseScope throw
				{ command: "list", scope: "invalid-scope" },
				runtime,
			),
		).rejects.toThrow('Workspace scope must be either "source" or "artifact"');
	});

	it("compare command with default options", async () => {
		const runtime = makeRuntime();
		const result = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "compare", refreshBaseline: false },
			runtime,
		);
		// compare returns a snapshot comparison result
		expect(result.content[0]?.text).toBeDefined();
	});
});
