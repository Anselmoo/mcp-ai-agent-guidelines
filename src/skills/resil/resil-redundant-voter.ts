/**
 * resil-redundant-voter.ts
 *
 * Handwritten capability handler for the resil-redundant-voter skill.
 *
 * Aerospace metaphor: ISS quad-processor voting / N-modular redundancy (NMR).
 * Run N identical sub-prompts in parallel (temperature-jittered), collect
 * outputs, compute pairwise similarity, return the majority-cluster centroid.
 * Supports Byzantine fault tolerance up to f = floor((n−1)/3) faulty replicas.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   resil-clone-mutate    — prompt mutation / evolutionary recovery
 *   resil-homeostatic     — PID setpoint control
 *   resil-replay          — execution-trace consolidation
 *   adapt-quorum          — agent-readiness quorum sensing for task dispatch
 *
 * Outputs are ADVISORY ONLY — this handler does NOT run replica sub-prompts,
 * compute actual similarity scores, or enforce voting decisions.
 */

import { z } from "zod";
import { resil_redundant_voter_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
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
	byzantineFaultLimit,
	fmtPct,
	fmtSig,
	hasRedundantVoterSignal,
	majorityVoteCount,
	RESIL_ADVISORY_DISCLAIMER,
	similarityLabel,
} from "./resil-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const redundantVoterInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			nReplicas: z
				.number()
				.int()
				.min(3)
				.optional()
				.describe(
					"Number of parallel replica invocations. Must be odd and ≥ 3 for strict majority voting. NMR: 3 tolerates 1 faulty replica, 5 tolerates 2, 7 tolerates 3 (Byzantine tolerance f = floor((n−1)/3)).",
				),
			similarityThreshold: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Minimum pairwise similarity for two outputs to be considered in the same consensus cluster (0–1). Recommended: 0.85 for semantic similarity; 0.95 for structured/exact comparisons.",
				),
			tiebreakStrategy: z
				.enum(["escalate", "abstain", "longest", "first"])
				.optional()
				.describe(
					"Action when no consensus cluster exceeds the majority threshold. escalate: hand off to a higher-capability model. abstain: return a no-consensus signal and request human review. longest: return the longest output (highest token count). first: return the first replica's output.",
				),
			comparisonMode: z
				.enum(["semantic", "structural", "exact"])
				.optional()
				.describe(
					"How to compare replica outputs. semantic: embedding cosine similarity (tolerates paraphrase); structural: schema/format match + field-level equality; exact: byte-level match.",
				),
			temperatureJitter: z
				.number()
				.min(0)
				.max(0.5)
				.optional()
				.describe(
					"Temperature perturbation applied per replica to introduce output diversity. Each replica i runs at base_temperature + jitter_i where jitter_i ∈ [−temperatureJitter, +temperatureJitter]. Recommended: 0.1–0.2 for semantic tasks, 0.0 for structured-output tasks.",
				),
		})
		.optional(),
});

type TiebreakStrategy = "escalate" | "abstain" | "longest" | "first";
type ComparisonMode = "semantic" | "structural" | "exact";

// ─── Tiebreak Guidance Map ────────────────────────────────────────────────────

const TIEBREAK_GUIDANCE: Record<TiebreakStrategy, string> = {
	escalate:
		"Escalate tiebreak: when no majority cluster forms, submit the full set of replica outputs to a higher-capability model with the instruction to select or synthesise the best response. Include the similarity matrix as context so the escalation model understands the degree of disagreement. Track escalation frequency — persistent tiebreaks on the same node indicate that the task is ambiguous or the similarity threshold is too high.",
	abstain:
		"Abstain tiebreak: return a structured no-consensus signal rather than an arbitrary output. Include the replica count, majority cluster size, and best pairwise similarity in the signal so the caller can decide whether to retry, escalate, or surface a human-review request. Abstain is the safest tiebreak for high-stakes outputs (financial data, medical advice) where an incorrect response is worse than no response.",
	longest:
		"Longest tiebreak: return the output with the highest token count when no majority forms. This heuristic assumes more tokens correlate with more complete responses — it is appropriate for summarisation or explanation tasks but unsafe for structured outputs where verbosity does not correlate with correctness. Document this assumption explicitly in your runbook so operators know it is a heuristic, not a semantic quality signal.",
	first:
		"First tiebreak: return the output of replica 0 when no majority forms. This is the simplest strategy but provides no fault tolerance — it produces the same result as no voting at all in the tiebreak case. Use only as a development default or when the downstream consumer can handle retries and the cost of tiebreak escalation is too high.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const VOTER_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(replica|parallel|run.n.times|n.times|multiple.run|n.modular|iss|redundan|clone.n)\b/i,
		detail:
			"Run replicas truly in parallel to minimise wall-clock latency — sequential execution multiplies latency by n_replicas with no fault-tolerance benefit. Use an independent context per replica: do not share conversation history, intermediate results, or random seeds between replicas. Assign a temperature perturbation per replica (base_temperature ± jitter) to introduce diversity — replicas at identical temperatures will produce nearly identical outputs and add cost without improving fault tolerance. For structured-output tasks (JSON, code), set jitter = 0 and use n_replicas to catch model-API transient errors rather than to generate diverse outputs.",
	},
	{
		pattern:
			/\b(similarity|pairwise|compare|cosine|embed|semantic.match|cluster|group.output|distance)\b/i,
		detail:
			"Compute pairwise similarity before forming clusters. For n_replicas=5, this is n×(n−1)/2 = 10 similarity scores — tractable at any reasonable replica count. Use cosine similarity over embedding vectors for semantic tasks; use field-level equality with a Hamming-style score for structured outputs. Form consensus clusters by grouping replica pairs with similarity ≥ similarity_threshold using a union-find approach (avoid greedy agglomeration which can create transitivity violations). The majority cluster is the largest cluster — if two clusters tie in size, apply the tiebreak strategy.",
	},
	{
		pattern:
			/\b(majority|vote|voting.rule|strict.majority|supermajority|n.of.n|threshold.vote)\b/i,
		detail:
			"Strict majority requires floor(n/2) + 1 votes (e.g., 3 of 5, 4 of 7). Never use a simple plurality (largest cluster wins regardless of size) — a plurality of 2 out of 5 is not a consensus signal, it means 60% of replicas disagree with the winner. For Byzantine fault tolerance, use a threshold of ceil(2n/3) + 1 — this requires a supermajority and guarantees consensus under f = floor((n−1)/3) faulty replicas. Emit the cluster size distribution alongside the winner so callers can assess confidence: a 5-of-5 consensus is qualitatively different from a 3-of-5 bare majority.",
	},
	{
		pattern:
			/\b(byzantine|bft|fault.toleran|faulty.replica|malicious|adversar|arbitrary.output)\b/i,
		detail:
			"Byzantine fault tolerance requires n ≥ 3f + 1 replicas to tolerate f arbitrary faults. For LLM replicas, 'faulty' means an output that is semantically inconsistent with the others — caused by hallucination, context confusion, or temperature-induced divergence rather than malicious behaviour. The practical implication: use n=5 (f=1) as the minimum BFT configuration; n=7 (f=2) for higher-stakes nodes. Note that BFT guarantees assume the faulty replicas cannot coordinate — if the same model is used for all replicas at the same temperature, correlated failures can produce a false majority. Use temperature jitter to decorrelate outputs.",
	},
	{
		pattern:
			/\b(centroid|aggregate|synth|combine|merge|consensus.output|final.output|return.which)\b/i,
		detail:
			"The centroid of the majority cluster is the output whose pairwise similarity to all other cluster members is maximised — it is the most 'central' response in semantic space. For structured outputs, the centroid is the member with the fewest field-level deviations from cluster median values. Do not average or interpolate outputs: LLM outputs are not numeric vectors and averaging produces incoherent text. Return the centroid member as-is; do not attempt to synthesise across cluster members. Log the centroid's replica ID, cluster size, and the similarity scores to all other cluster members so the confidence of the consensus can be audited.",
	},
	{
		pattern:
			/\b(tiebreak|tie|no.majority|split|no.consensus|fail.open|fail.closed|disagree)\b/i,
		detail:
			"Design the tiebreak strategy before deployment — tiebreaks are not edge cases for probabilistic tasks. For n=3 replicas, a three-way split (each replica in its own cluster) occurs with non-trivial probability when the task is ambiguous or the similarity threshold is set too high. Tiebreak frequency is a signal: if tiebreaks exceed 10% of invocations, the similarity_threshold may be too strict or the task description too ambiguous. Log every tiebreak event with the full replica outputs and similarity matrix so the pattern can be diagnosed.",
	},
	{
		pattern:
			/\b(cost|token|budget|expensive|how.many|resource|afford|latency.cost|overhead)\b/i,
		detail:
			"Voting overhead is n_replicas × per_replica_cost. For cheap models at 500 tokens per output: n=5 costs 2500 tokens per invocation. Budget voting nodes at the pipeline level: do not apply voting to every node — reserve it for high-impact nodes where output quality directly affects downstream decision-making. Apply cost guard: if the replica model tier × n_replicas × expected_tokens exceeds a per-invocation budget cap, reduce n_replicas or switch to a cheaper comparison mode before the invocation rather than after. For structured outputs, exact-match comparison is free; semantic embedding similarity adds one embedding call per output.",
	},
	{
		pattern:
			/\b(hallucin|inconsist|sometimes.wrong|unreliable|bad.answer|wrong.output|fail.silently)\b/i,
		detail:
			"N-modular redundancy reduces hallucination rates when hallucinations are idiosyncratic — different replicas hallucinate different things, so the correct response forms a majority and hallucinated variants are minority clusters. This assumption fails when the hallucination is systematic: if all replicas share the same training-data gap, they will all hallucinate the same incorrect fact and form a false majority. Voting is not a substitute for retrieval augmentation or factual grounding for tasks involving specific facts, dates, or numeric values. Use voting to improve consistency and reduce random errors, not to compensate for systematic model knowledge gaps.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const resilRedundantVoterHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		// Stage 1 — absolute minimum signal check
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Redundant Voter needs a description of the node requiring fault tolerance, the number of replicas, or the tiebreak strategy before it can produce targeted NMR configuration guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;

		// Stage 2 — domain relevance check
		if (!hasRedundantVoterSignal(combined) && signals.complexity === "simple") {
			return buildInsufficientSignalResult(
				context,
				"Redundant Voter targets ISS-style N-modular redundancy for LLM nodes. Describe which output is unreliable, how many replicas are feasible, and what tiebreak strategy fits your risk tolerance to receive specific voting guidance.",
				"Mention the hallucination or inconsistency pattern, the number of replicas (n_replicas), the comparison mode (semantic/structural/exact), and the tiebreak strategy so the Redundant Voter can produce targeted NMR design advice.",
			);
		}

		// Match keyword rules
		const guidances: string[] = VOTER_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail);

		// Lightweight numeric advisory when parameters are provided
		const parsed = parseSkillInput(redundantVoterInputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (opts?.nReplicas !== undefined) {
			const n = opts.nReplicas;
			const majority = majorityVoteCount(n);
			const bftLimit = byzantineFaultLimit(n);
			const simThreshold = opts.similarityThreshold;
			const simLabel =
				simThreshold !== undefined ? similarityLabel(simThreshold) : undefined;

			const parts: string[] = [
				`Advisory NMR computation — n_replicas=${n}: strict majority requires ${majority} agreeing replicas, Byzantine fault limit f=${bftLimit} (tolerates ${bftLimit} faulty replica${bftLimit === 1 ? "" : "s"}).`,
			];

			if (simLabel !== undefined && simThreshold !== undefined) {
				parts.push(
					`Similarity threshold ${fmtPct(simThreshold)} classifies cluster membership as '${simLabel}'.`,
				);
			}

			if (n % 2 === 0) {
				parts.push(
					`WARNING: even n_replicas=${n} allows perfect splits where no majority forms — prefer odd replica counts (${n + 1} recommended) to guarantee a strict majority is always achievable.`,
				);
			}

			if (opts.temperatureJitter !== undefined) {
				const jitterNote =
					opts.temperatureJitter === 0
						? "jitter=0: all replicas run at identical temperature — correlated outputs reduce BFT effectiveness. Use jitter ≥ 0.1 for semantic tasks."
						: `jitter=±${fmtSig(opts.temperatureJitter)}: replicas will produce diverse outputs — good for semantic tasks, but ensure structured-output schema validation is applied before similarity scoring.`;
				parts.push(jitterNote);
			}

			guidances.unshift(
				`${parts.join(" ")} Validate against your node's actual output variance before configuring replica counts.`,
			);
		}

		// Tiebreak strategy advisory
		if (opts?.tiebreakStrategy) {
			const tbGuidance =
				TIEBREAK_GUIDANCE[opts.tiebreakStrategy as TiebreakStrategy];
			if (tbGuidance) guidances.unshift(tbGuidance);
		}

		// Comparison mode advisory
		if (opts?.comparisonMode) {
			const comparisonNotes: Record<ComparisonMode, string> = {
				semantic:
					"Semantic comparison mode: compute embedding cosine similarity between replica outputs. Requires one embedding call per replica output. Tolerates paraphrase and word-order variation — two outputs conveying the same meaning will be clustered together even with different wording. Best for open-ended text generation, summarisation, and explanation tasks.",
				structural:
					"Structural comparison mode: compare outputs by schema conformance and field-level equality. Requires outputs to be parseable against a shared schema; parse failures are treated as faulty replicas. Exact field values must match within a tolerance for numeric fields; string fields use normalised string equality. Best for JSON generation, code generation, and form-filling tasks.",
				exact:
					"Exact comparison mode: byte-level string equality after whitespace normalisation. Any whitespace or punctuation difference is a mismatch — similarity is binary (0 or 1). Best for deterministic tasks where the output space is small (yes/no, classification labels, fixed-format codes). Do not use exact mode for free-text generation — it will almost always produce a tiebreak.",
			};
			const compNote = comparisonNotes[opts.comparisonMode as ComparisonMode];
			if (compNote) guidances.unshift(compNote);
		}

		// Fallback guidance when no rules matched
		if (guidances.length === 0) {
			guidances.push(
				"To configure an N-modular Redundant Voter: (1) choose n_replicas (odd, ≥ 3); (2) set a similarity_threshold for cluster formation; (3) select a comparison_mode appropriate to the output type; (4) define a tiebreak strategy; (5) apply temperature jitter for semantic tasks; (6) log all replica outputs and cluster assignments for audit.",
				"Start with n=3 (strict majority = 2 agreeing replicas) and semantic comparison before scaling to higher replica counts. Higher n dramatically increases cost and latency — validate that n=3 is insufficient before adding replicas.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply the voting configuration under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints typically govern maximum replica count, allowed comparison modes, and tiebreak escalation paths.`,
			);
		}

		guidances.push(RESIL_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildOutputTemplateArtifact(
				"Redundant voter configuration",
				`{
  "n_replicas": <odd number>,
  "comparison_mode": "<semantic|structural|exact>",
  "similarity_threshold": <0..1>,
  "tiebreak_strategy": "<escalate|abstain|longest|first>",
  "temperature_jitter": <0..0.5>
}`,
				[
					"n_replicas",
					"comparison_mode",
					"similarity_threshold",
					"tiebreak_strategy",
					"temperature_jitter",
				],
				"Use this template for a reproducible N-modular redundancy configuration.",
			),
			buildComparisonMatrixArtifact(
				"Replica consensus matrix",
				["cluster", "size", "similarity", "action"],
				[
					{
						label: "majority cluster",
						values: [
							`${opts?.nReplicas ?? 5} replicas, or the largest agreeing cluster`,
							`at or above ${fmtPct(opts?.similarityThreshold ?? 0.85)} threshold`,
							"select the centroid output",
							"return the centroid with cluster metadata",
						],
					},
					{
						label: "minority cluster",
						values: [
							"smaller cluster of divergent replicas",
							"below the threshold but still informative",
							"retain for audit context",
							"do not treat as consensus",
						],
					},
					{
						label: "outlier replica",
						values: [
							"single replica or isolated output",
							"far below the similarity threshold",
							"flag as a fault candidate",
							"include in tie or escalation context",
						],
					},
				],
				"Use this matrix to report how the voting outcome was assembled.",
			),
			buildWorkedExampleArtifact(
				"Replica voting example",
				{
					input: {
						nReplicas: opts?.nReplicas ?? 5,
						comparisonMode: opts?.comparisonMode ?? "semantic",
						tiebreakStrategy: opts?.tiebreakStrategy ?? "escalate",
					},
					replicaOutputs: [
						"Replica A: concise answer with the same meaning",
						"Replica B: paraphrased answer",
						"Replica C: paraphrased answer",
						"Replica D: off-topic answer",
						"Replica E: off-topic answer",
					],
				},
				{
					majorityClusterSize: majorityVoteCount(opts?.nReplicas ?? 5),
					byzantineFaultLimit: byzantineFaultLimit(opts?.nReplicas ?? 5),
					expectedAction: "return the centroid of the largest semantic cluster",
				},
				"Worked example showing how the majority cluster and centroid are chosen.",
			),
		];

		return createCapabilityResult(
			context,
			`Redundant Voter produced ${guidances.length - 1} NMR configuration guideline${guidances.length - 1 === 1 ? "" : "s"} for fault-tolerant output voting. Results are advisory — validate replica counts and similarity thresholds against your node's observed output variance before deployment.`,
			createFocusRecommendations(
				"Redundant voter guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	resilRedundantVoterHandler,
);
