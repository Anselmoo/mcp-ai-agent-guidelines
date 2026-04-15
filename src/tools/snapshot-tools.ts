import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { sharedToonMemoryInterface } from "../memory/shared-memory.js";
import {
	buildToolValidators,
	type ToolDefinitionWithInputSchema,
	validateToolArguments,
} from "./shared/tool-validators.js";

type SnapshotCommand =
	| "status"
	| "history"
	| "read"
	| "refresh"
	| "compare"
	| "delete";

const VALID_SNAPSHOT_COMMANDS = new Set<SnapshotCommand>([
	"status",
	"history",
	"read",
	"refresh",
	"compare",
	"delete",
]);

const snapshotMemoryInterface = sharedToonMemoryInterface;

function parseSnapshotCommand(
	record: Record<string, unknown>,
): SnapshotCommand {
	const cmd = record.command;
	if (
		typeof cmd !== "string" ||
		!VALID_SNAPSHOT_COMMANDS.has(cmd as SnapshotCommand)
	) {
		throw new Error(
			`snapshot command must be one of: ${[...VALID_SNAPSHOT_COMMANDS].join(", ")}.`,
		);
	}
	return cmd as SnapshotCommand;
}

function stringifyJson(value: unknown) {
	return `${JSON.stringify(value, null, "\t")}\n`;
}

export const SNAPSHOT_TOOL_NAME = "agent-snapshot";

export function resolveSnapshotToolName(
	name: string,
): typeof SNAPSHOT_TOOL_NAME | null {
	return name === SNAPSHOT_TOOL_NAME ? SNAPSHOT_TOOL_NAME : null;
}

export const SNAPSHOT_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: SNAPSHOT_TOOL_NAME,
			description:
				"Codebase fingerprint snapshot operations. Canonical name: `agent-snapshot`. Commands: status (summary), history (list retained snapshots), read (full fingerprint snapshot by selector), refresh (re-scan codebase), compare (diff current codebase against a selected baseline), delete (remove stored snapshots).",
			inputSchema: {
				type: "object" as const,
				properties: {
					command: {
						type: "string" as const,
						enum: [
							"status",
							"history",
							"read",
							"refresh",
							"compare",
							"delete",
						] as const,
						description:
							"status: Show whether snapshots exist and summarize the latest one. history: List retained snapshots. read: Read a stored fingerprint snapshot using selector latest/previous/oldest or a snapshot ID. refresh: Re-scan and persist a new baseline. compare: Diff current codebase against a selected baseline. delete: Remove stored snapshots.",
					},
					selector: {
						type: "string" as const,
						description:
							"Optional snapshot selector for read/compare. Use latest, previous, oldest, or a concrete snapshot ID.",
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

export const SNAPSHOT_TOOL_VALIDATORS = buildToolValidators(
	SNAPSHOT_TOOL_DEFINITIONS,
);

export async function dispatchSnapshotToolCall(
	name: string,
	args: Record<string, unknown>,
): Promise<CallToolResult> {
	const canonicalName = resolveSnapshotToolName(name);
	if (!canonicalName) {
		return {
			content: [{ type: "text", text: `Unknown snapshot tool: ${name}` }],
			isError: true,
		};
	}

	let record: Record<string, unknown>;
	try {
		record = validateToolArguments(
			canonicalName,
			args,
			SNAPSHOT_TOOL_VALIDATORS,
		);
	} catch (error) {
		return {
			content: [{ type: "text", text: toErrorMessage(error) }],
			isError: true,
		};
	}

	const command = parseSnapshotCommand(record);
	const selector =
		typeof record.selector === "string" && record.selector.length > 0
			? record.selector
			: "latest";

	if (command === "status") {
		const snapshot = await snapshotMemoryInterface.loadFingerprintSnapshot();
		const history = await snapshotMemoryInterface.listFingerprintSnapshots();
		if (!snapshot) {
			return {
				content: [
					{
						type: "text",
						text: stringifyJson({
							present: false,
							message:
								"No snapshot stored — run command=refresh to create one.",
						}),
					},
				],
				isError: false,
			};
		}

		const fp = snapshot.fingerprint;
		return {
			content: [
				{
					type: "text",
					text: stringifyJson({
						present: true,
						snapshotId: snapshot.meta.snapshotId ?? null,
						capturedAt: fp.capturedAt,
						skillCount: fp.skillIds.length,
						instructionCount: fp.instructionNames.length,
						codeFileCount: fp.codePaths.length,
						fileSummaryCount: fp.fileSummaries?.length ?? 0,
						retainedCount: history.length,
					}),
				},
			],
			isError: false,
		};
	}

	if (command === "history") {
		const history = await snapshotMemoryInterface.listFingerprintSnapshots();
		if (history.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No snapshot history is currently stored.",
					},
				],
				isError: false,
			};
		}

		return {
			content: [{ type: "text", text: stringifyJson(history) }],
			isError: false,
		};
	}

	if (command === "read") {
		const snapshot =
			await snapshotMemoryInterface.loadFingerprintSnapshot(selector);
		if (!snapshot) {
			return {
				content: [
					{
						type: "text",
						text: `No fingerprint snapshot is currently stored for selector \`${selector}\`.`,
					},
				],
				isError: true,
			};
		}

		return {
			content: [{ type: "text", text: stringifyJson(snapshot) }],
			isError: false,
		};
	}

	if (command === "refresh") {
		const fp = await snapshotMemoryInterface.refresh();
		const latest = await snapshotMemoryInterface.loadFingerprintSnapshot();
		return {
			content: [
				{
					type: "text",
					text: stringifyJson({
						snapshotId: latest?.meta.snapshotId ?? null,
						capturedAt: fp.capturedAt,
						skillCount: fp.skillIds.length,
						instructionCount: fp.instructionNames.length,
						codeFileCount: fp.codePaths.length,
					}),
				},
			],
			isError: false,
		};
	}

	if (command === "compare") {
		const { toon, drift } = await snapshotMemoryInterface.compare(selector);
		const summary = drift.clean
			? "✅ No drift detected."
			: `⚠️ ${drift.entries.length} drift entries detected against ${selector}.`;
		return {
			content: [
				{
					type: "text",
					text: stringifyJson({
						selector,
						clean: drift.clean,
						driftCount: drift.entries.length,
						summary,
						drift,
						toon,
					}),
				},
			],
			isError: false,
		};
	}

	const deleted = await snapshotMemoryInterface.deleteFingerprintSnapshot();
	return {
		content: [
			{
				type: "text",
				text: stringifyJson({ deleted }),
			},
		],
		isError: false,
	};
}
