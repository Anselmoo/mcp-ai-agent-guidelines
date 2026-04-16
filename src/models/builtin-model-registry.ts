/**
 * Taxonomy catalog for builtin model role definitions.
 *
 * This file defines the ROLE taxonomy only — it intentionally carries NO
 * physical model IDs, provider names, or context-window figures. Those values
 * differ per host environment (VS Code Copilot, Claude desktop, Codex CLI, …)
 * and are discovered at runtime via the `model-discover` MCP
 * tool, which writes them into the user's `orchestration.toml`.
 *
 * ── How physical models are assigned ────────────────────────────────────────
 * During onboarding (or any time via the `model-discover` tool)
 * the calling LLM is asked which models its host exposes. The LLM assigns each
 * model a semantic role name (free_primary, strong_secondary, …). The tool
 * writes the result into `.mcp-ai-agent-guidelines/config/orchestration.toml`.
 * Capabilities, profiles, and routing rules reference those stable role names,
 * not volatile model IDs.
 *
 * ── Role name scheme ─────────────────────────────────────────────────────────
 * free_primary / free_secondary   — low-cost, parallelisable lanes
 * cheap_primary / cheap_secondary — mid-tier, fast inference
 * strong_primary / strong_secondary — high-quality synthesis and critique
 * reviewer_primary                — de-biasing / cross-provider review
 *
 * Adding a new taxonomy entry: add it here. model-profile.ts derives its
 * catalog from this registry automatically. No physical config needed.
 */

import type { ModelClass } from "../contracts/generated.js";

// ─── Registry entry type ──────────────────────────────────────────────────────

export interface BuiltinModelProfileFields {
	id: string;
	label: string;
	modelClass: ModelClass;
	strengths: readonly string[];
	maxContextWindow: "small" | "medium" | "large";
	costTier: "free" | "cheap" | "strong" | "reviewer";
}

// ─── The taxonomy catalog ─────────────────────────────────────────────────────

export const BUILTIN_MODEL_REGISTRY = [
	{
		id: "free_primary",
		label: "Free primary (routing & lightweight synthesis)",
		modelClass: "free",
		strengths: ["routing", "lightweight synthesis", "cheap preprocessing"],
		maxContextWindow: "medium",
		costTier: "free",
	},
	{
		id: "free_secondary",
		label: "Free secondary (analysis & baseline QA)",
		modelClass: "free",
		strengths: [
			"lightweight analysis",
			"fallback orchestration",
			"baseline QA",
		],
		maxContextWindow: "medium",
		costTier: "free",
	},
	{
		id: "cheap_primary",
		label: "Cheap primary (fast parallel fan-out)",
		modelClass: "cheap",
		strengths: ["fast code shifting", "cheap broad passes", "parallel fan-out"],
		maxContextWindow: "medium",
		costTier: "cheap",
	},
	{
		id: "cheap_secondary",
		label: "Cheap secondary (coding & low-cost transforms)",
		modelClass: "cheap",
		strengths: [
			"coding tasks",
			"broad implementation passes",
			"low-cost transforms",
		],
		maxContextWindow: "medium",
		costTier: "cheap",
	},
	{
		id: "strong_primary",
		label: "Strong primary (deep reasoning & synthesis)",
		modelClass: "strong",
		strengths: ["deep reasoning", "design", "complex orchestration"],
		maxContextWindow: "large",
		costTier: "strong",
	},
	{
		id: "strong_secondary",
		label: "Strong secondary (adversarial critique & risk audit)",
		modelClass: "strong",
		strengths: ["largest token window", "deep synthesis", "complex planning"],
		maxContextWindow: "large",
		costTier: "strong",
	},
	{
		id: "reviewer_primary",
		label: "Reviewer primary (de-biasing & comparative critique)",
		modelClass: "reviewer",
		strengths: ["review", "de-biasing", "comparative critique"],
		maxContextWindow: "large",
		costTier: "reviewer",
	},
] as const satisfies BuiltinModelProfileFields[];
