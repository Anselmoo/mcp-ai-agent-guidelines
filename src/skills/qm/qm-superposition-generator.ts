import { z } from "zod";
import { qm_superposition_generator_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
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
import {
	bornRuleProbabilities,
	fmtNum,
	spectralGap,
	spectralGapLabel,
} from "./qm-math-helpers.js";
import {
	hasCandidateSignal,
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
} from "./qm-physics-helpers.js";

// ISOLATION CONTRACT: qm-superposition-generator advises on how to evaluate
// and rank competing candidate implementations using the Born-rule probability
// metaphor (amplitude → probability → selection).
//
// Scope boundaries — do NOT surface guidance belonging to:
//   qm-measurement-collapse — post-selection backaction on adjacent modules
//   strat-prioritization    — business-value-driven prioritisation
//   strat-tradeoff          — architectural trade-off analysis
//
// This handler is advisory only: it explains how to structure multi-candidate
// evaluation, not how to execute probabilistic algorithms programmatically.

const superpositionGeneratorInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			selectionCriteria: z
				.enum(["quality", "latency", "maintainability", "balanced"])
				.optional()
				.describe(
					"Primary selection criterion: quality (output quality score), latency (response time), maintainability (code health), or balanced (weight all equally).",
				),
			candidateCount: z
				.number()
				.int()
				.min(2)
				.max(20)
				.optional()
				.describe(
					"Number of candidate implementations to rank (2–20). If omitted, the handler infers from request context.",
				),
			scores: z
				.array(z.number().nonnegative())
				.min(2)
				.max(10)
				.optional()
				.describe(
					"Numeric evaluation scores for each candidate (non-negative, same unit/scale). Born-rule probabilities are computed from these.",
				),
		})
		.optional(),
});

type SelectionCriteria = "quality" | "latency" | "maintainability" | "balanced";

const SUPERPOSITION_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> =
	[
		{
			pattern: /\b(rank|order|priorit|which.is.best|pick.the.best|top)\b/i,
			detail:
				"Rank candidates by first making all evaluation criteria explicit and weighted before scoring begins. Unweighted ranking conflates criteria of different importance (e.g., correctness is not the same weight as naming convention). Define a weight vector W = [w₁, w₂, …, wₙ] where ∑wᵢ = 1, assign each candidate a normalised score per criterion, then compute amplitude-weighted probability P(i) ∝ |score(i)|² across the weighted sum. This structural step prevents post-hoc rationalisation of an already-preferred candidate.",
		},
		{
			pattern:
				/\b(born.rule|probabilit|amplitude|collapse|quantum|superpos|wavefunction)\b/i,
			detail:
				"The Born-rule framing treats each candidate as a quantum state with amplitude αᵢ proportional to its normalised evaluation score. Probability P(i) = |αᵢ|² after normalisation so ∑P(i) = 1. The 'collapse' to a single winner is the decision point. The spectral gap — the ratio P(winner) / P(runner-up) — measures decision confidence. A gap below 1.5 means the top two candidates are nearly equivalent: the decision should be delegated to non-algorithmic criteria (team familiarity, ecosystem fit, existing dependencies) rather than forced.",
		},
		{
			pattern:
				/\b(candidate|option|approach|variant|alternative|version|impl)\b/i,
			detail:
				"Ensure each candidate is evaluated against the same input conditions and success criteria. Candidates evaluated under different conditions (different data volumes, different prompt lengths, different hardware) produce incomparable amplitudes. Standardise the evaluation environment first — inconsistent conditions are the most common reason ranking outputs are contested after the decision is made.",
		},
		{
			pattern:
				/\b(evaluat|assess|score|grade|benchmark|compare|test.each|run.each)\b/i,
			detail:
				"Design the evaluation protocol before seeing candidate outputs. Pre-commitment to criteria prevents the evaluator from unconsciously adjusting the criteria to match a preferred candidate. Use a scored rubric: for each criterion, define what a score of 0, 0.5, and 1.0 looks like in concrete observable terms. Apply the rubric independently to each candidate, then compute the probability ranking.",
		},
		{
			pattern:
				/\b(uncertain|confiden|tie|close|similar|equivalent|gap|difference)\b/i,
			detail:
				"When candidates score within noise of each other — spectral gap < 1.2 or top-two probability difference < 10 percentage points — treat the selection as a tie and apply secondary decision criteria. Ties are resolved most reliably by: (1) reversibility (prefer the candidate easiest to roll back), (2) team familiarity (prefer the candidate requiring least knowledge transfer), (3) ecosystem fit (prefer the candidate with fewer new dependencies). Document the tie and the tiebreaker in the decision record.",
		},
		{
			pattern:
				/\b(weight|criterion|criteria|factor|dimension|axis|attribute)\b/i,
			detail:
				"Assign criterion weights using stakeholder input before evaluation, not after. Weights derived post-hoc from the scoring outcome encode the evaluator's existing preference rather than the team's shared values. Collect weights via a lightweight structured exercise: ask each stakeholder to distribute 10 points across criteria, average the distributions. Criteria that receive zero weight from all stakeholders should be removed from the evaluation entirely.",
		},
		{
			pattern: /\b(bias|prefer|favour|favor|preselect|anchor|confirm)\b/i,
			detail:
				"Guard against anchoring bias by presenting candidates in randomised order during evaluation. When the same person writes and evaluates candidates, separate the evaluation step by at least 24 hours or assign it to a different reviewer. The Born-rule metaphor is a useful reminder: before 'measurement' (evaluation), all candidates exist in superposition — no candidate should be designated winner before the scoring is complete.",
		},
		{
			pattern:
				/\b(decision|select|chosen|commit|finalize|finalise|adopt|proceed)\b/i,
			detail:
				"Document the selection decision with: (1) the final probability ranking, (2) the spectral gap, (3) any criteria adjusted during evaluation and why, (4) the tiebreaker applied if scores were close, and (5) what conditions would cause you to revisit the selection. This decision record is the primary hedge against future 'why did we choose this?' questions when the implementation proves difficult.",
		},
		{
			pattern: /\b(model|llm|api|provider|vendor|endpoint|service)\b/i,
			detail:
				"When ranking LLM or AI provider candidates, include latency tail (p95, p99) and failure-mode behaviour in addition to output quality. Quality score alone produces brittle rankings: a model with excellent median quality but high variance or hard failure modes may rank below a more consistent but lower-peak model under production load conditions. The Born-rule framing accounts for this: low-variance candidates should receive a variance-stability bonus in their amplitude before squaring.",
		},
	];

const selectionCriteriaLabels: Record<SelectionCriteria, string> = {
	quality: "output quality (correctness, completeness, accuracy)",
	latency: "response latency (p50/p95 response time)",
	maintainability: "code maintainability (complexity, test coverage, coupling)",
	balanced: "balanced (quality + latency + maintainability weighted equally)",
};

const superpositionGeneratorHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(superpositionGeneratorInputSchema, input);
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
				"Superposition Generator needs a description of the candidate implementations, the evaluation criteria, or the decision context. Provide at least: (1) what you are choosing between, and (2) what success looks like.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		if (!hasCandidateSignal(combined) && signals.keywords.length < 4) {
			return buildInsufficientSignalResult(
				context,
				"Superposition Generator needs enough signal to identify that multiple candidate implementations or options are being compared. Describe the candidates and evaluation criteria so ranked guidance can be produced.",
			);
		}

		const inferredScores = parsed.data.options?.scores ?? [];
		let numericDetail: string | undefined;
		if (inferredScores.length >= 2) {
			const probs = bornRuleProbabilities(inferredScores);
			const gap = spectralGap(probs);
			const gapLabel = spectralGapLabel(gap);
			const ranked = inferredScores
				.map((score, index) => ({
					index: index + 1,
					score,
					prob: probs[index] ?? 0,
				}))
				.sort((a, b) => b.prob - a.prob);
			const winner = ranked[0]?.index ?? 1;
			const rankedTable = ranked
				.map(
					({ index, score, prob }) =>
						`Candidate ${index}: score=${fmtNum(score)} → P=${fmtNum(prob * 100)}%`,
				)
				.join("; ");
			numericDetail = `Born-rule probability ranking from provided scores. ${rankedTable}. Winner: Candidate ${winner}. Spectral gap = ${fmtNum(gap)} (${gapLabel}). ${gap < 1.2 ? "Scores are too close to distinguish — apply tiebreaker criteria." : gap > 2 ? "Strong preference signal — proceed with the top candidate." : "Marginal preference — validate with a secondary criterion before committing."} Illustrative computation only; treat as supplementary input alongside qualitative evaluation.`;
		}

		const selectionCriteria =
			parsed.data.options?.selectionCriteria ?? "balanced";
		const candidateCount = parsed.data.options?.candidateCount;

		const candidateLabel = candidateCount
			? `${candidateCount} candidates`
			: "the candidate set";

		const details: string[] = [
			`Rank ${candidateLabel} using the Born-rule evaluation framework under the ${selectionCriteriaLabels[selectionCriteria]} primary criterion. In plain engineering terms the Born rule is this: normalise each candidate's raw score to a 0–1 "amplitude", then square it to get a selection probability — P(i) ∝ score(i)². Squaring deliberately amplifies real differences (a candidate at 0.9 has more than double the probability of one at 0.6) while keeping near-ties stable (0.70 vs 0.72 are still nearly indistinguishable). This makes the ranking sensitive to genuine quality gaps but resistant to noise in close contests. Structure the evaluation as: (1) define and weight criteria before scoring, (2) score each candidate independently per criterion, (3) compute normalised probabilities P(i) ∝ score(i)², (4) compute the spectral gap P(winner)/P(runner-up), (5) apply tiebreaker logic if gap < 1.5. The winner is the candidate with the highest probability, but a narrow gap signals a tie requiring non-algorithmic resolution.`,
		];

		if (numericDetail) {
			details.unshift(numericDetail);
		}

		details.push(...matchAdvisoryRules(SUPERPOSITION_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Start by enumerating exactly which candidates are in scope. Unclear candidate boundaries — 'approach A vs something like approach B' — produce unreliable rankings. Each candidate must be concretely defined: what it does, what it costs, and what its observable outputs are under the agreed evaluation conditions.",
				"Define a minimum-viable evaluation protocol: at least two criteria with explicit weights and at least one concrete test case per criterion. Ranking with a single criterion produces a deterministic ordering indistinguishable from simple sorting — the multi-criteria probability framing only adds value when genuine tradeoffs between criteria exist.",
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Anchor the selection criteria to the stated success definition: "${parsed.data.successCriteria}". Translate this into scoreable, observable criteria before evaluation begins. Each criterion should answer: 'If this candidate achieves [measurable outcome], it scores 1.0 on this criterion.'`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply these constraints as hard filters before probabilistic ranking: ${signals.constraintList.slice(0, 3).join("; ")}. Candidates that fail a hard constraint should be eliminated from the superposition before computing probabilities — they have amplitude 0 regardless of their scores on other criteria.`,
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		// --- Machine-readable artifacts ---
		const artifacts = [
			// Worked example: Born-rule probability calculation
			buildWorkedExampleArtifact(
				"Born-rule Probability Calculation Example",
				{
					scores: [0.8, 0.6, 0.4],
					criteria: ["quality", "latency", "maintainability"],
				},
				{
					probabilities: [
						0.8 ** 2 / (0.8 ** 2 + 0.6 ** 2 + 0.4 ** 2),
						0.6 ** 2 / (0.8 ** 2 + 0.6 ** 2 + 0.4 ** 2),
						0.4 ** 2 / (0.8 ** 2 + 0.6 ** 2 + 0.4 ** 2),
					],
					winner: 1,
					spectralGap: (0.8 ** 2 / 0.6 ** 2).toFixed(2),
				},
				"Worked example: Given candidate scores [0.8, 0.6, 0.4], computes Born-rule probabilities and winner.",
			),
			// Output template: Candidate evaluation rubric
			buildOutputTemplateArtifact(
				"Candidate Evaluation Rubric Template",
				"| Candidate | Quality (0-1) | Latency (0-1) | Maintainability (0-1) | Weighted Score | Probability |\n|-----------|--------------|---------------|----------------------|---------------|-------------|\n|    1      |              |               |                      |               |             |\n|    2      |              |               |                      |               |             |\n|    3      |              |               |                      |               |             |",
				[
					"Candidate",
					"Quality",
					"Latency",
					"Maintainability",
					"Weighted Score",
					"Probability",
				],
				"Template for scoring and ranking candidates using the Born-rule framework.",
			),
			buildComparisonMatrixArtifact(
				"Selection confidence matrix",
				["Spectral gap band", "Interpretation", "Recommended next move"],
				[
					{
						label: "gap < 1.2",
						values: [
							"Near tie",
							"Scores are within evaluation noise",
							"Use rollback cost, team familiarity, or dependency fit as the tiebreaker",
						],
					},
					{
						label: "1.2 ≤ gap ≤ 2",
						values: [
							"Marginal winner",
							"Top candidate is ahead but still contestable",
							"Run one more focused evaluation or sensitivity check",
						],
					},
					{
						label: "gap > 2",
						values: [
							"Strong winner",
							"Ranking shows a meaningful separation",
							"Proceed while documenting the evidence and revisit trigger",
						],
					},
				],
				"Use this matrix to decide when the ranking is decisive versus when it only narrows the field.",
			),
			buildEvalCriteriaArtifact(
				"Candidate ranking review checks",
				[
					"Criteria weights are agreed before scores are assigned.",
					"All candidates are evaluated under the same workload, inputs, and success definition.",
					"Hard constraints remove non-viable candidates before probabilities are computed.",
					"Probability outputs remain advisory and are backed by saved scores or reports rather than claimed live recomputation.",
				],
				"Criteria for deciding whether a Born-rule ranking is trustworthy enough to drive a selection meeting.",
			),
			buildToolChainArtifact(
				"Candidate ranking evidence chain",
				[
					{
						tool: "evaluation rubric or benchmark sheet",
						description:
							"Use a saved scorecard so candidate amplitudes come from explicit evidence, not memory.",
					},
					{
						tool: "benchmark or review notes",
						description:
							"Capture why each score was assigned, especially when the gap is narrow.",
					},
					{
						tool: "decision record",
						description:
							"Record the ranking, spectral gap, chosen tiebreaker, and revisit conditions after the selection is made.",
					},
				],
				"Keep the superposition metaphor anchored to explicit evaluation artifacts.",
			),
		];

		return createCapabilityResult(
			context,
			`Superposition Generator produced ${details.length} evaluation-framework advisory items for ${candidateLabel} (primary criterion: ${selectionCriteriaLabels[selectionCriteria]}).`,
			createFocusRecommendations(
				"Superposition ranking guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	superpositionGeneratorHandler,
);
