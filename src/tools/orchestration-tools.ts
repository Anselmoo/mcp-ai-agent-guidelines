import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
	createDefaultOrchestrationConfig,
	type OrchestrationConfig,
	type OrchestrationConfigPatch,
	parseOrchestrationConfigPatch,
} from "../config/orchestration-config.js";
import {
	deriveModelAvailabilityConfig,
	getOrchestrationConfigSummary,
	loadOrchestrationConfigForWorkspace,
	mergeOrchestrationConfig,
	saveOrchestrationConfig,
} from "../config/orchestration-config-service.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { sharedToonMemoryInterface as memoryInterface } from "../memory/shared-memory.js";

import {
	buildToolValidators,
	type ToolDefinitionWithInputSchema,
	validateToolArguments,
} from "./shared/tool-validators.js";

function textResult(text: string, isError = false): CallToolResult {
	return {
		content: [{ type: "text", text }],
		isError,
	};
}

function expectOptionalRecord(
	value: unknown,
	fieldName: "config" | "patch",
): Record<string, unknown> | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}

	throw new Error(
		`Invalid input for \`orchestration-config-write\`: "${fieldName}" must be an object.`,
	);
}

const ORCHESTRATION_CONFIG_TOP_LEVEL_KEYS = new Set<keyof OrchestrationConfig>([
	"environment",
	"models",
	"capabilities",
	"profiles",
	"routing",
	"orchestration",
	"resilience",
	"cache",
]);

function validateTopLevelConfigKeys(
	payload: Record<string, unknown> | undefined,
	fieldName: "config" | "patch",
) {
	if (!payload) {
		return;
	}

	const unknownKeys = Object.keys(payload).filter(
		(key) =>
			!ORCHESTRATION_CONFIG_TOP_LEVEL_KEYS.has(
				key as keyof OrchestrationConfig,
			),
	);
	if (unknownKeys.length > 0) {
		throw new Error(
			`Invalid input for \`orchestration-config-write\`: "${fieldName}" contains unsupported top-level keys: ${unknownKeys.join(", ")}.`,
		);
	}
}

function normalizeOrchestrationConfigPatch(
	payload: Record<string, unknown> | undefined,
): OrchestrationConfigPatch {
	if (!payload) {
		return {};
	}
	// Validate all provided fields against the deeply-optional orchestration
	// schema.  This rejects type errors (e.g. strict_mode: "yes") at write
	// time before they can reach disk or the merge step.
	return parseOrchestrationConfigPatch(payload);
}

export const ORCHESTRATION_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: "orchestration-config",
			description:
				"Read or write the orchestration.toml configuration. Use command=read to inspect, command=write to update.",
			inputSchema: {
				type: "object" as const,
				properties: {
					command: {
						type: "string" as const,
						enum: ["read", "write"] as const,
						description:
							"read: Read the primary orchestration.toml configuration. write: Write orchestration.toml non-interactively.",
					},
					resetToDefaults: {
						type: "boolean" as const,
						description:
							"(write only) Start from the default orchestration config before applying any patch.",
					},
					config: {
						type: "object" as const,
						description:
							"(write only) Optional full orchestration config replacement.",
					},
					patch: {
						type: "object" as const,
						description:
							"(write only) Optional partial orchestration config to merge into the current or default config.",
					},
				},
				required: ["command"],
			},
		},
	];

export const ORCHESTRATION_TOOL_VALIDATORS = buildToolValidators(
	ORCHESTRATION_TOOL_DEFINITIONS,
);

export async function dispatchOrchestrationToolCall(
	name: string,
	args: Record<string, unknown>,
): Promise<CallToolResult> {
	if (name !== "orchestration-config") {
		return textResult(`Unknown orchestration tool: ${name}`, true);
	}

	let record: Record<string, unknown>;
	try {
		record = validateToolArguments(name, args, ORCHESTRATION_TOOL_VALIDATORS);
	} catch (error) {
		return textResult(toErrorMessage(error), true);
	}

	const command = record.command as string;

	if (command === "read") {
		const [loaded, summary, sessionIds, recentArtifacts, snapshot] =
			await Promise.all([
				loadOrchestrationConfigForWorkspace(),
				getOrchestrationConfigSummary(),
				memoryInterface.listSessionIds(),
				memoryInterface.findMemoryArtifacts(),
				memoryInterface.loadFingerprintSnapshot(),
			]);
		const derivedModelAvailability = deriveModelAvailabilityConfig(
			loaded.config,
		);
		const fingerprint = snapshot?.fingerprint;
		const codePaths = fingerprint?.codePaths ?? fingerprint?.srcPaths ?? [];
		const snapshotContext = fingerprint
			? {
					capturedAt: fingerprint.capturedAt,
					skillCount: fingerprint.skillIds.length,
					instructionCount: fingerprint.instructionNames.length,
					codePathCount: codePaths.length,
					snapshotPaths: codePaths
						.filter((path) => path.startsWith("src/snapshots/"))
						.slice(0, 10),
				}
			: null;
		const memoryContext = {
			sessionCount: sessionIds.length,
			sessionIds,
			recentArtifacts: recentArtifacts.slice(0, 5).map((artifact) => ({
				id: artifact.meta.id,
				tags: artifact.meta.tags,
				relevance: artifact.meta.relevance,
				updated: artifact.meta.updated,
				summary: artifact.content.summary,
				actionable: artifact.content.actionable,
				relatedSessions: artifact.links.relatedSessions,
			})),
		};
		return textResult(
			JSON.stringify(
				{
					summary,
					source: loaded.source,
					warning: loaded.warning,
					config: loaded.config,
					derivedModelAvailability,
					snapshotContext,
					memoryContext,
				},
				null,
				"\t",
			),
		);
	}

	if (command === "write") {
		const resetToDefaults = record.resetToDefaults === true;
		const loaded = resetToDefaults
			? { config: createDefaultOrchestrationConfig() }
			: await loadOrchestrationConfigForWorkspace();
		let replacement: Record<string, unknown> | undefined;
		let patch: Record<string, unknown> | undefined;
		let replacementConfig: ReturnType<typeof normalizeOrchestrationConfigPatch>;
		let patchConfig: ReturnType<typeof normalizeOrchestrationConfigPatch>;
		try {
			replacement = expectOptionalRecord(record.config, "config");
			patch = expectOptionalRecord(record.patch, "patch");
			validateTopLevelConfigKeys(replacement, "config");
			validateTopLevelConfigKeys(patch, "patch");
			replacementConfig = normalizeOrchestrationConfigPatch(replacement);
			patchConfig = normalizeOrchestrationConfigPatch(patch);
		} catch (error) {
			return textResult(toErrorMessage(error), true);
		}
		const nextConfig = replacement
			? mergeOrchestrationConfig(
					createDefaultOrchestrationConfig(),
					replacementConfig,
				)
			: mergeOrchestrationConfig(loaded.config, patchConfig);
		const paths = await saveOrchestrationConfig(nextConfig);
		return textResult(
			JSON.stringify(
				{
					saved: true,
					paths,
					summary: await getOrchestrationConfigSummary(),
				},
				null,
				"\t",
			),
		);
	}

	return textResult(`Unknown orchestration command: ${command}`, true);
}
