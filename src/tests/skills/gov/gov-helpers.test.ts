import { describe, expect, it } from "vitest";
import {
	GOV_ADVISORY_DISCLAIMER,
	hasDataGuardrailsSignal,
	hasModelCompatibilitySignal,
	hasModelGovernanceSignal,
	hasPolicyValidationSignal,
	hasPromptInjectionHardeningSignal,
	hasRegulatedWorkflowDesignSignal,
	hasWorkflowComplianceSignal,
} from "../../../skills/gov/gov-helpers.js";

describe("gov-helpers", () => {
	it("detects each governance subsystem by characteristic language", () => {
		const cases = [
			[hasDataGuardrailsSignal, "redact pii fields before the workflow runs"],
			[
				hasModelCompatibilitySignal,
				"assess context window regressions before model migration",
			],
			[
				hasModelGovernanceSignal,
				"pin model versions and control rollout policy",
			],
			[
				hasPolicyValidationSignal,
				"rego policy validation gate for the ai pipeline",
			],
			[
				hasPromptInjectionHardeningSignal,
				"harden against indirect prompt injection from untrusted content",
			],
			[
				hasRegulatedWorkflowDesignSignal,
				"design an audit trail with human oversight for healthcare ai",
			],
			[
				hasWorkflowComplianceSignal,
				"continuous compliance scan for the agent workflow",
			],
		] as const;

		for (const [detector, text] of cases) {
			expect(detector(text)).toBe(true);
			expect(detector("write a frontend component")).toBe(false);
		}
	});

	it("recognizes alternate governance signal clusters", () => {
		expect(
			hasDataGuardrailsSignal(
				"tokenize sensitive data to support data minimisation",
			),
		).toBe(true);
		expect(
			hasModelCompatibilitySignal("schema change risk during llm upgrade"),
		).toBe(true);
		expect(
			hasModelGovernanceSignal(
				"champion challenger model rollout with approval",
			),
		).toBe(true);
		expect(
			hasPolicyValidationSignal(
				"human review approval gate for the ai pipeline",
			),
		).toBe(true);
		expect(
			hasPromptInjectionHardeningSignal(
				"sanitize untrusted content to defend against malicious injection",
			),
		).toBe(true);
		expect(
			hasRegulatedWorkflowDesignSignal(
				"immutable audit log and non repudiation for legal ai",
			),
		).toBe(true);
		expect(
			hasWorkflowComplianceSignal(
				"assess governance drift across the agentic workflow",
			),
		).toBe(true);
	});

	it("exports an advisory disclaimer", () => {
		expect(GOV_ADVISORY_DISCLAIMER).toContain("advisory only");
		expect(GOV_ADVISORY_DISCLAIMER).toContain("legal counsel");
	});
});
