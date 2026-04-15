/**
 * gr-redshift-velocity-mapper.ts
 *
 * Handwritten capability handler for the gr-redshift-velocity-mapper skill.
 *
 * Physics metaphor: light from distant galaxies is redshifted (wavelength
 * stretched) due to expansion of space. In code: API contracts get "redshifted"
 * as they travel through abstraction layers — the interface stretches and
 * drifts. Redshift z = (current_exports − original_exports) / original_exports
 * measures interface drift.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-hawking-entropy-auditor     — public API surface entropy
 *   gr-dark-energy-forecaster      — convention-driven complexity growth
 *   gr-equivalence-principle       — local vs global consistency
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace API
 * versioning, breaking-change detection, or semver validation tools.
 */

import { z } from "zod";
import { gr_redshift_velocity_mapper_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
			originalExports: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Original public API export count (methods, functions, classes) at baseline.",
				),
			currentExports: z
				.number()
				.nonnegative()
				.optional()
				.describe("Current public API export count."),
			abstractionLayers: z
				.number()
				.int()
				.nonnegative()
				.optional()
				.describe(
					"Number of abstraction layers the API has passed through (wrappers, adapters, facades).",
				),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Redshift analogue:
 *   z = (current_exports - original_exports) / original_exports
 *
 * Positive z = API has expanded (more exports than original).
 * Negative z = API has contracted (fewer exports).
 * High |z| = significant interface drift.
 */
function redshift(originalExports: number, currentExports: number): number {
	const safeOriginal = Math.max(originalExports, 1);
	return (currentExports - originalExports) / safeOriginal;
}

type RedshiftClass = "extreme_drift" | "moderate_drift" | "stable";

function classifyRedshift(z: number): RedshiftClass {
	const absZ = Math.abs(z);
	if (absZ > 0.5) return "extreme_drift";
	if (absZ > 0.2) return "moderate_drift";
	return "stable";
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(redshift|drift|stretch|expand|contract|wavelength|doppler)\b/i,
		guidance:
			"Redshift z = (current_exports − original_exports) / original_exports. High positive z (> 0.5) = the API has ballooned beyond recognition; high negative z (< −0.5) = the API has collapsed, potentially dropping essential functionality. Both extremes indicate architectural drift requiring API contract review.",
	},
	{
		pattern: /\b(api|interface|contract|export|public|surface)\b/i,
		guidance:
			"API surface is the observable interface. Track original_exports (baseline public methods/functions) and current_exports over time. Uncontrolled growth or shrinkage indicates drift. Use API extraction tools (e.g., api-extractor, typedoc --json) to snapshot public surfaces at each major version; compute redshift across versions to detect drift.",
	},
	{
		pattern: /\b(abstraction|layer|wrapper|adapter|facade|proxy|decorator)\b/i,
		guidance:
			"Abstraction layers amplify redshift. Each wrapper/adapter/facade layer introduces interface transformations (method renaming, parameter reordering, additional exports). If the API passes through n abstraction layers, total redshift accumulates. High layer count (> 3) with high redshift (z > 0.5) suggests over-abstraction — consider collapsing layers or introducing a canonical interface.",
	},
	{
		pattern: /\b(versioning|semver|breaking|deprecat|compat)\b/i,
		guidance:
			"Redshift is correlated with breaking changes. Positive redshift (new exports) is backward-compatible if old exports remain; negative redshift (removed exports) is a breaking change. Use redshift as a trigger for semver decisions: |z| > 0.5 → major version bump; 0.2 < |z| ≤ 0.5 → minor/patch with careful deprecation strategy.",
	},
	{
		pattern: /\b(detect|measure|track|monitor|identify|analyze)\b/i,
		guidance:
			"Detection workflow: (1) establish a baseline snapshot of public exports (e.g., at v1.0.0), (2) snapshot public exports at each subsequent release, (3) compute redshift z per module, (4) flag |z| > 0.5 as EXTREME_DRIFT requiring API contract review, (5) track redshift trends to identify modules undergoing rapid interface evolution.",
	},
	{
		pattern: /\b(stabilize|freeze|lock|pin|contract|sla|guarantee)\b/i,
		guidance:
			"API stabilization strategy for high-redshift modules: (1) define a canonical stable interface contract, (2) deprecate drifted exports not in the contract, (3) introduce adapter layers to translate between legacy drifted interface and new stable contract, (4) lock the stable contract with a semver guarantee (e.g., no removals in minor versions), (5) verify redshift < 0.1 post-stabilization.",
	},
	{
		pattern: /\b(expansion|growth|bloat|feature.?creep|scope.?creep)\b/i,
		guidance:
			"Positive redshift (z > 0.5) indicates API expansion — the module is exporting far more than its original intent. Common causes: feature creep, lack of interface discipline, over-generalization. Remediation: apply SRP to the module; extract unrelated exports into separate modules; introduce a facade that exports only the core stable interface.",
	},
	{
		pattern: /\b(contraction|shrink|removal|deprecat|sunset|prune)\b/i,
		guidance:
			"Negative redshift (z < −0.5) indicates API contraction — exports have been removed. This is a breaking change unless deprecated with migration path. Before removing exports, verify usage via static analysis (e.g., ts-prune, madge --unused-exports); provide polyfill or migration guide for removed functionality; increment major version per semver.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grRedshiftVelocityMapperHandler: SkillHandler = {
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
				"Redshift Velocity Mapper needs an API evolution scenario, export counts, or an interface-drift concern before it can produce redshift analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		const opts = parsed.data.options;

		if (
			opts?.originalExports !== undefined &&
			opts?.currentExports !== undefined
		) {
			const originalExports = opts.originalExports;
			const currentExports = opts.currentExports;
			const z = redshift(originalExports, currentExports);
			const cls = classifyRedshift(z);

			const clsLabel: Record<typeof cls, string> = {
				extreme_drift: "EXTREME_DRIFT",
				moderate_drift: "MODERATE_DRIFT",
				stable: "STABLE",
			};

			const direction = z > 0 ? "expansion" : z < 0 ? "contraction" : "stable";

			guidances.unshift(
				`Advisory computation — original_exports=${fmtNum(originalExports)}, current_exports=${fmtNum(currentExports)}: redshift z=${fmtNum(z)} (${clsLabel[cls]}, ${direction}). ` +
					"Validate against your API versioning policy before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Redshift Velocity Mapper: snapshot public API exports at a baseline version, then snapshot again at each subsequent version. Compute redshift z = (current − original) / original. |z| > 0.5 indicates extreme drift requiring API contract review.",
				"Integration tip: track redshift per module over time to identify modules undergoing rapid interface evolution. Use redshift thresholds to trigger semver major version bumps (|z| > 0.5) or deprecation warnings (0.2 < |z| ≤ 0.5).",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply redshift analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure API evolution strategies remain compliant with versioning policies.`,
			);
		}

		guidances.push(GR_STATIC_EVIDENCE_NOTE);

		const sampleOriginalExports = opts?.originalExports ?? 12;
		const sampleCurrentExports = opts?.currentExports ?? 19;
		const sampleRedshift = redshift(
			sampleOriginalExports,
			sampleCurrentExports,
		);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Redshift drift worked example",
				{
					originalExports: sampleOriginalExports,
					currentExports: sampleCurrentExports,
					abstractionLayers: opts?.abstractionLayers ?? 3,
				},
				{
					redshift: fmtNum(sampleRedshift),
					classification: classifyRedshift(sampleRedshift),
					engineeringTranslation:
						"Review the public surface before more wrappers or removals make the contract drift harder to recover.",
				},
				"Turns interface stretch into an API review action.",
			),
			buildOutputTemplateArtifact(
				"API drift review memo",
				`Baseline version:
Current version:
Observed redshift:
Main expansion or contraction drivers:
Compatibility risk:
Semver / deprecation action:`,
				[
					"Baseline version",
					"Current version",
					"Observed redshift",
					"Main expansion or contraction drivers",
					"Compatibility risk",
					"Semver / deprecation action",
				],
				"Use this template when converting a redshift warning into a contract review memo.",
			),
			buildEvalCriteriaArtifact(
				"API redshift checks",
				[
					"Export counts come from an existing API report or baseline snapshot rather than a claimed live extraction.",
					"Expansion and contraction are both interpreted in the context of semver and migration policy.",
					"Abstraction layers are reviewed when they amplify interface drift.",
					"Any proposed stabilization reduces drift toward a documented canonical contract.",
				],
				"Criteria for deciding whether observed API drift is significant enough to act on.",
			),
		];

		return createCapabilityResult(
			context,
			`Redshift Velocity Mapper produced ${guidances.length} interface-drift guideline${guidances.length === 1 ? "" : "s"}. Results are advisory.`,
			createFocusRecommendations(
				"Redshift velocity guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grRedshiftVelocityMapperHandler,
);
