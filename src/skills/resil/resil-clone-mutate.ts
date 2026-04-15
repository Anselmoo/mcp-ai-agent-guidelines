/**
 * resil-clone-mutate.ts
 *
 * Handwritten capability handler for the resil-clone-mutate skill.
 *
 * Biology metaphor: clonal selection of the adaptive immune system.
 * When a workflow node's rolling quality falls below quality_threshold for
 * consecutive_failures runs, the node is "cloned" N times with mutation
 * strategies (rephrase, abstract, concrete, invert, split, template).  All
 * clones run in a tournament; the winner is promoted if it beats the original
 * by at least promote_threshold.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   resil-homeostatic     — PID setpoint control of metric drift
 *   resil-redundant-voter — N-modular redundancy / majority voting
 *   resil-replay          — execution-trace consolidation and routing updates
 *   adapt-annealing       — workflow-topology optimisation via SA search
 *
 * Outputs are ADVISORY ONLY — this handler does NOT execute prompt mutations,
 * run tournaments, or modify live workflow configuration.
 */

import { z } from "zod";
import { resil_clone_mutate_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildInsufficientSignalResult,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	hasCloneMutateSignal,
	qualityRatioLabel,
	RESIL_ADVISORY_DISCLAIMER,
	recommendedCloneCount,
} from "./resil-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const cloneMutateInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			qualityThreshold: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Rolling quality floor (0–1). When measured quality drops below this value the mutation cycle triggers. Recommended starting point: 0.70 for non-critical nodes, 0.85 for critical path nodes.",
				),
			consecutiveFailures: z
				.number()
				.int()
				.positive()
				.optional()
				.describe(
					"Number of consecutive below-threshold runs before triggering a mutation cycle. Lower values (2–3) respond faster; higher values (5–10) avoid reacting to transient noise.",
				),
			nClones: z
				.number()
				.int()
				.positive()
				.optional()
				.describe(
					"Number of mutated clones to generate per cycle. Minimum 3 for a meaningful tournament; recommended 5–7 for production workflows.",
				),
			promoteThreshold: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Minimum quality delta over the original required to promote a winner: winner_quality − original_quality ≥ promote_threshold. Set to 0.05–0.10 to prevent promoting a clone that is only marginally better due to measurement noise.",
				),
			mutationTypes: z
				.array(
					z.enum([
						"rephrase",
						"abstract",
						"concrete",
						"invert",
						"split",
						"template",
					]),
				)
				.optional()
				.describe(
					"Allowed mutation strategies. rephrase: reword preserving intent; abstract: generalise specifics; concrete: add examples and constraints; invert: reframe negation; split: divide into sub-steps; template: inject structured output format.",
				),
		})
		.optional(),
});

type MutationType =
	| "rephrase"
	| "abstract"
	| "concrete"
	| "invert"
	| "split"
	| "template";

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const CLONE_MUTATE_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(quality|score|metric|threshold|floor|minimum|rolling|measure|track|monitor|degrad|drift)\b/i,
		detail:
			"Define a rolling quality metric before writing any mutation logic. Compute quality as the mean of the last N successful evaluations (N=5 is a practical minimum; N=10 gives more stable estimates). The metric must be deterministic given the same output — common choices: LLM-graded correctness score (0–1), test-case pass rate, structured schema adherence ratio, or user-signal proxy (click-through, rejection rate). Avoid single-point quality measurements: transient model-temperature variation can push quality below threshold on a single run without indicating true degradation. Set quality_threshold = 0.70 for non-critical nodes and 0.85 for critical-path nodes as sensible defaults.",
	},
	{
		pattern:
			/\b(fail|failure|consecutive|trigger|threshold|when.to|activate|fire|start.mutating)\b/i,
		detail:
			"Set consecutive_failures = 3 as a production default: triggering after a single below-threshold run reacts to noise; waiting for 5+ failures allows significant quality regression before correction. Implement the counter as a sliding window rather than a simple increment: reset to zero whenever a run meets the threshold, even mid-stream. Log every threshold-crossing event with timestamp, measured quality, and the last N inputs so the mutation audit trail is recoverable. Alert a human operator when more than 3 mutation cycles trigger within 24 hours on the same node — this pattern indicates the underlying data distribution may have shifted permanently.",
	},
	{
		pattern:
			/\b(clone|mutate|mutation|strategy|rephrase|abstract|concret|invert|split|template|diversif|variant)\b/i,
		detail:
			"Select mutation strategies based on the diagnosed failure mode. Use rephrase when outputs are semantically correct but inconsistently formatted. Use concrete when outputs are too vague for downstream consumption. Use abstract when over-specified prompts fail on edge-case inputs. Use invert when the original prompt's framing causes the model to refuse or hedge; reformulating as a positive instruction resolves many refusal-related failures. Use split when the task is too compound for a single model call. Use template when structured output requirements are not being met consistently. Never apply all strategies simultaneously — apply one category per clone and compare them in the tournament to learn which failure mode is dominant.",
	},
	{
		pattern:
			/\b(tournament|compet|evaluat|compare|rank|score.clone|pick.winner|champion|best.clone|select)\b/i,
		detail:
			"Run the tournament with the same evaluator and held-out prompt set used for the production quality metric — do not evaluate on the same inputs that triggered the mutation cycle, as the clone may overfit to those specific examples. Run each clone 3 times and average the scores to reduce evaluation variance before ranking. Discard any clone that fails structural validation (schema mismatch, refusal, timeout) before scoring — invalid outputs must not win by default due to missing scores. Record all tournament scores in the mutation audit log even for losers: the score distribution across mutation types reveals which strategy is most reliably superior for this node.",
	},
	{
		pattern:
			/\b(promot|promote|win|winner|deploy|replace|swap|upgrade|update.prompt|inject|adopt)\b/i,
		detail:
			"Promote the winner only when winner_quality − original_quality ≥ promote_threshold. A 5% quality delta (promote_threshold = 0.05) is a practical minimum to avoid promoting a clone that beats the original within measurement noise. Use blue-green promotion: keep the original active while the winner runs in shadow mode for 1 production cycle, then promote if shadow quality confirms the tournament result. Tag the promoted prompt version with the triggering mutation cycle ID, winning strategy type, and evaluation scores so rollback is unambiguous. Limit promotion frequency: if a node promotes more than twice per week, escalate to human review — automated self-modification cycles that outpace human oversight are a governance risk.",
	},
	{
		pattern:
			/\b(audit|log|trace|record|history|version|track.change|governance|rollback|revert)\b/i,
		detail:
			"Maintain a per-node mutation audit log with: { cycleId, triggeredAt, qualityAtTrigger, clones: [{strategy, score}], winnerId, winnerScore, originalScore, promoted: boolean, promotedAt? }. This log is the only way to: (a) understand why a node was mutated, (b) roll back to a previous version if a promoted clone introduces a regression on a new data distribution, (c) demonstrate compliance with AI governance policies requiring human-readable change records. Retain mutation logs for at least 30 days; archive them for critical-path nodes.",
	},
	{
		pattern:
			/\b(immune|biological|clonal.selection|somatic.mutation|affinity|maturation|hypermutation)\b/i,
		detail:
			"The clonal selection metaphor maps as follows: the workflow node corresponds to a B-cell clone; the quality metric corresponds to affinity to the antigen (the task distribution); consecutive failures correspond to sustained low affinity; the mutation cycle corresponds to somatic hypermutation; the tournament corresponds to positive selection; and promotion corresponds to clonal expansion. Unlike biological immunity, there is no memory-cell mechanism in this framework — the audit log serves as the institutional memory. If the task distribution shifts again, the entire mutation cycle must re-run from the current promoted prompt.",
	},
	{
		pattern:
			/\b(budget|cost|expensive|token|run.n.times|parallel|afford|batch|resource)\b/i,
		detail:
			"Estimate the per-cycle mutation budget before configuring n_clones. Each tournament run costs n_clones × 3 evaluations × (evaluation_tokens + model_cost). For a cheap model at 1000 tokens per evaluation: n_clones=5 costs approximately 15 model calls per cycle. Set an explicit mutation_budget_cap that prevents the mutation system from exceeding a cost threshold per 24 hours — otherwise a persistently degrading node will trigger continuous cycles and accumulate unbounded token costs. Prefer asynchronous tournament evaluation (background workers) over synchronous evaluation to avoid blocking the production workflow during a mutation cycle.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const resilCloneMutateHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(cloneMutateInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);

		// Stage 1 — absolute minimum signal check
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Clone-Mutate needs a description of the node that is degrading, a quality metric, or a failure pattern before it can produce targeted recovery guidance.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		// Stage 2 — domain relevance check
		if (!hasCloneMutateSignal(combined) && signals.complexity === "simple") {
			return buildInsufficientSignalResult(
				context,
				"Clone-Mutate targets automated prompt-recovery via clonal selection. Describe which workflow node is degrading, how quality is measured, and what recovery constraints apply to receive specific guidance.",
				"Mention the failing node, its quality metric (e.g., correctness score, schema adherence rate), and the consecutive-failure threshold, and whether live-workflow mutation is permitted, so Clone-Mutate can produce targeted recovery recommendations.",
			);
		}

		// Match keyword rules
		const guidances: string[] = [
			"Start with a rolling quality monitor for the target workflow node. Use a bounded score such as correctness, evaluator grade, schema adherence, or task success rate over the last N runs, and treat the metric as the trigger source for the repair loop rather than mutating prompts on isolated anecdotal failures.",
			"Trigger the clone-mutate cycle only after consecutive below-threshold runs, not after a single miss. This keeps the repair loop reference-faithful: degradation must persist long enough to justify cloning, mutation, and evaluation work.",
			"Generate multiple clones that each apply one mutation strategy at a time so the winner can be attributed to a specific intervention. Clone-mutate is a structured recovery tournament, not an unrestricted prompt rewrite engine.",
			"Evaluate clones on a held-out tournament set with the same scoring contract used for production quality measurement, then compare the winner back to the incumbent with an explicit promotion gate. A clone should not be promoted unless it beats the original by at least the chosen promote_threshold and passes structural validation.",
			"Keep an audit trail for every cycle: what triggered the repair, which mutation strategies were tried, how each clone scored, whether a winner was promoted, and how to roll back if post-promotion quality regresses. This is the durable memory for the self-healing loop while live runtime mutation support is still in flight.",
		];

		guidances.push(
			...CLONE_MUTATE_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		// Lightweight numeric advisory when parameters are provided
		const opts = parsed.data.options;

		if (opts) {
			const parts: string[] = [];

			if (
				opts.qualityThreshold !== undefined &&
				opts.consecutiveFailures !== undefined
			) {
				const label = qualityRatioLabel(opts.qualityThreshold);
				parts.push(
					`Advisory parameters — quality_threshold=${opts.qualityThreshold} (${label} tier), consecutive_failures=${opts.consecutiveFailures}.`,
				);
			}

			if (opts.nClones !== undefined) {
				const recommended = recommendedCloneCount(
					opts.consecutiveFailures ?? 3,
				);
				const note =
					opts.nClones < recommended
						? `n_clones=${opts.nClones} is below the recommended ${recommended} for ${opts.consecutiveFailures ?? 3} consecutive failures — consider increasing clone diversity.`
						: `n_clones=${opts.nClones} provides adequate diversity for this failure count.`;
				parts.push(note);
			}

			if (opts.promoteThreshold !== undefined) {
				const warning =
					opts.promoteThreshold < 0.05
						? `promote_threshold=${opts.promoteThreshold} is very low — clones that beat the original by noise alone may be promoted; recommend ≥ 0.05.`
						: `promote_threshold=${opts.promoteThreshold} is within a safe range.`;
				parts.push(warning);
			}

			if (opts.mutationTypes && opts.mutationTypes.length > 0) {
				const allowed = opts.mutationTypes as MutationType[];
				parts.push(
					`Enabled mutation strategies: ${allowed.join(", ")}. Apply each strategy to distinct clones rather than combining strategies within one clone — mixing strategies makes it impossible to attribute improvement to a specific mutation type.`,
				);
			}

			if (parts.length > 0) {
				guidances.unshift(
					`${parts.join(" ")} Validate against your node's failure history before deploying.`,
				);
			}
		}

		// Fallback guidance when no rules matched
		if (guidances.length === 0) {
			guidances.push(
				"To configure a Clone-Mutate cycle: (1) choose a rolling quality metric and set quality_threshold; (2) set consecutive_failures to define the trigger window; (3) select mutation strategies relevant to the failure mode; (4) configure the tournament evaluator and promote_threshold; (5) deploy with an audit log and rollback path.",
				"Avoid triggering mutation on the first below-threshold run — transient model variance (temperature, context-window effects) can produce a single low-quality output without indicating true degradation. Use consecutive_failures ≥ 3 as a practical noise filter.",
			);
		}

		// Constraint-aware suffix
		if (signals.hasConstraints) {
			guidances.push(
				`Apply the mutation cycle under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints should gate which mutation types are allowed and how frequently the tournament can run.`,
			);
		}

		// Surface advisory disclaimer
		guidances.push(RESIL_ADVISORY_DISCLAIMER);

		return createCapabilityResult(
			context,
			`Clone-Mutate produced ${guidances.length - 1} recovery-cycle guideline${guidances.length - 1 === 1 ? "" : "s"} for adaptive prompt-recovery via clonal selection. Results are advisory — validate parameters against your workflow constraints before deployment.`,
			createFocusRecommendations(
				"Clone-mutate guidance",
				guidances,
				context.model.modelClass,
			),
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	resilCloneMutateHandler,
);
