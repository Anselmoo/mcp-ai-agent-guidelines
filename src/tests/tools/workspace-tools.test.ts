import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { WorkflowExecutionRuntime } from "../../contracts/runtime.js";
import {
	buildWorkspaceToolSurface,
	dispatchWorkspaceToolCall,
	resolveWorkspaceToolName,
	WORKSPACE_TOOL_NAME,
	WORKSPACE_TOOL_VALIDATORS,
} from "../../tools/workspace-tools.js";

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

	it("resolves the workspace tool name", () => {
		expect(resolveWorkspaceToolName(WORKSPACE_TOOL_NAME)).toBe(
			WORKSPACE_TOOL_NAME,
		);
		expect(resolveWorkspaceToolName("not-workspace")).toBeNull();
	});

	it("rejects removed artifact-backed commands", async () => {
		const runtime = {
			sessionId: "session-ABCDEFGHJKMN",
		} as WorkflowExecutionRuntime;

		for (const command of ["persist", "fetch", "compare"]) {
			await expect(
				dispatchWorkspaceToolCall(WORKSPACE_TOOL_NAME, { command }, runtime),
			).rejects.toThrow(
				/(Invalid input for `agent-workspace`|workspace command must be one of)/,
			);
		}
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
