/**
 * gr-equivalence-principle-checker.ts
 *
 * Handwritten capability handler for the gr-equivalence-principle-checker skill.
 *
 * Physics metaphor: the equivalence principle states that inertial mass equals
 * gravitational mass. In code: a module's local interface consistency (inertial)
 * should equal its global architectural consistency (gravitational). Violations
 * indicate modules that are locally coherent but globally alien, or vice versa.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-spacetime-debt-metric      — full curvature score
 *   gr-schwarzschild-classifier   — coupling zone classification
 *   gr-hawking-entropy-auditor    — API surface entropy
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace linting,
 * type-checking, or architectural review.
 */

import { z } from "zod";
import { gr_equivalence_principle_checker_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
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
import { fmtNum } from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			localConsistency: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Local interface consistency score (0–1): measures adherence to module's own internal patterns.",
				),
			globalConsistency: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Global architectural consistency score (0–1): measures adherence to codebase-wide conventions.",
				),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Equivalence ratio: local_consistency / global_consistency.
 *
 * ratio ≈ 1.0 → equivalence holds (module is both locally and globally consistent)
 * ratio > 1.5 → module is locally coherent but globally alien
 * ratio < 0.6 → module follows global patterns but is locally inconsistent
 */
function equivalenceRatio(
	localConsistency: number,
	globalConsistency: number,
): number {
	return localConsistency / Math.max(globalConsistency, 0.01);
}

type EquivalenceClass =
	| "locally_alien"
	| "globally_alien"
	| "equivalent"
	| "weak_local";

function classifyEquivalence(ratio: number): EquivalenceClass {
	if (ratio > 1.5) return "globally_alien";
	if (ratio < 0.6) return "locally_alien";
	if (ratio >= 0.9 && ratio <= 1.1) return "equivalent";
	return "weak_local";
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(equivalence|principle|local|global|inertial|gravitational)\b/i,
		guidance:
			"Equivalence principle: equivalence_ratio = local_consistency / global_consistency. Ratio ≈ 1.0 means the module's internal coherence matches its alignment with codebase conventions. Values outside [0.9, 1.1] indicate architectural friction — the module is either internally inconsistent or globally non-conformant.",
	},
	{
		pattern: /\b(alien|foreign|outsider|mismatch|diverge|drift)\b/i,
		guidance:
			"Globally-alien modules (ratio > 1.5) are internally self-consistent but use patterns that don't match the rest of the codebase (e.g., OOP in a functional codebase, or custom error handling in a Result<T>-based repo). Remediation: refactor the module's public interface to adopt global conventions, or extract it into a separate library if the local pattern is defensible.",
	},
	{
		pattern: /\b(inconsistent|chaotic|messy|mixed|patch|hack)\b/i,
		guidance:
			"Locally-alien modules (ratio < 0.6) follow global conventions at the boundary but are internally inconsistent (e.g., mixed naming schemes, inconsistent error propagation). Remediation: standardize internal patterns to match the module's own dominant style, or refactor into smaller single-pattern modules if the inconsistency reflects multiple responsibilities.",
	},
	{
		pattern: /\b(convention|pattern|standard|idiom|style|guideline)\b/i,
		guidance:
			"Local consistency = adherence to the module's own internal patterns (naming, error handling, state management). Global consistency = adherence to codebase-wide architectural conventions. Measure both independently using linting rules, pattern detection, or manual code review, then compute the equivalence ratio.",
	},
	{
		pattern: /\b(boundary|interface|api|contract|surface|edge)\b/i,
		guidance:
			"Equivalence violations often manifest at module boundaries. A globally-alien module exports an interface that surprises callers (wrong error types, unexpected async behavior). A locally-alien module has a clean interface but chaotic internals. Audit public methods first when diagnosing equivalence failures.",
	},
	{
		pattern: /\b(detect|identify|find|scan|audit|measure)\b/i,
		guidance:
			"Detection workflow: (1) score local_consistency per module using internal pattern adherence metrics (e.g., naming consistency, error-handling uniformity), (2) score global_consistency using codebase-wide linting or architectural fitness functions, (3) compute equivalence_ratio per module, (4) flag ratio > 1.5 as GLOBALLY_ALIEN, ratio < 0.6 as LOCALLY_ALIEN.",
	},
	{
		pattern: /\b(refactor|align|harmonize|normalize|converge|fix)\b/i,
		guidance:
			"Remediation strategy: for GLOBALLY_ALIEN modules, align the interface layer to global conventions while preserving internal logic; for LOCALLY_ALIEN modules, refactor internals to match a single coherent pattern. Verify equivalence_ratio moves into [0.9, 1.1] range post-refactor.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grEquivalencePrincipleCheckerHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Equivalence Principle Checker needs a module description, consistency scores, or an architectural alignment concern before it can produce equivalence analysis.",
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
			opts?.localConsistency !== undefined &&
			opts?.globalConsistency !== undefined
		) {
			const localCons = opts.localConsistency;
			const globalCons = opts.globalConsistency;
			const ratio = equivalenceRatio(localCons, globalCons);
			const cls = classifyEquivalence(ratio);

			const clsLabel: Record<typeof cls, string> = {
				globally_alien: "GLOBALLY_ALIEN",
				locally_alien: "LOCALLY_ALIEN",
				equivalent: "EQUIVALENT",
				weak_local: "WEAK_LOCAL",
			};

			guidances.unshift(
				`Advisory computation — local_consistency=${fmtNum(localCons)}, global_consistency=${fmtNum(globalCons)}: equivalence_ratio=${fmtNum(ratio)} (${clsLabel[cls]}). ` +
					"Validate against your architectural review process before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Equivalence Principle Checker: measure local_consistency (internal pattern adherence) and global_consistency (codebase convention alignment) per module. Compute equivalence_ratio = local / global. Ratios outside [0.9, 1.1] indicate architectural friction.",
				"Remediation target: align globally-alien modules to codebase conventions; refactor locally-alien modules to internal coherence. Aim for equivalence_ratio in [0.9, 1.1].",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply equivalence analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure alignment strategies remain compliant.`,
			);
		}

		return createCapabilityResult(
			context,
			`Equivalence Principle Checker produced ${guidances.length} architectural-alignment guideline${guidances.length === 1 ? "" : "s"}. Results are advisory.`,
			createFocusRecommendations(
				"Equivalence principle guidance",
				guidances,
				context.model.modelClass,
			),
			[
				buildWorkedExampleArtifact(
					"Equivalence principle example",
					{
						localConsistency: 0.9,
						globalConsistency: 0.6,
					},
					{
						ratio: 1.5,
						classification: "globally_alien",
						plainEnglish:
							"The module is internally tidy but still feels out of place everywhere else in the repo.",
					},
					"Shows how local strength can still produce a global mismatch.",
				),
				buildComparisonMatrixArtifact(
					"Equivalence alignment matrix",
					["Condition", "What you see", "Best response"],
					[
						{
							label: "Globally alien",
							values: [
								"Clean internals, surprising boundary behavior",
								"Align the public interface with codebase conventions",
								"Keep the local logic if it is already coherent",
							],
						},
						{
							label: "Locally alien",
							values: [
								"Boundary looks normal, internals are mixed and uneven",
								"Normalize internal patterns or split the module",
								"Reduce internal churn before adding more work",
							],
						},
						{
							label: "Equivalent",
							values: [
								"Local and global patterns agree",
								"Protect the current shape and monitor drift",
								"Prefer small changes that preserve the ratio",
							],
						},
					],
					"Use this matrix when you need the metaphor translated into a practical refactor choice.",
				),
				buildOutputTemplateArtifact(
					"Equivalence audit note",
					`Module:
Local consistency:
Global consistency:
Ratio:
Classification:
Boundary problem:
Recommended adjustment:
Plain-language translation:`,
					[
						"Module",
						"Local consistency",
						"Global consistency",
						"Ratio",
						"Classification",
						"Boundary problem",
						"Recommended adjustment",
						"Plain-language translation",
					],
					"Use this template for review comments that need to read like engineering guidance, not physics jargon.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grEquivalencePrincipleCheckerHandler,
);
