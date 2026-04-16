/**
 * gov-handlers.test.ts
 *
 * Focused tests for the gov domain handwritten capability handlers:
 *   - gov-data-guardrails             (PII protection, secret masking, data minimisation)
 *   - gov-model-compatibility         (model upgrade / migration assessment)
 *   - gov-model-governance            (version pinning, lifecycle, deployment policy)
 *   - gov-policy-validation           (policy-as-code and compliance gate validation)
 *   - gov-prompt-injection-hardening  (injection hardening for AI pipelines)
 *   - gov-regulated-workflow-design   (regulated-industry AI workflow design)
 *   - gov-workflow-compliance         (end-to-end workflow compliance assessment)
 *
 * Verified contracts per handler:
 *   1. Capability mode — promoted handler returns executionMode === "capability".
 *   2. Signal-driven recommendations — domain keyword rules fire; details
 *      reference domain-specific terms, not manifest text echo.
 *   3a. Insufficient-signal guard (stage 1) — stop-word-only request with no
 *       context fires the generic "provide more detail" advisory.
 *   3b. Insufficient-signal guard (stage 2) — simple generic request without
 *       domain-distinctive signal fires a skill-specific guard.
 *   4. Validated options — enum-constrained options produce advisory output;
 *      no free-form numeric scraping.
 *   5. Summary non-leakage — raw request text is not reproduced verbatim in
 *      the result summary field.
 *   6. Advisory wording — outputs contain GOV_ADVISORY_DISCLAIMER language
 *      and do not claim live enforcement.
 *   7. Sibling boundary — each handler stays within its declared scope.
 *   8. Signal detector purity — helper functions produce correct boolean results.
 */

import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as govDataGuardrailsModule } from "../skills/gov/gov-data-guardrails.js";
import {
	hasDataGuardrailsSignal,
	hasModelCompatibilitySignal,
	hasModelGovernanceSignal,
	hasPolicyValidationSignal,
	hasPromptInjectionHardeningSignal,
	hasRegulatedWorkflowDesignSignal,
	hasWorkflowComplianceSignal,
} from "../skills/gov/gov-helpers.js";
import { skillModule as govModelCompatibilityModule } from "../skills/gov/gov-model-compatibility.js";
import { skillModule as govModelGovernanceModule } from "../skills/gov/gov-model-governance.js";
import { skillModule as govPolicyValidationModule } from "../skills/gov/gov-policy-validation.js";
import { skillModule as govPromptInjectionHardeningModule } from "../skills/gov/gov-prompt-injection-hardening.js";
import { skillModule as govRegulatedWorkflowDesignModule } from "../skills/gov/gov-regulated-workflow-design.js";
import { skillModule as govWorkflowComplianceModule } from "../skills/gov/gov-workflow-compliance.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

// ─── Runtime Factory ──────────────────────────────────────────────────────────

function createRuntime() {
	return {
		sessionId: "test-gov-handlers",
		executionState: {
			instructionStack: [],
			progressRecords: [],
		},
		sessionStore: {
			async readSessionHistory() {
				return [];
			},
			async writeSessionHistory() {
				return;
			},
			async appendSessionHistory() {
				return;
			},
		},
		instructionRegistry: new InstructionRegistry(),
		skillRegistry: new SkillRegistry({ workspace: null }),
		modelRouter: new ModelRouter(),
		workflowEngine: new WorkflowEngine(),
	};
}

// ─── Signal Detector Unit Tests ───────────────────────────────────────────────

describe("gov-helpers — signal detectors", () => {
	it("hasDataGuardrailsSignal detects PII / masking vocabulary", () => {
		expect(hasDataGuardrailsSignal("handle PII safely in the pipeline")).toBe(
			true,
		);
		expect(
			hasDataGuardrailsSignal("mask sensitive data in AI workflow context"),
		).toBe(true);
		expect(hasDataGuardrailsSignal("GDPR data minimisation for agents")).toBe(
			true,
		);
		expect(
			hasDataGuardrailsSignal("redact secrets from the prompt context"),
		).toBe(true);
		expect(hasDataGuardrailsSignal("improve response quality")).toBe(false);
	});

	it("hasModelCompatibilitySignal detects upgrade / migration vocabulary", () => {
		expect(
			hasModelCompatibilitySignal("check model compatibility before upgrade"),
		).toBe(true);
		expect(
			hasModelCompatibilitySignal("model migration assessment for workflow"),
		).toBe(true);
		expect(
			hasModelCompatibilitySignal(
				"context window token limit difference for LLM",
			),
		).toBe(true);
		expect(
			hasModelCompatibilitySignal(
				"regression breaking change backward compat model",
			),
		).toBe(true);
		expect(hasModelCompatibilitySignal("increase agent count")).toBe(false);
	});

	it("hasModelGovernanceSignal detects version-pinning / lifecycle vocabulary", () => {
		expect(hasModelGovernanceSignal("pin model version in production")).toBe(
			true,
		);
		expect(
			hasModelGovernanceSignal("model registry governance lifecycle policy"),
		).toBe(true);
		expect(
			hasModelGovernanceSignal("deploy model canary rollout blue-green"),
		).toBe(true);
		expect(
			hasModelGovernanceSignal(
				"approved model catalog allowlist selection audit",
			),
		).toBe(true);
		expect(hasModelGovernanceSignal("write unit tests")).toBe(false);
	});

	it("hasPolicyValidationSignal detects policy-as-code / compliance-gate vocabulary", () => {
		expect(
			hasPolicyValidationSignal("validate policy compliance check AI workflow"),
		).toBe(true);
		expect(
			hasPolicyValidationSignal("OPA policy-as-code governance rule engine"),
		).toBe(true);
		expect(
			hasPolicyValidationSignal(
				"NIST EU-AI-Act responsible AI risk assessment",
			),
		).toBe(true);
		expect(
			hasPolicyValidationSignal(
				"compliance gate pre-deploy check AI mandatory",
			),
		).toBe(true);
		expect(hasPolicyValidationSignal("refactor the database layer")).toBe(
			false,
		);
	});

	it("hasPromptInjectionHardeningSignal detects injection / hardening vocabulary", () => {
		expect(
			hasPromptInjectionHardeningSignal(
				"harden against prompt injection attack defense",
			),
		).toBe(true);
		expect(
			hasPromptInjectionHardeningSignal("RAG injection indirect injection"),
		).toBe(true);
		expect(
			hasPromptInjectionHardeningSignal(
				"harden sanitize input validate against injection malicious exploit",
			),
		).toBe(true);
		expect(
			hasPromptInjectionHardeningSignal("improve model output quality"),
		).toBe(false);
	});

	it("hasRegulatedWorkflowDesignSignal detects regulated-industry vocabulary", () => {
		expect(
			hasRegulatedWorkflowDesignSignal(
				"design compliant healthcare AI workflow",
			),
		).toBe(true);
		expect(
			hasRegulatedWorkflowDesignSignal("audit trail approval gate compliance"),
		).toBe(true);
		expect(
			hasRegulatedWorkflowDesignSignal(
				"auditability traceability compliant workflow pipeline",
			),
		).toBe(true);
		expect(hasRegulatedWorkflowDesignSignal("add caching layer")).toBe(false);
	});

	it("hasWorkflowComplianceSignal detects compliance-validation vocabulary", () => {
		expect(
			hasWorkflowComplianceSignal(
				"workflow compliance validation governance posture",
			),
		).toBe(true);
		expect(
			hasWorkflowComplianceSignal(
				"enforce policy violation remediate non-compliant workflow",
			),
		).toBe(true);
		expect(
			hasWorkflowComplianceSignal(
				"continuous compliance monitor drift governance baseline",
			),
		).toBe(true);
		expect(hasWorkflowComplianceSignal("optimise prompt length")).toBe(false);
	});
});

// ─── gov-data-guardrails ──────────────────────────────────────────────────────

describe("gov-data-guardrails handler", () => {
	it("returns executionMode capability", async () => {
		const result = await govDataGuardrailsModule.run(
			{
				request:
					"How do I protect PII and mask secrets in my AI pipeline before they reach the model?",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gov-data-guardrails");
	});

	it("fires detection/masking rules on domain keywords", async () => {
		const result = await govDataGuardrailsModule.run(
			{
				request:
					"Detect and redact PII fields before passing data to the AI model. Need to mask email, phone, and SSN.",
				context:
					"Pipeline ingests customer support tickets. Must comply with GDPR.",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/detect|pii|mask|redact/i);
	});

	it("stage 1 guard — stop-word-only request fires insufficient signal", async () => {
		const result = await govDataGuardrailsModule.run(
			{ request: "it the is a and" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — vague simple request fires domain-specific guard", async () => {
		const result = await govDataGuardrailsModule.run(
			{ request: "make it safer" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("dataCategory option produces category-specific guidance", async () => {
		const result = await govDataGuardrailsModule.run(
			{
				request: "Protect sensitive data in my pipeline",
				options: { dataCategory: "credentials" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/credential|api.key|secret|password|vault/i);
	});

	it("regulatoryFramework option produces framework-specific guidance", async () => {
		const result = await govDataGuardrailsModule.run(
			{
				request: "Handle personal data safely in my AI pipeline",
				options: { regulatoryFramework: "GDPR" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/gdpr|lawful.basis|minimis|erasure/i);
	});

	it("minimisationStrategy option produces strategy-specific guidance", async () => {
		const result = await govDataGuardrailsModule.run(
			{
				request: "Apply data minimisation to my AI pipeline",
				options: { minimisationStrategy: "pseudonymization" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/pseudonymis|token|vault|reversible/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await govDataGuardrailsModule.run(
			{
				request:
					"Implement PII protection and data minimisation guardrails for my AI pipeline",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Handle PII safely and mask secrets before they reach the model in my pipeline";
		const result = await govDataGuardrailsModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});

	it("does not bleed into model-governance advice", async () => {
		const result = await govDataGuardrailsModule.run(
			{
				request:
					"Mask PII fields and redact credentials from the AI context window",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should not contain model-governance-specific pinning advice
		expect(details).not.toMatch(/version.pin|model.registry|lifecycle.stage/i);
	});
});

// ─── gov-model-compatibility ──────────────────────────────────────────────────

describe("gov-model-compatibility handler", () => {
	it("returns executionMode capability", async () => {
		const result = await govModelCompatibilityModule.run(
			{
				request:
					"Check model compatibility before upgrading from GPT-4 to Claude — what could break in my workflow?",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gov-model-compatibility");
	});

	it("fires context-window rules on relevant keywords", async () => {
		const result = await govModelCompatibilityModule.run(
			{
				request:
					"Upgrading model — need to check context window token limits and potential truncation",
				context: "Pipeline uses 12k token prompts. New model has 8k window.",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/context.window|token.limit|truncat/i);
	});

	it("stage 1 guard — fires on empty keywords", async () => {
		const result = await govModelCompatibilityModule.run(
			{ request: "the is a and" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — simple vague request fires domain guard", async () => {
		const result = await govModelCompatibilityModule.run(
			{ request: "is the new version ok" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("compatibilityDimension option produces dimension-specific guidance", async () => {
		const result = await govModelCompatibilityModule.run(
			{
				request: "Assess compatibility for model migration",
				options: { compatibilityDimension: "output-format" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/output.format|json|schema|structured/i);
	});

	it("migrationRisk option produces risk-level guidance", async () => {
		const result = await govModelCompatibilityModule.run(
			{
				request: "Migrate to new model version safely",
				options: { migrationRisk: "high" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/high.risk|major.release|compatibility.matrix|breaking.change/i,
		);
	});

	it("rolloutStrategy option produces rollout-specific guidance", async () => {
		const result = await govModelCompatibilityModule.run(
			{
				request: "Deploy new model with canary rollout strategy",
				options: { rolloutStrategy: "canary" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/canary|traffic|fraction|baseline/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await govModelCompatibilityModule.run(
			{
				request:
					"Assess compatibility when switching from GPT-4 to Llama for my workflow",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Check model compatibility before upgrading my LLM workflow";
		const result = await govModelCompatibilityModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});
});

// ─── gov-model-governance ────────────────────────────────────────────────────

describe("gov-model-governance handler", () => {
	it("returns executionMode capability", async () => {
		const result = await govModelGovernanceModule.run(
			{
				request:
					"How do I govern model versions and pin the exact model in production deployments?",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gov-model-governance");
	});

	it("fires registry rules on relevant keywords", async () => {
		const result = await govModelGovernanceModule.run(
			{
				request:
					"Build a model registry catalog with approved models and access control policies",
				context: "Organisation has 5 teams using different models.",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/registry|catalog|approved|allowlist/i);
	});

	it("stage 1 guard — fires on stop-word-only request", async () => {
		const result = await govModelGovernanceModule.run(
			{ request: "the and or but" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — vague request fires domain guard", async () => {
		const result = await govModelGovernanceModule.run(
			{ request: "manage my models" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("lifecycleStage option produces stage-specific guidance", async () => {
		const result = await govModelGovernanceModule.run(
			{
				request: "Govern model deployment",
				options: { lifecycleStage: "deprecation" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/deprecat|end.of.life|migration|successor/i);
	});

	it("deploymentEnvironment option produces environment-specific guidance", async () => {
		const result = await govModelGovernanceModule.run(
			{
				request: "Govern model version pinning",
				options: { deploymentEnvironment: "production" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/production|approval|rollback|compliance/i);
	});

	it("versionStrategy option produces strategy-specific guidance", async () => {
		const result = await govModelGovernanceModule.run(
			{
				request: "Pin model version in CI/CD pipeline",
				options: { versionStrategy: "exact-pin" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/exact.pin|reproducib|regression.test|version.string/i,
		);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await govModelGovernanceModule.run(
			{
				request:
					"Govern model lifecycle from selection through deprecation with audit trails",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Govern model versions and pin exact versions in the production registry";
		const result = await govModelGovernanceModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});

	it("audit-trail rules fire on audit keyword", async () => {
		const result = await govModelGovernanceModule.run(
			{
				request:
					"Maintain immutable audit log of all model governance events and deployment history",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/audit|immutable|log|deployment/i);
	});
});

// ─── gov-policy-validation ───────────────────────────────────────────────────

describe("gov-policy-validation handler", () => {
	it("returns executionMode capability", async () => {
		const result = await govPolicyValidationModule.run(
			{
				request:
					"Validate our AI workflow against GDPR and organisational data governance policy",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gov-policy-validation");
	});

	it("fires policy-as-code rules on OPA/Rego keywords", async () => {
		const result = await govPolicyValidationModule.run(
			{
				request:
					"Implement policy-as-code using OPA Rego rules for AI governance compliance check",
				context:
					"Multiple teams deploying AI pipelines with different policies.",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/opa|open.policy|rego|policy.as.code|machine.readable/i,
		);
	});

	it("stage 1 guard — fires on empty keywords", async () => {
		const result = await govPolicyValidationModule.run(
			{ request: "is the and a" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — vague request fires domain guard", async () => {
		const result = await govPolicyValidationModule.run(
			{ request: "check compliance" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("complianceFramework option produces framework-specific guidance", async () => {
		const result = await govPolicyValidationModule.run(
			{
				request: "Validate AI workflow against compliance framework",
				options: { complianceFramework: "EU-AI-Act" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/eu.ai.act|high.risk|conformity|transparency/i);
	});

	it("policyType option produces policy-type-specific guidance", async () => {
		const result = await govPolicyValidationModule.run(
			{
				request: "Validate against ethical policy requirements",
				options: { policyType: "ethical" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/ethical|fairness|bias|transparency|non.discriminat/i,
		);
	});

	it("validationDepth option produces depth-specific guidance", async () => {
		const result = await govPolicyValidationModule.run(
			{
				request: "Perform behavioral policy validation",
				options: { validationDepth: "behavioral" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/behavioral|test.suite|adversarial|output/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await govPolicyValidationModule.run(
			{
				request:
					"Run compliance validation for our AI pipeline against all applicable policies",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Validate AI workflow and prompts against organisational compliance policy";
		const result = await govPolicyValidationModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});
});

// ─── gov-prompt-injection-hardening ──────────────────────────────────────────

describe("gov-prompt-injection-hardening handler", () => {
	it("returns executionMode capability", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{
				request:
					"Harden my RAG pipeline against prompt injection and indirect injection attacks",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gov-prompt-injection-hardening");
	});

	it("fires delimiter rules on structural-defence keywords", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{
				request:
					"Use delimiters and structural markers to separate trust zones in the prompt",
				context: "Agent receives untrusted user input that reaches the model.",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/delimiter|structural.marker|trust.zone/i);
	});

	it("stage 1 guard — fires on stop-word-only request", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{ request: "a the is and" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — vague request fires domain guard", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{ request: "make it more secure" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("injectionVector option produces vector-specific guidance", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{
				request: "Protect my pipeline from injection",
				options: { injectionVector: "rag-context" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/rag|retrieval|chunk|untrusted|poisoning/i);
	});

	it("defenseDepth option produces depth-specific guidance", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{
				request: "Implement sandboxed prompt execution",
				options: { defenseDepth: "sandboxing" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/sandbox|isolat|mediation|action.space/i);
	});

	it("trustBoundary option produces trust-level guidance", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{
				request: "Harden against untrusted input",
				options: { trustBoundary: "untrusted-input" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/untrusted|maximum.hardening|adversarial/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{
				request:
					"Defend my AI agent against prompt injection and instruction hijacking",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Harden against prompt injection attacks in my RAG-based AI pipeline";
		const result = await govPromptInjectionHardeningModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});

	it("red-team rules fire on red-team keywords", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{
				request:
					"Run a red team adversarial test injection simulation for the AI system",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/red.team|adversarial|attack.taxonomy|regression/i);
	});

	it("does not bleed into data-guardrails PII advice", async () => {
		const result = await govPromptInjectionHardeningModule.run(
			{
				request:
					"Protect my AI pipeline against prompt injection and instruction hijacking",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Injection hardening should not produce data-classification masking advice
		expect(details).not.toMatch(/gdpr.art.5|right.to.erasure|18.safe.harbor/i);
	});
});

// ─── gov-regulated-workflow-design ───────────────────────────────────────────

describe("gov-regulated-workflow-design handler", () => {
	it("returns executionMode capability", async () => {
		const result = await govRegulatedWorkflowDesignModule.run(
			{
				request:
					"Design a compliant AI workflow for clinical decision support with audit trails and human oversight",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gov-regulated-workflow-design");
	});

	it("fires audit-trail rules on auditability keywords", async () => {
		const result = await govRegulatedWorkflowDesignModule.run(
			{
				request:
					"Design AI workflow with audit trail, decision traceability, and tamper-evident log",
				context:
					"Healthcare AI system processing clinical notes for diagnosis support.",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/audit.trail|decision.chain|immutable|log/i);
	});

	it("stage 1 guard — fires on stop-word-only request", async () => {
		const result = await govRegulatedWorkflowDesignModule.run(
			{ request: "is the a and or" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — vague request fires domain guard", async () => {
		const result = await govRegulatedWorkflowDesignModule.run(
			{ request: "build an AI workflow" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("regulatedIndustry option produces industry-specific guidance", async () => {
		const result = await govRegulatedWorkflowDesignModule.run(
			{
				request: "Design regulated AI workflow",
				options: { regulatedIndustry: "finance" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/finance|model.risk|sr.11.7|independent.validation|adverse.action/i,
		);
	});

	it("approvalGateType option produces gate-type guidance", async () => {
		const result = await govRegulatedWorkflowDesignModule.run(
			{
				request: "Add approval gates to regulated workflow",
				options: { approvalGateType: "dual-approval" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/dual.approval|four.eyes|independent|disagree/i);
	});

	it("auditLevel option produces audit-depth guidance", async () => {
		const result = await govRegulatedWorkflowDesignModule.run(
			{
				request: "Configure forensic audit logging",
				options: { auditLevel: "forensic" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/forensic|immutable|hash.chain|context.window|tamper/i,
		);
	});

	it("explainability rules fire on XAI keywords", async () => {
		const result = await govRegulatedWorkflowDesignModule.run(
			{
				request:
					"How do I add explainability to regulated AI decisions for transparent reasoning?",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/explainab|interpret|reason|transparent/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await govRegulatedWorkflowDesignModule.run(
			{
				request:
					"Design HIPAA-compliant AI workflow with human oversight and compliance trail",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Design a regulated AI workflow for healthcare with auditability and approval gates";
		const result = await govRegulatedWorkflowDesignModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});
});

// ─── gov-workflow-compliance ──────────────────────────────────────────────────

describe("gov-workflow-compliance handler", () => {
	it("returns executionMode capability", async () => {
		const result = await govWorkflowComplianceModule.run(
			{
				request:
					"Validate our AI pipeline against governance and compliance requirements",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gov-workflow-compliance");
	});

	it("fires compliance-posture rules on assessment keywords", async () => {
		const result = await govWorkflowComplianceModule.run(
			{
				request:
					"Assess compliance posture and build a compliance dashboard for our AI pipeline",
				context:
					"AI pipeline serves customer-facing recommendations. GDPR applies.",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/compliance.posture|dashboard|gap|metric/i);
	});

	it("stage 1 guard — fires on stop-word-only request", async () => {
		const result = await govWorkflowComplianceModule.run(
			{ request: "a and the is" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — vague request fires domain guard", async () => {
		const result = await govWorkflowComplianceModule.run(
			{ request: "check everything" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("complianceScope option produces scope-specific guidance", async () => {
		const result = await govWorkflowComplianceModule.run(
			{
				request: "Assess workflow compliance",
				options: { complianceScope: "access-control" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/access.control|authentication|authoris|permission|privilege/i,
		);
	});

	it("workflowType option produces workflow-type guidance", async () => {
		const result = await govWorkflowComplianceModule.run(
			{
				request: "Validate compliance of agentic AI workflow",
				options: { workflowType: "agentic" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/agentic|action.scope|irreversible|rollback/i);
	});

	it("nonComplianceAction option produces action-specific guidance", async () => {
		const result = await govWorkflowComplianceModule.run(
			{
				request: "Handle compliance violations in the pipeline",
				options: { nonComplianceAction: "escalate" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/escalat|compliance.team|incident.queue|sla/i);
	});

	it("remediation rules fire on gap/fix keywords", async () => {
		const result = await govWorkflowComplianceModule.run(
			{
				request:
					"Remediate compliance gaps and fix non-compliant items in the AI workflow",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/remediat|compliance.gap|severity|effort|prioritis/i,
		);
	});

	it("continuous-compliance rules fire on drift keywords", async () => {
		const result = await govWorkflowComplianceModule.run(
			{
				request:
					"Implement continuous compliance monitoring to detect policy drift",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/continuous.compliance|drift|monitor|baseline/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await govWorkflowComplianceModule.run(
			{
				request:
					"Validate AI workflow against full compliance requirements including data and model usage",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Validate this AI workflow against policy compliance and governance requirements";
		const result = await govWorkflowComplianceModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});

	it("does not bleed into injection-hardening advice", async () => {
		const result = await govWorkflowComplianceModule.run(
			{
				request:
					"Validate compliance of the AI workflow pipeline against governance policy",
				options: { workflowType: "rag" },
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Workflow compliance should not produce injection-specific hardening patterns
		expect(details).not.toMatch(
			/adversarial.prompt|jailbreak|privilege.escalat.*injection/i,
		);
	});
});
