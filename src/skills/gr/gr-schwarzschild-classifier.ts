/**
 * gr-schwarzschild-classifier.ts
 *
 * Handwritten capability handler for the gr-schwarzschild-classifier skill.
 *
 * Physics metaphor: classifies modules by their position relative to their
 * own Schwarzschild radius (r_s = 2 × coupling_mass). Modules inside the
 * horizon have effectively collapsed; those near it suffer severe development
 * time dilation.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-event-horizon-detector — cascade propagation detection (fan-in threshold)
 *   gr-spacetime-debt-metric  — full curvature score (coupling × complexity / cohesion)
 *   gr-tidal-force-analyzer   — differential coupling / split-candidate detection
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace coupling
 * analysis tools (e.g., dependency-cruiser, Madge, jdeps).
 */

import { z } from "zod";
import { gr_schwarzschild_classifier_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	classifySchwarzschildZone,
	extractNumbers,
	fmtNum,
	GR_STATIC_EVIDENCE_NOTE,
	schwarzschildRadius,
	timeDilationFactor,
} from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			couplingMass: z
				.number()
				.positive()
				.optional()
				.describe(
					"Total coupling mass = afferent + efferent dependency count for the module under analysis.",
				),
			currentCoupling: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Current coupling count (r). Compared against r_s to determine zone.",
				),
		})
		.optional(),
});

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(inside|collapsed|singularity|beyond|critical.?mass)\b/i,
		guidance:
			"Modules inside the horizon (r ≤ r_s = 2 × coupling_mass) have effectively collapsed — every change propagates freely. Emergency protocol: extract a facade or adapter interface before any other refactoring; do not add new consumers until coupling_mass is reduced below r_s / 2.",
	},
	{
		pattern:
			/\b(near.?horizon|approaching|time.?dilat|velocity|develop.*slow|redshift)\b/i,
		guidance:
			"Near-horizon modules (r_s < r ≤ 1.5 × r_s) experience time dilation — even small changes require disproportionate coordination. Convert direct dependencies to message-passing or event-based coupling to move r further from r_s before the next sprint.",
	},
	{
		pattern: /\b(coupling|depend|import|afferent|efferent|fan.?in|fan.?out)\b/i,
		guidance:
			"Coupling mass = afferent_coupling + efferent_coupling (fan-in + fan-out). Compute r_s = 2 × coupling_mass per module. Any module where current_coupling ≥ 0.8 × r_s is approaching the near-horizon warning zone and should be added to the architectural risk register.",
	},
	{
		pattern: /\b(classify|zone|orbital|free.?space|tier|category)\b/i,
		guidance:
			"Classification zones — INSIDE_HORIZON (r ≤ r_s): collapsed, emergency decouple; NEAR_HORIZON (r_s < r ≤ 1.5×r_s): severe dilation, scheduled reduction; ORBITAL (1.5×r_s < r ≤ 3×r_s): elevated risk, monitor trend; FREE_SPACE (r > 3×r_s): safe, predictable velocity.",
	},
	{
		pattern: /\b(refactor|decouple|extract|facade|interface|abstraction)\b/i,
		guidance:
			"Escape velocity refactoring strategy: move modules from inner zones outward by (1) introducing a stable interface contract, (2) migrating consumers to the interface, (3) extracting high-coupling responsibilities into a dedicated module. Each step reduces coupling_mass and increases r.",
	},
	{
		pattern: /\b(velocity|throughput|cycle.?time|lead.?time|sprint)\b/i,
		guidance:
			"Development velocity penalty is proportional to time_dilation = 1 / √(1 − r_s/r). A module at r = 1.1 × r_s has a dilation factor of ≈ 3.2×, meaning tasks that should take one day take over three. Prioritize near-horizon modules in velocity improvement initiatives.",
	},
	{
		pattern: /\b(sort|rank|priorit|order|hotspot|top)\b/i,
		guidance:
			"Prioritization: rank modules by time_dilation descending. Address INSIDE_HORIZON first (dilation → ∞), then NEAR_HORIZON (dilation 3–10×). Orbital modules warrant monitoring but not emergency action. Attach rankings to the team's technical debt backlog.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grSchwarzschildClassifierHandler: SkillHandler = {
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
				"Schwarzschild Classifier needs a module description, coupling metrics, or a specific coupling concern to produce zone classifications.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		const optCouplingMass = parsed.data.options?.couplingMass;
		const optCurrentCoupling = parsed.data.options?.currentCoupling;

		const nums = extractNumbers(combined);
		const inferredMass =
			optCouplingMass ?? (nums.length >= 1 ? nums[0] : undefined);
		const inferredCurrent =
			optCurrentCoupling ?? (nums.length >= 2 ? nums[1] : undefined);

		if (inferredMass !== undefined && inferredCurrent !== undefined) {
			const r_s = schwarzschildRadius(inferredMass);
			const zone = classifySchwarzschildZone(inferredCurrent, r_s);
			const dilation = timeDilationFactor(inferredCurrent, r_s);

			const zoneLabel: Record<typeof zone, string> = {
				inside_horizon: "INSIDE_HORIZON",
				near_horizon: "NEAR_HORIZON",
				orbital: "ORBITAL",
				free_space: "FREE_SPACE",
			};
			guidances.unshift(
				`Advisory computation — coupling_mass=${fmtNum(inferredMass)}, r_s=${fmtNum(r_s)}, current_coupling=${fmtNum(inferredCurrent)}: zone=${zoneLabel[zone]}, time_dilation≈${fmtNum(dilation)}×. ` +
					"Treat these as indicative estimates based on provided values; validate against your static analysis tooling before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"Apply the Schwarzschild Classifier by collecting per-module coupling_mass (afferent + efferent dependency count). Compute r_s = 2 × coupling_mass. Compare each module's current coupling count against r_s to determine its zone.",
				"Formula summary: r_s = 2 × coupling_mass; time_dilation = 1 / √(1 − r_s/r). High time_dilation values identify the modules that will benefit most from decoupling investment.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure coupling reduction strategies remain compliant with these constraints.`,
			);
		}

		guidances.push(GR_STATIC_EVIDENCE_NOTE);

		const sampleMass = inferredMass ?? 18;
		const sampleCurrent = inferredCurrent ?? 40;
		const sampleRadius = schwarzschildRadius(sampleMass);
		const sampleZone = classifySchwarzschildZone(sampleCurrent, sampleRadius);
		const sampleDilation = timeDilationFactor(sampleCurrent, sampleRadius);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Schwarzschild classification worked example",
				{
					couplingMass: sampleMass,
					currentCoupling: sampleCurrent,
				},
				{
					schwarzschildRadius: fmtNum(sampleRadius),
					zone: sampleZone,
					timeDilation: fmtNum(sampleDilation),
					engineeringTranslation:
						"Prioritise modules closest to or inside the horizon because they slow every change around them.",
				},
				"Turns coupling pressure into a triage order.",
			),
			buildComparisonMatrixArtifact(
				"Coupling zone response matrix",
				["Zone", "Meaning", "Preferred next move"],
				[
					{
						label: "INSIDE_HORIZON",
						values: [
							"Coupling has effectively collapsed",
							"Changes cascade freely",
							"Introduce a facade before adding more consumers",
						],
					},
					{
						label: "NEAR_HORIZON",
						values: [
							"Severe coordination drag",
							"Small edits take disproportionate effort",
							"Schedule coupling reduction in the current planning window",
						],
					},
					{
						label: "ORBITAL / FREE_SPACE",
						values: [
							"Monitor rather than emergency-refactor",
							"Coupling is elevated or manageable",
							"Track trends and protect future drift",
						],
					},
				],
				"Use this matrix to turn zone labels into action levels.",
			),
			buildEvalCriteriaArtifact(
				"Coupling horizon checks",
				[
					"Coupling counts come from dependency analysis or a reviewed estimate rather than a claimed live scan.",
					"Modules in inner zones are prioritized before already-stable outer-zone modules.",
					"Time dilation is treated as a planning cue, not a literal performance measurement.",
					"The selected remediation actually moves the module outward by reducing coupling mass or direct coupling.",
				],
				"Criteria for deciding whether the zone classification should drive backlog priority.",
			),
		];

		return createCapabilityResult(
			context,
			`Schwarzschild Classifier produced ${guidances.length} zone-classification guideline${guidances.length === 1 ? "" : "s"} for coupling-mass analysis. Results are advisory — validate with dependency analysis tooling.`,
			createFocusRecommendations(
				"GR classification guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grSchwarzschildClassifierHandler,
);
