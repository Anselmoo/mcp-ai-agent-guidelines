import { z } from "zod";
import { orch_result_synthesis_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
	summarizeKeywords,
} from "../shared/handler-helpers.js";
import {
	type BaseSkillInput,
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const orchResultSynthesisInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			conflictResolution: z
				.enum(["consensus", "priority", "merge", "escalate"])
				.optional(),
			deduplicationStrategy: z.enum(["exact", "semantic", "none"]).optional(),
			includeConfidenceScoring: z.boolean().optional(),
		})
		.optional(),
});

type ConflictResolution = "consensus" | "priority" | "merge" | "escalate";
type ResultSynthesisInput = BaseSkillInput & {
	options?: {
		conflictResolution?: ConflictResolution;
		deduplicationStrategy?: "exact" | "semantic" | "none";
		includeConfidenceScoring?: boolean;
	};
};

const SYNTHESIS_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(conflict|contradict|disagree|inconsist|mismatch|diverge)\b/i,
		detail:
			"Detect conflicts before merging: compare key claims across agent outputs and flag any that contradict each other. Silently merging conflicting outputs produces a result that looks authoritative but is internally inconsistent.",
	},
	{
		pattern: /\b(duplicate|redundant|repeat|overlap|same|identical)\b/i,
		detail:
			"Deduplicate before synthesising. Agents producing overlapping outputs under different phrasing inflate the apparent confidence of shared claims. Surface only unique contributions and mark their source.",
	},
	{
		pattern: /\b(confidence|certainty|weight|score|rank|quality|reliable)\b/i,
		detail:
			"Assign a confidence score to each agent contribution based on evidence quality, source recency, and inter-agent agreement. Synthesised outputs that do not surface confidence levels hide the uncertainty carried forward from individual agents.",
	},
	{
		pattern: /\b(source|provenance|trace|attribut|cite|origin|which agent)\b/i,
		detail:
			"Preserve source attribution in the synthesised output: every non-trivial claim should trace back to the agent that produced it. Attribution is essential for post-hoc debugging and for human reviewers who need to verify the most impactful claims.",
	},
	{
		pattern: /\b(gap|missing|incomplete|partial|unknown|unanswered)\b/i,
		detail:
			"Explicitly identify gaps: claims that no agent addressed, questions that remain open, and areas where coverage was partial. A synthesis that omits its gaps presents false completeness to the consumer.",
	},
	{
		pattern: /\b(format|structure|schema|shape|template|output)\b/i,
		detail:
			"Define the output schema before synthesis begins. Agents that produce output in incompatible formats force the synthesiser to perform format conversion under time pressure, which is where data is most often lost or distorted.",
	},
	{
		pattern: /\b(priorit|weight|import|rank|order|relevance|top)\b/i,
		detail:
			"Apply a priority ranking to resolve claims that cannot be merged: prefer the output from the agent whose capability boundary most directly covers the claim domain. Document the ranking rule so it can be audited and changed.",
	},
];

function inferConflictResolution(
	input: string,
	explicit?: ConflictResolution,
): ConflictResolution {
	if (explicit !== undefined) return explicit;
	if (/\b(escalat|human|review|manual|approve)\b/i.test(input))
		return "escalate";
	if (/\b(priorit|weight|rank|first|prefer|authorit)\b/i.test(input))
		return "priority";
	if (/\b(merge|blend|combine|integrat|unif)\b/i.test(input)) return "merge";
	return "consensus";
}

const conflictResolutionDescriptions: Record<ConflictResolution, string> = {
	consensus:
		"Consensus: accept a claim only when a majority of agents agree; flag minority positions as dissenting notes.",
	priority:
		"Priority: accept the claim from the highest-ranked agent for that capability domain; document which agent was authoritative and why.",
	merge:
		"Merge: combine complementary claims into a unified statement; preserve all contributing agent sources in an attribution footnote.",
	escalate:
		"Escalate: surface all conflicting claims to the caller unresolved with a recommendation for human judgement rather than forcing an automated resolution.",
};

function buildSynthesisPacket(
	input: ResultSynthesisInput,
	conflictResolution: ConflictResolution,
	deduplicationStrategy: "exact" | "semantic" | "none",
	includeConfidenceScoring: boolean,
) {
	return {
		targetDeliverable: input.deliverable ?? "final synthesis packet",
		decisionLog: {
			conflictResolution,
			deduplicationStrategy,
			confidenceScoring: includeConfidenceScoring,
		},
		outputSchema: {
			executiveAnswer: "single merged answer for the caller",
			claims: [
				{
					claim: "canonical merged claim",
					sources: ["agent-1", "agent-2"],
					confidence: includeConfidenceScoring ? "high" : "not scored",
					disposition:
						conflictResolution === "escalate"
							? "held for human review"
							: "accepted into final synthesis",
				},
			],
			dissentingClaims: [
				{
					claim: "claim that could not be merged cleanly",
					sources: ["agent-3"],
					resolution:
						conflictResolution === "priority"
							? "retained as dissent after authoritative claim wins"
							: "preserved for review",
				},
			],
			gaps: [
				{
					question: "What remains unverified?",
					impact: "final synthesis may still be incomplete",
				},
			],
		},
		mergeSteps: [
			"Normalize claims into a canonical schema before deduplication",
			"Run conflict detection before emitting final claims",
			"Attach provenance and confidence to every retained claim",
			"Publish dissent and gaps instead of hiding them in prose",
		],
	};
}

const orchResultSynthesisHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(orchResultSynthesisInputSchema, input);
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
				"Result Synthesis needs the agent outputs to merge, the conflict resolution strategy, or the target output format before it can produce a synthesis plan.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const conflictResolution = inferConflictResolution(
			combined,
			parsed.data.options?.conflictResolution,
		);
		const deduplicationStrategy =
			parsed.data.options?.deduplicationStrategy ??
			(/\b(semantic|meaning|similar|near)\b/i.test(combined)
				? "semantic"
				: "exact");
		const includeConfidenceScoring =
			parsed.data.options?.includeConfidenceScoring ?? true;

		const details: string[] = [
			`Synthesise agent outputs for "${summarizeKeywords(parsed.data).join(", ") || "the requested task"}" using ${conflictResolution} conflict resolution and ${deduplicationStrategy} deduplication. ${conflictResolutionDescriptions[conflictResolution]}`,
			"Build the synthesis as a claim ledger, not a prose summary: every retained claim should carry its source agents, confidence, merge disposition, and any dissent or gaps that survived reconciliation.",
		];

		details.push(
			...SYNTHESIS_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (includeConfidenceScoring) {
			details.push(
				"Attach a confidence score to every synthesised claim: high (all agents agree, evidence is direct), medium (majority agree, some indirect evidence), low (minority support or inference only). Consumers must be able to distinguish high-confidence synthesis from speculative aggregation.",
			);
		}

		if (deduplicationStrategy === "semantic") {
			details.push(
				"Canonicalize semantically similar claims before counting support. Semantic deduplication should collapse equivalent findings under one canonical claim rather than letting paraphrases look like independent evidence.",
			);
		} else if (deduplicationStrategy === "exact") {
			details.push(
				"Use exact deduplication only when claim wording is already normalized. Otherwise, near-duplicate phrasing will leak through and inflate apparent agreement.",
			);
		} else {
			details.push(
				"Deduplication is disabled, so the synthesis output must mark repeated claims explicitly to prevent duplicated evidence from looking like stronger consensus.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the synthesised output to produce the stated deliverable: "${parsed.data.deliverable}". Synthesis is not complete until the output satisfies the deliverable's expected format and completeness criteria.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Validate the synthesised output against the success criteria before returning it: "${parsed.data.successCriteria}". A synthesised result that fails its own acceptance criteria should be rejected and the synthesis re-attempted with a narrower conflict scope.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints to the output format and scope of synthesis: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints on the output shape must be enforced at synthesis time, not post-processed.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Cross-reference the synthesised claims against the provided context to detect regressions: if prior context established a fact and agent outputs contradict it, surface the discrepancy explicitly rather than silently accepting the newer output.",
			);
		}

		const synthesisPacket = buildSynthesisPacket(
			parsed.data,
			conflictResolution,
			deduplicationStrategy,
			includeConfidenceScoring,
		);

		return createCapabilityResult(
			context,
			`Result Synthesis planned ${details.length} synthesis guardrail${details.length === 1 ? "" : "s"} (conflict: ${conflictResolution}, dedup: ${deduplicationStrategy}, confidence: ${includeConfidenceScoring ? "enabled" : "disabled"}).`,
			createFocusRecommendations(
				"Synthesis control",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Conflict resolution comparison",
					["Strategy", "Best use case", "Primary tradeoff"],
					[
						{
							label: "Consensus",
							values: [
								"Majority agreement should gate which claims become canonical",
								"Minority but important claims may be demoted into dissent",
								"Use when broad agreement matters more than speed",
							],
						},
						{
							label: "Priority",
							values: [
								"One agent or capability lane is authoritative for a claim domain",
								"Bad ranking rules can hide valid minority findings",
								"Use when domain authority is explicit and auditable",
							],
						},
						{
							label: "Merge",
							values: [
								"Claims are complementary and should become one canonical statement",
								"Poor normalization can merge incompatible evidence accidentally",
								"Use when overlap is expected but not contradictory",
							],
						},
						{
							label: "Escalate",
							values: [
								"Conflicts are high impact and should stay visible to a human reviewer",
								"The caller receives unresolved contention instead of one final answer",
								"Use when automated arbitration would be unsafe",
							],
						},
					],
					"Choose the conflict policy before merging claims so the synthesis output stays auditable.",
				),
				buildOutputTemplateArtifact(
					"Synthesis report template",
					[
						"# Synthesis report",
						"## Executive answer",
						"## Canonical claims",
						"### Claim",
						"### Source agents",
						"### Confidence",
						"### Merge disposition",
						"## Dissenting claims",
						"## Gaps and unanswered questions",
						"## Decision log",
					].join("\n"),
					[
						"Executive answer",
						"Canonical claims",
						"Source agents",
						"Confidence",
						"Merge disposition",
						"Dissenting claims",
						"Gaps and unanswered questions",
						"Decision log",
					],
					"Use this template to emit a synthesis packet with provenance, dissent, and gap tracking.",
				),
				buildWorkedExampleArtifact(
					"Synthesis packet example",
					{
						request:
							"merge conflicting agent outputs, deduplicate overlap, preserve source attribution, and rank important claims",
						deliverable: "merged recommendation packet",
						options: {
							conflictResolution: "merge",
							deduplicationStrategy: "semantic",
							includeConfidenceScoring: true,
						},
					},
					synthesisPacket,
					"Worked example showing the expected structure of a synthesis result with claims, dissent, and gaps.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	orchResultSynthesisHandler,
);
