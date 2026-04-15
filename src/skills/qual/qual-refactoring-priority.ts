import { qual_refactoring_priority_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const PRIORITY_RULES: Array<{ pattern: RegExp; finding: string }> = [
	{
		pattern: /\b(churn|change.?freq|hot.?spot|often.?change|frequent)\b/i,
		finding:
			"Prioritize high-churn files: modules that change frequently and have high complexity are the highest-ROI refactoring targets — use churn × complexity as the primary ranking signal.",
	},
	{
		pattern: /\b(bug|defect|incident|regression|fix|patch)\b/i,
		finding:
			"Rank by defect density: modules with the most bug fixes in the last 6 months are structurally deficient — refactoring them reduces future incident rate, not just code aesthetics.",
	},
	{
		pattern: /\b(coupling|depend|entangle|import|circular)\b/i,
		finding:
			"Break high-coupling modules first: a module that is imported by many others amplifies the cost of every change it touches — reducing its coupling has multiplicative downstream benefit.",
	},
	{
		pattern: /\b(test|coverage|untested|spec|assert|flaky)\b/i,
		finding:
			"Add tests before refactoring: untested code cannot be refactored safely — the first priority for any refactoring candidate with low coverage is to establish a behavioral test suite, not to restructure.",
	},
	{
		pattern: /\b(business|revenue|customer|critical|core|feature)\b/i,
		finding:
			"Weight business impact: refactoring a core revenue path has higher priority than refactoring an internal tool — align refactoring priority with business-criticality, not just technical metrics.",
	},
	{
		pattern: /\b(debt|legacy|migration|moderniz|deprecat|obsolete)\b/i,
		finding:
			"Classify debt by type: design debt (wrong abstraction), code debt (poor implementation), and infrastructure debt (outdated tooling) require different refactoring strategies — mixing them creates scope creep.",
	},
	{
		pattern: /\b(team|onboard|maintain|readab|understand|document)\b/i,
		finding:
			"Factor in team pain: modules that slow down onboarding or require tribal knowledge to modify should be prioritized for clarity refactoring — developer productivity debt compounds faster than code quality debt.",
	},
];

function buildRefactoringPriorityExample() {
	return {
		rankings: [
			{
				module: "billing-workflow.ts",
				scoreDrivers: [
					"high churn",
					"recent regressions",
					"business-critical path",
				],
				firstMove: "Add behavior-locking tests before any structural change",
			},
			{
				module: "orchestration-router.ts",
				scoreDrivers: [
					"high coupling",
					"review churn",
					"shared dependency boundary",
				],
				firstMove: "Split routing policy from execution wiring",
			},
		],
	};
}

const qualRefactoringPriorityHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Refactoring Priority needs a description of the codebase, modules, or quality concerns to rank before it can produce a prioritized refactoring plan.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = PRIORITY_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ finding }) => finding);

		if (findings.length === 0) {
			findings.push(
				"Build a refactor ranking sheet with candidate module, churn, complexity, defect history, business impact, test safety, and first move. Prioritization should produce an ordered queue, not a general statement that the codebase needs cleanup.",
				"Separate 'must refactor now' from 'defer until later' using explicit evidence. If the current sprint cannot absorb the work, record what would need to change for the candidate to move up the queue.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply refactoring constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Use constraints to cap scope — refactoring without a scope boundary expands indefinitely.`,
			);
		}

		if (signals.hasContext) {
			findings.push(
				"Use the provided context to identify refactoring candidates: focus on modules mentioned in recent incidents, PRs with high review churn, or code paths flagged by static analysis.",
			);
		}

		return createCapabilityResult(
			context,
			`Refactoring Priority produced ${findings.length} ranked prioritization factor${findings.length === 1 ? "" : "s"}.`,
			createFocusRecommendations(
				"Priority factor",
				findings,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Refactor priority signal matrix",
					["Signal", "What it means", "Default first move"],
					[
						{
							label: "High churn + complexity",
							values: [
								"Change risk is already concentrated here",
								"Rank it near the top of the backlog",
								"Stabilize behavior with tests, then simplify the hotspot",
							],
						},
						{
							label: "Defect density",
							values: [
								"The module is already producing user-visible failures",
								"Escalate ahead of purely aesthetic debt",
								"Trace the failure pattern before rewriting structure",
							],
						},
						{
							label: "High coupling",
							values: [
								"Every change amplifies downstream cost",
								"Prioritize boundary cleanup over cosmetic edits",
								"Untangle dependencies before broader refactors",
							],
						},
						{
							label: "Low test safety",
							values: [
								"Refactoring risk is higher than the team can absorb safely",
								"Do not restructure before adding tests",
								"Write characterization tests first",
							],
						},
					],
					"Use this matrix to decide why a module deserves priority and what the first refactoring move should be.",
				),
				buildOutputTemplateArtifact(
					"Refactor ranking sheet",
					[
						"# Refactor candidate",
						"## Module / file",
						"## Churn signal",
						"## Complexity / coupling signal",
						"## Defect history",
						"## Business impact",
						"## Test safety",
						"## Recommendation (now / next / later)",
						"## First move",
					].join("\n"),
					[
						"Module / file",
						"Churn signal",
						"Complexity / coupling signal",
						"Defect history",
						"Business impact",
						"Test safety",
						"Recommendation (now / next / later)",
						"First move",
					],
					"Use one sheet per candidate so the team can rank refactoring work with evidence instead of intuition.",
				),
				buildToolChainArtifact(
					"Refactor triage loop",
					[
						{
							tool: "candidate inventory",
							description:
								"list the modules under consideration with the signals that make them risky",
						},
						{
							tool: "evidence weighting",
							description:
								"compare churn, defects, coupling, and business impact before assigning priority",
						},
						{
							tool: "first move selection",
							description:
								"choose the smallest safe step such as tests, extraction, or boundary cleanup",
						},
					],
					"Sequence for turning refactoring debt into a ranked, sprint-usable queue.",
				),
				buildEvalCriteriaArtifact(
					"Refactor ranking checklist",
					[
						"Each candidate names the evidence behind its priority.",
						"Business impact and technical risk are both visible in the ranking.",
						"Untested candidates default to test-first rather than restructure-first.",
						"The recommendation distinguishes now, next, and later work.",
					],
					"Checklist for deciding whether refactoring priorities are concrete enough to schedule.",
				),
				buildWorkedExampleArtifact(
					"Refactor ranking example",
					{
						request:
							"Prioritize refactoring for high-churn hotspot modules with regression fixes, tight coupling, low test coverage, and business-critical customer paths",
					},
					buildRefactoringPriorityExample(),
					"Worked example showing the ranked output shape expected from a refactoring prioritization pass.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	qualRefactoringPriorityHandler,
);
