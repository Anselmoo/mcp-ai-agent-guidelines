/**
 * gr-geodesic-refactor.ts
 *
 * Handwritten capability handler for the gr-geodesic-refactor skill.
 *
 * Physics metaphor: a geodesic is the shortest path through curved spacetime.
 * In code: the shortest refactoring path through module-space between current
 * and target architecture, minimizing the total metric distance across
 * architectural states (coupling changes, test breakage, migration cost).
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-schwarzschild-classifier    — coupling zone classification
 *   gr-penrose-diagram-mapper      — causal structure / dependency ordering
 *   gr-spacetime-debt-metric       — curvature score
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace refactoring
 * planning tools (dependency graphs, impact analysis).
 */

import { z } from "zod";
import { gr_geodesic_refactor_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
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
import { fmtNum } from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			currentCoupling: z
				.number()
				.nonnegative()
				.optional()
				.describe("Current architectural coupling score."),
			targetCoupling: z
				.number()
				.nonnegative()
				.optional()
				.describe("Target architectural coupling score."),
			waypointCount: z
				.number()
				.int()
				.positive()
				.optional()
				.describe("Number of intermediate refactoring steps."),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Geodesic distance estimate (simplified metric):
 *   d = √(Δcoupling² + Δcomplexity² + migration_cost²)
 *
 * This is a simplified line element. A full implementation would use a
 * metric tensor over architectural embedding vectors.
 */
function geodesicDistance(
	deltaCoupling: number,
	deltaComplexity: number,
	migrationCost: number,
): number {
	return Math.sqrt(
		deltaCoupling ** 2 + deltaComplexity ** 2 + migrationCost ** 2,
	);
}

/**
 * Estimate optimal waypoint spacing for minimal total path length.
 * Assumes intermediate steps should be roughly equal in metric distance.
 */
function optimalWaypointSpacing(
	totalDistance: number,
	waypoints: number,
): number {
	return totalDistance / Math.max(waypoints, 1);
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(geodesic|shortest|path|route|trajectory|refactor)\b/i,
		guidance:
			"Geodesic refactoring finds the shortest path through module-space from current to target architecture. The metric distance incorporates coupling changes, complexity changes, and migration cost. Break the refactor into waypoints (intermediate stable states) to minimize total distance and reduce risk of mid-refactor failures.",
	},
	{
		pattern: /\b(waypoint|intermediate|step|stage|milestone|checkpoint)\b/i,
		guidance:
			"Waypoints are intermediate architectural states where the codebase is stable (tests pass, deploys succeed). Optimal waypoint spacing minimizes total path length. For a refactor with metric distance d, use n = ⌈d / 10⌉ waypoints, spacing them roughly d/n apart. Each waypoint should represent a shippable increment.",
	},
	{
		pattern: /\b(metric|distance|tensor|embedding|space|dimension)\b/i,
		guidance:
			"The architectural metric tensor defines how distance is measured. Common components: Δcoupling (dependency change count), Δcomplexity (cyclomatic complexity delta), migration_cost (manual refactor effort, test updates). Adjust tensor weights based on your team's priorities — e.g., weight migration_cost higher if developer time is constrained.",
	},
	{
		pattern: /\b(coupling|depend|import|afferent|efferent)\b/i,
		guidance:
			"Coupling change Δcoupling is the primary component of refactoring distance. Moving from coupling=50 to coupling=10 has Δcoupling=40. High Δcoupling suggests the refactor will touch many modules. Use incremental decoupling (introduce interfaces, then migrate consumers) to reduce step-wise coupling deltas at each waypoint.",
	},
	{
		pattern: /\b(complexity|cyclomatic|mccabe|cognitive|lines)\b/i,
		guidance:
			"Complexity change Δcomplexity contributes to refactoring distance. Simplifying a module (reducing cyclomatic complexity from 30 to 10) has positive value but requires careful validation. Complexity spikes during intermediate waypoints are acceptable if they're transient; ensure the final waypoint returns complexity to target or below.",
	},
	{
		pattern: /\b(migration|cost|effort|manual|risk|breakage)\b/i,
		guidance:
			"Migration cost includes manual refactor effort, test updates, and deployment risk. Estimate cost per waypoint using story points or ideal-days. High-cost waypoints should be split into smaller sub-waypoints. Use automated refactoring tools (IDE refactorings, codemods) to reduce migration_cost and shorten the geodesic.",
	},
	{
		pattern: /\b(strategy|plan|order|sequence|priorit|roadmap)\b/i,
		guidance:
			"Geodesic refactor strategy: (1) define current state (coupling, complexity, test coverage), (2) define target state, (3) compute metric distance, (4) generate waypoints with optimal spacing, (5) validate each waypoint is shippable, (6) execute waypoints sequentially, verifying tests + deployment at each step.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grGeodesicRefactorHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Geodesic Refactor needs a refactoring scenario, architectural metrics, or a path-planning concern before it can produce geodesic guidance.",
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
			opts?.currentCoupling !== undefined &&
			opts?.targetCoupling !== undefined
		) {
			const currentCoupling = opts.currentCoupling;
			const targetCoupling = opts.targetCoupling;
			const deltaCoupling = Math.abs(targetCoupling - currentCoupling);
			// Simplified: assume complexity and migration cost scale with coupling change
			const deltaComplexity = deltaCoupling * 0.5;
			const migrationCost = deltaCoupling * 2;
			const distance = geodesicDistance(
				deltaCoupling,
				deltaComplexity,
				migrationCost,
			);

			const waypoints = opts.waypointCount ?? Math.ceil(distance / 10);
			const spacing = optimalWaypointSpacing(distance, waypoints);

			guidances.unshift(
				`Advisory computation — current_coupling=${fmtNum(currentCoupling)}, target_coupling=${fmtNum(targetCoupling)}: geodesic_distance≈${fmtNum(distance)}, recommended_waypoints=${waypoints}, spacing≈${fmtNum(spacing)} per step. ` +
					"Validate against your refactoring complexity before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Geodesic Refactor planner: define current and target architectural states (coupling, complexity, test coverage). Compute metric distance d = √(Δcoupling² + Δcomplexity² + migration_cost²). Generate waypoints spaced d/n apart for n intermediate steps.",
				"Refactoring strategy: execute one waypoint at a time, verifying tests and deployability at each step. Adjust waypoint definitions if intermediate states prove unstable.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply geodesic planning under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure waypoint definitions remain compliant.`,
			);
		}

		return createCapabilityResult(
			context,
			`Geodesic Refactor produced ${guidances.length} path-planning guideline${guidances.length === 1 ? "" : "s"} for architectural refactoring. Results are advisory.`,
			createFocusRecommendations(
				"Geodesic refactor guidance",
				guidances,
				context.model.modelClass,
			),
			[
				buildWorkedExampleArtifact(
					"Geodesic refactor example",
					{
						currentCoupling: 48,
						targetCoupling: 16,
						waypointCount: 4,
					},
					{
						metricDistance: 80.4,
						recommendedSpacing: 20.1,
						plainEnglish:
							"Break the big refactor into four shippable steps instead of trying to land it all at once.",
					},
					"Turns the shortest-path metaphor into a staged refactor plan.",
				),
				buildOutputTemplateArtifact(
					"Geodesic refactor plan",
					`Current state:
Target state:
Distance drivers:
Waypoint 1:
Waypoint 2:
Waypoint 3:
Waypoint 4:
Risk checks:
Plain-language translation:`,
					[
						"Current state",
						"Target state",
						"Distance drivers",
						"Waypoint 1",
						"Waypoint 2",
						"Waypoint 3",
						"Waypoint 4",
						"Risk checks",
						"Plain-language translation",
					],
					"Use this template when you want the output to read like an actionable migration plan.",
				),
				buildEvalCriteriaArtifact(
					"Geodesic refactor checks",
					[
						"Each waypoint leaves the codebase shippable and testable.",
						"Coupling, complexity, and migration cost are all considered, not just one dimension.",
						"Intermediate steps are small enough to review without blocking the team.",
						"The final waypoint clearly reaches the target state.",
					],
					"Use these criteria to judge whether the proposed path is actually the shortest safe path.",
				),
				buildToolChainArtifact(
					"Refactor planning chain",
					[
						{
							tool: "dependency graph",
							description:
								"Measure the current and target architectural positions before planning the route.",
						},
						{
							tool: "test suite",
							description:
								"Validate each waypoint is still shippable and does not regress behavior.",
						},
						{
							tool: "codemod or IDE refactor",
							description:
								"Reduce the migration cost by automating repetitive edits.",
						},
					],
					"Use this chain when the shortest path needs to be grounded in concrete tooling.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grGeodesicRefactorHandler,
);
