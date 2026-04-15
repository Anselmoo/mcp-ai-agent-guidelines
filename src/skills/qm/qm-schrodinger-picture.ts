import { z } from "zod";
import { qm_schrodinger_picture_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
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
import {
	fmtNum,
	interpolateVector,
	l2Distance,
	normalizeVector,
	vectorNorm,
} from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
} from "./qm-physics-helpers.js";

const labelledStateSchema = z.object({
	label: z.string().min(1),
	state: z.array(z.number()).min(2).max(8),
});

const schrodingerPictureInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			steps: z.number().int().min(1).max(5).optional(),
			snapshots: z.array(labelledStateSchema).min(2).max(6).optional(),
		})
		.optional(),
});

const SCHRODINGER_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(predict|forecast|future|next.step|trajectory)\b/i,
		detail:
			"Use the forecast as a conversation starter about direction, not as a commitment that the codebase will land there. The value is in naming where current momentum points if nothing deliberately intervenes.",
	},
	{
		pattern: /\b(drift|accelerat|phase.transition|stabilise)\b/i,
		detail:
			"Rapidly increasing drift means today's local choices are accumulating into a broader architectural movement. That is the moment to stabilise public contracts or explicitly plan a migration, before the direction becomes accidental.",
	},
	{
		pattern: /\b(linear|nonlinear|shock|rewrite|framework.migration)\b/i,
		detail:
			"Be sceptical after external shocks. Team changes, framework rewrites, or platform pivots break the linear-evolution assumption quickly. Recalibrate with fresher snapshots instead of extending stale trajectory logic.",
	},
	{
		pattern: /\b(snapshot|embedding|release|tag)\b/i,
		detail:
			"Sample snapshots at meaningful intervals: releases, architecture milestones, or sprint boundaries. Random or uneven sampling makes drift look noisier than it really is and weakens forecast usefulness.",
	},
];

const schrodingerPictureHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(schrodingerPictureInputSchema, input);
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
				"Schrödinger Picture needs historical snapshots or a question about future architectural drift.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(predict|forecast|future|schr|trajectory|drift|snapshot|time.evolution)\b/i.test(
				combined,
			) || parsed.data.options?.snapshots !== undefined;

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Schrödinger Picture requires trajectory signal — for example historical snapshots, future state prediction, or architectural drift over time.",
			);
		}

		const steps = parsed.data.options?.steps ?? 3;
		let numericDetail: string | undefined;
		if (parsed.data.options?.snapshots) {
			const dimensions = new Set(
				parsed.data.options.snapshots.map((snapshot) => snapshot.state.length),
			);
			if (dimensions.size !== 1) {
				return buildInsufficientSignalResult(
					context,
					"Schrödinger Picture received incompatible snapshot dimensions.",
					"Ensure every snapshot vector has the same dimensionality before requesting trajectory forecasting.",
				);
			}
			const snapshots = parsed.data.options.snapshots;
			const previous = snapshots[snapshots.length - 2];
			const current = snapshots[snapshots.length - 1];
			if (!previous || !current) {
				return buildInsufficientSignalResult(
					context,
					"Schrödinger Picture needs at least two snapshots.",
				);
			}
			const delta = interpolateVector(previous.state, current.state, 1).map(
				(value, index) => value - (previous.state[index] ?? 0),
			);
			const stepVector = normalizeVector(delta);
			let predicted = [...current.state];
			const futureDrifts: number[] = [];
			for (let index = 0; index < steps; index += 1) {
				predicted = normalizeVector(
					predicted.map(
						(value, position) => value + (stepVector[position] ?? 0),
					),
				);
				futureDrifts.push(l2Distance(predicted, current.state));
			}
			numericDetail = `Illustrative Schrödinger forecast from ${snapshots.length} snapshots. Latest observed evolution-step norm = ${fmtNum(vectorNorm(delta))}. Predicted drift from current state over the next ${steps} steps: ${futureDrifts.map((value) => fmtNum(value)).join(", ")}. ${futureDrifts.at(-1) !== undefined && (futureDrifts.at(-1) ?? 0) > 0.5 ? "Forecast suggests substantial upcoming drift — stabilise interfaces before extending aggressively." : "Forecast suggests moderate continuation of the current trajectory."} Linear extrapolation remains advisory and should be rechecked after the next release milestone.`;
		}

		const details: string[] = [
			`Use the Schrödinger picture to reason about where the codebase state is heading if the current evolution continues for ${steps} more step(s). In plain terms: estimate the direction of travel from recent snapshots, then ask whether that future state is desirable or whether you should intervene early with stabilisation work.`,
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(SCHRODINGER_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Compare the predicted direction with upcoming roadmap changes. If the roadmap points elsewhere, the forecast is a warning that local work is dragging the architecture off-course.",
				"Keep the horizon short. One to three forecast steps is usually enough for planning; pushing farther makes the linear assumption dominate the story more than the underlying evidence does.",
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleSnapshots = parsed.data.options?.snapshots ?? [
			{ label: "v1", state: [0.2, 0.1, 0.3] },
			{ label: "v2", state: [0.3, 0.2, 0.4] },
			{ label: "v3", state: [0.5, 0.3, 0.6] },
		];
		const samplePrevious =
			sampleSnapshots[sampleSnapshots.length - 2] ?? sampleSnapshots[0];
		const sampleCurrent =
			sampleSnapshots[sampleSnapshots.length - 1] ?? sampleSnapshots[0];
		const sampleDelta = interpolateVector(
			samplePrevious.state,
			sampleCurrent.state,
			1,
		).map((value, index) => value - (samplePrevious.state[index] ?? 0));
		const sampleStepVector = normalizeVector(sampleDelta);
		let samplePredicted = [...sampleCurrent.state];
		const sampleDrifts: number[] = [];
		for (let index = 0; index < steps; index += 1) {
			samplePredicted = normalizeVector(
				samplePredicted.map(
					(value, position) => value + (sampleStepVector[position] ?? 0),
				),
			);
			sampleDrifts.push(l2Distance(samplePredicted, sampleCurrent.state));
		}
		const artifacts = [
			buildWorkedExampleArtifact(
				"Schrodinger forecast worked example",
				{
					steps,
					snapshots: sampleSnapshots,
				},
				{
					latestStepNorm: fmtNum(vectorNorm(sampleDelta)),
					forecastDrift: sampleDrifts.map((value) => fmtNum(value)),
					engineeringTranslation:
						"Use short-horizon drift as an early warning for interface stabilisation or roadmap correction.",
				},
				"Turns recent state evolution into a planning forecast.",
			),
			buildOutputTemplateArtifact(
				"Short-horizon drift memo",
				`Snapshot window:
Observed direction of travel:
Forecast horizon:
Predicted drift:
Why the forecast might break:
Intervention to consider:`,
				[
					"Snapshot window",
					"Observed direction of travel",
					"Forecast horizon",
					"Predicted drift",
					"Why the forecast might break",
					"Intervention to consider",
				],
				"Use this template when you need to explain a forecast without overstating confidence.",
			),
			buildEvalCriteriaArtifact(
				"Trajectory forecast checks",
				[
					"All snapshots use the same dimensionality and a meaningful cadence.",
					"The horizon stays short enough that the linear extrapolation remains interpretable.",
					"External shocks such as rewrites or team changes are called out before trusting the projection.",
					"Forecast numbers come from existing snapshots rather than claimed live runtime state evolution.",
				],
				"Criteria for deciding whether the predicted drift is actionable.",
			),
		];

		return createCapabilityResult(
			context,
			`Schrödinger Picture produced ${details.length} trajectory-forecast advisory items (horizon: ${steps} step(s)).`,
			createFocusRecommendations(
				"Schrodinger-picture guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	schrodingerPictureHandler,
);
