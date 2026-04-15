import { z } from "zod";
import { synth_research_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	summarizeKeywords,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import {
	extractRequestSignals,
	summarizeContextEvidence,
} from "../shared/recommendations.js";

// ISOLATION CONTRACT: synth-research gathers and structures information.
// It does NOT compare alternatives, produce recommendations, or synthesise
// multi-source evidence into insights.  Those responsibilities belong to
// synth-comparative, synth-recommendation, and synth-engine respectively.
// Anti-trigger phrases for this skill:
//   "synthesise the gathered material (use core-synthesis-engine)"
//   "compare options (use core-comparative-analysis)"
const synthResearchInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			researchDepth: z.enum(["shallow", "standard", "deep"]).optional(),
			maxSources: z.number().int().positive().max(20).optional(),
		})
		.passthrough()
		.optional(),
});

type ResearchDepth = "shallow" | "standard" | "deep";

function buildResearchExample(maxSources: number) {
	return {
		researchQuestion:
			"Which vector-store options are viable for a production RAG system?",
		subQuestions: [
			"Which products meet scale and latency requirements?",
			"What benchmark evidence exists for hybrid search quality?",
			"What operational constraints or lock-in risks are documented?",
		],
		maxSources,
		sources: [
			{
				title: "Official benchmark report",
				locator: "vendor-benchmark-2024",
				quality: "primary",
				subQuestion:
					"What benchmark evidence exists for hybrid search quality?",
			},
		],
		gaps: ["No neutral benchmark found for multilingual workloads"],
		downstreamHandoff: "synth-comparative once the evidence table is complete",
	};
}

const RESEARCH_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(gather|collect|find|search|source|retrieve|look up)\b/i,
		detail:
			"Structure gathering around a defined search scope before collecting sources. An unbounded research query produces a long list of tangentially related material. Define: (1) the specific question the research must answer, (2) the source types that are authoritative for that question, (3) the recency threshold below which a source is too stale.",
	},
	{
		pattern: /\b(topic|subject|area|domain|field|about)\b/i,
		detail:
			"Decompose the research topic into sub-questions before gathering. Each sub-question should have an answerable scope — broad topic labels are not researchable units. For each sub-question, identify the expected evidence form (benchmark, case study, specification, expert opinion) so sources can be evaluated against it.",
	},
	{
		pattern: /\b(source|reference|citation|link|paper|article|doc)\b/i,
		detail:
			"Record source metadata alongside content: origin, publication date, author or organisation, and credibility signals. Research output that omits source metadata cannot be validated, audited, or cited in downstream documents. Source metadata is a first-class output, not an annotation.",
	},
	{
		pattern: /\b(organise|structure|categorise|group|classify|sort|tag)\b/i,
		detail:
			"Organise gathered material into a stable taxonomy before passing it downstream. An unstructured dump of sources is not research output — it is raw material. The taxonomy should reflect the sub-questions defined at the start, so each bucket of organised material answers one identifiable question.",
	},
	{
		pattern: /\b(gap|missing|not found|unavailable|unknown|incomplete)\b/i,
		detail:
			"Document gaps explicitly: topics where no authoritative sources were found, questions that remain unanswered after gathering, and areas where coverage is too thin to support a downstream synthesis. Gaps are first-class research output — they prevent downstream over-confidence.",
	},
	{
		pattern:
			/\b(quality|credib|reliab|trust|authorit|valid|primary|secondary)\b/i,
		detail:
			"Assess source quality before including it in the organised output. Use a simple three-level scheme: primary (direct evidence, first-party data), secondary (reviewed synthesis of primary sources), tertiary (overview, aggregated, potentially stale). Downstream synthesis is only as reliable as the quality distribution of the source set.",
	},
	{
		pattern: /\b(scope|bound|limit|focus|narrow|broad|depth|breadth)\b/i,
		detail:
			"Confirm the research scope before starting the gathering pass. Scope creep during research is especially costly because each out-of-scope source triggers further branching. Fix the scope boundary in a written statement, share it with the requester, and gather only what falls inside it.",
	},
];

const depthDescriptions: Record<ResearchDepth, string> = {
	shallow:
		"shallow — overview sources only; suitable for background framing and scoping",
	standard:
		"standard — primary and secondary sources; suitable for decision-support research",
	deep: "deep — primary, secondary, and grey literature; suitable for comprehensive evidence bases",
};

const synthResearchHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(synthResearchInputSchema, input);
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
				"Research Assistant needs a research topic, question, or scope before it can structure a gathering plan. Provide: (1) the research question or topic, (2) the intended use of the gathered material, (3) any known source constraints, (4) any existing specs, code, or benchmarks already in hand.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const researchDepth =
			parsed.data.options?.researchDepth ??
			(signals.complexity === "complex" ? "deep" : "standard");
		const maxSources = parsed.data.options?.maxSources ?? 8;
		const needsSynthesisHandoff =
			/\b(synthes|distil|summary|insight|turn this research into)\b/i.test(
				combined,
			);
		const needsComparisonHandoff =
			/\b(compare|versus|vs|trade study|rank|best option)\b/i.test(combined);

		const details: string[] = [
			`Gather and organise material on "${summarizeKeywords(parsed.data).join(", ") || "the research topic"}" using ${depthDescriptions[researchDepth]}. Cap the source set at ${maxSources} high-quality sources — research quality is determined by source relevance and credibility, not by volume.`,
			"Start from the reference intake: user goal, current state, constraints, and any existing specs, code, or benchmarks that should be treated as seed evidence. Research should extend what is already known, not ignore it.",
		];

		details.push(
			...RESEARCH_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (signals.hasConstraints) {
			details.push(
				signals.hasEvidence
					? `Apply the stated constraints as filters over the retrieved evidence set: ${signals.constraintList.slice(0, 3).join("; ")}. Validate which attached sources survive those filters before opening new searches, so the research pass starts from grounded material instead of generic restatement.`
					: `Apply the stated constraints as source-selection filters: ${signals.constraintList.slice(0, 3).join("; ")}. Sources that violate constraints should be excluded from the organised output rather than flagged — the downstream consumer should not need to re-apply filters that were known at gathering time.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Structure the gathered material to support the stated deliverable: "${parsed.data.deliverable}". Organise sources by the sub-questions that the deliverable must answer — this makes the handoff to synthesis or documentation directly usable without re-organisation.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Use the success criteria to decide when the evidence packet is complete: "${parsed.data.successCriteria}". Research gathering is done only when every success criterion has an identifiable source, gap note, or follow-up search plan.`,
			);
		}

		if (signals.hasContext || signals.hasEvidence) {
			details.push(
				summarizeContextEvidence(signals) ??
					"Use the provided context to scope the research: identify what is already known so the gathering pass focuses on gaps, not on re-confirming established facts. Research that duplicates existing knowledge wastes capacity that should go to filling genuine gaps.",
			);
		}

		details.push(
			"Hand off the organised, gap-annotated source set to synth-engine for synthesis or to synth-comparative for option comparison. Do not synthesise or compare within this research step — premature synthesis during gathering introduces selection bias toward sources that support early-forming conclusions.",
		);

		if (needsSynthesisHandoff) {
			details.push(
				"The request already points toward synthesis. Keep this step focused on building the evidence packet, then route the organised material to synth-engine rather than collapsing gathering and synthesis into one pass.",
			);
		}

		if (needsComparisonHandoff) {
			details.push(
				"The request already points toward option comparison. Gather source-backed facts here, but reserve the scoring, ranking, and weighting work for synth-comparative once the evidence table is complete.",
			);
		}

		details.push(
			"End with a research packet contract: question map, source register, taxonomy, explicit gaps, and the named downstream skill that should consume the packet next. That handoff keeps the gathering step from drifting into generic advice.",
		);

		// --- Artifact Construction ---
		const artifacts = [];

		// Output template for structured research evidence
		artifacts.push(
			buildOutputTemplateArtifact(
				"Research Evidence Table Template",
				`{
  "researchQuestion": string,
  "subQuestions": string[],
  "sources": [
    { "title": string, "author": string, "date": string, "type": string, "quality": string, "locator": string, "subQuestion": string, "summary": string }
  ],
  "gaps": string[],
  "taxonomy": string[],
  "downstreamHandoff": string
}`,
				[
					"researchQuestion",
					"subQuestions",
					"sources",
					"gaps",
					"taxonomy",
					"downstreamHandoff",
				],
				"Structured output for organized research evidence, source metadata, gaps, taxonomy, and handoff.",
			),
		);

		artifacts.push(
			buildToolChainArtifact(
				"Research gathering chain",
				[
					{
						tool: "question decomposition",
						description:
							"split the topic into answerable sub-questions with explicit source types",
					},
					{
						tool: "seed evidence review",
						description:
							"inspect any supplied specs, code, or benchmarks before opening new searches",
					},
					{
						tool: "source register",
						description:
							"capture metadata, quality, and taxonomy for each accepted source",
					},
					{
						tool: "gap and handoff packaging",
						description:
							"publish unanswered questions and the downstream consumer for the evidence packet",
					},
				],
				"Concrete sequence for producing a bounded, auditable research packet.",
			),
		);

		artifacts.push(
			buildWorkedExampleArtifact(
				"Research gathering example",
				{
					request:
						"gather research on vector database options for a production retrieval system",
					context:
						"we already have one vendor benchmark and need an evidence packet for a trade study",
					options: { researchDepth: "standard", maxSources },
				},
				buildResearchExample(maxSources),
				"Worked example showing the expected structure of a research packet before synthesis or comparison begins.",
			),
		);

		// Research evaluation criteria
		artifacts.push(
			buildEvalCriteriaArtifact(
				"Research Quality Criteria",
				[
					"The research question and sub-questions are explicit.",
					"Sources are relevant and credible",
					"Source metadata is complete",
					"Gaps are explicitly documented",
					"Material is organized by sub-question or taxonomy",
					"The packet names the downstream handoff",
				],
				"Criteria for evaluating the quality of research evidence outputs.",
			),
		);

		return createCapabilityResult(
			context,
			`Research Assistant planned ${details.length} gathering guardrail${details.length === 1 ? "" : "s"} (depth: ${researchDepth}, max sources: ${maxSources}).`,
			createFocusRecommendations(
				"Research guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	synthResearchHandler,
);
