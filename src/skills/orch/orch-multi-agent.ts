import { z } from "zod";
import { orch_multi_agent_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import {
	extractRequestSignals,
	summarizeContextEvidence,
} from "../shared/recommendations.js";

const orchMultiAgentInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			agentArchitecture: z
				.enum(["hierarchical", "peer-to-peer", "hub-and-spoke", "pipeline"])
				.optional(),
			communicationPattern: z
				.enum(["message-passing", "shared-state", "event-driven"])
				.optional(),
			includeObservability: z.boolean().optional(),
		})
		.passthrough()
		.optional(),
});

type AgentArchitecture =
	| "hierarchical"
	| "peer-to-peer"
	| "hub-and-spoke"
	| "pipeline";
type CommunicationPattern = "message-passing" | "shared-state" | "event-driven";
type MultiAgentInput = BaseSkillInput & {
	options?: {
		agentArchitecture?: AgentArchitecture;
		communicationPattern?: CommunicationPattern;
		includeObservability?: boolean;
	};
};

const MULTI_AGENT_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(role|responsib|owner|leader|coordinator|orchestrat|lead)\b/i,
		detail:
			"Define each agent's role as a capability boundary, not a job title. Every agent should own a distinct set of actions that no other agent performs. Overlapping responsibility sets are the primary source of conflicting outputs in multi-agent systems.",
	},
	{
		pattern:
			/\b(communicate|message|channel|event|publish|subscribe|broadcast|signal)\b/i,
		detail:
			"Use typed messages for all inter-agent communication. Agents that communicate through shared mutable state are tightly coupled and cannot be tested or replaced independently.",
	},
	{
		pattern:
			/\b(trust|authority|permission|scope|access|guardrail|isolation)\b/i,
		detail:
			"Assign each agent the minimum authority it needs to complete its role. An agent with broad permissions that it does not exercise creates an unnecessary blast radius when misrouted or compromised.",
	},
	{
		pattern: /\b(scale|load|throughput|latency|queue|buffer|backpressure)\b/i,
		detail:
			"Design the communication topology with backpressure in mind. Agents that produce faster than their consumers can absorb will cause unbounded queue growth unless the system can shed load or throttle producers.",
	},
	{
		pattern: /\b(test|unit|integr|verif|simulat|mock|inject)\b/i,
		detail:
			"Make each agent independently testable by defining its input/output contract before wiring the topology. An agent that can only be verified inside the full system will fail in unexpected ways when the system topology changes.",
	},
	{
		pattern:
			/\b(observ|monitor|trace|log|debug|visibility|audit|introspect)\b/i,
		detail:
			"Add a shared observability layer that captures each agent's inputs, outputs, and timing without requiring changes to individual agents. You cannot debug a multi-agent system you cannot observe.",
	},
	{
		pattern: /\b(fail|error|recover\w*|resilience|fallback|circuit|degrad)\b/i,
		detail:
			"Plan for partial failures: define how the system behaves when any one agent is unavailable. A multi-agent system that requires all agents to be healthy simultaneously is a single point of failure distributed across multiple processes.",
	},
	{
		pattern: /\b(coordinator|central|orchestrat|hub|dispatch|manag)\b/i,
		detail:
			"If using a central coordinator, ensure it is stateless and replaceable. A stateful coordinator that holds the only copy of task state becomes a single point of failure and a scaling bottleneck.",
	},
];

function inferArchitecture(
	input: string,
	explicit?: AgentArchitecture,
): AgentArchitecture {
	if (explicit !== undefined) return explicit;
	if (/\b(pipeline|sequential|chain|stage|linear)\b/i.test(input))
		return "pipeline";
	if (/\b(hub|spoke|central|star)\b/i.test(input)) return "hub-and-spoke";
	if (/\b(peer|p2p|mesh|gossip|flat)\b/i.test(input)) return "peer-to-peer";
	return "hierarchical";
}

function buildTopologyBlueprint(
	input: MultiAgentInput,
	architecture: AgentArchitecture,
	communicationPattern: CommunicationPattern,
	includeObservability: boolean,
) {
	const roleSets: Record<
		AgentArchitecture,
		Array<{
			id: string;
			responsibilityBoundary: string;
			inputContract: string;
			outputContract: string;
			failureMode: string;
		}>
	> = {
		hierarchical: [
			{
				id: "lead-orchestrator",
				responsibilityBoundary:
					"decompose the goal, route tasks, and approve stage transitions",
				inputContract: "global goal, constraints, current state",
				outputContract: "scoped assignments with routing decisions",
				failureMode:
					"halt fan-out and escalate when routing or synthesis gates fail",
			},
			{
				id: "specialist-worker",
				responsibilityBoundary: "execute one capability-bounded task slice",
				inputContract:
					"assignment packet, task-scoped context, acceptance criteria",
				outputContract: "validated sub-result plus status",
				failureMode:
					"return partial or failed status without taking extra work",
			},
			{
				id: "synthesis-owner",
				responsibilityBoundary:
					"merge specialist outputs into the final deliverable",
				inputContract: "validated sub-results and conflict notes",
				outputContract: "final merged result with provenance",
				failureMode: "surface unresolved conflicts instead of forcing a merge",
			},
		],
		"peer-to-peer": [
			{
				id: "planner-peer",
				responsibilityBoundary:
					"advertise work, discover peers, and negotiate task fit",
				inputContract: "goal fragment, peer capability advertisement",
				outputContract: "peer agreement or task claim",
				failureMode:
					"emit negotiation failure and release the task for reassignment",
			},
			{
				id: "executor-peer",
				responsibilityBoundary:
					"perform the claimed task slice and publish result events",
				inputContract: "claimed task, local context snapshot",
				outputContract: "result event with evidence and confidence",
				failureMode: "publish failed status so peers can compensate",
			},
			{
				id: "review-peer",
				responsibilityBoundary:
					"verify peer output and resolve overlap locally",
				inputContract: "peer result event, correlation id, capability boundary",
				outputContract: "accept / reject decision with conflict note",
				failureMode:
					"escalate unresolved conflicts to the shared synthesis gate",
			},
		],
		"hub-and-spoke": [
			{
				id: "hub",
				responsibilityBoundary:
					"route requests, maintain queue ownership, and aggregate responses",
				inputContract: "global task, queue state, specialist registry",
				outputContract: "spoke assignment packets and fan-in synthesis queue",
				failureMode: "degrade gracefully by rerouting or pausing assignment",
			},
			{
				id: "specialist-spoke",
				responsibilityBoundary:
					"execute one specialist lane without cross-spoke coordination",
				inputContract: "hub-issued assignment packet",
				outputContract: "typed spoke result with exit signal",
				failureMode:
					"return failed spoke result to the hub for retry or reassignment",
			},
			{
				id: "fan-in-synthesiser",
				responsibilityBoundary:
					"reconcile spoke outputs into the caller-facing result",
				inputContract: "hub-validated spoke results",
				outputContract: "final assembled result",
				failureMode: "stop the release when a required spoke result is missing",
			},
		],
		pipeline: [
			{
				id: "stage-1",
				responsibilityBoundary: "intake, normalization, and decomposition",
				inputContract: "raw request, constraints, prior context",
				outputContract: "normalized work packet for the next stage",
				failureMode: "reject ambiguous input before downstream work begins",
			},
			{
				id: "stage-2",
				responsibilityBoundary:
					"specialist execution against the normalized packet",
				inputContract: "normalized work packet and acceptance criteria",
				outputContract: "validated stage result",
				failureMode:
					"return a failed stage result and stop the pipeline at the gate",
			},
			{
				id: "stage-3",
				responsibilityBoundary: "final synthesis and deliverable assembly",
				inputContract: "validated stage result and provenance",
				outputContract: "final deliverable plus residual gaps",
				failureMode:
					"surface incomplete synthesis rather than skipping missing data",
			},
		],
	};

	return {
		topology: architecture,
		goal: input.request || "(unspecified)",
		deliverable: input.deliverable || "final multi-agent output",
		communicationPattern,
		agentRoles: roleSets[architecture],
		handoffContract: {
			messageEnvelope: [
				"correlationId",
				"sender",
				"receiver",
				"capabilityBoundary",
				"payloadReference",
				"status",
			],
			sharedStatePolicy:
				communicationPattern === "shared-state"
					? "shared state is read-only except for one named write owner"
					: "no shared writable state; all coordination flows through typed messages",
			failureSignal:
				"complete / partial / failed with evidence and next-step signal",
		},
		observability: includeObservability
			? {
					traceFields: ["correlationId", "agentId", "latencyMs", "status"],
					sink: "observability sidecar",
				}
			: { traceFields: ["correlationId"], sink: "caller-managed logging" },
	};
}

const orchMultiAgentHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(orchMultiAgentInputSchema, input);
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
				"Multi-Agent Design needs the system goals, agent roles, or communication requirements before it can produce an architecture recommendation.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const architecture = inferArchitecture(
			combined,
			parsed.data.options?.agentArchitecture,
		);
		const communicationPattern =
			parsed.data.options?.communicationPattern ??
			(/\b(event|publish|subscribe|async)\b/i.test(combined)
				? "event-driven"
				: /\b(shared|state|memory|store)\b/i.test(combined)
					? "shared-state"
					: "message-passing");
		const includeObservability =
			parsed.data.options?.includeObservability ?? true;

		const archDescriptions: Record<AgentArchitecture, string> = {
			hierarchical:
				"Use a hierarchical topology: a lead orchestrator decomposes the goal and delegates to specialists who report back. Good for complex tasks with clear sub-task boundaries and sequential dependencies.",
			"peer-to-peer":
				"Use a peer-to-peer topology: agents discover and message each other directly without a central broker. Good for emergent coordination but requires each agent to implement conflict-resolution locally.",
			"hub-and-spoke":
				"Use a hub-and-spoke topology: a central hub routes tasks to specialist spokes and aggregates results. Good for clear fan-out / fan-in patterns but the hub is a single point of failure.",
			pipeline:
				"Use a pipeline topology: agents execute sequentially, each consuming the previous agent's output as input. Good for deterministic multi-stage transformations but lacks parallelism between stages.",
		};

		const details: string[] = [
			`Design the multi-agent system for "${summarizeKeywords(parsed.data).join(", ") || "the requested goal"}" as a ${architecture} topology with ${communicationPattern} communication. ${archDescriptions[architecture]}`,
			"Define every agent with four fields before wiring the topology: responsibility boundary, input contract, output contract, and failure mode. A topology without per-role contracts is still prose, not an executable design.",
		];

		details.push(
			...MULTI_AGENT_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (includeObservability) {
			details.push(
				"Add a dedicated observability agent or sidecar that receives copies of all inter-agent messages without participating in the task. Correlation IDs on every message allow full trace reconstruction across agent boundaries.",
			);
		}

		if (communicationPattern === "event-driven") {
			details.push(
				"Standardize the event envelope before any agent publishes: correlation ID, sender, receiver or topic, capability boundary, payload reference, and status must travel with each event or the topology becomes impossible to trace.",
			);
		} else if (communicationPattern === "shared-state") {
			details.push(
				"Restrict shared state to read-only snapshots plus one named write owner. Shared mutable state without a single write authority collapses role boundaries and makes conflict attribution impossible.",
			);
		} else {
			details.push(
				"Use an explicit request/response contract for message-passing links so each handoff has an owner, a typed payload, and a completion signal.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Trace every agent role back to the stated deliverable: "${parsed.data.deliverable}". An agent whose outputs do not contribute — directly or transitively — to that deliverable should be removed from the design.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Encode the success criteria as system-level acceptance tests that validate the final assembled output, not just individual agent outputs: "${parsed.data.successCriteria}".`,
			);
		}

		if (signals.hasContext || signals.hasEvidence) {
			details.push(
				summarizeContextEvidence(signals) ??
					"Ground the topology recommendation in the provided evidence and context rather than defaulting to generic multi-agent heuristics.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				signals.hasEvidence
					? `Enforce the stated constraints against the retrieved evidence set, not in runtime guards: ${signals.constraintList.slice(0, 3).join("; ")}. If the current evidence does not substantiate a topology move, record that gap explicitly instead of restating the constraint generically.`
					: `Enforce the stated constraints in the topology design, not in runtime guards: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints are cheaper to enforce structurally than to police at runtime.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Bootstrap the agent topology from the provided context so agents can resume from the existing state instead of re-deriving it. Multi-agent systems that ignore prior context produce inconsistent results across re-runs.",
			);
		}

		const topologyBlueprint = buildTopologyBlueprint(
			parsed.data,
			architecture,
			communicationPattern,
			includeObservability,
		);

		return createCapabilityResult(
			context,
			`Multi-Agent Design produced ${details.length} architecture decision${details.length === 1 ? "" : "s"} (topology: ${architecture}, communication: ${communicationPattern}).`,
			createFocusRecommendations(
				"Architecture decision",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Topology comparison",
					["Topology", "Best use case", "Primary tradeoff"],
					[
						{
							label: "Hierarchical",
							values: [
								"Complex tasks need one owner for decomposition and release control",
								"Lead coordination can bottleneck under heavy fan-out",
								"Use when sequencing and approval gates matter",
							],
						},
						{
							label: "Peer-to-peer",
							values: [
								"Peers should discover each other and negotiate work directly",
								"Each peer must implement conflict resolution and trust controls",
								"Use when decentralized coordination is worth the extra protocol cost",
							],
						},
						{
							label: "Hub-and-spoke",
							values: [
								"Clear fan-out and fan-in with a strong central router",
								"The hub is a failure and scaling hotspot unless it stays replaceable",
								"Use when a single task queue should govern specialist work",
							],
						},
						{
							label: "Pipeline",
							values: [
								"Stages transform output sequentially with explicit gates",
								"Later stages wait for earlier ones, limiting parallelism",
								"Use when deterministic stage boundaries matter more than concurrency",
							],
						},
					],
					"Choose the topology that matches the coordination shape rather than retrofitting roles later.",
				),
				buildOutputTemplateArtifact(
					"Agent role contract template",
					[
						"# Multi-agent blueprint",
						"## Topology",
						"## Communication pattern",
						"## Agent roles",
						"### Responsibility boundary",
						"### Input contract",
						"### Output contract",
						"### Failure mode",
						"## Handoff contract",
						"## Observability",
						"## Success gates",
					].join("\n"),
					[
						"Topology",
						"Communication pattern",
						"Agent roles",
						"Responsibility boundary",
						"Input contract",
						"Output contract",
						"Failure mode",
						"Handoff contract",
						"Observability",
						"Success gates",
					],
					"Use this template to turn role ideas into a topology with explicit ownership and message contracts.",
				),
				buildWorkedExampleArtifact(
					"Multi-agent blueprint example",
					{
						request:
							"design peer agents with typed messages, observability, and resilience under backpressure",
						deliverable: "multi-agent architecture spec",
						options: {
							agentArchitecture: "peer-to-peer",
							communicationPattern: "event-driven",
							includeObservability: true,
						},
					},
					topologyBlueprint,
					"Worked example showing a concrete topology, agent-role contract set, and message envelope.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	orchMultiAgentHandler,
);
