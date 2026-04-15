/**
 * gov-helpers.ts
 *
 * Shared utilities and domain-signal detectors for the gov skill domain:
 *   gov-data-guardrails, gov-model-compatibility, gov-model-governance,
 *   gov-policy-validation, gov-prompt-injection-hardening,
 *   gov-regulated-workflow-design, gov-workflow-compliance.
 *
 * All exports are pure functions — no I/O, no model calls, deterministic.
 *
 * ADVISORY ONLY — outputs are supplementary governance guidance. They do not
 * enforce policies, block requests, or modify running system configuration.
 */

import { MODEL_PROVIDER_KEYWORDS } from "../../constants/provider-keywords.js";

// ─── Advisory Disclaimer ─────────────────────────────────────────────────────

/**
 * Standard advisory note surfaced whenever a gov handler produces guidance
 * detailed enough to be mistaken for live policy enforcement.
 */
export const GOV_ADVISORY_DISCLAIMER =
	"This analysis is advisory only — it provides governance design guidance " +
	"and policy recommendations; it does not enforce policies, block AI requests, " +
	"modify model configurations, or satisfy regulatory obligations on its own. " +
	"Validate every recommendation against your organisation's legal counsel, " +
	"compliance team, and operational risk tolerance before implementation.";

// ─── Domain Signal Detectors ──────────────────────────────────────────────────

/**
 * True when combined text references PII handling, data masking, secret
 * protection, or data minimisation (gov-data-guardrails).
 */
export function hasDataGuardrailsSignal(combined: string): boolean {
	// Cluster A — explicit PII / sensitive data vocabulary
	if (
		/\b(pii|phi|personal.data|sensitive.data|secret|credential|api.key|token|password|private.key|ssn|social.security|credit.card|bank.account)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — masking / redaction / anonymisation intent (no trailing \b — terms appear as prefixes)
	if (
		/\b(mask|redact|anonymi[sz]|pseudonymis|tokeniz|sanitiz|scrub|strip|filter|censor)/i.test(
			combined,
		) &&
		/\b(data|field|output|prompt|context|pipeline|agent|workflow)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — data minimisation / GDPR / compliance vocabulary (no trailing \b — terms appear as prefixes)
	if (
		/\b(minimis|minimiz|gdpr|hipaa|ccpa|data.protect|data.privac|least.privilege|need.to.know|data.residency|data.retention)/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when combined text references model upgrade, migration, compatibility
 * assessment between AI models (gov-model-compatibility).
 */
export function hasModelCompatibilitySignal(combined: string): boolean {
	// Cluster A — explicit compatibility / migration vocabulary (no trailing \b — terms appear as prefixes)
	if (
		/\b(compat|migrat|upgrade.model|switch.model|replace.model|model.switch|model.migrat|model.change|move.to|moving.to)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — regression / breaking change intent
	if (
		/\b(regression|breaking.change|backward.compat|forward.compat|api.break|output.format.change|schema.change)/i.test(
			combined,
		) &&
		new RegExp(
			`\\b(model|llm|${MODEL_PROVIDER_KEYWORDS}|ai|inference)\\b`,
			"i",
		).test(combined)
	)
		return true;

	// Cluster C — context window / capability difference vocabulary
	if (
		/\b(context.window|token.limit|capability.difference|feature.gap|modality|multimodal|function.calling|tool.use|json.mode)/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when combined text references model version pinning, lifecycle
 * management, or deployment policy (gov-model-governance).
 */
export function hasModelGovernanceSignal(combined: string): boolean {
	// Cluster A — explicit governance / pinning vocabulary (no trailing \b — terms appear as prefixes)
	if (
		/\b(pin.model|model.pin|version.pin|model.version|model.registry|model.govern|model.policy|model.lifecycle|model.deprecat)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — deployment / promotion / rollback intent (no trailing \b — terms appear as prefixes)
	if (
		/\b(deploy.model|model.deploy|promote.model|rollback.model|canary|shadow.model|model.rollout|model.stage|blue.green|champion.challenger)/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — model selection / approval / access-control vocabulary (no trailing \b — terms appear as prefixes)
	if (
		/\b(model.selection|model.approval|model.audit|model.access|allowlist|denylist|approved.model|banned.model|model.catalog)/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when combined text references policy validation, compliance checking, or
 * policy-as-code (gov-policy-validation).
 */
export function hasPolicyValidationSignal(combined: string): boolean {
	// Cluster A — explicit policy validation vocabulary (no trailing \b — terms appear as prefixes)
	if (
		/\b(policy.valid|validate.policy|policy.check|compliance.check|governance.check|policy.as.code|opa|open.policy|rego|policy.engine|policy.rule)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — regulatory framework / compliance gate intent
	if (
		/\b(nist|eu.ai|iso.42001|ai.act|responsible.ai|ai.governance|ethics.review|bias.check|fairness.check|ai.risk)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — workflow gate / approval / sign-off vocabulary (no trailing \b — terms appear as prefixes)
	if (
		/\b(compliance.gate|approval.gate|policy.gate|sign.off|human.review|mandatory.check|pre.deploy.check|pre.production)/i.test(
			combined,
		) &&
		/\b(ai|workflow|pipeline|model|prompt|agent)\b/i.test(combined)
	)
		return true;

	return false;
}

/**
 * True when combined text references prompt injection, instruction hijacking,
 * or indirect injection hardening (gov-prompt-injection-hardening).
 */
export function hasPromptInjectionHardeningSignal(combined: string): boolean {
	// Cluster A — explicit injection vocabulary
	if (
		/\b(prompt.injection|injection.attack|indirect.injection|instruction.hijack|jailbreak|prompt.leak|system.prompt.leak|adversarial.prompt)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — RAG / tool / retrieval attack surface
	if (
		/\b(rag.injection|retrieval.injection|document.injection|tool.response.injection|plugin.injection|webhook.injection|untrusted.content)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — defence / hardening intent vocabulary
	if (
		/\b(harden|defend|protect.against|mitigat|sanitiz|input.valid|output.filter|sandbox.prompt|delimiter|separator.token|privilege.escalat)\b/i.test(
			combined,
		) &&
		/\b(injection|hijack|attack|adversarial|untrusted|malicious|exploit)\b/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when combined text references regulated industry workflow design,
 * approval gates, or compliance trails (gov-regulated-workflow-design).
 */
export function hasRegulatedWorkflowDesignSignal(combined: string): boolean {
	// Cluster A — regulated industry vocabulary
	if (
		/\b(regulated.industry|healthcare.ai|finance.ai|legal.ai|government.ai|fda|ema|finra|sec.compliance|clinical.decision|medical.device|financial.advice)\b/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — audit trail / approval gate intent (no trailing \b — terms appear as prefixes)
	if (
		/\b(audit.trail|audit.log|compliance.trail|approval.gate|human.in.loop|human.oversight|four.eyes|dual.control|sign.off.gate|checkpoint)/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — workflow design for compliance vocabulary (no trailing \b — terms appear as prefixes)
	if (
		/\b(compliant.workflow|compliant.pipeline|design.for.compliance|auditab|traceable|explainable|interpretable|immutable.log|non.repudiation)/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when combined text references workflow-level compliance validation
 * against governance requirements (gov-workflow-compliance).
 */
export function hasWorkflowComplianceSignal(combined: string): boolean {
	// Cluster A — explicit workflow compliance vocabulary (no trailing \b — terms appear as prefixes)
	if (
		/\b(workflow.compliance|pipeline.compliance|compliance.validat|governance.validat|compliance.report|governance.report|compliance.posture)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — policy enforcement / violation in workflow context (no trailing \b)
	if (
		/\b(enforce.policy|policy.enforcement|policy.violat|compliance.violat|non.compliant|compliance.gap|remediat)/i.test(
			combined,
		) &&
		/\b(workflow|pipeline|ai.system|agent|model)\b/i.test(combined)
	)
		return true;

	// Cluster C — compliance monitoring / continuous compliance vocabulary (no trailing \b)
	if (
		/\b(continuous.compliance|compliance.monitor|compliance.drift|governance.drift|compliance.baseline|compliance.scan|policy.scan)/i.test(
			combined,
		)
	)
		return true;

	// Cluster D — general compliance validation in AI/workflow context (no trailing \b on prefixes)
	if (
		/\b(compliance|govern)\b/i.test(combined) &&
		/\b(validat|assess|check|audit|review)/i.test(combined) &&
		/\b(workflow|pipeline|ai|agentic)/i.test(combined)
	)
		return true;

	return false;
}
