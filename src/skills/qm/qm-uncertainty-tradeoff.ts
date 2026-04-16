import { z } from "zod";
import { qm_uncertainty_tradeoff_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	extractNumbers,
	fmtNum,
	uncertaintyLabel,
	uncertaintyProduct,
} from "./qm-math-helpers.js";
import {
	hasCohesionSignal,
	hasCouplingSignal,
	METRIC_PAIR_LABELS,
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
} from "./qm-physics-helpers.js";

// ISOLATION CONTRACT: qm-uncertainty-tradeoff identifies modules where
// coupling and cohesion_deficit are simultaneously high — the Heisenberg
// uncertainty analogue in code metrics.
//
// Scope boundaries — do NOT surface guidance belonging to:
//   qm-heisenberg-picture — time-series drift analysis of metric operators
//   qm-hamiltonian-descent — quality-energy eigenvalue ranking for fix order
//   qual-code-analysis     — general code quality scoring
//
// This handler is advisory only: it highlights tension points and recommends
// actionable remediation directions; it does not compute exact metric values.

const uncertaintyTradeoffInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			metricPair: z
				.enum(["coupling-cohesion", "complexity-coverage", "churn-stability"])
				.optional()
				.describe(
					"The conjugate metric pair to analyse: coupling-cohesion (default), complexity-coverage, or churn-stability.",
				),
			violationThreshold: z
				.enum(["strict", "moderate", "lenient"])
				.optional()
				.describe(
					"Threshold for flagging Pareto violations: strict (flag any module above median on both axes), moderate (flag modules in the top quartile on both), lenient (flag only extreme outliers).",
				),
			coupling: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Coupling metric for one module, normalised 0→1 (0 = no coupling, 1 = maximally coupled).",
				),
			cohesionDeficit: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Cohesion deficit for one module, normalised 0→1 (0 = perfect cohesion, 1 = no cohesion).",
				),
		})
		.optional(),
});

type MetricPair =
	| "coupling-cohesion"
	| "complexity-coverage"
	| "churn-stability";
type ViolationThreshold = "strict" | "moderate" | "lenient";

const UNCERTAINTY_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(coupl|depend|tight|fan.in|fan.out|circular|afferent|efferent)/i,
		detail:
			"High coupling means a module's behaviour depends on the internal details of many other modules. In the Heisenberg analogy, reducing coupling is like pinning 'position' — it tends to force cohesion_deficit upward because the team splits mixed responsibilities into finer-grained modules that then import each other. Measure coupling via afferent count (AC) and efferent count (EC). Target EC < 5 for leaf modules; higher EC is acceptable only for explicit orchestration layers that have no business logic of their own.",
	},
	{
		pattern: /\b(cohes|responsib|srp|single.purpose|god.class|mixed.concern)/i,
		detail:
			"Low cohesion (high cohesion_deficit) means a module does unrelated things. Improving cohesion by extracting sub-concerns tends to increase coupling — the newly split modules must import each other or be wired together by a new orchestrator. Target LCOM (Lack of Cohesion of Methods) below 0.5. When LCOM and EC are both high on the same module, that module is the Pareto violator: it is simultaneously too large and too entangled to refactor safely without coordination.",
	},
	{
		pattern:
			/\b(pareto|violat|both.high|worst|double|simultaneously|tension)\b/i,
		detail:
			"Pareto violations — modules that are bad on both coupling and cohesion axes simultaneously — are the correct starting point for any refactoring programme. They represent the highest uncertainty product: coupling × cohesion_deficit is maximised. Rank modules by this product descending. The top three to five modules on this ranking are the ground state of your technical debt: every day they remain unchanged, the surrounding code adapts to their bad shape, making future refactoring costlier.",
	},
	{
		pattern:
			/\b(remedia|fix|address|improve|refactor|extract|decompose|split)\b/i,
		detail:
			"Remediation for a Pareto-violating module follows a two-step protocol. First, reduce cohesion_deficit (split responsibilities) without touching coupling: identify two or three conceptually distinct clusters of methods and move them to new internal modules. Second, once cohesion is improved, address coupling: replace direct imports with dependency injection or an interface boundary that the orchestrator controls. Attempting to fix both simultaneously in one PR increases risk and makes review harder.",
	},
	{
		pattern: /\b(complex|cyclomatic|cognitive|npath|branch|if.else|switch)\b/i,
		detail:
			"Complexity metrics (cyclomatic, cognitive, NPath) are a third conjugate axis. High complexity co-occurring with high coupling is an amplifier: complex modules that are also tightly coupled propagate defects faster because test coverage is harder to achieve and changes break more callers. When complexity > 15 cyclomatic, treat it as a mandatory prerequisite fix before addressing coupling or cohesion — a complex module cannot be safely split.",
	},
	{
		pattern: /\b(coverage|test|tested|untested|test.gap|missing.test)\b/i,
		detail:
			"Test coverage and coupling form an anti-correlated pair in the complexity-coverage conjugate axis. Modules with high coupling are typically harder to unit-test (they have many dependencies to mock) and therefore accumulate lower coverage. This creates a debt spiral: low coverage makes refactoring unsafe, which means coupling stays high, which keeps coverage low. Break the cycle by writing characterisation tests before any structural change — they pin the current behaviour so coupling-reduction refactors are verifiable.",
	},
	{
		pattern:
			/\b(churn|change.frequent|change.rate|commit.frequen|modified.often)\b/i,
		detail:
			"High churn rate co-occurring with high coupling is the most operationally dangerous pattern. A module changed frequently while being highly coupled propagates instability to its dependents on every change. Flag churn × coupling as a priority signal over any single-metric threshold. Modules with churn above the 75th percentile and coupling above the 75th percentile should trigger mandatory design review before the next change is merged.",
	},
	{
		pattern: /\b(metric|measure|score|quantif|threshold|cutoff|baseline)\b/i,
		detail:
			"Establish a per-codebase baseline before applying fixed thresholds. Coupling and cohesion uncertainty products are relative to the distribution within a given codebase — a module with EC=8 may be a Pareto violator in a microservice codebase but typical in a monolith. Compute the median and 75th percentile of both metrics across the module set before classifying violators. Re-baseline quarterly so the thresholds track architectural drift.",
	},
];

const metricPairLabels: Record<MetricPair, string> = {
	"coupling-cohesion": METRIC_PAIR_LABELS["coupling-cohesion"],
	"complexity-coverage": METRIC_PAIR_LABELS["complexity-coverage"],
	"churn-stability": METRIC_PAIR_LABELS["churn-stability"],
};

const violationThresholdLabels: Record<ViolationThreshold, string> = {
	strict: "strict (flag any module above median on both axes)",
	moderate: "moderate (flag top-quartile violators on both axes)",
	lenient: "lenient (flag extreme outliers only)",
};

function inferMetricPair(combined: string, explicit?: MetricPair): MetricPair {
	if (explicit !== undefined) return explicit;
	if (/\b(complex|cyclomatic|cognitive|npath|coverage|test)\b/i.test(combined))
		return "complexity-coverage";
	if (
		/\b(churn|change.frequent|commit.frequen|modified.often)\b/i.test(combined)
	)
		return "churn-stability";
	return "coupling-cohesion";
}

const uncertaintyTradeoffHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(uncertaintyTradeoffInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);

		// Insufficient-signal guard: need at least a coupling, cohesion, or
		// metrics-related keyword to produce targeted guidance.
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Uncertainty Tradeoff needs a description of the module set, the metric values available (coupling, cohesion_deficit, complexity, coverage, or churn), or a specific tension to analyse. Provide at least one of these before the handler can produce targeted advice.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		// Check that the request has enough metric signal to be productive.
		const hasDomainSignal =
			hasCouplingSignal(combined) ||
			hasCohesionSignal(combined) ||
			/metric|module|class|component|service|package|tension|tradeoff|product|violat|uncertainty|complexity|coverage|churn/i.test(
				combined,
			);

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Uncertainty Tradeoff requires at least one code-metric signal (coupling, cohesion, complexity, coverage, or churn) to apply the Heisenberg metaphor.",
				"Describe the modules or metrics involved — coupling, cohesion, complexity, coverage, or churn — so targeted tension analysis can be produced.",
			);
		}

		const nums = extractNumbers(combined);
		const inferredCoupling =
			parsed.data.options?.coupling ??
			(nums[0] !== undefined && nums[0] >= 0 && nums[0] <= 1
				? nums[0]
				: undefined);
		const inferredCohesionDeficit =
			parsed.data.options?.cohesionDeficit ??
			(nums[1] !== undefined && nums[1] >= 0 && nums[1] <= 1
				? nums[1]
				: undefined);

		let numericDetail: string | undefined;
		if (
			inferredCoupling !== undefined &&
			inferredCohesionDeficit !== undefined
		) {
			const U = uncertaintyProduct(inferredCoupling, inferredCohesionDeficit);
			const label = uncertaintyLabel(U);
			numericDetail = `Illustrative uncertainty product for the described module: U = coupling × cohesionDeficit = ${fmtNum(inferredCoupling)} × ${fmtNum(inferredCohesionDeficit)} = ${fmtNum(U)} (${label}). ${label === "pareto-violator" ? "This module is simultaneously high-coupling and low-cohesion — a Pareto violator. Prioritise it above others." : label === "tension" ? "Moderate uncertainty product — monitor and address before it compounds." : "Acceptable uncertainty product — no immediate action required on this axis."} Treat as a supplementary lens; calibrate thresholds against your codebase distribution before acting.`;
		}

		const metricPair = inferMetricPair(
			combined,
			parsed.data.options?.metricPair,
		);
		const violationThreshold =
			parsed.data.options?.violationThreshold ?? "moderate";

		const details: string[] = [
			`Apply the Heisenberg uncertainty lens to the ${metricPairLabels[metricPair]} conjugate pair using a ${violationThresholdLabels[violationThreshold]} violation threshold. The core principle: just as position and momentum cannot both be precisely minimised simultaneously in quantum mechanics, coupling and cohesion_deficit are in tension — structural improvements to one axis tend to increase pressure on the other. The goal is not to eliminate the tension but to identify modules where BOTH metrics are simultaneously poor (Pareto violations) and prioritise those for focused remediation.`,
		];

		if (numericDetail) {
			details.unshift(numericDetail);
		}

		details.push(...matchAdvisoryRules(UNCERTAINTY_RULES, combined));

		if (details.length === 1) {
			// No specific rules fired — add baseline advisory guidance.
			details.push(
				"Begin by computing the uncertainty product (coupling × cohesion_deficit) for every module in the target set. Rank modules descending by this product. The top 10% are your Pareto violators. Refactoring any other module first is suboptimal: the violators will continue to resist improvement in all adjacent areas until they are addressed.",
				"Distinguish between structurally inherent tension (an orchestration module that must be coupled to many things by design) and accidentally acquired tension (a utility class that accumulated responsibilities over time). Only accidentally acquired tension is actionable — inherent tension should be documented as an architectural constraint, not treated as a defect.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply remediation within these constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints on PR size, freeze windows, or team bandwidth affect which Pareto violators can be addressed in the near term. Capture them in the violation register as feasibility modifiers — they do not change which modules are violators, only the order in which they can be remediated.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided module context to anchor the baseline distribution. Identify any modules in the context that are explicitly called out as problematic — these are candidate Pareto violators and should be scored first before computing the full-set distribution.",
			);
		}

		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleCoupling = parsed.data.options?.coupling ?? 0.72;
		const sampleCohesionDeficit = parsed.data.options?.cohesionDeficit ?? 0.68;
		const sampleU = uncertaintyProduct(sampleCoupling, sampleCohesionDeficit);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Uncertainty tradeoff worked example",
				{
					metricPair,
					coupling: sampleCoupling,
					cohesionDeficit: sampleCohesionDeficit,
					violationThreshold,
				},
				{
					uncertaintyProduct: fmtNum(sampleU),
					classification: uncertaintyLabel(sampleU),
					confidence: "medium",
					recommendedAction:
						"Prioritise the module only if both axes are poor relative to the codebase baseline.",
					engineeringTranslation:
						"Fix the modules that are simultaneously hard to decouple and hard to keep cohesive.",
				},
				"Worked example: turn a pair of normalised metrics into a Pareto-violation decision.",
			),
			buildComparisonMatrixArtifact(
				"Metric pair comparison matrix",
				[
					METRIC_PAIR_LABELS["coupling-cohesion"],
					METRIC_PAIR_LABELS["complexity-coverage"],
					METRIC_PAIR_LABELS["churn-stability"],
				],
				[
					{
						label: "Primary question",
						values: [
							"Are responsibilities too entangled?",
							"Is the code too complex to test safely?",
							"Is the module changing faster than it can stabilise?",
						],
					},
					{
						label: "Best first move",
						values: [
							"Split responsibilities before changing boundaries",
							"Reduce branching complexity before broader refactors",
							"Stabilise hotspots before large redesigns",
						],
					},
					{
						label: "Confidence cue",
						values: [
							"Use the product as a prioritisation hint",
							"Use coverage to confirm safety",
							"Use churn history to confirm urgency",
						],
					},
				],
				"Comparison matrix for choosing the right conjugate pair and the right first remediation move.",
			),
			buildEvalCriteriaArtifact(
				"Pareto violation rubric",
				[
					"Both metrics should be evaluated against the codebase distribution, not a universal cutoff.",
					"The uncertainty product is a prioritisation hint, not a proof of defect severity.",
					"Modules with high coupling and high cohesion deficit deserve the first review slot.",
					"Actionable remediation must be scoped to one axis first to keep review manageable.",
				],
				"Criteria for deciding whether the observed tension is a genuine Pareto violation.",
			),
		];

		return createCapabilityResult(
			context,
			`Uncertainty Tradeoff produced ${details.length} advisory items for the ${metricPairLabels[metricPair]} pair (threshold: ${violationThresholdLabels[violationThreshold]}).`,
			createFocusRecommendations(
				"Uncertainty tradeoff guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	uncertaintyTradeoffHandler,
);
