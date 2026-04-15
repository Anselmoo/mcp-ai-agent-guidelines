import { z } from "zod";
import { flow_context_handoff_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	type BaseSkillInput,
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const flowContextHandoffInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			handoffStyle: z
				.enum(["brief", "structured", "artifact-first"])
				.optional(),
			includeValidation: z.boolean().optional(),
			maxContextItems: z.number().int().positive().max(10).optional(),
		})
		.optional(),
});

type FlowContextHandoffInput = BaseSkillInput & {
	options?: {
		handoffStyle?: "brief" | "structured" | "artifact-first";
		includeValidation?: boolean;
		maxContextItems?: number;
	};
};

function buildHandoffPacket(
	input: FlowContextHandoffInput,
	handoffStyle: "brief" | "structured" | "artifact-first",
	maxContextItems: number,
) {
	const durableFacts = summarizeKeywords(input).slice(0, maxContextItems);
	return {
		style: handoffStyle,
		goal: input.request || "(unspecified)",
		receiver: "next owner",
		currentState: input.context || "Current state snapshot unavailable",
		durableFacts:
			durableFacts.length > 0 ? durableFacts : ["Current state snapshot"],
		openQuestions: [
			"What remains unverified?",
			"Which artifact should the next owner inspect first?",
		],
		nextActions: ["Resume from the latest validated checkpoint"],
		validation: [
			"Receiver can restate the goal",
			"Receiver can find the referenced artifacts",
			"Receiver can name the next action without asking for missing context",
		],
	};
}

const CONTEXT_HANDOFF_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(context.?window|token|summari[sz]e|compress|truncate|handoff|carry)\b/i,
		detail:
			"Separate durable facts from ephemeral reasoning before the handoff. Goals, decisions, blockers, and open questions travel forward; scratch analysis stays behind.",
	},
	{
		pattern: /\b(state|seriali[sz]e|checkpoint|resume|recover|snapshot)\b/i,
		detail:
			"Define a resume contract for the next step: current state, last completed action, next expected action, and any irreversible side effects already taken.",
	},
	{
		pattern: /\b(spec|code|benchmark|log|artifact|file|document|pr|ticket)\b/i,
		detail:
			"Prefer artifact references over prose whenever possible. Link the exact spec, code path, benchmark, or log that the next step must inspect so context stays verifiable.",
	},
	{
		pattern: /\b(agent|delegate|owner|team|step|stage|queue|router)\b/i,
		detail:
			"Name the receiving owner explicitly and tailor the handoff to that receiver's next decision. A useful handoff tells the next agent what to do first, not just what happened.",
	},
];

const flowContextHandoffHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(flowContextHandoffInputSchema, input);
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
				"Context Handoff needs the current task state, the next receiver, or the artifacts to carry forward before it can produce a useful handoff plan.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const maxContextItems = parsed.data.options?.maxContextItems ?? 5;
		const handoffStyle = parsed.data.options?.handoffStyle ?? "structured";
		const details: string[] = [
			`Package the handoff around "${summarizeKeywords(parsed.data).join(", ") || "the active workflow"}" with no more than ${maxContextItems} must-carry items so the next step can recover the situation quickly.`,
			"Write the handoff as a resume packet: goal, receiver, current state, durable facts, open questions, and the next action should all be explicit.",
		];

		details.push(
			...CONTEXT_HANDOFF_RULES.filter(({ pattern }) =>
				pattern.test(combined),
			).map(({ detail }) => detail),
		);

		if (handoffStyle === "brief") {
			details.push(
				"Use a brief handoff format: goal, status, blockers, and next action only. Keep explanatory detail in linked artifacts so the payload stays small.",
			);
		} else if (handoffStyle === "artifact-first") {
			details.push(
				"Use an artifact-first handoff: list the canonical artifacts first, then add only the interpretation needed to explain why each artifact matters.",
			);
		} else {
			details.push(
				"Use a structured handoff template with sections for goal, current state, constraints, evidence, open questions, and next step owner.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Extract the provided context into three buckets: confirmed facts, pending assumptions, and unresolved questions. Mixing them together is how bad handoffs create rework.",
			);
		} else {
			details.push(
				"No current-state context was provided — capture what has already been tried and what remains unverified before handing work to the next step.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Carry the deliverable target forward explicitly: "${parsed.data.deliverable}". The receiver should not have to infer what finished work looks like.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Preserve the success criteria in the handoff so the next step can validate completion against "${parsed.data.successCriteria}".`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Promote these constraints into the handoff header so they survive step transitions: ${signals.constraintList.slice(0, 3).join("; ")}.`,
			);
		}

		if (parsed.data.options?.includeValidation ?? true) {
			details.push(
				"Add a handoff validation check: the receiving step should be able to restate the goal, locate the referenced artifacts, and name the next action without asking for missing context.",
				"Record the checkpoint the next owner should resume from so the workflow can continue without replaying earlier reasoning.",
			);
		}

		return createCapabilityResult(
			context,
			`Context Handoff prepared ${details.length} transfer safeguards (style: ${handoffStyle}, context: ${signals.hasContext ? "present" : "missing"}, deliverable: ${signals.hasDeliverable ? "defined" : "undefined"}).`,
			createFocusRecommendations(
				"Handoff focus",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Handoff style comparison",
					["Style", "Best when", "Primary tradeoff"],
					[
						{
							label: "Brief",
							values: [
								"Only the next decision matters and the receiver already knows the project",
								"Can omit nuance and force follow-up questions",
								"Use when you need a compact status transfer",
							],
						},
						{
							label: "Structured",
							values: [
								"You need a repeatable transfer contract across agents",
								"Takes more space than a terse status note",
								"Use when handoffs must survive interruptions",
							],
						},
						{
							label: "Artifact-first",
							values: [
								"The next owner must inspect concrete files, logs, or specs before acting",
								"Narrative context is intentionally minimal",
								"Use when references matter more than prose",
							],
						},
					],
					"Compare the supported handoff styles before choosing the transfer shape.",
				),
				buildOutputTemplateArtifact(
					"Context resume packet template",
					[
						"# Handoff packet",
						"## Goal",
						"## Receiver",
						"## Current state",
						"## Durable facts",
						"## Artifacts to inspect",
						"## Open questions",
						"## Next action",
						"## Resume checkpoint",
						"## Validation",
					].join("\n"),
					[
						"Goal",
						"Receiver",
						"Current state",
						"Durable facts",
						"Artifacts to inspect",
						"Open questions",
						"Next action",
						"Resume checkpoint",
						"Validation",
					],
					"Use this template to turn a loose handoff into a concrete resume packet.",
				),
				buildToolChainArtifact(
					"Context transfer chain",
					[
						{
							tool: "fact extraction",
							description:
								"separate durable facts from temporary reasoning before the handoff",
						},
						{
							tool: "artifact attachment",
							description:
								"link the exact files, logs, or specs the next owner must inspect",
						},
						{
							tool: "resume validation",
							description:
								"confirm the receiver can restate the goal and next action without fresh clarification",
						},
					],
					"Concrete sequence for packaging and validating a transfer between owners.",
				),
				buildWorkedExampleArtifact(
					"Resume packet example",
					{
						request:
							"handoff workflow context and artifacts between agents after the research phase",
						context:
							"The investigation is complete and implementation starts next.",
						options: {
							handoffStyle: "artifact-first",
							maxContextItems: 4,
							includeValidation: true,
						},
					},
					buildHandoffPacket(
						{
							request:
								"handoff workflow context and artifacts between agents after the research phase",
							context:
								"The investigation is complete and implementation starts next.",
							options: {
								handoffStyle: "artifact-first",
								maxContextItems: 4,
								includeValidation: true,
							},
						},
						"artifact-first",
						4,
					),
					"Worked example showing the shape of a concrete transfer packet and its resume contract.",
				),
				buildEvalCriteriaArtifact(
					"Handoff readiness rubric",
					[
						"The receiver can restate the goal and current state in one pass.",
						"The handoff names the exact artifacts the next owner must inspect.",
						"The packet includes a resume checkpoint and a next action.",
						"Open questions are explicit and separated from confirmed facts.",
					],
					"Checklist for deciding whether a transfer is safe enough to resume work.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	flowContextHandoffHandler,
);
