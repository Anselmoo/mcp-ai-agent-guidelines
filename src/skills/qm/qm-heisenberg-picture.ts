import { z } from "zod";
import { qm_heisenberg_picture_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { fmtNum, pearsonCorrelation } from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
} from "./qm-physics-helpers.js";

const heisenbergPictureInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			analysisMode: z.enum(["drift", "commutation", "balanced"]).optional(),
			snapshots: z.array(z.record(z.number())).min(3).max(8).optional(),
		})
		.optional(),
});

const HEISENBERG_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(drift|trend|changing.over.time|evolv|operator)\b/i,
		detail:
			"Focus first on the fastest-drifting metric, not the loudest one in debate. A metric moving rapidly across successive snapshots is the operator most likely to destabilise planning assumptions in the next sprint.",
	},
	{
		pattern: /\b(correl|commut|compatible|together)\b/i,
		detail:
			"Treat strongly positive correlation as a signal that two metrics can often be improved in the same initiative. That does not guarantee causation, but it is enough to justify bundling them into one optimisation hypothesis.",
	},
	{
		pattern: /\b(conflict|anti.correl|non.commut|trade.off|competing)\b/i,
		detail:
			"Negative correlation is a trade-off warning. If one metric improves whenever another degrades, document the conflict explicitly and choose which side wins for the current planning window. Hidden trade-offs are what create dashboard churn and review disagreement.",
	},
	{
		pattern: /\b(snapshot|history|missing|rename|sparse)\b/i,
		detail:
			"Be conservative with sparse history. Renamed metrics, missing values, or one-off tooling changes can manufacture apparent drift or false anticorrelation. Stabilise the measurement pipeline before drawing strong conclusions from the picture.",
	},
];

const heisenbergPictureHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(heisenbergPictureInputSchema, input);
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
				"Heisenberg Picture needs metric history across time. Describe the snapshots or the metrics whose drift and compatibility you want to inspect.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(metric|drift|snapshot|correl|commut|time|history|trend|anti.correl)\b/i.test(
				combined,
			) || parsed.data.options?.snapshots !== undefined;

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Heisenberg Picture requires time-series metric signal — for example snapshots, drift, metric conflict, or compatibility over time.",
			);
		}

		const analysisMode = parsed.data.options?.analysisMode ?? "balanced";
		let numericDetail: string | undefined;
		if (parsed.data.options?.snapshots) {
			const metricNames = Array.from(
				new Set(
					parsed.data.options.snapshots.flatMap((snapshot) =>
						Object.keys(snapshot),
					),
				),
			);
			const metricSeries = metricNames.map((name) => ({
				name,
				series:
					parsed.data.options?.snapshots?.map(
						(snapshot) => snapshot[name] ?? 0,
					) ?? [],
			}));
			const drifts = metricSeries.map(({ name, series }) => ({
				name,
				drift:
					series.length < 2
						? 0
						: ((series.at(-1) ?? 0) - (series[0] ?? 0)) / (series.length - 1),
			}));
			const dominant = [...drifts].sort(
				(left, right) => Math.abs(right.drift) - Math.abs(left.drift),
			)[0];
			const pairCandidates = metricSeries.flatMap((left, leftIndex) =>
				metricSeries.slice(leftIndex + 1).map((right) => ({
					pair: `${left.name} ↔ ${right.name}`,
					correlation: pearsonCorrelation(left.series, right.series),
				})),
			);
			const mostConflicting = [...pairCandidates].sort(
				(left, right) => left.correlation - right.correlation,
			)[0];
			if (dominant) {
				numericDetail = `Illustrative Heisenberg reading from ${parsed.data.options.snapshots.length} snapshots. Dominant operator drift: ${dominant.name} at ${fmtNum(dominant.drift)} per step. ${mostConflicting ? `Most conflicting pair: ${mostConflicting.pair} with Pearson r ≈ ${fmtNum(mostConflicting.correlation)}.` : ""} ${mostConflicting && mostConflicting.correlation < -0.3 ? "Treat that pair as non-commuting in planning: improving one likely pressures the other." : "No strongly conflicting pair is obvious in the supplied series."} This remains a supplementary trend lens, not a substitute for direct metric inspection.`;
			}
		}

		const details: string[] = [
			`Use the Heisenberg picture to analyse how quality metrics drift while the codebase context is treated as temporarily fixed. In plain terms: identify the metrics moving fastest, then separate pairs that improve together from pairs that fight each other. That framing helps teams stop arguing about abstract 'quality' and instead name which indicators are cooperating versus competing.`,
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(HEISENBERG_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Collect at least three consistent snapshots before calling a metric pair conflicting. With only one or two points, almost any narrative can be made to look true.",
				"Keep the snapshot cadence stable. Per-commit sampling, per-sprint sampling, and release-only sampling answer different questions and should not be mixed in one correlation story.",
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleSnapshots = parsed.data.options?.snapshots ?? [
			{ complexity: 0.3, coverage: 0.8, coupling: 0.2 },
			{ complexity: 0.5, coverage: 0.7, coupling: 0.4 },
			{ complexity: 0.7, coverage: 0.6, coupling: 0.6 },
		];
		const sampleMetricNames = Array.from(
			new Set(sampleSnapshots.flatMap((snapshot) => Object.keys(snapshot))),
		);
		const sampleSeries = sampleMetricNames.map((name) => ({
			name,
			series: sampleSnapshots.map((snapshot) => snapshot[name] ?? 0),
		}));
		const sampleDominant = sampleSeries
			.map(({ name, series }) => ({
				name,
				drift:
					series.length < 2
						? 0
						: ((series.at(-1) ?? 0) - (series[0] ?? 0)) / (series.length - 1),
			}))
			.sort((left, right) => Math.abs(right.drift) - Math.abs(left.drift))[0];
		const sampleConflict = sampleSeries
			.flatMap((left, leftIndex) =>
				sampleSeries.slice(leftIndex + 1).map((right) => ({
					pair: `${left.name} ↔ ${right.name}`,
					correlation: pearsonCorrelation(left.series, right.series),
				})),
			)
			.sort((left, right) => left.correlation - right.correlation)[0];
		const artifacts = [
			buildWorkedExampleArtifact(
				"Heisenberg drift worked example",
				{
					analysisMode,
					snapshots: sampleSnapshots,
				},
				{
					dominantDriftMetric: sampleDominant?.name ?? "complexity",
					driftPerStep: fmtNum(sampleDominant?.drift ?? 0.2),
					mostConflictingPair: sampleConflict?.pair ?? "complexity ↔ coverage",
					engineeringTranslation:
						"Track the fastest-moving metric and explicitly document any pair that seems to trade off across snapshots.",
				},
				"Converts time-series metrics into planning guidance.",
			),
			buildComparisonMatrixArtifact(
				"Metric relationship matrix",
				["Observed pattern", "Interpretation", "Engineering move"],
				[
					{
						label: "Fast drift",
						values: [
							"One metric changes rapidly between snapshots",
							"Planning assumptions may be expiring",
							"Review the underlying pipeline and stabilise the driver",
						],
					},
					{
						label: "Positive correlation",
						values: [
							"Two metrics improve together",
							"A bundled initiative may work",
							"Test a joint optimisation hypothesis",
						],
					},
					{
						label: "Negative correlation",
						values: [
							"Metrics fight each other across history",
							"There is a real trade-off to name",
							"Choose the winner for the planning window explicitly",
						],
					},
				],
				"Use this matrix when translating metric drift into roadmap language.",
			),
			buildToolChainArtifact(
				"Metric drift evidence chain",
				[
					{
						tool: "metric snapshots",
						description:
							"Use an existing consistent cadence such as releases or sprints rather than claiming live recomputation.",
					},
					{
						tool: "dashboard or report export",
						description:
							"Confirm that renames or missing data did not manufacture apparent drift.",
					},
					{
						tool: "planning notes",
						description:
							"Document which metric pair is cooperating or conflicting before selecting an initiative.",
					},
				],
				"Keep the picture grounded in measured history.",
			),
		];

		return createCapabilityResult(
			context,
			`Heisenberg Picture produced ${details.length} metric-drift advisory items (mode: ${analysisMode}).`,
			createFocusRecommendations(
				"Heisenberg-picture guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	heisenbergPictureHandler,
);
