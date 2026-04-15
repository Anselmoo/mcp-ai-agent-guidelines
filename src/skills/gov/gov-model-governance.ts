/**
 * gov-model-governance.ts
 *
 * Handwritten capability handler for the gov-model-governance skill.
 *
 * Domain: Governing model selection, version pinning, lifecycle management,
 * and deployment policy for AI systems in production.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gov-model-compatibility       — compatibility assessment when switching models
 *   gov-workflow-compliance       — full workflow compliance validation
 *   gov-policy-validation         — policy-as-code and regulatory gate checks
 *   eval-prompt-bench             — benchmark performance evaluation
 *
 * Outputs are ADVISORY ONLY — this handler does NOT enforce governance policies,
 * modify model registries, or execute deployment decisions.
 */

import { z } from "zod";
import { gov_model_governance_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildNamedRecommendations,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	GOV_ADVISORY_DISCLAIMER,
	hasModelGovernanceSignal,
} from "./gov-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const modelGovernanceInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			lifecycleStage: z
				.enum([
					"selection",
					"pinning",
					"deployment",
					"monitoring",
					"deprecation",
					"rollback",
				])
				.optional()
				.describe(
					"Current model lifecycle stage requiring governance guidance. selection: evaluating and choosing a model for a new use case; pinning: locking a specific model version for reproducibility; deployment: promoting a model to a production environment; monitoring: ongoing performance and compliance monitoring of a deployed model; deprecation: retiring an older model version; rollback: reverting to a previous model version following an incident.",
				),
			deploymentEnvironment: z
				.enum(["development", "staging", "production"])
				.optional()
				.describe(
					"Target deployment environment. Controls the strictness of governance gates: development uses lightweight checks; staging requires integration tests and policy validation; production requires full approval workflow and rollback plan.",
				),
			versionStrategy: z
				.enum(["exact-pin", "minor-float", "major-lock"])
				.optional()
				.describe(
					"Model version pinning strategy. exact-pin: fix the exact model version string (maximum reproducibility, requires manual update for improvements); minor-float: allow minor version updates within a major version (balances stability with automatic improvements); major-lock: allow all minor/patch updates within a major version (highest automation, lowest reproducibility).",
				),
		})
		.optional(),
});

type LifecycleStage =
	| "selection"
	| "pinning"
	| "deployment"
	| "monitoring"
	| "deprecation"
	| "rollback";
type DeploymentEnvironment = "development" | "staging" | "production";
type VersionStrategy = "exact-pin" | "minor-float" | "major-lock";

// ─── Lifecycle Stage Guidance ─────────────────────────────────────────────────

const LIFECYCLE_GUIDANCE: Record<LifecycleStage, string> = {
	selection:
		"Model selection governance: document the selection decision as an Architecture Decision Record (ADR) that captures: candidate models evaluated, evaluation criteria and weights, benchmark results per criterion, risk assessment (vendor lock-in, deprecation timeline, data-residency), and the approved model with rationale for rejection of alternatives. Require ADR sign-off from security, compliance, and the owning engineering team before the selected model can be provisioned in any shared environment. Maintain a model catalog that records approved models, their use-case scope, and any restrictions (e.g., 'approved for internal tools, not for customer-facing outputs').",
	pinning:
		"Version pinning governance: pin the exact model version string in all configuration files, infrastructure-as-code templates, and CI/CD pipelines — never reference a 'latest' or 'recommended' alias in production. Store pinned versions in a version manifest file that is committed to source control, reviewed in pull requests, and triggers a regression test run when changed. Automate version-pin drift detection: a scheduled job that compares the deployed version against the pinned version and alerts when they diverge (which can happen if the provider's alias mapping changes).",
	deployment:
		"Model deployment governance: gate production deployments behind a multi-stage approval workflow: (1) automated regression tests pass on the deployment candidate; (2) security review confirms no new data-handling risks; (3) compliance review confirms no new regulatory exposure; (4) designated approver (tech lead or model owner) provides explicit sign-off. Log every deployment event with the approver identity, test results, and the specific model version being deployed. Use immutable deployment records — never overwrite a deployment record even if the deployment is later rolled back.",
	monitoring:
		"Deployed model monitoring governance: define a monitoring SLA before deployment — you should know what you are measuring, at what frequency, and what thresholds trigger alerts. Core metrics: task success rate (use-case specific), output quality score (automated rubric or human evaluation sample), policy violation rate (outputs that fail content policy checks), latency p95, and error rate. Alert on statistical drift from baseline, not just on threshold breaches — a 10% quality decline over two weeks is more concerning than a single outlier spike.",
	deprecation:
		"Model deprecation governance: publish a deprecation timeline at least 60 days before end-of-life for any model version in use by internal consumers. The deprecation notice must include: the specific model version being deprecated, the recommended successor version, a migration guide, and the hard deprecation date after which the version is no longer available. For external-facing systems, the 60-day window may need to be longer based on customer contract SLAs. Maintain a deprecation registry so that all consumers of a deprecated model are notified and their migration status is tracked.",
	rollback:
		"Model rollback governance: a rollback is a production deployment event and must follow the same governance controls as a forward deployment. Rollbacks require: explicit documentation of the triggering incident, the rollback decision owner, the time-to-recovery target, and a post-incident review (PIR) scheduled within 5 business days. After rollback, the forward deployment candidate is quarantined pending root-cause analysis — it cannot be re-deployed without addressing the root cause and re-passing all regression tests.",
};

// ─── Version Strategy Notes ───────────────────────────────────────────────────

const VERSION_STRATEGY_GUIDANCE: Record<VersionStrategy, string> = {
	"exact-pin":
		"Exact-pin strategy: maximum reproducibility and auditability — every deployment uses a provably identical model. Requires a manual process to update the pin when the provider releases improvements. Implement pin-update as a pull request with mandatory regression-test gate: the update PR must include test results comparing the old and new versions before merge. Best for: regulated environments, safety-critical use cases, systems where output reproducibility is a compliance requirement.",
	"minor-float":
		"Minor-float strategy: balances stability with automatic improvements. Define what constitutes a 'minor' version for your provider (providers vary in their versioning semantics). Add automated regression tests that run on every CI/CD pipeline run and gate deployment if quality regresses below the acceptance threshold — this is the safety net that makes minor-float viable. Best for: general-purpose production systems where slight quality improvements are acceptable but breaking changes are not.",
	"major-lock":
		"Major-lock strategy: allows providers to ship improvements freely within a major version. Requires the strongest automated regression coverage because changes may be frequent and unexpected. Log every version change (even automatic ones) in an immutable audit log so that quality regressions can be correlated with the version that introduced them. Not recommended for regulated environments without explicit sign-off from compliance, as uncontrolled version changes may introduce new regulatory risks.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const MODEL_GOV_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(registry|catalog|inventory|approved.list|allowlist|permitted.model|model.store)\b/i,
		detail:
			"Model registry design: a model registry is the single source of truth for approved models in your organisation. Each registry entry should include: canonical model ID, provider, version pinning strategy, approved use-case scope, data-classification ceiling (e.g., 'approved for internal data, not approved for PII'), approved environments, expiry date for the approval (forced re-evaluation trigger), and the approving authority. Gate all model provisioning requests against the registry — any model not in the registry must go through the selection and approval process before use.",
	},
	{
		pattern:
			/\b(access.control|permission|who.can|authoriz|rbac|least.privilege)\b/i,
		detail:
			"Model access control: not all users or services should have access to all models. Implement role-based access control at the model API layer: a 'model-consumer' role grants read-only inference access; a 'model-admin' role grants version-pinning and configuration changes; a 'model-governance' role grants approval authority for new models. Audit model API calls against the caller's approved role — log any access attempt that falls outside approved use-case scope for governance review.",
	},
	{
		pattern:
			/\b(audit|log|record|trace|evidence|history|changelog|immutable)\b/i,
		detail:
			"Model governance audit trail: maintain an immutable log of all model governance events: model approvals, version pin changes, deployment promotions, rollbacks, deprecation notices, and access control changes. Each log entry must include: timestamp, event type, model ID and version, actor (human or service account), approval chain (for deployment events), and a cryptographic hash of the configuration snapshot. The audit trail is the primary artefact for regulatory inspection and incident investigation — ensure it cannot be modified or deleted by any operational role.",
	},
	{
		pattern:
			/\b(deprecat|sunset|end.of.life|eol|retire|phase.out|end.of.support)\b/i,
		detail:
			"Deprecation planning: build a deprecation radar — a scheduled review (quarterly recommended) that checks every deployed model against the provider's roadmap and flags models within 90 days of end-of-life. Assign a model owner for every deployed model who is responsible for initiating the migration before end-of-life. Treat a missed deprecation deadline (model still in use after provider end-of-life) as a governance incident requiring a post-incident review.",
	},
	{
		pattern: /\b(fine.tun|custom.model|adapt|finetune|rlhf|instruction.tun)\b/i,
		detail:
			"Fine-tuned model governance: custom models introduce additional governance requirements beyond base-model governance. Each fine-tuned model must have: a training data audit (provenance, consent, bias evaluation), a safety evaluation against the same benchmarks as the base model, a version history that tracks training data versions alongside model weights, and a re-evaluation trigger when the training data distribution shifts. Fine-tuned models must not be shared across teams without the same approval process as base models — a model fine-tuned on one team's data may leak that data to another team's prompts.",
	},
	{
		pattern: /\b(sla|slo|uptime|availability|provider|vendor|contract|tier)\b/i,
		detail:
			"Provider SLA alignment: document the provider's SLA for each model in use and map it against your application's availability requirements. If your application requires 99.9% uptime but the provider's SLA is 99.5%, you need either a multi-provider fallback strategy or a contractual upgrade. Track provider SLA breaches in your incident log — repeated breaches may trigger a model selection review. Include provider deprecation and version lifecycle policies in the vendor risk assessment.",
	},
];

// ─── Title Extractor ─────────────────────────────────────────────────────────

/**
 * Extracts a concise recommendation title from the "Concept name: prose..."
 * convention used throughout the governance guidance strings in this file.
 * Falls back to fixed labels for the advisory disclaimer and fallback items.
 */
function govGuidanceTitle(detail: string): string {
	if (detail.startsWith("This analysis is advisory")) return "Advisory scope";
	if (detail.startsWith("To establish model governance"))
		return "Getting started";
	if (detail.startsWith("Model governance scales")) return "Governance scaling";
	if (detail.startsWith("Apply model governance under"))
		return "Constraint-specific guidance";
	const colonIdx = detail.indexOf(": ");
	return colonIdx > 0 ? detail.slice(0, colonIdx) : "Governance guidance";
}

// ─── Handler ──────────────────────────────────────────────────────────────────

const govModelGovernanceHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Model Governance needs a description of the governance concern (version pinning, deployment policy, lifecycle stage, or access control) before it can produce targeted guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;

		if (
			!hasModelGovernanceSignal(combined) &&
			signals.complexity === "simple"
		) {
			return buildInsufficientSignalResult(
				context,
				"Model Governance targets version pinning, lifecycle management, and deployment policy for AI models. Describe the lifecycle stage (selection, pinning, deployment, monitoring, deprecation), the deployment environment, and the governance concern to receive specific guidance.",
				"Mention the lifecycle stage of the model (e.g., selecting a new model, pinning a version, monitoring a deployed model, planning deprecation) and any specific governance constraint so Model Governance can produce targeted policy advice.",
			);
		}

		const guidances: string[] = MODEL_GOV_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail);

		const parsed = parseSkillInput(modelGovernanceInputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (opts?.lifecycleStage) {
			const stageNote =
				LIFECYCLE_GUIDANCE[opts.lifecycleStage as LifecycleStage];
			if (stageNote) guidances.unshift(stageNote);
		}

		if (opts?.deploymentEnvironment) {
			const envNotes: Record<DeploymentEnvironment, string> = {
				development:
					"Development environment: governance is lightweight — use a model registry entry as a reference but do not require full approval workflows for experimental model changes. Focus on developer ergonomics: make it easy to iterate on model selection while logging which models are evaluated so that the eventual production selection is informed by documented experimentation.",
				staging:
					"Staging environment: governance requirements mirror production but approvals are lighter — a single reviewer sign-off is sufficient (vs. a full approval board for production). Staging must use the same version-pinning and access-control policies as production so that governance mismatches are caught before cutover. Staging deployments must run the full regression test suite.",
				production:
					"Production environment: apply the full governance stack — model registry approval, multi-stage deployment workflow, compliance sign-off, rollback plan, monitoring baseline established before deployment. Any production model change (including version-pin update) is a deployment event and must be logged, approved, and reversible within the rollback SLA.",
			};
			const envNote =
				envNotes[opts.deploymentEnvironment as DeploymentEnvironment];
			if (envNote) guidances.push(envNote);
		}

		if (opts?.versionStrategy) {
			const vsNote =
				VERSION_STRATEGY_GUIDANCE[opts.versionStrategy as VersionStrategy];
			if (vsNote) guidances.push(vsNote);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To establish model governance: (1) create a model registry with approved models, use-case scope, and version pinning strategy; (2) implement access controls on model API calls; (3) build a deployment workflow with automated regression gates and approval sign-off; (4) establish monitoring baselines before each production deployment; (5) maintain an immutable audit trail of all governance events.",
				"Model governance scales with organisational size — start with a lightweight registry and approval process and add complexity as the number of models and use cases grows. A governance process that teams work around is worse than a lighter process that teams follow.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply model governance under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints typically define the approval authority structure, deployment frequency limits, and regulatory audit requirements that the governance process must satisfy.`,
			);
		}

		guidances.push(GOV_ADVISORY_DISCLAIMER);

		// --- Machine-readable artifacts ---
		const artifacts = [
			// Comparison matrix for version pinning strategies
			buildComparisonMatrixArtifact(
				"Model Version Pinning Strategies",
				[
					"Strategy",
					"Reproducibility",
					"Automation",
					"Best For",
					"Governance Requirements",
				],
				[
					{
						label: "Exact-pin",
						values: [
							"Maximum",
							"Manual",
							"Regulated, safety-critical, compliance-required",
							"Manual pin update, regression test PR, audit log, approval chain",
						],
					},
					{
						label: "Minor-float",
						values: [
							"Moderate",
							"Automatic minor updates",
							"General production, moderate risk tolerance",
							"Automated regression tests, acceptance threshold, audit log",
						],
					},
					{
						label: "Major-lock",
						values: [
							"Lowest",
							"Automatic all minor/patch",
							"High automation, not for regulated environments",
							"Strong regression coverage, immutable audit log, compliance sign-off",
						],
					},
				],
				"Compares model version pinning strategies for governance, automation, and compliance.",
			),
			// Worked example for a model registry entry
			buildWorkedExampleArtifact(
				"Model Registry Entry Example",
				{
					modelId: "gpt-4.1",
					provider: "OpenAI",
					version: "4.1.2",
					versionStrategy: "exact-pin",
					approvedUseCase: "Internal knowledge base QA",
					dataClassification: "Internal",
					approvedEnvironments: ["development", "staging", "production"],
					expiryDate: "2025-12-31",
					approvingAuthority: "AI Governance Board",
				},
				"A sample entry for a model registry, showing required governance fields.",
			),
			// Output template for a model version policy entry
			buildOutputTemplateArtifact(
				"Model governance policy template",
				`{
  "modelId": "<provider>/<model-name>",
  "version": "<exact-version|major.minor.*|major.*>",
  "versionStrategy": "<exact-pin|minor-float|major-lock>",
  "approvedEnvironments": ["<development|staging|production>"],
  "approvedUseCases": ["<use-case-description>"],
  "dataClassification": "<public|internal|confidential|restricted>",
  "approvalChain": [{"role": "<role>", "status": "<pending|approved>"}],
  "expiryDate": "<YYYY-MM-DD>",
  "rollbackModel": "<fallback-model-version>",
  "auditTrail": [{"action": "<action>", "actor": "<actor>", "timestamp": "<ISO8601>"}]
}`,
				[
					"modelId",
					"version",
					"versionStrategy",
					"approvedEnvironments",
					"approvalChain",
					"expiryDate",
					"rollbackModel",
					"auditTrail",
				],
				"Use this template for each registry entry so governance fields are enforced consistently.",
			),
			// Tool chain for the full lifecycle
			buildToolChainArtifact(
				"Model governance lifecycle",
				[
					{
						tool: "select",
						description:
							"evaluate candidate models against approved-use criteria and data-classification requirements",
					},
					{
						tool: "pin",
						description:
							"record the exact model version, approval chain, and expiry date in the registry",
					},
					{
						tool: "deploy",
						description:
							"promote model through environments with mandatory policy-gate sign-off at each stage",
					},
					{
						tool: "monitor",
						description:
							"track output quality, latency, and compliance signals against registered thresholds",
					},
					{
						tool: "deprecate-or-rollback",
						description:
							"execute the documented rollback path or retire the model version when expiry is reached or a quality gate fails",
					},
				],
				"Follow this lifecycle to maintain audit continuity from selection through retirement.",
			),
			// Acceptance criteria for a minimally viable governance setup
			buildEvalCriteriaArtifact(
				"Model governance acceptance criteria",
				[
					"Every deployed model has an exact version pinned in the registry with a named approval authority.",
					"Each registry entry specifies an expiry date and a documented rollback model.",
					"Deployment to production requires a complete approval chain with no pending signatures.",
					"Audit log entries exist for every lifecycle transition: selection, pinning, promotion, and deprecation.",
					"Governance guidance is advisory — validate the registry policy against your organisation's risk tolerance before enforcing.",
				],
				"Use these criteria to determine whether a model governance setup is minimally viable for production.",
			),
		];

		return createCapabilityResult(
			context,
			`Model Governance produced ${guidances.length - 1} governance guideline${guidances.length - 1 === 1 ? "" : "s"} for model lifecycle management and deployment policy. Results are advisory — validate governance processes against your organisation's risk appetite and regulatory obligations before implementation.`,
			buildNamedRecommendations(
				guidances.map((detail) => ({
					title: govGuidanceTitle(detail),
					detail,
				})),
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	govModelGovernanceHandler,
);
