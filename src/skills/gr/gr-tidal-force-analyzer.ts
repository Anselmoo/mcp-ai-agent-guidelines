/**
 * gr-tidal-force-analyzer.ts
 *
 * Handwritten capability handler for the gr-tidal-force-analyzer skill.
 *
 * Physics metaphor: tidal forces tear modules apart when differential coupling
 * across function groups is high relative to cohesion. The analogue of
 * F_tidal ∝ GM/r³ is: tidal_force = (max_coupling - min_coupling) / (mean_cohesion³ + ε).
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-schwarzschild-classifier — total coupling zone classification
 *   gr-event-horizon-detector   — fan-in threshold / cascade detection
 *   gr-spacetime-debt-metric    — full curvature score (coupling×complexity/cohesion)
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace static
 * analysis tools or manual module boundary review.
 */

import { z } from "zod";
import { gr_tidal_force_analyzer_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	classifyTidal,
	extractNumbers,
	fmtNum,
	GR_STATIC_EVIDENCE_NOTE,
	tidalForce,
} from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			maxCoupling: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Maximum coupling count among the function groups in the module (highest-coupled group).",
				),
			minCoupling: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Minimum coupling count among the function groups in the module (lowest-coupled group).",
				),
			meanCohesion: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Mean cohesion score across function groups. Higher = more internally cohesive. Enters the formula as the denominator cubed.",
				),
		})
		.optional(),
});

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(split|torn|tear|rip|apart|break|decompose|separate|divide)\b/i,
		guidance:
			"Split-required modules (F_tidal > 5) have incompatible function groups that should not share a module boundary. Extract each group into its own module with an explicit interface contract. Wire them through dependency injection or events rather than direct imports, so future coupling changes stay contained.",
	},
	{
		pattern: /\b(high.?tension|tension|stress|strain|internal|differential)\b/i,
		guidance:
			"High-tension modules (2 < F_tidal ≤ 5) are under structural stress. Introduce internal sub-folder boundaries (e.g., separate files per functional group) and add explicit re-export index files. This lowers the refactoring cost when the module eventually needs to be split.",
	},
	{
		pattern:
			/\b(tidal|force|coupling|differential|gradient|variation|spread)\b/i,
		guidance:
			"Formula: F_tidal = (max_coupling − min_coupling) / (mean_cohesion³ + ε). The cubic denominator amplifies low-cohesion penalties — a module with mean_cohesion=0.5 has 8× the tidal force of one with mean_cohesion=1.0 at the same coupling differential. Improving cohesion pays compounding dividends.",
	},
	{
		pattern:
			/\b(group|cluster|function|method|class|unit|responsib|concern)\b/i,
		guidance:
			"Function group analysis: partition the module's public surface into logical clusters (e.g., by business capability or data ownership). Measure coupling and cohesion per cluster. High coupling differential between clusters (max − min > 3) strongly predicts a future split, even if overall module metrics look acceptable.",
	},
	{
		pattern: /\b(cohesion|low.?cohes|lack|lcom|mixed|god)\b/i,
		guidance:
			"Cohesion is cubed in the tidal force denominator: even a moderate reduction from 0.8 to 0.4 increases tidal force by 8×. Improve cohesion by applying SRP: each function group should represent one and only one reason to change. Use LCOM4 or responsibility audits to quantify cohesion before and after refactoring.",
	},
	{
		pattern: /\b(candidate|identify|find|detect|scan|discover|which)\b/i,
		guidance:
			"Detection workflow: (1) enumerate function groups within each module, (2) measure coupling (imports + exports per group) and cohesion (shared state + call-graph density within group), (3) compute F_tidal per module, (4) rank modules by F_tidal descending. Modules with F_tidal > 5 are priority split candidates.",
	},
	{
		pattern:
			/\b(refactor|redesign|architect|restructure|extract|reorgani[sz])\b/i,
		guidance:
			"Tidal splitting playbook: (1) identify the coupling differential boundary (the function group pair with max − min coupling), (2) introduce a seam (interface or event bus) between the groups, (3) move each group to a separate module, (4) verify tidal_force < 2 for each resulting module before closing the refactoring ticket.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grTidalForceAnalyzerHandler: SkillHandler = {
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
				"Tidal Force Analyzer needs a module description, function group metrics, or a split-candidate concern before it can produce differential-coupling analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		const opts = parsed.data.options;

		const nums = extractNumbers(combined);
		const maxC = opts?.maxCoupling ?? (nums.length >= 1 ? nums[0] : undefined);
		const minC = opts?.minCoupling ?? (nums.length >= 2 ? nums[1] : undefined);
		const meanCoh =
			opts?.meanCohesion ?? (nums.length >= 3 ? nums[2] : undefined);

		if (maxC !== undefined && minC !== undefined && meanCoh !== undefined) {
			const F = tidalForce(maxC, minC, meanCoh);
			const cls = classifyTidal(F);

			const clsLabel: Record<typeof cls, string> = {
				split_required: "SPLIT_REQUIRED",
				high_tension: "HIGH_TENSION",
				stable: "STABLE",
			};

			guidances.unshift(
				`Advisory computation — max_coupling=${fmtNum(maxC)}, min_coupling=${fmtNum(minC)}, mean_cohesion=${fmtNum(meanCoh)}: F_tidal=${fmtNum(F)} (${clsLabel[cls]}). ` +
					"Treat as an indicative estimate; validate against your module structure analysis before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Tidal Force Analyzer: partition each module into logical function groups. For each module compute F_tidal = (max_coupling − min_coupling) / (mean_cohesion³ + ε). Modules with F_tidal > 5 are split candidates.",
				"Advisory note: the cubic cohesion denominator means that improving cohesion is exponentially more effective than reducing the coupling differential. Target cohesion improvements first in high-tension modules.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply tidal analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Focus split recommendations on modules that also violate these constraints.`,
			);
		}

		guidances.push(GR_STATIC_EVIDENCE_NOTE);

		const sampleMax = maxC ?? 8;
		const sampleMin = minC ?? 2;
		const sampleMeanCohesion = meanCoh ?? 0.6;
		const sampleForce = tidalForce(sampleMax, sampleMin, sampleMeanCohesion);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Tidal force worked example",
				{
					maxCoupling: sampleMax,
					minCoupling: sampleMin,
					meanCohesion: sampleMeanCohesion,
				},
				{
					tidalForce: fmtNum(sampleForce),
					classification: classifyTidal(sampleForce),
					engineeringTranslation:
						"Use a seam between the highest- and lowest-coupled groups when the module is already pulling apart.",
				},
				"Turns differential coupling into a split-candidate decision.",
			),
			buildComparisonMatrixArtifact(
				"Tidal split matrix",
				["Observed state", "Meaning", "Recommended move"],
				[
					{
						label: "Split required",
						values: [
							"Function groups are structurally incompatible",
							"The module is already pulling apart",
							"Extract separate modules with an explicit interface seam",
						],
					},
					{
						label: "High tension",
						values: [
							"The module is stressed but not fully tearing",
							"Split is likely soon if left alone",
							"Introduce internal boundaries and re-export seams now",
						],
					},
					{
						label: "Stable",
						values: [
							"Coupling differential is manageable",
							"The current boundary is not the top split candidate",
							"Monitor but prioritize higher-force modules first",
						],
					},
				],
				"Use this matrix to decide whether a module needs immediate separation or preparatory seam work.",
			),
			buildEvalCriteriaArtifact(
				"Tidal analysis checks",
				[
					"Function groups are identified from an explicit module boundary review, not guessed from a claimed live runtime scan.",
					"Cohesion is measured or estimated consistently across groups before comparing modules.",
					"The chosen seam follows the strongest coupling differential rather than arbitrary file boundaries.",
					"Post-split modules are re-evaluated to confirm tidal force actually dropped.",
				],
				"Criteria for deciding whether the module is a genuine split candidate.",
			),
		];

		return createCapabilityResult(
			context,
			`Tidal Force Analyzer produced ${guidances.length} differential-coupling guideline${guidances.length === 1 ? "" : "s"} for split-candidate identification. Results are advisory — validate with module structure review.`,
			createFocusRecommendations(
				"Tidal force guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grTidalForceAnalyzerHandler,
);
