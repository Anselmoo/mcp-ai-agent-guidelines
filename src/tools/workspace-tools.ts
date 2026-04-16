import { isAbsolute, relative, resolve, sep } from "node:path";
import type { WorkflowExecutionRuntime } from "../contracts/runtime.js";
import { sharedToonMemoryInterface } from "../memory/shared-memory.js";
import { assertValidSessionId } from "../runtime/secure-session-store.js";
import {
	createWorkspaceSurface,
	type WorkspaceArtifactKind,
	type WritableWorkspaceArtifactKind,
} from "../skills/runtime/workspace-adapter.js";
import {
	buildToolValidators,
	type ToolDefinitionWithInputSchema,
	validateToolArguments,
} from "./shared/tool-validators.js";

const ARTIFACT_NAMES = [
	"session-context",
	"workspace-map",
	"scan-results",
	"fingerprint-snapshot",
] as const satisfies readonly WorkspaceArtifactKind[];
const WRITABLE_ARTIFACT_NAMES = [
	"session-context",
	"workspace-map",
	"scan-results",
] as const satisfies readonly WritableWorkspaceArtifactKind[];
const VALID_WORKSPACE_COMMANDS = new Set<WorkspaceCommand>([
	"list",
	"read",
	"persist",
	"fetch",
	"compare",
]);

function parseScope(scopeValue: unknown) {
	if (scopeValue === undefined) {
		return "source" as const;
	}

	if (scopeValue === "source" || scopeValue === "artifact") {
		return scopeValue;
	}

	throw new Error('Workspace scope must be either "source" or "artifact".');
}

function resolveSessionId(sessionIdValue: unknown, defaultSessionId: string) {
	if (sessionIdValue === undefined) {
		return assertValidSessionId(defaultSessionId);
	}

	return assertValidSessionId(sessionIdValue);
}

function parseArtifactName(
	artifactValue: unknown,
	allowedArtifacts: readonly string[] = ARTIFACT_NAMES,
) {
	if (
		typeof artifactValue !== "string" ||
		!allowedArtifacts.includes(artifactValue)
	) {
		throw new Error(
			`Workspace artifact must be one of: ${allowedArtifacts.join(", ")}.`,
		);
	}

	return artifactValue as WorkspaceArtifactKind;
}

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

export type WorkspaceCommand =
	| "list"
	| "read"
	| "persist"
	| "fetch"
	| "compare";

export const WORKSPACE_TOOL_NAME = "agent-workspace";

export const WORKSPACE_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: WORKSPACE_TOOL_NAME,
			description:
				"Unified workspace operations. Primary surface for source files, with additional support for session-backed artifacts and snapshot comparison through the same entrypoint. Canonical name: `agent-workspace`.",
			inputSchema: {
				type: "object" as const,
				properties: {
					command: {
						type: "string" as const,
						enum: ["list", "read", "persist", "fetch", "compare"] as const,
						description:
							"list/read operate on source files by default. persist/fetch support session-backed artifacts, and compare surfaces snapshot drift when callers want a single workspace-oriented entrypoint.",
					},
					path: {
						type: "string" as const,
						description: "Relative path inside the workspace.",
					},
					scope: {
						type: "string" as const,
						enum: ["source", "artifact"] as const,
						description:
							'Use "source" for repository files or "artifact" for TOON/JSON session assets.',
					},
					target: {
						type: "string" as const,
						enum: [...WRITABLE_ARTIFACT_NAMES] as const,
						description:
							"(persist only) Session artifact to update: TOON context, workspace map, or scan results.",
					},
					data: {
						type: "object" as const,
						description:
							"(persist only) Structured value to persist into the artifact.",
					},
					artifact: {
						type: "string" as const,
						enum: [...ARTIFACT_NAMES] as const,
						description:
							"(read only) Artifact name when reading from the session-backed workspace surface.",
					},
					refreshBaseline: {
						type: "boolean" as const,
						description:
							"(compare only) When true, refresh the fingerprint snapshot before comparison.",
					},
					selector: {
						type: "string" as const,
						description:
							"(compare only) Snapshot selector: latest (default), previous, oldest, or a concrete snapshot ID.",
					},
					sessionId: {
						type: "string" as const,
						description: "Optional session ID for artifact-backed operations.",
					},
				},
				required: ["command"],
			},
			annotations: {
				readOnlyHint: false,
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
	const workspace = createWorkspaceSurface(workspaceRoot, {
		memoryInterface: sharedToonMemoryInterface,
	});
	const scope = parseScope(record.scope);

	switch (command) {
		case "list": {
			if (scope === "artifact") {
				const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
				const artifacts = await workspace.listArtifacts(sessionId);
				return {
					content: [
						{
							type: "text" as const,
							text: stringifyJson({
								sessionId,
								scope,
								entries: artifacts,
							}),
						},
					],
				};
			}
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
			if (scope === "artifact") {
				const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
				const artifact = parseArtifactName(record.artifact);
				const content = await workspace.readArtifact({
					artifact,
					sessionId,
				});
				return {
					content: [
						{
							type: "text" as const,
							text: content,
						},
					],
				};
			}

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
		case "persist": {
			const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
			const artifact = parseArtifactName(
				record.target,
				WRITABLE_ARTIFACT_NAMES,
			) as WritableWorkspaceArtifactKind;
			await workspace.writeArtifact({
				artifact,
				sessionId,
				value: record.data,
			});
			return {
				content: [
					{
						type: "text" as const,
						text: stringifyJson({
							artifact,
							sessionId,
							updatedAt: new Date().toISOString(),
						}),
					},
				],
			};
		}
		case "fetch": {
			const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
			const workspacePath =
				typeof record.path === "string"
					? normalizeRelativePath(record.path)
					: undefined;
			const payload = await workspace.fetchContext(sessionId, workspacePath);
			return {
				content: [
					{
						type: "text" as const,
						text: stringifyJson(payload),
					},
				],
			};
		}
		case "compare": {
			if (record.refreshBaseline === true) {
				await workspace.refresh();
			}
			const selector =
				typeof record.selector === "string" && record.selector.length > 0
					? record.selector
					: "latest";
			const comparison = await workspace.compare(selector);
			return {
				content: [
					{
						type: "text" as const,
						text: stringifyJson(comparison),
					},
				],
			};
		}
		default:
			throw new Error(`Unknown workspace command: ${command}`);
	}
}
