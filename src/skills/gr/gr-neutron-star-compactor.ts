/**
 * gr-neutron-star-compactor.ts
 *
 * Handwritten capability handler for the gr-neutron-star-compactor skill.
 *
 * Physics metaphor: neutron stars form when massive stars collapse beyond
 * electron degeneracy pressure, compressing to extreme density. In code:
 * files approaching their Chandrasekhar limit — maximum information density
 * before collapsing into an unreadable blob. Density = (LOC × complexity) / cohesion.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-spacetime-debt-metric       — full curvature score (coupling×complexity/cohesion)
 *   gr-inflation-detector          — exponential LOC growth
 *   gr-schwarzschild-classifier    — coupling zone classification
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace complexity
 * analysis tools (eslint complexity rules, sonar cognitive complexity).
 */

import { z } from "zod";
import { gr_neutron_star_compactor_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { fmtNum, GR_STATIC_EVIDENCE_NOTE } from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			linesOfCode: z
				.number()
				.nonnegative()
				.optional()
				.describe("Lines of code in the file."),
			cyclomaticComplexity: z
				.number()
				.nonnegative()
				.optional()
				.describe("Cyclomatic complexity (McCabe) of the file."),
			cohesion: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Cohesion score (0–1): higher means functions are more tightly related.",
				),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Information density analogue (Chandrasekhar limit metric):
 *   density = (loc × cyclomatic_complexity) / (cohesion + ε)
 *
 * High density indicates a file approaching collapse — too much information
 * crammed into a single file with low internal cohesion.
 */
function informationDensity(
	loc: number,
	complexity: number,
	cohesion: number,
): number {
	return (loc * complexity) / Math.max(cohesion, 0.01);
}

type DensityClass = "collapsed" | "approaching_limit" | "stable";

function classifyDensity(density: number): DensityClass {
	if (density > 5000) return "collapsed";
	if (density > 2000) return "approaching_limit";
	return "stable";
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(neutron.?star|chandrasekhar|collapse|density|compact|limit)\b/i,
		guidance:
			"Information density = (LOC × cyclomatic_complexity) / (cohesion + ε). Density > 5000 indicates COLLAPSED state — the file is an unreadable blob. Emergency action: split the file into smaller, cohesive modules. Target: reduce density below 2000 by extracting logical groupings into separate files.",
	},
	{
		pattern: /\b(loc|lines|size|length|volume)\b/i,
		guidance:
			"LOC is the mass component of density. Files > 500 LOC are at risk of collapse, especially if cyclomatic complexity is also high. Remediation: extract helper functions, data structures, and type definitions into separate files. Aim for < 300 LOC per file as a safe upper bound.",
	},
	{
		pattern: /\b(complexity|cyclomatic|mccabe|cognitive|branch)\b/i,
		guidance:
			"Cyclomatic complexity is the pressure component. A 200-LOC file with complexity 50 has density = (200 × 50) / cohesion. Even moderate LOC becomes unreadable at high complexity. Reduce complexity by extracting conditional logic into separate functions, applying early returns, and replacing nested if-else with polymorphism or lookup tables.",
	},
	{
		pattern: /\b(cohesion|lcom|related|coupled|single.?responsibility)\b/i,
		guidance:
			"Cohesion is the counterforce preventing collapse. High cohesion (> 0.7) means functions in the file share state or call each other frequently. Low cohesion (< 0.3) amplifies density — the file contains unrelated responsibilities. Improve cohesion by applying SRP: split the file along responsibility boundaries.",
	},
	{
		pattern: /\b(god.?class|god.?file|blob|monster|mega)\b/i,
		guidance:
			"God files / blob anti-pattern: files that do everything. These have extreme density (> 10,000) due to low cohesion and high LOC × complexity. Decomposition strategy: identify distinct responsibilities (e.g., data access, validation, business logic), extract each into a separate file, wire them via dependency injection.",
	},
	{
		pattern: /\b(detect|identify|find|measure|scan|analyze)\b/i,
		guidance:
			"Detection workflow: (1) measure LOC, cyclomatic_complexity, and cohesion per file using static analysis tools (eslint, sonar, radon, lizard), (2) compute density per file, (3) rank files by density descending, (4) flag density > 5000 as COLLAPSED, density > 2000 as APPROACHING_LIMIT. Add flagged files to the refactoring backlog.",
	},
	{
		pattern: /\b(refactor|split|extract|decompose|separate|break)\b/i,
		guidance:
			"Density reduction playbook: (1) identify logical groupings within the file (e.g., related functions, data structures), (2) extract each grouping into a separate file, (3) introduce a facade or barrel export if the original file was a public entry point, (4) re-measure density and verify reduction > 50% before marking complete.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grNeutronStarCompactorHandler: SkillHandler = {
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
				"Neutron Star Compactor needs a file description, density metrics, or a complexity concern before it can produce Chandrasekhar analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		const opts = parsed.data.options;

		if (
			opts?.linesOfCode !== undefined &&
			opts?.cyclomaticComplexity !== undefined &&
			opts?.cohesion !== undefined
		) {
			const loc = opts.linesOfCode;
			const complexity = opts.cyclomaticComplexity;
			const cohesion = opts.cohesion;
			const density = informationDensity(loc, complexity, cohesion);
			const cls = classifyDensity(density);

			const clsLabel: Record<typeof cls, string> = {
				collapsed: "COLLAPSED",
				approaching_limit: "APPROACHING_LIMIT",
				stable: "STABLE",
			};

			guidances.unshift(
				`Advisory computation — loc=${fmtNum(loc)}, cyclomatic_complexity=${fmtNum(complexity)}, cohesion=${fmtNum(cohesion)}: density=${fmtNum(density)} (${clsLabel[cls]}). ` +
					"Validate against your complexity metrics before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Neutron Star Compactor: measure LOC, cyclomatic_complexity, and cohesion per file. Compute density = (LOC × complexity) / (cohesion + ε). Files with density > 5000 are collapsed blobs requiring immediate splitting; density > 2000 should be monitored.",
				"Remediation target: extract logical groupings into separate files, improve cohesion via SRP, and reduce complexity via function extraction. Aim for density < 2000.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply density analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure file-splitting strategies remain compliant.`,
			);
		}

		guidances.push(GR_STATIC_EVIDENCE_NOTE);

		const sampleLoc = opts?.linesOfCode ?? 640;
		const sampleComplexity = opts?.cyclomaticComplexity ?? 18;
		const sampleCohesion = opts?.cohesion ?? 0.32;
		const sampleDensity = informationDensity(
			sampleLoc,
			sampleComplexity,
			sampleCohesion,
		);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Neutron star compaction worked example",
				{
					linesOfCode: sampleLoc,
					cyclomaticComplexity: sampleComplexity,
					cohesion: sampleCohesion,
				},
				{
					informationDensity: fmtNum(sampleDensity),
					classification: classifyDensity(sampleDensity),
					engineeringTranslation:
						"Split the file by responsibility until the density stops behaving like a blob hotspot.",
				},
				"Turns density math into a file-splitting decision.",
			),
			buildComparisonMatrixArtifact(
				"Density reduction matrix",
				["Dominant driver", "What it means", "First move"],
				[
					{
						label: "LOC-heavy",
						values: [
							"The file is simply too large",
							"Readers cannot keep the whole module in working memory",
							"Extract helpers, types, and subdomains into separate files",
						],
					},
					{
						label: "Complexity-heavy",
						values: [
							"Branching pressure dominates",
							"Even moderate-sized files become hard to reason about",
							"Simplify control flow before or during the split",
						],
					},
					{
						label: "Low-cohesion-heavy",
						values: [
							"Responsibilities do not belong together",
							"SRP is the real issue",
							"Split by responsibility boundary first",
						],
					},
				],
				"Use this matrix to choose the right compaction strategy.",
			),
			buildEvalCriteriaArtifact(
				"Compaction checks",
				[
					"Density inputs come from existing static-analysis reports rather than claimed live computation.",
					"Large files are split along responsibility boundaries, not arbitrary line counts alone.",
					"Density falls materially after the change instead of just moving complexity around.",
					"The resulting modules are easier to test and review than the original blob.",
				],
				"Criteria for deciding whether the file is truly near collapse.",
			),
		];

		return createCapabilityResult(
			context,
			`Neutron Star Compactor produced ${guidances.length} information-density guideline${guidances.length === 1 ? "" : "s"}. Results are advisory.`,
			createFocusRecommendations(
				"Neutron star compactor guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grNeutronStarCompactorHandler,
);
