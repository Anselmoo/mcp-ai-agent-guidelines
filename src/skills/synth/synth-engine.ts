import { z } from "zod";
import { synth_engine_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const synthEngineInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			summaryDepth: z.enum(["brief", "standard", "comprehensive"]).optional(),
			extractInsights: z.boolean().optional(),
		})
		.optional(),
});

type SummaryDepth = "brief" | "standard" | "comprehensive";

function buildSynthesisExample(extractInsights: boolean) {
	return {
		audience: "Decision review group",
		evidenceLedger: [
			"Architecture benchmark report",
			"Production incident notes",
			"Design review summary",
		],
		...(extractInsights
			? {
					insights: [
						{
							claim:
								"Operational complexity, not retrieval accuracy, is the primary bottleneck.",
							sources: [
								"Architecture benchmark report",
								"Production incident notes",
							],
							reasoning:
								"Both sources point to retry storms and unclear ownership as the failure mode.",
						},
					],
				}
			: {
					themes: [
						{
							name: "Operational bottlenecks",
							sources: [
								"Architecture benchmark report",
								"Production incident notes",
							],
							summary:
								"Evidence clusters around latency spikes and unclear recovery ownership.",
						},
					],
				}),
		conflicts: [
			{
				description:
					"Offline benchmark results disagree with production latency observations.",
				sources: ["Architecture benchmark report", "Production incident notes"],
			},
		],
		gaps: ["No benchmark yet on multilingual queries"],
		nextHandoff: "Use synth-recommendation once the synthesis is accepted.",
	};
}

const SYNTHESIS_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(synthes|distil|summar|condense|extract|consolidate)\b/i,
		detail:
			"Separate synthesis from aggregation: synthesis produces a new insight that was not present in any single source; aggregation produces a list. If the output is a list of source summaries, that is aggregation — the synthesis step that produces novel understanding has not yet been performed.",
	},
	{
		pattern: /\b(source|evidence|material|document|paper|data|finding)\b/i,
		detail:
			"Treat source quality as a synthesis input, not a post-hoc caveat. Before synthesising, classify each source by evidence quality (primary data, reviewed synthesis, expert opinion, anecdote). The synthesis output should reflect the quality distribution of its source set — high-quality synthesis from low-quality sources is not high-quality synthesis.",
	},
	{
		pattern: /\b(insight|theme|pattern|finding|conclusion|takeaway)\b/i,
		detail:
			"Label each insight with the sources that support it and the reasoning step that produced it. Unsourced insights in a synthesis output are indistinguishable from hallucination to a downstream consumer who did not participate in the synthesis process.",
	},
	{
		pattern: /\b(conflict|contradict|disagree|inconsist|tension|diverge)\b/i,
		detail:
			"Preserve conflicting signals in the synthesis output — do not silently resolve conflicts by choosing the majority position. Surface the conflict, identify the sources on each side, and let the downstream consumer (or synth-recommendation) make the resolution decision with full visibility of the disagreement.",
	},
	{
		pattern: /\b(structure|organise|format|schema|section|heading|outline)\b/i,
		detail:
			"Define the synthesis output structure before starting. A predefined schema prevents the synthesis from expanding to fill available space. Structure also makes the output directly reusable by downstream steps (documentation, recommendations) without reformatting.",
	},
	{
		pattern: /\b(gap|missing|not covered|unanswered|incomplete|unknown)\b/i,
		detail:
			"Include a gaps section in every synthesis output: topics the sources did not address, questions that remain open after synthesis, and areas where source coverage was too thin to support a confident insight. Synthesis that omits its gaps presents false completeness.",
	},
	{
		pattern: /\b(bias|perspective|limit|caveat|assumption|scope)\b/i,
		detail:
			"State the synthesis scope and its limitations. Every synthesis is bounded by its source set, the time window of the material, and the framing of the original research question. Omitting these bounds makes the synthesis appear more universally applicable than it is.",
	},
];

const depthDescriptions: Record<SummaryDepth, string> = {
	brief:
		"brief — one to three key insights per major theme; suitable for executive summaries",
	standard:
		"standard — full insight extraction with source attribution; suitable for decision support",
	comprehensive:
		"comprehensive — full insight extraction, conflict analysis, gaps, and limitations; suitable for reference documents",
};

const synthEngineHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(synthEngineInputSchema, input);
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
				"Synthesis Engine needs the source material, research topic, or key themes before it can produce a structured synthesis. Provide: (1) the material to synthesise or a description of it, (2) the intended audience or use, (3) the output format needed, (4) any existing specs, code, or benchmarks that should be reconciled.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const summaryDepth =
			parsed.data.options?.summaryDepth ??
			(signals.complexity === "complex" ? "comprehensive" : "standard");
		const extractInsights = parsed.data.options?.extractInsights ?? true;
		const needsResearchHandoff =
			/\b(gather|collect|find sources|research more|search)\b/i.test(combined);
		const needsRecommendationHandoff =
			/\b(recommend|choose|select|best option|what should we do)\b/i.test(
				combined,
			);

		const details: string[] = [
			`Synthesise material about "${summarizeKeywords(parsed.data).join(", ") || "the provided topic"}" at ${depthDescriptions[summaryDepth]}. The synthesis must produce new understanding that was not visible in any individual source — an ordered list of source summaries is aggregation, not synthesis.`,
			"Begin with the reference intake: user goal, current state, constraints, and the existing artifact set (specs, code, benchmarks, prior research). Synthesis quality depends on reconciling what already exists, not treating every request as greenfield.",
		];

		details.push(
			...SYNTHESIS_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (extractInsights) {
			details.push(
				"Extract insights as distinct, labelled claims: each insight should be one sentence, sourced to at least one piece of evidence, and separable from the other insights in the list. Insights that cannot be stated as a single claim without sub-clauses are composite insights — split them.",
			);
		} else {
			details.push(
				"Do not emit free-floating insight claims when insight extraction is disabled. Use theme-level summaries, an evidence ledger, and open questions so the synthesis stays structured without pretending to be a claim-by-claim inference pass.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints to the synthesis scope and output format: ${signals.constraintList.slice(0, 3).join("; ")}. Synthesis output that violates its own format constraints requires downstream reformatting — a cost that multiplies across every consumer of the synthesis.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the synthesis to directly support the stated deliverable: "${parsed.data.deliverable}". Structure sections and insight labels so they map to the deliverable's required sections — a synthesis that requires significant re-framing to fit its target deliverable was structured for the wrong purpose.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Evaluate the synthesis output against the success criteria before treating it as complete: "${parsed.data.successCriteria}". A synthesis that does not satisfy its criteria should be flagged as incomplete rather than delivered with caveats.`,
			);
		}

		if (signals.hasContext || signals.hasEvidence) {
			details.push(
				summarizeContextEvidence(signals) ??
					"Use the provided context to calibrate the synthesis: avoid re-stating what the context already establishes, and focus synthesis effort on extending or qualifying the contextual knowledge with new insights from the source material.",
			);
		}

		if (needsResearchHandoff) {
			details.push(
				"If the source set is still incomplete, gather the missing evidence before finishing the synthesis. Synthesis should reconcile a bounded set of material; when the request is still in collection mode, route the missing-source work to research first.",
			);
		}

		if (needsRecommendationHandoff) {
			details.push(
				"Stop at decision-ready findings and hand the final choice to recommendation framing. Synthesis should preserve evidence, conflicts, and gaps so the recommendation step can state rationale and confidence without redoing the synthesis.",
			);
		}

		details.push(
			"End the synthesis with a recommendation-ready handoff: list the strongest supported finding, the most important unresolved conflict, the top evidence gap, and the next consumer of the synthesis output.",
		);

		// --- Artifact Construction ---
		const artifacts = [];
		const synthesisTemplate = extractInsights
			? `{
  "insights": [
    { "claim": string, "sources": string[], "reasoning": string }
  ],
  "conflicts": [
    { "description": string, "sources": string[] }
  ],
  "gaps": string[],
  "limitations": string[],
  "nextHandoff": string
}`
			: `{
  "themes": [
    { "name": string, "sources": string[], "summary": string }
  ],
  "evidenceLedger": string[],
  "conflicts": [
    { "description": string, "sources": string[] }
  ],
  "gaps": string[],
  "limitations": string[],
  "nextHandoff": string
}`;
		const synthesisFields = extractInsights
			? ["insights", "conflicts", "gaps", "limitations", "nextHandoff"]
			: [
					"themes",
					"evidenceLedger",
					"conflicts",
					"gaps",
					"limitations",
					"nextHandoff",
				];
		const synthesisCriteria = extractInsights
			? [
					"Each insight is novel (not present in any single source)",
					"Every insight is sourced and reasoned",
					"Conflicts are surfaced, not resolved prematurely",
					"Gaps and limitations are explicitly listed",
					"The synthesis names the next handoff or consumer",
				]
			: [
					"Theme summaries reconcile multiple sources without pretending to be standalone claims",
					"An evidence ledger preserves what material the synthesis is built from",
					"Conflicts are surfaced, not resolved prematurely",
					"Gaps and limitations are explicitly listed",
					"The synthesis names the next handoff or consumer",
				];

		// Output template for structured synthesis
		artifacts.push(
			buildOutputTemplateArtifact(
				"Synthesis Output Template",
				synthesisTemplate,
				synthesisFields,
				"Structured output for synthesized findings, conflicts, gaps, limitations, and downstream handoff.",
			),
		);

		artifacts.push(
			buildToolChainArtifact(
				"Synthesis chain",
				[
					{
						tool: "source inventory",
						description:
							"classify the source set and note which specs, code, or benchmarks must be reconciled",
					},
					{
						tool: "evidence quality pass",
						description:
							"label each source as primary, reviewed, or heuristic before synthesising",
					},
					{
						tool: extractInsights
							? "insight extraction"
							: "theme consolidation",
						description: extractInsights
							? "convert cross-source reasoning into explicit insight claims with source anchors"
							: "group the evidence into stable themes and preserve an evidence ledger",
					},
					{
						tool: "handoff packaging",
						description:
							"publish conflicts, gaps, and the next consumer for recommendation or documentation",
					},
				],
				"Concrete sequence for producing a synthesis that is traceable and ready for downstream consumption.",
			),
		);

		artifacts.push(
			buildWorkedExampleArtifact(
				"Synthesis example",
				{
					request:
						"synthesise these benchmark notes and design reviews into a decision support summary",
					context:
						"we need findings that an architecture review board can use without rereading the source packet",
					options: { summaryDepth: "standard", extractInsights },
				},
				buildSynthesisExample(extractInsights),
				"Worked example showing the expected output shape when synthesis is grounded in multiple evidence sources.",
			),
		);

		// Synthesis evaluation criteria
		artifacts.push(
			buildEvalCriteriaArtifact(
				"Synthesis Quality Criteria",
				synthesisCriteria,
				"Criteria for evaluating the quality of synthesis outputs.",
			),
		);

		return createCapabilityResult(
			context,
			`Synthesis Engine produced ${details.length} synthesis guardrail${details.length === 1 ? "" : "s"} (depth: ${summaryDepth}, insights: ${extractInsights ? "enabled" : "disabled"}).`,
			createFocusRecommendations(
				"Synthesis guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(skillManifest, synthEngineHandler);
