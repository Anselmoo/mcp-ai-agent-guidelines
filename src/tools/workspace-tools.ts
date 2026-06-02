import { isAbsolute, relative, resolve, sep } from "node:path";
import type { WorkflowExecutionRuntime } from "../contracts/runtime.js";
import { createWorkspaceSurface } from "../skills/runtime/workspace-adapter.js";
import {
	buildToolValidators,
	type ToolDefinitionWithInputSchema,
	validateToolArguments,
} from "./shared/tool-validators.js";

const VALID_WORKSPACE_COMMANDS = new Set<WorkspaceCommand>(["list", "read"]);

function stringifyJson(value: unknown) {
	return `${JSON.stringify(value, null, "\t")}\n`;
}

function normalizeRelativePath(pathValue: unknown) {
	if (typeof pathValue !== "string" || pathValue.trim() === "") {
		return ".";
	}

	if (isAbsolute(pathValue)) {
		throw new Error("Absolute paths are not allowed.");
	}

	return pathValue;
}

function resolveWorkspaceRoot(runtime: WorkflowExecutionRuntime) {
	return resolve(runtime.workspaceRoot ?? process.cwd());
}

function resolveWorkspacePath(workspaceRoot: string, pathValue: unknown) {
	const workspacePath = normalizeRelativePath(pathValue);
	const resolvedPath = resolve(workspaceRoot, workspacePath);
	const relativePath = relative(workspaceRoot, resolvedPath);

	if (
		relativePath === ".." ||
		relativePath.startsWith(`..${sep}`) ||
		isAbsolute(relativePath)
	) {
		throw new Error("Path traversal outside the workspace is not allowed.");
	}

	return {
		workspacePath,
		resolvedPath,
	};
}

export type WorkspaceCommand = "list" | "read";

export const WORKSPACE_TOOL_NAME = "agent-workspace";

export const WORKSPACE_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: WORKSPACE_TOOL_NAME,
			description:
				"Source-file workspace operations. `list` enumerates files in a directory; `read` returns file contents. Cross-session memory now lives in Serena (see the 🧭 Serena enrichment footer on every tool response). Canonical name: `agent-workspace`.",
			inputSchema: {
				type: "object" as const,
				properties: {
					command: {
						type: "string" as const,
						enum: ["list", "read"] as const,
						description: "Operation: list directory entries or read a file.",
					},
					path: {
						type: "string" as const,
						description: "Relative path inside the workspace.",
					},
				},
				required: ["command"],
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
	];

export const WORKSPACE_TOOL_VALIDATORS = buildToolValidators(
	WORKSPACE_TOOL_DEFINITIONS,
);

export function buildWorkspaceToolSurface() {
	return WORKSPACE_TOOL_DEFINITIONS;
}

export function resolveWorkspaceToolName(
	toolName: string,
): typeof WORKSPACE_TOOL_NAME | null {
	return toolName === WORKSPACE_TOOL_NAME ? WORKSPACE_TOOL_NAME : null;
}

function parseWorkspaceCommand(
	args: Record<string, unknown>,
): WorkspaceCommand {
	const cmd = args.command;
	if (
		typeof cmd !== "string" ||
		!VALID_WORKSPACE_COMMANDS.has(cmd as WorkspaceCommand)
	) {
		throw new Error(
			`workspace command must be one of: ${[...VALID_WORKSPACE_COMMANDS].join(", ")}.`,
		);
	}
	return cmd as WorkspaceCommand;
}

export async function dispatchWorkspaceToolCall(
	toolName: string,
	args: unknown,
	runtime: WorkflowExecutionRuntime,
) {
	const canonicalName = resolveWorkspaceToolName(toolName);
	if (!canonicalName) {
		throw new Error(`Unknown workspace tool: ${toolName}`);
	}

	const record = validateToolArguments(
		canonicalName,
		args,
		WORKSPACE_TOOL_VALIDATORS,
	);
	const command = parseWorkspaceCommand(record);
	const workspaceRoot = resolveWorkspaceRoot(runtime);
	const workspace = createWorkspaceSurface(workspaceRoot);

	switch (command) {
		case "list": {
			const { workspacePath, resolvedPath } = resolveWorkspacePath(
				workspaceRoot,
				record.path,
			);
			const relativePath =
				workspacePath === "." ? "." : relative(workspaceRoot, resolvedPath);
			const visible = await workspace.listFiles(relativePath);

			return {
				content: [
					{
						type: "text" as const,
						text: stringifyJson({ path: workspacePath, entries: visible }),
					},
				],
			};
		}
		case "read": {
			const { workspacePath, resolvedPath } = resolveWorkspacePath(
				workspaceRoot,
				record.path,
			);
			const relativePath =
				workspacePath === "." ? "." : relative(workspaceRoot, resolvedPath);
			const content = await workspace.readFile(relativePath);
			return {
				content: [
					{
						type: "text" as const,
						text: content,
					},
				],
			};
		}
		default:
			throw new Error(`Unknown workspace command: ${command}`);
	}
}
