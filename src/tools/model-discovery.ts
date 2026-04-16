/**
 * `model-discover` MCP tool.
 *
 * The host LLM (Copilot, Claude, Codex CLI, …) already knows which models it
 * can dispatch to — it receives that list from the platform automatically.
 * This tool converts that knowledge into a structured models section in
 * `orchestration.toml`, using stable semantic role names instead of volatile
 * provider model IDs.
 *
 * ── How it works ────────────────────────────────────────────────────────────
 * The calling LLM is asked (via this tool's description) to self-report the
 * models available in its environment and assign each one a role from the
 * taxonomy. No API keys are required — the host is already the authority on
 * model availability.
 *
 * ── Role name scheme ─────────────────────────────────────────────────────────
 *   free_primary / free_secondary     — low-cost, parallelisable lanes
 *   cheap_primary / cheap_secondary   — mid-tier, fast inference
 *   strong_primary / strong_secondary — synthesis and adversarial critique
 *   reviewer_primary                  — de-biasing / cross-provider review
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { PhysicalModel } from "../config/orchestration-config.js";
import {
	loadOrchestrationConfigForWorkspace,
	mergeOrchestrationConfig,
	saveOrchestrationConfig,
} from "../config/orchestration-config-service.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import {
	buildToolValidators,
	type ToolDefinitionWithInputSchema,
	validateToolArguments,
} from "./shared/tool-validators.js";

// ─── Role type ────────────────────────────────────────────────────────────────

export type ModelRole =
	| "free_primary"
	| "free_secondary"
	| "cheap_primary"
	| "cheap_secondary"
	| "strong_primary"
	| "strong_secondary"
	| "reviewer_primary";

const VALID_ROLES: ReadonlySet<string> = new Set<ModelRole>([
	"free_primary",
	"free_secondary",
	"cheap_primary",
	"cheap_secondary",
	"strong_primary",
	"strong_secondary",
	"reviewer_primary",
]);

// ─── Discovery input type ─────────────────────────────────────────────────────

export interface DiscoveryModelEntry {
	/** The exact model ID used by the provider (e.g. "claude-sonnet-4-5"). */
	id: string;
	/**
	 * Semantic role assigned by the calling LLM from the taxonomy.
	 * Determines which capability groups in orchestration.toml this model fills.
	 */
	role: ModelRole;
	/** Provider that hosts this model. */
	provider: "openai" | "anthropic" | "google" | "xai" | "mistral" | "other";
	/**
	 * Published context-window token limit. Omit if unknown; defaults to 128 000.
	 * This is a hint for the onboarding editor — not an enforced limit.
	 */
	context_window?: number;
	/** Whether the model is currently accessible. Defaults to true. */
	available?: boolean;
	/** Human-readable note if unavailable (e.g. "Rate-limited on this plan"). */
	reason?: string;
}

// ─── Core discovery logic (shared with wizard) ────────────────────────────────

export interface DiscoveryResult {
	/** Role-name → physical model record (written to orchestration.toml). */
	models: Record<string, PhysicalModel>;
	/** Warnings produced during validation (e.g. missing recommended roles). */
	warnings: string[];
	/** Roles that were assigned at least one model. */
	assignedRoles: ModelRole[];
	/** Roles from the taxonomy that received no model. */
	unassignedRoles: ModelRole[];
}

export const MODEL_DISCOVERY_TOOL_NAME = "model-discover";

/**
 * Validate a list of discovery entries and build the models section.
 * Pure function — no I/O.
 */
export function performModelDiscovery(
	entries: DiscoveryModelEntry[],
): DiscoveryResult {
	const warnings: string[] = [];
	const models: Record<string, PhysicalModel> = {};

	for (const entry of entries) {
		if (!entry.id || typeof entry.id !== "string") {
			warnings.push(
				`Skipping entry with missing or invalid id: ${JSON.stringify(entry)}`,
			);
			continue;
		}
		if (!VALID_ROLES.has(entry.role)) {
			warnings.push(
				`Skipping entry "${entry.id}": unknown role "${String(entry.role)}". ` +
					`Valid roles: ${[...VALID_ROLES].join(", ")}.`,
			);
			continue;
		}
		if (entry.role in models) {
			warnings.push(
				`Role "${entry.role}" already assigned to "${models[entry.role]?.id ?? "?"}". ` +
					`Overwriting with "${entry.id}".`,
			);
		}
		models[entry.role] = {
			id: entry.id,
			provider: entry.provider ?? "other",
			available: entry.available ?? true,
			reason: entry.reason,
			context_window: entry.context_window ?? 128_000,
		};
	}

	const allRoles = [...VALID_ROLES] as ModelRole[];
	const assignedRoles = allRoles.filter((r) => r in models);
	const unassignedRoles = allRoles.filter((r) => !(r in models));

	// Warn on missing recommended roles.
	const recommendedRoles: ModelRole[] = ["free_primary", "strong_primary"];
	for (const role of recommendedRoles) {
		if (!(role in models)) {
			warnings.push(
				`No model assigned to recommended role "${role}". ` +
					`Orchestration will fall back to any available model.`,
			);
		}
	}

	return { models, warnings, assignedRoles, unassignedRoles };
}

// ─── Tool definition ──────────────────────────────────────────────────────────

export const MODEL_DISCOVERY_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: MODEL_DISCOVERY_TOOL_NAME,
			description:
				"Register the language models available in the current host environment. " +
				"Provide the list of model IDs your host exposes via the `models` argument, " +
				"assigning each a semantic role from the taxonomy " +
				"(free_primary, free_secondary, cheap_primary, cheap_secondary, " +
				"strong_primary, strong_secondary, reviewer_primary). " +
				"The tool writes a models section into orchestration.toml using stable " +
				"role names — capabilities, profiles, and routing rules reference these " +
				"roles, not volatile provider IDs. " +
				"Run this during onboarding or any time the available model set changes.",
			inputSchema: {
				type: "object" as const,
				properties: {
					models: {
						type: "array",
						description:
							"List of models available in this host environment. " +
							"Each entry must specify `id` (provider model ID), `role` (taxonomy role), " +
							"and `provider`. `context_window`, `available`, and `reason` are optional.",
						items: {
							type: "object",
							properties: {
								id: {
									type: "string",
									description:
										"The exact model ID as used by the provider " +
										'(e.g. "claude-sonnet-4-5", "gpt-4.1").',
								},
								role: {
									type: "string",
									enum: [
										"free_primary",
										"free_secondary",
										"cheap_primary",
										"cheap_secondary",
										"strong_primary",
										"strong_secondary",
										"reviewer_primary",
									],
									description:
										"Taxonomy role. Assign based on the model's capability tier: " +
										"free_* = low-cost parallelisable; cheap_* = mid-tier fast; " +
										"strong_* = synthesis/critique; reviewer_* = de-biasing review.",
								},
								provider: {
									type: "string",
									enum: ["openai", "anthropic", "google", "other"],
									description: "The provider hosting this model.",
								},
								context_window: {
									type: "number",
									description:
										"Token limit (suggested hint only). Defaults to 128 000 if omitted.",
								},
								available: {
									type: "boolean",
									description:
										"Whether the model is currently accessible. Defaults to true.",
								},
								reason: {
									type: "string",
									description:
										"Optional note explaining unavailability or usage restrictions.",
								},
							},
							required: ["id", "role", "provider"],
						},
						minItems: 1,
					},
					workspace_root: {
						type: "string",
						description:
							"Absolute path to the project root. Defaults to the current working directory.",
					},
				},
				required: ["models"],
			},
		},
	];

export const MODEL_DISCOVERY_TOOL_VALIDATORS = buildToolValidators(
	MODEL_DISCOVERY_TOOL_DEFINITIONS,
);

// ─── Dispatch ─────────────────────────────────────────────────────────────────

function textResult(text: string, isError = false): CallToolResult {
	return { content: [{ type: "text", text }], isError };
}

export async function dispatchModelDiscoveryToolCall(
	name: string,
	args: Record<string, unknown>,
): Promise<CallToolResult> {
	if (!MODEL_DISCOVERY_TOOL_VALIDATORS.has(name)) {
		return textResult(`Unknown model discovery tool: ${name}`, true);
	}

	let record: Record<string, unknown>;
	try {
		record = validateToolArguments(name, args, MODEL_DISCOVERY_TOOL_VALIDATORS);
	} catch (error) {
		return textResult(toErrorMessage(error), true);
	}

	if (name === MODEL_DISCOVERY_TOOL_NAME) {
		const rawModels = record.models;
		if (!Array.isArray(rawModels) || rawModels.length === 0) {
			return textResult(
				"Invalid input: `models` must be a non-empty array of discovery entries.",
				true,
			);
		}

		const entries = rawModels as DiscoveryModelEntry[];
		const workspaceRoot =
			typeof record.workspace_root === "string"
				? record.workspace_root
				: undefined;

		const { models, warnings, assignedRoles, unassignedRoles } =
			performModelDiscovery(entries);

		if (Object.keys(models).length === 0) {
			return textResult(
				"No valid model entries after validation. Check role names and id fields.\n" +
					(warnings.length > 0
						? `Warnings:\n${warnings.map((w) => `  • ${w}`).join("\n")}`
						: ""),
				true,
			);
		}

		let savedPaths: Awaited<ReturnType<typeof saveOrchestrationConfig>>;
		try {
			const loaded = await loadOrchestrationConfigForWorkspace(workspaceRoot);
			const updated = mergeOrchestrationConfig(loaded.config, { models });
			savedPaths = await saveOrchestrationConfig(updated, { workspaceRoot });
		} catch (error) {
			return textResult(
				`Failed to save orchestration config: ${toErrorMessage(error)}`,
				true,
			);
		}

		return textResult(
			JSON.stringify(
				{
					success: true,
					assignedRoles,
					unassignedRoles,
					modelCount: Object.keys(models).length,
					models,
					warnings: warnings.length > 0 ? warnings : undefined,
					savedTo: savedPaths,
				},
				null,
				"\t",
			),
		);
	}

	return textResult(`Unhandled tool: ${name}`, true);
}
