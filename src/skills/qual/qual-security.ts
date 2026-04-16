import { qual_security_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { extractRequestSignals } from "../shared/recommendations.js";

const SECURITY_REVIEW_RULES: Array<{ pattern: RegExp; finding: string }> = [
	{
		pattern: /\b(injection|sql|xss|command|eval|exec|template)\b/i,
		finding:
			"Audit all user-input-to-execution paths for injection: SQL injection, XSS, command injection, and template injection share the same root cause — untrusted input reaching an interpreter without sanitization.",
	},
	{
		pattern: /\b(auth|login|session|token|jwt|oauth|credential|password)\b/i,
		finding:
			"Review authentication and session management: verify token expiration, refresh token rotation, secure storage of credentials, and protection against session fixation — authentication bugs have the broadest blast radius.",
	},
	{
		pattern:
			/\b(secret|key|api.?key|env|config|hardcod|credential|password)\b/i,
		finding:
			"Scan for exposed secrets: hardcoded API keys, committed .env files, and secrets in logs or error messages are the most common credential exposure vectors — use a secret scanner and rotate any exposed credentials immediately.",
	},
	{
		pattern: /\b(access|permission|authori[sz]|rbac|acl|role|privilege)\b/i,
		finding:
			"Verify authorization boundaries: ensure every protected operation checks the caller's permissions at the server, not just the client — client-side authorization checks are a documentation convenience, not a security control.",
	},
	{
		pattern: /\b(encrypt|hash|salt|tls|https|certificate|crypto)\b/i,
		finding:
			"Audit cryptographic usage: verify TLS for all transport, salted hashing for stored passwords, and proper key management — weak or misconfigured cryptography is worse than no cryptography because it creates false confidence.",
	},
	{
		pattern: /\b(cors|origin|header|csp|referrer|x-frame|security.?header)\b/i,
		finding:
			"Review security headers and CORS policy: misconfigured CORS, missing CSP, and absent security headers are the most common web application security gaps — each header should have explicit deny-by-default configuration.",
	},
	{
		pattern: /\b(prompt|llm|model|ai|agent|tool|mcp)\b/i,
		finding:
			"Audit AI-specific attack surfaces: prompt injection, tool-misuse escalation, and indirect injection via retrieved content are the primary threats for LLM-backed systems — separate trusted system prompts from untrusted user/tool input.",
	},
	{
		pattern: /\b(log|audit|monitor|trace|alert|siem)\b/i,
		finding:
			"Verify security logging: authentication failures, authorization denials, and sensitive data access should generate audit events with enough context for incident investigation — logging without alerting is a compliance artifact, not a security control.",
	},
];

function buildSecurityReviewExample() {
	return {
		surface: "JWT-protected approval export endpoint",
		risks: [
			"Refresh tokens do not rotate after use",
			"RBAC checks are enforced in the UI but not at the server boundary",
			"Prompt-injected retrieved content can influence tool selection",
		],
		controls: [
			"Rotate refresh tokens and expire compromised sessions",
			"Enforce authorization on the server for every export action",
			"Treat retrieved content as untrusted input and isolate tool-call policy from it",
		],
	};
}

const qualSecurityHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Security Review needs code, an architecture description, or a specific security concern before it can produce targeted findings.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = SECURITY_REVIEW_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ finding }) => finding);

		if (findings.length === 0) {
			findings.push(
				"Build an attack-surface packet that names external inputs, interpreters, authentication boundaries, privileged actions, sensitive data stores, and audit events. Security review should start from concrete surfaces and controls, not a generic reminder to be careful.",
				signals.hasContext
					? "Apply the security review to the provided context: trace each high-risk input surface to the code path or configuration that enforces the control."
					: "Provide the code, architecture diagram, or deployment configuration so the review can map concrete attack paths and controls.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply security constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Map each constraint to a verifiable security control.`,
			);
		}

		return createCapabilityResult(
			context,
			`Security Review identified ${findings.length} security finding${findings.length === 1 ? "" : "s"} across input validation, authentication, and data protection dimensions.`,
			createFocusRecommendations(
				"Security finding",
				findings,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Security surface matrix",
					["Surface", "Primary review question", "Concrete output"],
					[
						{
							label: "Input to execution path",
							values: [
								"Can untrusted input reach an interpreter or privileged tool?",
								"Trace with sanitization and validation evidence",
								"Shows whether injection risk is real or mitigated",
							],
						},
						{
							label: "Authentication / session",
							values: [
								"How are users authenticated, refreshed, and revoked?",
								"Session lifecycle notes with expiry and rotation rules",
								"Shows whether compromised credentials stay valid too long",
							],
						},
						{
							label: "Authorization",
							values: [
								"Where is access enforced and what happens on denial?",
								"Server-side authorization map per privileged action",
								"Shows whether permissions are enforced at the real boundary",
							],
						},
						{
							label: "Secrets / AI surfaces",
							values: [
								"Can secrets leak or can prompts steer tool use unsafely?",
								"Control list for secret handling and prompt/tool isolation",
								"Shows whether the platform is safe under adversarial input",
							],
						},
					],
					"Reference matrix for turning a security review into concrete control checks and attack traces.",
				),
				buildOutputTemplateArtifact(
					"Security review packet template",
					[
						"# Security review packet",
						"## Surface / component",
						"## Threat or abuse case",
						"## Entry point",
						"## Existing control",
						"## Evidence",
						"## Residual risk",
						"## Required fix or verification",
					].join("\n"),
					[
						"Surface / component",
						"Threat or abuse case",
						"Entry point",
						"Existing control",
						"Evidence",
						"Residual risk",
						"Required fix or verification",
					],
					"Use one packet per security finding so the review stays tied to specific surfaces, controls, and proofs.",
				),
				buildToolChainArtifact(
					"Attack path review chain",
					[
						{
							tool: "surface inventory",
							description:
								"list the external inputs, privileged actions, and sensitive data flows under review",
						},
						{
							tool: "control tracing",
							description:
								"follow each risky path to the code or config that enforces the control",
						},
						{
							tool: "residual risk check",
							description:
								"document what is still unproven, missing, or bypassable after the trace",
						},
					],
					"Three-step loop for converting a security concern into a concrete attack-path review.",
				),
				buildEvalCriteriaArtifact(
					"Security verification checklist",
					[
						"Each finding names the vulnerable or privileged surface explicitly.",
						"Controls are traced to code, configuration, or operational evidence.",
						"Residual risk is stated instead of implied.",
						"Required fixes or verification steps are concrete enough to assign and test.",
					],
					"Checklist for deciding whether the security review is concrete enough to act on or escalate.",
				),
				buildWorkedExampleArtifact(
					"Security threat trace example",
					{
						request:
							"Review JWT auth, hardcoded secrets, prompt injection, RBAC, and audit logging in this agent platform",
					},
					buildSecurityReviewExample(),
					"Worked example showing the review shape for an auth, authorization, and AI-surface security pass.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	qualSecurityHandler,
);
