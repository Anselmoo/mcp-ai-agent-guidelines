import { lead_software_evangelist_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
} from "../shared/handler-helpers.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const EVANGELIST_RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(duck.?tape|any|@ts-ignore|hack|workaround|temporary|fix.?later)\b/i,
		guidance:
			"No duck tape: every `as any`, commented-out error, and `// TODO: implement` in a runtime path is technical debt that compounds — proper fixes only. Define interface contracts first, then stubs that compile, then real implementation.",
	},
	{
		pattern:
			/\b(antibody|external|dependency|package|npm|import|third.?party|external.?lib)\b/i,
		guidance:
			"Treat new dependencies as ecosystem citizens: every package in package.json must have a declared home (domain in src/), satisfy an interface contract, have test coverage, and include a migration path. No orphan dependencies.",
	},
	{
		pattern:
			/\b(interface|contract|schema|protocol|boundary|api|facade|abstraction)\b/i,
		guidance:
			"Architecture first, implementation second: define interface contracts before writing code. Stubs that satisfy the contract keep the build green during radical change. INTERFACES → STUBS (compile) → REAL IMPL → TESTS → DOCS.",
	},
	{
		pattern: /\b(phase|sequence|stage|iteration|parallel|agent|fan.?out)\b/i,
		guidance:
			"Radical forward movement with zero regression: ship in phases but each phase must compile, pass types, and not break existing tests. Parallel agents accelerate delivery; they do not reduce quality gates.",
	},
	{
		pattern: /\b(build|compile|error|type.?error|fails|regression|test)\b/i,
		guidance:
			"Zero-tolerance build gate: `npm run build` must pass with 0 TypeScript errors before any change ships. If an agent breaks the build, revert that change immediately before continuing.",
	},
	{
		pattern: /\b(legacy|debt|old|deprecated|stale|dead)\b/i,
		guidance:
			"Kill anti-patterns radically: legacy shims, phantom features, dead code, and commented-out type errors are not technical debt — they are velocity anchors. List and eliminate them in the first phase.",
	},
	{
		pattern: /\b(feature|flag|experiment|optional|maybe|gradual|rollout)\b/i,
		guidance:
			"New tech is not experimental: if a package (satori, d3-shape, xstate, @toon-format/toon) is strategic, design around it, not despite it. Define machine configs, export contracts, and visualization layers before writing ad-hoc code.",
	},
	{
		pattern: /\b(migration|pathway|replacement|switching|upgrade|refactor)\b/i,
		guidance:
			"Plan migration paths for every dependency: even strategic choices must have a documented strategy for replacement if needs change. This is not pessimism — it is design discipline.",
	},
];

const advSoftwareEvangelistHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Software Evangelist needs a description of the architectural decision, dependency change, or design challenge before it can produce evangelist guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = EVANGELIST_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		if (findings.length === 0) {
			findings.push(
				"Start by diagnosing anti-patterns: identify duck-tape code, phantom features, and orphan dependencies — these are velocity anchors that must be eliminated first.",
				"Define the evangelist sequence before writing any code: INTERFACES → STUBS (compile) → REAL IMPL → TESTS → DOCS. This keeps the build green during radical change.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply evangelist constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Map each constraint to an interface contract or architecture boundary.`,
			);
		}

		if (signals.hasContext) {
			findings.push(
				"Analyze the provided context for antibodies (orphan dependencies), phantom code, and duck tape — these reveal where the architecture lacks proper contracts and migration paths.",
			);
		}

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Migration strategy comparison",
				["Option", "Best use case", "Main risk", "Exit condition"],
				[
					{
						label: "Contract-first rewrite",
						values: [
							"the interface boundary is unstable but important",
							"higher up-front cost",
							"all callers move to the new contract",
						],
					},
					{
						label: "Parallel shim migration",
						values: [
							"the old and new paths must coexist briefly",
							"shim can become permanent if exit criteria are weak",
							"shim removed and tests prove parity",
						],
					},
					{
						label: "Tactical patching",
						values: [
							"a small containment fix is needed before a larger plan",
							"accumulates debt if left as the strategy",
							"clear owner and expiry date are set",
						],
					},
				],
				"Use this matrix to choose the migration shape before implementation starts.",
			),
			buildOutputTemplateArtifact(
				"Contract-first migration playbook",
				`# Contract-first migration playbook

## Problem
## Interface contract
## Migration phases
## Build and test gates
## Dependency exit criteria
## Documentation and rollout
## Ownership`,
				[
					"Problem",
					"Interface contract",
					"Migration phases",
					"Build and test gates",
					"Dependency exit criteria",
					"Documentation and rollout",
					"Ownership",
				],
				"Copy this playbook into the migration plan so the team can move from slogans to an executable sequence.",
			),
			buildWorkedExampleArtifact(
				"Legacy dependency migration example",
				{
					situation:
						"replace an integration package that currently relies on temporary workarounds and unchecked casts",
					constraints: [
						"keep the build green",
						"avoid orphan dependencies",
						"preserve rollout safety for one release",
					],
				},
				{
					result: [
						"declare the interface contract for the integration boundary",
						"introduce typed stubs that compile before swapping implementations",
						"run both paths in parallel until parity is proven",
						"remove the workaround and retire the legacy path with an owner and date",
					],
					evidence: [
						"boundary tests",
						"build passing without suppressions",
						"migration exit checklist",
					],
				},
				"Use this example to keep the evangelist guidance grounded in a real migration sequence.",
			),
			buildEvalCriteriaArtifact(
				"Evangelist delivery checklist",
				[
					"Every boundary has an explicit interface contract before implementation changes land.",
					"Each dependency has a declared home, owner, and migration exit date.",
					"The build stays green while the migration is in flight.",
					"Temporary shims and workarounds are tracked with removal criteria.",
					"Tests and docs are updated with the contract, not after the fact.",
				],
				"Use this checklist to verify that the guidance is concrete enough to ship.",
			),
		];

		return createCapabilityResult(
			context,
			`Software Evangelist identified ${findings.length} architectural guidance${findings.length === 1 ? "" : "s"} for radical forward movement with zero regression.`,
			createFocusRecommendations(
				"Evangelist guidance",
				findings,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	advSoftwareEvangelistHandler,
);
