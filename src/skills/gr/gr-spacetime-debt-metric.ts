/**
 * gr-spacetime-debt-metric.ts
 *
 * Handwritten capability handler for the gr-spacetime-debt-metric skill.
 *
 * Physics metaphor: technical debt maps to local spacetime curvature via the
 * Einstein field equations. High curvature (Ricci scalar K) indicates dense
 * debt concentration. The analogue is K = coupling × complexity / (cohesion + ε).
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-schwarzschild-classifier — zone classification by Schwarzschild radius
 *   gr-event-horizon-detector   — cascade/horizon propagation detection
 *   gr-tidal-force-analyzer     — differential coupling / split-candidate detection
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace static
 * analysis tools (e.g., SonarQube, CodeClimate, ESLint complexity rules).
 */

import { z } from "zod";
import { gr_spacetime_debt_metric_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	classifyCurvature,
	curvatureScore,
	extractNumbers,
	fmtNum,
} from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			coupling: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Module coupling count (afferent + efferent dependency total).",
				),
			complexity: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Module complexity score (e.g., cyclomatic complexity, cognitive complexity, or line count / 100).",
				),
			cohesion: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Module cohesion score on a 0–1 or 0–100 scale (higher = more cohesive, lower curvature).",
				),
		})
		.optional(),
});

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(extreme|critical|hotspot|highest|worst|biggest|dominant|severe)\b/i,
		guidance:
			"Extreme-curvature modules (K > 10) are technical debt singularities — the math guarantees that reducing any single factor by half will halve K. Identify which factor dominates: if coupling is primary, extract interfaces; if complexity is primary, decompose functions; if cohesion is primary, split by responsibility.",
	},
	{
		pattern: /\b(high|elevated|significant|notable|major|large)\b/i,
		guidance:
			"High-curvature modules (5 < K ≤ 10) warrant scheduled refactoring within the current quarter. Rank them by K descending and allocate one refactoring sprint per top-three module. Track K across snapshots to confirm debt is decreasing rather than accumulating.",
	},
	{
		pattern:
			/\b(curvature|ricci|einstein|spacetime|space.?time|metric|scalar)\b/i,
		guidance:
			"Formula: K = coupling × complexity / (cohesion + ε). K acts as the Ricci scalar — high K indicates mass-energy density of technical debt. Global curvature (mean K across all modules) is the codebase's overall health index; Ricci scalar (Σ K / n) identifies systemic vs. isolated debt.",
	},
	{
		pattern: /\b(coupling|depend|afferent|efferent|import|fan.?in)\b/i,
		guidance:
			"Since K = coupling × complexity / cohesion, halving coupling halves K. Coupling reduction tactics: introduce stable interfaces, invert dependencies via DI, move shared utilities to a dedicated package, and convert runtime imports to configuration injection.",
	},
	{
		pattern:
			/\b(complexity|cyclomatic|cognitive|nesting|function|method|size)\b/i,
		guidance:
			"Complexity is a direct K multiplier. Target functions with cyclomatic complexity > 10 or cognitive complexity > 15. Extract sub-functions, replace conditionals with polymorphism, and use early-return patterns to flatten nesting. Each reduction in complexity lowers K proportionally.",
	},
	{
		pattern: /\b(cohesion|responsib|srp|single|concern|separation|split)\b/i,
		guidance:
			"Cohesion appears in the denominator of K: lower cohesion → higher curvature. Increase cohesion by ensuring each module exports only one logical concept. Split multi-responsibility modules into focused units. Note: splitting a module replaces one high-K entry with two lower-K entries.",
	},
	{
		pattern: /\b(priorit|rank|sort|order|backlog|queue|roadmap|schedule)\b/i,
		guidance:
			"Prioritization protocol: (1) sort modules by K descending, (2) cluster EXTREME_CURVATURE modules into an emergency refactoring initiative, (3) assign HIGH_CURVATURE modules to planned sprints, (4) add MODERATE modules to the technical debt backlog with trend-monitoring alerts.",
	},
	{
		pattern:
			/\b(measure|collect|metric|tool|instrument|track|monitor|trend)\b/i,
		guidance:
			"Data collection: coupling from dependency-cruiser or import-graph tools; complexity from ESLint complexity rule, SonarQube, or CodeClimate; cohesion estimated from LCOM (Lack of Cohesion of Methods) or manually from responsibility audit. Recompute K monthly to track trends.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grSpacetimeDebtMetricHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Spacetime Debt Metric needs a module description, coupling/complexity/cohesion metrics, or a debt quantification goal before it can produce curvature-based analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		// Lightweight numeric computation when metric values are provided.
		const parsed = parseSkillInput(inputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		const nums = extractNumbers(combined);
		const coupling = opts?.coupling ?? (nums.length >= 1 ? nums[0] : undefined);
		const complexity =
			opts?.complexity ?? (nums.length >= 2 ? nums[1] : undefined);
		const cohesion = opts?.cohesion ?? (nums.length >= 3 ? nums[2] : undefined);

		if (
			coupling !== undefined &&
			complexity !== undefined &&
			cohesion !== undefined
		) {
			const K = curvatureScore(coupling, complexity, cohesion);
			const cls = classifyCurvature(K);

			const clsLabel: Record<typeof cls, string> = {
				extreme: "EXTREME_CURVATURE",
				high: "HIGH_CURVATURE",
				moderate: "MODERATE",
				flat: "FLAT",
			};

			guidances.unshift(
				`Advisory computation — coupling=${fmtNum(coupling)}, complexity=${fmtNum(complexity)}, cohesion=${fmtNum(cohesion)}: K=${fmtNum(K)} (${clsLabel[cls]}). ` +
					"Treat as an indicative estimate; validate with your static analysis tooling.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To compute the Spacetime Debt Metric: collect coupling count, complexity score, and cohesion rating per module. Apply K = coupling × complexity / (cohesion + 1e-6). Sort by K descending to identify debt hotspots.",
				"Global health index: compute mean K across all modules. If mean K > 5 the codebase has systemic curvature requiring a broad refactoring initiative, not just targeted hotspot fixes.",
			);
		}

		if (signals.hasContext) {
			guidances.push(
				"Analyze the provided context for dominant curvature contributors: modules with high coupling and high complexity together are the highest-priority debt targets, since K scales with their product.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply curvature analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Focus debt reduction on the highest-K modules that also violate these constraints.`,
			);
		}

		return createCapabilityResult(
			context,
			`Spacetime Debt Metric produced ${guidances.length} curvature-analysis guideline${guidances.length === 1 ? "" : "s"} for technical debt prioritization. Results are advisory — validate with static analysis tooling.`,
			createFocusRecommendations(
				"Curvature analysis guidance",
				guidances,
				context.model.modelClass,
			),
			[
				buildWorkedExampleArtifact(
					"Spacetime debt example",
					{
						coupling: 24,
						complexity: 18,
						cohesion: 0.5,
					},
					{
						curvature: 863.99,
						classification: "extreme",
						plainEnglish:
							"This module is a debt hotspot because many dependencies and lots of complexity are packed together with weak cohesion.",
					},
					"Shows how the curvature formula becomes a prioritization decision.",
				),
				buildComparisonMatrixArtifact(
					"Debt reduction choices",
					["When to use", "Primary move", "Expected result"],
					[
						{
							label: "Coupling-heavy hotspot",
							values: [
								"Dependencies dominate the score",
								"Introduce interfaces and invert imports",
								"Lower curvature by reducing fan-in/fan-out",
							],
						},
						{
							label: "Complexity-heavy hotspot",
							values: [
								"Functions are hard to reason about",
								"Extract smaller functions and simplify branching",
								"Lower curvature by reducing the multiplier",
							],
						},
						{
							label: "Cohesion-heavy hotspot",
							values: [
								"The module does too many unrelated jobs",
								"Split by responsibility",
								"Lower curvature by improving the denominator",
							],
						},
					],
					"Use this matrix when you need to decide which debt lever to pull first.",
				),
				buildEvalCriteriaArtifact(
					"Curvature refactor criteria",
					[
						"The target module has lower K after the change than before it.",
						"The chosen fix addresses the dominant factor, not just the easiest one.",
						"The module remains understandable and testable after the split or extraction.",
						"High-curvature modules are handled before low-curvature ones.",
					],
					"Use these criteria to judge whether the refactor actually reduced debt.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grSpacetimeDebtMetricHandler,
);
