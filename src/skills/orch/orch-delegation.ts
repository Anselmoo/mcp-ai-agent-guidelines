import { z } from "zod";
import { orch_delegation_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const orchDelegationInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			delegationMode: z.enum(["push", "pull", "negotiated"]).optional(),
			allowSubdelegation: z.boolean().optional(),
			maxDelegationDepth: z.number().int().positive().max(5).optional(),
		})
		.optional(),
});

const DELEGATION_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(capability|skill|expert|specialist|domain|boundary)\b/i,
		detail:
			"Delegate by capability boundary, not by availability. A subagent should be chosen because it owns the required skill, not because it is idle. Misrouting by availability produces correct-looking but incorrect results.",
	},
	{
		pattern: /\b(when|trigger|condition|threshold|decision|escalat)\b/i,
		detail:
			"Define explicit delegation triggers: the conditions that make the parent agent hand off a task rather than attempt it inline. Implicit delegation (delegating because something feels complex) creates unpredictable routing at scale.",
	},
	{
		pattern: /\b(contract|interface|protocol|handshake|accept|reject)\b/i,
		detail:
			"Establish a delegation contract between the delegating agent and the subagent: required inputs, expected output format, completion signal, and the error signal the caller should handle. A subagent that fails silently breaks the parent's control flow.",
	},
	{
		pattern: /\b(result|return|report|response|output|deliver|feedback)\b/i,
		detail:
			"Require the subagent to return a typed result with a clear status (complete / partial / failed) rather than raw text. The delegating agent cannot make a safe continuation decision from an unstructured response.",
	},
	{
		pattern: /\b(trust|authority|permission|scope|limit|guardrail|sandbox)\b/i,
		detail:
			"Constrain each delegation scope: the subagent should be able to read only the data it needs and write only within its defined boundary. Unbounded delegation authority is the primary attack surface in multi-agent systems.",
	},
	{
		pattern: /\b(monitor|track|timeout|sla|deadline|latency)\b/i,
		detail:
			"Set a timeout and escalation path for every delegation. A parent agent waiting indefinitely for a subagent is a pipeline stall — the orchestrator should decide when to timeout and either retry, reassign, or escalate.",
	},
	{
		pattern: /\b(parallel|concurrent|batch|fan.?out|multiple|several)\b/i,
		detail:
			"When delegating to multiple subagents in parallel, ensure each receives an independent task slice with no shared mutable state. A subtle shared-state bug between parallel delegates produces non-deterministic failures that are hard to reproduce.",
	},
];

type DelegationMode = "push" | "pull" | "negotiated";
type DelegationInput = BaseSkillInput & {
	options?: {
		delegationMode?: DelegationMode;
		allowSubdelegation?: boolean;
		maxDelegationDepth?: number;
	};
};

function detectDelegationMode(
	input: string,
	explicit?: DelegationMode,
): DelegationMode {
	if (explicit !== undefined) return explicit;
	if (/\b(pull|request|claim|bid|self-assign)\b/i.test(input)) return "pull";
	if (/\b(negotiat|agree|bid|auction|select)\b/i.test(input))
		return "negotiated";
	return "push";
}

function buildDelegationContract(
	input: DelegationInput,
	delegationMode: DelegationMode,
	allowSubdelegation: boolean,
	maxDepth: number,
) {
	const deliverable =
		input.deliverable ?? "validated contribution to the parent deliverable";
	const successCriteria =
		input.successCriteria ?? "return complete / partial / failed with evidence";
	return {
		delegationMode,
		parentOwner: "orchestrator",
		delegationTriggers: [
			"Capability boundary matches the task slice exactly",
			"Parent can name the expected exit artifact before handoff",
			"Timeout, retry, and escalation path are explicit before work starts",
		],
		taskPacket: {
			goal: input.request || "(unspecified)",
			taskSlice: `Produce a scoped contribution toward "${deliverable}"`,
			contextSnapshot: input.context || "task-scoped context snapshot required",
			acceptanceCriteria: successCriteria,
			constraints: input.constraints?.slice(0, 3) ?? [],
		},
		authorityBoundary: {
			canRead: ["assigned task slice", "task-scoped context snapshot"],
			canWrite: [deliverable, "validated exit artifact"],
			subdelegation: allowSubdelegation
				? `allowed up to depth ${maxDepth} without widening authority`
				: "not allowed",
		},
		exitContract: {
			status: ["complete", "partial", "failed"],
			exitArtifact: "structured sub-result with evidence and next-step signal",
			timeout: "escalate to parent when the delegated SLA is exceeded",
			escalationPath: "parent decides retry, reassignment, or human escalation",
		},
	};
}

const orchDelegationHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(orchDelegationInputSchema, input);
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
				"Delegation Strategy needs the task to be delegated, the capability boundary, or the subagent roles before it can produce a workable delegation design.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const delegationMode = detectDelegationMode(
			combined,
			parsed.data.options?.delegationMode,
		);
		const allowSubdelegation = parsed.data.options?.allowSubdelegation ?? false;
		const maxDepth = parsed.data.options?.maxDelegationDepth ?? 2;

		const details: string[] = [
			`Define a ${delegationMode}-based delegation strategy for "${summarizeKeywords(parsed.data).join(", ") || "the requested task"}". In ${delegationMode} mode, the ${{ push: "orchestrator initiates every task assignment and owns the queue", pull: "subagent claims tasks from a shared queue when it has capacity", negotiated: "orchestrator and subagent negotiate task fit before the assignment is confirmed" }[delegationMode]}.`,
			"Write each delegation as a concrete handoff packet: owner, delegated task slice, task-scoped context, acceptance criteria, timeout, authority boundary, exit artifact, and escalation path should all be explicit before work starts.",
		];

		details.push(
			...DELEGATION_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (allowSubdelegation) {
			details.push(
				`Subdelegation is permitted up to depth ${maxDepth}. Each level must propagate the original task context, preserve the output contract, and never widen its authority scope relative to its parent. Subdelegation chains that silently drop the original constraint set are a common correctness bug.`,
			);
		} else {
			details.push(
				"Subdelegation is disabled — each subagent must handle its assigned task directly without re-routing to another agent. This simplifies tracing and auditability at the cost of flexibility.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Every delegation decision must contribute to the stated deliverable: "${parsed.data.deliverable}". A subagent assignment that does not map to a concrete deliverable contribution is a coordination smell.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Encode the success criteria as acceptance criteria passed to each subagent at delegation time: "${parsed.data.successCriteria}". Subagents that do not know the acceptance criteria have no way to self-assess quality before returning.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Propagate the stated constraints into every delegation contract so subagents cannot ignore them: ${signals.constraintList.slice(0, 3).join("; ")}.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Include a context-scoped snapshot in each delegation — the subagent should know the task history and current state without needing to re-query the parent. Delegation without context forces unnecessary round-trips.",
			);
		}

		const delegationContract = buildDelegationContract(
			parsed.data,
			delegationMode,
			allowSubdelegation,
			maxDepth,
		);

		return createCapabilityResult(
			context,
			`Delegation Strategy designed ${details.length} delegation guardrail${details.length === 1 ? "" : "s"} (mode: ${delegationMode}, subdelegation: ${allowSubdelegation ? `depth ${maxDepth}` : "disabled"}).`,
			createFocusRecommendations(
				"Delegation control",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Delegation mode comparison",
					["Mode", "Best use case", "Primary risk"],
					[
						{
							label: "Push",
							values: [
								"Parent already knows the right owner for each task",
								"Coordinator becomes a routing bottleneck if it over-centralises decisions",
								"Use when ownership and sequencing must be tightly controlled",
							],
						},
						{
							label: "Pull",
							values: [
								"Workers can advertise capacity and claim queued tasks safely",
								"Idle agents may cherry-pick easy work unless task claims are governed",
								"Use when throughput matters and tasks are shaped consistently",
							],
						},
						{
							label: "Negotiated",
							values: [
								"Task fit depends on capability nuance, confidence, or current load",
								"Negotiation overhead can slow small or routine tasks",
								"Use when specialist boundaries overlap and assignment needs confirmation",
							],
						},
					],
					"Choose the delegation mode that matches how ownership should be established.",
				),
				buildOutputTemplateArtifact(
					"Delegation contract template",
					[
						"# Delegation contract",
						"## Parent owner",
						"## Delegated task slice",
						"## Responsibility boundary",
						"## Task-scoped context snapshot",
						"## Acceptance criteria",
						"## Authority boundary",
						"## Timeout and SLA",
						"## Exit artifact",
						"## Escalation path",
					].join("\n"),
					[
						"Parent owner",
						"Delegated task slice",
						"Responsibility boundary",
						"Task-scoped context snapshot",
						"Acceptance criteria",
						"Authority boundary",
						"Timeout and SLA",
						"Exit artifact",
						"Escalation path",
					],
					"Use this template to make delegation auditable and resumable instead of relying on raw prose.",
				),
				buildWorkedExampleArtifact(
					"Delegation contract example",
					{
						request:
							"delegate specialist tasks through negotiated bids with result contracts",
						deliverable: "merged report",
						successCriteria: "typed completion status",
						options: {
							delegationMode: "negotiated",
							allowSubdelegation: true,
							maxDelegationDepth: 3,
						},
					},
					delegationContract,
					"Worked example showing the concrete shape of a delegation packet and its exit contract.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	orchDelegationHandler,
);
