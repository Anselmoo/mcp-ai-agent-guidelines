// src/skills/req/req-acceptance-criteria.ts
import { z } from "zod";
import { req_acceptance_criteria_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const acceptanceCriteriaInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			format: z.enum(["gherkin", "checklist", "narrative"]).optional(),
			includeSadPath: z.boolean().optional(),
		})
		.optional(),
});

function buildAcceptanceCriteriaTemplate(
	format: "gherkin" | "checklist" | "narrative",
) {
	switch (format) {
		case "gherkin":
			return [
				"Feature: <feature name>",
				"Scenario: <happy path>",
				"  Given <starting state>",
				"  When <actor action>",
				"  Then <observable result>",
				"",
				"Scenario: <sad path>",
				"  Given <failure precondition>",
				"  When <invalid action or dependency failure>",
				"  Then <error response and recovery guidance>",
			].join("\n");
		case "narrative":
			return [
				"# Acceptance criteria",
				"## Actor",
				"## Trigger",
				"## Expected outcome",
				"## Error handling",
				"## Measurement / proof",
			].join("\n");
		default:
			return [
				"# Acceptance checklist",
				"- [ ] Actor and trigger are explicit",
				"- [ ] Observable success outcome is measurable",
				"- [ ] Error path is defined",
				"- [ ] Constraints are testable",
			].join("\n");
	}
}

function buildAcceptanceCriteriaExample(
	format: "gherkin" | "checklist" | "narrative",
	includeSadPath: boolean,
) {
	const happyPath =
		format === "gherkin"
			? "Given a request is approved\nWhen an auditor opens the export\nThen the system includes approver, timestamp, and decision in the audit trail"
			: format === "narrative"
				? "When an approval is completed, the exported audit trail shows the approver, decision, and timestamp in a deterministic order."
				: "Approved requests appear in the audit export with approver, decision, and timestamp.";
	const sadPath =
		format === "gherkin"
			? "Given the export request is invalid\nWhen the user submits the export\nThen the system returns a clear validation error without creating a partial file"
			: format === "narrative"
				? "If the export request is invalid, the user receives a clear validation error and no partial artifact is created."
				: "Invalid export requests fail with an actionable error and no partial file.";
	return {
		format,
		criteria: includeSadPath ? [happyPath, sadPath] : [happyPath],
	};
}

const reqAcceptanceCriteriaHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(acceptanceCriteriaInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		if (
			signals.keywords.length === 0 &&
			!signals.hasDeliverable &&
			!signals.hasContext
		) {
			return buildInsufficientSignalResult(
				context,
				"Acceptance Criteria generation needs more detail. Provide: feature description, expected behaviour, and any existing success criteria.",
			);
		}

		const keywords = summarizeKeywords(parsed.data);
		const format = parsed.data.options?.format ?? "checklist";
		const includeSadPath = parsed.data.options?.includeSadPath ?? true;

		const details: string[] = [];

		details.push(
			`Happy-path criterion (${format}): When a user performs "${keywords.slice(0, 2).join(" + ") || "the described action"}", the system should ${signals.hasDeliverable ? `produce "${parsed.data.deliverable}"` : "return the expected result"} within the required timeframe.`,
		);

		if (includeSadPath) {
			details.push(
				"Sad-path criterion: When input is invalid or the operation fails, the system must return a clear, actionable error — not a silent failure or an opaque 500.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Performance/compliance criterion: ${signals.constraintList.slice(0, 2).join("; ")} must be met under normal load. Include in the automated test suite.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Validate that the user-defined success criteria are testable as written: "${parsed.data.successCriteria?.slice(0, 120)}...". If not, break them down into atomic assertions.`,
			);
		} else {
			details.push(
				"No user-defined success criteria provided. Define at least one observable, measurable criterion before implementation begins.",
			);
		}

		return createCapabilityResult(
			context,
			`Acceptance Criteria generated ${details.length} criteria (format: ${format}, sad-path: ${includeSadPath}, constraints: ${signals.hasConstraints ? "wired" : "none"}).`,
			createFocusRecommendations(
				"Acceptance criterion",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Acceptance criteria format matrix",
					["Format", "Best when", "Output shape"],
					[
						{
							label: "Gherkin",
							values: [
								"Multiple actors or state transitions must stay unambiguous",
								"Scenario-driven Given/When/Then clauses",
								"Best for automation-ready behavior specs",
							],
						},
						{
							label: "Checklist",
							values: [
								"You need fast reviewable gates for implementation or QA",
								"Short observable pass/fail bullets",
								"Best for sprint-ready delivery criteria",
							],
						},
						{
							label: "Narrative",
							values: [
								"The audience needs concise prose tied to measurable outcomes",
								"Short actor-trigger-outcome paragraphs",
								"Best for product or design-aligned acceptance notes",
							],
						},
					],
					"Choose the criteria format that best matches the delivery and review audience.",
				),
				buildOutputTemplateArtifact(
					"Acceptance criteria template",
					buildAcceptanceCriteriaTemplate(format),
					[
						"Actor",
						"Trigger",
						"Observable outcome",
						"Error handling",
						"Measurement / proof",
					],
					"Template for turning a request into concrete, testable acceptance criteria.",
				),
				buildEvalCriteriaArtifact(
					"Acceptance criteria quality checklist",
					[
						"Each criterion identifies an actor, trigger, and observable result.",
						"Success and failure paths are both testable when the workflow needs them.",
						"Constraints are translated into measurable thresholds or checks.",
						"Every criterion can be verified without relying on unstated assumptions.",
					],
					"Checklist for deciding whether the criteria are specific enough to guide implementation and testing.",
				),
				buildWorkedExampleArtifact(
					"Acceptance criteria example",
					{
						request:
							"Generate acceptance criteria for an approval workflow feature",
						deliverable: "approval audit trail",
						successCriteria: "approvals are visible and exportable",
						options: { format, includeSadPath },
					},
					buildAcceptanceCriteriaExample(format, includeSadPath),
					"Worked example showing the selected criteria format with observable success and failure outcomes.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	reqAcceptanceCriteriaHandler,
);
