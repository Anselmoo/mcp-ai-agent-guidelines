import { z } from "zod";
import { lead_exec_briefing_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const leadExecBriefingInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			audience: z.enum(["board", "c-suite", "vp-staff"]).optional(),
			briefingLength: z
				.enum(["one-page", "short-deck", "decision-memo"])
				.optional(),
			includeRisks: z.boolean().optional(),
		})
		.optional(),
});

type BriefingAudience = "board" | "c-suite" | "vp-staff";

const EXEC_BRIEFING_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(value|roi|outcome|growth|productivity|business)\b/i,
		detail:
			"Lead with the business outcome, not the technical mechanism. Executives need to know why the investment matters before they care how the platform works.",
	},
	{
		pattern: /\b(risk|governance|compliance|control|security|regulat)\b/i,
		detail:
			"Summarize the top risk, the control that mitigates it, and the residual risk that leadership is implicitly accepting. Risk language without an explicit decision implication becomes background noise.",
	},
	{
		pattern: /\b(budget|cost|investment|funding|spend)\b/i,
		detail:
			"State the investment ask in concrete terms: spend, decision owner, and expected return horizon. Executive briefings fail when they hint at cost without clarifying the decision being requested.",
	},
	{
		pattern: /\b(roadmap|phase|milestone|timeline|quarter|wave)\b/i,
		detail:
			"Translate the technical plan into a small number of milestone-based commitments. Executives should leave knowing what changes by when, not just that work is under way.",
	},
	{
		pattern: /\b(market|compet|customer|board|strategy|position)\b/i,
		detail:
			"Connect the recommendation to external context: customer demand, competitive pressure, regulatory shift, or strategic differentiation. Leadership decisions are comparative, not made in a vacuum.",
	},
	{
		pattern: /\b(metric|kpi|adoption|measure|progress|signal)\b/i,
		detail:
			"Define the handful of metrics leadership should track after the briefing. A briefing that asks for support without naming follow-through metrics creates accountability drift.",
	},
	{
		pattern: /\b(decision|approve|sponsor|ask|endorse|support)\b/i,
		detail:
			"End with a single explicit ask: approve funding, endorse the roadmap, remove a blocker, or assign an owner. If the ask is fuzzy, the briefing becomes informational theatre.",
	},
];

function inferAudience(
	input: string,
	explicit?: BriefingAudience,
): BriefingAudience {
	if (explicit !== undefined) return explicit;
	if (/\b(board|director|committee)\b/i.test(input)) return "board";
	if (/\b(vp|staff|leadership team)\b/i.test(input)) return "vp-staff";
	return "c-suite";
}

const leadExecBriefingHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(leadExecBriefingInputSchema, input);
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
				"Executive Technical Briefing needs the decision topic, audience, or current programme status before it can frame leadership-ready guidance. Provide: (1) the decision to be made, (2) the audience, (3) the business and risk context.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const audience = inferAudience(combined, parsed.data.options?.audience);
		const briefingLength =
			parsed.data.options?.briefingLength ?? "decision-memo";
		const includeRisks = parsed.data.options?.includeRisks ?? true;

		const details: string[] = [
			`Structure the ${briefingLength} for a ${audience} audience around "${summarizeKeywords(parsed.data).join(", ") || "the requested decision"}". Each section should translate technical choices into business implications, decision tradeoffs, and next actions.`,
		];

		details.push(
			...EXEC_BRIEFING_RULES.filter(({ pattern }) =>
				pattern.test(combined),
			).map(({ detail }) => detail),
		);

		if (includeRisks) {
			details.push(
				"Include a short risk slide or section that names the top risks, mitigations, and unresolved executive decisions. Executive audiences trust briefings that surface downside honestly.",
			);
		}

		details.push(
			"End with a single explicit ask: approve funding, endorse the roadmap, remove a blocker, or assign an owner. If the ask is fuzzy, the briefing becomes informational theatre.",
		);

		if (signals.hasContext) {
			details.push(
				"Anchor the briefing in the provided current state so leadership can see what has changed since the last decision point. Executive briefings should advance the decision, not reteach the background.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the narrative to produce the stated deliverable: "${parsed.data.deliverable}". The guidance should help the author land the actual artifact leadership will review, not an abstract presentation ideal.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Translate the success criteria into leadership scorecard language: "${parsed.data.successCriteria}". Executives should understand how the programme will be judged without needing to parse engineering internals.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Treat the stated constraints as decision boundaries in the briefing: ${signals.constraintList.slice(0, 3).join("; ")}. Leadership should see which options are ruled out before they discuss preferences among feasible ones.`,
			);
		}

		const artifacts = [
			buildOutputTemplateArtifact(
				`Executive Briefing (${audience}, ${briefingLength})`,
				`# Executive Briefing

## Business Outcome
...

## Investment Ask
...

## Risks & Mitigations
...

## Milestones & Metrics
...

## Decision/Ask
...`,
				[
					"Business Outcome",
					"Investment Ask",
					"Risks & Mitigations",
					"Milestones & Metrics",
					"Decision/Ask",
				],
				"Template for structuring an executive technical briefing for leadership decisions.",
			),
			buildWorkedExampleArtifact(
				"Executive briefing example",
				{
					request:
						"approve AI platform funding for a 3-phase rollout with explicit risk controls",
					audience,
					format: briefingLength,
					context:
						"the platform team needs leadership to weigh cost, delivery risk, and business upside",
				},
				{
					businessOutcome:
						"faster delivery of governed AI capabilities with fewer handoffs",
					topRisks: [
						"scope creep across multiple teams",
						"security and compliance gaps",
					],
					explicitAsk:
						"approve the funding request and assign an executive sponsor",
					successSignals: [
						"funding released",
						"phase gates agreed",
						"risk controls tracked on a leadership scorecard",
					],
				},
				"Use this example to see how a technical recommendation becomes an executive decision memo.",
			),
			buildEvalCriteriaArtifact(
				"Executive briefing quality rubric",
				[
					"The business outcome is stated before implementation detail.",
					"The investment ask names the decision owner and decision being requested.",
					"Top risks include both mitigations and residual risk.",
					"Milestones and metrics show how leadership will track follow-through.",
					"The briefing is tailored to the selected audience and format.",
				],
				"Use this rubric to confirm the briefing is ready for leadership review.",
			),
		];
		return createCapabilityResult(
			context,
			`Executive Technical Briefing produced ${details.length} briefing guardrail${details.length === 1 ? "" : "s"} (audience: ${audience}; format: ${briefingLength}; risks: ${includeRisks ? "included" : "omitted"}).`,
			createFocusRecommendations(
				"Executive briefing guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	leadExecBriefingHandler,
);
