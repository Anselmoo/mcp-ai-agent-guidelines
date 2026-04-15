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

export const MEMORY_TOOL_NAME = "agent-memory";

export function resolveMemoryToolName(
	name: string,
): typeof MEMORY_TOOL_NAME | null {
	return name === MEMORY_TOOL_NAME ? MEMORY_TOOL_NAME : null;
}

export const MEMORY_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: MEMORY_TOOL_NAME,
			description:
				"Long-term TOON memory artifacts backed by `.mcp-ai-agent-guidelines/memory/*.toon`. Use `agent-memory` for persistent artifacts, `agent-session` for session state, and `agent-snapshot` for codebase baselines. Commands: status, list, read, find, write, enrich, delete.",
			inputSchema: {
				type: "object" as const,
				properties: {
					command: {
						type: "string" as const,
						enum: [
							"status",
							"list",
							"read",
							"find",
							"write",
							"enrich",
							"delete",
						] as const,
						description:
							"status: Show long-term artifact summary. list: Enumerate stored memory artifacts. read: Read one memory artifact (`artifactId`). find: Search memory artifacts (optionally filter by tags/minRelevance). write: Persist a new memory artifact. enrich: Append context7 library documentation to an existing artifact (`artifactId` + `libraryContext`). delete: Delete a memory artifact (`artifactId`).",
					},
					artifactId: {
						type: "string" as const,
						description:
							"Memory artifact ID for command=read or command=delete when targeting long-term memory artifacts.",
					},
					tags: {
						type: "array" as const,
						items: { type: "string" as const },
						description:
							"Tag filter for command=find. Returns artifacts matching ANY of the given tags.",
					},
					minRelevance: {
						type: "string" as const,
						description:
							"Minimum relevance threshold (0–1) for command=find, as a decimal string. Defaults to '0' (all artifacts).",
					},
					summary: {
						type: "string" as const,
						description:
							"Short summary text (required for command=write). Stored as content.summary.",
					},
					details: {
						type: "string" as const,
						description:
							"Extended detail text for command=write. Stored as content.details.",
					},
					artifactContext: {
						type: "string" as const,
						description:
							"Request context string for command=write. Stored as content.context.",
					},
					relevance: {
						type: "string" as const,
						description:
							"Relevance score (0–1) for command=write, as a decimal string. Defaults to '0.7'.",
					},
					libraryContext: {
						type: "string" as const,
						description:
							"Library documentation text for command=enrich. Pass the combined output of context7 get-library-docs calls here. Stored in content.libraryContext and never overwrites the original details field.",
					},
				},
				required: ["command"],
			},
		},
	];

export const MEMORY_TOOL_VALIDATORS = buildToolValidators(
	MEMORY_TOOL_DEFINITIONS,
);

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

	const command = record.command as string;
	if (command === "status") {
		const artifacts = await memoryInterface.findMemoryArtifacts();
		const artifactsLine =
			artifacts.length === 0
				? "Artifacts: none stored — use command=write to persist memory artifacts"
				: `Artifacts: ${artifacts.length} stored — use command=find to search and command=read with artifactId for details`;
		const mostRelevantLine =
			artifacts.length === 0
				? "Most relevant artifact: none yet"
				: `Most relevant artifact: ${artifacts[0]?.meta.id} (relevance ${artifacts[0]?.meta.relevance})`;
		return {
			content: [
				{
					type: "text",
					text: `${artifactsLine}\n${mostRelevantLine}`,
				},
			],
			isError: false,
		};
	}
	if (command === "list") {
		const artifacts = await memoryInterface.findMemoryArtifacts();
		const text =
			artifacts.length === 0
				? "No stored memory artifacts found."
				: `Stored memory artifacts (${artifacts.length}):\n${artifacts
						.map(
							(artifact) =>
								`  ${artifact.meta.id} relevance=${artifact.meta.relevance} tags=${artifact.meta.tags.join(",")}`,
						)
						.join("\n")}`;
		return {
			content: [{ type: "text", text }],
			isError: false,
		};
	}
	if (command === "read") {
		const artifactId = record.artifactId as string | undefined;
		if (artifactId) {
			const artifact = await memoryInterface.loadMemoryArtifact(artifactId);
			if (!artifact) {
				return {
					content: [
						{
							type: "text",
							text: `Memory artifact "${artifactId}" not found. Use command=find or command=list with scope=artifacts to discover valid IDs.`,
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
		return {
			content: [
				{
					type: "text",
					text: "command=read requires artifactId. Use the `agent-session` tool for session-scoped state.",
				},
			],
			isError: true,
		};
	}
	if (command === "find") {
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
	if (command === "write") {
		const summary = record.summary as string | undefined;
		if (!summary) {
			return {
				content: [
					{
						type: "text",
						text: "command=write requires a summary field.",
					},
				],
				isError: true,
			};
		}
		const rawTags = record.tags as string[] | undefined;
		const rawRelevance = record.relevance as string | undefined;
		const relevance =
			rawRelevance !== undefined ? Number.parseFloat(rawRelevance) : 0.7;
		const now = new Date().toISOString();
		const artifactContext =
			(record.artifactContext as string | undefined) ?? "";
		const snapshot = await memoryInterface.loadFingerprintSnapshot();
		const sourceRefs = buildContextSourceRefs(
			extractRequestSignals({ request: summary, context: artifactContext }),
			{ includeSnapshotSource: snapshot !== null },
		);
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: `user-${now.replace(/[:.]/g, "-")}`,
				created: now,
				updated: now,
				tags: rawTags ?? [],
				relevance: Number.isFinite(relevance) ? relevance : 0.7,
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
	if (command === "delete") {
		const artifactId = record.artifactId as string | undefined;
		if (artifactId) {
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
			content: [
				{
					type: "text",
					text: "command=delete requires artifactId. Use the `agent-session` tool to delete stored sessions.",
				},
			],
			isError: true,
		};
	}
	if (command === "enrich") {
		const artifactId = record.artifactId as string | undefined;
		const libraryContext = record.libraryContext as string | undefined;
		if (!artifactId || !libraryContext) {
			return {
				content: [
					{
						type: "text",
						text: "command=enrich requires both artifactId and libraryContext.",
					},
				],
				isError: true,
			};
		}
		const ok = await memoryInterface.enrichMemoryArtifact(
			artifactId,
			libraryContext,
		);
		return {
			content: [
				{
					type: "text",
					text: ok
						? `Enriched artifact "${artifactId}" with library context (content.libraryContext updated, tag "context7-enriched" added).`
						: `Artifact "${artifactId}" not found.`,
				},
			],
			isError: !ok,
		};
	}
	return {
		content: [{ type: "text", text: `Unknown memory command: ${command}` }],
		isError: true,
	};
}
