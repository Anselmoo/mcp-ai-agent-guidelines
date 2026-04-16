import { z } from "zod";
import { qm_double_slit_interference_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	fmtNum,
	interferenceTerm,
	relativeGain,
	totalInterferenceIntensity,
} from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
} from "./qm-physics-helpers.js";

const doubleSlitInterferenceInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			analysisGoal: z.enum(["merge", "choose-one", "keep-separate"]).optional(),
			intensityA: z.number().min(0).max(1).optional(),
			intensityB: z.number().min(0).max(1).optional(),
			cosineSimilarity: z.number().min(-1).max(1).optional(),
		})
		.optional(),
});

const DOUBLE_SLIT_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(complement|synergy|merge|combine|constructive)\b/i,
		detail:
			"Constructive interference means the two approaches reinforce the same outcome without duplicating responsibility. In practice that is a cue to look for a shared abstraction or unified façade, not to blindly merge codepaths immediately.",
	},
	{
		pattern: /\b(conflict|clash|cancel|destructive|choose.one|either.or)\b/i,
		detail:
			"Destructive interference usually signals overlapping responsibilities with incompatible assumptions — two caching layers, two routing conventions, or two ownership models. In those cases choose one governing pattern and actively deprecate the other instead of letting both coexist.",
	},
	{
		pattern: /\b(independent|orthogon|separate|different.concern)\b/i,
		detail:
			"Near-neutral interference suggests the approaches solve different problems. Keep them separate unless there is an operational reason to unify them. Forced consolidation of orthogonal concerns often creates accidental complexity.",
	},
	{
		pattern: /\b(weight|importance|usage|intensity|criticality)\b/i,
		detail:
			"Use intensity weights to represent real importance: traffic share, operational criticality, or migration effort. If one implementation matters much more than the other, equal weights will distort the interference reading.",
	},
];

const doubleSlitInterferenceHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(doubleSlitInterferenceInputSchema, input);
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
				"Double Slit Interference needs two implementations or design approaches plus the question of whether they reinforce, conflict, or stay independent.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(two|both|implementation|approach|interference|constructive|destructive|conflict|complement)\b/i.test(
				combined,
			) || parsed.data.options?.cosineSimilarity !== undefined;

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Double Slit Interference requires signal about two competing or cooperating approaches — describe the pair and whether you are evaluating synergy, conflict, or independence.",
			);
		}

		const goal = parsed.data.options?.analysisGoal ?? "merge";
		let numericDetail: string | undefined;
		if (parsed.data.options?.cosineSimilarity !== undefined) {
			const intensityA = parsed.data.options?.intensityA ?? 1;
			const intensityB = parsed.data.options?.intensityB ?? 1;
			const term = interferenceTerm(
				intensityA,
				intensityB,
				parsed.data.options.cosineSimilarity,
			);
			const classical = intensityA + intensityB;
			const total = totalInterferenceIntensity(
				intensityA,
				intensityB,
				parsed.data.options.cosineSimilarity,
			);
			const gain = relativeGain(total, classical);
			const classification =
				term > 0.1
					? "constructive"
					: term < -0.1
						? "destructive"
						: "independent";
			numericDetail = `Illustrative interference estimate: I_total = ${fmtNum(total)} versus classical addition ${fmtNum(classical)}, interference term = ${fmtNum(term)}, relative gain = ${fmtNum(gain * 100)}%. Classification: ${classification}. ${classification === "constructive" ? "Look for a unifying façade or shared layer." : classification === "destructive" ? "Prefer one governing approach and retire the competing pattern." : "The pair appears mostly orthogonal — keep concerns separated unless operations argue otherwise."} This is a supplementary compatibility heuristic, not proof of runtime safety.`;
		}

		const details: string[] = [
			`Use the double-slit interference lens for a ${goal} decision. In plain terms: assess whether the two approaches amplify one another, cancel one another, or simply coexist. The metaphor is valuable because it turns vague 'do these play nicely together?' questions into a structured compatibility review with three outcomes: merge, choose one, or keep separate.`,
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(DOUBLE_SLIT_RULES, combined));

		if (details.length === 1) {
			details.push(
				"List the shared responsibilities first. If both implementations own the same contract, state, or operator workflow, destructive interference is more likely than constructive synergy.",
				"Then list what becomes simpler if both approaches are kept. If the answer is 'nothing', avoid carrying duplicate patterns indefinitely.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the context to identify where the two approaches touch the same APIs, state transitions, or ownership boundaries. Those contact points are where interference will become visible first.",
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleIntensityA = parsed.data.options?.intensityA ?? 0.8;
		const sampleIntensityB = parsed.data.options?.intensityB ?? 0.7;
		const sampleCosine = parsed.data.options?.cosineSimilarity ?? 0.9;
		const sampleTerm = interferenceTerm(
			sampleIntensityA,
			sampleIntensityB,
			sampleCosine,
		);
		const sampleTotal = totalInterferenceIntensity(
			sampleIntensityA,
			sampleIntensityB,
			sampleCosine,
		);
		const sampleClass =
			sampleTerm > 0.1
				? "constructive"
				: sampleTerm < -0.1
					? "destructive"
					: "independent";
		const artifacts = [
			buildWorkedExampleArtifact(
				"Double-slit decision worked example",
				{
					analysisGoal: goal,
					intensityA: sampleIntensityA,
					intensityB: sampleIntensityB,
					cosineSimilarity: sampleCosine,
				},
				{
					totalIntensity: fmtNum(sampleTotal),
					interferenceTerm: fmtNum(sampleTerm),
					classification: sampleClass,
					engineeringTranslation:
						sampleClass === "constructive"
							? "Look for a shared façade or abstraction seam."
							: sampleClass === "destructive"
								? "Pick one governing pattern and plan deprecation for the other."
								: "Keep the concerns separate unless operational evidence says otherwise.",
				},
				"Shows how compatibility math becomes a design decision memo.",
			),
			buildComparisonMatrixArtifact(
				"Two-approach outcome matrix",
				["Outcome", "Meaning", "Preferred next move"],
				[
					{
						label: "Constructive interference",
						values: [
							"The approaches reinforce the same outcome",
							"Shared responsibilities are compatible",
							"Design a single façade or shared layer",
						],
					},
					{
						label: "Destructive interference",
						values: [
							"The approaches overlap with incompatible assumptions",
							"Coexistence adds confusion or operational cost",
							"Choose one and deprecate the competing pattern",
						],
					},
					{
						label: "Near-neutral interference",
						values: [
							"The approaches solve different concerns",
							"Forced unification adds accidental complexity",
							"Keep them separate and document the boundary",
						],
					},
				],
				"Use this matrix when turning the metaphor into an architecture choice.",
			),
			buildEvalCriteriaArtifact(
				"Interference review checks",
				[
					"Intensity weights reflect real importance such as traffic, criticality, or migration cost.",
					"The decision is grounded in shared APIs, state, or ownership boundaries rather than similarity alone.",
					"Constructive interference leads to a scoped unification seam, not an unbounded merge.",
					"Evidence comes from existing analysis inputs rather than claimed live runtime measurements.",
				],
				"Criteria for deciding whether to merge, choose one, or keep the approaches separate.",
			),
		];

		return createCapabilityResult(
			context,
			`Double Slit Interference produced ${details.length} two-approach compatibility advisory items (goal: ${goal}).`,
			createFocusRecommendations(
				"Double-slit guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	doubleSlitInterferenceHandler,
);
