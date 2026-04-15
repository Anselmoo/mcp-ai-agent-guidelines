// src/skills/req/req-analysis.ts
import { z } from "zod";
import { req_analysis_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
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

const reqAnalysisInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			includeConstraintMapping: z.boolean().optional(),
			maxRequirements: z.number().int().positive().max(20).optional(),
		})
		.optional(),
});

const reqAnalysisHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(reqAnalysisInputSchema, input);
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
				"Requirements Analysis needs more detail. Provide: (1) user goal and current state, (2) constraints, (3) any existing artifacts to reference.",
			);
		}

		const details: string[] = [
			`Capture the core requirement around ${summarizeKeywords(parsed.data).join(", ") || "the requested change"} as user-visible outcomes before implementation.`,
		];

		if (signals.hasDeliverable) {
			details.push(
				`Validate requirements against deliverable: "${parsed.data.deliverable}".`,
			);
		} else {
			details.push(
				"Define the expected deliverable explicitly so downstream implementation and review stay aligned.",
			);
		}

		if (signals.hasConstraints) {
			const constraintSummary = signals.constraintList.slice(0, 3).join("; ");
			details.push(
				parsed.data.options?.includeConstraintMapping
					? `Constraint mapping: ${constraintSummary}.`
					: `Requirements must respect these constraints: ${constraintSummary}. Validate each requirement against them before finalising.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Cross-reference requirements against existing artifacts mentioned in context to avoid duplication.",
			);
		} else {
			details.push(
				"No existing artifacts referenced — ask whether specs, code, or benchmarks exist before extracting final requirements.",
			);
		}

		const maxRequirements = parsed.data.options?.maxRequirements ?? 5;
		details.push(
			`Limit to at most ${maxRequirements} high-priority requirements in this pass. Defer lower-priority items explicitly.`,
		);

		return createCapabilityResult(
			context,
			`Requirements Analysis produced ${details.length} input-specific findings (goal/state: ${signals.hasContext ? "provided" : "missing"}, deliverable: ${signals.hasDeliverable ? "defined" : "undefined"}, constraints: ${signals.hasConstraints ? `${signals.constraintList.length}` : "none"}).`,
			createFocusRecommendations(
				"Requirement focus",
				details,
				context.model.modelClass,
			),
			[
				buildOutputTemplateArtifact(
					"Requirements packet template",
					[
						"# Requirements packet",
						"## Goal",
						"## User outcomes",
						"## Constraints",
						"## Non-goals",
						"## Acceptance criteria",
						"## Open questions",
					].join("\n"),
					[
						"Goal",
						"User outcomes",
						"Constraints",
						"Non-goals",
						"Acceptance criteria",
						"Open questions",
					],
					"Use this outline to turn the analyzed request into a reviewable requirements packet.",
				),
				buildWorkedExampleArtifact(
					"Requirements extraction example",
					{
						request:
							"Analyze requirements for a tenant-safe workflow editor with audit history and rollback",
						context: "There is an existing draft spec and benchmark data.",
						constraints: ["HIPAA", "two-engineer team"],
					},
					{
						goal: "Ship a tenant-safe workflow editor",
						userOutcomes: [
							"Editors can modify workflows without exposing other tenants' data",
							"Auditable history supports rollback and review",
						],
						constraints: ["HIPAA", "two-engineer team"],
						acceptanceCriteria: [
							"All tenant-scoped data is isolated in read and write paths",
							"Rollback preserves prior revisions and audit history",
						],
					},
					"Concrete example of how to turn request signals into a requirements packet.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(skillManifest, reqAnalysisHandler);
