import { z } from "zod";
import { orch_agent_orchestrator_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const orchAgentOrchestratorInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			agentCount: z.number().int().positive().max(16).optional(),
			routingStrategy: z
				.enum(["capability", "load-balanced", "priority", "broadcast"])
				.optional(),
			includeControlLoop: z.boolean().optional(),
		})
		.optional(),
});

type DelegationInput = {
	request?: string;
	deliverable?: string;
	successCriteria?: string;
	options?: {
		agentCount?: number;
		routingStrategy?: string;
		includeControlLoop?: boolean;
	};
};

// Delegation plan artifact builder
function buildDelegationPlan(input: DelegationInput) {
	const agentCount = input.options?.agentCount || 1;
	return {
		agents: Array(agentCount)
			.fill(null)
			.map((_, i) => ({
				id: `agent-${i + 1}`,
				capabilityBoundary: `subtask-${i + 1}`,
				inputs: ["request slice", "context snapshot"],
				exitArtifact: "validated sub-result",
			})),
		routingStrategy: input.options?.routingStrategy || "capability",
		controlLoop: !!input.options?.includeControlLoop,
		deliverable: input.deliverable || "unspecified",
		successCriteria: input.successCriteria || "unspecified",
		handoffContract: {
			owner: "orchestrator",
			requiredFields: ["goal", "inputs", "exit artifact", "escalation path"],
		},
	};
}

const ORCHESTRATION_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(route|router|dispatch|assign|direct|hand.?off)\b/i,
		detail:
			"Assign each task to exactly one agent at a time using capability-boundary routing. Ambiguous ownership causes silent conflicts — every routed task must have one owner who accepts it.",
	},
	{
		pattern: /\b(parallel|concurrent|fan.?out|multi.?agent|simultaneous)\b/i,
		detail:
			"Fan out only on genuinely independent subtasks. Before each fan-out, assert that subtasks share no writable state and define a synthesis gate where their outputs are reconciled before the next irreversible step.",
	},
	{
		pattern: /\b(control|loop|monitor|supervise|track|observe|log)\b/i,
		detail:
			"Add a control loop that inspects each agent's exit artifact before deciding whether to continue, retry, or escalate. Pipelines without control loops drift silently when an agent produces a partial result.",
	},
	{
		pattern: /\b(fail|error|timeout|retry|fallback|recover|circuit)\b/i,
		detail:
			"Define a failure contract for each agent: what to emit on error, how long the orchestrator waits before declaring a timeout, and whether the task retries or escalates to a human. Silence is not an acceptable failure signal.",
	},
	{
		pattern: /\b(specialist|expert|capability|skill|domain|role)\b/i,
		detail:
			"Map each specialist agent by its capability boundary, not by its name. Two agents with overlapping boundaries competing for the same task is the most common cause of duplicated or inconsistent outputs in multi-agent pipelines.",
	},
	{
		pattern: /\b(result|output|artifact|report|synthesis|merge|reconcil)\b/i,
		detail:
			"Designate one agent as the final synthesiser whose only job is to merge, deduplicate, and resolve conflicts across individual agent outputs before handing the result to the caller.",
	},
	{
		pattern: /\b(context|state|history|memory|carry|transfer)\b/i,
		detail:
			"Propagate only the minimal context each agent needs to complete its task. Full history forwarding inflates context windows and introduces stale signals — agents should receive a task-scoped snapshot, not a raw history dump.",
	},
];

function inferAgentCount(input: string, explicit?: number): number {
	if (explicit !== undefined) return explicit;
	const mentions = (input.match(/\bagent\b/gi) ?? []).length;
	if (mentions >= 4) return Math.min(mentions, 8);
	if (/\b(three|3)\b/i.test(input)) return 3;
	if (/\b(two|pair|2)\b/i.test(input)) return 2;
	return 2;
}

const orchAgentOrchestratorHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(orchAgentOrchestratorInputSchema, input);
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
				"Agent Orchestrator needs the coordination goal, agent types, or routing strategy before it can produce a usable orchestration plan.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const routingStrategy =
			parsed.data.options?.routingStrategy ??
			(/\b(load|balance|distribute)\b/i.test(combined)
				? "load-balanced"
				: /\b(priority|urgent|critical|sla)\b/i.test(combined)
					? "priority"
					: "capability");
		const agentCount = inferAgentCount(
			combined,
			parsed.data.options?.agentCount,
		);
		const includeControlLoop = parsed.data.options?.includeControlLoop ?? true;

		const details: string[] = [
			`Coordinate ${agentCount} agent${agentCount === 1 ? "" : "s"} around "${summarizeKeywords(parsed.data).join(", ") || "the requested task"}" using ${routingStrategy} routing. The orchestrating agent must own the routing table and be the sole entity that advances or halts the pipeline.`,
		];

		details.push(
			...ORCHESTRATION_RULES.filter(({ pattern }) =>
				pattern.test(combined),
			).map(({ detail }) => detail),
		);

		if (includeControlLoop) {
			details.push(
				"Implement a control loop between every agent handoff: validate the produced artifact against the expected output contract, then decide continue / retry / escalate before issuing the next task. A control loop is the primary guard against cascading failures.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`The orchestration pipeline must produce and verify the stated deliverable: "${parsed.data.deliverable}". Every agent assignment should trace forward to that artifact — agents whose outputs do not contribute to it are scope creep.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Encode the success criteria as exit conditions in the orchestration loop: "${parsed.data.successCriteria}". The orchestrator should evaluate these conditions after each synthesis step rather than only at the final output.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints as routing constraints, not guidelines: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints that are not enforced at routing time are reliably violated under load.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Seed the orchestration context from the provided state before issuing the first agent task. Starting from scratch when prior context exists wastes compute and produces inconsistent results across runs.",
			);
		}

		return createCapabilityResult(
			context,
			`Agent Orchestrator planned ${details.length} coordination guardrail${details.length === 1 ? "" : "s"} for ${agentCount} agent${agentCount === 1 ? "" : "s"} (strategy: ${routingStrategy}).`,
			createFocusRecommendations(
				"Orchestration control",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Routing strategy comparison",
					["Strategy", "Best use case", "Primary risk"],
					[
						{
							label: "Capability",
							values: [
								"Tasks map cleanly to specialist boundaries",
								"Overlapping skills can cause duplicate work",
								"Use when ownership should follow expertise",
							],
						},
						{
							label: "Load-balanced",
							values: [
								"Many similar tasks with roughly equal effort",
								"May route work away from the best expert",
								"Use when throughput matters more than specialisation",
							],
						},
						{
							label: "Priority",
							values: [
								"Urgent work where SLA or risk should dominate",
								"Lower-priority tasks can starve",
								"Use when deadline and escalation policy are explicit",
							],
						},
					],
					"Compare the supported routing strategies before selecting the orchestration policy.",
				),
				buildOutputTemplateArtifact(
					"Delegation plan template",
					[
						"# Delegation plan",
						"## Routing strategy",
						"## Agent roles",
						"## Handoff contract",
						"## Control loop",
						"## Deliverable",
						"## Success criteria",
					].join("\n"),
					[
						"Routing strategy",
						"Agent roles",
						"Handoff contract",
						"Control loop",
						"Deliverable",
						"Success criteria",
					],
					"Use this template to make the orchestration plan operational rather than abstract.",
				),
				buildWorkedExampleArtifact(
					"Delegation plan example",
					{
						request:
							"Route specialist agents in parallel, track failures, reconcile outputs, and carry minimal context",
						deliverable: "final synthesis report",
						successCriteria: "all delegated outputs are validated before merge",
						options: {
							agentCount: 3,
							routingStrategy: "priority",
							includeControlLoop: true,
						},
					},
					buildDelegationPlan({
						request:
							"Route specialist agents in parallel, track failures, reconcile outputs, and carry minimal context",
						deliverable: "final synthesis report",
						successCriteria: "all delegated outputs are validated before merge",
						options: {
							agentCount: 3,
							routingStrategy: "priority",
							includeControlLoop: true,
						},
					}),
					"Worked example showing the shape of a concrete delegation plan and its handoff contract.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	orchAgentOrchestratorHandler,
);
