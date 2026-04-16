import { z } from "zod";
import { qm_measurement_collapse_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import { fmtNum } from "./qm-math-helpers.js";
import {
	hasCandidateSignal,
	hasCodeReviewSignal,
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
} from "./qm-physics-helpers.js";

// ISOLATION CONTRACT: qm-measurement-collapse models a code review decision
// as a quantum measurement — the moment a candidate is selected, all other
// candidates are projected onto it and adjacent modules experience "backaction".
//
// Scope boundaries — do NOT surface guidance belonging to:
//   qm-superposition-generator — pre-decision probability ranking of candidates
//   qual-review                — general code review quality guidance
//   gov-workflow-compliance    — policy/compliance review process
//
// This handler is advisory only: it identifies which modules are most likely
// to need review or update after a given implementation decision, and why.

const measurementCollapseInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			collapseScope: z
				.enum(["single-module", "subsystem", "cross-cutting"])
				.optional()
				.describe(
					"Scope of the implementation decision: single-module (affects one file/class), subsystem (affects a bounded service or package), or cross-cutting (affects shared infrastructure, interfaces, or contracts used across many modules).",
				),
			backactionRadius: z
				.enum(["immediate", "transitive", "full-graph"])
				.optional()
				.describe(
					"How far to trace backaction: immediate (direct dependents only), transitive (one hop beyond direct dependents), or full-graph (all reachable modules in the dependency graph).",
				),
			selectedSimilarity: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Cosine similarity of the selected implementation to the notional ideal (0=orthogonal, 1=identical). Higher similarity → lower backaction on adjacent modules.",
				),
			adjacentCount: z
				.number()
				.int()
				.min(1)
				.max(50)
				.optional()
				.describe(
					"Number of adjacent modules that share a dependency on the selected implementation.",
				),
		})
		.optional(),
});

type CollapseScope = "single-module" | "subsystem" | "cross-cutting";
type BackactionRadius = "immediate" | "transitive" | "full-graph";

const COLLAPSE_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(select|chosen|chose|pick|decision|adopt|merge|commit|proceed.with)\b/i,
		detail:
			"Once an implementation is selected (the wavefunction collapses), the review focus shifts from comparison to propagation. List every module that imports, extends, or is composed with the selected implementation — these are the immediate backaction targets. Each must be checked for: (1) interface contract changes, (2) behavioural assumptions that the selected implementation may invalidate, and (3) configuration or dependency version conflicts introduced by the new implementation.",
	},
	{
		pattern:
			/\b(adjacent|neighbour|neighbor|depend|caller|consumer|downstream)\b/i,
		detail:
			"Adjacent modules are ranked by backaction intensity: modules with higher coupling to the selected implementation experience stronger backaction (they are more likely to require immediate changes). Apply a simple triage: list all callers of the selected module's public API, sort by import depth and call frequency, and assign each a backaction severity of HIGH (must change before deployment), MEDIUM (should review before next sprint), or LOW (flag for awareness, no immediate action required).",
	},
	{
		pattern: /\b(interface|contract|api|signature|type|schema|protocol)\b/i,
		detail:
			"Interface and contract changes are the primary backaction propagation mechanism. If the selected implementation changes any public type, function signature, or network schema, every consumer of that contract is a guaranteed backaction target. Generate a diff of the before-and-after interface surface and map each changed item to its consumers before marking the decision final. Undiscovered interface consumers are the most common source of post-decision integration failures.",
	},
	{
		pattern: /\b(test|coverage|spec|assertion|fixture|mock|stub)\b/i,
		detail:
			"Existing tests for candidate implementations that were not selected should be archived, not deleted. Tests encode the understanding of rejected candidates' behaviours, and that understanding may be relevant when debugging or revisiting the decision. Tests for the selected implementation should be run immediately as a post-collapse verification: they confirm the expected backaction (the selected implementation behaves as assumed) before propagation analysis begins.",
	},
	{
		pattern: /\b(rollback|revert|undo|reverse|backtrack|regret|reconsider)\b/i,
		detail:
			"Design the rollback path at the time of selection, not after problems emerge. The measurement-collapse analogy is instructive: just as a quantum measurement cannot be un-done (the wavefunction does not spontaneously re-expand), a merged implementation change that has propagated backaction to adjacent modules is costly to reverse — each adjacent module that was changed to accommodate the selection must also be reverted. Document the rollback sequence before merging: which modules must be reverted, in what order, and what tests confirm a clean revert.",
	},
	{
		pattern: /\b(side.effect|hidden|unexpected|surprise|implicit|latent)\b/i,
		detail:
			"Latent backaction — effects on modules that appear unrelated but share internal state, global configuration, or implicit ordering contracts — is the hardest category to detect. Scan for: shared singletons, global configuration keys, database schema assumptions, feature flags, and environment variable names used by the selected implementation. Each of these represents a potential latent coupling channel that the explicit dependency graph will miss.",
	},
	{
		pattern:
			/\b(priorit|order|sequence|first|which.module|start.with|begin)\b/i,
		detail:
			"Sequence post-decision reviews by backaction severity: HIGH modules first (they block deployment), then MEDIUM (they block the next sprint), then LOW (they are awareness items). Within each severity tier, order by review cost: small, well-tested modules with narrow interfaces are cheaper to review and should be cleared first to unblock the pipeline. Modules that are both high-severity and expensive to review should be escalated as a coordination risk before the decision is finalised.",
	},
	{
		pattern: /\b(document|record|trace|log|annotate|explain|rationale)\b/i,
		detail:
			"Record the backaction map as part of the decision documentation: which modules were identified as backaction targets, which were cleared immediately, which require follow-up, and which were explicitly deferred with a tracking ticket. This record is the primary input to the post-implementation review meeting — teams that skip this step routinely discover backaction-related regressions two to four sprints after the original decision.",
	},
];

const collapseScopeLabels: Record<CollapseScope, string> = {
	"single-module": "single-module (one file or class)",
	subsystem: "subsystem (bounded service or package)",
	"cross-cutting": "cross-cutting (shared infrastructure or contracts)",
};

const backactionRadiusLabels: Record<BackactionRadius, string> = {
	immediate: "immediate dependents only",
	transitive: "immediate + one-hop transitive dependents",
	"full-graph": "all reachable dependents in the dependency graph",
};

const measurementCollapseHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(measurementCollapseInputSchema, input);
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
				"Measurement Collapse needs a description of the implementation decision, the selected candidate, and the modules adjacent to it. Provide at least: (1) what was decided, and (2) what modules are likely affected.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		// Domain guard: need at least a review or candidate signal
		if (
			!hasCodeReviewSignal(combined) &&
			!hasCandidateSignal(combined) &&
			signals.keywords.length < 4
		) {
			return buildInsufficientSignalResult(
				context,
				"Measurement Collapse needs signal that an implementation decision has been made or is being made — describe the selected implementation and the modules that depend on or interact with it so backaction analysis can be produced.",
			);
		}

		const similarity = parsed.data.options?.selectedSimilarity;
		const adjacentCount = parsed.data.options?.adjacentCount;
		let numericDetail: string | undefined;
		if (similarity !== undefined) {
			const backactionIntensity = 1 - similarity ** 2;
			const expectedImpacted =
				adjacentCount !== undefined
					? Math.round(adjacentCount * backactionIntensity)
					: undefined;
			numericDetail = `Illustrative backaction estimate: selected similarity = ${fmtNum(similarity)}, backaction intensity = 1 − similarity² = ${fmtNum(backactionIntensity)}. ${adjacentCount !== undefined ? `With ${adjacentCount} adjacent modules, ~${expectedImpacted} may require review or update. ` : ""}High backaction (intensity > 0.5) means the implementation departs significantly from the existing interface idiom — expect broad ripple effects. Low backaction (< 0.2) means smooth integration. Treat as order-of-magnitude advisory input.`;
		}

		const collapseScope = parsed.data.options?.collapseScope ?? "single-module";
		const backactionRadius =
			parsed.data.options?.backactionRadius ?? "immediate";

		const details: string[] = [
			`Model the implementation decision as a measurement collapse with scope: ${collapseScopeLabels[collapseScope]}, backaction radius: ${backactionRadiusLabels[backactionRadius]}. The collapse event is the moment the selected implementation is committed — after this point, the focus shifts from candidate comparison to backaction management: identifying which modules are disturbed by the selection, quantifying their exposure, and sequencing the remediation review.`,
		];

		if (numericDetail) {
			details.unshift(numericDetail);
		}

		details.push(...matchAdvisoryRules(COLLAPSE_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Begin with an explicit pre-commit checklist: (1) identify all direct callers of the selected implementation, (2) identify all modules that share state with it, (3) identify all tests that reference the rejected candidates. These three lists are the minimum viable backaction map.",
				"Treat the spectral gap between the selected candidate and the runner-up as an indicator of decision confidence. A large gap means the decision was unambiguous and backaction is likely clean. A small gap means the decision was marginal — in this case, the runner-up's test suite should be reviewed alongside the winner's, because the adjacent modules may have been partially designed to accommodate the runner-up's contract.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided context to anchor the backaction map. Identify any modules mentioned in the context that could be affected by the decision — these are the first-priority review targets. Context-mentioned modules that are NOT in the dependency graph are worth noting: they may be consuming the selected implementation through a non-explicit channel (config file, environment variable, shared database schema).",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints to the backaction triage: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints on deployment timing, team availability, or freeze windows determine which backaction targets can be addressed before vs. after the decision is committed. Any HIGH-severity backaction target that cannot be addressed before the deadline should trigger an escalation or a scope reduction of the selected implementation.`,
			);
		}

		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleSimilarity = similarity ?? 0.72;
		const sampleAdjacentCount = adjacentCount ?? 4;
		const sampleBackactionIntensity = 1 - sampleSimilarity ** 2;
		const sampleExpectedImpacted = Math.round(
			sampleAdjacentCount * sampleBackactionIntensity,
		);

		const artifacts = [
			buildWorkedExampleArtifact(
				"Measurement collapse worked example",
				{
					collapseScope,
					backactionRadius,
					selectedSimilarity: sampleSimilarity,
					adjacentCount: sampleAdjacentCount,
				},
				{
					backactionIntensity: fmtNum(sampleBackactionIntensity),
					expectedImpacted: sampleExpectedImpacted,
					confidence: "medium",
					recommendedAction:
						"Review direct dependents first, then widen the backaction map if the contract changed.",
					engineeringTranslation:
						"The commit is a decision point: once the winner is chosen, adjacent modules need a quick backaction pass.",
				},
				"Worked example: translate selected similarity into a backaction estimate and review order.",
			),
			buildOutputTemplateArtifact(
				"Measurement backaction map template",
				"| Module | Severity | Why affected | Confidence | Next action |\n| --- | --- | --- | --- | --- |\n| Direct dependents |  |  |  |  |\n| Shared-state consumers |  |  |  |  |\n| Latent coupling candidates |  |  |  |  |",
				["Module", "Severity", "Why affected", "Confidence", "Next action"],
				"Template for recording which modules need review after a collapse decision.",
			),
			buildToolChainArtifact(
				"Measurement collapse review chain",
				[
					{
						tool: "identify the selected implementation",
						description:
							"pin the decision so the review can focus on propagation",
					},
					{
						tool: "list direct callers and consumers",
						description: "create the immediate backaction set",
					},
					{
						tool: "inspect shared state and public contracts",
						description: "find hidden coupling that the import graph may miss",
					},
					{
						tool: "run the selected tests",
						description: "validate the decision before rollout",
					},
				],
				"Tool chain for moving from selection to backaction review in a controlled order.",
			),
		];

		return createCapabilityResult(
			context,
			`Measurement Collapse produced ${details.length} backaction-analysis advisory items (scope: ${collapseScopeLabels[collapseScope]}, radius: ${backactionRadiusLabels[backactionRadius]}).`,
			createFocusRecommendations(
				"Measurement collapse guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	measurementCollapseHandler,
);
