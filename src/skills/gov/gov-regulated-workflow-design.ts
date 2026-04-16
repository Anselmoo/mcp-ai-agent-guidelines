/**
 * gov-regulated-workflow-design.ts
 *
 * Handwritten capability handler for the gov-regulated-workflow-design skill.
 *
 * Domain: Designing AI workflows for regulated industries — auditability,
 * approval gates, compliance trails, human-in-the-loop checkpoints, and
 * traceability requirements for healthcare, finance, legal, and government.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gov-policy-validation         — policy validation against a defined policy set
 *   gov-data-guardrails           — data-layer PII/sensitive-data protection
 *   gov-workflow-compliance       — post-design compliance validation
 *   gov-model-governance          — model selection and deployment policy
 *
 * Outputs are ADVISORY ONLY — this handler does NOT certify regulatory
 * compliance, approve deployment to regulated environments, or provide legal advice.
 */

import { z } from "zod";
import { gov_regulated_workflow_design_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	hasRegulatedWorkflowDesignSignal,
} from "./gov-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const regulatedWorkflowDesignInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			regulatedIndustry: z
				.enum([
					"healthcare",
					"finance",
					"legal",
					"government",
					"education",
					"general",
				])
				.optional()
				.describe(
					"Regulated industry context. healthcare: clinical decision support, EHR integration, medical devices (FDA, HIPAA); finance: trading, lending, fraud detection (FINRA, SEC, FCA, Basel III); legal: contract analysis, legal advice, e-discovery (bar regulations, legal privilege); government: public-sector AI (EU AI Act, government ethics frameworks); education: student assessment, adaptive learning (FERPA, COPPA); general: cross-industry regulated context.",
				),
			approvalGateType: z
				.enum([
					"human-in-loop",
					"automated-check",
					"dual-approval",
					"audit-only",
				])
				.optional()
				.describe(
					"Type of approval gate required. human-in-loop: a human reviewer must approve AI outputs before action; automated-check: automated policy validation gate (no human required); dual-approval: two independent approvers required (four-eyes principle); audit-only: no approval gate, but every decision is logged for audit.",
				),
			auditLevel: z
				.enum(["basic", "detailed", "forensic"])
				.optional()
				.describe(
					"Required depth of audit logging. basic: log decision inputs, outputs, and timestamps; detailed: log decision rationale, model version, confidence scores, and all context; forensic: immutable, tamper-evident log of every step including intermediate reasoning, data lineage, and full context window (required for high-stakes regulated decisions).",
				),
		})
		.optional(),
});

type RegulatedIndustry =
	| "healthcare"
	| "finance"
	| "legal"
	| "government"
	| "education"
	| "general";
type ApprovalGateType =
	| "human-in-loop"
	| "automated-check"
	| "dual-approval"
	| "audit-only";
type AuditLevel = "basic" | "detailed" | "forensic";

// ─── Industry-Specific Guidance ───────────────────────────────────────────────

const INDUSTRY_GUIDANCE: Record<RegulatedIndustry, string> = {
	healthcare:
		"Healthcare AI workflow design: clinical AI systems are subject to FDA Software as a Medical Device (SaMD) guidance and HIPAA. For diagnostic or treatment decision support: (1) classify the SaMD under the FDA's risk-based framework (Class I/II/III) before designing the workflow; (2) implement a human-in-the-loop gate for all clinical recommendations — the clinician must explicitly accept or override AI suggestions, and both choices are logged; (3) design for explainability: clinicians must be able to understand why the AI made a recommendation, not just what it recommended; (4) build a systematic failure mode tracking process — unexpected AI behaviours in clinical settings must be reported and investigated under the same process as medical device failures.",
	finance:
		"Finance AI workflow design: AI in financial services must comply with model risk management guidance (e.g., SR 11-7 in the US, SS1/23 in the UK). For credit, fraud, or trading decisions: (1) document the model purpose, intended use, limitations, and performance metrics in a Model Documentation artefact; (2) implement independent model validation before production deployment — the team that built the model cannot be the team that validates it; (3) build adverse action explanation into the workflow for any decision that negatively affects a customer (required by ECOA/Reg B in the US, GDPR Art. 22 in the EU); (4) design explainable output: regulators require the ability to explain why specific decisions were made to auditors and affected individuals.",
	legal:
		"Legal AI workflow design: AI in legal contexts (contract analysis, legal research, e-discovery) operates under bar-association ethical rules and, in some jurisdictions, UPL (Unauthorised Practice of Law) restrictions. Design principles: (1) AI outputs are drafts for attorney review, not authoritative legal conclusions — the workflow must enforce human review before any legal document is finalised or any legal position is taken; (2) build privilege-preservation into the workflow: AI-processed documents that are attorney-client privileged must not leave privilege-protected channels; (3) implement a citations-and-sources gate — legal AI outputs must include traceable citations that a human can verify; (4) log all AI contributions to legal work product for conflict checks and privilege logs.",
	government:
		"Government AI workflow design: public-sector AI is subject to high accountability standards and, in the EU, the AI Act's high-risk classification for AI used in administration of justice, border control, and public services. Design principles: (1) human oversight is non-negotiable for decisions affecting citizens' rights or benefits — no fully automated adverse decisions without human review; (2) implement a fairness audit before deployment: test for disparate impact across protected demographic groups; (3) design for public accountability — be prepared to disclose that AI was used in a decision if asked by an affected citizen; (4) procurement requirements (accessibility, security, data sovereignty) must be incorporated at design time.",
	education:
		"Education AI workflow design: student-facing AI is subject to FERPA (US), COPPA for students under 13 (US), and GDPR for EU students. Design principles: (1) do not use student interaction data to train models without explicit institutional and parental consent; (2) implement age-appropriate safeguards for minors — content filtering, interaction logging with parent/guardian access; (3) build transparency into assessment AI — students have the right to understand how AI-assisted grading decisions were made; (4) academic integrity gates: implement disclosure requirements when AI assists in submitted work, consistent with the institution's academic integrity policy.",
	general:
		"General regulated-workflow design baseline: applicable when no single industry framework dominates. Implement: (1) a risk classification step at workflow entry that routes high-risk decisions to stricter approval paths; (2) human-in-the-loop gates for any decision that could significantly harm an individual; (3) audit logging at sufficient depth to reconstruct any decision after the fact; (4) an explainability mechanism that can produce a plain-language summary of why the AI reached a given output; (5) a feedback channel for affected individuals to contest AI-influenced decisions.",
};

// ─── Approval Gate Guidance ────────────────────────────────────────────────────

const GATE_GUIDANCE: Record<ApprovalGateType, string> = {
	"human-in-loop":
		"Human-in-the-loop gate design: the gate must be a genuine decision point, not a rubber-stamp. Design the review interface to present: the AI recommendation, the key factors or evidence supporting it, the alternatives considered, and the confidence level. Give the reviewer enough time, information, and authority to override the AI recommendation without organisational pressure. Log the reviewer's decision, the time taken, and whether they accepted or overrode the AI — sustained high override rates signal the AI quality requires improvement; very low override rates may signal reviewers are not engaging meaningfully.",
	"automated-check":
		"Automated compliance gate design: define the acceptance criteria in machine-readable form before implementing the gate. The gate must have a clear pass/fail outcome — 'mostly compliant' is not a valid gate state. Build the gate as a synchronous, atomic check (the workflow cannot proceed past the gate until the check returns a definitive result). Log every gate evaluation with the input, the evaluation criteria version, and the outcome. Implement a gate-bypass mechanism for incident response that requires dual approval and creates an audit event.",
	"dual-approval":
		"Dual-approval (four-eyes) gate design: both approvers must act independently — the second approver must not see the first approver's decision before making their own. Implement using separate review queues or a blind-review mode where both reviewers submit decisions before either is revealed. Define what happens when the two approvers disagree: options include escalation to a third approver, mandatory discussion meeting, or a tie-breaking rule. Track disagreement rates as a signal of ambiguous criteria or inconsistent training.",
	"audit-only":
		"Audit-only gate: appropriate for lower-risk decisions where real-time human review is impractical but retroactive accountability is required. The audit log must be sufficient to reconstruct the decision after the fact — include the full input, model version, output, and context. Implement a regular audit sampling process: review a random sample of audit-only decisions at regular intervals to verify quality and detect emerging issues before they scale. Define escalation criteria that convert audit-only decisions to human-in-the-loop when anomalies are detected.",
};

// ─── Audit Level Guidance ──────────────────────────────────────────────────────

const AUDIT_LEVEL_GUIDANCE: Record<AuditLevel, string> = {
	basic:
		"Basic audit logging: log decision inputs (sanitised, without sensitive fields), outputs, timestamp, model version, and workflow step ID. Sufficient for low-risk operational monitoring and basic compliance evidence. Retention: minimum 1 year or as required by applicable regulation. Limitation: cannot reconstruct the full context of a contested decision — basic logs are insufficient for regulatory investigations or legal proceedings.",
	detailed:
		"Detailed audit logging: extend basic logging with decision rationale (key factors, confidence scores, model probabilities where available), full input schema including classification labels, reviewer identity and decision for gated steps, data lineage (source of each context element), and any intermediate model calls. Retention: 3–7 years depending on regulatory context. Use structured logging (JSON with a defined schema) rather than free-text to enable automated analysis and querying.",
	forensic:
		"Forensic audit logging: immutable, tamper-evident record of every step in the decision process. Requirements: (1) append-only storage with cryptographic hash chaining (each log entry includes a hash of the previous entry); (2) full context window capture (the exact prompt and response for every model call in the decision chain); (3) data lineage to primary sources (for RAG pipelines, record which documents and chunks were retrieved and their provenance); (4) intermediate reasoning steps for chain-of-thought pipelines; (5) reviewer activity log (for human-in-the-loop gates). Forensic logs must be stored separately from operational logs and protected from deletion by any operational role. Required for: high-risk medical device decisions, adverse financial decisions, government benefit determinations.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const REGULATED_WORKFLOW_RULES: ReadonlyArray<{
	pattern: RegExp;
	detail: string;
}> = [
	{
		pattern:
			/\b(audit.trail|audit.log|compliance.trail|traceab|record.keeping|document.decision|evidence)\b/i,
		detail:
			"Audit trail architecture for regulated AI: design the audit trail as a first-class component, not an afterthought. Requirements: (1) capture the decision-making chain, not just the final output — every model call and data transformation in the chain must be logged; (2) link every audit record to the specific model version, prompt template version, and configuration snapshot that produced it; (3) implement write-once storage for audit records — operational database records can be updated, but audit records cannot; (4) define a query interface that allows regulators to retrieve all records related to a specific individual's interaction with the system.",
	},
	{
		pattern:
			/\b(explainab|interpretab|transparent|reason|why.did|how.did|black.box|white.box|xai)\b/i,
		detail:
			"Explainability requirements for regulated AI: the type of explanation required varies by use case. For feature-based models: SHAP or LIME values per input feature. For LLM-based systems: a structured explanation citing the specific evidence from the context that supports the conclusion. Design explainability as a workflow step, not a post-hoc capability — the model should be prompted to produce a structured explanation alongside every regulated decision. Test explanation quality with target users (clinicians, loan officers, students) to confirm the explanations are intelligible and actionable.",
	},
	{
		pattern:
			/\b(human.oversight|human.review|human.approval|override|escalat|not.fully.automat)\b/i,
		detail:
			"Human oversight design for regulated decisions: define precisely which decisions require human oversight and at what point in the workflow. 'Human in the loop' is not a single pattern — it ranges from human review of every AI output before it is visible to the user, to spot-check review of a sample of outputs, to post-hoc review triggered by anomaly detection. For high-stakes regulated decisions (clinical, legal, financial): design the interface to make the AI's reasoning visible to the reviewer and make the override path easy and natural — if overriding the AI is harder than accepting it, the oversight is not genuine.",
	},
	{
		pattern:
			/\b(fairness|bias|disparate.impact|discrimination|protected.class|demographic|equal.treatment)\b/i,
		detail:
			"Fairness requirements for regulated AI: before deploying an AI system that makes decisions affecting individuals in regulated contexts, conduct a disparate impact analysis. Steps: (1) identify protected classes relevant to the decision type and jurisdiction; (2) measure the AI system's decision rates across protected groups using representative test data; (3) calculate the adverse impact ratio (AIR) for each protected class against the most favoured group — an AIR below 0.8 (the '4/5ths rule') requires investigation and mitigation; (4) document the analysis results and mitigation steps taken. Repeat the analysis on a regular schedule and when the model or training data changes.",
	},
	{
		pattern:
			/\b(change.control|change.management|change.approval|version.control|configuration.management|deployment.control)\b/i,
		detail:
			"Change control for regulated AI workflows: any change to a regulated AI workflow must go through a formal change control process. Define what constitutes a 'change': model version updates, prompt template changes, data source changes, threshold configuration changes, and approval gate logic changes all qualify. Each change must be: documented with a change request, risk-assessed, tested against the regression suite, reviewed by a qualified person, and rolled back within a defined SLA if it causes a quality regression. Maintain a change log that correlates workflow changes with performance metric changes.",
	},
	{
		pattern:
			/\b(validation|verify|test.suite|regression.test|acceptance.test|clinical.valid|performance.valid)\b/i,
		detail:
			"Validation for regulated AI workflows: 'validation' in a regulated context means demonstrating that the AI system performs as intended across its intended use population. Build a validation plan before development, not after — the plan defines: the intended use, the target performance metrics, the acceptable performance bounds, the test population characteristics, and the statistical analysis approach. For clinical AI (SaMD): the validation study must demonstrate clinical equivalence or superiority to the standard of care. Maintain validation documentation for the life of the product — regulators may request it years after initial deployment.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const govRegulatedWorkflowDesignHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Regulated Workflow Design needs a description of the industry, the regulated decision type, or the compliance requirement before it can produce targeted design guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;

		if (
			!hasRegulatedWorkflowDesignSignal(combined) &&
			signals.complexity === "simple"
		) {
			return buildInsufficientSignalResult(
				context,
				"Regulated Workflow Design targets AI workflows that must meet regulated-industry requirements (healthcare, finance, legal, government). Describe the industry, the type of AI-assisted decision, and the specific compliance or auditability requirement to receive targeted design guidance.",
				"Mention the regulated industry (healthcare, finance, legal, government), the type of decision the AI assists with, and the compliance requirements (audit logging, human oversight, explainability, fairness) so Regulated Workflow Design can produce targeted design patterns.",
			);
		}

		const guidances: string[] = REGULATED_WORKFLOW_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail);

		const parsed = parseSkillInput(regulatedWorkflowDesignInputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (opts?.regulatedIndustry) {
			const industryNote =
				INDUSTRY_GUIDANCE[opts.regulatedIndustry as RegulatedIndustry];
			if (industryNote) guidances.unshift(industryNote);
		}

		if (opts?.approvalGateType) {
			const gateNote = GATE_GUIDANCE[opts.approvalGateType as ApprovalGateType];
			if (gateNote) guidances.push(gateNote);
		}

		if (opts?.auditLevel) {
			const auditNote = AUDIT_LEVEL_GUIDANCE[opts.auditLevel as AuditLevel];
			if (auditNote) guidances.push(auditNote);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To design a regulated AI workflow: (1) classify the risk level of the AI-assisted decision; (2) identify applicable regulatory frameworks; (3) design approval gates appropriate to the risk level (human-in-the-loop for high-risk decisions); (4) implement audit logging at sufficient depth; (5) build explainability into the workflow; (6) conduct a fairness analysis before deployment; (7) establish a change-control process for ongoing modifications.",
				"Regulated workflow design is an iterative process — engage compliance, legal, and domain experts early. Design for auditability from the start; retrofitting audit trails onto existing AI workflows is significantly harder than building them in from the beginning.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply regulated workflow design under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints typically define which regulatory frameworks are mandatory, the maximum acceptable human-review latency, and the audit-log retention period required.`,
			);
		}

		guidances.push(GOV_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Approval gate design matrix",
				["Gate type", "Primary use", "Evidence", "Typical failure mode"],
				[
					{
						label: "Human-in-loop",
						values: [
							"high-stakes citizen, patient, or customer decisions",
							"review notes + reviewer identity",
							"rubber-stamp review",
							"escalate to a second reviewer when the first cannot justify the decision",
						],
					},
					{
						label: "Automated-check",
						values: [
							"repeatable policy checks with machine-readable criteria",
							"pass/fail rule output",
							"vague rules that are hard to test",
							"fallback to manual review when the rule set is ambiguous",
						],
					},
					{
						label: "Dual-approval",
						values: [
							"four-eyes controls for sensitive changes",
							"two independent sign-offs",
							"shared bias or collusion between reviewers",
							"escalate disagreements to a third approver",
						],
					},
					{
						label: "Audit-only",
						values: [
							"lower-risk workflows that still need traceability",
							"append-only log and review sample",
							"logs with no periodic review",
							"escalate recurring findings into a live gate",
						],
					},
				],
				"Use the matrix to match the approval mechanism to the decision risk and evidence requirements.",
			),
			buildOutputTemplateArtifact(
				"Regulated workflow blueprint",
				`| Industry | Decision type | Risk class | Approval gate | Audit depth | Remediation owner |
| --- | --- | --- | --- | --- | --- |`,
				[
					"Industry",
					"Decision type",
					"Risk class",
					"Approval gate",
					"Audit depth",
					"Remediation owner",
				],
				"Use this blueprint to capture the design choices that an audit or review will later expect.",
			),
			buildToolChainArtifact(
				"Regulated workflow design chain",
				[
					{
						tool: "risk classification",
						description: "classify the decision and the affected population",
					},
					{
						tool: "regulatory mapping",
						description:
							"map each obligation to a technical or process control",
					},
					{
						tool: "gate design",
						description:
							"select the approval or automation gate that matches the risk",
					},
					{
						tool: "audit architecture",
						description:
							"define what gets logged, how long it is retained, and who can review it",
					},
					{
						tool: "verification plan",
						description:
							"test fairness, explainability, and override paths before launch",
					},
				],
				"Keep the design flow explicit so compliance and engineering can review the same artefacts.",
			),
			buildWorkedExampleArtifact(
				"Healthcare triage workflow example",
				{
					context: "patient-message triage for clinical escalation",
					industry: "healthcare",
					decision: "route to nurse review or self-care advice",
				},
				{
					gates: [
						"human review for high-risk symptoms",
						"forensic audit logging for the escalation decision",
						"explicit override path for clinicians",
					],
					requiredEvidence: [
						"triage rationale",
						"reviewer identity",
						"clinical escalation outcome",
					],
				},
				"Shows how regulated workflow design turns a high-stakes use case into a concrete gate structure.",
			),
			buildEvalCriteriaArtifact(
				"Regulated workflow design readiness criteria",
				[
					"Every high-stakes decision has a defined approval gate.",
					"Audit logs capture enough context to reconstruct the decision later.",
					"Human override paths are visible and usable.",
					"Fairness, transparency, and change-control checks are planned before launch.",
					"Owners are named for each remediation and approval step.",
				],
				"Use these criteria to decide whether the workflow design is ready for compliance review.",
			),
		];

		return createCapabilityResult(
			context,
			`Regulated Workflow Design produced ${guidances.length - 1} design guideline${guidances.length - 1 === 1 ? "" : "s"} for AI workflows in regulated industries. Results are advisory — engage domain-specific legal and compliance counsel before deploying AI in regulated decision-making contexts.`,
			createFocusRecommendations(
				"Regulated workflow guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	govRegulatedWorkflowDesignHandler,
);
