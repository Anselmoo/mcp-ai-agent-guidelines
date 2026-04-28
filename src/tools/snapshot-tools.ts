import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { sharedToonMemoryInterface } from "../memory/shared-memory.js";
import {
	buildToolValidators,
	type ToolDefinitionWithInputSchema,
	validateToolArguments,
} from "./shared/tool-validators.js";

const snapshotMemoryInterface = sharedToonMemoryInterface;

function stringifyJson(value: unknown) {
	return `${JSON.stringify(value, null, "\t")}\n`;
}

export const SNAPSHOT_READ_TOOL_NAME = "agent-snapshot-read";
export const SNAPSHOT_WRITE_TOOL_NAME = "agent-snapshot-write";
export const SNAPSHOT_FETCH_TOOL_NAME = "agent-snapshot-fetch";
export const SNAPSHOT_COMPARE_TOOL_NAME = "agent-snapshot-compare";
export const SNAPSHOT_DELETE_TOOL_NAME = "agent-snapshot-delete";

type SnapshotToolName =
	| typeof SNAPSHOT_READ_TOOL_NAME
	| typeof SNAPSHOT_WRITE_TOOL_NAME
	| typeof SNAPSHOT_FETCH_TOOL_NAME
	| typeof SNAPSHOT_COMPARE_TOOL_NAME
	| typeof SNAPSHOT_DELETE_TOOL_NAME;

const SNAPSHOT_TOOL_NAMES = new Set<SnapshotToolName>([
	SNAPSHOT_READ_TOOL_NAME,
	SNAPSHOT_WRITE_TOOL_NAME,
	SNAPSHOT_FETCH_TOOL_NAME,
	SNAPSHOT_COMPARE_TOOL_NAME,
	SNAPSHOT_DELETE_TOOL_NAME,
]);

export function resolveSnapshotToolName(name: string): SnapshotToolName | null {
	return SNAPSHOT_TOOL_NAMES.has(name as SnapshotToolName)
		? (name as SnapshotToolName)
		: null;
}

export const SNAPSHOT_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: SNAPSHOT_FETCH_TOOL_NAME,
			description:
				"Fetch snapshot status or retained history. mode=status (default) returns latest baseline summary; mode=history returns retained snapshots.",
			inputSchema: {
				type: "object" as const,
				properties: {
					mode: {
						type: "string" as const,
						enum: ["status", "history"] as const,
						description:
							"Fetch mode. status=latest summary, history=retained snapshots list.",
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
			name: SNAPSHOT_READ_TOOL_NAME,
			description:
				"Read a stored fingerprint snapshot by selector (latest, previous, oldest, or snapshot ID).",
			inputSchema: {
				type: "object" as const,
				properties: {
					selector: {
						type: "string" as const,
						description: "Optional snapshot selector. Defaults to latest.",
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
			name: SNAPSHOT_WRITE_TOOL_NAME,
			description: "Refresh (re-scan) and persist a new snapshot baseline.",
			inputSchema: {
				type: "object" as const,
				properties: {},
				required: [],
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		{
			name: SNAPSHOT_COMPARE_TOOL_NAME,
			description:
				"Compare current codebase against a selected snapshot baseline.",
			inputSchema: {
				type: "object" as const,
				properties: {
					selector: {
						type: "string" as const,
						description: "Optional baseline selector. Defaults to latest.",
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
			name: SNAPSHOT_DELETE_TOOL_NAME,
			description: "Delete stored fingerprint snapshot baselines.",
			inputSchema: {
				type: "object" as const,
				properties: {},
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

	const selector =
		typeof record.selector === "string" && record.selector.length > 0
			? record.selector
			: "latest";

	if (canonicalName === SNAPSHOT_FETCH_TOOL_NAME) {
		const mode = record.mode === "history" ? "history" : "status";
		if (mode === "history") {
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
								"No snapshot stored — run agent-snapshot-write to create one.",
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

	if (canonicalName === SNAPSHOT_READ_TOOL_NAME) {
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

	if (canonicalName === SNAPSHOT_WRITE_TOOL_NAME) {
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

	if (canonicalName === SNAPSHOT_COMPARE_TOOL_NAME) {
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
