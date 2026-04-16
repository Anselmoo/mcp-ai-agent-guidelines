import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify as stringifyToml } from "smol-toml";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { MODEL_PROFILES } from "../models/model-profile.js";
import {
	createDefaultOrchestrationConfig,
	type OrchestrationConfig,
	type OrchestrationConfigPatch,
	type PhysicalModel,
	parseOrchestrationConfigDocument,
	parseOrchestrationConfigValue,
	resolveOrchestrationConfigPath,
} from "./orchestration-config.js";
import { BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE } from "./orchestration-defaults.js";

export interface ModelDeclaration {
	available: boolean;
	reason?: string;
	modelClass?: "free" | "cheap" | "strong" | "reviewer";
}

export interface ModelAvailabilityConfigFile {
	advisory?: boolean;
	models: Record<string, ModelDeclaration>;
	classes?: {
		free?: string[];
		cheap?: string[];
		strong?: string[];
		reviewer?: string[];
	};
}

export interface ResolvedConfigPaths {
	workspaceRoot: string;
	orchestrationPath: string;
	configDirectory: string;
}

export interface LoadedOrchestrationConfig {
	config: OrchestrationConfig;
	exists: boolean;
	paths: ResolvedConfigPaths;
	source: "workspace" | "fallback-defaults";
	warning?: string;
	readError?: string;
}

export interface OrchestrationConfigSummary {
	paths: ResolvedConfigPaths;
	orchestrationExists: boolean;
	configSource: "workspace" | "fallback-defaults";
	usingFallbackDefaults: boolean;
	warning?: string;
	modelCount: number;
	availableModelCount: number;
	profileCount: number;
	routingCount: number;
	patternCount: number;
}

export interface SaveOrchestrationConfigOptions {
	workspaceRoot?: string;
}

function mergeRecordValues<T>(
	base: Record<string, T>,
	patch?: Record<string, T>,
): Record<string, T> {
	if (!patch) {
		return structuredClone(base);
	}

	return {
		...structuredClone(base),
		...structuredClone(patch),
	};
}

function mergeRecordObjects<T extends object>(
	base: Record<string, T>,
	patch?: Record<string, Partial<T>>,
): Record<string, T> {
	const result = structuredClone(base);
	if (!patch) {
		return result;
	}

	for (const key of Object.keys(patch)) {
		const patchValue = patch[key];
		if (patchValue === undefined) {
			continue;
		}

		const currentValue = result[key];
		const nextValue = currentValue
			? { ...currentValue, ...patchValue }
			: patchValue;
		// New entries can arrive as partials; the final schema parse after merge is
		// the authoritative safety boundary that either accepts a complete object
		// or rejects the merged config.
		result[key] = structuredClone(nextValue) as T;
	}

	return result;
}

function configHeader(comment: string) {
	return `# MCP AI Agent Guidelines configuration\n# ${comment}\n\n`;
}

function uniqueStrings(values: Iterable<string>) {
	return [...new Set([...values].filter((value) => value.trim().length > 0))];
}

function classifyModelAlias(
	alias: string,
	model: PhysicalModel,
	config: OrchestrationConfig,
): "free" | "cheap" | "strong" | "reviewer" {
	// Role-name prefix convention (fast path for discovery-written configs):
	//   free_*      → "free"
	//   cheap_*     → "cheap"
	//   strong_*    → "strong"
	//   reviewer_*  → "reviewer"
	if (alias.startsWith("free_")) return "free";
	if (alias.startsWith("cheap_")) return "cheap";
	if (alias.startsWith("strong_")) return "strong";
	if (alias.startsWith("reviewer_")) return "reviewer";

	// Legacy / user-defined aliases: check builtin profile catalog first.
	const builtinProfile = MODEL_PROFILES[model.id];
	if (builtinProfile) {
		return builtinProfile.modelClass;
	}

	// Last resort: infer from capability membership.
	const strongCapabilities = [
		"deep_reasoning",
		"synthesis",
		"security_audit",
		"math_physics",
		"adversarial",
	];
	if (
		strongCapabilities.some((capability) =>
			(config.capabilities[capability] ?? []).includes(alias),
		)
	) {
		return "strong";
	}

	if ((config.capabilities.classification ?? []).includes(alias)) {
		return "reviewer";
	}

	if ((config.capabilities.cost_sensitive ?? []).includes(alias)) {
		return "cheap";
	}

	return "free";
}

function classesFromAssignments(
	assignments: Array<{
		id: string;
		modelClass: "free" | "cheap" | "strong" | "reviewer";
	}>,
) {
	return {
		free: uniqueStrings(
			assignments
				.filter((assignment) => assignment.modelClass === "free")
				.map((assignment) => assignment.id),
		),
		cheap: uniqueStrings(
			assignments
				.filter((assignment) => assignment.modelClass === "cheap")
				.map((assignment) => assignment.id),
		),
		strong: uniqueStrings(
			assignments
				.filter((assignment) => assignment.modelClass === "strong")
				.map((assignment) => assignment.id),
		),
		reviewer: uniqueStrings(
			assignments
				.filter((assignment) => assignment.modelClass === "reviewer")
				.map((assignment) => assignment.id),
		),
	};
}

export function mergeOrchestrationConfig(
	baseConfig: OrchestrationConfig,
	patch: OrchestrationConfigPatch,
): OrchestrationConfig {
	const output: OrchestrationConfig = {
		environment: {
			...baseConfig.environment,
			...patch.environment,
		},
		models: mergeRecordObjects(baseConfig.models, patch.models),
		capabilities: mergeRecordValues(
			baseConfig.capabilities,
			patch.capabilities,
		),
		profiles: mergeRecordObjects(baseConfig.profiles, patch.profiles),
		routing: {
			domains: mergeRecordObjects(
				baseConfig.routing.domains,
				patch.routing?.domains,
			),
		},
		orchestration: {
			patterns: mergeRecordObjects(
				baseConfig.orchestration.patterns,
				patch.orchestration?.patterns,
			),
		},
		resilience: {
			...baseConfig.resilience,
			...patch.resilience,
		},
		cache: {
			default_ttl_seconds:
				patch.cache?.default_ttl_seconds ??
				baseConfig.cache.default_ttl_seconds,
			profile_overrides: mergeRecordValues(
				baseConfig.cache.profile_overrides,
				patch.cache?.profile_overrides,
			),
		},
	};
	return parseOrchestrationConfigValue(output);
}

export function resolveConfigPaths(
	workspaceRoot = process.cwd(),
): ResolvedConfigPaths {
	return {
		workspaceRoot,
		configDirectory: resolve(
			workspaceRoot,
			".mcp-ai-agent-guidelines",
			"config",
		),
		orchestrationPath: resolveOrchestrationConfigPath(workspaceRoot),
	};
}

export function deriveModelAvailabilityConfig(
	config: OrchestrationConfig,
): ModelAvailabilityConfigFile {
	const modelEntries = Object.entries(config.models).map(([alias, model]) => {
		const modelClass = classifyModelAlias(alias, model, config);
		return {
			id: model.id,
			modelClass,
			declaration: {
				available: model.available,
				reason: model.available ? "Available" : model.reason,
				modelClass,
			} satisfies ModelDeclaration,
		};
	});

	return {
		advisory: !config.environment.strict_mode,
		models: Object.fromEntries(
			modelEntries.map((entry) => [entry.id, entry.declaration]),
		),
		classes: classesFromAssignments(
			modelEntries.map((entry) => ({
				id: entry.id,
				modelClass: entry.modelClass,
			})),
		),
	};
}

export function renderOrchestrationToml(config: OrchestrationConfig): string {
	return (
		configHeader(
			`Primary authority. Edit this file or use the interactive orchestration editor.`,
		) + stringifyToml(config)
	);
}

async function pathExists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

export async function ensureConfigDirectory(workspaceRoot?: string) {
	const paths = resolveConfigPaths(workspaceRoot);
	await mkdir(paths.configDirectory, { recursive: true });
	return paths;
}

export async function loadOrchestrationConfigForWorkspace(
	workspaceRoot?: string,
): Promise<LoadedOrchestrationConfig> {
	const paths = resolveConfigPaths(workspaceRoot);
	const exists = await pathExists(paths.orchestrationPath);
	if (!exists) {
		const warning =
			`Primary orchestration config not found at ${paths.orchestrationPath}. ` +
			`Using builtin fallback defaults from ${BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE}.`;
		return {
			config: createDefaultOrchestrationConfig(),
			exists: false,
			paths,
			source: "fallback-defaults",
			warning,
		};
	}

	try {
		const contents = await readFile(paths.orchestrationPath, "utf8");
		return {
			config: parseOrchestrationConfigDocument(contents),
			exists: true,
			paths,
			source: "workspace",
		};
	} catch (error) {
		const readError = toErrorMessage(error);
		return {
			config: createDefaultOrchestrationConfig(),
			exists: true,
			paths,
			source: "fallback-defaults",
			warning:
				`Primary orchestration config at ${paths.orchestrationPath} could not be read. ` +
				`Using builtin fallback defaults from ${BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE}.`,
			readError,
		};
	}
}

export async function saveOrchestrationConfig(
	config: OrchestrationConfig,
	options: SaveOrchestrationConfigOptions = {},
): Promise<ResolvedConfigPaths> {
	const paths = await ensureConfigDirectory(options.workspaceRoot);
	await writeFile(
		paths.orchestrationPath,
		renderOrchestrationToml(config),
		"utf8",
	);

	return paths;
}

export async function getOrchestrationConfigSummary(
	workspaceRoot?: string,
): Promise<OrchestrationConfigSummary> {
	const loaded = await loadOrchestrationConfigForWorkspace(workspaceRoot);
	return {
		paths: loaded.paths,
		orchestrationExists: loaded.exists,
		configSource: loaded.source,
		usingFallbackDefaults: loaded.source === "fallback-defaults",
		warning: loaded.warning,
		modelCount: Object.keys(loaded.config.models).length,
		availableModelCount: Object.values(loaded.config.models).filter(
			(model) => model.available,
		).length,
		profileCount: Object.keys(loaded.config.profiles).length,
		routingCount: Object.keys(loaded.config.routing.domains).length,
		patternCount: Object.keys(loaded.config.orchestration.patterns).length,
	};
}
