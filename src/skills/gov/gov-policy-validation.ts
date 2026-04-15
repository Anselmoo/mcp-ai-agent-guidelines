/**
 * gov-policy-validation.ts
 *
 * Handwritten capability handler for the gov-policy-validation skill.
 *
 * Domain: Validating AI workflows and prompts against organisational,
 * regulatory, and compliance policies — policy-as-code, governance gates,
 * and compliance framework integration.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gov-prompt-injection-hardening — injection hardening (security threat model)
 *   gov-workflow-compliance        — end-to-end workflow compliance (broader scope)
 *   gov-regulated-workflow-design  — design patterns for regulated industries
 *   gov-model-governance           — model-specific governance decisions
 *
 * Outputs are ADVISORY ONLY — this handler does NOT execute policy checks,
 * block AI deployments, or certify regulatory compliance.
 */

import { z } from "zod";
import { gov_policy_validation_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	hasPolicyValidationSignal,
} from "./gov-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const policyValidationInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			policyType: z
				.enum(["organizational", "regulatory", "technical", "ethical"])
				.optional()
				.describe(
					"Type of policy being validated against. organizational: internal policies (acceptable use, data classification, approval workflows); regulatory: external legal requirements (GDPR, HIPAA, EU AI Act, CCPA); technical: system-level constraints (rate limits, allowed models, input size limits); ethical: responsible-AI guidelines (fairness, transparency, non-discrimination).",
				),
			validationDepth: z
				.enum(["surface", "structural", "behavioral"])
				.optional()
				.describe(
					"Depth of policy validation to perform. surface: check configuration and metadata against policy rules (fast, automated); structural: analyse workflow topology for policy compliance (prompt chain structure, data flow, access patterns); behavioral: evaluate model outputs against policy rules using test cases (thorough, requires evaluation infrastructure).",
				),
			complianceFramework: z
				.enum(["NIST-AI-RMF", "EU-AI-Act", "ISO-42001", "internal", "none"])
				.optional()
				.describe(
					"Compliance framework governing validation requirements. NIST-AI-RMF: NIST AI Risk Management Framework (Govern, Map, Measure, Manage); EU-AI-Act: EU Artificial Intelligence Act risk classification and obligations; ISO-42001: ISO/IEC 42001 AI management system standard; internal: organisation-specific policy framework; none: no formal framework, apply general best practices.",
				),
		})
		.optional(),
});

type PolicyType = "organizational" | "regulatory" | "technical" | "ethical";
type ValidationDepth = "surface" | "structural" | "behavioral";
type ComplianceFramework =
	| "NIST-AI-RMF"
	| "EU-AI-Act"
	| "ISO-42001"
	| "internal"
	| "none";

// ─── Compliance Framework Notes ───────────────────────────────────────────────

const FRAMEWORK_NOTES: Record<ComplianceFramework, string> = {
	"NIST-AI-RMF":
		"NIST AI Risk Management Framework context: the RMF is structured around four core functions — Govern (establish AI risk culture and accountability), Map (identify and categorise AI risks), Measure (analyse and assess risks), and Manage (treat, monitor, and respond to risks). For policy validation, focus on the Map function: document the AI system's context of use, potential impacts, and applicable policies. The RMF provides a voluntary framework — translate it into mandatory internal policies for specific risk categories. Use NIST AI RMF Playbook actions as a checklist for each validation gate.",
	"EU-AI-Act":
		"EU AI Act context: the Act classifies AI systems by risk level — unacceptable risk (prohibited), high risk (strict requirements), limited risk (transparency obligations), and minimal risk (no specific obligations). For policy validation: (1) classify your AI system's risk level using the Annex III high-risk categories and the prohibited use cases in Art. 5; (2) if high-risk, implement the mandatory requirements (conformity assessment, technical documentation, human oversight, accuracy/robustness/cybersecurity); (3) if limited risk, implement transparency requirements (disclose AI-generated content). All high-risk AI systems deployed in the EU require CE marking and registration in the EU AI database.",
	"ISO-42001":
		"ISO/IEC 42001 context: the first international standard for AI management systems (analogous to ISO 27001 for information security). The standard covers: AI policy (clause 5.2), AI risk assessment (clause 6.1), AI impact assessment (clause 6.1.4), AI system lifecycle (clause 8.2), and responsible AI objectives (Annex A). For policy validation, implement clause 8.4 (documentation of AI systems) and clause 9 (performance evaluation including AI-specific metrics). ISO 42001 certification requires a third-party audit — build your policy validation processes to produce the documentary evidence an auditor would require.",
	internal:
		"Internal policy framework: document your organisation's AI policies in a policy register before validation. Each policy should have: a policy ID, the assets/systems it applies to, the validation rule (machine-readable where possible), the validation frequency, the responsible team, and the escalation path for violations. Map internal policies to any applicable external frameworks to avoid duplication and ensure external obligations are covered. Version-control the policy register — policy changes should go through the same approval process as code changes.",
	none: "No formal compliance framework: apply the following universal baseline — (1) document what the AI system does and cannot do; (2) identify who is affected by its outputs; (3) assess potential harms and likelihood; (4) implement the minimum controls to reduce unacceptable risks; (5) establish a feedback mechanism to detect and remediate policy violations in production.",
};

// ─── Policy Type Guidance ─────────────────────────────────────────────────────

const POLICY_TYPE_GUIDANCE: Record<PolicyType, string> = {
	organizational:
		"Organisational policy validation: translate internal policies into machine-readable rules that can be evaluated automatically. For example, an 'approved models only' policy becomes a validation rule that checks the model ID against the approved-models registry. Implement policy-as-code using OPA (Open Policy Agent) or a similar policy engine — policies expressed in code are versioned, testable, and auditable. Automate validation in the CI/CD pipeline: block deployment if any policy rule fails, with an explicit override mechanism for legitimate exceptions (override requires approval and is logged).",
	regulatory:
		"Regulatory policy validation: map each regulatory requirement to a specific technical control. For example, GDPR Art. 22 (automated decision-making) maps to a human-review gate for high-stakes AI decisions. Build a regulatory obligation register that links each requirement to its technical implementation, the team responsible, and the evidence produced. Conduct gap analysis quarterly — regulatory requirements change and technical implementations drift. Engage legal counsel before certifying regulatory compliance — this guidance is educational, not legal advice.",
	technical:
		"Technical policy validation: validate configuration parameters against technical constraints before deployment. Common technical policies: maximum context window size, maximum output token budget, allowed models per environment, rate limits per service account, input size limits per endpoint, and required request/response headers. Implement technical policy validation as infrastructure-as-code linting — catch violations at deployment time, not runtime. Document every technical policy exception with its business justification and expiry date.",
	ethical:
		"Ethical policy validation: responsible-AI principles (fairness, transparency, non-discrimination, human oversight) are harder to validate automatically than technical policies. Build a structured ethical review process: (1) define the population affected by the AI system; (2) assess potential disparate impacts across demographic groups; (3) test outputs for stereotyping, bias, and toxic content; (4) document the intended use case and prohibited use cases; (5) establish a human escalation path for edge cases. Ethical reviews should involve diverse reviewers — a single-team ethical review has significant blind spots.",
};

// ─── Validation Depth Notes ───────────────────────────────────────────────────

const VALIDATION_DEPTH_GUIDANCE: Record<ValidationDepth, string> = {
	surface:
		"Surface validation: automated checks against configuration and metadata. Examples: model ID in approved list, context window within limit, input schema valid, required headers present, data-classification tags present. Suitable as a fast gate in CI/CD pipelines — runs in seconds and catches the majority of simple policy violations. Limitation: cannot detect behavioural policy violations (e.g., a prompt that technically passes structure checks but produces outputs that violate content policy).",
	structural:
		"Structural validation: analyse the workflow topology for policy compliance patterns. Examples: verify that a human-review node exists before high-stakes outputs are served; verify that PII fields pass through the data-guardrail stage before reaching the model; verify that audit logging is wired to every decision node; verify that rate-limiting is applied at the correct boundary. Use a workflow-as-code representation to make structural validation automatable — a DAG-based workflow description can be analysed statically without running the workflow.",
	behavioral:
		"Behavioral validation: evaluate actual model outputs against policy rules using a test suite. Examples: run a content-policy test suite (adversarial prompts designed to elicit policy violations) and measure the violation rate; evaluate outputs for PII leakage using the same detection pipeline as the input guardrail; test human-override gates by simulating high-stakes decisions and verifying the escalation path triggers. Behavioral validation requires an evaluation infrastructure and a representative test suite — invest in building this before deploying to production at scale.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const POLICY_VALIDATION_RULES: ReadonlyArray<{
	pattern: RegExp;
	detail: string;
}> = [
	{
		pattern:
			/\b(policy.as.code|opa|open.policy.agent|rego|policy.engine|machine.readable.policy)\b/i,
		detail:
			"Policy-as-code implementation: express policies as executable rules rather than natural-language documents. OPA (Open Policy Agent) with the Rego policy language is the most widely adopted approach for AI system policy validation. Structure Rego rules to match your policy hierarchy: data.policy.organisation.approved_models, data.policy.regulatory.gdpr, etc. Write unit tests for every policy rule using OPA's rego test framework — untested policy code has the same defect rate as untested application code. Integrate OPA into the CI/CD pipeline as a decision point: the policy bundle is versioned alongside application code.",
	},
	{
		pattern:
			/\b(gate|approval.gate|compliance.gate|human.review|mandatory.check|pre.deploy|sign.off)\b/i,
		detail:
			"Governance gate design: define the entry and exit criteria for each governance gate explicitly. A gate with vague criteria will be rubber-stamped or bypassed. For a pre-deployment compliance gate: entry criteria = all automated tests pass, risk assessment completed; exit criteria = compliance review signed off, monitoring baseline established, rollback plan approved. Log every gate decision (pass or fail) with the reviewer identity, timestamp, and the specific items reviewed. Implement gate override with mandatory escalation — a gate that cannot be overridden in emergencies becomes an obstacle in incidents.",
	},
	{
		pattern:
			/\b(risk.assessment|risk.register|risk.classif|ai.risk|harm|impact.assess|threat.model)\b/i,
		detail:
			"AI risk assessment for policy validation: use a structured risk assessment framework rather than ad-hoc judgment. Document: (1) the AI system's capability and the use case; (2) the population affected (size, vulnerability, power differential); (3) potential harms and their likelihood (use a 5×5 severity × likelihood matrix); (4) existing controls and their effectiveness; (5) residual risk and whether it is within the organisation's risk appetite. Update the risk assessment when the model, training data, or use case changes — risk assessments are not one-time artefacts.",
	},
	{
		pattern:
			/\b(audit.trail|evidence|compliance.report|audit.log|compliance.record|artefact)\b/i,
		detail:
			"Compliance evidence collection: define what evidence each policy validation produces and how it is stored. For regulatory compliance, evidence must be: tamper-evident (hash-chained or stored in an append-only system), attributable (linked to the policy version and the AI system version), and retained for the required period (varies by regulation: GDPR = duration of processing + statute of limitations; HIPAA = 6 years; EU AI Act = 10 years for high-risk systems). Build evidence collection into the validation pipeline — evidence collected retroactively during an audit is fragile and often incomplete.",
	},
	{
		pattern:
			/\b(continuous|automat|pipeline|cicd|ci\/cd|devops|shift.left|pre.commit|pre.deploy)\b/i,
		detail:
			"Continuous policy validation: shift policy checks left in the development lifecycle — validate in the IDE (linting), pre-commit hooks, CI/CD pipeline, and staging environment before production. Each stage is faster and cheaper to fix than the next. Define policy validation as a first-class step in the deployment pipeline with a mandatory pass/fail outcome — do not allow policy validation to be a manual, advisory step that can be skipped under deadline pressure.",
	},
	{
		pattern:
			/\b(exception|waiver|bypass|override|variance|deviation|exemption)\b/i,
		detail:
			"Policy exception management: every governance process requires a documented path for legitimate exceptions. Define the exception process: who can request an exception, who approves it, what documentation is required, how long the exception is valid, and how compliance is restored after the exception period. Maintain an exception register — a pattern of repeated exceptions for the same policy indicates the policy itself needs revision. Treat an unregistered exception (a team working around policy without formal approval) as a governance incident.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const govPolicyValidationHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Policy Validation needs a description of the AI workflow, the policy type, or the compliance framework before it can produce targeted validation guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;

		if (
			!hasPolicyValidationSignal(combined) &&
			signals.complexity === "simple"
		) {
			return buildInsufficientSignalResult(
				context,
				"Policy Validation targets validation of AI workflows and prompts against organisational, regulatory, and compliance policies. Describe the AI system, the policies it must comply with, and the validation approach to receive specific guidance.",
				"Mention the AI workflow or system, the applicable policy type (organisational, regulatory, technical, ethical), and any compliance framework (NIST AI RMF, EU AI Act, ISO 42001) so Policy Validation can produce targeted validation advice.",
			);
		}

		const guidances: string[] = POLICY_VALIDATION_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail);

		const parsed = parseSkillInput(policyValidationInputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (opts?.complianceFramework && opts.complianceFramework !== "none") {
			const fwNote =
				FRAMEWORK_NOTES[opts.complianceFramework as ComplianceFramework];
			if (fwNote) guidances.unshift(fwNote);
		}

		if (opts?.policyType) {
			const typeNote = POLICY_TYPE_GUIDANCE[opts.policyType as PolicyType];
			if (typeNote) guidances.unshift(typeNote);
		}

		if (opts?.validationDepth) {
			const depthNote =
				VALIDATION_DEPTH_GUIDANCE[opts.validationDepth as ValidationDepth];
			if (depthNote) guidances.push(depthNote);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To implement policy validation for an AI workflow: (1) enumerate all applicable policies (organisational, regulatory, technical, ethical); (2) translate each policy into a machine-readable validation rule; (3) implement surface, structural, and behavioral validation at the appropriate pipeline stages; (4) log all validation results as compliance evidence; (5) establish an exception management process.",
				"Policy validation is most effective when integrated into the deployment pipeline — policies checked only at design time will drift from the deployed system. Automate what you can; reserve human review for judgment-intensive policy evaluation.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply policy validation under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints typically define the required validation depth, the policies that are mandatory vs. advisory, and the evidence retention period for regulatory compliance.`,
			);
		}

		guidances.push(GOV_ADVISORY_DISCLAIMER);

		return createCapabilityResult(
			context,
			`Policy Validation produced ${guidances.length - 1} validation guideline${guidances.length - 1 === 1 ? "" : "s"} for ensuring AI workflow compliance with organisational and regulatory policies. Results are advisory — engage legal and compliance counsel before certifying regulatory obligations.`,
			createFocusRecommendations(
				"Policy validation guidance",
				guidances,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Policy validation approach matrix",
					[
						"Approach",
						"Automation",
						"Auditability",
						"Best for",
						"Key limitation",
					],
					[
						{
							label: "OPA/Rego",
							values: [
								"High — machine-evaluated",
								"Full — structured decision log",
								"Regulated environments, deployment gates",
								"Requires Rego expertise; low readability for non-engineers",
							],
						},
						{
							label: "JSON Schema",
							values: [
								"High — schema-validated",
								"Moderate — validation report",
								"Config compliance, API contracts",
								"Cannot express behavioural or semantic policies",
							],
						},
						{
							label: "CI pipeline gate",
							values: [
								"Moderate — automated on push",
								"Good — CI log",
								"Pre-deployment checks, shift-left compliance",
								"Does not catch runtime policy drift",
							],
						},
						{
							label: "Manual review",
							values: [
								"Low — human-gated",
								"Low — depends on documentation",
								"Novel policies, edge cases",
								"Not scalable; inconsistent across reviewers",
							],
						},
					],
					"Select the approach based on automation needs, auditability requirements, and policy complexity.",
				),
				buildWorkedExampleArtifact(
					"Policy-as-code validation example",
					{
						policy: "approved models only",
						workflow: "model-selection gate before deployment",
						evidence: ["model registry entry", "deployment approval log"],
					},
					{
						regoRule:
							'deny[msg] { not approved_models[input.model_id]; msg := "model is not approved" }',
						testCases: [
							{ modelId: "approved-model-v2", result: "allow" },
							{ modelId: "experimental-model", result: "deny" },
						],
						gateOutcome: "block deployment until policy exception is approved",
					},
					"Shows how a natural-language policy becomes a machine-checkable validation rule.",
				),
				buildOutputTemplateArtifact(
					"Governance gate register",
					`| Gate | Entry criteria | Exit criteria | Reviewer | Evidence | Override path |
| --- | --- | --- | --- | --- | --- |`,
					[
						"Gate",
						"Entry criteria",
						"Exit criteria",
						"Reviewer",
						"Evidence",
						"Override path",
					],
					"Use this table to make policy-validation checkpoints explicit and auditable.",
				),
				buildToolChainArtifact(
					"Policy-as-code validation workflow",
					[
						{
							tool: "define-policy",
							description:
								"express the governance rule in natural language, then translate it to a machine-checkable form (Rego, schema, assertion)",
						},
						{
							tool: "integrate-gate",
							description:
								"add the policy check to the CI/CD pipeline or deployment approval step with a mandatory pass/fail outcome",
						},
						{
							tool: "test-policy",
							description:
								"write positive and negative test cases — at minimum one allow case and one deny case per policy rule",
						},
						{
							tool: "audit-trail",
							description:
								"log every policy evaluation result with the input, decision, and reviewer identity for regulatory evidence",
						},
						{
							tool: "review-drift",
							description:
								"schedule periodic review of policy rules against current regulations and organisational risk appetite",
						},
					],
					"Use this workflow to shift policy validation left and make compliance evidence continuous.",
				),
				buildEvalCriteriaArtifact(
					"Policy validation acceptance criteria",
					[
						"Every governance gate has an explicit entry criterion, exit criterion, and override path.",
						"Policy rules are expressed in a machine-checkable form with at least one allow and one deny test case.",
						"Policy validation is integrated into CI/CD or a deployment gate — not a manual, skippable step.",
						"Every policy evaluation generates an auditable decision record with input, decision, and reviewer identity.",
						"Policy guidance is advisory — engage legal and compliance counsel before certifying regulatory obligations.",
					],
					"Use these criteria to confirm that policy validation infrastructure is audit-ready.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	govPolicyValidationHandler,
);
