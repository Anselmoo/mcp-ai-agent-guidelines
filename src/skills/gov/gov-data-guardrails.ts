/**
 * gov-data-guardrails.ts
 *
 * Handwritten capability handler for the gov-data-guardrails skill.
 *
 * Domain: Implementing data handling guardrails — PII protection, secret
 * masking, and data minimisation for AI pipelines.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   resil-membrane                — clearance-level membrane boundary enforcement
 *   gov-workflow-compliance       — full workflow compliance validation
 *   gov-model-governance          — model selection and access-control policy
 *   gov-prompt-injection-hardening — injection hardening (distinct threat model)
 *
 * Outputs are ADVISORY ONLY — this handler does NOT enforce data policies,
 * redact fields from running pipelines, or satisfy regulatory obligations.
 */

import { z } from "zod";
import { gov_data_guardrails_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	hasDataGuardrailsSignal,
} from "./gov-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const dataGuardrailsInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			dataCategory: z
				.enum(["PII", "PHI", "financial", "credentials", "generic"])
				.optional()
				.describe(
					"Primary category of sensitive data the guardrail must protect. PII: name, address, national ID, email; PHI: health records, diagnoses; financial: card numbers, bank accounts; credentials: API keys, passwords, tokens; generic: any sensitive data not fitting other categories.",
				),
			regulatoryFramework: z
				.enum(["GDPR", "HIPAA", "CCPA", "PCI-DSS", "none"])
				.optional()
				.describe(
					"Regulatory framework governing data protection requirements. Controls which fields are per se protected and which transformation actions are permissible.",
				),
			minimisationStrategy: z
				.enum([
					"purpose-limitation",
					"anonymization",
					"pseudonymization",
					"encryption",
					"redaction",
				])
				.optional()
				.describe(
					"Primary data minimisation strategy to apply. purpose-limitation: only collect/forward fields required for the declared processing purpose; anonymization: remove identifying elements irreversibly; pseudonymization: replace identifiers with reversible tokens; encryption: protect fields at rest/in transit; redaction: mask or blank field values at output boundaries.",
				),
		})
		.optional(),
});

type DataCategory = "PII" | "PHI" | "financial" | "credentials" | "generic";
type RegulatoryFramework = "GDPR" | "HIPAA" | "CCPA" | "PCI-DSS" | "none";
type MinimisationStrategy =
	| "purpose-limitation"
	| "anonymization"
	| "pseudonymization"
	| "encryption"
	| "redaction";

// ─── Regulatory Notes ─────────────────────────────────────────────────────────

const REGULATORY_NOTES: Record<RegulatoryFramework, string> = {
	GDPR: "GDPR context: Personal data requires a lawful basis for processing. Apply data minimisation (Art. 5(1)(c)): only pass to the AI pipeline the fields strictly necessary for the declared purpose. Implement the right to erasure (Art. 17) by maintaining a field-level data map so that deletion can be propagated through all pipeline stages, caches, and logs. For AI-generated outputs, ensure no personal data from training leaks into responses ('output PII leakage' testing is mandatory before production deployment).",
	HIPAA:
		"HIPAA context: PHI includes 18 Safe Harbor identifier categories (name, geographic data smaller than state, dates except year, phone, fax, email, SSN, MRN, account numbers, certificate/license numbers, VINs, device identifiers, URLs, IPs, biometrics, photos, and unique identifiers). All 18 must be masked or removed before PHI is passed to an AI model unless a BAA (Business Associate Agreement) is in place with the model provider. Use Expert Determination instead of Safe Harbor only when a qualified statistician certifies re-identification risk < 0.09.",
	CCPA: "CCPA context: California consumers have the right to know, delete, and opt-out of sale of their personal information. For AI pipelines: (1) do not use opt-out consumer data for model training or inference; (2) implement deletion propagation to remove consumer data from AI context, embeddings, and cached completions; (3) tag every pipeline input with the consumer's opt-out status and gate inference calls accordingly.",
	"PCI-DSS":
		"PCI-DSS context: PANs (Primary Account Numbers) must be masked to show only the last 4 digits in any AI context window, log, or output. Sensitive Authentication Data (CVV, full track data, PINs) must NEVER enter the pipeline — block at the earliest possible boundary. If the workflow requires card data processing, ensure the AI component is scoped out of PCI-DSS compliance via network segmentation and does not store, process, or transmit cardholder data.",
	none: "No specific regulatory framework selected. Apply the principle of least privilege: only pass fields that the AI model strictly needs for the task. Default to pseudonymisation over anonymisation when downstream steps may require re-identification.",
};

// ─── Data Category Guidance ───────────────────────────────────────────────────

const DATA_CATEGORY_GUIDANCE: Record<DataCategory, string> = {
	PII: "PII guardrail: Enumerate all PII fields in the pipeline input schema before building guardrails — undocumented PII is the most common source of leakage. Apply field-level tags in your schema (e.g., 'sensitivity: pii') and route tagged fields through a transformation layer before they reach the model context. For structured inputs, use a schema registry with automatic PII detection; for unstructured text, apply NER-based detection + regex fallback for common patterns (email, phone, national ID formats).",
	PHI: "PHI guardrail: Any pipeline receiving EHR data, clinical notes, or insurance claims must be treated as a HIPAA-covered workflow regardless of the business relationship. Implement a PHI firewall at the pipeline ingress: validate all 18 Safe Harbor identifiers and apply de-identification before passing to the AI stage. Store de-identified data separately from the original records; never reconstruct PHI in the AI output layer without explicit re-identification gate.",
	financial:
		"Financial data guardrail: Apply format-preserving tokenisation for card numbers and account numbers so downstream validation (Luhn check, format validation) continues to work without exposing real values. Implement a financial data vault — store tokens in a PCI-compliant vault and never log the real-to-token mapping in application logs. For AI inference, only pass the last 4 digits of PANs and the institution name; never pass CVV/CVC or full account numbers.",
	credentials:
		"Credentials guardrail: Secrets (API keys, passwords, tokens, private keys) must never enter an AI context window — mask at the serialisation boundary before any field reaches the model. Use a secrets scanner (e.g., truffleHog, Gitleaks patterns) on all inputs before they are forwarded to the AI stage. For service credentials, replace with a reference identifier (e.g., 'api_key_ref: <vault-path>') that the model can acknowledge without the secret value being exposed.",
	generic:
		"Generic sensitive data guardrail: Without a specific category, apply conservative defaults: (1) identify fields that are sensitive by schema annotation or heuristic; (2) apply redaction by default, not allowlisting; (3) log every field transformation for audit; (4) review the guardrail scope quarterly as the pipeline data model evolves.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const DATA_GUARDRAILS_RULES: ReadonlyArray<{
	pattern: RegExp;
	detail: string;
}> = [
	{
		pattern:
			/\b(detect|identify|find|discover|scan|recogni[sz]e).*(pii|phi|sensitive|secret|credential)/i,
		detail:
			"PII/sensitive-data detection before AI ingestion: use a layered approach — (1) schema-level field tags as the first gate (catches known-structured data), (2) regex patterns for well-structured formats (email, SSN, phone, card number, IP address), (3) NER model scan for unstructured text (name, address, organisation). Never rely on a single detection layer. Route detected fields to a transformation queue before they reach the model context window; log all detections with field name, detection method, and confidence score.",
	},
	{
		pattern:
			/\b(mask|redact|replac|obfuscat|hide).*(pii|phi|secret|sensitive)/i,
		detail:
			"Masking strategy selection: static redaction ('***') is appropriate for log sinks; format-preserving masking is required when downstream code validates field format; tokenisation is required when the field must be re-identified in a later stage. Apply masking at the serialisation boundary — never pass a raw sensitive value to a log call, API response, or model context even 'temporarily'. Use a consistent masking token per field (not per call) so audit logs can correlate masked values across pipeline stages.",
	},
	{
		pattern:
			/\b(minimis|minimiz|reduce|limit|restrict|scope).*(data|field|context)/i,
		detail:
			"Data minimisation in AI context construction: audit the context window content before every model call. Strip fields that are not required by the current task — a context that includes billing address when the task is sentiment analysis is a data minimisation violation. Implement a context builder that assembles the minimum required fields from a schema-defined task template, rather than forwarding the full input record. Measure context minimisation rate (fraction of available fields actually included) as a governance metric.",
	},
	{
		pattern:
			/\b(output|response|completion|generation).*(leak|contain|include|expose|reveal)/i,
		detail:
			"Output PII leakage testing: AI models can reproduce training data or synthesise plausible-but-incorrect PII in their outputs. Implement output scanning that runs the same detection pipeline on model completions as on inputs. Establish a test suite with canary PII patterns (synthetic but realistic) to verify the output scanner catches leakage before production deployment. For RAG pipelines, scan retrieved chunks for PII before they are included in the context window — retrieval is the highest-risk PII leakage vector in production AI systems.",
	},
	{
		pattern:
			/\b(log|audit|trace|monitor|record).*(data|pii|phi|sensitive|access)/i,
		detail:
			"Data access logging for AI pipelines: log the metadata of sensitive field access (field name, classification, transformation applied, model call ID) without logging the field value itself. Enforce log sanitisation at the logging library level, not at individual call sites — call-site sanitisation is fragile and will eventually miss a path. Retain data-access logs separately from operational logs with a longer retention period to support regulatory audit requirements.",
	},
	{
		pattern: /\b(consent|permission|purpose|lawful.basis|opt.in|opt.out)/i,
		detail:
			"Consent and purpose-limitation enforcement: tag every data item at ingestion with its consent scope (the set of processing purposes the data subject has consented to). Gate AI inference calls with a consent scope check — reject calls where the task purpose is outside the data's consent scope. For multi-purpose pipelines, use the narrowest consent scope that covers the current task rather than relying on broad consent to justify all uses.",
	},
	{
		pattern: /\b(retention|ttl|expir|delete|purge|forget|erasure)/i,
		detail:
			"Data retention and the right to erasure: AI pipelines accumulate sensitive data in context caches, embedding stores, fine-tune datasets, and conversation histories. Build a data map that tracks every location where a data subject's information persists. Implement deletion propagation: when an erasure request arrives, it must reach all pipeline stages, not just the primary database. Test erasure completeness with a canary data injection — insert synthetic PII, trigger erasure, then verify detection returns zero hits across all pipeline stores.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const govDataGuardrailsHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Data Guardrails needs a description of the sensitive data type, pipeline stage, or regulatory requirement before it can produce targeted guardrail design guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;

		if (!hasDataGuardrailsSignal(combined) && signals.complexity === "simple") {
			return buildInsufficientSignalResult(
				context,
				"Data Guardrails targets PII protection, secret masking, and data minimisation in AI pipelines. Describe the data type (PII, credentials, PHI), where it enters the pipeline, and any regulatory requirements to receive specific guardrail design guidance.",
				"Mention the sensitive data type, the pipeline stage where it appears, and any applicable regulation (GDPR, HIPAA, PCI-DSS) so Data Guardrails can produce targeted protection advice.",
			);
		}

		const guidances: string[] = DATA_GUARDRAILS_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail);

		const parsed = parseSkillInput(dataGuardrailsInputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (opts?.regulatoryFramework && opts.regulatoryFramework !== "none") {
			const note =
				REGULATORY_NOTES[opts.regulatoryFramework as RegulatoryFramework];
			if (note) guidances.unshift(note);
		}

		if (opts?.dataCategory) {
			const categoryNote =
				DATA_CATEGORY_GUIDANCE[opts.dataCategory as DataCategory];
			if (categoryNote) guidances.unshift(categoryNote);
		}

		if (opts?.minimisationStrategy) {
			const strategyNotes: Record<MinimisationStrategy, string> = {
				"purpose-limitation":
					"Purpose-limitation strategy: define the processing purpose for each pipeline task and enforce that only fields required for that purpose are included in the AI context. Implement as a schema-driven context builder with a purpose-to-field allowlist; reject context assembly requests that reference fields outside the allowlist.",
				anonymization:
					"Anonymisation strategy: apply irreversible transformation that makes re-identification infeasible — generalise quasi-identifiers (age → age bracket), suppress rare values (k-anonymity), and add noise (differential privacy for numeric fields). Note: 'anonymised' data is no longer personal data under GDPR and HIPAA, so the anonymisation must be genuine — test with a re-identification attack using public auxiliary data before certifying anonymisation.",
				pseudonymization:
					"Pseudonymisation strategy: replace direct identifiers with reversible tokens managed in a separate key store accessible only to the data controller. The original data remains personal data under GDPR and PHI under HIPAA because re-identification is possible with the key. Use pseudonymisation to reduce risk while preserving the ability to re-identify for legitimate downstream processing (e.g., personalisation, correction). Store the token-to-identity mapping in a vault separate from the pipeline — never co-locate in the same database.",
				encryption:
					"Encryption strategy: encrypt sensitive fields at the column/field level in addition to transport and storage encryption. Use envelope encryption: a data encryption key (DEK) encrypts the field, a key encryption key (KEK) encrypts the DEK, and the KEK is managed by a KMS. For AI pipelines, decrypt only at the point of use — do not hold decrypted values in memory longer than the model call duration. Rotate DEKs on a schedule; support key revocation so that a compromised key makes historical data unrecoverable.",
				redaction:
					"Redaction strategy: replace sensitive field values with a static placeholder ('***REDACTED***') or format-preserving equivalent at the output boundary. Redaction is irreversible — use only when the downstream consumer does not need the field value (e.g., audit logs, external-partner responses). For AI context windows, redaction is appropriate when the model does not need the specific value (e.g., redact email address but include email domain for tone analysis). Document every redaction point in the pipeline data map.",
			};
			const note =
				strategyNotes[opts.minimisationStrategy as MinimisationStrategy];
			if (note) guidances.push(note);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To implement data guardrails for an AI pipeline: (1) map every field in the pipeline input schema and classify it by sensitivity; (2) define a transformation action per field class (PII → pseudonymise, credentials → block, generic sensitive → redact); (3) implement the transformation at the pipeline ingress, not at individual model call sites; (4) add output scanning to detect guardrail bypass; (5) test with synthetic canary data before production deployment.",
				"Treat data guardrails as a schema-level concern rather than a code-level concern — guardrails implemented via a schema registry are easier to audit, update, and extend than guardrails scattered across call sites.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply data guardrails under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints typically define which fields are per se protected regardless of context and which regulatory audit requirements must be satisfied within the pipeline.`,
			);
		}

		guidances.push(GOV_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Sensitive data control matrix",
				["Detect", "Transform", "Retain", "Escalate"],
				[
					{
						label: "PII",
						values: [
							"schema tags + NER + regex fallback",
							"pseudonymize or redact before context",
							"field-level lineage and deletion map",
							"escalate on unclassified personal data",
						],
					},
					{
						label: "PHI",
						values: [
							"PHI identifier scan at ingress",
							"de-identify before model access",
							"BAA-aware retention controls",
							"escalate any unmasked Safe Harbor field",
						],
					},
					{
						label: "Financial",
						values: [
							"PAN / account pattern detection",
							"tokenise or mask to last four digits",
							"vault-backed token mapping",
							"escalate CVV, PIN, or track data exposure",
						],
					},
					{
						label: "Credentials",
						values: [
							"secret scanners + schema checks",
							"block raw secrets from context",
							"reference-only secret handles",
							"escalate any attempt to forward a live secret",
						],
					},
				],
				"Maps the main sensitive-data classes to the controls that should appear at the pipeline boundary.",
			),
			buildOutputTemplateArtifact(
				"Data protection register",
				`| Field | Classification | Purpose | Transformation | Retention | Owner |
| --- | --- | --- | --- | --- | --- |`,
				[
					"Field",
					"Classification",
					"Purpose",
					"Transformation",
					"Retention",
					"Owner",
				],
				"Use this register to make field-level handling decisions explicit and auditable.",
			),
			buildToolChainArtifact(
				"Data guardrail workflow",
				[
					{
						tool: "schema inventory",
						description: "catalog every field before the first model call",
					},
					{
						tool: "sensitive-data detector",
						description:
							"apply layered detection for PII, PHI, secrets, and financial data",
					},
					{
						tool: "transformation layer",
						description:
							"pseudonymize, redact, tokenise, or block fields at ingress",
					},
					{
						tool: "output scanner",
						description: "re-run detection on completions before release",
					},
					{
						tool: "audit log",
						description:
							"record field name, action, and rationale for each transformation",
					},
				],
				"Carry the same control sequence from ingestion through output review so guardrails stay consistent across the pipeline.",
			),
			buildWorkedExampleArtifact(
				"PII redaction example",
				{
					input:
						"Customer email, phone number, and API key embedded in a support transcript.",
					pipelineStage: "model context assembly",
				},
				{
					detections: ["email", "phone number", "API key"],
					transformations: [
						"redact email and phone",
						"block the API key entirely",
						"log the field-level action without the secret value",
					],
					safeContext:
						"Customer requested order status; all direct identifiers removed before the model call.",
				},
				"Demonstrates the expected remediation path when multiple sensitive classes appear in one request.",
			),
			buildEvalCriteriaArtifact(
				"Guardrail readiness criteria",
				[
					"Every sensitive field has a declared classification and owner.",
					"Transformation happens before the model context is assembled.",
					"Output scanning covers the same sensitive classes as input scanning.",
					"Deletion requests propagate to logs, caches, and embeddings.",
					"Audit entries record the action taken without exposing the raw secret.",
				],
				"Use these criteria to decide whether a data guardrail design is ready for deployment review.",
			),
		];

		return createCapabilityResult(
			context,
			`Data Guardrails produced ${guidances.length - 1} data-protection guideline${guidances.length - 1 === 1 ? "" : "s"} for PII, secret, and sensitive-data handling in AI pipelines. Results are advisory — validate guardrail designs against your regulatory obligations and data-classification policy before deployment.`,
			createFocusRecommendations(
				"Data guardrail guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	govDataGuardrailsHandler,
);
