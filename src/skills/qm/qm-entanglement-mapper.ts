import { z } from "zod";
import { qm_entanglement_mapper_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { fmtNum, vonNeumannEntropy2x2 } from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
} from "./qm-physics-helpers.js";

const entanglementMapperInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			topK: z.number().int().min(1).max(10).optional(),
			fileAProbability: z.number().min(0).max(1).optional(),
			fileBProbability: z.number().min(0).max(1).optional(),
			coChangeProbability: z.number().min(0).max(1).optional(),
		})
		.optional(),
});

const ENTANGLEMENT_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(co.change|co.commit|history|always.change.together|suspiciously)\b/i,
		detail:
			"Co-change is best used as a hidden-coupling detector. It surfaces dependencies that architectural diagrams miss: shared configuration, duplicated business rules, or teams habitually editing two files together because the boundary between them is unclear.",
	},
	{
		pattern: /\b(hidden|implicit|coupl|depend|entangl)\b/i,
		detail:
			"High entanglement is a prompt to make the dependency explicit. Introduce an interface, extract shared logic, or consolidate the pair if they truly cannot evolve independently. Leaving the dependency implicit guarantees future surprise edits.",
	},
	{
		pattern: /\b(runtime|call.graph|import.graph|direct.dependency)\b/i,
		detail:
			"Commit-history entanglement and runtime coupling answer different questions. If the pair rarely changes together but is tightly connected at runtime, use a dependency tool. If the pair changes together without obvious runtime edges, the entanglement result is exactly the signal you need.",
	},
	{
		pattern: /\b(refactor|extract|merge|decouple|interface)\b/i,
		detail:
			"Use the entropy ranking to choose decoupling order. Start with the most entangled pair that still has a tractable boundary: a shared helper, common schema, or duplicated workflow. You do not need to solve all hidden coupling at once.",
	},
];

const entanglementMapperHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(entanglementMapperInputSchema, input);
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
				"Entanglement Mapper needs commit-history or co-change context. Describe which files change together or provide co-change probabilities before requesting hidden-coupling analysis.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(entangl|co.change|co.commit|history|hidden.depend|files.always.change.together|von.neumann)\b/i.test(
				combined,
			) || parsed.data.options?.coChangeProbability !== undefined;

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Entanglement Mapper requires signal about commit-history coupling — for example files that always change together, suspicious co-commits, or hidden dependencies inferred from history.",
			);
		}

		const topK = parsed.data.options?.topK ?? 5;
		let numericDetail: string | undefined;
		const pA = parsed.data.options?.fileAProbability;
		const pB = parsed.data.options?.fileBProbability;
		const pAB = parsed.data.options?.coChangeProbability;
		if (pA !== undefined && pB !== undefined && pAB !== undefined) {
			if (pAB > Math.min(pA, pB)) {
				return buildInsufficientSignalResult(
					context,
					"Entanglement Mapper received inconsistent co-change probabilities.",
					"Ensure the shared co-change probability does not exceed either file's marginal change probability.",
				);
			}
			const entropy = vonNeumannEntropy2x2(pA, pAB, pB);
			const classification =
				entropy > 0.8
					? "maximally entangled"
					: entropy > 0.5
						? "strongly entangled"
						: entropy > 0.2
							? "moderately entangled"
							: "mostly separable";
			numericDetail = `Illustrative co-change entropy: S(ρ) ≈ ${fmtNum(entropy)} from marginals ${fmtNum(pA)} / ${fmtNum(pB)} with shared probability ${fmtNum(pAB)}. Classification: ${classification}. ${entropy > 0.5 ? "This pair deserves boundary review because historical changes suggest it is not being maintained independently." : "This pair does not look like a top hidden-coupling hotspot in this lens."} Treat the entropy as advisory evidence from history, not as semantic proof.`;
		}

		const details: string[] = [
			`Use the entanglement lens to surface the top ${topK} hidden co-change hotspots. In plain engineering terms: look for file pairs that repeatedly move together in commit history even when the dependency is not obvious from imports or architecture docs. Those pairs are prime candidates for explicit interface work, consolidation, or ownership clarification.`,
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(ENTANGLEMENT_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Start with one repository slice and ask which file pairs are changed together far more often than expected. That shortlist is more actionable than a full-repo ranking with hundreds of weak correlations.",
				"After refactoring a pair, re-check the next few sprints of history. The goal is not zero co-change; it is to remove unnecessary and surprising co-change.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided history context to separate intentional co-change from accidental coupling. Release-related commits, broad codemods, or mechanical renames should not be treated as the same signal as repeated feature-level co-change.",
			);
		}

		details.push(QM_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildWorkedExampleArtifact(
				"Entanglement analysis worked example",
				{
					fileAProbability: pA ?? 0.6,
					fileBProbability: pB ?? 0.5,
					coChangeProbability: pAB ?? 0.3,
					topK,
				},
				{
					entropy:
						pA !== undefined && pB !== undefined && pAB !== undefined
							? fmtNum(vonNeumannEntropy2x2(pA, pAB, pB))
							: "0.53",
					engineeringTranslation:
						"These files behave like a coupled pair: they should either share a deliberate boundary or be separated so the dependency becomes explicit.",
					confidence: "medium",
					recommendedAction:
						"Check whether a shared helper, schema, or ownership boundary explains the repeated co-change.",
				},
				"Worked example: turn co-change probabilities into a boundary recommendation and confidence statement.",
			),
			buildComparisonMatrixArtifact(
				"Entanglement interpretation matrix",
				["Low coupling", "Moderate coupling", "High coupling"],
				[
					{
						label: "History signal",
						values: [
							"Rare joint edits",
							"Some shared edits",
							"Repeated co-commits",
						],
					},
					{
						label: "Engineering translation",
						values: [
							"Likely independent",
							"Watch for overlap",
							"Boundary is unclear",
						],
					},
					{
						label: "Recommended action",
						values: [
							"No immediate work",
							"Review the shared path",
							"Extract or formalise the boundary",
						],
					},
				],
				"Comparison matrix for distinguishing incidental co-change from architectural entanglement.",
			),
			buildToolChainArtifact(
				"Entanglement analysis chain",
				[
					{
						tool: "git log --name-only",
						description: "collect the candidate file pairs from recent history",
					},
					{
						tool: "filter mechanical commits",
						description:
							"remove rename, release, and codemod noise before scoring",
					},
					{
						tool: "rank co-change pairs",
						description:
							"identify the shortlist of likely hidden-coupling hotspots",
					},
					{
						tool: "check runtime imports",
						description:
							"separate semantic coupling from pure history correlation",
					},
				],
				"Tool chain for turning commit history into an actionable entanglement review.",
			),
		];

		return createCapabilityResult(
			context,
			`Entanglement Mapper produced ${details.length} hidden-coupling advisory items (topK: ${topK}).`,
			createFocusRecommendations(
				"Entanglement mapping guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	entanglementMapperHandler,
);
