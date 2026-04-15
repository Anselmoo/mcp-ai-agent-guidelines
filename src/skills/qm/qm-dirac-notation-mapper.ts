import { z } from "zod";
import { qm_dirac_notation_mapper_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { fmtNum } from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
} from "./qm-physics-helpers.js";

const diracNotationMapperInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			focus: z.enum(["centrality", "duplication", "orthogonality"]).optional(),
			fileCount: z.number().int().min(1).max(50).optional(),
			pairOverlap: z.number().min(-1).max(1).optional(),
			projectionWeight: z.number().min(0).optional(),
		})
		.optional(),
});

const DIRAC_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(overlap|bra.ket|inner.product|gram|projection)\b/i,
		detail:
			"Translate the bra-ket language into a normal engineering question: which files look structurally similar enough that changes in one should trigger inspection of the other? Use the overlap matrix to drive review adjacency, not to claim semantic equivalence.",
	},
	{
		pattern: /\b(central|hub|scaffold|span|core|recur)\b/i,
		detail:
			"High projection weight means a file's patterns recur across the rest of the codebase. Treat those files as architectural scaffolds: add tests and abstraction seams before modifying them because many other files implicitly align to their design choices.",
	},
	{
		pattern: /\b(duplicate|merge|shared.logic|copy|near.duplicate)\b/i,
		detail:
			"Very high pairwise overlap is a duplication signal, not automatically a merge instruction. First check whether the apparent similarity is intentional specialisation. Merge only when the files duplicate behaviour and lifecycle, not merely naming or framework boilerplate.",
	},
	{
		pattern: /\b(orthogon|independent|parallel|safe.to.change)\b/i,
		detail:
			"Near-orthogonal pairs are good candidates for parallel workstreams because they likely represent distinct concerns. Still confirm runtime contracts separately — embedding orthogonality is an advisory signal, not proof of zero coupling.",
	},
	{
		pattern: /\b(50|too.many|large.set|o.n.2|matrix)\b/i,
		detail:
			"Keep the analysis set intentionally small. Once the file set is too broad, the overlap matrix becomes a noisy map of everything and the most actionable signals disappear. Start with one package, one slice of the call graph, or one suspected hotspot cluster.",
	},
];

const diracNotationMapperHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(diracNotationMapperInputSchema, input);
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
				"Dirac Notation Mapper needs files, overlaps, or a question about centrality or duplication. Describe the file set or the kind of overlap relationship you want to inspect.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(file|overlap|bra.ket|inner.product|gram|projection|central|orthogon|duplicate)\b/i.test(
				combined,
			) ||
			parsed.data.options?.pairOverlap !== undefined ||
			parsed.data.options?.projectionWeight !== undefined;

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Dirac Notation Mapper requires an overlap or file-centrality signal — for example pairwise file overlap, projection weight, most central file, or orthogonal file pairs.",
			);
		}

		const focus = parsed.data.options?.focus ?? "centrality";
		const fileCount = parsed.data.options?.fileCount;
		let numericDetail: string | undefined;
		if (
			parsed.data.options?.pairOverlap !== undefined ||
			parsed.data.options?.projectionWeight !== undefined
		) {
			const overlap = parsed.data.options?.pairOverlap ?? 0;
			const weight = parsed.data.options?.projectionWeight;
			const overlapLabel =
				Math.abs(overlap) < 0.2
					? "near-orthogonal"
					: Math.abs(overlap) > 0.8
						? "strongly aligned"
						: "moderately aligned";
			numericDetail = `Illustrative bra-ket reading: ⟨A|B⟩ ≈ ${fmtNum(overlap)} (${overlapLabel}). ${weight !== undefined ? `Projection weight W ≈ ${fmtNum(weight)}. ` : ""}${Math.abs(overlap) > 0.8 ? "Treat this as a likely duplication or shared-pattern review target." : Math.abs(overlap) < 0.2 ? "Treat this pair as mostly independent in this embedding lens." : "Inspect whether the overlap reflects a reusable abstraction or just framework repetition."} Advisory only — confirm with imports, call sites, and ownership before acting.`;
		}

		const details: string[] = [
			`Use the Dirac notation lens to analyse ${focus} across ${fileCount !== undefined ? `${fileCount} files` : "the target file set"}. In plain terms: build an overlap map, identify the files whose patterns recur everywhere, and distinguish true duplication from merely similar scaffolding. Conventional dependency analysis remains the primary source of truth; the bra-ket framing is for surfacing review candidates quickly.`,
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(DIRAC_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Start by selecting one bounded slice of the codebase and ranking files by centrality. Review the top-ranked file first: if it is unstable or poorly named, the cost of future changes will propagate widely.",
				"Use pairwise overlap for two different questions: high overlap to find duplicate or mirrored concerns, and low overlap to identify components that can be split into independent workstreams.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the context to decide whether you care more about central scaffolds, duplicate concerns, or orthogonal work streams. The same overlap matrix supports different actions depending on that goal.",
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleOverlap = parsed.data.options?.pairOverlap ?? 0.87;
		const sampleWeight = parsed.data.options?.projectionWeight ?? 2.4;
		const artifacts = [
			buildWorkedExampleArtifact(
				"Dirac overlap worked example",
				{
					focus,
					fileCount: fileCount ?? 8,
					pairOverlap: sampleOverlap,
					projectionWeight: sampleWeight,
				},
				{
					overlapClass:
						Math.abs(sampleOverlap) > 0.8
							? "strong alignment"
							: Math.abs(sampleOverlap) < 0.2
								? "near orthogonal"
								: "moderate overlap",
					engineeringTranslation:
						Math.abs(sampleOverlap) > 0.8
							? "Review the pair as possible duplication or shared-pattern debt."
							: "Treat the pair as mostly independent until dependency analysis proves otherwise.",
					centralityCue:
						"High projection weight means the file likely acts as a scaffold for neighbouring designs.",
				},
				"Turns bra-ket language into concrete review choices.",
			),
			buildComparisonMatrixArtifact(
				"Dirac mapping decision matrix",
				["Pattern", "Meaning", "Engineering move"],
				[
					{
						label: "High overlap",
						values: [
							"Files align strongly in the embedding",
							"Possible duplication or mirrored design",
							"Compare responsibilities and lifecycle before merging",
						],
					},
					{
						label: "High projection weight",
						values: [
							"One file recurs across the slice",
							"Likely architectural scaffold",
							"Add tests and seam reviews before changing it",
						],
					},
					{
						label: "Near-orthogonal pair",
						values: [
							"Files are structurally distant",
							"Good candidate for parallel work",
							"Confirm runtime contracts separately before splitting ownership",
						],
					},
				],
				"Use this matrix to convert overlap jargon into code-review actions.",
			),
			buildEvalCriteriaArtifact(
				"Dirac mapping checks",
				[
					"Overlap findings are validated with imports, call sites, or ownership data before acting.",
					"High overlap is treated as a review cue, not automatic proof of duplication.",
					"The file set stays bounded enough for the matrix to remain interpretable.",
					"Evidence comes from an existing overlap export or snapshot, not claimed live recomputation.",
				],
				"Criteria for deciding whether the overlap map is actionable.",
			),
		];

		return createCapabilityResult(
			context,
			`Dirac Notation Mapper produced ${details.length} overlap-analysis advisory items (focus: ${focus}).`,
			createFocusRecommendations(
				"Dirac mapping guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	diracNotationMapperHandler,
);
