/**
 * resil-replay.ts
 *
 * Handwritten capability handler for the resil-replay skill.
 *
 * Neuroscience metaphor: hippocampal replay / offline consolidation.
 * Buffer N ExecutionTrace objects (FIFO or quality-weighted eviction).
 * At trigger, run a reflection agent over the buffer + current routing strategy.
 * The reflection agent outputs a routing_strategy_update; inject it into the
 * orchestrator's system prompt.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   resil-clone-mutate    — clonal selection / prompt mutation on failure
 *   resil-homeostatic     — PID setpoint control
 *   resil-redundant-voter — N-modular redundancy / output voting
 *   adapt-annealing       — topology optimisation via SA search
 *   flow-orchestrator     — general orchestration and flow control
 *
 * Outputs are ADVISORY ONLY — this handler does NOT run reflection agents,
 * update routing strategies, or modify live orchestrator configuration.
 */

import { z } from "zod";
import { resil_replay_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	bufferFillLabel,
	fmtPct,
	fmtSig,
	hasReplaySignal,
	RESIL_ADVISORY_DISCLAIMER,
	replayMixLabel,
} from "./resil-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const replayInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			bufferCapacity: z
				.number()
				.int()
				.positive()
				.optional()
				.describe(
					"Maximum number of ExecutionTrace objects the buffer holds before eviction. Recommended range: 20–100. Larger buffers provide richer consolidation context but increase the cost of the reflection agent call.",
				),
			bufferSize: z
				.number()
				.int()
				.min(0)
				.optional()
				.describe(
					"Current number of traces in the buffer. Used to compute fill ratio and advise on consolidation readiness.",
				),
			evictionPolicy: z
				.enum(["fifo", "quality-weighted", "recency-quality"])
				.optional()
				.describe(
					"Policy for evicting traces when the buffer is full. fifo: oldest traces evicted first. quality-weighted: lowest quality_score traces evicted first. recency-quality: composite score = 0.4×recency + 0.6×quality_score; lowest-scoring traces evicted first.",
				),
			successFraction: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Fraction of traces in the current buffer that represent successful runs (0–1). Used to advise on mix balance for informative consolidation.",
				),
			consolidationTrigger: z
				.enum(["scheduled", "quality-degradation", "manual", "buffer-full"])
				.optional()
				.describe(
					"Event that triggers a consolidation cycle. scheduled: fixed interval (e.g., every N workflow runs or every M hours). quality-degradation: triggered when rolling quality drops below a threshold. manual: operator-initiated. buffer-full: triggered when the buffer reaches capacity.",
				),
			injectionMode: z
				.enum(["prepend", "replace", "append"])
				.optional()
				.describe(
					"How the routing_strategy_update is injected into the orchestrator system prompt. prepend: insert at the start, before existing strategy text. replace: overwrite the strategy section entirely. append: add after existing strategy text.",
				),
		})
		.optional(),
});

type EvictionPolicy = "fifo" | "quality-weighted" | "recency-quality";
type ConsolidationTrigger =
	| "scheduled"
	| "quality-degradation"
	| "manual"
	| "buffer-full";
type InjectionMode = "prepend" | "replace" | "append";

// ─── Eviction Policy Guidance ─────────────────────────────────────────────────

const EVICTION_GUIDANCE: Record<EvictionPolicy, string> = {
	fifo: "FIFO eviction: oldest traces are removed first, maintaining a rolling window of the most recent N runs. Simple and predictable — useful when the task distribution is stationary (recent runs are as representative as older ones). Limitation: early traces that represent rare but important failure modes will eventually be evicted even if they have not been seen again.",
	"quality-weighted":
		"Quality-weighted eviction: traces with the lowest quality_score are evicted first, regardless of age. Keeps the highest-quality examples in the buffer — the reflection agent sees the best-performing run patterns most prominently. Risk: the buffer can become biased toward success-only traces if quality_score is high-correlated with success; failure examples — which are often more informative for routing corrections — will be evicted. Counteract with a minimum failure retention ratio (e.g., keep at least 20% failure traces regardless of quality score).",
	"recency-quality":
		"Recency-quality eviction: composite score = 0.4×recency + 0.6×quality_score. Balances freshness against quality — old high-quality traces are kept longer than old low-quality traces, but recent traces are preferred over stale ones at equal quality. Recommended default for production workflows where the task distribution evolves slowly over time. Tune the weights (0.4/0.6) based on how quickly your workflow's optimal strategy changes — faster-changing workflows should weight recency higher.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const REPLAY_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(trace|execution.trace|run.log|performance.log|history|buffer|store|persist)\b/i,
		detail:
			"Define the ExecutionTrace schema before building the buffer. A minimal trace includes: { traceId, nodeId, inputHash, outputHash, qualityScore, latencyMs, costTokens, routingDecisions: [{nodeId, modelUsed, agentCount}], timestamp, success: boolean }. The inputHash and outputHash are one-way hashes of the raw inputs and outputs — never store raw LLM inputs and outputs in the trace buffer unless your data governance policy explicitly permits it. qualityScore must be computed at evaluation time (by an LLM judge, test oracle, or user signal) and stored in the trace before buffering.",
	},
	{
		pattern:
			/\b(buffer|capacity|size|evict|fifo|queue|window|retain|max.trace|how.many)\b/i,
		detail:
			"Set buffer_capacity based on two constraints: (1) the reflection agent's context window — a buffer of 100 traces × 500 tokens per trace = 50 000 tokens, which may exceed context limits for some models; (2) the consolidation cost — larger buffers increase the per-cycle token cost of the reflection call. Start with capacity = 20–30 traces and scale up only if the reflection agent produces low-quality updates due to insufficient history. Use a separate statistics summary (min/max/mean quality over the last N runs) alongside the raw traces to give the reflection agent aggregate context without consuming the full context window on trace details.",
	},
	{
		pattern:
			/\b(reflect|reflection|meta.learn|analys|insight|diagnos|summaris|summar|review.run|learn.from)\b/i,
		detail:
			"The reflection agent is a separate LLM call that receives: (1) the current routing strategy (system prompt excerpt), (2) the buffer contents (or a summary), and (3) a structured prompt instructing it to identify: (a) routing decisions that consistently produce low-quality outputs, (b) routing patterns that produce high-quality outputs on similar inputs, (c) specific, actionable changes to the routing strategy that would improve performance on the failure patterns. The reflection agent must output a structured routing_strategy_update — free-form text updates cannot be reliably injected into the system prompt. Define a JSON schema for routing_strategy_update and validate the reflection agent's output before injection.",
	},
	{
		pattern:
			/\b(inject|injection|system.prompt|strategy.update|update.prompt|modify.orchestrator|apply.update)\b/i,
		detail:
			"Injection safety constraints: (1) validate the routing_strategy_update schema before any injection — reject malformed updates and log the rejection rather than applying a partial update; (2) scope the injection to a designated strategy section of the system prompt, delimited by explicit markers (e.g., '<!-- ROUTING_STRATEGY_START -->' / '<!-- ROUTING_STRATEGY_END -->') so the injection does not overwrite safety instructions or persona context; (3) apply a maximum update size (e.g., 500 tokens) to prevent a runaway reflection agent from replacing the entire system prompt; (4) require human review for any update that exceeds the maximum size or modifies routing constraints (not just routing preferences).",
	},
	{
		pattern:
			/\b(trigger|when.to.run|schedule|cadence|how.often|period|interval|fire|initiate)\b/i,
		detail:
			"Consolidation trigger design: scheduled triggers (every N runs or every M hours) are predictable and auditable but may consolidate when the buffer is too sparse to be informative. quality-degradation triggers (rolling quality below threshold) are responsive but risk triggering frequently during a degradation event, consuming reflection budget. A hybrid approach is recommended: schedule consolidation at a minimum frequency (e.g., every 50 runs) and also trigger on quality degradation, but throttle the degradation trigger with a minimum interval (e.g., no more than once per hour) to prevent cascade reflection calls during a sustained failure event.",
	},
	{
		pattern:
			/\b(success|fail|mix|balance|diverse|variety|ratio|distribution|failure.example|success.example)\b/i,
		detail:
			"A balanced trace buffer produces the most informative consolidation. Purely success-heavy buffers give the reflection agent no failure patterns to diagnose. Purely failure-heavy buffers bias the strategy update toward failure-mode patches that may not generalise. Target a 60/40 success/failure mix: if the buffer is success-heavy (> 70% success), explicitly retain the last K failure traces regardless of eviction policy (hard retention of failures). If the buffer is failure-heavy (< 40% success), increase the quality_threshold for triggering consolidation to avoid over-responding to a brief degradation spike.",
	},
	{
		pattern:
			/\b(rollback|revert|undo|bad.update|regression|bad.strategy|wrong.update|revert.to.prev)\b/i,
		detail:
			"Maintain a versioned history of routing_strategy_updates with timestamps. Store the previous N versions (N=5 is a practical minimum) so any update can be rolled back to the last known-good state. The rollback procedure: (1) detect quality regression after an update (rolling quality drops > 10% relative to pre-update baseline over the next 10 runs), (2) automatically or manually trigger a rollback to the previous version, (3) quarantine the failed update with its associated trace buffer snapshot for post-hoc diagnosis. Never apply an update that cannot be rolled back — this is the single most important governance constraint for automated routing-strategy modification.",
	},
	{
		pattern:
			/\b(hippocampal|offline|consolidation|sleep|replay.buffer|experience.replay|episodic|memory)\b/i,
		detail:
			"The hippocampal replay metaphor maps as follows: the trace buffer corresponds to the hippocampus (short-term episodic memory); the routing strategy in the system prompt corresponds to cortical long-term memory; consolidation corresponds to offline replay during sleep; the reflection agent corresponds to the consolidation process that transfers episodic patterns to generalised cortical knowledge. Unlike biological memory consolidation, this process is not continuous — it runs at discrete trigger points. The implication: the routing strategy can lag behind the current data distribution between consolidation cycles. Reduce lag by increasing trigger frequency when quality metrics are volatile.",
	},
	{
		pattern:
			/\b(cost|token.budget|expensive|reflect.cost|how.much|afford|budget.guard)\b/i,
		detail:
			"Reflection agent calls are expensive because they process the full trace buffer plus the current strategy. Budget consolidation calls at the pipeline level: estimate reflection_cost = buffer_size × tokens_per_trace + current_strategy_tokens + reflection_output_tokens. For buffer_size=30 traces at 500 tokens each + 1000-token strategy + 500-token update = ~17 000 tokens per consolidation call. Set a monthly consolidation budget cap and a per-call cost guard that prevents consolidation when budget_remaining < per_call_cost. Log every consolidation call cost to detect unexpected cost escalation.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const resilReplayHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		// Stage 1 — absolute minimum signal check
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Replay Consolidator needs a description of the execution traces, routing strategy, or consolidation trigger before it can produce targeted replay-buffer guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;

		// Stage 2 — domain relevance check
		if (!hasReplaySignal(combined) && signals.complexity === "simple") {
			return buildInsufficientSignalResult(
				context,
				"Replay Consolidator targets hippocampal-replay-style learning from execution traces to improve orchestrator routing strategies over time. Describe the execution logs, the orchestrator's routing strategy, and what pattern of mistakes you want to correct to receive specific consolidation guidance.",
				"Mention the trace buffer contents, the routing metric (quality, latency), the consolidation trigger (scheduled or event-driven), and the injection mechanism so the Replay Consolidator can produce targeted buffer-design and reflection-agent advice.",
			);
		}

		// Match keyword rules
		const guidances: string[] = REPLAY_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail);

		// Lightweight numeric advisory when parameters are provided
		const parsed = parseSkillInput(replayInputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (opts) {
			const parts: string[] = [];

			if (opts.bufferCapacity !== undefined && opts.bufferSize !== undefined) {
				const fillRatio = opts.bufferSize / opts.bufferCapacity;
				const fillLabel = bufferFillLabel(fillRatio);
				parts.push(
					`Advisory buffer state — ${opts.bufferSize}/${opts.bufferCapacity} traces (${fmtPct(fillRatio)} full, status: ${fillLabel}).`,
				);

				if (fillLabel === "sparse") {
					parts.push(
						"Buffer is sparse — consolidation will produce low-quality strategy updates with insufficient evidence. Defer consolidation until the buffer reaches at least 40% capacity.",
					);
				}
			}

			if (opts.successFraction !== undefined) {
				const mixLabel = replayMixLabel(opts.successFraction);
				const mixNote: Record<string, string> = {
					"success-heavy": `Buffer mix is success-heavy (${fmtPct(opts.successFraction)} successes) — failure patterns are underrepresented; the reflection agent may not identify routing problems. Retain the last 5–10 failure traces explicitly before the next consolidation.`,
					balanced: `Buffer mix is balanced (${fmtPct(opts.successFraction)} successes) — good for informative consolidation.`,
					"failure-heavy": `Buffer mix is failure-heavy (${fmtPct(opts.successFraction)} successes) — the reflection agent will focus on failure patterns; validate that the resulting strategy update does not over-correct to failure-mode patches at the expense of successful routing patterns.`,
				};
				parts.push(mixNote[mixLabel] ?? "");
			}

			if (opts.evictionPolicy) {
				const evictGuidance =
					EVICTION_GUIDANCE[opts.evictionPolicy as EvictionPolicy];
				if (evictGuidance) guidances.unshift(evictGuidance);
			}

			if (opts.consolidationTrigger) {
				const triggerNotes: Record<ConsolidationTrigger, string> = {
					scheduled:
						"Scheduled trigger: predictable and auditable. Set the interval based on your workflow run frequency — for 100 runs/day, consolidate every 50 runs (twice daily). Scheduled triggers do not respond to acute quality degradation; pair with a quality-degradation trigger at a lower priority for responsive correction.",
					"quality-degradation":
						"Quality-degradation trigger: responsive but requires a throttle to prevent cascade consolidation calls during a sustained failure event. Minimum re-trigger interval: max(1 hour, buffer_refill_time) where buffer_refill_time is the expected time to replace 20% of buffer traces with new runs.",
					manual:
						"Manual trigger: appropriate for production environments where automated strategy changes require human sign-off. Pair with operator alerts when consolidation is recommended (quality below threshold or buffer full) so operators know when to trigger.",
					"buffer-full":
						"Buffer-full trigger: consolidates exactly when the buffer reaches capacity, which ties consolidation frequency to workflow throughput. Risk: in high-throughput workflows the buffer fills rapidly and consolidation becomes too frequent; in low-throughput workflows it may be too infrequent. Set a secondary scheduled trigger as a backstop.",
				};
				const triggerNote =
					triggerNotes[opts.consolidationTrigger as ConsolidationTrigger];
				if (triggerNote) guidances.unshift(triggerNote);
			}

			if (opts.injectionMode) {
				const injectionNotes: Record<InjectionMode, string> = {
					prepend:
						"Prepend injection: strategy update is inserted before existing strategy text. Effective when the update should take precedence over the current strategy. Risk: repeated prepends accumulate strategy text over multiple consolidation cycles; implement a max-length guard and periodic full-replace consolidation to prevent unbounded growth.",
					replace:
						"Replace injection: the strategy section is fully replaced on each consolidation. Cleanest approach — no accumulation, no conflicting instructions. Requires the reflection agent to output a complete, self-contained strategy update rather than just a patch; this is more demanding for the reflection agent prompt design.",
					append:
						"Append injection: new guidance is added after existing strategy text. Suitable when updates are additive (new routing rules for previously unseen input patterns). Risk: ordering effects — later instructions may be deprioritised by the orchestrator model compared to earlier ones; test that appended rules are actually followed.",
				};
				const injectionNote =
					injectionNotes[opts.injectionMode as InjectionMode];
				if (injectionNote) guidances.unshift(injectionNote);
			}

			if (opts.bufferCapacity !== undefined) {
				const estimatedTokensPerTrace = 500;
				const estimatedReflectionCost =
					opts.bufferCapacity * estimatedTokensPerTrace + 1500;
				parts.push(
					`Estimated per-consolidation context window: ~${fmtSig(estimatedReflectionCost)} tokens (${opts.bufferCapacity} traces × ${estimatedTokensPerTrace} tokens/trace + 1500 strategy+output tokens). Verify against your reflection model's context window limit.`,
				);
			}

			if (parts.length > 0) {
				guidances.unshift(parts.filter(Boolean).join(" "));
			}
		}

		// Fallback guidance when no rules matched
		if (guidances.length === 0) {
			guidances.push(
				"To configure a Replay Consolidator: (1) define the ExecutionTrace schema and buffer capacity; (2) choose an eviction policy (recency-quality recommended); (3) select a consolidation trigger (scheduled + quality-degradation hybrid recommended); (4) design the reflection agent prompt and output schema; (5) choose an injection mode (replace is safest); (6) implement a rollback mechanism before enabling live injection.",
				"Start with manual trigger and buffer-full notification — let operators review and approve the first few strategy updates before enabling automated injection. Trust in the reflection agent's update quality must be established empirically before automation.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply the replay consolidation under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints typically govern buffer size, consolidation frequency, and the scope of routing-strategy changes that can be applied without human approval.`,
			);
		}

		guidances.push(RESIL_ADVISORY_DISCLAIMER);

		const bufferCapacity = opts?.bufferCapacity ?? 20;
		const bufferSize = opts?.bufferSize ?? Math.min(bufferCapacity, 15);
		const fillRatio = bufferSize / bufferCapacity;
		const artifacts = [
			buildOutputTemplateArtifact(
				"Replay buffer configuration",
				`{
  "buffer_capacity": <number>,
  "buffer_size": <number>,
  "eviction_policy": "<fifo|quality-weighted|recency-quality>",
  "consolidation_trigger": "<scheduled|quality-degradation|manual|buffer-full>",
  "injection_mode": "<prepend|replace|append>"
}`,
				[
					"buffer_capacity",
					"buffer_size",
					"eviction_policy",
					"consolidation_trigger",
					"injection_mode",
				],
				"Use this template to make replay configuration explicit and reviewable.",
			),
			buildComparisonMatrixArtifact(
				"Replay buffer state matrix",
				["state", "fill", "mix", "action"],
				[
					{
						label: "sparse",
						values: [
							`${Math.round(fillRatio * 100)}% full or below`,
							"insufficient history for a strong update",
							"usually too little failure signal",
							"delay consolidation until the buffer grows",
						],
					},
					{
						label: "adequate",
						values: [
							"enough traces to support a summary",
							"balanced enough for a useful reflection pass",
							"includes both successes and failures",
							"consolidate on schedule or at trigger",
						],
					},
					{
						label: "full",
						values: [
							"buffer at or near capacity",
							"failure-heavy or success-heavy depending on the mix",
							"ready for a consolidation pass",
							"extract a strategy update and inject it",
						],
					},
				],
				"Use this matrix to decide when replay should consolidate the trace buffer.",
			),
			buildWorkedExampleArtifact(
				"Replay consolidation example",
				{
					input: {
						bufferCapacity,
						bufferSize,
						successFraction: opts?.successFraction ?? 0.35,
						consolidationTrigger: opts?.consolidationTrigger ?? "buffer-full",
						injectionMode: opts?.injectionMode ?? "prepend",
					},
					bufferState:
						"failure-heavy trace buffer with recent routing regressions",
				},
				{
					reflectionPrompt:
						"Summarise the failure pattern, keep the successful routing rules, and replace the weak path selection rule.",
					updatedStrategy:
						"prepend a concise routing update and keep a rollback path in reserve",
					nextAction:
						"consolidate now and verify the injected strategy on the next run",
				},
				"Worked example showing the replay buffer moving from observation to strategy update.",
			),
		];

		return createCapabilityResult(
			context,
			`Replay Consolidator produced ${guidances.length - 1} trace-buffer and consolidation guideline${guidances.length - 1 === 1 ? "" : "s"} for hippocampal-style routing-strategy improvement. Results are advisory — validate the reflection agent prompt and injection mechanism before enabling automated strategy updates.`,
			createFocusRecommendations(
				"Replay consolidation guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(skillManifest, resilReplayHandler);
