import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { WorkflowExecutionRuntime } from "../../contracts/runtime.js";
import {
	buildWorkspaceToolSurface,
	dispatchWorkspaceToolCall,
	resolveWorkspaceToolName,
	WORKSPACE_TOOL_NAME,
	WORKSPACE_TOOL_VALIDATORS,
} from "../../tools/workspace-tools.js";

let tempStateDir: string | null = null;

beforeAll(() => {
	tempStateDir = mkdtempSync(join(tmpdir(), "workspace-tools-"));
	process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = tempStateDir;
});

afterAll(() => {
	delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
	if (tempStateDir) {
		rmSync(tempStateDir, { recursive: true, force: true });
		tempStateDir = null;
	}
});

describe("tools/workspace-tools", () => {
	it("builds the workspace surface with a single unified tool", () => {
		const tools = buildWorkspaceToolSurface();

		expect(tools.map((tool) => tool.name)).toEqual([WORKSPACE_TOOL_NAME]);
		expect(
			tools.every((tool) => WORKSPACE_TOOL_VALIDATORS.has(tool.name)),
		).toBe(true);
	});

	it("lists source files and blocks path traversal attempts", async () => {
		const runtime = {
			sessionId: "session-ABCDEFGHJKMN",
		} as WorkflowExecutionRuntime;
		const listed = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "list", path: "." },
			runtime,
		);

		expect(listed.content[0]?.text).toContain('"entries"');
		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "list", path: "../" },
				runtime,
			),
		).rejects.toThrow("Path traversal outside the workspace is not allowed");
	});

	it("rejects invalid workspace tool arguments before runtime path checks", async () => {
		const runtime = {
			sessionId: "session-ABCDEFGHJKMN",
		} as WorkflowExecutionRuntime;

		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "compare", refreshBaseline: "yes" },
				runtime,
			),
		).rejects.toThrow(/Invalid input for `agent-workspace`/);
	});

	it("resolves the workspace tool name", () => {
		expect(resolveWorkspaceToolName(WORKSPACE_TOOL_NAME)).toBe(
			WORKSPACE_TOOL_NAME,
		);
		expect(resolveWorkspaceToolName("workspace")).toBeNull();
		expect(resolveWorkspaceToolName("workspace-read")).toBeNull();
		expect(resolveWorkspaceToolName("review")).toBeNull();
	});

	it("uses an explicit sessionId when provided", async () => {
		const runtime = {
			sessionId: "session-ABCDEFGHJKMN",
		} as WorkflowExecutionRuntime;
		const sessionId = "session-abcdefghijklmnopqrstuvwx";
		const listed = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "list", scope: "artifact", sessionId },
			runtime,
		);

		expect(JSON.parse(listed.content[0]?.text ?? "{}").sessionId).toBe(
			sessionId,
		);
	});

	it("persists and reads workspace artifacts by explicit sessionId", async () => {
		const runtime = {
			sessionId: "session-ABCDEFGHJKMN",
		} as WorkflowExecutionRuntime;
		const sessionId = "session-abcdefghijklmnopqrstuvwx";
		await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{
				command: "persist",
				target: "workspace-map",
				sessionId,
				data: {
					generated: "2024-01-03T00:00:00.000Z",
					modules: {
						docs: {
							path: "docs",
							files: ["README.md"],
							dependencies: [],
						},
					},
				},
			},
			runtime,
		);

		const read = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{
				command: "read",
				scope: "artifact",
				artifact: "workspace-map",
				sessionId,
			},
			runtime,
		);

		expect(read.content[0]?.text).toContain('"README.md"');
	});

	it("rejects invalid sessionIds for artifact-backed operations", async () => {
		const runtime = {
			sessionId: "session-ABCDEFGHJKMN",
		} as WorkflowExecutionRuntime;

		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{
					command: "list",
					scope: "artifact",
					sessionId: "session-../../escape",
				},
				runtime,
			),
		).rejects.toThrow("sessionId must be a valid session ID");
	});

	it("allows source-only operations when runtime.sessionId is malformed", async () => {
		const runtime = { sessionId: "../escape" } as WorkflowExecutionRuntime;

		const listed = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "list", path: "." },
			runtime,
		);
		const read = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "read", path: "package.json" },
			runtime,
		);
		const compared = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "compare" },
			runtime,
		);

		expect(listed.content[0]?.text).toContain('"entries"');
		expect(read.content[0]?.text).toContain(
			'"name": "mcp-ai-agent-guidelines"',
		);
		expect(compared.content[0]?.text).toContain('"drift"');
	});

	it("still rejects artifact-backed operations when only runtime.sessionId is malformed", async () => {
		const runtime = { sessionId: "../escape" } as WorkflowExecutionRuntime;

		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "list", scope: "artifact" },
				runtime,
			),
		).rejects.toThrow("sessionId must be a valid session ID");
	});

	it("supports one-shot clients that provide sessionId without runtime.sessionId", async () => {
		const sessionId = "V1StGXR8_Z5jdHi6B-myT";
		await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{
				command: "persist",
				target: "scan-results",
				sessionId,
				data: { findings: [{ severity: "high", file: "src/index.ts" }] },
			},
			{} as WorkflowExecutionRuntime,
		);

		const listed = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "list", scope: "artifact", sessionId },
			{} as WorkflowExecutionRuntime,
		);

		const payload = JSON.parse(listed.content[0]?.text ?? "{}");
		expect(payload.sessionId).toBe(sessionId);
		expect(payload.entries).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ kind: "scan-results", present: true }),
			]),
		);
	});

	it("leaves the workspace map absent after fetching a fresh session", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440001";
		const runtime = {
			sessionId: "session-ABCDEFGHJKMN",
			workspaceRoot: process.cwd(),
		} as WorkflowExecutionRuntime;

		const fetched = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "fetch", sessionId, path: "package.json" },
			runtime,
		);
		const listed = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "list", scope: "artifact", sessionId },
			runtime,
		);

		const fetchPayload = JSON.parse(fetched.content[0]?.text ?? "{}");
		const listPayload = JSON.parse(listed.content[0]?.text ?? "{}");

		expect(fetchPayload.artifacts.workspaceMap).toBeNull();
		expect(listPayload.entries).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ kind: "workspace-map", present: false }),
			]),
		);
	});

	it("fetches source content merged with persisted session artifacts", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440002";
		const runtime = {
			sessionId: "session-ABCDEFGHJKMN",
			workspaceRoot: process.cwd(),
		} as WorkflowExecutionRuntime;

		await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{
				command: "persist",
				target: "session-context",
				sessionId,
				data: {
					context: {
						requestScope: "workspace-fetch direct coverage",
						phase: "testing",
					},
					progress: {
						completed: ["seeded session context"],
						next: ["fetch package bundle"],
					},
				},
			},
			runtime,
		);
		await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{
				command: "persist",
				target: "scan-results",
				sessionId,
				data: {
					generatedBy: "workspace-tools.test.ts",
					status: "ok",
					files: ["package.json"],
				},
			},
			runtime,
		);

		const fetched = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "fetch", sessionId, path: "package.json" },
			runtime,
		);
		const payload = JSON.parse(fetched.content[0]?.text ?? "{}");

		expect(payload.sessionId).toBe(sessionId);
		expect(payload.sourceFile).toMatchObject({
			path: "package.json",
		});
		expect(String(payload.sourceFile.content)).toContain(
			'"name": "mcp-ai-agent-guidelines"',
		);
		expect(payload.artifacts.sessionContext).toMatchObject({
			context: {
				requestScope: "workspace-fetch direct coverage",
				phase: "testing",
			},
		});
		expect(payload.artifacts.scanResults).toMatchObject({
			generatedBy: "workspace-tools.test.ts",
			status: "ok",
			files: ["package.json"],
		});
	});

	it("rejects path traversal for workspace fetch requests", async () => {
		const runtime = {
			sessionId: "session-ABCDEFGHJKMN",
		} as WorkflowExecutionRuntime;

		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "fetch", path: "../package.json" },
				runtime,
			),
		).rejects.toThrow("Workspace path traversal is not allowed");
		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "fetch", path: "/etc/passwd" },
				runtime,
			),
		).rejects.toThrow("Absolute paths are not allowed.");
	});

	it("binds source operations to runtime.workspaceRoot instead of import-time cwd", async () => {
		const workspaceRoot = mkdtempSync(join(tmpdir(), "workspace-root-"));
		try {
			writeFileSync(
				join(workspaceRoot, "workspace-only.txt"),
				"workspace-root-boundary\n",
				"utf8",
			);

			const read = await dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "read", path: "workspace-only.txt" },
				{
					sessionId: "session-ABCDEFGHJKMN",
					workspaceRoot,
				} as WorkflowExecutionRuntime,
			);

			expect(read.content[0]?.text).toContain("workspace-root-boundary");
		} finally {
			rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});
});
