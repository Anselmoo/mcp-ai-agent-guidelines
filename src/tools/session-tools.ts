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
type SessionCommand = "status" | "list" | "read" | "write" | "fetch" | "delete";

const VALID_SESSION_COMMANDS = new Set<SessionCommand>([
	"status",
	"list",
	"read",
	"write",
	"fetch",
	"delete",
]);

const sessionMemoryInterface = sharedToonMemoryInterface;

function stringifyJson(value: unknown) {
	return `${JSON.stringify(value, null, "\t")}\n`;
}

function parseSessionCommand(record: Record<string, unknown>): SessionCommand {
	const cmd = record.command;
	if (
		typeof cmd !== "string" ||
		!VALID_SESSION_COMMANDS.has(cmd as SessionCommand)
	) {
		throw new Error(
			`session command must be one of: ${[...VALID_SESSION_COMMANDS].join(", ")}.`,
		);
	}
	return cmd as SessionCommand;
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

export const SESSION_TOOL_NAME = "agent-session";

export function resolveSessionToolName(
	name: string,
): typeof SESSION_TOOL_NAME | null {
	return name === SESSION_TOOL_NAME ? SESSION_TOOL_NAME : null;
}

export const SESSION_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: SESSION_TOOL_NAME,
			description:
				"Session-scoped TOON/JSON artifact operations. Canonical name: `agent-session`. Commands: status (session counts or stats), list (sessions or per-session artifacts), read (artifact), write (artifact), fetch (all session artifacts), delete (session).",
			inputSchema: {
				type: "object" as const,
				properties: {
					command: {
						type: "string" as const,
						enum: [
							"status",
							"list",
							"read",
							"write",
							"fetch",
							"delete",
						] as const,
						description:
							"status: Show aggregate session counts or per-session stats. list: List stored session IDs or list artifacts for a session. read: Read one session-backed artifact. write: Persist one session-backed artifact. fetch: Return all artifacts for a session. delete: Delete one stored session.",
					},
					sessionId: {
						type: "string" as const,
						description:
							"Optional session ID. Defaults to the runtime session for read/write/fetch/delete. When provided to list/status, scopes the result to that session.",
					},
					artifact: {
						type: "string" as const,
						enum: [...SESSION_ARTIFACT_NAMES] as const,
						description:
							"Artifact to read. One of: session-context, workspace-map, scan-results.",
					},
					target: {
						type: "string" as const,
						enum: [...SESSION_ARTIFACT_NAMES] as const,
						description:
							"Artifact to write. One of: session-context, workspace-map, scan-results.",
					},
					data: {
						type: "object" as const,
						description:
							"Structured value to persist into the selected session artifact.",
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

	const command = parseSessionCommand(record);

	if (command === "status") {
		if (record.sessionId !== undefined) {
			const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
			const [stats, context] = await Promise.all([
				sessionMemoryInterface.getSessionStats(sessionId),
				sessionMemoryInterface.loadSessionContext(sessionId),
			]);
			if (!stats) {
				return {
					content: [
						{ type: "text", text: `Session "${sessionId}" was not found.` },
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: "text",
						text: stringifyJson({
							sessionId,
							stats,
							phase: context?.context.phase ?? null,
							progress: context?.progress ?? null,
						}),
					},
				],
				isError: false,
			};
		}

		const stats = await sessionMemoryInterface.getMemoryStats();
		return {
			content: [
				{
					type: "text",
					text: stringifyJson({
						totalSessions: stats.totalSessions,
						artifactCount: stats.artifactCount,
					}),
				},
			],
			isError: false,
		};
	}

	if (command === "list") {
		if (record.sessionId !== undefined) {
			const sessionId = resolveSessionId(record.sessionId, runtime.sessionId);
			const [sessionContext, workspaceMap, scanResults] = await Promise.all([
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
							entries: [
								{
									kind: "session-context",
									present: sessionContext !== null,
									encoding: "toon",
								},
								{
									kind: "workspace-map",
									present: workspaceMap !== null,
									encoding: "json",
								},
								{
									kind: "scan-results",
									present: scanResults !== null,
									encoding: "json",
								},
							],
						}),
					},
				],
				isError: false,
			};
		}

		const sessionIds = await sessionMemoryInterface.listSessionIds();
		return {
			content: [{ type: "text", text: stringifyJson({ entries: sessionIds }) }],
			isError: false,
		};
	}

	if (command === "read") {
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

	if (command === "write") {
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

		return {
			content: [
				{ type: "text", text: `Updated ${target} for session ${sessionId}.` },
			],
			isError: false,
		};
	}

	if (command === "fetch") {
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
