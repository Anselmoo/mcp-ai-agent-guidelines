/**
 * gov-model-compatibility.ts
 *
 * Handwritten capability handler for the gov-model-compatibility skill.
 *
 * Domain: Assessing compatibility between AI models and existing workflows
 * when upgrading or switching models — context-window differences, output
 * format changes, API-signature deltas, capability gaps, and rollback planning.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gov-model-governance          — version pinning, lifecycle, deployment policy
 *   gov-policy-validation         — policy compliance gates (not model fit)
 *   gov-regulated-workflow-design — regulated-industry workflow design patterns
 *   eval-prompt-bench             — benchmark performance evaluation
 *
 * Outputs are ADVISORY ONLY — this handler does NOT execute compatibility tests,
 * modify model configurations, or approve model promotions.
 */

import { z } from "zod";
import { gov_model_compatibility_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	GOV_ADVISORY_DISCLAIMER,
	hasModelCompatibilitySignal,
} from "./gov-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const modelCompatibilityInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			compatibilityDimension: z
				.enum([
					"context-window",
					"output-format",
					"api-signature",
					"capability",
					"latency",
					"cost",
				])
				.optional()
				.describe(
					"Primary compatibility dimension to assess. context-window: token limit differences affecting prompt/response truncation; output-format: JSON schema, structured output, or function-calling format changes; api-signature: SDK/API parameter name changes between providers or model versions; capability: feature gaps (vision, tool-use, code-execution); latency: p50/p99 latency differences affecting SLA; cost: per-token pricing differences affecting budget.",
				),
			migrationRisk: z
				.enum(["low", "medium", "high"])
				.optional()
				.describe(
					"Estimated migration risk level. low: drop-in replacement with same API surface and capability; medium: moderate changes requiring prompt or code adjustments; high: significant behavioural differences or breaking API changes requiring extensive testing.",
				),
			rolloutStrategy: z
				.enum(["immediate", "canary", "shadow", "blue-green", "phased"])
				.optional()
				.describe(
					"Deployment strategy for the model transition. immediate: direct cutover; canary: route small traffic fraction to new model; shadow: run new model alongside old without serving responses; blue-green: maintain two full environments and switch traffic; phased: migrate by use-case or user segment.",
				),
		})
		.optional(),
});

type CompatibilityDimension =
	| "context-window"
	| "output-format"
	| "api-signature"
	| "capability"
	| "latency"
	| "cost";
type MigrationRisk = "low" | "medium" | "high";
type RolloutStrategy =
	| "immediate"
	| "canary"
	| "shadow"
	| "blue-green"
	| "phased";

// ─── Dimension Guidance ───────────────────────────────────────────────────────

const DIMENSION_GUIDANCE: Record<CompatibilityDimension, string> = {
	"context-window":
		"Context-window compatibility: measure the distribution of your production prompt lengths (including retrieved context) against the target model's token limit. If the p95 prompt length exceeds 80% of the target context window, you are at risk of silent truncation — models do not error on overflow, they silently drop content. Audit which content is truncated under the new limit (typically tail-end of the context, which is often the most recent or most relevant for RAG). Consider prompt compression or context-selection strategies before migrating if truncation affects quality.",
	"output-format":
		"Output-format compatibility: if your downstream code parses model outputs structurally (JSON, XML, function-call arguments), run a format regression suite against the target model before migration. Different models produce different JSON schema adherence rates — test with your production prompt set and measure parse failure rate. For structured output modes, check whether the target model supports constrained decoding (JSON mode, function-calling, tool-use) and whether the constraint schema syntax is identical to the source model.",
	"api-signature":
		"API-signature compatibility: catalog all SDK calls, request parameters, and response field accesses in your codebase before migration. Pay attention to: parameter renaming (e.g., 'max_tokens' vs 'maxOutputTokens'), response field paths (e.g., choices[0].message.content vs candidates[0].content.parts[0].text), error code differences, and streaming event format changes. Use a compatibility shim layer to abstract provider differences — this makes future migrations cheaper and prevents vendor lock-in at the call site.",
	capability:
		"Capability compatibility: enumerate the capabilities your pipeline relies on (vision, function-calling, code execution, multi-turn memory, tool-use, structured output) and verify each is available in the target model at the required quality level. Missing capabilities are hard migration blockers — they require workflow redesign, not just configuration changes. Capability-grade differences (e.g., weaker code generation) require evaluation, not just feature detection.",
	latency:
		"Latency compatibility: measure p50, p95, and p99 latency of the target model under your production request distribution (prompt length, output token budget, batch size). Compare against your SLA thresholds and user experience tolerances. Note that latency varies significantly by region, time of day, and load — measure during representative peak conditions. For synchronous user-facing workflows, a 50% latency increase that keeps p99 under the SLA threshold is typically acceptable; for automated pipelines, mean latency matters more.",
	cost: "Cost compatibility: model migration affects total cost through three levers: per-token input/output pricing, context-window efficiency (longer context = more input tokens), and quality-driven retry rate (lower-quality model increases retries). Estimate total cost per 1K requests for both models using your production token distribution. Include fine-tuning amortisation if applicable. Budget for a 2–4 week parallel-run period where both models are active during canary/shadow testing — this is often the highest-cost phase of a migration.",
};

// ─── Risk-Level Notes ─────────────────────────────────────────────────────────

const RISK_GUIDANCE: Record<MigrationRisk, string> = {
	low: "Low migration risk: treat as a configuration change with a smoke test. Validate with a representative sample of production prompts (≥100 examples across your top use cases), compare output quality with a rubric or reference answers, confirm no API-signature changes require code modification, and deploy with a canary (5–10% traffic) for 24 hours before full rollout.",
	medium:
		"Medium migration risk: requires a structured migration plan. Steps: (1) build a parallel evaluation suite with production prompt samples and automated scoring; (2) identify all code changes required for API/format compatibility; (3) run shadow mode (new model receives all traffic but responses are not served) for ≥48 hours; (4) deploy canary at 10% and validate metrics against pre-migration baseline for ≥72 hours; (5) define rollback criteria and test the rollback procedure before cutover.",
	high: "High migration risk: treat as a major release. Create a formal compatibility matrix documenting every breaking change. Allocate dedicated testing capacity for: (1) regression testing of all top-10 use cases by volume; (2) edge case testing for known failure modes of the source model; (3) adversarial testing to identify new failure modes of the target model; (4) integration testing of all downstream consumers. Gate migration behind a steering group sign-off. Plan for a 2–4 week phased migration with explicit go/no-go checkpoints.",
};

// ─── Rollout Strategy Notes ───────────────────────────────────────────────────

const ROLLOUT_GUIDANCE: Record<RolloutStrategy, string> = {
	immediate:
		"Immediate cutover: only appropriate for low-risk migrations with fully validated compatibility. Pre-condition: smoke test + regression suite passes, rollback tested and takes < 5 minutes. Disadvantage: entire user base exposed to any undiscovered issues simultaneously. Mitigation: have the rollback script staged and a team member ready to execute within the first 30 minutes post-cutover.",
	canary:
		"Canary rollout: route a small traffic fraction (5–10%) to the new model while keeping the majority on the old model. Monitor canary-specific quality metrics (task completion rate, user ratings if available, error rate) against baseline for ≥24 hours before increasing the fraction. Increment in doublings: 10% → 20% → 50% → 100%, with a 24-hour soak at each stage. Canary is the recommended default for medium-risk migrations.",
	shadow:
		"Shadow mode: route 100% of traffic to both models but only serve responses from the old model. Log both responses for offline comparison. Shadow mode is the lowest-risk validation strategy — it cannot affect user experience. Use it for ≥48 hours to build a large comparison dataset before any live traffic is shifted. Limitation: shadow mode does not detect latency regressions that only manifest under production load because the shadow model's latency is not on the critical path.",
	"blue-green":
		"Blue-green deployment: maintain two complete environments (blue = current, green = new model). Switch traffic at the load balancer level. Advantage: rollback is a load-balancer change that takes seconds. Disadvantage: infrastructure cost is doubled during the transition period. Recommended for high-value, low-latency-tolerance workflows where rollback speed is critical. Ensure stateful components (conversation history, caches) are compatible with switching between environments mid-session.",
	phased:
		"Phased migration: migrate by use-case, user segment, or geographic region rather than by traffic fraction. Recommended when the new model has uneven quality across use cases — migrate the use cases where it outperforms first. Allows targeted rollback (only the migrated segment reverts) rather than a full rollback. Requires traffic routing logic that can identify request type and route to the appropriate model version.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const MODEL_COMPAT_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(context.window|token.limit|max.token|context.length|truncat|overflow|prompt.length)\b/i,
		detail:
			"Context-window assessment: measure p50, p90, and p99 of your production prompt lengths in tokens before migration. Use the target model's tokeniser — different models tokenise identically formatted text differently, so source-model token counts are not reliable estimates for the target. Identify which pipeline components contribute the most tokens (system prompt, retrieved context, conversation history) and which can be compressed or truncated without quality impact. A context-window reduction of 25% or more requires prompt architecture changes before migration.",
	},
	{
		pattern:
			/\b(regression|test|eval|benchmark|compare|quality.check|before.after|a\/b|a.b.test)\b/i,
		detail:
			"Migration regression testing: build a held-out evaluation set from production traffic (minimum 500 requests covering your top 10 use cases by volume) before starting migration. Score both models on this set using automated metrics (ROUGE, BERTScore, exact match, or task-specific rubrics) plus human evaluation for the top 3 use cases. Define a migration acceptance threshold (e.g., new model must be within 5% of baseline on all core metrics and must outperform on at least 2) before beginning the rollout.",
	},
	{
		pattern:
			/\b(rollback|revert|undo|fallback|abort.migration|cut.back|switch.back)\b/i,
		detail:
			"Rollback plan: document the rollback procedure before starting migration, not after discovering issues. A rollback plan must include: the trigger conditions (quality metric threshold, error rate threshold, user complaint rate), the exact steps to revert (code changes, configuration changes, infrastructure changes), the time estimate for rollback completion, and the person responsible for making the rollback decision. Test the rollback procedure in a non-production environment before the migration begins — rollback plans that have never been tested have a high failure rate under production incident conditions.",
	},
	{
		pattern:
			/\b(api|sdk|endpoint|client|parameter|schema|interface|contract)\b/i,
		detail:
			"API-signature audit: run a static analysis scan of your codebase to list all locations that reference model API calls (SDK constructors, request builders, response field accessors). For each call site, document whether the new model's SDK requires different parameter names, response field paths, or error-handling patterns. Build a compatibility shim layer that translates between your application's model-agnostic interface and the target model's SDK — this decouples the application code from future model migrations.",
	},
	{
		pattern:
			/\b(format|json|structure|schema|function.call|tool.use|function.calling|structured.output)\b/i,
		detail:
			"Structured-output compatibility: if your pipeline relies on function-calling, tool-use, or JSON-mode outputs, test the target model's structured-output adherence rate with your production tool schemas. Different models have different rates of schema non-compliance (extra fields, missing required fields, type mismatches). Implement a structured-output validation layer that catches schema violations and retries with a clarifying prompt before returning to the consumer — this is required for robustness regardless of model quality.",
	},
	{
		pattern:
			/\b(cost|pricing|token.price|expense|budget|cheaper|expensive|afford)\b/i,
		detail:
			"Cost migration analysis: model migrations often have non-obvious cost implications. Lower per-token pricing does not automatically reduce cost if the new model requires longer prompts for equivalent quality or has a lower first-token success rate (requiring more retries). Measure cost per successful task completion, not cost per API call. Build a cost simulation using production token distributions before committing to the migration.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const govModelCompatibilityHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Model Compatibility needs a description of the source and target models, the compatibility dimension of concern, or the migration scenario before it can produce targeted assessment guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;

		if (
			!hasModelCompatibilitySignal(combined) &&
			signals.complexity === "simple"
		) {
			return buildInsufficientSignalResult(
				context,
				"Model Compatibility targets assessment of fit between an AI model and an existing workflow when upgrading or switching models. Describe what is changing (model version, provider, context window, output format) and what workflow is affected to receive specific compatibility guidance.",
				"Mention the source and target model (or model version), the workflow or application affected, and the primary concern (output format, API changes, capability gaps, latency) so Model Compatibility can produce targeted assessment advice.",
			);
		}

		const guidances: string[] = MODEL_COMPAT_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail);

		const parsed = parseSkillInput(modelCompatibilityInputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (opts?.compatibilityDimension) {
			const dimNote =
				DIMENSION_GUIDANCE[
					opts.compatibilityDimension as CompatibilityDimension
				];
			if (dimNote) guidances.unshift(dimNote);
		}

		if (opts?.migrationRisk) {
			const riskNote = RISK_GUIDANCE[opts.migrationRisk as MigrationRisk];
			if (riskNote) guidances.push(riskNote);
		}

		if (opts?.rolloutStrategy) {
			const rolloutNote =
				ROLLOUT_GUIDANCE[opts.rolloutStrategy as RolloutStrategy];
			if (rolloutNote) guidances.push(rolloutNote);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To assess model compatibility: (1) define the compatibility dimensions that matter for your workflow (context-window, output-format, API-signature, capability, latency, cost); (2) measure your production request distribution against each dimension; (3) build a regression test suite from production traffic; (4) run the suite against both models; (5) define acceptance thresholds; (6) plan a canary rollout with rollback criteria.",
				"Compatibility assessment is a risk-management exercise — the goal is not to find zero differences but to understand which differences require mitigation and which are acceptable within your SLA and quality thresholds.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply model compatibility assessment under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints typically define the acceptable regression threshold, rollout timeline, and rollback SLA that the migration plan must satisfy.`,
			);
		}

		guidances.push(GOV_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Compatibility assessment matrix",
				["Measure", "Breakage signal", "Primary mitigation", "Go/no-go check"],
				[
					{
						label: "Context-window",
						values: [
							"p95 prompts near target limit",
							"compress prompts or trim retrieved context",
							"p95 under 80% of target window",
							"leave at least 20% headroom for peaks",
						],
					},
					{
						label: "Output-format",
						values: [
							"parse failures or schema drift",
							"schema validation + retry prompt",
							"structured-output pass rate at target threshold",
							"promote only after parse failures stay flat",
						],
					},
					{
						label: "API-signature",
						values: [
							"parameter or field-path mismatches",
							"compatibility shim layer",
							"all call sites mapped to the new signature",
							"block rollout until the shim is complete",
						],
					},
					{
						label: "Capability",
						values: [
							"missing tool-use / vision / code execution",
							"workflow redesign or alternate model",
							"required capability exists at acceptable quality",
							"treat missing capability as a hard blocker",
						],
					},
					{
						label: "Latency",
						values: [
							"p95/p99 exceeds SLA",
							"shadow or canary rollout with load testing",
							"latency stays within service threshold",
							"hold rollout if peak traffic breaks the SLA",
						],
					},
					{
						label: "Cost",
						values: [
							"cost per successful task rises materially",
							"reduce prompt size or change rollout scope",
							"budget fits parallel-run and steady-state cost",
							"approve only if parallel-run spend is covered",
						],
					},
				],
				"Summarises the dimensions that most often determine whether a model migration is safe to execute.",
			),
			buildOutputTemplateArtifact(
				"Migration readiness brief",
				`| Source model | Target model | Affected workflow | Key deltas | Acceptance threshold | Rollback trigger |
| --- | --- | --- | --- | --- | --- |`,
				[
					"Source model",
					"Target model",
					"Affected workflow",
					"Key deltas",
					"Acceptance threshold",
					"Rollback trigger",
				],
				"Use this brief to force a concrete comparison before any rollout decision is made.",
			),
			buildToolChainArtifact(
				"Compatibility validation chain",
				[
					{
						tool: "prompt inventory",
						description:
							"collect production prompts and their token distributions",
					},
					{
						tool: "signature audit",
						description: "map every SDK call and response field access",
					},
					{
						tool: "regression suite",
						description:
							"run structured tests against source and target models",
					},
					{
						tool: "shadow comparison",
						description:
							"compare outputs without exposing new-model responses to users",
					},
					{
						tool: "canary gate",
						description:
							"promote only if quality, latency, and cost remain within bounds",
					},
				],
				"Keep the assessment sequence explicit so rollback criteria and rollout gates stay aligned.",
			),
			buildWorkedExampleArtifact(
				"Structured-output migration example",
				{
					sourceModel: "gpt-4.1",
					targetModel: "gpt-4.1-mini",
					workflow: "invoice extraction to JSON",
					knownRisk: "schema adherence could drop on nested arrays",
				},
				{
					assessment: [
						"run 500 production examples through both models",
						"compare JSON parse failure rate and field-level accuracy",
						"introduce retry-on-schema-failure fallback if needed",
					],
					decision: "shadow first, then canary after pass-rate is stable",
				},
				"Shows how compatibility data should be turned into a rollout decision.",
			),
			buildEvalCriteriaArtifact(
				"Compatibility go/no-go criteria",
				[
					"Target model supports every capability required by the workflow.",
					"Schema adherence and parse-failure rates meet the acceptance threshold.",
					"Latency and cost stay within the published migration budget.",
					"Rollback steps are tested and time-bounded.",
					"Downstream code paths have been updated or wrapped by a shim.",
				],
				"Use these criteria to decide whether the migration can move from assessment to rollout.",
			),
		];

		return createCapabilityResult(
			context,
			`Model Compatibility produced ${guidances.length - 1} compatibility assessment guideline${guidances.length - 1 === 1 ? "" : "s"} for AI model migration planning. Results are advisory — validate compatibility findings against your production workload characteristics before executing migration.`,
			createFocusRecommendations(
				"Model compatibility guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	govModelCompatibilityHandler,
);
