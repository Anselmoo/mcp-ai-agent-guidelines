import { z } from "zod";
import { lead_digital_architect_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	createCapabilityResult,
	createFocusRecommendations,
	summarizeKeywords,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import {
	extractRequestSignals,
	summarizeContextEvidence,
} from "../shared/recommendations.js";

const leadDigitalArchitectInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			architectureLens: z
				.enum(["platform", "operating-model", "governance", "portfolio"])
				.optional(),
			includeOperatingModel: z.boolean().optional(),
			includeTransitionStates: z.boolean().optional(),
		})
		.passthrough()
		.optional(),
});

type ArchitectureLens =
	| "platform"
	| "operating-model"
	| "governance"
	| "portfolio";

const DIGITAL_ARCHITECT_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(platform|data|model|retriev|observability|routing|foundation)\b/i,
		detail:
			"Separate the enterprise AI platform into layers: data and retrieval, model access and routing, policy enforcement, observability, and application integration. Layering matters because each layer changes at a different rate and should have its own contract.",
	},
	{
		pattern: /\b(governance|policy|risk|compliance|regulat|control)\b/i,
		detail:
			"Design governance as part of the architecture, not as review theatre after the fact. The architecture should show where policy is enforced, who approves exceptions, and how evidence is retained for audit.",
	},
	{
		pattern: /\b(team|ownership|operating model|responsibilit|org|decision)\b/i,
		detail:
			"Attach ownership boundaries to architecture boundaries. Enterprise architectures fail when shared platforms exist technically but no team owns uptime, standards, or change control for them.",
	},
	{
		pattern: /\b(legacy|integration|migration|system|application|estate)\b/i,
		detail:
			"Show how legacy systems coexist with the target architecture during transition. A future-state diagram without coexistence rules produces a strategy deck, not an executable enterprise architecture.",
	},
	{
		pattern: /\b(build|buy|vendor|partner|sourc|procure)\b/i,
		detail:
			"Make sourcing decisions per architectural component. The right answer for orchestration may differ from the right answer for observability or knowledge retrieval, and enterprise lock-in often begins when those distinctions are skipped.",
	},
	{
		pattern: /\b(identity|access|security|trust|boundary|tenant)\b/i,
		detail:
			"Draw trust boundaries explicitly: who may access which data, under what identity, and through which enforcement point. Security posture is an architectural property, not an appendix.",
	},
	{
		pattern: /\b(cost|portfolio|investment|finops|value|economics)\b/i,
		detail:
			"Connect architectural choices to portfolio economics: unit cost, shared-service leverage, and the switching cost of each foundational component. Enterprise architecture should make future cost structure legible.",
	},
];

function inferArchitectureLens(
	input: string,
	explicit?: ArchitectureLens,
): ArchitectureLens {
	if (explicit !== undefined) return explicit;
	if (/\b(governance|policy|compliance|risk)\b/i.test(input)) {
		return "governance";
	}
	if (/\b(team|ownership|operating model|decision rights)\b/i.test(input)) {
		return "operating-model";
	}
	if (/\b(platform|data|model|observability|routing)\b/i.test(input)) {
		return "platform";
	}
	return "portfolio";
}

const leadDigitalArchitectHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(leadDigitalArchitectInputSchema, input);
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
				"Digital Enterprise Architect needs the enterprise scope, architecture objective, or current-state constraints before it can frame a credible target-state design. Provide: (1) the enterprise outcome, (2) the platform or governance scope, (3) major constraints or legacy dependencies.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const architectureLens = inferArchitectureLens(
			combined,
			parsed.data.options?.architectureLens,
		);
		const includeOperatingModel =
			parsed.data.options?.includeOperatingModel ?? true;
		const includeTransitionStates =
			parsed.data.options?.includeTransitionStates ?? true;

		const details: string[] = [
			`Frame the enterprise architecture around the ${architectureLens} lens for "${summarizeKeywords(parsed.data).join(", ") || "the requested enterprise shift"}". The architecture should explain how shared capabilities, decision rights, and risk controls reinforce one another across the estate.`,
		];

		details.push(
			...DIGITAL_ARCHITECT_RULES.filter(({ pattern }) =>
				pattern.test(combined),
			).map(({ detail }) => detail),
		);

		if (includeOperatingModel) {
			details.push(
				"Add an operating-model overlay: owning teams, standards authority, escalation path, and service interfaces for shared AI capabilities. Architecture without an operating model decays as soon as the first cross-team dependency slips.",
			);
		}

		if (includeTransitionStates) {
			details.push(
				"Describe at least one transition state between current and target architecture. Enterprise transformations fail when they assume a single leap from fragmented systems to a clean future state.",
			);
		}

		if (signals.hasContext || signals.hasEvidence) {
			details.push(
				summarizeContextEvidence(signals) ??
					"Use the provided enterprise context as the baseline architecture. The target-state design should resolve the known constraints instead of pretending they do not exist.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the architecture guidance toward the stated deliverable: "${parsed.data.deliverable}". Enterprise architecture should be legible in the artifact the decision-makers will actually review.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Turn the success criteria into architecture acceptance conditions: "${parsed.data.successCriteria}". If the architecture cannot show how these conditions will be measured, it is still aspirational.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Treat the stated constraints as architecture invariants: ${signals.constraintList.slice(0, 3).join("; ")}. Designs that require a constraint exception belong in a separate decision record, not in the base architecture.`,
			);
		}

		return createCapabilityResult(
			context,
			`Digital Enterprise Architect produced ${details.length} architecture guardrail${details.length === 1 ? "" : "s"} (lens: ${architectureLens}; operating model: ${includeOperatingModel ? "included" : "omitted"}; transition states: ${includeTransitionStates ? "included" : "omitted"}).`,
			createFocusRecommendations(
				"Enterprise architecture guidance",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Enterprise AI architecture decision matrix",
					["Owner", "Boundary rule", "Primary control", "Transition state"],
					[
						{
							label: "Data and retrieval",
							values: [
								"data platform team",
								"Only curated sources enter the context window",
								"Schema registry + content policy scan",
								"Read-through from legacy stores",
							],
						},
						{
							label: "Model access and routing",
							values: [
								"model platform team",
								"Approved models only per use case",
								"Routing policy + model registry",
								"Dual-run with legacy provider",
							],
						},
						{
							label: "Policy enforcement",
							values: [
								"governance team",
								"Policy checks are fail-closed",
								"Validation gate + audit log",
								"Advisory mode before blocking mode",
							],
						},
						{
							label: "Observability",
							values: [
								"SRE / platform ops",
								"Every decision emits evidence",
								"Trace logging + drift alerts",
								"Shadow dashboard with manual review",
							],
						},
						{
							label: "Application integration",
							values: [
								"product engineering",
								"Workflows call only supported interfaces",
								"Contract tests + feature flags",
								"Legacy integration shim with exit date",
							],
						},
					],
					"Use this matrix to turn a target-state slide into an executable ownership and boundary plan.",
				),
				buildOutputTemplateArtifact(
					"Target-state architecture brief",
					`# Target-state architecture brief
## Outcome
## Scope
## Layered topology
## Operating model
## Transition states
## Cost and sourcing notes
## Open decisions`,
					[
						"Outcome",
						"Scope",
						"Layered topology",
						"Operating model",
						"Transition states",
						"Cost and sourcing notes",
						"Open decisions",
					],
					"Copy this template into an architecture memo or ADR so the recommendation stays grounded in a reviewable artifact.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	leadDigitalArchitectHandler,
);
