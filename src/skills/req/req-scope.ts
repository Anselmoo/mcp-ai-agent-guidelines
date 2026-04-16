// src/skills/req/req-scope.ts
import { z } from "zod";
import { req_scope_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
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

const reqScopeInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			includeOutOfScope: z.boolean().optional(),
			phaseCount: z.number().int().positive().max(5).optional(),
		})
		.optional(),
});

function buildScopePacket(
	keywords: string[],
	phaseCount: number,
	includeOutOfScope: boolean,
) {
	const focusArea = keywords.join(", ") || "the requested capability";
	return {
		goal: "Ship a bounded, reviewable slice without expanding into adjacent work",
		inScope: [
			`Core delivery for ${focusArea}`,
			"Only the behaviors required for the current deliverable",
		],
		...(includeOutOfScope
			? {
					outOfScope: [
						"Adjacent analytics, migrations, or polish that can land later",
						"Stretch goals with no direct impact on the current deliverable",
					],
				}
			: {}),
		phases: Array.from({ length: phaseCount }, (_, index) => ({
			phase: `Phase ${index + 1}`,
			outcome:
				index === 0
					? "Independently deployable value with a clear acceptance target"
					: "Follow-on expansion that builds on the validated prior phase",
		})),
		openQuestions: [
			"Which requests are deferred rather than rejected outright?",
			"Which phase owns the first user-visible slice?",
		],
	};
}

const reqScopeHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(reqScopeInputSchema, input);
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
				"Scope clarification needs more detail. Provide: what to include, what to exclude, and timeline or phase constraints.",
			);
		}

		const keywords = summarizeKeywords(parsed.data);
		const details: string[] = [
			`Define the in-scope boundary: specifically what features, surfaces, or behaviours around "${keywords.join(", ") || "this work"}" are included in this iteration.`,
		];

		if (parsed.data.options?.includeOutOfScope) {
			details.push(
				"Document explicit out-of-scope items to prevent scope creep during implementation.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Scope is bounded by these constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Map constraints to scope boundaries explicitly.`,
			);
		} else {
			details.push(
				"No constraints identified — define time, team, and compliance boundaries before confirming scope.",
			);
		}

		const phases = parsed.data.options?.phaseCount ?? 2;
		if (phases > 1) {
			details.push(
				`Structure delivery in ${phases} phases. Phase 1 should deliver independently deployable value; later phases extend it.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Align scope with the stated deliverable: "${parsed.data.deliverable}". Flag any scope items that don't contribute to this deliverable.`,
			);
		}

		return createCapabilityResult(
			context,
			`Scope Analysis identified ${details.length} scope-boundary factors (constraints: ${signals.hasConstraints ? "provided" : "missing"}, deliverable: ${signals.hasDeliverable ? "defined" : "undefined"}).`,
			createFocusRecommendations(
				"Scope boundary",
				details,
				context.model.modelClass,
			),
			[
				buildOutputTemplateArtifact(
					"Scope contract template",
					[
						"# Scope contract",
						"## Goal",
						"## In scope",
						"## Out of scope",
						"## Constraints",
						"## Phase 1 deliverable",
						"## Later phases",
						"## Open questions",
					].join("\n"),
					[
						"Goal",
						"In scope",
						"Out of scope",
						"Constraints",
						"Phase 1 deliverable",
						"Later phases",
						"Open questions",
					],
					"Use this contract to convert the request into an agreed scope boundary with explicit phase ownership.",
				),
				buildComparisonMatrixArtifact(
					"Scope boundary matrix",
					["Bucket", "Include when", "How to write it"],
					[
						{
							label: "In scope now",
							values: [
								"It directly advances the current deliverable",
								"Carry it in the current iteration",
								"Name the behavior, owner, and acceptance signal",
							],
						},
						{
							label: "Later phase",
							values: [
								"It matters, but Phase 1 can ship without it",
								"Defer it to a named later phase",
								"Record which later phase absorbs it and why it is deferred",
							],
						},
						{
							label: "Out of scope",
							values: [
								"It does not support the current iteration or constraint set",
								"Exclude it from the current plan",
								"Reject it explicitly so it cannot re-enter through implementation drift",
							],
						},
					],
					"Decision aid for separating current delivery from deferred or rejected work.",
				),
				buildEvalCriteriaArtifact(
					"Scope readiness checklist",
					[
						"In-scope items are concrete user-visible behaviors or surfaces.",
						"Out-of-scope items are explicit enough to block scope creep.",
						"Phase 1 delivers standalone value instead of a partial dependency.",
						"Constraints and deliverable boundaries are reflected in the scope split.",
					],
					"Checklist for deciding whether the scoped request is ready to hand off.",
				),
				buildWorkedExampleArtifact(
					"Scope packet example",
					{
						request:
							"Clarify scope for notifications, approvals, and admin controls",
						deliverable: "phase one launch plan",
						constraints: ["six-week deadline"],
						options: { includeOutOfScope: true, phaseCount: 3 },
					},
					buildScopePacket(
						["Notifications", "Approvals", "Admin controls"],
						3,
						true,
					),
					"Worked example showing an agreed in-scope boundary, explicit deferrals, and phased delivery.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(skillManifest, reqScopeHandler);
