import { z } from "zod";
import { lead_staff_mentor_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
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

const leadStaffMentorInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			growthFocus: z
				.enum(["technical-strategy", "influence", "execution", "career"])
				.optional(),
			includePracticePlan: z.boolean().optional(),
		})
		.optional(),
});

type GrowthFocus = "technical-strategy" | "influence" | "execution" | "career";

const STAFF_MENTOR_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(influence|align|stakeholder|persuad|without authority|socialize)\b/i,
		detail:
			"Translate influence into repeatable moves: identify the decision owner, surface the tradeoff in their language, and create a forcing artifact that makes the next decision easy. Influence without an artifact usually evaporates after the meeting.",
	},
	{
		pattern: /\b(strategy|direction|roadmap|priorit|portfolio|leverage)\b/i,
		detail:
			"Choose work for leverage, not visibility. Staff-level scope should unlock multiple teams, reduce recurring confusion, or shape an important decision rather than merely absorb more tasks.",
	},
	{
		pattern: /\b(design|architecture|decision|doc|proposal|review)\b/i,
		detail:
			"Strengthen decision quality with concise artifacts: problem statement, options, tradeoffs, recommendation, and open questions. Staff engineers scale through artifacts that others can use without them in the room.",
	},
	{
		pattern: /\b(mentor|coach|team|enable|delegate|uplift)\b/i,
		detail:
			"Measure your impact by the capability growth of other engineers. Mentoring at staff level means increasing the team's decision quality and autonomy, not becoming the permanent answer person.",
	},
	{
		pattern: /\b(promotion|career|sponsor|scope|packet|expectation)\b/i,
		detail:
			"Build a clear evidence trail for scope, influence, and business impact. Career growth stalls when strong work exists but no narrative connects it to the role expectations above the current level.",
	},
	{
		pattern: /\b(execution|incident|delivery|ambiguity|operat|ownership)\b/i,
		detail:
			"Show calm ownership under ambiguity: clarify the decision, create a path to resolution, and keep stakeholders informed before they ask. Staff engineers are trusted because they make uncertainty navigable.",
	},
	{
		pattern: /\b(product|design|legal|finance|cross.?functional)\b/i,
		detail:
			"Expand the frame to the full decision system. Staff impact often depends less on technical brilliance than on aligning product, policy, operations, and finance around one coherent path forward.",
	},
];

function inferGrowthFocus(input: string, explicit?: GrowthFocus): GrowthFocus {
	if (explicit !== undefined) return explicit;
	if (/\b(influence|stakeholder|align|without authority)\b/i.test(input)) {
		return "influence";
	}
	if (/\b(career|promotion|scope|mentor|grow)\b/i.test(input)) {
		return "career";
	}
	if (/\b(execution|delivery|incident|operational)\b/i.test(input)) {
		return "execution";
	}
	return "technical-strategy";
}

const leadStaffMentorHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(leadStaffMentorInputSchema, input);
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
				"Staff Engineering Mentor needs the growth goal, current challenge, or operating context before it can offer focused mentoring guidance. Provide: (1) where you are stuck, (2) the scope you operate in, (3) the outcome you want to create.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const growthFocus = inferGrowthFocus(
			combined,
			parsed.data.options?.growthFocus,
		);
		const includePracticePlan =
			parsed.data.options?.includePracticePlan ?? true;

		const details: string[] = [
			`Frame the mentoring advice around ${growthFocus} for "${summarizeKeywords(parsed.data).join(", ") || "the stated growth challenge"}". Staff-level growth should increase leverage, clarity, and decision quality across a wider surface area than one engineer can execute alone.`,
		];

		details.push(
			...STAFF_MENTOR_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (includePracticePlan) {
			details.push(
				"Translate the advice into a short practice loop: one behavior to repeat, one artifact to produce, and one signal to watch for improvement. Mentoring sticks when it becomes a repeatable practice instead of a memorable conversation.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided context to calibrate scope honestly. Good mentoring advice should fit the engineer's current environment rather than prescribe behaviors that require authority they do not yet have.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Aim the mentoring guidance at the stated deliverable: "${parsed.data.deliverable}". Staff growth is easiest to observe when it improves a real artifact or decision already in flight.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Use the success criteria to define what progress looks like: "${parsed.data.successCriteria}". Career advice becomes actionable when improvement can be seen in work products and stakeholder outcomes.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Keep the mentoring plan inside the stated constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Advice that assumes missing authority, time, or sponsorship creates frustration instead of growth.`,
			);
		}

		const artifacts = [
			buildOutputTemplateArtifact(
				`Mentoring Plan (${growthFocus})`,
				`# Staff Mentoring Plan

## Growth Focus
...

## Practice Loop
- Behavior: ...
- Artifact: ...
- Signal: ...

## Decision/Influence Moves
...

## Evidence Trail
...`,
				[
					"Growth Focus",
					"Practice Loop",
					"Decision/Influence Moves",
					"Evidence Trail",
				],
				"Template for a staff engineering mentoring plan focused on leverage, influence, and growth.",
			),
			buildWorkedExampleArtifact(
				"Mentoring conversation example",
				{
					engineerProfile:
						"strong implementer who needs to lead cross-team design decisions",
					goal: "increase staff-level influence without becoming the permanent answer person",
					context:
						"the engineer has little formal authority but owns high-value technical work",
				},
				{
					mentorMoves: [
						"identify the decision owner and their tradeoff language",
						"create one forcing artifact before the next meeting",
						"pick one repeatable behavior to practice for the next two weeks",
					],
					evidenceTrail: [
						"decision memo reused by others",
						"fewer escalations back to the engineer",
						"clearer stakeholder alignment",
					],
				},
				"Use this example to turn abstract mentoring advice into a repeatable coaching conversation.",
			),
			buildEvalCriteriaArtifact(
				"Staff mentoring practice checklist",
				[
					"The advice fits the engineer's actual authority and constraints.",
					"One behavior, one artifact, and one signal are named for practice.",
					"Mentoring increases the team's autonomy rather than creating dependency.",
					"The guidance ties to a real deliverable or decision in flight.",
					"Evidence is specified for judging whether growth happened.",
				],
				"Use this checklist to verify that the mentoring advice is operational rather than motivational.",
			),
		];
		return createCapabilityResult(
			context,
			`Staff Engineering Mentor produced ${details.length} mentoring guardrail${details.length === 1 ? "" : "s"} (focus: ${growthFocus}; practice plan: ${includePracticePlan ? "included" : "omitted"}).`,
			createFocusRecommendations(
				"Staff mentoring guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	leadStaffMentorHandler,
);
