import { z } from "zod";
import { qm_tunneling_breakthrough_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { fmtNum, wkbTunneling, wkbViabilityLabel } from "./qm-math-helpers.js";
import {
	hasRefactoringSignal,
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
	REFACTORING_RISK_LABELS,
} from "./qm-physics-helpers.js";

// ISOLATION CONTRACT: qm-tunneling-breakthrough advises on whether a
// refactoring migration is viable now (high tunnelling probability) or
// should be deferred until the barrier is reduced (low probability).
//
// Scope boundaries — do NOT surface guidance belonging to:
//   strat-tradeoff          — general architectural trade-off analysis
//   strat-prioritization    — business-value-driven backlog prioritisation
//   lead-transformation-roadmap — phased adoption roadmap planning
//
// This handler is advisory only: it applies a WKB-tunnelling analogy
// to assess refactoring feasibility, not to compute actual probabilities.
// It does NOT advise on new feature work where there is no existing barrier.

const tunnelingCandidateSchema = z
	.object({
		name: z.string().min(1),
		barrierWidth: z.number().min(0).max(1).optional(),
		barrierHeight: z.number().min(0).max(1).optional(),
		teamEnergyLevel: z.number().min(0).max(1).optional(),
		barrier_width: z.number().min(0).max(1).optional(),
		barrier_height: z.number().min(0).max(1).optional(),
		energy: z.number().min(0).max(1).optional(),
	})
	.superRefine((candidate, refinementContext) => {
		if (
			candidate.barrierWidth === undefined &&
			candidate.barrier_width === undefined
		) {
			refinementContext.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					"Each tunneling candidate needs barrierWidth (or reference-style barrier_width).",
				path: ["barrierWidth"],
			});
		}
		if (
			candidate.barrierHeight === undefined &&
			candidate.barrier_height === undefined
		) {
			refinementContext.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					"Each tunneling candidate needs barrierHeight (or reference-style barrier_height).",
				path: ["barrierHeight"],
			});
		}
		if (
			candidate.teamEnergyLevel === undefined &&
			candidate.energy === undefined
		) {
			refinementContext.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					"Each tunneling candidate needs teamEnergyLevel (or reference-style energy).",
				path: ["teamEnergyLevel"],
			});
		}
	});

const tunnelingBreakthroughInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			barrierRisk: z
				.enum(["low", "medium", "high"])
				.optional()
				.describe(
					"Estimated barrier risk (height + width combined): low (narrow scope, familiar code, good tests), medium (moderate scope, partial tests, some coupling), or high (broad scope, low tests, high coupling, unfamiliar code).",
				),
			teamEnergy: z
				.enum(["low", "medium", "high"])
				.optional()
				.describe(
					"Team's current available energy for the refactoring: low (frozen window, minimal bandwidth), medium (normal sprint with some slack), high (dedicated refactoring sprint or hackathon).",
				),
			barrierWidth: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Normalised barrier width (0→1): fraction of codebase that must change. 0.1 = narrow (few files), 0.9 = broad (most of the system).",
				),
			barrierHeight: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Normalised barrier height (0→1): combined coupling + coverage-gap risk. 0.2 = low risk, 0.8 = high risk.",
				),
			teamEnergyLevel: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Normalised team energy (0→1): available capacity fraction. 0.2 = minimal bandwidth, 0.8 = dedicated sprint.",
				),
			candidates: z
				.array(tunnelingCandidateSchema)
				.min(2)
				.max(10)
				.optional()
				.describe(
					"Structured refactoring candidates to rank by WKB tunnelling probability. Supports both camelCase and reference-style snake_case field names.",
				),
		})
		.optional(),
});

type BarrierRisk = "low" | "medium" | "high";
type TeamEnergy = "low" | "medium" | "high";
type TunnelingViabilityTier =
	| "LOW_BARRIER"
	| "MODERATE_BARRIER"
	| "HIGH_BARRIER"
	| "IMPENETRABLE";
type TunnelingCandidateInput = z.infer<typeof tunnelingCandidateSchema>;

interface RankedTunnelingCandidate {
	name: string;
	barrierWidth: number;
	barrierHeight: number;
	energy: number;
	barrierExcess: number;
	tunnelingProbability: number;
	viability: TunnelingViabilityTier;
	action: string;
}

const TUNNELING_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(refactor|restructur|extract|decompose|modulariz|reorganiz|overhaul)\b/i,
		detail:
			"Assess the refactoring scope before committing: identify every file, module, and interface that must change for the refactoring to be complete. A scope that appears narrow at the entry point often expands significantly once circular dependencies and callers are traced. The barrier width in the WKB analogy is the total scope of necessary changes — not just the primary refactoring target. Underestimating width is the most common cause of stalled refactoring migrations.",
	},
	{
		pattern:
			/\b(legacy|technical.debt|old.code|outdated|deprecated|stale|obsolete)\b/i,
		detail:
			"Legacy code migrations carry a compound barrier: the code is typically unfamiliar to the current team, has low test coverage, and has accumulated implicit contracts that are not documented anywhere. Before estimating tunnel probability, audit: (1) test coverage of the target code (aim for at least 60% before beginning), (2) how many callers exist outside the immediate module, (3) whether any callers are external consumers (APIs, SDKs, published libraries) that cannot be changed in the same PR. Each of these factors adds to the effective barrier height.",
	},
	{
		pattern: /\b(migrat|port|upgrade|rewrite|replace|swap.out|switch.from)\b/i,
		detail:
			"Migration refactorings (replacing one implementation with another) benefit from the strangler fig pattern: introduce the new implementation alongside the old one, redirect callers incrementally, and remove the old implementation only when all callers have been migrated. This reduces the effective barrier height to the migration cost of a single caller at a time rather than all callers simultaneously. The WKB analogy: the particle tunnels through a narrow barrier slice rather than the full barrier width.",
	},
	{
		pattern:
			/\b(test|coverage|coverage.gap|untested|characterisation|safety.net)\b/i,
		detail:
			"Test coverage is the primary energy source in the tunnelling analogy. Low coverage means the team has low energy relative to the barrier — the refactoring is unlikely to succeed without first increasing coverage. The minimum viable coverage for a safe refactoring is: (1) all public API entry points have at least one test, (2) all critical business paths have an integration test, (3) any state machine or conditional branch relevant to the change has a test for each major branch. Write characterisation tests before beginning — they pin existing behaviour and catch regressions introduced by the refactoring.",
	},
	{
		pattern:
			/\b(barrier|obstacle|block|friction|resist|impediment|challenge|difficult)\b/i,
		detail:
			"Reduce the barrier before attempting to tunnel through it. Barrier-reduction techniques applicable before the main refactoring: (1) add missing tests to raise the coverage floor, (2) decouple direct dependencies by introducing interfaces or dependency injection, (3) extract configuration or constants that are scattered through the target code into a single well-named location, (4) resolve any pending merge conflicts or feature branches that overlap with the refactoring target. Each reduction step lowers the effective barrier height and increases tunnelling probability.",
	},
	{
		pattern:
			/\b(energy|capacity|bandwidth|sprint|team|resource|time.box|deadline)\b/i,
		detail:
			"Match the refactoring scope to the team's available energy. A high-barrier refactoring attempted in a sprint with competing delivery commitments will stall midway — a half-completed refactoring often leaves the codebase in a worse state than before it started (the old and new patterns coexist, creating confusion). Reserve dedicated capacity for high-barrier migrations: a short hack day for narrow refactors, a full sprint for broad ones. If reserved capacity is not available, defer and reduce the barrier instead.",
	},
	{
		pattern:
			/\b(wkb|tunnel|probability|viab|attempt.now|defer|wait|later|when)\b/i,
		detail:
			"The WKB tunnelling probability T = exp(−2 × width × max(0, height − energy)) gives the decision signal. When T > 0.5 (width is narrow, height is low, or team energy is high), attempt the refactoring now. When T is between 0.1 and 0.5, attempt with a reduced scope or a strangler fig approach. When T < 0.1, defer: the refactoring will stall before completion. Use this as a heuristic framing, not an exact computation — the value of the analogy is forcing explicit estimation of width, height, and energy before committing.",
	},
	{
		pattern:
			/\b(coupling|depend|entangled|circular|tight|fan.out|import.chain)\b/i,
		detail:
			"High coupling is the primary barrier-height contributor in code refactoring. Modules with high afferent coupling (many callers) require coordinating changes across all callers — the barrier height scales with the maximum coupling rather than the average. For refactoring migrations, compute the maximum afferent coupling of any public symbol in the target: this is the effective barrier height. If max afferent coupling > 10 modules, the barrier is high regardless of the module's internal complexity.",
	},
	{
		pattern:
			/\b(freeze|lock|feature.freeze|code.freeze|release|deploy|ship)\b/i,
		detail:
			"Code freeze windows, release branches, and impending deployments are effective energy reducers — they constrain what can be merged and shorten the available tunnel window. Do not start a broad refactoring within two weeks of a release freeze. The partial-refactoring risk is acute: a refactoring that is 70% complete when the freeze starts must either be rushed to completion (increasing defect risk) or reverted (wasting the completed work). Plan refactoring timing relative to the release calendar.",
	},
];

const barrierRiskLabels: Record<BarrierRisk, string> = {
	low: REFACTORING_RISK_LABELS.low,
	medium: REFACTORING_RISK_LABELS.medium,
	high: REFACTORING_RISK_LABELS.high,
};

const teamEnergyLabels: Record<TeamEnergy, string> = {
	low: "low team energy (minimal bandwidth, freeze window, or competing commitments)",
	medium: "medium team energy (normal sprint with some slack)",
	high: "high team energy (dedicated refactoring sprint, hackathon, or reduced delivery load)",
};

const clampScalar = (value: number) => Math.min(0.99, Math.max(0.01, value));

function tunnelingViabilityTier(T: number): TunnelingViabilityTier {
	if (T > 0.5) return "LOW_BARRIER";
	if (T > 0.1) return "MODERATE_BARRIER";
	if (T > 0.01) return "HIGH_BARRIER";
	return "IMPENETRABLE";
}

function tunnelingAction(viability: TunnelingViabilityTier): string {
	switch (viability) {
		case "LOW_BARRIER":
			return "Attempt immediately — energy exceeds or nearly matches the barrier.";
		case "MODERATE_BARRIER":
			return "Plan carefully and proceed with adequate safeguards and capacity.";
		case "HIGH_BARRIER":
			return "Reduce barrier width first by breaking the refactoring into smaller steps.";
		case "IMPENETRABLE":
			return "Defer until team energy increases or the barrier is reduced significantly.";
	}
}

function normalizeCandidate(candidate: TunnelingCandidateInput) {
	return {
		name: candidate.name,
		barrierWidth: candidate.barrierWidth ?? candidate.barrier_width ?? 0,
		barrierHeight: candidate.barrierHeight ?? candidate.barrier_height ?? 0,
		energy: candidate.teamEnergyLevel ?? candidate.energy ?? 0,
	};
}

function rankTunnelingCandidates(
	candidates: readonly TunnelingCandidateInput[],
): RankedTunnelingCandidate[] {
	return candidates
		.map(normalizeCandidate)
		.map((candidate) => {
			const barrierWidth = clampScalar(candidate.barrierWidth);
			const barrierHeight = clampScalar(candidate.barrierHeight);
			const energy = clampScalar(candidate.energy);
			const barrierExcess = Math.max(0, barrierHeight - energy);
			const tunnelingProbability = wkbTunneling(
				barrierWidth,
				barrierHeight,
				energy,
			);
			const viability = tunnelingViabilityTier(tunnelingProbability);
			return {
				...candidate,
				barrierWidth,
				barrierHeight,
				energy,
				barrierExcess,
				tunnelingProbability,
				viability,
				action: tunnelingAction(viability),
			};
		})
		.sort((left, right) => {
			if (right.tunnelingProbability !== left.tunnelingProbability) {
				return right.tunnelingProbability - left.tunnelingProbability;
			}
			return left.barrierExcess - right.barrierExcess;
		});
}

const tunnelingBreakthroughHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(tunnelingBreakthroughInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		const rankedCandidates = parsed.data.options?.candidates
			? rankTunnelingCandidates(parsed.data.options.candidates)
			: [];

		if (
			signals.keywords.length === 0 &&
			!signals.hasContext &&
			rankedCandidates.length === 0
		) {
			return buildInsufficientSignalResult(
				context,
				"Tunneling Breakthrough needs a description of the refactoring or migration being considered. Provide at least: (1) what is being refactored, (2) its scope or complexity, and (3) the team's current capacity. This skill does not apply to new feature work where there is no existing barrier.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		if (
			!hasRefactoringSignal(combined) &&
			signals.keywords.length < 4 &&
			rankedCandidates.length === 0
		) {
			return buildInsufficientSignalResult(
				context,
				"Tunneling Breakthrough requires signal about a refactoring, migration, or technical-debt resolution effort — describe what is being changed and why it has a barrier (existing complexity, coupling, or coverage gap) so tunnelling viability can be assessed.",
			);
		}

		const barrierRisk = parsed.data.options?.barrierRisk ?? "medium";
		const teamEnergy = parsed.data.options?.teamEnergy ?? "medium";
		const riskDefaults = { low: 0.2, medium: 0.5, high: 0.8 } as const;
		const inferredWidth = parsed.data.options?.barrierWidth;
		const inferredHeight =
			parsed.data.options?.barrierHeight ?? riskDefaults[barrierRisk];
		const inferredEnergy =
			parsed.data.options?.teamEnergyLevel ?? riskDefaults[teamEnergy];
		let numericDetail: string | undefined;
		if (rankedCandidates.length >= 2) {
			const rankedTable = rankedCandidates
				.map(
					(candidate, index) =>
						`${index + 1}. ${candidate.name}: T=${fmtNum(candidate.tunnelingProbability)}, barrier_excess=${fmtNum(candidate.barrierExcess)}, viability=${candidate.viability}, action=${candidate.action}`,
				)
				.join("; ");
			const winner = rankedCandidates[0];
			numericDetail = `WKB candidate ranking from provided refactorings (sorted by descending tunnelling probability). ${rankedTable}. Most viable now: ${winner?.name} (${winner?.viability}, T=${fmtNum(winner?.tunnelingProbability ?? 0)}). This ranking is advisory and only as good as the explicit width/height/energy estimates supplied for each candidate.`;
		} else if (
			inferredWidth !== undefined &&
			inferredHeight !== undefined &&
			inferredEnergy !== undefined
		) {
			const W = clampScalar(inferredWidth);
			const H = clampScalar(inferredHeight);
			const E = clampScalar(inferredEnergy);
			const T = wkbTunneling(W, H, E);
			const label = wkbViabilityLabel(T);
			numericDetail = `WKB tunnelling estimate: T = exp(−2 × ${fmtNum(W)} × max(0, ${fmtNum(H)} − ${fmtNum(E)})) = ${fmtNum(T)}. Advisory signal: ${label}. ${T > 0.5 ? "High tunnelling probability — begin now with standard safeguards." : T > 0.1 ? "Moderate probability — use strangler fig or reduced scope." : "Low probability — reduce barrier before attempting."} Treat as a heuristic framing tool; actual viability depends on factors beyond these three scalars.`;
		}

		// Derive a simple viability signal from the options combination.
		const viabilitySignal =
			barrierRisk === "low" || teamEnergy === "high"
				? "favourable — attempt with standard safeguards"
				: barrierRisk === "high" && teamEnergy === "low"
					? "unfavourable — defer and reduce barrier first"
					: "marginal — attempt with reduced scope or strangler fig approach";

		const details: string[] = [
			rankedCandidates.length >= 2
				? `Apply WKB tunnelling viability assessment across ${rankedCandidates.length} refactoring candidates. Compare each candidate on the same normalised 0→1 scale for barrier width, barrier height, and team energy; compute T = exp(−2 × width × max(0, height − energy)); then sort descending by T so the most viable migration appears first. The ranking is only valid if the candidates were estimated consistently — mixing different scales or estimation standards destroys comparability.`
				: `Apply WKB tunnelling viability assessment to the refactoring: barrier risk is ${barrierRiskLabels[barrierRisk]}, team energy is ${teamEnergyLabels[teamEnergy]}. Tunnelling viability: ${viabilitySignal}. The WKB framing maps barrier width (scope/complexity), barrier height (coupling/coverage risk), and team energy onto a go/defer/reduce signal — it does not produce a precise probability. Use it as a structured forcing function for explicit scope and risk estimation before committing.`,
		];

		if (numericDetail) {
			details.unshift(numericDetail);
		}

		details.push(...matchAdvisoryRules(TUNNELING_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Estimate the three WKB parameters explicitly before deciding: (1) barrier width — how many files, modules, or callers must change for the refactoring to be complete; (2) barrier height — what is the coupling level and coverage gap of the target code; (3) team energy — how much uninterrupted capacity is available in the current planning window. A refactoring that cannot be characterised on all three parameters is not ready to begin.",
				"Define a clear completion criterion before starting. A refactoring without a completion criterion tends to expand (scope creep) or never formally close (abandoned mid-way). The completion criterion should be observable: 'all callers of OldClass have been migrated to NewClass and OldClass has been deleted' is a valid criterion; 'the code is cleaner' is not.",
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Use the stated success criteria to define the refactoring's completion boundary: "${parsed.data.successCriteria}". Translate this into a concrete done condition: which files are deleted, which interfaces are introduced, which metrics improve by how much. Ambiguous success criteria are the second most common cause of stalled refactorings (after underestimated scope).`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints as barrier modifiers: ${signals.constraintList.slice(0, 3).join("; ")}. Time constraints reduce effective team energy; scope constraints reduce barrier width; dependency or approval constraints increase effective barrier height. Adjust the viability signal accordingly: a refactoring that appears marginal without constraints may become unfavourable when constraints are factored in.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided context to ground the barrier estimation. Look for: (1) mentions of specific files or modules (add to width estimate), (2) mentions of coupling or dependency concerns (add to height estimate), (3) mentions of team bandwidth or timeline (inform energy estimate). Context-grounded estimates are more reliable than abstract assessments.",
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		const exampleCandidates = rankedCandidates.slice(0, 3);
		const exampleWidth = inferredWidth ?? 0.45;
		const exampleHeight = inferredHeight ?? riskDefaults[barrierRisk];
		const exampleEnergy = inferredEnergy ?? riskDefaults[teamEnergy];
		const exampleProbability = wkbTunneling(
			clampScalar(exampleWidth),
			clampScalar(exampleHeight),
			clampScalar(exampleEnergy),
		);
		const comparisonRows =
			rankedCandidates.length >= 2
				? rankedCandidates.map((candidate) => ({
						label: candidate.name,
						values: [
							fmtNum(candidate.barrierWidth),
							fmtNum(candidate.barrierHeight),
							fmtNum(candidate.energy),
							fmtNum(candidate.barrierExcess),
							fmtNum(candidate.tunnelingProbability),
							candidate.viability,
							candidate.action,
						],
					}))
				: [
						{
							label: "T < 0.1",
							values: [
								"Barrier dominates team energy",
								"Likely to stall mid-migration",
								"Defer and lower the barrier with tests, seams, or narrower scope",
							],
						},
						{
							label: "0.1 ≤ T ≤ 0.5",
							values: [
								"Marginal viability",
								"Possible, but only with tighter scope control",
								"Use a strangler path, phased cutover, or caller-by-caller migration",
							],
						},
						{
							label: "T > 0.5",
							values: [
								"Favourable viability",
								"Team energy is high enough for the current barrier",
								"Attempt now with ordinary regression gates and rollback planning",
							],
						},
					];
		const artifacts = [
			buildWorkedExampleArtifact(
				"Tunneling viability worked example",
				rankedCandidates.length >= 2
					? {
							candidates: exampleCandidates.map((candidate) => ({
								name: candidate.name,
								barrierWidth: candidate.barrierWidth,
								barrierHeight: candidate.barrierHeight,
								teamEnergyLevel: candidate.energy,
							})),
						}
					: {
							barrierRisk,
							teamEnergy,
							barrierWidth: fmtNum(exampleWidth),
							barrierHeight: fmtNum(exampleHeight),
							teamEnergyLevel: fmtNum(exampleEnergy),
						},
				rankedCandidates.length >= 2
					? {
							rankedResults: exampleCandidates.map((candidate) => ({
								name: candidate.name,
								tunnelingProbability: fmtNum(candidate.tunnelingProbability),
								barrierExcess: fmtNum(candidate.barrierExcess),
								viability: candidate.viability,
								action: candidate.action,
							})),
						}
					: {
							tunnelingProbability: fmtNum(exampleProbability),
							viabilityLabel: wkbViabilityLabel(exampleProbability),
							engineeringTranslation:
								exampleProbability > 0.5
									? "The refactoring is viable now if you keep ordinary safety checks in place."
									: exampleProbability > 0.1
										? "Split the migration into thinner slices or introduce a strangler seam before committing to the whole move."
										: "Lower the barrier first with tests, dependency seams, or narrower scope before attempting the migration.",
						},
				rankedCandidates.length >= 2
					? "Worked example showing how multiple refactoring candidates are ranked by explicit width, height, and energy estimates."
					: "Worked example showing how width, height, and team energy become a go/defer signal for a refactoring migration.",
			),
			buildOutputTemplateArtifact(
				rankedCandidates.length >= 2
					? "Refactoring tunnelling rank template"
					: "Tunneling barrier estimation template",
				rankedCandidates.length >= 2
					? "| Refactoring | barrierWidth (0-1) | barrierHeight (0-1) | teamEnergyLevel (0-1) | barrierExcess | T | Viability | Action |\n|-------------|---------------------|----------------------|------------------------|--------------|---|-----------|--------|\n|             |                     |                      |                        |              |   |           |        |"
					: "Refactoring target: <module or migration>\nBarrier width (0-1): <scope fraction>\nBarrier height (0-1): <coupling/coverage risk>\nTeam energy (0-1): <available capacity>\nEstimated probability: <WKB advisory value>\nDecision: <attempt now | reduce barrier | defer>\nBarrier-reduction moves: <tests | dependency seam | strangler path | freeze-window adjustment>",
				rankedCandidates.length >= 2
					? [
							"Refactoring",
							"barrierWidth",
							"barrierHeight",
							"teamEnergyLevel",
							"barrierExcess",
							"T",
							"Viability",
							"Action",
						]
					: [
							"Refactoring target",
							"Barrier width",
							"Barrier height",
							"Team energy",
							"Estimated probability",
							"Decision",
							"Barrier-reduction moves",
						],
				rankedCandidates.length >= 2
					? "Template for producing a ranked refactoring list that stays faithful to the reference-style WKB workflow."
					: "Template for turning the tunneling metaphor into an explicit migration decision record.",
			),
			buildComparisonMatrixArtifact(
				rankedCandidates.length >= 2
					? "Refactoring tunnelling ranking"
					: "Tunneling viability response matrix",
				rankedCandidates.length >= 2
					? [
							"Barrier width",
							"Barrier height",
							"Energy",
							"Barrier excess",
							"T",
							"Viability",
							"Action",
						]
					: ["Interpretation", "Risk signal", "Recommended move"],
				comparisonRows,
				rankedCandidates.length >= 2
					? "Candidate-specific ranking sorted by descending WKB tunnelling probability."
					: "Use the WKB band to decide whether to begin, shrink, or defer a refactoring migration.",
			),
			buildEvalCriteriaArtifact(
				rankedCandidates.length >= 2
					? "Refactoring ranking review checks"
					: "Tunneling decision review checks",
				[
					"Barrier width includes all affected callers and interfaces, not just the primary target file.",
					"Barrier height reflects coupling and current test coverage rather than intuition alone.",
					"Team energy reflects real delivery capacity and release-window pressure.",
					"The recommendation is grounded in saved reports, dependency snapshots, or coverage evidence rather than claimed live recomputation.",
				],
				rankedCandidates.length >= 2
					? "Review checklist for deciding whether a ranked tunnelling output is trustworthy enough to drive refactoring sequencing."
					: "Review checklist for deciding whether a tunneling-based refactoring recommendation is trustworthy enough to act on.",
			),
			buildToolChainArtifact(
				rankedCandidates.length >= 2
					? "Tunneling ranking evidence chain"
					: "Tunneling evidence chain",
				[
					{
						tool: "dependency graph or caller inventory",
						description:
							"Use existing dependency snapshots or import graphs to estimate barrier width from real callers.",
					},
					{
						tool: "coverage or characterization test report",
						description:
							"Use saved coverage evidence to estimate barrier height and identify the first barrier-reduction move.",
					},
					{
						tool: "planning or decision record",
						description:
							"Record the go/defer call, the estimated barrier values, and the trigger that would justify revisiting the migration.",
					},
				],
				rankedCandidates.length >= 2
					? "Evidence chain for grounding a comparative tunnelling ranking in explicit engineering artifacts."
					: "Evidence chain for grounding tunneling viability in existing engineering artifacts instead of ad hoc intuition.",
			),
		];

		return createCapabilityResult(
			context,
			rankedCandidates.length >= 2
				? `Tunneling Breakthrough ranked ${rankedCandidates.length} refactoring candidates; top candidate: ${rankedCandidates[0]?.name} (${rankedCandidates[0]?.viability}, T=${fmtNum(rankedCandidates[0]?.tunnelingProbability ?? 0)}).`
				: `Tunneling Breakthrough produced ${details.length} refactoring-viability advisory items (barrier: ${barrierRisk}, energy: ${teamEnergy}, signal: ${viabilitySignal}).`,
			createFocusRecommendations(
				"Tunneling breakthrough guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	tunnelingBreakthroughHandler,
);
