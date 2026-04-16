import { z } from "zod";
import { strat_prioritization_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

// Note: this skill ranks items by value/feasibility/risk.
// It does NOT perform tradeoff analysis between specific alternatives —
// that is strat-tradeoff's domain.
const stratPrioritizationInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			framework: z
				.enum(["value-feasibility-risk", "impact-effort", "weighted-criteria"])
				.optional(),
			maxItems: z.number().int().positive().max(20).optional(),
		})
		.optional(),
});

type PrioritizationFramework =
	| "value-feasibility-risk"
	| "impact-effort"
	| "weighted-criteria";

const PRIORITIZATION_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(value|benefit|worth|return|roi|revenue|saving|outcome|impact)\b/i,
		detail:
			"Quantify value before ranking: define a consistent value unit (cost saving, revenue potential, user time saved, risk reduction) and apply it uniformly across all candidates. Rankings built on inconsistent value definitions are not reproducible and will be challenged in stakeholder reviews.",
	},
	{
		pattern:
			/\b(feasib|effort|complex|difficult|cost|resource|capacity|time|speed)\b/i,
		detail:
			"Assess feasibility against current team capacity and technical readiness, not theoretical capability. An item that requires capabilities the team does not possess should be scored as low-feasibility until the gap is explicitly closed in the roadmap.",
	},
	{
		pattern:
			/\b(risk|uncertain|unknown|depend|blocker|compliance|regul|secur)\b/i,
		detail:
			"Score risk on two axes: likelihood and impact on programme execution. Items with high strategic value but high risk are candidates for de-risking sprints — not immediate prioritisation. De-risking work should appear as explicit items in the ranked backlog.",
	},
	{
		pattern: /\b(use case|feature|invest|initiative|project|work|item)\b/i,
		detail:
			"Limit the prioritised list to the top items that can actually be started in the current planning horizon. An exhaustive ranked backlog is less useful than a short, committed list with explicit start conditions for items that fall outside the horizon.",
	},
	{
		pattern: /\b(matrix|quadrant|score|weight|criteria|framework|method)\b/i,
		detail:
			"Make the scoring criteria explicit and version-controlled. If the criteria change between planning cycles, re-run prioritisation from scratch rather than patching the previous ranking — stakeholders lose confidence in rankings that are iteratively adjusted rather than regenerated.",
	},
	{
		pattern: /\b(stakeholder|owner|team|sponsor|execut|decision)\b/i,
		detail:
			"Involve the owners of the items being ranked in the scoring session, but keep the final ranking decision with the programme sponsor. Owner-driven rankings systematically over-score their own items — external facilitation or a fixed scoring protocol prevents this.",
	},
	{
		pattern: /\b(defer|drop|cut|skip|deprioritize|backlog|later)\b/i,
		detail:
			"Explicitly name the items that are deferred and state the condition under which they would be re-prioritised. Items that are dropped silently reappear as urgent requests three months later with no documented decision rationale.",
	},
];

function inferFramework(
	input: string,
	explicit?: PrioritizationFramework,
): PrioritizationFramework {
	if (explicit !== undefined) return explicit;
	if (/\b(weight|criteria|score|multi.?criteri)\b/i.test(input))
		return "weighted-criteria";
	if (/\b(effort|impact|quick win|low.?hanging)\b/i.test(input))
		return "impact-effort";
	return "value-feasibility-risk";
}

const frameworkDescriptions: Record<PrioritizationFramework, string> = {
	"value-feasibility-risk":
		"value / feasibility / risk — the standard three-axis AI use-case ranking model",
	"impact-effort":
		"impact / effort — lightweight 2×2 grid suited to early-stage backlog triage",
	"weighted-criteria":
		"weighted multi-criteria scoring — use when stakeholders need to weight axes differently per item",
};

const stratPrioritizationHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(stratPrioritizationInputSchema, input);
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
				"Prioritization needs the candidate items, the ranking criteria, or the strategic context before it can produce an ordered list. Provide: (1) items to rank, (2) value/feasibility/risk dimensions to apply, (3) planning horizon.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const framework = inferFramework(combined, parsed.data.options?.framework);
		const maxItems = parsed.data.options?.maxItems ?? 5;

		const details: string[] = [
			`Rank "${summarizeKeywords(parsed.data).join(", ") || "the candidate items"}" using the ${frameworkDescriptions[framework]}. Produce at most ${maxItems} committed items for the current planning horizon — the rest belong in a documented deferred list, not in the active plan.`,
		];

		details.push(
			...PRIORITIZATION_RULES.filter(({ pattern }) =>
				pattern.test(combined),
			).map(({ detail }) => detail),
		);

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints as hard filters before scoring: ${signals.constraintList.slice(0, 3).join("; ")}. Items that violate constraints should be excluded from the scored list, not scored low — a low score implies the item is a candidate for the next cycle; exclusion implies it cannot proceed without a constraint change.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`The prioritisation output must produce the stated deliverable: "${parsed.data.deliverable}". Ensure the top-ranked items collectively cover the deliverable's requirements — individual item value scores do not guarantee collective coverage.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Validate the ranked list against the success criteria: "${parsed.data.successCriteria}". A prioritisation pass that does not satisfy its own criteria should be re-run with recalibrated scoring before being presented to stakeholders.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Cross-reference the ranked items against the provided context to detect dependency conflicts. Items ranked highly that depend on unstarted prerequisites should have those dependencies surfaced in the output.",
			);
		}

		return createCapabilityResult(
			context,
			`Prioritization produced ${details.length} ranking guardrail${details.length === 1 ? "" : "s"} using ${framework} (max items: ${maxItems}).`,
			createFocusRecommendations(
				"Prioritization guidance",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Prioritization framework comparison",
					["Framework", "Best use case", "Primary trade-off"],
					[
						{
							label: "Value / feasibility / risk",
							values: [
								"General backlog ranking with multiple constraints",
								"Requires disciplined scoring definitions",
								"Balanced view across business value, effort, and exposure",
							],
						},
						{
							label: "Impact / effort",
							values: [
								"Fast triage when time is limited",
								"Can underweight risk and feasibility nuance",
								"Optimises for quick wins and low-effort gains",
							],
						},
						{
							label: "Weighted criteria",
							values: [
								"Stakeholder-specific trade-off decisions",
								"Weights must be versioned and agreed upfront",
								"Most flexible, but easiest to argue over later",
							],
						},
					],
					"Compare the three supported prioritisation frameworks before choosing one for the planning cycle.",
				),
				buildOutputTemplateArtifact(
					"Ranked backlog template",
					[
						"# Prioritisation result",
						"## Ranked items",
						"## Deferred items",
						"## Scoring rubric",
						"## Constraint filters",
						"## Decision rationale",
					].join("\n"),
					[
						"Ranked items",
						"Deferred items",
						"Scoring rubric",
						"Constraint filters",
						"Decision rationale",
					],
					"Use this template to make the ranking auditable and replayable.",
				),
				buildWorkedExampleArtifact(
					"Prioritisation example",
					{
						request:
							"Rank these features by ROI and business value, score feasibility against current team capacity, and flag compliance risk",
						options: { framework: "value-feasibility-risk", maxItems: 3 },
					},
					{
						rankedItems: [
							{
								item: "Audit log export",
								score: "high value / medium feasibility / low risk",
							},
							{
								item: "Workflow automation",
								score: "high value / medium feasibility / medium risk",
							},
							{
								item: "Experimental agent routing",
								score: "medium value / low feasibility / high risk",
							},
						],
						deferredItems: ["Experimental agent routing"],
						rationale:
							"The top items align with the current horizon and avoid high-risk dependencies.",
					},
					"Worked example showing how the selected framework converts signals into a ranked list.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	stratPrioritizationHandler,
);
