import { z } from "zod";
import { qm_bloch_interpolator_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
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
import { blochPurity, fmtNum, interpolateVector } from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
} from "./qm-physics-helpers.js";

const blochInterpolatorInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			transitionFocus: z
				.enum(["style-migration", "architecture-blend", "governance"])
				.optional(),
			steps: z.number().int().min(2).max(10).optional(),
			styleAName: z.string().min(1).optional(),
			styleBName: z.string().min(1).optional(),
			stateA: z
				.tuple([
					z.number().min(-1).max(1),
					z.number().min(-1).max(1),
					z.number().min(-1).max(1),
				])
				.optional(),
			stateB: z
				.tuple([
					z.number().min(-1).max(1),
					z.number().min(-1).max(1),
					z.number().min(-1).max(1),
				])
				.optional(),
		})
		.optional(),
});

const BLOCH_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(interpolat|transition|middle|intermediate|blend|mixed.state)\b/i,
		detail:
			"Treat the Bloch path as a planning sequence, not a rollout schedule. Each interpolation step should correspond to a concrete code-shape checkpoint: naming conventions, module boundaries, or dependency-injection posture. The useful question is not 'what is the exact mixed state?' but 'what does the codebase need to look like before the next step is safe?'",
	},
	{
		pattern:
			/\b(oop|functional|object.oriented|procedural|reactive|event.driven)\b/i,
		detail:
			"When the poles are named coding styles, define the axes explicitly before using the metaphor. For example: mutability, inheritance depth, and orchestration style. Without explicit axes, an intermediate Bloch state sounds precise but hides disagreement about what '50% functional' actually means in code review.",
	},
	{
		pattern: /\b(pure|purity|hybrid|mixed|inconsistent|lint|style.guide)\b/i,
		detail:
			"Low-purity intermediate states mean the codebase will intentionally contain mixed patterns for a while. That is acceptable only if the team adds compensating controls: lint rules, examples in the style guide, and review checklists that explain which blend is allowed. Otherwise the midpoint becomes accidental inconsistency rather than a managed transition.",
	},
	{
		pattern: /\b(binary|switch|flag|cutover|all.at.once)\b/i,
		detail:
			"If both endpoints are near-pure and culturally incompatible, prefer a short binary cutover with feature flags or a branch-by-abstraction seam. A long stay in the midpoint often maximises confusion: engineers start copying both styles and reviewers stop knowing which one is canonical.",
	},
];

const blochInterpolatorHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(blochInterpolatorInputSchema, input);
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
				"Bloch Interpolator needs two styles or architectural poles plus the transition you want to reason about. Describe the endpoints or provide Bloch vectors before requesting intermediate states.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(bloch|interpolat|geodesic|style|architecture|mixed.state|transition|blend|hybrid)\b/i.test(
				combined,
			) ||
			(parsed.data.options?.stateA !== undefined &&
				parsed.data.options?.stateB !== undefined);

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Bloch Interpolator requires a style-transition signal — for example interpolation, mixed architecture, gradual migration, or explicit endpoint states.",
			);
		}

		const steps = parsed.data.options?.steps ?? 5;
		const styleA = parsed.data.options?.styleAName ?? "Style A";
		const styleB = parsed.data.options?.styleBName ?? "Style B";
		const focus = parsed.data.options?.transitionFocus ?? "style-migration";

		let numericDetail: string | undefined;
		if (parsed.data.options?.stateA && parsed.data.options?.stateB) {
			const midpoint = interpolateVector(
				parsed.data.options.stateA,
				parsed.data.options.stateB,
				0.5,
			);
			const midpointPurity = blochPurity(midpoint);
			numericDetail = `Illustrative Bloch interpolation across ${steps} steps from ${styleA} to ${styleB}. Midpoint vector ≈ [${midpoint.map((value) => fmtNum(value)).join(", ")}], purity |r| = ${fmtNum(midpointPurity)}. ${midpointPurity < 0.5 ? "This is a highly mixed intermediate state — plan explicit guardrails so the blend is intentional." : "This midpoint still has a recognisable architectural identity — gradual migration is plausible."} Treat the vector math as a supplementary planning aid, not as an automated style encoder.`;
		}

		const details: string[] = [
			`Use the Bloch interpolation lens for a ${focus} transition between ${styleA} and ${styleB}. In plain engineering terms: define the opposing styles, choose ${steps} checkpoints between them, and describe what code-review expectations hold at each checkpoint. The metaphor is helpful because it makes the messy middle visible instead of pretending a migration jumps directly from one pure style to another.`,
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(BLOCH_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Write one sentence for each endpoint describing what reviewers should reward and reject. Then draft the midpoint policy separately. If the midpoint policy cannot be written clearly, do not attempt a gradual migration — use a cutover seam instead.",
				`Name the checkpoints in plain language, for example: 100% ${styleA}, 75/25 blend, 50/50 blend, 25/75 blend, 100% ${styleB}. Teams review intermediate states more consistently when the labels are human-readable rather than purely numeric.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints to the transition sequence: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints determine how many intermediate checkpoints are realistic before the migration loses momentum.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the supplied context to map each checkpoint onto concrete files, module types, or review rules. The metaphor is only useful when the blend can be observed in real code examples.",
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		const midpointVector = interpolateVector(
			parsed.data.options?.stateA ?? [1, 0, 0],
			parsed.data.options?.stateB ?? [0, 1, 0],
			0.5,
		);

		const artifacts = [
			buildWorkedExampleArtifact(
				"Bloch transition worked example",
				{
					styleA,
					styleB,
					steps,
					stateA: parsed.data.options?.stateA ?? [1, 0, 0],
					stateB: parsed.data.options?.stateB ?? [0, 1, 0],
				},
				{
					checkpoints: [
						`100% ${styleA}`,
						`75% ${styleA} / 25% ${styleB}`,
						`50% ${styleA} / 50% ${styleB}`,
						`25% ${styleA} / 75% ${styleB}`,
						`100% ${styleB}`,
					],
					midpointVector: midpointVector.map((value) => fmtNum(value)),
					midpointPurity: fmtNum(blochPurity(midpointVector)),
					engineeringTranslation:
						"Use the midpoint only if the team can name the intermediate review rules clearly; otherwise prefer a cutover seam.",
					confidence: "medium",
					recommendedAction:
						"Publish checkpoint criteria before the migration starts so each blend has a reviewable definition.",
				},
				"Worked example: map a style migration into explicit checkpoints and a plain-language rollout recommendation.",
			),
			buildOutputTemplateArtifact(
				"Bloch transition review template",
				"| Checkpoint | State blend | Review question | Confidence | Recommended action |\n| --- | --- | --- | --- | --- |\n| 100% A |  |  |  |  |\n| 75/25 |  |  |  |  |\n| 50/50 |  |  |  |  |\n| 25/75 |  |  |  |  |\n| 100% B |  |  |  |  |",
				[
					"Checkpoint",
					"State blend",
					"Review question",
					"Confidence",
					"Recommended action",
				],
				"Template for describing each interpolation step in engineering terms.",
			),
			buildComparisonMatrixArtifact(
				"Style transition comparison matrix",
				[`Pure ${styleA}`, "Mixed midpoint", `Pure ${styleB}`],
				[
					{
						label: "Code shape",
						values: [
							"Stable baseline",
							"Intentional blend",
							"Stable destination",
						],
					},
					{
						label: "Review posture",
						values: [
							"Validate existing convention",
							"Check guardrails and naming",
							"Validate target convention",
						],
					},
					{
						label: "Recommended action",
						values: [
							"Keep as-is",
							"Add transition checklist",
							"Commit the new style",
						],
					},
				],
				"Comparison matrix for deciding whether a gradual blend is safer than a cutover.",
			),
			buildToolChainArtifact(
				"Transition checkpoint evidence chain",
				[
					{
						tool: "style guide or ADR",
						description:
							"Define the endpoint styles and the allowed midpoint explicitly before teams start blending patterns.",
					},
					{
						tool: "review checklist",
						description:
							"Translate each Bloch checkpoint into observable review questions for real files or modules.",
					},
					{
						tool: "migration examples",
						description:
							"Use a small set of canonical before/after examples instead of claiming automated style-state measurement.",
					},
				],
				"Keep Bloch interpolation grounded in written migration policy and concrete review evidence.",
			),
		];

		return createCapabilityResult(
			context,
			`Bloch Interpolator produced ${details.length} style-transition advisory items (${steps} checkpoints, focus: ${focus}).`,
			createFocusRecommendations(
				"Bloch interpolation guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	blochInterpolatorHandler,
);
