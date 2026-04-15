/**
 * gr-gravitational-lensing-tracer.ts
 *
 * Handwritten capability handler for the gr-gravitational-lensing-tracer skill.
 *
 * Physics metaphor: massive objects bend light rays around them (gravitational
 * lensing). In code: massive, highly-coupled modules bend all call-graph paths
 * around them. They're load-bearing modules — removing or changing them creates
 * widespread breakage because all paths curve through them.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-event-horizon-detector      — fan-in cascade propagation
 *   gr-schwarzschild-classifier    — coupling zone classification
 *   gr-frame-dragging-detector     — churn-induced neighbor changes
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace call-graph
 * analysis tools (dependency-cruiser, madge, betweenness-centrality metrics).
 */

import { z } from "zod";
import { gr_gravitational_lensing_tracer_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { fmtNum, GR_STATIC_EVIDENCE_NOTE } from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			complexity: z
				.number()
				.nonnegative()
				.optional()
				.describe("Cyclomatic complexity or LOC of the module."),
			afferentCoupling: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Afferent coupling (fan-in): number of modules that depend on this module.",
				),
			betweenness: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Betweenness centrality: fraction of shortest paths through the call graph that pass through this module.",
				),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Lensing power analogue:
 *   L = complexity × afferent_coupling
 *
 * High L indicates a module that is both large and highly depended-upon,
 * making it a gravitational lens in the call graph.
 */
function lensingPower(complexity: number, afferentCoupling: number): number {
	return complexity * afferentCoupling;
}

type LensingClass = "black_hole_lens" | "massive_lens" | "normal";

function classifyLensing(power: number): LensingClass {
	if (power > 500) return "black_hole_lens";
	if (power > 200) return "massive_lens";
	return "normal";
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(lensing|lens|gravitational|bend|curve|deflect|load.?bearing)\b/i,
		guidance:
			"Lensing power L = complexity × afferent_coupling. Modules with L > 500 are BLACK_HOLE_LENS — all call paths curve through them, making them critical single points of failure. Remediation: extract core functionality into multiple smaller modules with clear interfaces, reducing both complexity and afferent coupling.",
	},
	{
		pattern: /\b(betweenness|central|path|shortest|route|bottleneck)\b/i,
		guidance:
			"Betweenness centrality measures the fraction of shortest call-graph paths passing through a module. High betweenness (> 0.3) confirms lensing suspicion — the module is geometrically load-bearing. Compute betweenness using graph analysis tools (NetworkX, igraph) on your dependency graph to identify lens candidates.",
	},
	{
		pattern: /\b(complexity|cyclomatic|lines|loc|size|mass)\b/i,
		guidance:
			"Complexity is the 'mass' component of lensing power. A module with 1000 LOC and 50 dependents has L = 50,000 — an extreme lens. Reduce complexity by extracting pure functions, moving data structures to separate modules, and splitting responsibilities. Target: reduce complexity to < 200 LOC or cyclomatic < 20.",
	},
	{
		pattern: /\b(afferent|fan.?in|depend|consumer|caller|import)\b/i,
		guidance:
			"Afferent coupling (fan-in) is the 'gravitational attraction' component. A module with 100 dependents acts as a lens even if its internal complexity is moderate. Reduce afferent coupling via dependency inversion: introduce an interface, move it to a separate module, and have dependents import the interface instead of the concrete implementation.",
	},
	{
		pattern: /\b(hidden|invisible|implicit|discover|find|detect)\b/i,
		guidance:
			"Hidden lenses are modules with high betweenness but moderate direct coupling — they appear benign in dependency counts but are load-bearing in practice. Detection: run betweenness-centrality analysis on the call graph, then filter for modules with betweenness > 0.2 and L > 200. These are your hidden structural dependencies.",
	},
	{
		pattern: /\b(refactor|extract|split|decouple|isolate|redesign)\b/i,
		guidance:
			"Lens remediation playbook: (1) identify the core responsibility of the lens module (e.g., config, validation, data access), (2) extract that responsibility into a minimal interface, (3) move the interface to a separate module, (4) migrate dependents to the interface, (5) verify lensing power drops below 200 post-refactor.",
	},
	{
		pattern: /\b(risk|failure|single.?point|critical|essential|fragile)\b/i,
		guidance:
			"Lensing modules are single points of failure — a bug or breaking change in a black-hole lens propagates to all dependents. Prioritize lens modules for defensive measures: comprehensive test coverage (> 90%), API stability contracts, and change-review gates. Add them to the architectural risk register.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grGravitationalLensingTracerHandler: SkillHandler = {
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
				"Gravitational Lensing Tracer needs a module description, call-graph metrics, or a load-bearing concern before it can produce lensing analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		const opts = parsed.data.options;

		if (
			opts?.complexity !== undefined &&
			opts?.afferentCoupling !== undefined
		) {
			const complexity = opts.complexity;
			const afferent = opts.afferentCoupling;
			const power = lensingPower(complexity, afferent);
			const cls = classifyLensing(power);

			const clsLabel: Record<typeof cls, string> = {
				black_hole_lens: "BLACK_HOLE_LENS",
				massive_lens: "MASSIVE_LENS",
				normal: "NORMAL",
			};

			guidances.unshift(
				`Advisory computation — complexity=${fmtNum(complexity)}, afferent_coupling=${fmtNum(afferent)}: lensing_power=${fmtNum(power)} (${clsLabel[cls]}). ` +
					"Validate against your call-graph analysis before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Gravitational Lensing Tracer: measure complexity (LOC or cyclomatic) and afferent_coupling (fan-in) per module. Compute lensing_power = complexity × afferent. Modules with L > 500 are critical load-bearing nodes requiring defensive measures.",
				"Optional: compute betweenness centrality on the call graph to identify hidden lenses — modules with high betweenness but moderate direct coupling.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply lensing analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Prioritize lens modules that also violate these constraints.`,
			);
		}

		guidances.push(GR_STATIC_EVIDENCE_NOTE);

		const sampleComplexity = opts?.complexity ?? 32;
		const sampleAfferent = opts?.afferentCoupling ?? 18;
		const samplePower = lensingPower(sampleComplexity, sampleAfferent);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Gravitational lensing worked example",
				{
					complexity: sampleComplexity,
					afferentCoupling: sampleAfferent,
					betweenness: opts?.betweenness ?? 0.34,
				},
				{
					lensingPower: fmtNum(samplePower),
					classification: classifyLensing(samplePower),
					engineeringTranslation:
						"Treat the module as load-bearing and reduce fan-in before attempting broad behavioural changes.",
				},
				"Turns load-bearing suspicion into a concrete hotspot review.",
			),
			buildComparisonMatrixArtifact(
				"Lensing hotspot matrix",
				["Signal", "Interpretation", "Engineering move"],
				[
					{
						label: "High power + high fan-in",
						values: [
							"Obvious structural lens",
							"Many dependents and too much internal mass",
							"Split responsibilities and protect the interface",
						],
					},
					{
						label: "Moderate power + high betweenness",
						values: [
							"Hidden lens",
							"Call paths still curve through the module",
							"Run graph analysis before assuming it is safe to change",
						],
					},
					{
						label: "Low power",
						values: [
							"Normal module",
							"Not a primary structural bottleneck",
							"Handle with ordinary review discipline",
						],
					},
				],
				"Use this matrix to decide when a module needs hotspot treatment.",
			),
			buildToolChainArtifact(
				"Lensing evidence chain",
				[
					{
						tool: "dependency graph or call graph",
						description:
							"Measure fan-in and central paths from an existing graph export rather than claiming live tracing.",
					},
					{
						tool: "betweenness report",
						description:
							"Confirm hidden lenses that simple dependency counts miss.",
					},
					{
						tool: "test coverage report",
						description:
							"Protect load-bearing modules with stronger regression coverage before refactoring them.",
					},
				],
				"Ground the lensing metaphor in concrete graph and coverage evidence.",
			),
		];

		return createCapabilityResult(
			context,
			`Gravitational Lensing Tracer produced ${guidances.length} load-bearing module guideline${guidances.length === 1 ? "" : "s"}. Results are advisory.`,
			createFocusRecommendations(
				"Gravitational lensing guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grGravitationalLensingTracerHandler,
);
