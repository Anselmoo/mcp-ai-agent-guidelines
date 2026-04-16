import { qual_review_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
} from "../shared/handler-helpers.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const QUALITY_DIMENSION_RULES: Array<{ pattern: RegExp; finding: string }> = [
	{
		pattern: /\b(naming|variable|function|class|method|identifier)\b/i,
		finding:
			"Audit naming conventions end-to-end: identifiers should communicate intent without requiring adjacent comments — rename anything that causes a double-take.",
	},
	{
		pattern: /\b(complex|cyclomatic|nested|deep|long|big|large|spaghetti)\b/i,
		finding:
			"Measure cyclomatic complexity of the flagged code paths; functions with complexity > 10 or nesting depth > 3 are strong refactoring candidates.",
	},
	{
		pattern: /\b(test|spec|coverage|unit|assert|mock|fixture|integration)\b/i,
		finding:
			"Verify that tests cover behavioral expectations rather than just lines: add edge-case and boundary tests where coverage hides silent failures.",
	},
	{
		pattern: /\b(duplicate|copy|repeat|dry|reuse|shared|extracted)\b/i,
		finding:
			"Locate duplication hotspots and evaluate extraction: shared logic should live in one place where intent is clear and changes propagate automatically.",
	},
	{
		pattern:
			/\b(error|exception[s]?|handle|catch|throw|null|undefined|guard)\b/i,
		finding:
			"Audit every error path: swallowed exceptions and bare nulls are the most common source of silent production failures — propagate context, never hide errors.",
	},
	{
		pattern:
			/\b(depend|coupling|interface|contract|solid|layer|abstraction)\b/i,
		finding:
			"Map dependency boundaries: modules should depend on stable interfaces, not concrete implementations — invert or extract any coupling that crosses layer lines.",
	},
	{
		pattern: /\b(comment|doc|jsdoc|tsdoc|inline|annotation)\b/i,
		finding:
			"Distinguish 'why' comments (valuable) from 'what' comments (code smell): if the code needs narration to be understood, the naming or structure is the real issue.",
	},
];

function buildReviewFindingExample() {
	return {
		severity: "high",
		evidence:
			"`handleApproval()` mixes validation, permission checks, and persistence in one nested function.",
		whyItMatters:
			"A failure in one branch can skip the permission check and the nesting hides the risk during review.",
		suggestedFix:
			"Extract authorization and validation into explicit guards before the persistence step.",
		testToAdd:
			"Add a regression test proving unauthorized requests fail before any state mutation occurs.",
	};
}

const qualReviewHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Quality Review needs code, a file path, or a description of the quality concern before it can produce targeted findings.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = QUALITY_DIMENSION_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ finding }) => finding);

		if (findings.length === 0) {
			findings.push(
				"Produce a ranked review packet where each finding includes severity, evidence, why it matters, suggested fix, and a test to add. Quality review should end with assignable findings, not a narrative walkthrough.",
				signals.hasContext
					? "Apply the review to the provided code context, flagging the top three issues by severity with evidence anchored to the supplied code."
					: "Provide the code or specify which quality dimension to target so the review can generate concrete, evidence-backed findings.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply the stated quality standards as acceptance filters: ${signals.constraintList.slice(0, 3).join("; ")}.`,
			);
		}

		const deliverableNote =
			"deliverable" in input && input.deliverable
				? ` for the "${String(input.deliverable)}" deliverable`
				: "";

		return createCapabilityResult(
			context,
			`Quality Review surfaced ${findings.length} dimension-specific review target${findings.length === 1 ? "" : "s"}${deliverableNote}.`,
			createFocusRecommendations(
				"Quality dimension",
				findings,
				context.model.modelClass,
			),
			[
				buildOutputTemplateArtifact(
					"Code review finding template",
					[
						"## Finding",
						"- Severity:",
						"- Evidence:",
						"- Why it matters:",
						"- Suggested fix:",
						"- Test to add:",
					].join("\n"),
					[
						"Severity",
						"Evidence",
						"Why it matters",
						"Suggested fix",
						"Test to add",
					],
					"Use this template to make each review comment specific, actionable, and test-backed.",
				),
				buildEvalCriteriaArtifact(
					"Review quality checklist",
					[
						"Every finding cites concrete code evidence.",
						"Every finding names the risk or failure mode.",
						"Every finding includes a fix or next action.",
						"Behavioral tests are recommended where the bug is likely to recur.",
					],
					"Checklist for separating high-value review comments from stylistic noise.",
				),
				buildComparisonMatrixArtifact(
					"Review lens comparison",
					["Signal", "Typical review question", "Typical output"],
					[
						{
							label: "Naming",
							values: [
								"Does the name communicate intent?",
								"Rename to make the contract obvious.",
								"Capture the exact symbol or identifier being reviewed.",
							],
						},
						{
							label: "Complexity",
							values: [
								"Is the path too nested or long?",
								"Split the function and lower cyclomatic complexity.",
								"Record the function or module boundary that needs simplification.",
							],
						},
						{
							label: "Error handling",
							values: [
								"Are exceptions and nulls explicit?",
								"Propagate failures with context and guard the boundary.",
								"Note the failing path and the expected recovery action.",
							],
						},
					],
					"Quick comparison of the most common review lenses and the concrete output they should produce.",
				),
				buildToolChainArtifact(
					"Review evidence loop",
					[
						{
							tool: "finding capture",
							description:
								"record the concrete code evidence before deciding severity or recommending a fix",
						},
						{
							tool: "risk framing",
							description:
								"name the failure mode or maintainability cost the evidence creates",
						},
						{
							tool: "closure action",
							description:
								"attach the smallest viable fix and the test that prevents recurrence",
						},
					],
					"Sequence for turning raw review observations into actionable findings.",
				),
				buildWorkedExampleArtifact(
					"Code review finding example",
					{
						request:
							"Review naming, complexity, error handling, and testing in this module",
					},
					buildReviewFindingExample(),
					"Worked example showing the evidence-rich shape expected from a quality review finding.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(skillManifest, qualReviewHandler);
