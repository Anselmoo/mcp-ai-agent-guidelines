/**
 * gr-gravitational-wave-detector.ts
 *
 * Handwritten capability handler for the gr-gravitational-wave-detector skill.
 *
 * Physics metaphor: gravitational waves are ripples in spacetime caused by
 * massive events (e.g., binary black hole mergers). In code: large merges or
 * refactors create ripples in coupling structure — strain h = |coupling_after
 * − coupling_before| / coupling_before measures the shockwave magnitude.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-frame-dragging-detector     — ongoing churn-induced neighbor changes
 *   gr-event-horizon-detector      — fan-in cascade propagation
 *   gr-schwarzschild-classifier    — coupling zone classification
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace diff
 * analysis tools (git diff --stat, dependency-diff).
 */

import { z } from "zod";
import { gr_gravitational_wave_detector_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import { fmtNum, GR_STATIC_EVIDENCE_NOTE } from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			couplingBefore: z
				.number()
				.nonnegative()
				.optional()
				.describe("Coupling count before the refactor/merge event."),
			couplingAfter: z
				.number()
				.nonnegative()
				.optional()
				.describe("Coupling count after the refactor/merge event."),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Gravitational wave strain analogue:
 *   h = |coupling_after - coupling_before| / coupling_before
 *
 * High h indicates the refactor sent shockwaves through the dependency graph.
 */
function gravitationalStrain(
	couplingBefore: number,
	couplingAfter: number,
): number {
	const safeBefore = Math.max(couplingBefore, 1);
	return Math.abs(couplingAfter - couplingBefore) / safeBefore;
}

type StrainClass = "merger_event" | "significant_wave" | "stable";

function classifyStrain(strain: number): StrainClass {
	if (strain > 0.5) return "merger_event";
	if (strain > 0.2) return "significant_wave";
	return "stable";
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(wave|gravitational|ripple|strain|shockwave|perturbation|disturbance)\b/i,
		guidance:
			"Gravitational wave strain h = |coupling_after − coupling_before| / coupling_before. Strain > 0.5 indicates a MERGER_EVENT — the refactor fundamentally restructured the dependency graph. High strain suggests widespread coupling changes; review all affected modules for unintended breakage before deploying.",
	},
	{
		pattern: /\b(merge|refactor|restructure|redesign|rewrite|overhaul)\b/i,
		guidance:
			"Large merges and refactors are the merger events that generate gravitational waves. Measure strain by taking dependency snapshots before and after the change. Compare coupling counts per module to quantify the wave amplitude. Strain > 0.2 requires extended regression testing; strain > 0.5 requires staged rollout.",
	},
	{
		pattern: /\b(before|after|delta|diff|change|compare|snapshot)\b/i,
		guidance:
			"Strain detection workflow: (1) snapshot dependency graph before the refactor (e.g., `dependency-cruiser --output-type json`), (2) apply the refactor, (3) snapshot again, (4) compute coupling_before and coupling_after per module, (5) compute strain h per module, (6) flag modules with h > 0.2 for manual review.",
	},
	{
		pattern: /\b(coupling|depend|import|afferent|efferent|link)\b/i,
		guidance:
			"Coupling delta Δcoupling = coupling_after − coupling_before is the numerator of strain. Positive Δcoupling = new dependencies introduced; negative Δcoupling = dependencies removed. High absolute Δcoupling with low coupling_before produces high strain, even if the absolute coupling count remains reasonable.",
	},
	{
		pattern: /\b(propagat|cascade|blast|radius|impact|affect)\b/i,
		guidance:
			"High-strain modules are epicenters of architectural shockwaves. Changes propagate from them to their dependents. Compute blast radius by walking the dependency graph from each high-strain module; all modules within 2 edges inherit residual strain. Prioritize testing modules in the blast radius.",
	},
	{
		pattern: /\b(detect|measure|identify|find|discover|analyze)\b/i,
		guidance:
			"Detection strategy: wire strain review into existing CI/CD reports or dependency-snapshot jobs rather than claiming live recomputation if that bridge is unavailable. On significant merges, compare the latest before/after dependency exports, compute strain for changed modules, and flag max(strain) > 0.5 for manual release review. Track strain trends over time using saved snapshots to identify architecturally unstable periods.",
	},
	{
		pattern: /\b(regression|test|validation|verify|check|qa)\b/i,
		guidance:
			"Strain-driven testing strategy: modules with strain > 0.2 require full regression test coverage (unit + integration + e2e). Modules with strain > 0.5 should be deployed in a canary or blue-green rollout with rollback plan. Use strain as a proxy for refactor risk when planning test budgets.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grGravitationalWaveDetectorHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Gravitational Wave Detector needs a refactor description, before/after coupling metrics, or a change-impact concern before it can produce strain analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		// Lightweight numeric computation when explicit options are provided.
		const parsed = parseSkillInput(inputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (
			opts?.couplingBefore !== undefined &&
			opts?.couplingAfter !== undefined
		) {
			const before = opts.couplingBefore;
			const after = opts.couplingAfter;
			const strain = gravitationalStrain(before, after);
			const cls = classifyStrain(strain);

			const clsLabel: Record<typeof cls, string> = {
				merger_event: "MERGER_EVENT",
				significant_wave: "SIGNIFICANT_WAVE",
				stable: "STABLE",
			};

			guidances.unshift(
				`Advisory computation — coupling_before=${fmtNum(before)}, coupling_after=${fmtNum(after)}: strain=${fmtNum(strain)} (${clsLabel[cls]}). ` +
					"Validate against your dependency snapshots before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Gravitational Wave Detector: snapshot coupling metrics before and after a large refactor or merge. Compute strain h = |coupling_after − coupling_before| / coupling_before per module. Modules with h > 0.5 require extended regression testing.",
				"Integration tip: add strain detection to your CI/CD pipeline. Flag merges with max(strain) > 0.2 for manual review before deployment.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply wave detection under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure high-strain modules remain compliant post-refactor.`,
			);
		}

		guidances.push(GR_STATIC_EVIDENCE_NOTE);

		// --- Machine-readable artifacts ---
		const artifacts = [
			// Worked example: Strain calculation
			buildWorkedExampleArtifact(
				"Gravitational Strain Calculation Example",
				{
					couplingBefore: 10,
					couplingAfter: 18,
				},
				{
					strain: (Math.abs(18 - 10) / 10).toFixed(2),
					classification: "MERGER_EVENT",
				},
				"Given couplingBefore=10 and couplingAfter=18, computes strain=0.80 (MERGER_EVENT).",
			),
			// Output template: Strain detection workflow
			buildOutputTemplateArtifact(
				"Strain Detection Workflow Template",
				"1. Snapshot dependency graph before refactor\n2. Apply refactor/merge\n3. Snapshot dependency graph after\n4. Compute coupling_before and coupling_after per module\n5. Compute strain h = |coupling_after - coupling_before| / coupling_before\n6. Flag modules with h > 0.2 for review, h > 0.5 for staged rollout",
				["coupling_before", "coupling_after", "strain", "classification"],
				"Template for running strain detection after large code changes.",
			),
			buildComparisonMatrixArtifact(
				"Wave strain response matrix",
				["Strain band", "Interpretation", "Recommended follow-up"],
				[
					{
						label: "h ≤ 0.2",
						values: [
							"Low architectural ripple",
							"Mostly local coupling movement",
							"Keep normal regression scope and note the delta",
						],
					},
					{
						label: "0.2 < h ≤ 0.5",
						values: [
							"Significant wave",
							"Dependency shape changed enough to widen review scope",
							"Expand regression coverage and inspect nearby dependents",
						],
					},
					{
						label: "h > 0.5",
						values: [
							"Merger event",
							"Refactor likely changed architectural seams materially",
							"Use staged rollout or explicit rollback planning before release",
						],
					},
				],
				"Use this matrix to translate strain magnitude into release posture.",
			),
			buildToolChainArtifact(
				"Wave strain evidence chain",
				[
					{
						tool: "dependency snapshot export",
						description:
							"Use existing before/after graph exports or report snapshots as the basis for strain calculations.",
					},
					{
						tool: "diff or merge summary",
						description:
							"Limit manual review to the modules actually reshaped by the refactor or merge.",
					},
					{
						tool: "regression and rollout plan",
						description:
							"Choose normal validation, expanded regression, or staged rollout based on the observed strain band.",
					},
				],
				"Ground the wave metaphor in saved dependency evidence and release controls.",
			),
		];

		return createCapabilityResult(
			context,
			`Gravitational Wave Detector produced ${guidances.length} coupling-shockwave guideline${guidances.length === 1 ? "" : "s"}. Results are advisory.`,
			createFocusRecommendations(
				"Gravitational wave guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grGravitationalWaveDetectorHandler,
);
