/**
 * gr-inflation-detector.ts
 *
 * Handwritten capability handler for the gr-inflation-detector skill.
 *
 * Physics metaphor: cosmic inflation is exponential expansion of space faster
 * than matter density increases. In code: runaway module growth where LOC
 * expands exponentially without proportional increase in exported value
 * (features, APIs). Based on de Sitter exponential expansion a(t) ∝ e^{Ht}.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-dark-energy-forecaster      — convention-driven invisible complexity
 *   gr-hawking-entropy-auditor     — public API surface entropy
 *   gr-neutron-star-compactor      — information density / Chandrasekhar limit
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace code
 * coverage, complexity analysis, or LOC tracking tools.
 */

import { z } from "zod";
import { gr_inflation_detector_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
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
			locGrowthRate: z
				.number()
				.optional()
				.describe(
					"LOC growth rate per time period (e.g., % increase per sprint or absolute LOC/week).",
				),
			valueGrowthRate: z
				.number()
				.optional()
				.describe(
					"Exported value growth rate (new features, API endpoints, public methods per time period).",
				),
			currentLOC: z
				.number()
				.nonnegative()
				.optional()
				.describe("Current lines of code in the module."),
			currentValue: z
				.number()
				.nonnegative()
				.optional()
				.describe("Current exported value count (features, APIs)."),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Inflation ratio analogue:
 *   inflation_ratio = loc_growth_rate / (value_growth_rate + ε)
 *
 * High inflation_ratio means LOC is growing faster than value, indicating
 * runaway expansion.
 */
function inflationRatio(
	locGrowthRate: number,
	valueGrowthRate: number,
): number {
	return locGrowthRate / Math.max(valueGrowthRate, 0.01);
}

type InflationClass = "runaway" | "accelerating" | "stable";

function classifyInflation(ratio: number): InflationClass {
	if (ratio > 3) return "runaway";
	if (ratio > 1.5) return "accelerating";
	return "stable";
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(inflation|runaway|exponential|explosion|de.?sitter|expansion)\b/i,
		guidance:
			"Inflation ratio = loc_growth_rate / value_growth_rate. Ratio > 3 indicates RUNAWAY inflation — the module is expanding exponentially without delivering proportional value. Emergency action: freeze new feature work, conduct a code audit, and eliminate dead code, over-abstraction, and speculative generality before resuming development.",
	},
	{
		pattern: /\b(loc|lines|size|volume|mass|growth|bloat)\b/i,
		guidance:
			"LOC growth rate is the expansion velocity. Measure it as ΔLOC per sprint or ΔLOC per week. Sustained exponential growth (e.g., +20% LOC per sprint) without corresponding feature delivery indicates inflation. Track LOC trends using git history: `git log --since='8 weeks ago' --oneline --numstat -- <module> | awk '{sum += $1} END {print sum}'`.",
	},
	{
		pattern: /\b(value|feature|api|export|endpoint|method|capability)\b/i,
		guidance:
			"Exported value growth rate measures delivered functionality: new public methods, API endpoints, user-facing features per time period. If LOC doubles but exported value increases by only 10%, inflation_ratio = 2.0 / 0.1 = 20 — severe runaway. Quantify value using API surface metrics or feature flag counts.",
	},
	{
		pattern: /\b(dead|unused|unreachable|obsolete|redundant|duplicate)\b/i,
		guidance:
			"Dead code is a primary inflation driver. Each unused function or obsolete abstraction layer increases LOC without value. Use static analysis tools (e.g., ts-prune, unused-code, vulture) to detect dead code. Target removal of > 50% of identified dead code before resuming feature work in inflating modules.",
	},
	{
		pattern: /\b(abstract|generic|layer|framework|pattern|over.?engineer)\b/i,
		guidance:
			"Over-abstraction and speculative generality fuel inflation. Adding a generic framework layer to support a single use case triples LOC without delivering proportional value. Remediation: apply YAGNI (You Aren't Gonna Need It) — remove abstraction layers that aren't actively serving > 3 concrete implementations.",
	},
	{
		pattern: /\b(detect|measure|identify|track|trend|monitor)\b/i,
		guidance:
			"Detection workflow: (1) track LOC and exported_value (API count, feature count) per module over time (e.g., weekly snapshots), (2) compute growth rates as percentage change per time period, (3) compute inflation_ratio per module, (4) flag ratio > 1.5 as ACCELERATING, ratio > 3 as RUNAWAY. Add flagged modules to the cleanup backlog.",
	},
	{
		pattern: /\b(freeze|halt|stop|pause|audit|cleanup|prune)\b/i,
		guidance:
			"Inflation remediation protocol for RUNAWAY modules: (1) freeze new feature development, (2) conduct a comprehensive code audit to identify dead code, over-abstraction, and duplication, (3) prune > 30% of LOC via targeted removal, (4) re-measure inflation_ratio, (5) resume feature work only if ratio < 1.5.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grInflationDetectorHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(inputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Inflation Detector needs a module description, growth metrics, or a runaway-expansion concern before it can produce inflation analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		const opts = parsed.data.options;

		if (
			opts?.locGrowthRate !== undefined &&
			opts?.valueGrowthRate !== undefined
		) {
			const locRate = opts.locGrowthRate;
			const valueRate = opts.valueGrowthRate;
			const ratio = inflationRatio(locRate, valueRate);
			const cls = classifyInflation(ratio);

			const clsLabel: Record<typeof cls, string> = {
				runaway: "RUNAWAY",
				accelerating: "ACCELERATING",
				stable: "STABLE",
			};

			guidances.unshift(
				`Advisory computation — loc_growth_rate=${fmtNum(locRate)}, value_growth_rate=${fmtNum(valueRate)}: inflation_ratio=${fmtNum(ratio)} (${clsLabel[cls]}). ` +
					"Validate against your code metrics before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Inflation Detector: track LOC and exported_value (API count, feature count) over time per module. Compute growth rates as percentage change per sprint or absolute change per week. Compute inflation_ratio = loc_rate / value_rate. Ratios > 3 indicate runaway expansion requiring immediate cleanup.",
				"Remediation target: eliminate dead code, remove speculative abstractions, and apply YAGNI. Aim to reduce inflation_ratio below 1.5 before resuming feature development.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply inflation detection under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure cleanup strategies remain compliant.`,
			);
		}

		guidances.push(GR_STATIC_EVIDENCE_NOTE);

		const sampleLocRate = opts?.locGrowthRate ?? 0.24;
		const sampleValueRate = opts?.valueGrowthRate ?? 0.08;
		const sampleRatio = inflationRatio(sampleLocRate, sampleValueRate);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Inflation detection worked example",
				{
					locGrowthRate: sampleLocRate,
					valueGrowthRate: sampleValueRate,
					currentLOC: opts?.currentLOC ?? 2600,
					currentValue: opts?.currentValue ?? 14,
				},
				{
					inflationRatio: fmtNum(sampleRatio),
					classification: classifyInflation(sampleRatio),
					engineeringTranslation:
						"Pause feature growth long enough to remove dead code and speculative layers until value growth catches up.",
				},
				"Shows how growth imbalance becomes a cleanup decision.",
			),
			buildOutputTemplateArtifact(
				"Inflation cleanup brief",
				`Snapshot window:
LOC growth signal:
Value growth signal:
Main inflation drivers:
Cleanup actions to run first:
Exit criteria before feature work resumes:`,
				[
					"Snapshot window",
					"LOC growth signal",
					"Value growth signal",
					"Main inflation drivers",
					"Cleanup actions to run first",
					"Exit criteria before feature work resumes",
				],
				"Use this template when converting an inflation warning into an engineering cleanup brief.",
			),
			buildEvalCriteriaArtifact(
				"Inflation review checks",
				[
					"Growth rates come from an existing time window or report rather than a claimed live scan.",
					"Value is measured explicitly with a concrete proxy such as API count or shipped features.",
					"Dead code and speculative abstractions are identified before more feature work is approved.",
					"The module exits cleanup only after the ratio trends back toward stable territory.",
				],
				"Criteria for deciding whether a module is genuinely inflating.",
			),
		];

		return createCapabilityResult(
			context,
			`Inflation Detector produced ${guidances.length} runaway-expansion guideline${guidances.length === 1 ? "" : "s"}. Results are advisory.`,
			createFocusRecommendations(
				"Inflation detection guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grInflationDetectorHandler,
);
