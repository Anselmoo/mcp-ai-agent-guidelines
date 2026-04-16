import { z } from "zod";
import { lead_l9_engineer_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
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

const leadL9EngineerInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			reviewMode: z
				.enum(["architecture", "portfolio", "org-design"])
				.optional(),
			includeCounterpoints: z.boolean().optional(),
			decisionHorizon: z
				.enum(["next-quarter", "annual", "multi-year"])
				.optional(),
		})
		.optional(),
});

type ReviewMode = "architecture" | "portfolio" | "org-design";

const L9_ENGINEER_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(system|architecture|platform|distributed|scale|resilien|latency)\b/i,
		detail:
			"Identify the architectural invariants first: what must remain true as the system scales, fails, or changes ownership. Distinguished-engineer guidance is valuable because it preserves invariants through turbulence, not because it catalogs components.",
	},
	{
		pattern: /\b(trade.?off|cost|reliability|speed|quality|safety)\b/i,
		detail:
			"Name the dominant tradeoff explicitly and pick the dimension that wins by design. Teams stall when senior guidance says 'balance everything' instead of declaring which dimension absorbs the compromise.",
	},
	{
		pattern: /\b(roadmap|sequence|phase|priorit|dependency|irrevers)\b/i,
		detail:
			"Sequence irreversible decisions after the evidence needed to justify them is available. Distinguished guidance should preserve option value until the cost of delay exceeds the value of learning.",
	},
	{
		pattern: /\b(org|team|ownership|interface|boundary|platform team)\b/i,
		detail:
			"Treat organisation interfaces as part of the technical design. If ownership boundaries and system boundaries disagree, the resulting platform will be expensive to operate no matter how elegant the design looks.",
	},
	{
		pattern: /\b(standard|framework|primitive|reuse|platform|abstraction)\b/i,
		detail:
			"Invest in reusable primitives only where multiple teams will consume them under consistent constraints. Distinguished engineers create leverage by standardising the right abstraction, not by centralising everything.",
	},
	{
		pattern: /\b(risk|blast radius|failure|incident|operability|resilien)\b/i,
		detail:
			"Evaluate failure modes at system scale: blast radius, recovery path, operator burden, and the cost of partial degradation. High-level guidance should reduce systemic fragility, not just local bugs.",
	},
	{
		pattern: /\b(metric|feedback|signal|measure|telemetry|learn)\b/i,
		detail:
			"Specify the operating signals that tell you whether the architecture thesis is working. A distinguished opinion becomes durable when it includes the evidence that could later falsify it.",
	},
];

function inferReviewMode(input: string, explicit?: ReviewMode): ReviewMode {
	if (explicit !== undefined) return explicit;
	if (/\b(org|team|ownership|operating model)\b/i.test(input)) {
		return "org-design";
	}
	if (/\b(portfolio|investment|enterprise|programme)\b/i.test(input)) {
		return "portfolio";
	}
	return "architecture";
}

const leadL9EngineerHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(leadL9EngineerInputSchema, input);
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
				"L9 Distinguished Engineer needs the decision surface, system scope, or strategic constraint before it can provide high-leverage technical guidance. Provide: (1) the decision to review, (2) the scope affected, (3) the major tradeoffs or risks.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const reviewMode = inferReviewMode(
			combined,
			parsed.data.options?.reviewMode,
		);
		const includeCounterpoints =
			parsed.data.options?.includeCounterpoints ?? true;
		const decisionHorizon = parsed.data.options?.decisionHorizon ?? "annual";

		const details: string[] = [
			`Review "${summarizeKeywords(parsed.data).join(", ") || "the requested decision"}" through an ${reviewMode} lens over a ${decisionHorizon} horizon. Distinguished guidance should clarify which decisions are foundational, which can stay reversible, and which risks compound if ignored.`,
		];

		details.push(
			...L9_ENGINEER_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (includeCounterpoints) {
			details.push(
				"State the strongest rejected alternative and why it loses under the chosen assumptions. Senior guidance becomes more credible when it shows awareness of the best competing path.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided context as the constraint envelope for the review. Distinguished engineering advice should respect the actual system and organisation boundary, not an idealized greenfield.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Aim the guidance toward the stated deliverable: "${parsed.data.deliverable}". The review should increase the quality of that decision artifact, not branch into unrelated platform philosophy.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Use the success criteria to define what "good enough to commit" means: "${parsed.data.successCriteria}". Distinguished guidance should make the commit threshold sharper, not fuzzier.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Treat the stated constraints as first-order design forces: ${signals.constraintList.slice(0, 3).join("; ")}. Great architecture guidance starts by asking what cannot move, then uses that truth to narrow the option space.`,
			);
		}

		return createCapabilityResult(
			context,
			`L9 Distinguished Engineer produced ${details.length} strategic engineering guardrail${details.length === 1 ? "" : "s"} (mode: ${reviewMode}; horizon: ${decisionHorizon}; counterpoints: ${includeCounterpoints ? "included" : "omitted"}).`,
			createFocusRecommendations(
				"Distinguished engineer guidance",
				details,
				context.model.modelClass,
			),
			[
				buildWorkedExampleArtifact(
					"Distinguished-engineer decision anatomy",
					{
						problem:
							"Distributed model registry needs stronger consistency without blocking product teams that depend on availability.",
						scope: "architecture / portfolio boundary",
						constraints: [
							"multi-region failover",
							"low-latency reads",
							"auditability for model promotion",
						],
					},
					{
						invariants: [
							"promotion events must be durable before downstream use",
							"read traffic can degrade gracefully during partial outages",
							"ownership of registry correctness stays with the platform team",
						],
						dominantTradeoff:
							"consistency wins for writes; availability wins for reads",
						rejectedAlternative:
							"fully eventually consistent writes because it weakens promotion guarantees",
						decisionHorizon: "annual",
						operatingSignals: [
							"promotion latency",
							"replication lag",
							"incident count tied to stale metadata",
						],
					},
					"Use the anatomy of this example to distinguish a senior technical opinion from a generic trade study.",
				),
				buildEvalCriteriaArtifact(
					"L9 decision quality rubric",
					[
						"Invariants are named explicitly before solutions.",
						"The strongest rejected alternative is stated and compared honestly.",
						"Irreversible decisions are sequenced after evidence is available.",
						"Org boundaries and technical boundaries are aligned.",
						"Success signals are specific enough to falsify the thesis later.",
					],
					"Use this rubric when reviewing whether a decision memo reads like distinguished-engineer guidance.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	leadL9EngineerHandler,
);
