import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { WorkflowExecutionRuntime } from "../contracts/runtime.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { sharedToonMemoryInterface } from "../memory/shared-memory.js";
import type { ToonMemoryInterface } from "../memory/toon-interface.js";
import { assertValidSessionId } from "../runtime/secure-session-store.js";
import {
	buildToolValidators,
	type ToolDefinitionWithInputSchema,
	validateToolArguments,
} from "./shared/tool-validators.js";

const SESSION_ARTIFACT_NAMES = [
	"session-context",
	"workspace-map",
	"scan-results",
] as const;

type SessionArtifactKind = (typeof SESSION_ARTIFACT_NAMES)[number];

export const SESSION_READ_TOOL_NAME = "agent-session-read";
export const SESSION_WRITE_TOOL_NAME = "agent-session-write";
export const SESSION_FETCH_TOOL_NAME = "agent-session-fetch";
export const SESSION_DELETE_TOOL_NAME = "agent-session-delete";

type SessionToolName =
	| typeof SESSION_READ_TOOL_NAME
	| typeof SESSION_WRITE_TOOL_NAME
	| typeof SESSION_FETCH_TOOL_NAME
	| typeof SESSION_DELETE_TOOL_NAME;

const SESSION_TOOL_NAMES = new Set<SessionToolName>([
	SESSION_READ_TOOL_NAME,
	SESSION_WRITE_TOOL_NAME,
	SESSION_FETCH_TOOL_NAME,
	SESSION_DELETE_TOOL_NAME,
]);

const sessionMemoryInterface = sharedToonMemoryInterface;

function stringifyJson(value: unknown) {
	return `${JSON.stringify(value, null, "\t")}\n`;
}

function resolveSessionId(
	sessionIdValue: unknown,
	defaultSessionId: string | undefined,
) {
	if (sessionIdValue === undefined) {
		return assertValidSessionId(defaultSessionId);
	}

	return assertValidSessionId(sessionIdValue);
}

function parseArtifactName(artifactValue: unknown): SessionArtifactKind {
	if (
		typeof artifactValue !== "string" ||
		!SESSION_ARTIFACT_NAMES.includes(artifactValue as SessionArtifactKind)
	) {
		throw new Error(
			`session artifact must be one of: ${SESSION_ARTIFACT_NAMES.join(", ")}.`,
		);
	}

	return artifactValue as SessionArtifactKind;
}

export function resolveSessionToolName(name: string): SessionToolName | null {
	return SESSION_TOOL_NAMES.has(name as SessionToolName)
		? (name as SessionToolName)
		: null;
}

export const SESSION_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: SESSION_READ_TOOL_NAME,
			description:
				"Read one session-backed artifact (session-context, workspace-map, or scan-results).",
			inputSchema: {
				type: "object" as const,
				properties: {
					sessionId: {
						type: "string" as const,
						description: "Optional session ID. Defaults to runtime session.",
					},
					artifact: {
						type: "string" as const,
						enum: [...SESSION_ARTIFACT_NAMES] as const,
						description:
							"Artifact to read. One of: session-context, workspace-map, scan-results.",
					},
				},
				required: ["artifact"],
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		{
			name: SESSION_WRITE_TOOL_NAME,
			description: "Write one session-backed artifact.",
			inputSchema: {
				type: "object" as const,
				properties: {
					sessionId: {
						type: "string" as const,
						description: "Optional session ID. Defaults to runtime session.",
					},
					target: {
						type: "string" as const,
						enum: [...SESSION_ARTIFACT_NAMES] as const,
						description:
							"Artifact to write. One of: session-context, workspace-map, scan-results.",
					},
					data: {
						type: "object" as const,
						description: "Structured value to persist.",
					},
				},
				required: ["target", "data"],
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		{
			name: SESSION_FETCH_TOOL_NAME,
			description:
				"Fetch session metadata. With sessionId omitted: list all stored session IDs. With sessionId set: return all artifacts and progress summary for that session.",
			inputSchema: {
				type: "object" as const,
				properties: {
					sessionId: {
						type: "string" as const,
						description:
							"Optional session ID. Omit to list session IDs; provide to fetch artifacts for that session.",
					},
				},
				required: [],
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		{
			name: SESSION_DELETE_TOOL_NAME,
			description: "Delete one stored session context by sessionId.",
			inputSchema: {
				type: "object" as const,
				properties: {
					sessionId: {
						type: "string" as const,
						description: "Optional session ID. Defaults to runtime session.",
					},
				},
				required: [],
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
	];

export const SESSION_TOOL_VALIDATORS = buildToolValidators(
	SESSION_TOOL_DEFINITIONS,
);

export async function dispatchSessionToolCall(
	name: string,
	args: Record<string, unknown>,
	runtime: Pick<WorkflowExecutionRuntime, "sessionId">,
): Promise<CallToolResult> {
	const canonicalName = resolveSessionToolName(name);
	if (!canonicalName) {
		return {
			content: [{ type: "text", text: `Unknown session tool: ${name}` }],
			isError: true,
		};
	}

	let record: Record<string, unknown>;
	try {
		record = validateToolArguments(
			canonicalName,
			args,
			SESSION_TOOL_VALIDATORS,
		);
	} catch (error) {
		return {
			content: [{ type: "text", text: toErrorMessage(error) }],
			isError: true,
		};
	}

	if (canonicalName === SESSION_FETCH_TOOL_NAME) {
		if (record.sessionId === undefined) {
			const sessionIds = await sessionMemoryInterface.listSessionIds();
			return {
				content: [
					{ type: "text", text: stringifyJson({ entries: sessionIds }) },
				],
				isError: false,
			};
		}
		const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
		const [sessionContext, workspaceMap, rawScanResults] = await Promise.all([
			sessionMemoryInterface.loadSessionContext(sessionId),
			sessionMemoryInterface.loadWorkspaceMap(sessionId),
			sessionMemoryInterface.loadScanResults(sessionId),
		]);

		return {
			content: [
				{
					type: "text",
					text: stringifyJson({
						sessionId,
						progressSummary: sessionContext
							? {
									phase: sessionContext.context.phase,
									completed: sessionContext.progress.completed,
									inProgress: sessionContext.progress.inProgress,
									blocked: sessionContext.progress.blocked,
									next: sessionContext.progress.next,
								}
							: null,
						artifacts: {
							sessionContext,
							workspaceMap,
							scanResults: rawScanResults,
						},
					}),
				},
			],
			isError: false,
		};
	}

	if (canonicalName === SESSION_READ_TOOL_NAME) {
		const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
		const artifact = parseArtifactName(record.artifact);

		switch (artifact) {
			case "session-context": {
				const sessionContext =
					await sessionMemoryInterface.loadSessionContext(sessionId);
				if (!sessionContext) {
					return {
						content: [
							{
								type: "text",
								text: `Session context not found for ${sessionId}.`,
							},
						],
						isError: true,
					};
				}
				return {
					content: [{ type: "text", text: stringifyJson(sessionContext) }],
					isError: false,
				};
			}
			case "workspace-map": {
				const workspaceMap =
					await sessionMemoryInterface.loadWorkspaceMap(sessionId);
				if (!workspaceMap) {
					return {
						content: [
							{
								type: "text",
								text: `Workspace map not found for ${sessionId}.`,
							},
						],
						isError: true,
					};
				}
				return {
					content: [{ type: "text", text: stringifyJson(workspaceMap) }],
					isError: false,
				};
			}
			case "scan-results": {
				const scanResults =
					await sessionMemoryInterface.loadScanResults(sessionId);
				if (!scanResults) {
					return {
						content: [
							{
								type: "text",
								text: `Scan results not found for ${sessionId}.`,
							},
						],
						isError: true,
					};
				}
				return {
					content: [{ type: "text", text: stringifyJson(scanResults) }],
					isError: false,
				};
			}
		}
	}

	if (canonicalName === SESSION_WRITE_TOOL_NAME) {
		if (!(await sessionMemoryInterface.isWorkspaceInitialized())) {
			return {
				content: [
					{
						type: "text",
						text: "Workspace not initialized. Run `mcp-cli onboard init` (or call `project-onboard`) to generate the required config, snapshots, and memory directories before writing artifacts.",
					},
				],
				isError: true,
			};
		}
		const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
		const target = parseArtifactName(record.target);
		const data = record.data;

		if (typeof data !== "object" || data === null) {
			return {
				content: [
					{
						type: "text",
						text: "session write requires a structured data object.",
					},
				],
				isError: true,
			};
		}

		try {
			switch (target) {
				case "session-context":
					await sessionMemoryInterface.saveSessionContext(sessionId, data);
					break;
				case "workspace-map":
					await sessionMemoryInterface.saveWorkspaceMap(
						sessionId,
						data as Parameters<ToonMemoryInterface["saveWorkspaceMap"]>[1],
					);
					break;
				case "scan-results":
					await sessionMemoryInterface.saveScanResults(sessionId, data);
					break;
			}
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to persist session artifact to .mcp-ai-agent-guidelines/session/: ${toErrorMessage(error)}`,
					},
				],
				isError: true,
			};
		}

		return {
			content: [
				{ type: "text", text: `Updated ${target} for session ${sessionId}.` },
			],
			isError: false,
		};
	}

	const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
	const deleted = await sessionMemoryInterface.deleteSessionContext(sessionId);
	return {
		content: [
			{
				type: "text",
				text: deleted
					? `Deleted session ${sessionId}.`
					: `Session ${sessionId} did not exist.`,
			},
		],
		isError: false,
	};
}
