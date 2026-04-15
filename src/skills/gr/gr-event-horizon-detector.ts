/**
 * gr-event-horizon-detector.ts
 *
 * Handwritten capability handler for the gr-event-horizon-detector skill.
 *
 * Physics metaphor: a module crosses its coupling "event horizon" when its
 * dependents count exceeds r_s = 2 × coupling_mass. Beyond that point every
 * change cascades uncontrollably — escape velocity refactoring is required.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-schwarzschild-classifier — zone classification + time dilation
 *   gr-spacetime-debt-metric    — curvature score (K = coupling×complexity/cohesion)
 *   gr-tidal-force-analyzer     — module-split detection from differential coupling
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace impact
 * analysis tools (e.g., dependency-cruiser, git blame --follow, ts-prune).
 */

import { z } from "zod";
import { gr_event_horizon_detector_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildInsufficientSignalResult,
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
import {
	extractNumbers,
	fmtNum,
	schwarzschildRadius,
} from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			afferentCoupling: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Afferent coupling (fan-in): number of modules that depend on this module.",
				),
			efferentCoupling: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Efferent coupling (fan-out): number of modules this module depends on.",
				),
			dependentsCount: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Total number of direct dependents (consumers). Compared against r_s to determine horizon status.",
				),
		})
		.optional(),
});

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(beyond|crossed|past|over|exceed|cascade|uncontrollab|critical)\b/i,
		guidance:
			"Beyond-horizon modules (dependents > r_s = 2 × coupling_mass) have lost containment — changes propagate freely to all dependents. Immediate action: freeze the public API (no new exports), introduce a versioned interface contract, and document all consumer expectations before any change.",
	},
	{
		pattern: /\b(approach|near|warning|threshold|80|eighty|close|heading)\b/i,
		guidance:
			"Approaching-horizon modules (dependents > 0.8 × r_s) are within one or two dependency additions of uncontained cascades. Preventive action: run an impact analysis on all prospective API changes, freeze non-critical public methods, and open a refactoring ticket for the next sprint.",
	},
	{
		pattern: /\b(cascade|propagat|ripple|blast.?radius|change.?risk|impact)\b/i,
		guidance:
			"Cascade risk scales with (dependents / r_s). At ratio 1.0 the blast radius is effectively the entire consumer graph. Quantify blast radius by running a reverse dependency walk (e.g., `dependency-cruiser --reaches <module>`) before any refactor that touches the public surface.",
	},
	{
		pattern: /\b(coupling|depend|import|afferent|efferent|fan.?in|fan.?out)\b/i,
		guidance:
			"Coupling mass = afferent_coupling + efferent_coupling. Schwarzschild radius r_s = 2 × coupling_mass. A module with coupling_mass=10 has r_s=20; if it has 22 dependents it has crossed the event horizon and requires emergency decoupling.",
	},
	{
		pattern:
			/\b(facade|adapter|interface|extract|decouple|isolat|abstraction)\b/i,
		guidance:
			"Horizon retreat strategy: (1) introduce a stable facade or adapter layer that all current consumers use, (2) migrate the facade to its own module so consumer count is attributed to the facade rather than the core module, (3) implement the core changes behind the facade. Each step reduces effective dependents below r_s.",
	},
	{
		pattern: /\b(stab|freeze|lock|pin|version|contract|sla)\b/i,
		guidance:
			"API stability contract: for any beyond-horizon module, publish an explicit public API contract with semantic versioning. Mark all internal helpers with `@internal` or move them to a private sub-module. This prevents new dependents from coupling against unstable internals.",
	},
	{
		pattern: /\b(detect|find|identify|scan|discover|list)\b/i,
		guidance:
			"Detection workflow: (1) enumerate all module pairs (module → consumers) using a dependency graph tool, (2) compute coupling_mass = afferent + efferent per module, (3) compute r_s = 2 × coupling_mass, (4) flag any module where consumer_count > r_s as BEYOND_HORIZON, (5) flag consumer_count > 0.8 × r_s as APPROACHING_HORIZON.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grEventHorizonDetectorHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Event Horizon Detector needs a module description, coupling metrics, or a cascade concern before it can produce horizon-detection guidance.",
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
		const afferent =
			opts?.afferentCoupling ?? (nums.length >= 1 ? nums[0] : undefined);
		const efferent =
			opts?.efferentCoupling ?? (nums.length >= 2 ? nums[1] : undefined);
		const dependents =
			opts?.dependentsCount ?? (nums.length >= 3 ? nums[2] : undefined);

		if (
			afferent !== undefined &&
			efferent !== undefined &&
			dependents !== undefined
		) {
			const couplingMass = afferent + efferent;
			const r_s = schwarzschildRadius(couplingMass);
			const ratio = dependents / Math.max(r_s, 0.001);
			const status =
				ratio > 1
					? "BEYOND_HORIZON"
					: ratio > 0.8
						? "APPROACHING_HORIZON"
						: "STABLE";

			guidances.unshift(
				`Advisory computation — afferent=${fmtNum(afferent)}, efferent=${fmtNum(efferent)}, coupling_mass=${fmtNum(couplingMass)}, r_s=${fmtNum(r_s)}, dependents=${fmtNum(dependents)}: status=${status} (ratio=${fmtNum(ratio)}). ` +
					"Validate against your dependency graph tooling before taking action.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Event Horizon Detector: collect afferent_coupling, efferent_coupling, and dependents_count per module. Compute r_s = 2 × (afferent + efferent). Flag any module where dependents_count > r_s as BEYOND_HORIZON.",
				"Beyond-horizon modules require an API freeze and planned decoupling sprint before any functional change. Even a one-line change to a beyond-horizon module may trigger cross-codebase compilation failures or behavior regressions.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply detection under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Prioritize horizon-crossing modules that violate these constraints first.`,
			);
		}

		return createCapabilityResult(
			context,
			`Event Horizon Detector produced ${guidances.length} horizon-detection guideline${guidances.length === 1 ? "" : "s"} for cascade-risk analysis. Results are advisory — validate with dependency graph tooling.`,
			createFocusRecommendations(
				"Horizon detection guidance",
				guidances,
				context.model.modelClass,
			),
			[
				buildWorkedExampleArtifact(
					"Event horizon detection example",
					{
						afferentCoupling: 8,
						efferentCoupling: 6,
						dependentsCount: 30,
					},
					{
						couplingMass: 14,
						schwarzschildRadius: 28,
						status: "BEYOND_HORIZON",
						plainEnglish:
							"Too many modules depend on this one, so even a small change will ripple outward.",
					},
					"Shows how the horizon metaphor becomes a concrete dependency-risk readout.",
				),
				buildComparisonMatrixArtifact(
					"Event horizon intervention matrix",
					["Signal", "What it means", "Next move"],
					[
						{
							label: "Approaching horizon",
							values: [
								"Dependents are getting close to the limit",
								"Freeze risky surface changes and plan decoupling",
								"Buy time with a facade or adapter",
							],
						},
						{
							label: "Beyond horizon",
							values: [
								"Consumers already outnumber the safe boundary",
								"Stop API churn and protect the contract",
								"Split the refactor into stabilization first, behavior changes second",
							],
						},
						{
							label: "Stable",
							values: [
								"Consumers remain within the safe zone",
								"Keep monitoring rather than forcing a rewrite",
								"Use normal review and test coverage",
							],
						},
					],
					"Use this matrix to translate the physics label into an escalation choice.",
				),
				buildToolChainArtifact(
					"Event horizon detection chain",
					[
						{
							tool: "dependency-cruiser",
							description:
								"Map afferent and efferent coupling so the boundary is measurable.",
						},
						{
							tool: "git diff --stat",
							description:
								"Check whether the current change will push the module into a higher-risk zone.",
						},
						{
							tool: "ts-prune",
							description:
								"Confirm which exports are actually consumed before freezing the API.",
						},
					],
					"Carry this tool chain when you need the metaphor to end in an executable workflow.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grEventHorizonDetectorHandler,
);
