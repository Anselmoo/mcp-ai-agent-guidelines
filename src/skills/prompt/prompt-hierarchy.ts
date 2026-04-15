import { z } from "zod";
import { prompt_hierarchy_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
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
import { extractRequestSignals } from "../shared/recommendations.js";

const promptHierarchyInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			autonomyLevel: z
				.enum(["guided", "bounded", "delegated", "autonomous"])
				.optional(),
			includeApprovalGates: z.boolean().optional(),
			includeFallbacks: z.boolean().optional(),
		})
		.optional(),
});

type AutonomyLevel = "guided" | "bounded" | "delegated" | "autonomous";

const HIERARCHY_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(review|approval|human|sign.?off|supervis|checkpoint)\b/i,
		detail:
			"Place human approval gates before any external side effect: sending messages, writing data, changing production state, or publishing recommendations to leadership. Approval after the side effect is an audit, not a control.",
	},
	{
		pattern: /\b(tool|action|write|deploy|execute|modify|purchase)\b/i,
		detail:
			"Separate reasoning authority from execution authority. A hierarchy is safer when the model may reason broadly but may act only through narrowly scoped tools with explicit parameter contracts.",
	},
	{
		pattern: /\b(risk|policy|compliance|regulated|safe|security)\b/i,
		detail:
			"Reduce autonomy as consequence increases. High-impact or regulated tasks should keep approval gates close to the decision point instead of relying on retrospective audits.",
	},
	{
		pattern: /\b(budget|latency|time|cost|token|limit)\b/i,
		detail:
			"Set explicit operating budgets: maximum retries, maximum tool calls, and when the agent must stop and escalate. Without budgets, autonomy quietly expands under failure pressure.",
	},
	{
		pattern: /\b(context|memory|history|state|carry|session)\b/i,
		detail:
			"Define what context may persist across turns and what must be reset. Autonomy grows risk when stale state silently survives into a task with different assumptions.",
	},
	{
		pattern: /\b(uncertain|ambig|unknown|conflict|escalat)\b/i,
		detail:
			"Name escalation triggers explicitly: conflicting evidence, missing authority, policy ambiguity, or repeated low-confidence attempts. A hierarchy without escalation rules eventually treats uncertainty as permission.",
	},
	{
		pattern: /\b(log|audit|trace|observe|monitor|explain)\b/i,
		detail:
			"Record major decisions, invoked tools, and escalation reasons in an audit trail. Control surfaces only work when reviewers can reconstruct why the agent believed it was allowed to proceed.",
	},
];

function inferAutonomyLevel(
	input: string,
	explicit?: AutonomyLevel,
): AutonomyLevel {
	if (explicit !== undefined) return explicit;
	if (/\b(autonomous|hands.?off|full autonomy)\b/i.test(input)) {
		return "autonomous";
	}
	if (/\b(delegate|ownership|own the task|independent)\b/i.test(input)) {
		return "delegated";
	}
	if (/\b(guardrail|approval|review|bounded|policy)\b/i.test(input)) {
		return "bounded";
	}
	return "guided";
}

const promptHierarchyHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(promptHierarchyInputSchema, input);
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
				"Prompt Hierarchy needs the task scope, control surface, or risk boundary before it can calibrate autonomy. Provide: (1) what the agent is allowed to do, (2) what requires approval, (3) the consequence of getting it wrong.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const autonomyLevel = inferAutonomyLevel(
			combined,
			parsed.data.options?.autonomyLevel,
		);
		const includeApprovalGates =
			parsed.data.options?.includeApprovalGates ?? autonomyLevel !== "guided";
		const includeFallbacks = parsed.data.options?.includeFallbacks ?? true;
		const successCriteria = parsed.data.successCriteria;

		const details: string[] = [
			`Calibrate the control hierarchy for "${summarizeKeywords(parsed.data).join(", ") || "the requested agent task"}" at ${autonomyLevel} autonomy. Define what the agent may decide alone, what requires approval, and what must always escalate.`,
		];

		details.push(
			...HIERARCHY_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (includeApprovalGates) {
			details.push(
				"Represent approval gates as explicit state transitions with named approvers and allowed next actions. Approval rules that live only in narrative text are not enforceable control surfaces.",
			);
		}

		if (includeFallbacks) {
			details.push(
				"Define a safe fallback for every denied or ambiguous action: request clarification, narrow the scope, or return a draft instead of performing the side effect. Safe fallback behavior prevents autonomy from collapsing into silent failure.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided operating context to set the default autonomy level. Hierarchies should adapt to the environment they run in, not assume the same control posture for every team and workflow.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Tie the final approval condition to the stated deliverable: "${parsed.data.deliverable}". The hierarchy should make it clear who authorizes release of that artifact and under what evidence.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Use the success criteria to decide which actions may remain autonomous and which require review: "${parsed.data.successCriteria}". If success cannot be measured, autonomy should be lowered until it can be supervised safely.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints as hard control boundaries: ${signals.constraintList.slice(0, 3).join("; ")}. Control boundaries that are not encoded in the hierarchy will be violated during exception handling.`,
			);
		}

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Autonomy Level Manifest",
				["Level", "Decision scope", "Approval gate", "Escalation", "Fallback"],
				[
					{
						label: "guided",
						values: [
							"narrow task execution with heavy supervision",
							"before side effects",
							"low-confidence or policy ambiguity",
							"ask for clarification or draft only",
						],
					},
					{
						label: "bounded",
						values: [
							"local decisions within a defined scope",
							"before external side effects",
							"risk, policy, or missing authority",
							"request approval or narrow scope",
						],
					},
					{
						label: "delegated",
						values: [
							"independent execution on defined tasks",
							"before irreversible actions",
							"repeated low-confidence attempts",
							"return a safe draft",
						],
					},
					{
						label: "autonomous",
						values: [
							"broad local authority with strict logging",
							"only for high-impact actions",
							"all major uncertainty or policy conflict",
							"escalate and stop",
						],
					},
				],
				`Compare the autonomy ladder before finalizing the ${autonomyLevel} control surface.`,
			),
			buildOutputTemplateArtifact(
				"Hierarchy memo template",
				[
					"# Prompt hierarchy memo",
					"## Purpose",
					"## Allowed actions",
					"## Requires approval",
					"## Escalation triggers",
					"## Fallback actions",
					"## Audit requirements",
					"## Release condition",
				].join("\n"),
				[
					"Purpose",
					"Allowed actions",
					"Requires approval",
					"Escalation triggers",
					"Fallback actions",
					"Audit requirements",
					"Release condition",
				],
				"Explicit control-surface guidance for a prompt hierarchy.",
			),
			buildToolChainArtifact(
				"Hierarchy design chain",
				[
					{
						tool: "scope mapping",
						description:
							"identify which actions are safe, risky, or always forbidden",
					},
					{
						tool: "gate definition",
						description:
							"assign approval checkpoints to side effects and high-impact decisions",
					},
					{
						tool: "fallback planning",
						description:
							"define what the agent does when it cannot proceed safely",
					},
					{
						tool: "audit logging",
						description:
							"record decisions and escalations so reviewers can reconstruct the choice",
					},
				],
				"Sequence for turning an autonomy choice into an enforceable hierarchy.",
			),
			buildWorkedExampleArtifact(
				"Hierarchy example",
				{
					request: parsed.data.request,
					context: parsed.data.context ?? "",
					deliverable: parsed.data.deliverable ?? "",
					options: {
						autonomyLevel,
						includeApprovalGates,
						includeFallbacks,
					},
				},
				{
					allowed_actions: ["draft vendor responses", "summarize evidence"],
					approval_required: [
						"send external messages",
						"change production state",
					],
					escalation_triggers: [
						"missing authority",
						"policy ambiguity",
						"conflicting evidence",
					],
					fallback_actions: ["request clarification", "return draft"],
				},
				"Worked example showing how a bounded autonomy request becomes an explicit control contract.",
			),
			buildEvalCriteriaArtifact(
				"Hierarchy rubric",
				[
					"The autonomy level is explicit and matches the task risk.",
					"Approval gates exist before every external side effect.",
					"Fallback behavior is defined for denied or ambiguous actions.",
					"Audit requirements make the decision path reviewable.",
					...(successCriteria ? [successCriteria] : []),
				],
				"Checklist for deciding whether the hierarchy is safe and actionable.",
			),
		];

		return {
			...createCapabilityResult(
				context,
				`Prompt Hierarchy produced ${details.length} autonomy guardrail${details.length === 1 ? "" : "s"} for ${autonomyLevel} operation (approval gates: ${includeApprovalGates ? "included" : "omitted"}; fallbacks: ${includeFallbacks ? "included" : "omitted"}).`,
				createFocusRecommendations(
					"Prompt hierarchy guidance",
					details,
					context.model.modelClass,
				),
			),
			artifacts,
		};
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	promptHierarchyHandler,
);
