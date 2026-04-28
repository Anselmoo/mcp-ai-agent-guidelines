import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { sharedToonMemoryInterface } from "../memory/shared-memory.js";
import {
	buildContextSourceRefs,
	extractRequestSignals,
} from "../skills/shared/recommendations.js";
import {
	buildToolValidators,
	type ToolDefinitionWithInputSchema,
	validateToolArguments,
} from "./shared/tool-validators.js";

export const memoryInterface = sharedToonMemoryInterface;
const MEMORY_ARTIFACTS_DIR = ".mcp-ai-agent-guidelines/memory/";

export const MEMORY_READ_TOOL_NAME = "agent-memory-read";
export const MEMORY_WRITE_TOOL_NAME = "agent-memory-write";
export const MEMORY_FETCH_TOOL_NAME = "agent-memory-fetch";
export const MEMORY_DELETE_TOOL_NAME = "agent-memory-delete";

type MemoryToolName =
	| typeof MEMORY_READ_TOOL_NAME
	| typeof MEMORY_WRITE_TOOL_NAME
	| typeof MEMORY_FETCH_TOOL_NAME
	| typeof MEMORY_DELETE_TOOL_NAME;

const MEMORY_TOOL_NAMES = new Set<MemoryToolName>([
	MEMORY_READ_TOOL_NAME,
	MEMORY_WRITE_TOOL_NAME,
	MEMORY_FETCH_TOOL_NAME,
	MEMORY_DELETE_TOOL_NAME,
]);

export function resolveMemoryToolName(name: string): MemoryToolName | null {
	return MEMORY_TOOL_NAMES.has(name as MemoryToolName)
		? (name as MemoryToolName)
		: null;
}

export const MEMORY_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: MEMORY_READ_TOOL_NAME,
			description: "Read one long-term TOON memory artifact by artifactId.",
			inputSchema: {
				type: "object" as const,
				properties: {
					artifactId: {
						type: "string" as const,
						description:
							"Memory artifact ID to read from `.mcp-ai-agent-guidelines/memory/*.toon`.",
					},
				},
				required: ["artifactId"],
			},
		},
		{
			name: MEMORY_WRITE_TOOL_NAME,
			description:
				"Write long-term TOON memory artifacts. Create mode: provide summary (and optional details/context/tags/relevance). Enrich mode: provide artifactId + libraryContext to append documentation context to an existing artifact.",
			inputSchema: {
				type: "object" as const,
				properties: {
					summary: {
						type: "string" as const,
						description:
							"Short summary text for create mode. Required unless artifactId + libraryContext is provided.",
					},
					details: {
						type: "string" as const,
						description:
							"Extended detail text for create mode. Defaults to summary.",
					},
					artifactContext: {
						type: "string" as const,
						description: "Request context string for create mode.",
					},
					tags: {
						type: "array" as const,
						items: { type: "string" as const },
						description: "Tags to persist with the artifact.",
					},
					relevance: {
						type: "string" as const,
						description:
							"Relevance score (0–1) for create mode. Defaults to '0.7'.",
					},
					artifactId: {
						type: "string" as const,
						description: "Existing artifact ID for enrich mode.",
					},
					libraryContext: {
						type: "string" as const,
						description: "Library documentation text for enrich mode.",
					},
				},
				required: [],
			},
		},
		{
			name: MEMORY_FETCH_TOOL_NAME,
			description:
				"Fetch long-term memory artifact summaries. Supports optional tags and minRelevance filtering.",
			inputSchema: {
				type: "object" as const,
				properties: {
					tags: {
						type: "array" as const,
						items: { type: "string" as const },
						description:
							"Tag filter. Returns artifacts matching any provided tag.",
					},
					minRelevance: {
						type: "string" as const,
						description:
							"Minimum relevance threshold (0–1), as a decimal string. Defaults to '0'.",
					},
				},
				required: [],
			},
		},
		{
			name: MEMORY_DELETE_TOOL_NAME,
			description: "Delete one long-term TOON memory artifact by artifactId.",
			inputSchema: {
				type: "object" as const,
				properties: {
					artifactId: {
						type: "string" as const,
						description: "Memory artifact ID to delete.",
					},
				},
				required: ["artifactId"],
			},
		},
	];

export const MEMORY_TOOL_VALIDATORS = buildToolValidators(
	MEMORY_TOOL_DEFINITIONS,
);

function invalidRelevanceResult() {
	return {
		content: [
			{
				type: "text" as const,
				text: "relevance must be a number between 0 and 1.",
			},
		],
		isError: true,
	};
}

function memoryPersistenceErrorResult(error: unknown) {
	return {
		content: [
			{
				type: "text" as const,
				text: `Failed to persist TOON artifact to ${MEMORY_ARTIFACTS_DIR}: ${toErrorMessage(error)}`,
			},
		],
		isError: true,
	};
}

export async function dispatchMemoryToolCall(
	name: string,
	args: Record<string, unknown>,
): Promise<CallToolResult> {
	const canonicalName = resolveMemoryToolName(name);
	if (!canonicalName) {
		return {
			content: [{ type: "text", text: `Unknown memory tool: ${name}` }],
			isError: true,
		};
	}

	let record: Record<string, unknown>;
	try {
		record = validateToolArguments(canonicalName, args, MEMORY_TOOL_VALIDATORS);
	} catch (error) {
		return {
			content: [{ type: "text", text: toErrorMessage(error) }],
			isError: true,
		};
	}

	if (canonicalName === MEMORY_READ_TOOL_NAME) {
		const artifactId = record.artifactId as string;
		const artifact = await memoryInterface.loadMemoryArtifact(artifactId);
		if (!artifact) {
			return {
				content: [
					{
						type: "text",
						text: `Memory artifact "${artifactId}" not found. Use \`agent-memory-fetch\` to discover valid IDs.`,
					},
				],
				isError: true,
			};
		}
		return {
			content: [{ type: "text", text: JSON.stringify(artifact, null, 2) }],
			isError: false,
		};
	}

	if (canonicalName === MEMORY_FETCH_TOOL_NAME) {
		const rawTags = record.tags as string[] | undefined;
		const rawMinRelevance = record.minRelevance as string | undefined;
		const minRelevance =
			rawMinRelevance !== undefined
				? Number.parseFloat(rawMinRelevance)
				: undefined;
		const artifacts = await memoryInterface.findMemoryArtifacts({
			tags: rawTags,
			minRelevance: Number.isFinite(minRelevance) ? minRelevance : undefined,
		});
		if (artifacts.length === 0) {
			return {
				content: [
					{ type: "text", text: "No matching memory artifacts found." },
				],
				isError: false,
			};
		}
		const lines = artifacts.map(
			(a) =>
				`[${a.meta.id}] relevance=${a.meta.relevance} tags=${a.meta.tags.join(",")}\n  ${a.content.summary}`,
		);
		return {
			content: [
				{
					type: "text",
					text: `Found ${artifacts.length} artifact(s):\n\n${lines.join("\n\n")}`,
				},
			],
			isError: false,
		};
	}

	if (canonicalName === MEMORY_WRITE_TOOL_NAME) {
		if (!(await memoryInterface.isWorkspaceInitialized())) {
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

		const artifactId = record.artifactId as string | undefined;
		const libraryContext = record.libraryContext as string | undefined;
		if (artifactId !== undefined || libraryContext !== undefined) {
			if (!artifactId || !libraryContext) {
				return {
					content: [
						{
							type: "text",
							text: "Enrich mode requires both artifactId and libraryContext.",
						},
					],
					isError: true,
				};
			}
			let ok: boolean;
			try {
				ok = await memoryInterface.enrichMemoryArtifact(
					artifactId,
					libraryContext,
				);
			} catch (error) {
				return memoryPersistenceErrorResult(error);
			}
			return {
				content: [
					{
						type: "text",
						text: ok
							? `Enriched artifact "${artifactId}" with library context.`
							: `Artifact "${artifactId}" not found.`,
					},
				],
				isError: !ok,
			};
		}

		const summary = record.summary as string | undefined;
		if (!summary) {
			return {
				content: [
					{
						type: "text",
						text: "Create mode requires a summary field.",
					},
				],
				isError: true,
			};
		}
		const rawTags = record.tags as string[] | undefined;
		const rawRelevance = record.relevance as string | undefined;
		const relevance =
			rawRelevance !== undefined ? Number.parseFloat(rawRelevance) : 0.7;
		if (!Number.isFinite(relevance) || relevance < 0 || relevance > 1) {
			return invalidRelevanceResult();
		}
		const now = new Date().toISOString();
		const artifactContext =
			(record.artifactContext as string | undefined) ?? "";
		const snapshot = await memoryInterface.loadFingerprintSnapshot();
		const sourceRefs = buildContextSourceRefs(
			extractRequestSignals({ request: summary, context: artifactContext }),
			{ includeSnapshotSource: snapshot !== null },
		);

		try {
			await memoryInterface.saveMemoryArtifact({
				meta: {
					id: `user-${now.replace(/[:.]/g, "-")}`,
					created: now,
					updated: now,
					tags: rawTags ?? [],
					relevance,
				},
				content: {
					summary,
					details: (record.details as string | undefined) ?? summary,
					context: artifactContext,
					actionable: true,
				},
				links: {
					relatedSessions: [],
					relatedMemories: [],
					sources: sourceRefs,
				},
			});
		} catch (error) {
			return memoryPersistenceErrorResult(error);
		}

		return {
			content: [
				{
					type: "text",
					text: `TOON memory artifact saved in .mcp-ai-agent-guidelines/memory/: ${summary.slice(0, 80)}`,
				},
			],
			isError: false,
		};
	}

	if (canonicalName === MEMORY_DELETE_TOOL_NAME) {
		const artifactId = record.artifactId as string;
		const deleted = await memoryInterface.deleteMemoryArtifact(artifactId);
		return {
			content: [
				{
					type: "text",
					text: deleted
						? `Deleted memory artifact: ${artifactId}`
						: `Memory artifact not found: ${artifactId}`,
				},
			],
			isError: false,
		};
	}

	return {
		content: [{ type: "text", text: `Unknown memory tool: ${canonicalName}` }],
		isError: true,
	};
}
