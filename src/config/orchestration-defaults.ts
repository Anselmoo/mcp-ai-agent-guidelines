import type { OrchestrationConfig } from "./orchestration-config.js";

export const BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE =
	"src/config/orchestration-defaults.ts";

const DEFAULT_ORCHESTRATION_CONFIG = {
	environment: {
		strict_mode: true,
		default_max_context: 128_000,
		enable_cost_tracking: true,
	},
	// Physical model IDs are NOT defined here. They are discovered at runtime
	// via the `model-discover` MCP tool, which writes them into
	// .mcp-ai-agent-guidelines/config/orchestration.toml using the semantic
	// role names below (free_primary, strong_secondary, …). The bootstrap
	// helper below can materialize advisory placeholder models for first-run
	// environments, but the canonical defaults stay discovery-driven.
	models: {},
	capabilities: {
		fast_draft: [
			"free_primary",
			"free_secondary",
			"cheap_primary",
			"cheap_secondary",
		],
		deep_reasoning: ["strong_primary", "strong_secondary"],
		large_context: ["free_secondary", "cheap_primary", "strong_primary"],
		adversarial: ["strong_secondary", "strong_primary"],
		classification: ["free_primary", "cheap_primary"],
		cost_sensitive: [
			"free_primary",
			"free_secondary",
			"cheap_primary",
			"cheap_secondary",
		],
		structured_output: ["free_primary", "free_secondary", "strong_primary"],
		code_analysis: ["free_secondary", "strong_primary"],
		security_audit: ["strong_secondary", "strong_primary"],
		synthesis: ["strong_primary", "strong_secondary"],
		math_physics: ["strong_primary", "strong_secondary"],
		low_latency: ["free_primary", "cheap_primary"],
	},
	profiles: {
		bootstrap: {
			requires: ["structured_output"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		implement: {
			requires: ["code_analysis", "structured_output"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 2,
		},
		refactor: {
			requires: ["code_analysis"],
			prefer: "structured_output",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		debugging: {
			requires: ["code_analysis"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		testing: {
			requires: ["code_analysis", "structured_output"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		design: {
			requires: ["large_context", "code_analysis"],
			prefer: "synthesis",
			fallback: ["cost_sensitive"],
			fan_out: 1,
		},
		code_review: {
			requires: ["code_analysis"],
			prefer: "structured_output",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		research: {
			requires: ["large_context"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 3,
		},
		orchestration: {
			requires: ["structured_output", "large_context"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		adaptive_routing: {
			requires: ["structured_output"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		resilience: {
			requires: ["structured_output"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		evaluation: {
			requires: ["structured_output", "classification"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 3,
		},
		prompt_engineering: {
			requires: ["structured_output"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 2,
		},
		strategy: {
			requires: ["large_context", "structured_output"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		documentation: {
			requires: ["fast_draft"],
			prefer: "cost_sensitive",
			fallback: [],
			fan_out: 3,
		},
		governance: {
			requires: ["security_audit", "adversarial"],
			prefer: "deep_reasoning",
			fallback: [],
			fan_out: 1,
			require_human_in_loop: true,
		},
		enterprise: {
			requires: ["large_context", "synthesis"],
			prefer: "deep_reasoning",
			fallback: ["cost_sensitive"],
			fan_out: 1,
		},
		physics_analysis: {
			requires: ["math_physics", "deep_reasoning"],
			prefer: "large_context",
			fallback: [],
			fan_out: 1,
		},
		meta_routing: {
			requires: ["classification"],
			prefer: "low_latency",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		elicitation: {
			requires: ["structured_output"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
		benchmarking: {
			requires: ["structured_output", "classification"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 3,
		},
		default: {
			requires: ["structured_output"],
			prefer: "cost_sensitive",
			fallback: ["fast_draft"],
			fan_out: 1,
		},
	},
	routing: {
		domains: {
			"req-*": {
				profile: "elicitation",
				max_retries: 2,
			},
			"doc-*": {
				profile: "documentation",
				max_retries: 1,
			},
			"qual-*": {
				profile: "code_review",
				max_retries: 2,
			},
			"synth-*": {
				profile: "research",
				max_retries: 2,
			},
			"eval-*": {
				profile: "evaluation",
				max_retries: 3,
			},
			"debug-*": {
				profile: "debugging",
				max_retries: 3,
			},
			"strat-*": {
				profile: "strategy",
				max_retries: 2,
			},
			"arch-*": {
				profile: "design",
				max_retries: 2,
			},
			"prompt-*": {
				profile: "prompt_engineering",
				max_retries: 2,
			},
			"adapt-*": {
				profile: "adaptive_routing",
				max_retries: 2,
			},
			"bench-*": {
				profile: "benchmarking",
				max_retries: 3,
			},
			"lead-*": {
				profile: "enterprise",
				max_retries: 1,
			},
			"resil-*": {
				profile: "resilience",
				max_retries: 3,
			},
			"gov-*": {
				profile: "governance",
				max_retries: 1,
				require_human_in_loop: true,
			},
			"qm-*": {
				profile: "physics_analysis",
				max_retries: 1,
				enforce_schema: true,
			},
			"gr-*": {
				profile: "physics_analysis",
				max_retries: 1,
				enforce_schema: true,
			},
			"orch-*": {
				profile: "orchestration",
				max_retries: 2,
			},
			"flow-*": {
				profile: "orchestration",
				max_retries: 2,
			},
		},
	},
	orchestration: {
		patterns: {
			triple_parallel_synthesis: {
				description:
					"Fan-out 3 free lanes, reduce with one strong synthesis pass",
				draft_profile: "research",
				synthesis_profile: "enterprise",
				fan_out: 3,
			},
			adversarial_critique: {
				description:
					"Plan with strong model, critique independently, final synthesis",
				plan_profile: "enterprise",
				critique_profile: "governance",
				synthesis_profile: "enterprise",
			},
			draft_review_chain: {
				description:
					"Free model drafts, strong model reviews, free model finalizes",
				draft_profile: "implement",
				review_profile: "code_review",
				finalize_profile: "implement",
			},
			majority_vote: {
				description: "3 free models vote; escalate to strong on split",
				vote_profile: "evaluation",
				tiebreak_profile: "enterprise",
				vote_count: 3,
			},
			cascade_fallback: {
				description:
					"Cascade cheap then analytical then strong until quality threshold met",
				cascade_chain: ["elicitation", "code_review", "enterprise"],
			},
		},
	},
	resilience: {
		rate_limit_backoff_ms: 2_000,
		auto_escalate_on_consecutive_failures: 2,
		max_escalation_depth: 3,
	},
	cache: {
		default_ttl_seconds: 300,
		profile_overrides: {
			physics_analysis: 3_600,
			governance: 0,
			enterprise: 1_800,
		},
	},
} satisfies OrchestrationConfig;

const BOOTSTRAP_ROLE_MODELS = {
	free_primary: {
		id: "free_primary",
		provider: "other",
		available: true,
		context_window: 128_000,
		reason:
			"Advisory bootstrap placeholder. Replace with a host model via onboarding or model-discover.",
	},
	free_secondary: {
		id: "free_secondary",
		provider: "other",
		available: true,
		context_window: 128_000,
		reason:
			"Advisory bootstrap placeholder. Replace with a host model via onboarding or model-discover.",
	},
	cheap_primary: {
		id: "cheap_primary",
		provider: "other",
		available: true,
		context_window: 128_000,
		reason:
			"Advisory bootstrap placeholder. Replace with a host model via onboarding or model-discover.",
	},
	cheap_secondary: {
		id: "cheap_secondary",
		provider: "other",
		available: true,
		context_window: 128_000,
		reason:
			"Advisory bootstrap placeholder. Replace with a host model via onboarding or model-discover.",
	},
	strong_primary: {
		id: "strong_primary",
		provider: "other",
		available: true,
		context_window: 200_000,
		reason:
			"Advisory bootstrap placeholder. Replace with a host model via onboarding or model-discover.",
	},
	strong_secondary: {
		id: "strong_secondary",
		provider: "other",
		available: true,
		context_window: 200_000,
		reason:
			"Advisory bootstrap placeholder. Replace with a host model via onboarding or model-discover.",
	},
	reviewer_primary: {
		id: "reviewer_primary",
		provider: "other",
		available: true,
		context_window: 200_000,
		reason:
			"Advisory bootstrap placeholder. Replace with a host model via onboarding or model-discover.",
	},
} satisfies OrchestrationConfig["models"];

export function createBuiltinOrchestrationDefaults(): OrchestrationConfig {
	return structuredClone(DEFAULT_ORCHESTRATION_CONFIG);
}

export function createBuiltinBootstrapOrchestrationConfig(): OrchestrationConfig {
	const config = createBuiltinOrchestrationDefaults();
	config.environment.strict_mode = false;
	config.models = structuredClone(BOOTSTRAP_ROLE_MODELS);
	return config;
}
