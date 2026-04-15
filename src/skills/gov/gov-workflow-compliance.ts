/**
 * gov-workflow-compliance.ts
 *
 * Handwritten capability handler for the gov-workflow-compliance skill.
 *
 * Domain: Validating AI workflows against policy, compliance, and governance
 * requirements — end-to-end compliance posture assessment, policy-violation
 * detection, remediation guidance, and continuous-compliance monitoring.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gov-prompt-injection-hardening — injection-specific hardening (security)
 *   gov-data-guardrails            — data-layer PII/sensitive-data protection
 *   gov-model-governance           — model-specific governance lifecycle
 *   gov-policy-validation          — policy-as-code and validation gate design
 *
 * Outputs are ADVISORY ONLY — this handler does NOT execute compliance scans,
 * certify workflow compliance, or satisfy regulatory audit requirements.
 */

import { z } from "zod";
import { gov_workflow_compliance_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	hasWorkflowComplianceSignal,
} from "./gov-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const workflowComplianceInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			complianceScope: z
				.enum([
					"data-handling",
					"model-usage",
					"output-validation",
					"access-control",
					"full",
				])
				.optional()
				.describe(
					"Scope of the compliance assessment. data-handling: how data is collected, stored, processed, and shared; model-usage: which models are used, under what terms, and for what purposes; output-validation: whether AI outputs are reviewed, validated, and acted upon appropriately; access-control: who can access the AI system and its data; full: comprehensive end-to-end compliance assessment across all dimensions.",
				),
			workflowType: z
				.enum(["rag", "agentic", "classification", "generation", "multi-agent"])
				.optional()
				.describe(
					"Type of AI workflow being assessed. rag: retrieval-augmented generation pipeline; agentic: autonomous agent with tool-use and action capabilities; classification: model making categorical decisions; generation: open-ended content generation; multi-agent: multiple AI agents collaborating or operating in sequence.",
				),
			nonComplianceAction: z
				.enum(["block", "warn", "log", "escalate"])
				.optional()
				.describe(
					"Action to take when a compliance violation is detected. block: prevent the workflow from proceeding; warn: surface the violation to the operator without stopping; log: record the violation for audit without real-time notification; escalate: route the violation to a compliance team or incident queue.",
				),
		})
		.optional(),
});

type ComplianceScope =
	| "data-handling"
	| "model-usage"
	| "output-validation"
	| "access-control"
	| "full";
type WorkflowType =
	| "rag"
	| "agentic"
	| "classification"
	| "generation"
	| "multi-agent";
type NonComplianceAction = "block" | "warn" | "log" | "escalate";

// ─── Scope Guidance ───────────────────────────────────────────────────────────

const SCOPE_GUIDANCE: Record<ComplianceScope, string> = {
	"data-handling":
		"Data-handling compliance assessment: evaluate: (1) data classification — are all input fields classified by sensitivity before entering the workflow? (2) data minimisation — does the workflow pass only the fields necessary for each step? (3) data residency — is data processed only in approved geographic regions? (4) data retention — are workflow logs and cached completions subject to the correct retention and deletion policy? (5) data lineage — can you trace each piece of data from source to every stage of the workflow? Missing any of these five creates a data-handling compliance gap.",
	"model-usage":
		"Model-usage compliance assessment: evaluate: (1) model authorisation — is the model in the organisation's approved model registry for this use case? (2) data-processing agreement — is there a valid DPA with the model provider for the data classifications being processed? (3) acceptable use — does the workflow use the model within the provider's terms of service? (4) output ownership — are intellectual property implications of AI-generated content addressed? (5) model version control — is the deployed model version pinned and auditable? Each of these can be a compliance gap in isolation.",
	"output-validation":
		"Output-validation compliance assessment: evaluate: (1) quality gate — is there an automated or human review gate before AI outputs are used in regulated decisions? (2) hallucination risk — does the workflow implement any hallucination-detection mechanism (citation checking, factual grounding, human review)? (3) content policy — are outputs screened against the organisation's content policy before serving? (4) adverse-action explanation — for decisions affecting individuals, can the AI output be explained in plain language? (5) feedback loop — is there a mechanism to report incorrect outputs and trace their impact?",
	"access-control":
		"Access-control compliance assessment: evaluate: (1) authentication — is access to the AI system and its data gated behind strong authentication? (2) authorisation — are access permissions scoped to the minimum required for each user role? (3) privileged access management — are operator-level capabilities (changing the system prompt, modifying tool permissions) protected with elevated controls? (4) session management — are AI conversations isolated between users and sessions? (5) audit of access — is every access event (including read-only) logged with user identity, timestamp, and scope?",
	full: "Full compliance assessment: conduct the assessment across all five dimensions — data handling, model usage, output validation, access control, and regulatory obligations. A full assessment typically reveals different compliance gaps across dimensions. Prioritise remediation by: (1) severity (regulatory violations > data leakage risks > quality gaps); (2) blast radius (how many users or records are affected); (3) remediation difficulty (configuration changes are cheaper than architectural changes). Produce a compliance posture report with a gap register, risk ratings, and a remediation roadmap.",
};

// ─── Workflow-Type Compliance Notes ───────────────────────────────────────────

const WORKFLOW_TYPE_NOTES: Record<WorkflowType, string> = {
	rag: "RAG workflow compliance: unique compliance risks include retrieval poisoning (malicious content in the document store), stale-data compliance violations (outdated information that was compliant when indexed but is now non-compliant), and attribution failures (inability to trace a generated claim back to its source document). Compliance controls specific to RAG: (1) content policy scan on document ingestion (not just at retrieval time); (2) document-level compliance metadata (retention date, permitted use cases, sensitivity classification); (3) citation generation in model outputs so claims can be audited against source documents.",
	agentic:
		"Agentic workflow compliance: autonomous agents have the highest compliance risk because they can initiate actions with real-world consequences. Compliance controls specific to agentic workflows: (1) action scope limitation — the agent's action space must be explicitly defined and constrained to the minimum required for the task; (2) human-confirmation gates for irreversible actions; (3) action logging that captures intent, authorisation, and outcome for every action taken; (4) rollback capability for reversible actions — the agent must be able to undo its last N actions in an incident; (5) rate limiting on action frequency to prevent runaway automation.",
	classification:
		"Classification workflow compliance: AI classification systems that affect individuals must comply with anti-discrimination and transparency requirements. Compliance controls: (1) protected-class analysis — test classification outcomes across demographic groups before deployment; (2) adverse-action explanation — individuals who receive adverse classification decisions must receive an explanation; (3) appeal mechanism — provide a path for individuals to contest classification decisions; (4) accuracy monitoring by subgroup — track classification accuracy separately for key demographic groups to detect emerging disparate impact.",
	generation:
		"Generation workflow compliance: content generation carries intellectual property, copyright, and content-policy risks. Compliance controls: (1) content policy filtering — scan generated outputs for prohibited content (explicit material, hate speech, copyright-infringing patterns) before serving; (2) provenance disclosure — disclose to end-users when content is AI-generated, as required by an increasing number of regulations (EU AI Act transparency obligations); (3) copyright guardrails — implement retrieval-based filtering to avoid reproducing copyrighted text verbatim; (4) output ownership documentation — record in the data map who owns AI-generated content and under what terms.",
	"multi-agent":
		"Multi-agent workflow compliance: multiple agents create compounding compliance risks — each agent's compliance gap multiplies. Additional controls for multi-agent systems: (1) inter-agent authorisation — each agent-to-agent communication should carry an authorisation context (who initiated the workflow, what permissions are granted); (2) aggregate audit trail — the full audit trail must span all agents in the workflow, not just the orchestrator; (3) accountability mapping — for every compliance violation, there must be a clear chain of accountability from the violating agent back to the initiating actor; (4) emergent behaviour testing — test for emergent compliance violations that arise from the combination of individually compliant agents.",
};

// ─── Non-Compliance Action Notes ──────────────────────────────────────────────

const NON_COMPLIANCE_ACTION_NOTES: Record<NonComplianceAction, string> = {
	block:
		"Block action: the workflow is halted when a compliance violation is detected. Appropriate for: critical policy violations (data classification breach, prohibited model usage, mandatory gate bypass). Design considerations: (1) the block must produce a clear, actionable error to the operator — 'compliance violation' alone is not sufficient; (2) implement a graceful degradation path so blocking one workflow step does not cause uncaught exceptions in downstream steps; (3) test the block path explicitly — most compliance block paths are rarely exercised and may be buggy when actually needed.",
	warn: "Warn action: a compliance violation is surfaced to the operator without stopping the workflow. Appropriate for: advisory violations (best-practice deviations, non-critical configuration drift). Design considerations: (1) warnings that are never actioned become noise — implement a warning acknowledgement mechanism to track which warnings have been reviewed; (2) set a warning SLA — unacknowledged warnings older than N days automatically escalate; (3) aggregate warnings in a compliance dashboard rather than individual alerts, which are harder to track.",
	log: "Log action: the violation is recorded without real-time notification. Appropriate for: low-severity violations and situations where compliance monitoring is retrospective. Design considerations: (1) a log-only violation response requires a periodic review process — without scheduled review, logged violations are never acted upon; (2) ensure log-only violations are captured in structured format (not free-text) so they can be queried and aggregated; (3) set a retention period for compliance logs that meets the regulatory retention requirement for the most stringent applicable regulation.",
	escalate:
		"Escalate action: the violation is routed to a compliance team or incident queue. Appropriate for: significant policy violations requiring human judgment. Design considerations: (1) define the escalation path explicitly — who receives the escalation, through what channel, within what SLA; (2) implement escalation acknowledgement tracking so violations are not lost in the queue; (3) define escalation severity levels (P1 = immediate response, P2 = within 4 hours, P3 = within 1 business day) and assign violations to severity levels based on the type and scope of the violation.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const WORKFLOW_COMPLIANCE_RULES: ReadonlyArray<{
	pattern: RegExp;
	detail: string;
}> = [
	{
		pattern:
			/\b(compliance.posture|compliance.status|compliance.assessment|compliance.review|compliance.report|compliance.dashboard)\b/i,
		detail:
			"Compliance posture assessment: a point-in-time compliance assessment is useful for initial deployment but insufficient for ongoing assurance. Build a compliance posture dashboard that provides a continuous view of the workflow's compliance state. Key metrics: number of open compliance gaps by severity, time-to-remediation for closed gaps, policy violation rate by type, compliance test pass rate over time, and unacknowledged warnings older than SLA. The dashboard should be visible to both the engineering team (for remediation) and the compliance team (for oversight) — not just to auditors during a formal review.",
	},
	{
		pattern:
			/\b(remediat|fix|resolve|address|close.gap|compliance.gap|non.compliant.item)\b/i,
		detail:
			"Remediation planning: when compliance gaps are identified, prioritise them using a severity × effort matrix. Severity: how severe is the compliance risk (regulatory penalty, reputational damage, data breach)? Effort: how complex is the remediation (configuration change, code change, architectural change)? Address high-severity / low-effort gaps first. For high-severity / high-effort gaps, implement a compensating control (a temporary measure that reduces the risk while the full remediation is underway) and document the residual risk. Track all remediation items in a compliance issue register with owner, due date, and current status.",
	},
	{
		pattern:
			/\b(continuous.compliance|compliance.monitor|compliance.drift|policy.drift|configuration.drift)\b/i,
		detail:
			"Continuous compliance monitoring: compliance is not a destination but a continuous state. Implement automated compliance checks that run on a schedule (daily recommended) and compare the workflow's current state against the compliance baseline. Alert on drift — a workflow that was compliant last week but has diverged in the past 24 hours requires immediate investigation. Common causes of compliance drift: dependency upgrades that change behaviour, configuration changes that bypass controls, data-source changes that introduce new sensitivity classifications, and model provider changes that alter data-processing terms.",
	},
	{
		pattern:
			/\b(third.party|vendor|provider|supplier|saas|api.provider|sub.processor|partner)\b/i,
		detail:
			"Third-party compliance responsibilities: when your AI workflow uses third-party model providers, cloud services, or data providers, their compliance posture affects yours. Due-diligence requirements: (1) obtain and review the provider's current compliance certifications (SOC 2 Type II, ISO 27001, HIPAA BAA if applicable); (2) ensure the provider's acceptable use policy permits your use case; (3) verify data-processing terms cover your data classifications; (4) assess the provider's incident notification obligations and SLA; (5) include compliance obligations in the contractual terms (DPA, BAA, security addendum). Re-assess third-party compliance annually and when the provider announces policy changes.",
	},
	{
		pattern:
			/\b(incident|breach|violation.detect|compliance.failure|reporting.obligation|notification.requirement)\b/i,
		detail:
			"Compliance incident management: define the compliance incident response plan before deploying to production. The plan must cover: (1) detection — how will compliance violations be identified (automated monitoring, user reports, third-party notification)? (2) triage — who assesses the severity and scope of the incident? (3) containment — what immediate steps prevent further compliance harm? (4) notification — do any regulatory frameworks require notification to authorities or affected individuals within a specific timeframe (GDPR 72-hour rule, HIPAA breach notification requirements)? (5) post-incident review — what process prevents recurrence?",
	},
	{
		pattern:
			/\b(access.log|who.accessed|data.access|authoriz.log|permission.audit|access.review|entitlement.review)\b/i,
		detail:
			"Access review for AI workflows: conduct periodic access reviews (quarterly recommended) to verify that access permissions align with current roles and responsibilities. AI workflow access has unique characteristics: the AI system itself is an actor with a service-account identity that must be reviewed alongside human users. Service-account access tends to accumulate permissions over time and is rarely cleaned up. Review: which model APIs the service account can call, which data stores it can read/write, and which external tools it can invoke. Revoke any permissions that are not actively required for the current workflow.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const govWorkflowComplianceHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Workflow Compliance needs a description of the AI workflow, the compliance scope, or the regulatory requirements before it can produce targeted compliance assessment guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;

		if (
			!hasWorkflowComplianceSignal(combined) &&
			signals.complexity === "simple"
		) {
			return buildInsufficientSignalResult(
				context,
				"Workflow Compliance targets end-to-end validation of AI workflows against policy, compliance, and governance requirements. Describe the AI workflow type (RAG, agentic, classification), the compliance scope (data handling, model usage, access control), and the applicable policies to receive targeted compliance guidance.",
				"Mention the AI workflow type, the specific compliance dimension (data handling, model usage, output validation, access control), and any known compliance gaps or regulatory requirements so Workflow Compliance can produce targeted assessment and remediation advice.",
			);
		}

		const guidances: string[] = WORKFLOW_COMPLIANCE_RULES.filter(
			({ pattern }) => pattern.test(combined),
		).map(({ detail }) => detail);

		const parsed = parseSkillInput(workflowComplianceInputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (opts?.complianceScope) {
			const scopeNote = SCOPE_GUIDANCE[opts.complianceScope as ComplianceScope];
			if (scopeNote) guidances.unshift(scopeNote);
		}

		if (opts?.workflowType) {
			const typeNote = WORKFLOW_TYPE_NOTES[opts.workflowType as WorkflowType];
			if (typeNote) guidances.push(typeNote);
		}

		if (opts?.nonComplianceAction) {
			const actionNote =
				NON_COMPLIANCE_ACTION_NOTES[
					opts.nonComplianceAction as NonComplianceAction
				];
			if (actionNote) guidances.push(actionNote);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To assess AI workflow compliance: (1) identify all applicable policies across data-handling, model-usage, output-validation, and access-control dimensions; (2) map each policy to a specific technical control or check in the workflow; (3) evaluate whether each control is implemented, effective, and monitored; (4) prioritise identified gaps by severity; (5) develop a remediation roadmap with owners and timelines; (6) implement continuous compliance monitoring.",
				"Workflow compliance is a shared responsibility between engineering, compliance, and legal teams. The most effective compliance programmes combine automated checks (for speed and consistency) with human review (for judgment-intensive assessments). Neither alone is sufficient.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply workflow compliance assessment under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints typically define the applicable regulatory frameworks, the remediation timeline, and the risk tolerance for residual compliance gaps.`,
			);
		}

		guidances.push(GOV_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Workflow compliance checkpoint matrix",
				["Policy checked", "Evidence", "Decision", "Escalation"],
				[
					{
						label: "Input validation",
						values: [
							"data handling",
							"schema checks and data classification tags",
							"ingress validation log",
							"block or warn",
						],
					},
					{
						label: "Retrieval / tool prep",
						values: [
							"model usage",
							"approved source list and trust markers",
							"retrieval trace",
							"escalate on untrusted content",
						],
					},
					{
						label: "Model call",
						values: [
							"access control",
							"authz context and model registry entry",
							"model invocation record",
							"log or block",
						],
					},
					{
						label: "Output review",
						values: [
							"output validation",
							"review gate outcome and quality signals",
							"review notes",
							"warn or block",
						],
					},
					{
						label: "Deployment gate",
						values: [
							"full compliance",
							"gap register and remediation plan",
							"compliance posture report",
							"escalate until gaps are closed",
						],
					},
				],
				"Use this matrix to pin each compliance question to a workflow stage and evidence source.",
			),
			buildOutputTemplateArtifact(
				"Compliance gap register",
				`| Gap | Dimension | Severity | Evidence | Owner | Remediation | Due date | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |`,
				[
					"Gap",
					"Dimension",
					"Severity",
					"Evidence",
					"Owner",
					"Remediation",
					"Due date",
					"Status",
				],
				"Use this register to keep remediation work tied to a concrete compliance finding.",
			),
			buildToolChainArtifact(
				"Workflow compliance review chain",
				[
					{
						tool: "workflow inventory",
						description:
							"catalog the workflow stages, data sources, and model calls",
					},
					{
						tool: "control mapping",
						description:
							"map each policy or obligation to the stage where it is enforced",
					},
					{
						tool: "gap scoring",
						description: "rate each finding by severity and blast radius",
					},
					{
						tool: "remediation planner",
						description: "assign owners, due dates, and compensating controls",
					},
					{
						tool: "drift monitor",
						description:
							"re-run the checks on a schedule and alert on divergence",
					},
				],
				"Keep the assessment operational by linking findings to owners and recurring checks.",
			),
			buildWorkedExampleArtifact(
				"Workflow compliance assessment example",
				{
					workflow: "agentic support workflow",
					scope: "full",
					findings: [
						"unapproved retrieval source",
						"missing output review gate",
					],
				},
				{
					gapRegister: [
						{
							gap: "unapproved retrieval source",
							severity: "high",
							action: "block until source is added to the approved list",
						},
						{
							gap: "missing output review gate",
							severity: "medium",
							action: "add human or automated validation before release",
						},
					],
					remediationRoadmap:
						"resolve the high-severity data and review gaps before the next deployment gate",
				},
				"Shows how an assessment should translate into concrete remediations rather than a generic warning.",
			),
			buildEvalCriteriaArtifact(
				"Workflow compliance assessment criteria",
				[
					"All five compliance dimensions are covered or explicitly scoped out.",
					"Each finding has evidence, severity, owner, and due date.",
					"Remediation is prioritised by severity and blast radius.",
					"Non-compliance responses have explicit escalation criteria.",
					"Continuous monitoring is planned after the point-in-time review.",
				],
				"Use these criteria to decide whether the workflow compliance review is actionable.",
			),
		];

		return createCapabilityResult(
			context,
			`Workflow Compliance produced ${guidances.length - 1} compliance assessment guideline${guidances.length - 1 === 1 ? "" : "s"} for validating AI workflows against governance and regulatory requirements. Results are advisory — engage compliance and legal teams for authoritative compliance determination.`,
			createFocusRecommendations(
				"Workflow compliance guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	govWorkflowComplianceHandler,
);
