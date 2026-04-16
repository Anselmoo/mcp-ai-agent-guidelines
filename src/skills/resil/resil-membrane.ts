/**
 * resil-membrane.ts
 *
 * Handwritten capability handler for the resil-membrane skill.
 *
 * Computational biology metaphor: P-systems / membrane computing.
 * Each workflow stage is wrapped in a Membrane with entry_rules, evolution_rules,
 * and exit_rules.  Artifacts are annotated with clearance_level; fields whose
 * clearance level exceeds the membrane's ceiling are blocked, masked, hashed,
 * or anonymised at the membrane boundary.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   resil-clone-mutate    — clonal selection / prompt mutation
 *   resil-homeostatic     — PID setpoint control
 *   resil-redundant-voter — N-modular redundancy / voting
 *   resil-replay          — execution-trace replay
 *   gov-data-guardrails   — general data governance and guardrails
 *
 * Outputs are ADVISORY ONLY — this handler does NOT enforce data policies,
 * block fields, or modify running workflow configuration.
 */

import { z } from "zod";
import { resil_membrane_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildInsufficientSignalResult,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	hasMembraneSignal,
	RESIL_ADVISORY_DISCLAIMER,
} from "./resil-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const membraneInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			clearanceLevels: z
				.array(z.string())
				.optional()
				.describe(
					"Ordered list of clearance levels from lowest to highest, e.g. ['public', 'internal', 'confidential', 'restricted']. Fields annotated with a level higher than the target membrane's ceiling are blocked or transformed.",
				),
			defaultAction: z
				.enum(["block", "mask", "hash", "anonymize", "allow"])
				.optional()
				.describe(
					"Action applied to fields whose clearance_level exceeds the membrane ceiling when no specific rule matches. 'block' drops the field entirely; 'mask' replaces with redaction marker; 'hash' replaces with a one-way hash; 'anonymize' removes identifying elements; 'allow' passes through (unsafe default — only for development).",
				),
			auditRequired: z
				.boolean()
				.optional()
				.describe(
					"When true, every membrane-boundary crossing (including allowed fields) must be logged to the audit trail with artifact_id, field_name, action_applied, clearance_level, and timestamp.",
				),
			regulatoryFramework: z
				.enum(["HIPAA", "GDPR", "PCI-DSS", "SOC2", "CCPA", "none"])
				.optional()
				.describe(
					"Regulatory framework governing data boundaries. Controls which default transformation actions are permissible and which fields must be treated as per se restricted regardless of annotation.",
				),
		})
		.optional(),
});

type DefaultAction = "block" | "mask" | "hash" | "anonymize" | "allow";
type RegulatoryFramework =
	| "HIPAA"
	| "GDPR"
	| "PCI-DSS"
	| "SOC2"
	| "CCPA"
	| "none";

// ─── Regulatory Framework Notes ───────────────────────────────────────────────

const REGULATORY_NOTES: Record<RegulatoryFramework, string> = {
	HIPAA:
		"HIPAA context: Protected Health Information (PHI) includes 18 Safe Harbor identifier categories (name, address, dates except year, phone, fax, email, SSN, MRN, account numbers, certificate/license numbers, VINs, device identifiers, URLs, IPs, biometrics, full-face photographs, and any unique identifiers). All PHI fields must use 'hash' or 'block' at inter-stage membranes; 'mask' with static redaction markers is insufficient for de-identification under Safe Harbor. Maintain a minimum necessary access policy: each membrane should expose only the PHI fields the receiving stage requires for its specific task.",
	GDPR: "GDPR context: Personal data includes any information relating to an identified or identifiable natural person. Apply the data minimisation principle at each membrane: only transfer the minimum fields necessary for the downstream stage's processing purpose. Pseudonymisation (replace identifying fields with a reversible token held in a separate key store accessible only to the data controller) is preferred over anonymisation when the workflow needs to re-identify for downstream steps. Log every cross-membrane transfer as a data processing record under GDPR Art. 30.",
	"PCI-DSS":
		"PCI-DSS context: Cardholder Data (CHD) includes PAN (Primary Account Number), cardholder name, service code, and expiry date. Sensitive Authentication Data (SAD) includes full track data, CVV2/CVC2/CID, and PINs. SAD must never enter the workflow at all — block at the entry membrane; never store, process, or transmit SAD even in hashed form. PANs must be masked to show only the last 4 digits at any inter-stage boundary where the full PAN is not required for processing.",
	SOC2: "SOC2 context: Relevant Trust Service Criteria include CC6 (Logical and Physical Access Controls), CC7 (System Operations), and C1/C1.1-C1.2 (Confidentiality). Membranes are a strong technical control for CC6.1 (restrict logical access to authorised users) and CC7.2 (monitor system components for anomalies). Log every membrane violation (blocked or transformed field) as a security event for SOC2 audit evidence. Ensure the membrane audit log is tamper-evident (append-only, hash-chained) to support the integrity requirements of CC6.7.",
	CCPA: "CCPA context: Personal information includes any information that identifies, relates to, or could reasonably be linked with a California consumer or household. Membranes should enforce purpose-limitation: tag each workflow stage with the declared processing purpose, and block inter-stage transfers of consumer data when the receiving stage's purpose does not match the purpose for which the data was collected. Implement a deletion propagation mechanism: when a consumer exercises the right to deletion, all membrane checkpoints must be able to purge or flag affected records.",
	none: "No specific regulatory framework selected. Apply the principle of least privilege by default: each stage membrane should expose the minimum fields required for that stage's function, and block or mask all other fields. Use 'block' as the default action for unknown fields.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const MEMBRANE_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(clearance|level|tier|classification|label|annotate|tag.field|sensitivity)\b/i,
		detail:
			"Define clearance levels as an ordered enumeration before building any membrane rule. Example: ['public', 'internal', 'confidential', 'restricted', 'top-secret']. Every artifact field must carry a clearance_level annotation — fields without annotations must be treated as the highest clearance level by default (fail-closed). Store clearance annotations in a schema registry rather than in individual payload objects so the mapping can be updated without modifying application code. Validate annotations at the entry membrane — reject any artifact that contains unannotated fields rather than silently applying the default action.",
	},
	{
		pattern:
			/\b(entry.rule|entry.check|entry.membrane|gate|boundary.check|ingress|incoming|receive)\b/i,
		detail:
			"Entry rules are evaluated when an artifact attempts to cross into a membrane from a lower-clearance or external zone. Entry rules should: (1) validate the artifact's schema against the stage's declared input contract, (2) check each field's clearance_level against the membrane's ceiling, (3) apply the appropriate transformation action (block/mask/hash/anonymize) to non-compliant fields, (4) log the crossing event with all actions applied. Entry rules are the primary defence — they prevent contamination of the membrane's internal state by over-privileged data.",
	},
	{
		pattern:
			/\b(exit.rule|exit.check|exit.membrane|egress|outgoing|send|emit|handoff|transfer)\b/i,
		detail:
			"Exit rules are evaluated when an artifact leaves a membrane. They complement entry rules by ensuring the stage has not introduced new sensitive fields or modified existing ones beyond its authorisation. Exit rule checks: (1) no new fields with clearance_level above the destination membrane's ceiling unless explicitly authorised, (2) required fields are present (integrity check), (3) any field transformations applied during evolution are reversible or auditable. Exit rules are the secondary defence — they catch data that was inadvertently assembled within the membrane from multiple lower-sensitivity inputs.",
	},
	{
		pattern:
			/\b(evolution.rule|transform|process.within|within.membrane|internal|stage.logic)\b/i,
		detail:
			"Evolution rules govern how a stage processes data inside its membrane. Constraints: (1) a stage must not combine fields from different clearance levels into a new field with a lower clearance level than the highest component ('taint tracking' — a field synthesised from confidential + public sources inherits the confidential clearance), (2) any external API call made from within the membrane must be logged and the response treated as having the membrane's own clearance ceiling, (3) intermediate computation results that mix clearance levels must be annotated and not permitted to exit through a lower-clearance exit rule.",
	},
	{
		pattern:
			/\b(nested|hierarchy|p.system|membrane.in.membrane|zone.within|region|sub.membrane|inner.membrane)\b/i,
		detail:
			"Nested membranes follow a strict containment hierarchy: a child membrane's ceiling clearance cannot exceed its parent's ceiling. Data flows from inner to outer membranes must apply the outer membrane's exit rules on top of the inner membrane's exit rules — each boundary crossing is a distinct transformation event. P-systems formalisation: membranes are identified by unique region IDs; evolution rules are assigned per-region and execute concurrently but communicate only through defined inter-membrane channels. In practice, implement nesting as a chain of middleware transformations — each outer membrane wraps the inner membrane's output before passing it downstream.",
	},
	{
		pattern:
			/\b(block|drop|redact|prevent|deny|forbid|restrict|refuse|reject)\b/i,
		detail:
			"Use 'block' (field removal) when the downstream stage must not see the field at all — the field is simply absent from the transformed artifact. Distinguish blocking from masking: blocking produces a missing field (which downstream code must handle as optional); masking replaces the field value with a placeholder (which downstream code sees as a present-but-redacted value). Block is appropriate for: PII fields in analytics stages, authentication credentials in logging stages, commercial pricing in external-partner stages. Masking is appropriate for: display-layer stages that show the field name but not its value for auditing purposes.",
	},
	{
		pattern:
			/\b(mask|redact|replace.with|placeholder|token|pseudonym|de.identify)\b/i,
		detail:
			"Masking strategies by use case: static masking (replace with a fixed redaction marker like '***REDACTED***') is safe for logging stages; format-preserving masking (replace with a value in the same format, e.g., a fake phone number for a real phone number) is required for downstream stages that validate field format; tokenisation (replace with a reversible token stored in a vault accessible only to the controller) is required when the field must be re-identified in a later stage. Never apply the same masking token to multiple distinct values — a static token creates a mapping collision that leaks information about which records share a field value.",
	},
	{
		pattern:
			/\b(audit|log|record|trace|evidence|compliance.log|violation|breach|incident|event.log)\b/i,
		detail:
			"The membrane audit log must be: (1) append-only — no mutation or deletion of log entries, (2) structured — include artifact_id, stage_id, membrane_id, field_name, original_clearance_level, action_applied, timestamp, and operator_identity, (3) queryable — support retrieval by artifact_id and time range for incident investigation, (4) separate from the workflow execution log — audit logs may be required for regulatory inspection and must not be mingled with operational telemetry that is subject to rotation or truncation. For HIPAA and PCI-DSS, the audit log retention period is 6 years and 1 year respectively.",
	},
	{
		pattern:
			/\b(multi.tenant|multi.organ|separate.org|different.clearance|different.client|client.data|tenant.isolat)\b/i,
		detail:
			"Multi-tenant membrane deployments require per-tenant membrane configurations rather than a shared global rule set. Each tenant's workflow stages must operate within tenant-specific membranes so that Tenant A's data cannot cross into Tenant B's processing zone under any membrane rule. Implement tenant isolation as: (1) separate membrane_id namespaces per tenant, (2) no shared evolution rules that accept artifacts without a tenant identifier, (3) cross-tenant API calls mediated by a dedicated inter-tenant membrane with explicit logging of every such crossing. Validate tenant isolation with an automated penetration test that attempts to inject artifacts with mismatched tenant IDs at each membrane boundary.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const resilMembraneHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(membraneInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);

		// Stage 1 — absolute minimum signal check
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Membrane Orchestrator needs a workflow boundary description, clearance level structure, or data-isolation requirement before it can produce targeted membrane-design guidance.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		// Stage 2 — domain relevance check
		if (!hasMembraneSignal(combined) && signals.complexity === "simple") {
			return buildInsufficientSignalResult(
				context,
				"Membrane Orchestrator targets data-boundary enforcement between workflow stages using clearance-level annotations and per-membrane transformation rules. Describe the stages involved, what data must not cross, and any regulatory requirements to receive specific guidance.",
				"Mention the workflow stages, the sensitive fields or clearance levels involved, and any regulatory framework (HIPAA, GDPR, PCI-DSS) so the Membrane Orchestrator can produce targeted boundary-design advice.",
			);
		}

		// Match keyword rules
		const guidances: string[] = [
			"Model each workflow stage as its own membrane with an explicit clearance ceiling and a documented contract for what data may cross that boundary. Membranes are design-time policy layers here: they describe how to validate and transform artifacts at stage boundaries, not a live enforcement runtime.",
			"Define entry rules for every membrane boundary: validate the incoming artifact schema, resolve each field's clearance annotation, apply the configured transformation action to fields above the membrane ceiling, and fail closed on any unannotated field rather than allowing it through by default.",
			"Define evolution rules for processing inside the membrane: when a stage combines fields of different sensitivity, the derived field inherits the highest contributing clearance level, and any external API call made from within the membrane must be treated as occurring inside that same clearance zone for logging and review.",
			"Define exit rules separately from entry rules. Before data leaves the membrane, verify the destination stage is authorised for every field that now exists, confirm the stage did not synthesize a higher-clearance field for a lower-clearance consumer, and emit an audit record for the crossing outcome.",
		];

		guidances.push(
			...MEMBRANE_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		// Regulatory-framework advisory
		const opts = parsed.data.options;

		if (opts?.regulatoryFramework && opts.regulatoryFramework !== "none") {
			const note =
				REGULATORY_NOTES[opts.regulatoryFramework as RegulatoryFramework];
			if (note) guidances.unshift(note);
		}

		if (opts?.defaultAction) {
			const actionMap: Record<DefaultAction, string> = {
				block:
					"Default action 'block': all fields exceeding ceiling clearance are removed from artifacts at this membrane. Verify downstream stages handle missing optional fields gracefully.",
				mask: "Default action 'mask': fields exceeding ceiling are replaced with a redaction placeholder. Ensure downstream field-format validators are aware of the masking token format.",
				hash: "Default action 'hash': fields exceeding ceiling are replaced with a one-way hash. Do not use hash for fields that may appear in audit logs as hash values are searchable — use block for those fields.",
				anonymize:
					"Default action 'anonymize': identifying elements are removed or generalised. Define the anonymisation operation per-field type to avoid inconsistent anonymisation quality across fields.",
				allow:
					"Default action 'allow': WARNING — allowing all unknown fields through is an unsafe default for any membrane with a clearance ceiling. Change to 'block' before deploying to any production or regulated environment.",
			};
			const actionNote = actionMap[opts.defaultAction as DefaultAction];
			if (actionNote) guidances.unshift(actionNote);
		}

		if (
			opts?.auditRequired === true &&
			!guidances.some((g) => /audit/i.test(g))
		) {
			guidances.push(
				"Audit logging is enabled. Ensure the audit log captures: artifact_id, stage_id, membrane_id, field_name, clearance_level, action_applied, and timestamp for every crossing event including allowed fields. Use an append-only log store so audit entries are tamper-evident.",
			);
		}

		if (opts?.clearanceLevels && opts.clearanceLevels.length > 0) {
			guidances.unshift(
				`Clearance hierarchy (lowest to highest): ${opts.clearanceLevels.join(" < ")}. Fields annotated at each level must be blocked or transformed at any membrane whose ceiling is below that level. Validate that every artifact field in your workflow schema carries an explicit level annotation — unannotated fields default to the highest clearance level (fail-closed).`,
			);
		}

		// Fallback guidance when no rules matched
		if (guidances.length === 0) {
			guidances.push(
				"To design a Membrane Orchestrator: (1) enumerate your clearance levels from lowest to highest; (2) map each workflow stage to a membrane with a ceiling clearance level; (3) annotate every artifact field with its clearance level; (4) define entry, evolution, and exit rules per membrane; (5) choose a default action for unannotated or non-compliant fields; (6) enable audit logging for every membrane crossing.",
				"Start with a two-level hierarchy (internal / restricted) and one membrane boundary before introducing nested membranes — nested hierarchies compound rule complexity multiplicatively and are harder to audit.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply membrane boundaries under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints typically define which fields are per se restricted regardless of annotation and which regulatory audit requirements must be satisfied.`,
			);
		}

		guidances.push(RESIL_ADVISORY_DISCLAIMER);

		return createCapabilityResult(
			context,
			`Membrane Orchestrator produced ${guidances.length - 1} data-boundary guideline${guidances.length - 1 === 1 ? "" : "s"} for clearance-level enforcement between workflow stages. Results are advisory — validate boundary rules against your regulatory requirements before deployment.`,
			createFocusRecommendations(
				"Membrane guidance",
				guidances,
				context.model.modelClass,
			),
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	resilMembraneHandler,
);
