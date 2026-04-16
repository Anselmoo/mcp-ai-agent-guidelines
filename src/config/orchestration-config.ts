import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "smol-toml";
import { z } from "zod";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { createOperationalLogger } from "../infrastructure/observability.js";
import { parseOrThrow } from "../validation/schema-utilities.js";
import {
	BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE,
	createBuiltinOrchestrationDefaults,
} from "./orchestration-defaults.js";

export const ORCHESTRATION_CONFIG_RELATIVE_PATH =
	".mcp-ai-agent-guidelines/config/orchestration.toml";

const orchestrationConfigLogger = createOperationalLogger("warn");

// ─── Physical layer ──────────────────────────────────────────────────────────

export interface PhysicalModel {
	id: string;
	provider: "openai" | "anthropic" | "google" | "xai" | "mistral" | "other";
	available: boolean;
	reason?: string;
	context_window: number;
	cost_per_1k_input?: number;
	cost_per_1k_output?: number;
}

// ─── Application layer ───────────────────────────────────────────────────────

export interface WorkloadProfile {
	requires: string[];
	prefer?: string;
	fallback: string[];
	fan_out: number;
	require_human_in_loop?: boolean;
	enforce_schema?: boolean;
	max_retries?: number;
}

export interface DomainRouting {
	profile: string;
	max_retries?: number;
	require_human_in_loop?: boolean;
	enforce_schema?: boolean;
}

export interface OrchestrationPattern {
	description: string;
	draft_profile?: string;
	synthesis_profile?: string;
	plan_profile?: string;
	critique_profile?: string;
	finalize_profile?: string;
	vote_profile?: string;
	tiebreak_profile?: string;
	vote_count?: number;
	review_profile?: string;
	fan_out?: number;
	cascade_chain?: string[];
}

// ─── Root config ─────────────────────────────────────────────────────────────

export interface SessionContinuityConfig {
	preload_enabled: boolean;
	session_path: string;
	snapshot_path: string;
	fingerprint_ttl_seconds: number;
	preload_max_sessions: number;
	format_version_min: number;
}

export interface AgentModeConfig {
	re_activation_interval_turns: number;
	context_drift_threshold: number;
	reactivation_instruction: string;
	heartbeat_enabled: boolean;
}

export interface SessionSecurityConfig {
	key_rotation_interval_days: number;
}

export interface QualityGatesConfig {
	eval_trigger_interval_turns: number;
}

export interface OrchestrationConfig {
	environment: {
		strict_mode: boolean;
		default_max_context: number;
		enable_cost_tracking: boolean;
		/** P5: validate that only expected tools appear on the surface. */
		tool_surface_validation?: boolean;
		/** P6: validate orchestration.toml structure at startup. */
		orchestration_schema_validation?: boolean;
	};
	/** alias → physical model (e.g. model_a → gpt-5.1-mini) */
	models: Record<string, PhysicalModel>;
	/** capability tag → list of model aliases that satisfy it */
	capabilities: Record<string, string[]>;
	/** profile name → workload profile definition */
	profiles: Record<string, WorkloadProfile>;
	routing: {
		domains: Record<string, DomainRouting>;
	};
	// Note: the TOML uses [orchestration.patterns.*] (correctly spelled).
	orchestration: {
		patterns: Record<string, OrchestrationPattern>;
	};
	resilience: {
		rate_limit_backoff_ms: number;
		auto_escalate_on_consecutive_failures: number;
		max_escalation_depth: number;
	};
	cache: {
		default_ttl_seconds: number;
		profile_overrides: Record<string, number>;
	};
	/** P4/P6: session continuity config for TOON pre-load. */
	session_continuity?: SessionContinuityConfig;
	/** P3/P6: agent mode re-activation config. */
	agent_mode?: AgentModeConfig;
	/** P6: session security parameters. */
	session_security?: SessionSecurityConfig;
	/** P6: quality gate trigger config. */
	quality_gates?: QualityGatesConfig;
}

const physicalModelSchema = z
	.object({
		id: z.string().min(1),
		provider: z.enum([
			"openai",
			"anthropic",
			"google",
			"xai",
			"mistral",
			"other",
		]),
		available: z.boolean(),
		reason: z.string().optional(),
		context_window: z.number().int().positive(),
		cost_per_1k_input: z.number().nonnegative().optional(),
		cost_per_1k_output: z.number().nonnegative().optional(),
	})
	.strict();

const workloadProfileSchema = z
	.object({
		requires: z.array(z.string()),
		prefer: z.string().optional(),
		fallback: z.array(z.string()),
		fan_out: z.number().int().positive(),
		require_human_in_loop: z.boolean().optional(),
		enforce_schema: z.boolean().optional(),
		max_retries: z.number().int().positive().optional(),
		/** P5: minimum routing confidence before meta-routing commits a route. */
		confidence_threshold: z.number().min(0).max(1).optional(),
		/** P5: minimum number of signals required before routing commits. */
		min_signal_count: z.number().int().nonnegative().optional(),
		/** P5: emit routing decision to diagnostics log. */
		emit_routing_decision: z.boolean().optional(),
	})
	.strict();

const domainRoutingSchema = z
	.object({
		profile: z.string().min(1),
		max_retries: z.number().int().positive().optional(),
		require_human_in_loop: z.boolean().optional(),
		enforce_schema: z.boolean().optional(),
	})
	.strict();

const orchestrationPatternSchema = z
	.object({
		description: z.string().min(1),
		draft_profile: z.string().optional(),
		synthesis_profile: z.string().optional(),
		plan_profile: z.string().optional(),
		critique_profile: z.string().optional(),
		finalize_profile: z.string().optional(),
		vote_profile: z.string().optional(),
		tiebreak_profile: z.string().optional(),
		vote_count: z.number().int().positive().optional(),
		review_profile: z.string().optional(),
		fan_out: z.number().int().positive().optional(),
		cascade_chain: z.array(z.string()).optional(),
	})
	.strict();

const environmentSchema = z
	.object({
		strict_mode: z.boolean(),
		default_max_context: z.number().int().positive(),
		enable_cost_tracking: z.boolean(),
		tool_surface_validation: z.boolean().optional(),
		orchestration_schema_validation: z.boolean().optional(),
	})
	.strict();

const routingSchema = z
	.object({
		domains: z.record(z.string(), domainRoutingSchema),
	})
	.strict();

const orchestrationRootSchema = z
	.object({
		patterns: z.record(z.string(), orchestrationPatternSchema),
	})
	.strict();

const resilienceSchema = z
	.object({
		rate_limit_backoff_ms: z.number().int().nonnegative(),
		auto_escalate_on_consecutive_failures: z.number().int().positive(),
		max_escalation_depth: z.number().int().positive(),
	})
	.strict();

const cacheSchema = z
	.object({
		default_ttl_seconds: z.number().int().nonnegative(),
		profile_overrides: z.record(z.string(), z.number().int().nonnegative()),
	})
	.strict();

const sessionContinuitySchema = z
	.object({
		preload_enabled: z.boolean(),
		session_path: z.string().min(1),
		snapshot_path: z.string().min(1),
		fingerprint_ttl_seconds: z.number().int().nonnegative(),
		preload_max_sessions: z.number().int().positive(),
		format_version_min: z.number().int().nonnegative(),
	})
	.strict();

const agentModeSchema = z
	.object({
		re_activation_interval_turns: z.number().int().positive(),
		context_drift_threshold: z.number().min(0).max(1),
		reactivation_instruction: z.string().min(1),
		heartbeat_enabled: z.boolean(),
	})
	.strict();

const sessionSecuritySchema = z
	.object({
		key_rotation_interval_days: z.number().int().positive(),
	})
	.strict();

const qualityGatesSchema = z
	.object({
		eval_trigger_interval_turns: z.number().int().positive(),
	})
	.strict();

const orchestrationConfigSchema = z
	.object({
		environment: environmentSchema,
		models: z.record(z.string(), physicalModelSchema),
		capabilities: z.record(z.string(), z.array(z.string())),
		profiles: z.record(z.string(), workloadProfileSchema),
		routing: routingSchema,
		orchestration: orchestrationRootSchema,
		resilience: resilienceSchema,
		cache: cacheSchema,
		session_continuity: sessionContinuitySchema.optional(),
		agent_mode: agentModeSchema.optional(),
		session_security: sessionSecuritySchema.optional(),
		quality_gates: qualityGatesSchema.optional(),
	})
	.strict();

const orchestrationConfigPatchSchema = z
	.object({
		environment: environmentSchema.partial().optional(),
		models: z.record(z.string(), physicalModelSchema.partial()).optional(),
		capabilities: z.record(z.string(), z.array(z.string())).optional(),
		profiles: z.record(z.string(), workloadProfileSchema.partial()).optional(),
		routing: z
			.object({
				domains: z.record(z.string(), domainRoutingSchema.partial()).optional(),
			})
			.strict()
			.optional(),
		orchestration: z
			.object({
				patterns: z
					.record(z.string(), orchestrationPatternSchema.partial())
					.optional(),
			})
			.strict()
			.optional(),
		resilience: resilienceSchema.partial().optional(),
		cache: z
			.object({
				default_ttl_seconds: cacheSchema.shape.default_ttl_seconds.optional(),
				profile_overrides: cacheSchema.shape.profile_overrides.optional(),
			})
			.strict()
			.optional(),
	})
	.strict();

export type OrchestrationConfigPatch = z.infer<
	typeof orchestrationConfigPatchSchema
>;

export function parseOrchestrationConfigValue(
	input: unknown,
): OrchestrationConfig {
	return parseOrThrow(orchestrationConfigSchema, input);
}

export function parseOrchestrationConfigDocument(
	raw: string,
): OrchestrationConfig {
	return parseOrchestrationConfigValue(parse(raw));
}

/**
 * Validate a user-supplied config patch against a deeply-optional version of
 * the orchestration schema.  Every field is optional (to support partial
 * patches), but when a field *is* present its type is fully checked.
 *
 * Use this instead of `as OrchestrationConfig["xxx"]` casts on untrusted input.
 */
export function parseOrchestrationConfigPatch(
	input: unknown,
): OrchestrationConfigPatch {
	// deepPartial() makes every field at every level optional while preserving
	// the type constraints on values that are actually provided.
	return parseOrThrow(orchestrationConfigPatchSchema, input);
}

// ─── Singleton cache ──────────────────────────────────────────────────────────

let _config: OrchestrationConfig | null = null;

export function createDefaultOrchestrationConfig(): OrchestrationConfig {
	return createBuiltinOrchestrationDefaults();
}

export function resetConfigCache(): void {
	_config = null;
}

export function resolveOrchestrationConfigPath(
	workspaceRoot = process.cwd(),
): string {
	return resolve(workspaceRoot, ORCHESTRATION_CONFIG_RELATIVE_PATH);
}

function firstAvailableModelId(
	config: OrchestrationConfig,
	aliases: string[],
): string | undefined {
	for (const alias of aliases) {
		const model = config.models[alias];
		if (model && model.available !== false) {
			return model.id;
		}
	}
	return undefined;
}

function resolveLastResortModelId(config: OrchestrationConfig): string {
	const fallbackConfig = createDefaultOrchestrationConfig();
	const configuredCostSensitiveModel = firstAvailableModelId(
		config,
		config.capabilities.cost_sensitive ?? [],
	);
	if (configuredCostSensitiveModel) {
		return configuredCostSensitiveModel;
	}

	const builtinCostSensitiveModel = firstAvailableModelId(
		fallbackConfig,
		fallbackConfig.capabilities.cost_sensitive ?? [],
	);
	if (builtinCostSensitiveModel) {
		return builtinCostSensitiveModel;
	}

	const configuredAvailableModel = Object.values(config.models).find(
		(model) => model.available !== false,
	)?.id;
	if (configuredAvailableModel) {
		return configuredAvailableModel;
	}

	const builtinAvailableModel = Object.values(fallbackConfig.models).find(
		(model) => model.available !== false,
	)?.id;
	if (builtinAvailableModel) {
		return builtinAvailableModel;
	}

	throw new Error(
		"[orchestration] No available model is configured in the workspace or builtin defaults.",
	);
}

export function loadOrchestrationConfig(
	overridePath?: string,
): OrchestrationConfig {
	if (_config !== null) return _config;

	const configPath = overridePath ?? resolveOrchestrationConfigPath();
	try {
		const raw = readFileSync(configPath, "utf-8");
		_config = parseOrchestrationConfigDocument(raw);
	} catch (error) {
		const fallbackConfig = createDefaultOrchestrationConfig();
		const detail = toErrorMessage(error);
		const message = `[orchestration] Failed to load primary config at ${configPath}: ${detail}`;
		if (fallbackConfig.environment.strict_mode) {
			throw new Error(
				`${message}. Strict mode forbids falling back to builtin defaults from ${BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE}.`,
			);
		}
		orchestrationConfigLogger.log(
			"warn",
			"Falling back to builtin orchestration defaults",
			{
				configPath,
				error: detail,
				fallbackSource: BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE,
			},
		);
		_config = fallbackConfig;
	}
	return _config;
}

// ─── Capability resolver ──────────────────────────────────────────────────────

/**
 * Returns available model aliases for a capability tag.
 * Warns if no models are available for the tag.
 */
export function resolveCapability(tag: string): string[] {
	const config = loadOrchestrationConfig();
	const aliases = config.capabilities[tag] ?? [];
	const available = aliases.filter(
		(alias) => config.models[alias]?.available !== false,
	);
	if (available.length === 0 && aliases.length > 0) {
		orchestrationConfigLogger.log(
			"warn",
			"Capability has no available models",
			{
				capability: tag,
				configuredAliases: aliases,
			},
		);
	}
	return available;
}

/**
 * Given a profile name, resolves to the best available physical model ID.
 * Resolution order:
 *   1. Find aliases satisfying ALL required capability tags (intersection).
 *   2. Sort by prefer tag (soft preference).
 *   3. If empty, iterate fallback tags and take first hit.
 *   4. If still empty, warn and fall back to the first cost_sensitive model.
 */
export function resolveProfile(profileName: string): string {
	const config = loadOrchestrationConfig();
	const profile =
		config.profiles[profileName] ??
		config.profiles.default ??
		createDefaultOrchestrationConfig().profiles.default;

	// Step 1 — intersection across all required capability tags
	let candidates: string[] = [];
	for (const cap of profile.requires) {
		const capAliases = (config.capabilities[cap] ?? []).filter(
			(alias) => config.models[alias]?.available !== false,
		);
		if (candidates.length === 0) {
			candidates = capAliases;
		} else {
			candidates = candidates.filter((a) => capAliases.includes(a));
		}
	}

	// Step 2 — fallback capabilities when requires cannot be satisfied
	if (candidates.length === 0) {
		for (const fallbackCap of profile.fallback) {
			candidates = (config.capabilities[fallbackCap] ?? []).filter(
				(alias) => config.models[alias]?.available !== false,
			);
			if (candidates.length > 0) break;
		}
	}

	// Step 3 — last-resort: any cost_sensitive model
	if (candidates.length === 0) {
		if (config.environment.strict_mode && profile.fallback.length === 0) {
			throw new Error(
				`[orchestration] Profile "${profileName}" requires [${profile.requires.join(", ")}] but no available models satisfy these and no fallback is configured.`,
			);
		}
		orchestrationConfigLogger.log(
			"warn",
			"Profile requirements unavailable; falling back to cost_sensitive",
			{
				profileName,
				requiredCapabilities: profile.requires,
			},
		);
		candidates = (config.capabilities.cost_sensitive ?? []).filter(
			(alias) => config.models[alias]?.available !== false,
		);
	}

	// Step 4 — apply prefer: models with this tag sort first
	if (profile.prefer && candidates.length > 1) {
		const preferSet = new Set(config.capabilities[profile.prefer] ?? []);
		candidates = [...candidates].sort((a, b) => {
			const aP = preferSet.has(a) ? 0 : 1;
			const bP = preferSet.has(b) ? 0 : 1;
			return aP - bP;
		});
	}

	const chosenAlias = candidates[0];
	return config.models[chosenAlias]?.id ?? resolveLastResortModelId(config);
}

// ─── Skill routing helpers ────────────────────────────────────────────────────

/** Returns the profile name for a skill based on its domain prefix. */
export function getProfileForSkill(skillId: string): string {
	const config = loadOrchestrationConfig();
	for (const [pattern, routing] of Object.entries(config.routing.domains)) {
		const prefix = pattern.replace("-*", "-");
		if (skillId.startsWith(prefix)) {
			return routing.profile;
		}
	}
	return "default";
}

/** Returns the best model ID for a skill (profile-aware). */
export function resolveForSkill(skillId: string): string {
	return resolveProfile(getProfileForSkill(skillId));
}

/** Returns the full domain routing metadata for a skill (retries, human-in-loop, etc.). */
export function getDomainRouting(skillId: string): DomainRouting | null {
	const config = loadOrchestrationConfig();
	for (const [pattern, routing] of Object.entries(config.routing.domains)) {
		const prefix = pattern.replace("-*", "-");
		if (skillId.startsWith(prefix)) {
			return routing;
		}
	}
	return null;
}

/** Returns all available model IDs for a capability tag (physical IDs, not aliases). */
export function resolveCapabilityToIds(tag: string): string[] {
	const config = loadOrchestrationConfig();
	return resolveCapability(tag)
		.map((alias) => config.models[alias]?.id)
		.filter(Boolean) as string[];
}

/** Returns the fan-out count for a profile (how many parallel lanes to spawn). */
export function getFanOut(profileName: string): number {
	const config = loadOrchestrationConfig();
	return config.profiles[profileName]?.fan_out ?? 1;
}

/** Returns profile names that require human-in-the-loop. */
export function getHumanInLoopProfiles(): string[] {
	const config = loadOrchestrationConfig();
	return Object.entries(config.profiles)
		.filter(([, p]) => p.require_human_in_loop === true)
		.map(([name]) => name);
}

// ─── Legacy compatibility shims (kept for existing model-router.ts callers) ──

/** @deprecated Use resolveProfile() or resolveForSkill() instead */
export function getDomainTier(skillId: string): string {
	return getProfileForSkill(skillId);
}

/** @deprecated Use resolveCapability() instead */
export function getAvailableModelsForTier(profileOrTag: string): string[] {
	return resolveCapabilityToIds(profileOrTag);
}
