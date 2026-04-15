import { z } from "zod";
import { qm_path_integral_historian_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import {
	arithmeticMean,
	fmtNum,
	pathIntegralWeight,
	standardDeviation,
} from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
} from "./qm-physics-helpers.js";

const pathIntegralHistorianInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			temperature: z.number().min(0.01).max(2).optional(),
			actions: z.array(z.number().nonnegative()).min(2).max(20).optional(),
		})
		.optional(),
});

const PATH_INTEGRAL_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> =
	[
		{
			pattern: /\b(inflection|biggest.change|rewrite|phase.transition)\b/i,
			detail:
				"Treat high-action commits as ADR candidates. They often mark the moments when the architecture really changed, even if the commit message sounded routine. Capture rationale while the context is still fresh.",
		},
		{
			pattern: /\b(classical.path|incremental|small.change|low.action)\b/i,
			detail:
				"The classical path is the series of low-action steps that preserved architectural continuity. Those commits are often good squash candidates and good reference points for what 'normal' evolution looks like in this repository.",
		},
		{
			pattern: /\b(volatile|temperature|unstable|chaotic)\b/i,
			detail:
				"High average action means the codebase is already thermally noisy. That is a warning against layering another broad rewrite on top before the current architecture settles.",
		},
		{
			pattern: /\b(commit|history|git|sha|trajectory)\b/i,
			detail:
				"Use representative code samples per commit rather than raw line counts. A tiny schema change in a core abstraction can be architecturally larger than a large formatting commit, so semantic representativeness matters more than diff size alone.",
		},
	];

const pathIntegralHistorianHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(pathIntegralHistorianInputSchema, input);
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
				"Path Integral Historian needs commit-history context or action values. Describe the trajectory or provide representative step actions before asking for inflection analysis.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(commit|history|git|trajectory|inflection|action|path.integral|rewrite|biggest.change)\b/i.test(
				combined,
			) || parsed.data.options?.actions !== undefined;

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Path Integral Historian requires git-trajectory signal — for example commit history, inflection commit, action weighting, or classical path analysis.",
			);
		}

		const temperature = parsed.data.options?.temperature ?? 0.5;
		let numericDetail: string | undefined;
		if (parsed.data.options?.actions) {
			const meanAction = arithmeticMean(parsed.data.options.actions);
			const sigma = standardDeviation(parsed.data.options.actions);
			const threshold = meanAction + 2 * sigma;
			const inflections = parsed.data.options.actions
				.map((action, index) => ({ action, index: index + 1 }))
				.filter(({ action }) => action > threshold);
			const mostLikely = [...parsed.data.options.actions]
				.map((action, index) => ({
					index: index + 1,
					weight: pathIntegralWeight(action, temperature),
				}))
				.sort((left, right) => right.weight - left.weight)[0];
			numericDetail = `Illustrative path-integral summary: mean action = ${fmtNum(meanAction)}, σ = ${fmtNum(sigma)}, inflection threshold = ${fmtNum(threshold)}. ${inflections.length > 0 ? `Inflection steps: ${inflections.map(({ index }) => index).join(", ")}. ` : "No step exceeds the inflection threshold. "}Most probable classical step under temperature ${fmtNum(temperature)}: ${mostLikely?.index ?? 1}. Use this to highlight where commit history stayed smooth versus where it jumped.`;
		}

		const details: string[] = [
			"Use the path-integral lens to separate ordinary evolutionary commits from rare architectural jumps. In plain terms: quantify which changes were part of the normal path and which commits pushed the codebase into a visibly different regime. This is useful for identifying where decision records, retrospectives, or migration notes should have existed.",
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(PATH_INTEGRAL_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Start with representative commits around one suspected transition — for example a framework migration or service split. A bounded window produces a clearer action distribution than the entire lifetime of the repository.",
				"Interpret outliers with commit intent. A very high-action commit may be a healthy migration milestone or a dangerous unreviewed jump; the statistic tells you where to look, not what verdict to reach.",
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleActions = parsed.data.options?.actions ?? [
			0.12, 0.15, 0.81, 0.18,
		];
		const sampleMean = arithmeticMean(sampleActions);
		const sampleSigma = standardDeviation(sampleActions);
		const sampleThreshold = sampleMean + 2 * sampleSigma;
		const sampleInflections = sampleActions
			.map((action, index) => ({ action, index: index + 1 }))
			.filter(({ action }) => action > sampleThreshold)
			.map(({ index }) => index);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Path-integral history worked example",
				{
					temperature,
					actions: sampleActions,
				},
				{
					meanAction: fmtNum(sampleMean),
					inflectionSteps: sampleInflections,
					classicalStep:
						sampleActions
							.map((action, index) => ({
								index: index + 1,
								weight: pathIntegralWeight(action, temperature),
							}))
							.sort((left, right) => right.weight - left.weight)[0]?.index ?? 1,
					engineeringTranslation:
						"Capture ADRs around high-action outliers and use the low-action path as the baseline evolution story.",
				},
				"Shows how commit actions become a practical history review.",
			),
			buildOutputTemplateArtifact(
				"Commit trajectory review template",
				`Window inspected:
Representative commits:
Classical path commits:
Inflection commits:
Missing rationale to recover:
Follow-up engineering action:`,
				[
					"Window inspected",
					"Representative commits",
					"Classical path commits",
					"Inflection commits",
					"Missing rationale to recover",
					"Follow-up engineering action",
				],
				"Use this template when converting the metaphor into a history memo or ADR backfill task.",
			),
			buildEvalCriteriaArtifact(
				"Commit trajectory checks",
				[
					"Action values come from an existing bounded history window, not from a claimed live runtime scan.",
					"High-action outliers are checked against commit intent before being labelled risky.",
					"The classical path reflects representative low-action evolution, not just the smallest diff.",
					"Each flagged inflection leads to a concrete documentation or review follow-up.",
				],
				"Criteria for deciding whether the inferred trajectory is actionable.",
			),
			buildToolChainArtifact(
				"History evidence chain",
				[
					{
						tool: "git log / release history",
						description:
							"Use existing commit windows or release milestones as the evidence source.",
					},
					{
						tool: "representative diffs",
						description:
							"Inspect semantic changes around inflection commits instead of trusting line counts alone.",
					},
					{
						tool: "ADR or migration notes",
						description:
							"Record the rationale where the history shows a genuine architectural jump.",
					},
				],
				"Keep the historian grounded in repository evidence rather than speculative live analysis.",
			),
		];

		return createCapabilityResult(
			context,
			`Path Integral Historian produced ${details.length} commit-trajectory advisory items (temperature: ${fmtNum(temperature)}).`,
			createFocusRecommendations(
				"Path-integral guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	pathIntegralHistorianHandler,
);
