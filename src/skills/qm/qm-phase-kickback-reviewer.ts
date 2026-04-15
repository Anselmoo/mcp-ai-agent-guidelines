import { z } from "zod";
import { qm_phase_kickback_reviewer_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
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
import { fmtNum } from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
} from "./qm-physics-helpers.js";

const phaseFileSchema = z.object({
	name: z.string().min(1),
	tokenCount: z.number().int().min(5).max(50000),
	phase: z.number().min(-1).max(1),
});

const phaseKickbackReviewerInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			probeDimension: z.number().int().min(16).max(512).optional(),
			files: z.array(phaseFileSchema).min(1).max(10).optional(),
		})
		.optional(),
});

const PHASE_KICKBACK_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> =
	[
		{
			pattern: /\b(dominant|invariant|template|strongest.signal|carrier)\b/i,
			detail:
				"The dominant file is a candidate architectural template, not automatically the best-written file. It is simply the one whose structural choices recur most strongly. Review whether that template is actually the design you want the rest of the codebase to copy.",
		},
		{
			pattern: /\b(phase|probe|cosine|alignment)\b/i,
			detail:
				"Use probe alignment as a quick triage tool when reading everything deeply is too expensive. It is especially useful for deciding which few files deserve close review first in a large slice of code.",
		},
		{
			pattern: /\b(competing|opposite|sign|vision|inconsistent)\b/i,
			detail:
				"Strong files with opposite phase signs suggest the codebase may contain competing architectural visions. That is usually a leadership and review-policy problem before it is a refactoring problem.",
		},
		{
			pattern: /\b(small|few.tokens|utility|noisy)\b/i,
			detail:
				"Small files are noisy carriers. Do not over-interpret a strong phase score from a tiny utility file unless it is repeatedly corroborated by neighbouring files in the same slice.",
		},
	];

const phaseKickbackReviewerHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(phaseKickbackReviewerInputSchema, input);
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
				"Phase Kickback Reviewer needs a question about dominant architecture, invariant-carrying files, or probe-style triage.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(phase|kickback|probe|dominant|architecture|invariant|carrier|strongest.signal)\b/i.test(
				combined,
			) || parsed.data.options?.files !== undefined;

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Phase Kickback Reviewer requires architecture-phase signal — for example dominant file, architectural invariant, or probe-based triage.",
			);
		}

		const rankedFiles = parsed.data.options?.files
			? [...parsed.data.options.files].sort(
					(left, right) => Math.abs(right.phase) - Math.abs(left.phase),
				)
			: [];
		const probeDimension = parsed.data.options?.probeDimension ?? 128;
		let numericDetail: string | undefined;
		if (rankedFiles.length > 0) {
			const dominant = rankedFiles[0];
			if (dominant) {
				numericDetail = `Illustrative probe ranking with d=${probeDimension}. Dominant carrier: ${dominant.name} with phase ${fmtNum(dominant.phase)} and |phase| ${fmtNum(Math.abs(dominant.phase))}. ${Math.abs(dominant.phase) > 0.3 ? "Treat this file as a strong architectural template candidate." : "No file shows a particularly strong invariant signal; the slice may be architecturally diffuse."} Probe scores remain advisory and should be validated with code review.`;
			}
		}

		const details: string[] = [
			`Use phase kickback as a fast architectural triage lens with probe dimension ${probeDimension}. In plain terms: identify which file carries the clearest structural signal, then review whether that file represents the architecture you actually want to standardise around. This is supplementary to deeper design review, but useful for narrowing where to start.`,
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(PHASE_KICKBACK_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Use this skill when you need a short list of files to inspect first, not when you need a final architecture verdict. It narrows the search space; it does not replace reading the code.",
				"Compare the top-ranked files by ownership and layer. If the dominant carriers all come from the same slice, that slice likely sets the architectural tone for the rest of the system.",
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleFiles =
			rankedFiles.length > 0
				? rankedFiles
				: [
						{ name: "router.ts", tokenCount: 420, phase: 0.41 },
						{ name: "controller.ts", tokenCount: 360, phase: 0.28 },
						{ name: "helpers.ts", tokenCount: 90, phase: 0.05 },
					];
		const sampleDominant = sampleFiles[0];
		const artifacts = [
			buildWorkedExampleArtifact(
				"Phase kickback worked example",
				{
					probeDimension,
					files: sampleFiles.map(({ name, tokenCount, phase }) => ({
						name,
						tokenCount,
						phase,
					})),
				},
				{
					dominantCarrier: sampleDominant?.name ?? "router.ts",
					dominantPhase: fmtNum(Math.abs(sampleDominant?.phase ?? 0.41)),
					engineeringTranslation:
						"Review the strongest carrier first because its structure is the most likely to be copied elsewhere.",
				},
				"Turns probe scores into a concrete review ordering.",
			),
			buildComparisonMatrixArtifact(
				"Phase review action matrix",
				["Signal", "Interpretation", "Recommended move"],
				[
					{
						label: "High-magnitude carrier",
						values: [
							"One file dominates the probe response",
							"Treat it as the architectural template candidate",
							"Inspect naming, tests, and seams before wider edits",
						],
					},
					{
						label: "Opposite-sign strong files",
						values: [
							"Two architectural visions coexist",
							"Expect review disagreement or duplicated patterns",
							"Resolve ownership and preferred pattern explicitly",
						],
					},
					{
						label: "Low-signal slice",
						values: [
							"No file strongly carries the invariant",
							"The area may be diffuse or under-structured",
							"Narrow the slice before drawing architecture conclusions",
						],
					},
				],
				"Use this matrix to translate probe output into the next engineering action.",
			),
			buildEvalCriteriaArtifact(
				"Phase kickback review checks",
				[
					"The dominant carrier is reviewed with actual code context before standardising around it.",
					"Small utility files are not over-weighted without corroborating neighbours.",
					"Competing high-phase files are treated as governance or consistency issues, not only refactor issues.",
					"Evidence comes from existing snapshots or reports rather than claimed live runtime computation.",
				],
				"Criteria for deciding whether the phase signal is strong enough to steer review order.",
			),
			buildToolChainArtifact(
				"Architecture signal evidence chain",
				[
					{
						tool: "embedding or similarity snapshot",
						description:
							"Use the existing snapshot that produced the phase scores instead of claiming fresh live recomputation.",
					},
					{
						tool: "dependency or call graph",
						description:
							"Check whether the dominant carrier also sits in a central structural position.",
					},
					{
						tool: "targeted code review",
						description:
							"Verify that the carrier represents the architecture you want copied elsewhere.",
					},
				],
				"Ground the metaphor in concrete review evidence.",
			),
		];

		return createCapabilityResult(
			context,
			`Phase Kickback Reviewer produced ${details.length} architectural-signal advisory items (probe dimension: ${probeDimension}).`,
			createFocusRecommendations(
				"Phase-kickback guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	phaseKickbackReviewerHandler,
);
