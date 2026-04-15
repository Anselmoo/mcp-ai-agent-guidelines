import { z } from "zod";
import { adapt_quorum_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	hasConvergenceSignal,
	hasPersistenceSignal,
	hasQualityMeasureSignal,
} from "./routing-helpers.js";

// This handler advises on decentralised agent task assignment via quorum sensing:
// agents emit availability signals {specialisations, load, quality_recent} and a
// quorum listener aggregates signal_sum = Σ(quality_recent × (1−load)) over
// specialisation-matched agents.  When signal_sum ≥ quorum_threshold, the task
// is broadcast.
//
// Scope — advisory and signal-driven only.  This handler does NOT:
//   • maintain a live agent registry or emit real broadcast messages
//   • implement signal transport (advises on pub/sub patterns)
//   • replace a central orchestrator at runtime (advises on gradual migration)
//   • cover pheromone-trail or conductance routing (use adapt-aco-router /
//     adapt-physarum-router for edge-weight approaches)
//
// Outputs are advisory guidance items that the host LLM uses to reason with.

const quorumInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			quorumPolicy: z
				.enum(["strict", "weighted", "probabilistic"])
				.optional()
				.describe(
					"Quorum evaluation policy: strict (signal_sum must meet threshold before broadcast), weighted (specialisation specificity scales each agent's contribution), or probabilistic (soft threshold using sigmoid; allows partial quorum formation at reduced confidence).",
				),
			fallbackBehaviour: z
				.enum(["queue", "escalate", "retry"])
				.optional()
				.describe(
					"Behaviour when quorum does not form within the timeout window: queue (hold task until threshold is reached), escalate (hand off to a central backup scheduler), or retry (re-emit the task signal after a fixed interval).",
				),
		})
		.optional(),
});

type QuorumPolicy = "strict" | "weighted" | "probabilistic";
type FallbackBehaviour = "queue" | "escalate" | "retry";

// ---------------------------------------------------------------------------
// Domain signal detector
//
// Quorum sensing is semantically distinct from the routing trio (ACO / Physarum /
// Hebbian): it operates over agent-readiness signals and collective thresholds,
// not over workflow-edge weights.  This detector identifies requests that carry
// enough quorum-specific vocabulary to produce targeted guidance.
// ---------------------------------------------------------------------------

function hasQuorumDomainSignal(combined: string): boolean {
	// Cluster A — explicit quorum / decentralisation vocabulary
	if (
		/\b(quorum|signal_sum|quorum.sens|quorum.threshold|no.central|decentralis|decentraliz|self.organis|self.organiz|emergent.task|agents.claim|load.based.routing)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — availability/load signals co-occurring with agent task context
	// ("agents signal availability", "load affects task pickup", "ready agents claim work")
	if (
		/\b(availabilit|readiness|load|busy|idle|capacity)\b/i.test(combined) &&
		/\b(agent|worker|node|participant|task|assign|claim|pickup)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — threshold / broadcast in a coordination context
	if (
		/\b(threshold|broadcast|collective|consensus|agreement|quorum|minimum.participants?)\b/i.test(
			combined,
		) &&
		/\b(agent|worker|coord|dispatch|assign|task)\b/i.test(combined)
	)
		return true;

	return false;
}

// ---------------------------------------------------------------------------
// Per-pattern advisory rules
// ---------------------------------------------------------------------------

const QUORUM_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(signal|emit|publish|broadcast.signal|agent.signal|availability.signal|readiness.signal|specialisa|specializa|load|quality_recent)\b/i,
		detail:
			"Define the agent signal schema before wiring any aggregation logic. Each agent should publish a structured record: { agentId: string, specialisations: string[], load: number, quality_recent: number } where load ∈ [0, 1] (0 = fully available, 1 = fully saturated) and quality_recent ∈ [0, 1] reflects the agent's mean success rate over the most recent N completed tasks. Validate schema on publication — reject signals missing required fields or carrying out-of-range values rather than silently clamping them, so unhealthy agents are visible rather than invisible.",
	},
	{
		pattern:
			/\b(signal_sum|aggregate|sum|Σ|accumulate|collect|tally|score|compute.quorum)\b/i,
		detail:
			"Compute signal_sum = Σ(quality_recent × (1 − load)) over all agents whose specialisations intersect the task requirements. Apply specialisation filtering first, then aggregate: this prevents an army of off-topic but lightly-loaded agents from forming a false quorum. Normalise each agent's contribution by the maximum possible contribution (1.0 × 1.0 = 1.0) so signal_sum has an interpretable upper bound equal to the number of matching agents. Emit signal_sum as a structured log event per evaluation cycle so aggregation can be audited and replayed.",
	},
	{
		pattern:
			/\b(threshold|quorum_threshold|minimum|floor|cutoff|trigger|fire|when.enough)\b/i,
		detail:
			"Set quorum_threshold relative to fleet capacity, not as an absolute scalar. A threshold of 0.6 × max_signal_sum (where max_signal_sum = count of specialisation-matched agents × 1.0) means the quorum fires when 60% of matched capacity is ready. Re-evaluate the threshold whenever the fleet size changes by more than 20% to prevent a shrinking fleet from never reaching a static threshold, or a growing fleet from reaching threshold trivially. Store the threshold derivation formula alongside its current value so future operators understand why the scalar was chosen.",
	},
	{
		pattern:
			/\b(minimum.participant|min.agent|floor.agent|at.least|number.of.agent|count.agent|participant.count)\b/i,
		detail:
			"Enforce a minimum participation floor (min_participants) independent of signal_sum. Even if signal_sum ≥ quorum_threshold, refuse to broadcast if fewer than min_participants agents have contributed signals. A single highly-available, high-quality agent can satisfy a signal_sum threshold while providing no redundancy — min_participants prevents single-agent quorum claims from masquerading as genuine decentralised consensus. Set min_participants ≥ 2 for tasks where partial agent failure is a concern; raise it to 3–5 for safety-critical workflows.",
	},
	{
		pattern:
			/\b(specialisa|specializa|match|filter|relevant|suitable|domain|capabilit|skill|fit)\b/i,
		detail:
			"Implement specialisation matching as a pre-aggregation filter, not a post-aggregation weight. Before computing signal_sum, build a candidate set of agents whose specialisations array includes at least one of the task's required tags. Only signals from candidate agents enter the aggregation. This boundary prevents domain drift: a task requiring 'code-review' should not receive contributions from agents specialised in 'documentation' even if those agents are available and high-quality. Expose the candidate set size in logs so you can detect under-staffing (e.g., zero agents match a required specialisation).",
	},
	{
		pattern:
			/\b(broadcast|claim|dispatch|assign|notify|trigger|fire|announce)\b/i,
		detail:
			"When quorum forms, broadcast the task specification to all candidate agents simultaneously — not only to the single highest-signal agent. Quorum sensing is a collective coordination primitive: the broadcast lets each agent decide locally whether to claim the task based on its current state (which may have changed since signal publication). Implement claim acknowledgement with a short deadline (e.g., 2× agent signal period); if no agent claims within the deadline, treat the broadcast as failed and invoke the configured fallback behaviour.",
	},
	{
		pattern:
			/\b(fallback|no.quorum|timeout|escalat|retry|queue|backup|fail)\b/i,
		detail:
			"Define a fallback path for the case where quorum does not form within the timeout window. Three viable strategies: (1) queue — hold the task in a durable queue and re-evaluate when any agent signal refreshes; (2) escalate — hand off to a central backup scheduler with full task context; (3) retry — re-emit the task signal after a fixed interval. Choose queue when task latency tolerance is high and fleet availability is expected to recover; choose escalate when the task is time-sensitive; choose retry when signals are stale and a fresh emission is likely to see different agent states. Instrument the fallback path separately so its frequency is visible in metrics.",
	},
	{
		pattern:
			/\b(load|busy|saturat|over.load|under.load|capacity|utilisa|utiliz|throughput)\b/i,
		detail:
			"The (1 − load) weight in signal_sum makes heavily-loaded agents contribute less to quorum formation, which naturally routes tasks toward available capacity without a central scheduler. To calibrate load reporting: agents should publish load as a smoothed exponential moving average over recent task completions (e.g., EMA with α = 0.2 over the last 20 task windows) rather than an instantaneous value — instantaneous load spikes cause quorum to oscillate, while EMA-smoothed load produces stable signal_sum trajectories. Validate that load values are publishing at the expected cadence; a stale load = 0 from an agent that has crashed looks like an available agent.",
	},
	{
		pattern:
			/\b(scale|horizontal|fleet.size|more.agent|add.agent|grow|expand|dynami)\b/i,
		detail:
			"Plan for dynamic fleet membership from the outset: agents join and leave the fleet during normal operation, and quorum_threshold must adapt accordingly. Use a sliding-window registry that expires agent entries after 2× the signal publication interval — this automatically removes crashed or disconnected agents from the candidate pool. When fleet size changes, recompute quorum_threshold using the formula rather than re-configuring a static value. Emit a fleet-size-change event whenever entries expire or new agents register so downstream dashboards can correlate fleet changes with quorum formation latency.",
	},
	{
		pattern:
			/\b(cold.start|bootstrap|initial|no.agent|few.agent|start.up|warm.up|small.fleet)\b/i,
		detail:
			"Handle cold-start conditions explicitly: when fewer than min_participants agents have published signals, quorum cannot form by definition. Rather than silently queuing tasks indefinitely during startup, emit a cold-start warning that names the missing specialisations and the current candidate count. Provide a bootstrap mode where a single designated agent can claim tasks unilaterally until min_participants threshold is reached — but log every bootstrap claim separately so the period of reduced redundancy is auditable and time-bounded.",
	},
	{
		pattern:
			/\b(central|bottleneck|single.point|orchestrat|dispatcher|coordinator|replace|migrate|transition)\b/i,
		detail:
			"Migrate from a central dispatcher to quorum sensing incrementally: start by running both in parallel with the quorum listener in shadow mode (it computes signal_sum and logs when quorum would have fired, but the central dispatcher still makes the actual assignment). Compare quorum broadcast latency and task completion quality against the central dispatch baseline over 7–14 days before cutting over. Define a circuit-breaker condition — if quorum fails to form for more than N consecutive tasks within a time window, automatically revert to central dispatch and alert the team. This prevents a hard cutover from exposing latent fleet-readiness issues in production.",
	},
	{
		pattern:
			/\b(probabilistic|soft.threshold|sigmoid|partial.quorum|confidence|uncertainty)\b/i,
		detail:
			"In probabilistic quorum mode, compute P(broadcast) = sigmoid((signal_sum − quorum_threshold) / temperature) rather than a hard step function. Temperature controls the sharpness of the transition: low temperature (0.1–0.3) approximates hard quorum; high temperature (0.7–1.0) allows broadcast at partial readiness with a scaled confidence. Attach P(broadcast) to the broadcast event so downstream agents can modulate their claim priority accordingly — an agent receiving a low-confidence broadcast may choose to queue rather than claim immediately, preserving capacity for higher-confidence tasks.",
	},
];

const QUORUM_POLICY_LABELS: Record<QuorumPolicy, string> = {
	strict:
		"strict threshold (signal_sum must meet or exceed quorum_threshold before broadcast)",
	weighted:
		"weighted contributions (specialisation specificity multiplies each agent's signal)",
	probabilistic:
		"probabilistic broadcast (sigmoid soft threshold with configurable temperature)",
} as const;

const FALLBACK_BEHAVIOUR_LABELS: Record<FallbackBehaviour, string> = {
	queue: "queue (hold task until quorum forms or timeout expires)",
	escalate: "escalate (hand off to central backup scheduler after timeout)",
	retry: "retry (re-emit task signal after fixed interval)",
} as const;

function inferQuorumPolicy(
	combined: string,
	explicit?: QuorumPolicy,
): QuorumPolicy {
	if (explicit !== undefined) return explicit;
	if (
		/\b(probabilistic|soft|sigmoid|partial|confidence|uncertainty|gradual)\b/i.test(
			combined,
		)
	)
		return "probabilistic";
	if (
		/\b(weight|specificit|match.score|relevance.score|domain.weight)\b/i.test(
			combined,
		)
	)
		return "weighted";
	return "strict";
}

function inferFallbackBehaviour(
	combined: string,
	explicit?: FallbackBehaviour,
): FallbackBehaviour {
	if (explicit !== undefined) return explicit;
	if (
		/\b(escalat|central|backup.scheduler|hand.off|fallback.coordinator)\b/i.test(
			combined,
		)
	)
		return "escalate";
	if (/\b(retry|re.emit|re.publish|try.again|interval)\b/i.test(combined))
		return "retry";
	return "queue";
}

// ---------------------------------------------------------------------------
// Supplementary signal helpers (quorum-specific)
// ---------------------------------------------------------------------------

function hasSpecialisationMatchSignal(combined: string): boolean {
	return /\b(specialisa|specializa|capabilit|skill.tag|domain.tag|match|relevant.agent|suited.agent)\b/i.test(
		combined,
	);
}

function hasLoadBalancingSignal(combined: string): boolean {
	return /\b(load.balance|load.distribut|even.distribut|saturat|over.load|under.load|work.distribut)\b/i.test(
		combined,
	);
}

function hasFleetDynamicsSignal(combined: string): boolean {
	return /\b(fleet|scale|dynami.agent|agent.join|agent.leave|agent.crash|agent.recover|registry|agent.pool)\b/i.test(
		combined,
	);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const quorumHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(quorumInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		// Stage 1 — completely vague: no keywords and no context
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Quorum Coordinator needs a description of the agent fleet, the signals agents can publish (load, quality, specialisations), and the coordination objective before it can produce targeted guidance. Describe the agents, the tasks they handle, and whether the goal is eliminating a central dispatcher or managing load-aware task assignment.",
			);
		}

		// Stage 2 — keywords present but no quorum-distinctive signal and no
		// compensating context (agent-coordination, threshold, availability vocab).
		if (!hasQuorumDomainSignal(combined) && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Quorum Coordinator could not identify quorum-sensing details in this request. To generate targeted guidance, describe at least one of: (a) the availability or readiness signals agents can publish (load, quality_recent, specialisations), (b) the quorum threshold or minimum participation requirement that should trigger task broadcast, or (c) the decentralised coordination or self-organisation goal you are trying to achieve. Without this, the request is too general to distinguish quorum sensing from other adaptive coordination patterns.",
				"Add agent-signal structure (load, quality, specialisations), a threshold or participation floor, or a decentralised coordination intent to the request so Quorum Coordinator can produce targeted recommendations.",
			);
		}

		const quorumPolicy = inferQuorumPolicy(
			combined,
			parsed.data.options?.quorumPolicy,
		);
		const fallbackBehaviour = inferFallbackBehaviour(
			combined,
			parsed.data.options?.fallbackBehaviour,
		);

		const details: string[] = [
			`Quorum sensing advisory for ${QUORUM_POLICY_LABELS[quorumPolicy]}, fallback: ${FALLBACK_BEHAVIOUR_LABELS[fallbackBehaviour]}. This guidance is advisory: it describes signal schemas, aggregation mechanics, and threshold heuristics but does not implement a live agent registry, transport layer, or broadcast mechanism — wire these patterns into your own coordination layer.`,
		];

		details.push(
			...QUORUM_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (details.length === 1) {
			// No domain rules fired — supply baseline quorum orientation
			details.push(
				"Establish three foundational components before tuning quorum parameters: (1) a signal schema that agents publish on a fixed cadence (e.g., every 5s) containing specialisations, load, and quality_recent; (2) a quorum listener that maintains a sliding-window registry of live agent signals and re-evaluates signal_sum whenever a new signal arrives; and (3) a broadcast channel that delivers the task specification to all candidate agents when quorum fires. These three components are independent concerns — define and test each in isolation before integrating them.",
				"Size quorum_threshold relative to the fleet, not as a fixed number. A practical starting point: quorum_threshold = 0.5 × (count of agents matching the task's required specialisations). This means quorum fires when roughly half the capable fleet is ready, providing a balance between responsiveness and load distribution. Revisit the formula whenever fleet composition changes significantly.",
				"Define the agent signal publication interval and set the quorum evaluation timeout to 3–5× that interval. If an agent publishes every 5s, set the evaluation timeout to 15–25s. Shorter timeouts increase the chance that stale signals mislead the quorum calculation; longer timeouts increase task latency. Log timeout events separately from quorum-formation events so you can distinguish 'quorum formed slowly' from 'quorum never formed'.",
			);
		}

		// Signal-supplementary items
		if (hasSpecialisationMatchSignal(combined)) {
			details.push(
				"Model specialisation matching as a set intersection, not substring matching: each agent's specialisations is a set of discrete capability tags (e.g., 'code-review', 'security-audit', 'ts-migration'), and a task defines its required tags explicitly. An agent matches if its specialisations set contains at least one required tag. Fuzzy matching (e.g., 'typescript' matches 'ts') introduces ambiguity — prefer exact tags and maintain a canonical tag vocabulary in a shared configuration file so agents and tasks use identical strings.",
			);
		}

		if (hasLoadBalancingSignal(combined)) {
			details.push(
				"The (1 − load) weighting naturally steers task broadcast toward under-loaded agents, but it does not guarantee even load distribution across the fleet. To avoid persistent hotspots: after a quorum broadcast, the agent that claims the task should immediately update its load signal before the next evaluation cycle. Delayed load updates cause subsequent evaluations to treat a now-busy agent as still available, leading to over-claiming. Implement optimistic load update: increment load by the estimated task cost as soon as the agent claims, before completing the task.",
			);
		}

		if (hasFleetDynamicsSignal(combined)) {
			details.push(
				"Maintain the agent registry as a TTL cache: each incoming signal resets the TTL for that agent's entry to 2× the expected signal interval. When an entry expires, remove the agent from the candidate pool immediately and emit an 'agent-timeout' event so the quorum evaluator recomputes signal_sum without that agent's contribution. Never allow a crashed agent's last-known signal to persist in the registry — stale load = 0 entries make a crashed agent look like the most available agent in the fleet.",
			);
		}

		if (hasQualityMeasureSignal(combined)) {
			details.push(
				"quality_recent should reflect the agent's recent output quality on tasks matching the current task type, not an overall quality average. An agent that excels at 'code-review' but struggles with 'security-audit' should report different quality_recent values depending on which specialisation is active. Partition quality tracking by specialisation tag: quality_recent[tag] = EMA(success_flag, α=0.3) computed separately for each tag the agent handles. This prevents a high quality score on frequent easy tasks from masking poor performance on rare hard tasks.",
			);
		}

		if (hasConvergenceSignal(combined)) {
			details.push(
				"Monitor quorum formation latency across evaluation cycles to detect when the system has 'converged' onto a stable fleet configuration. Convergence is healthy when quorum forms quickly and consistently; it is a warning sign when the same subset of agents always reaches quorum (suggesting other agents are perpetually over-loaded or under-specialised). Track per-agent quorum participation frequency and alert when any eligible agent's participation rate drops below 10% — this indicates it is effectively excluded from task assignment despite being registered in the fleet.",
			);
		}

		if (hasPersistenceSignal(combined)) {
			details.push(
				"Persist the agent registry state and the task queue (for queue fallback) to durable storage so a quorum listener restart does not lose in-flight coordination state. Use an append-only event log: signal-received, quorum-formed, task-broadcast, task-claimed, agent-timeout events are the minimal event types. On restart, replay the log to reconstruct registry state and re-evaluate any tasks that were queued but not yet claimed. Do not persist raw request payloads in the event log — log only task identifiers and metadata to avoid raw input leakage into durable storage.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply quorum configuration within these constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints on signal publication latency, fleet size upper bounds, or task SLA deadlines directly affect quorum_threshold, min_participants, and fallback timeout choices — document which constraints drove which parameter decisions for future tuning reference.`,
			);
		}

		const artifacts = [
			buildOutputTemplateArtifact(
				"Quorum signal schema",
				`{
  "agent_id": "<id>",
  "specialisations": ["<tag>"],
  "load": <0..1>,
  "quality_recent": <0..1>,
  "published_at": "<timestamp>"
}`,
				[
					"agent_id",
					"specialisations",
					"load",
					"quality_recent",
					"published_at",
				],
				"Use this schema to keep agent readiness signals uniform and auditable.",
			),
			buildComparisonMatrixArtifact(
				"Quorum policy matrix",
				["policy", "broadcast rule", "best for", "risk"],
				[
					{
						label: "strict",
						values: [
							"fire only when signal_sum reaches threshold",
							"deterministic release gating",
							"may delay broadcasts during partial readiness",
						],
					},
					{
						label: "weighted",
						values: [
							"scale contributions by specialisation fit",
							"mixed fleets and narrow tasks",
							"needs a canonical tag vocabulary",
						],
					},
					{
						label: "probabilistic",
						values: [
							"use a sigmoid over signal_sum",
							"soft transitions with partial confidence",
							"can broadcast too early without calibration",
						],
					},
				],
				"Use the matrix to choose the quorum policy before wiring the listener.",
			),
			buildToolChainArtifact(
				"Quorum coordination flow",
				[
					{
						tool: "publish",
						description:
							"Agents emit readiness signals with load and quality fields.",
					},
					{
						tool: "filter",
						description:
							"Keep only agents whose specialisations match the task.",
					},
					{
						tool: "aggregate",
						description:
							"Compute signal_sum and compare it with the derived threshold.",
					},
					{
						tool: "broadcast",
						description:
							"Send the task to all qualifying agents when quorum forms.",
					},
					{
						tool: "fallback",
						description: "Queue, escalate, or retry when quorum never forms.",
					},
				],
				"Use this flow to make the coordination path explicit and measurable.",
			),
		];

		return createCapabilityResult(
			context,
			`Quorum Coordinator produced ${details.length} advisory guidance item${details.length === 1 ? "" : "s"} for ${QUORUM_POLICY_LABELS[quorumPolicy]} (fallback: ${fallbackBehaviour}).`,
			createFocusRecommendations(
				"Quorum coordination",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(skillManifest, quorumHandler);
