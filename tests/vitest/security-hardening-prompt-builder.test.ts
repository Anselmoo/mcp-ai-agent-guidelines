import { describe, expect, it } from "vitest";
import { securityHardeningPromptBuilder } from "../../src/tools/prompt/security-hardening-prompt-builder.js";

describe("security-hardening-prompt-builder", () => {
	it("should generate comprehensive security analysis prompt with OWASP risk framework", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext:
				"Express.js API endpoint with authentication vulnerabilities",
			securityFocus: "vulnerability-analysis",
			language: "javascript",
			securityRequirements: ["Input validation", "SQL injection prevention"],
			complianceStandards: ["OWASP-Top-10", "PCI-DSS"],
			riskTolerance: "low",
			analysisScope: ["input-validation", "authentication", "authorization"],
			includeMitigations: true,
			includeCodeExamples: true,
			prioritizeFindings: true,
		});

		const text = result.content[0].text;

		// Check for basic structure
		expect(text).toContain("🛡️ Security Hardening Prompt Template");
		expect(text).toContain("Security Vulnerability Analysis Prompt");

		// Check for OWASP risk framework
		expect(text).toContain("OWASP Risk Assessment Framework");
		expect(text).toContain(
			"Risk Calculation: Overall Risk = Likelihood × Impact",
		);
		expect(text).toContain("Likelihood Factors");
		expect(text).toContain("Impact Factors");

		// Check for Mermaid chart
		expect(text).toContain("```mermaid");
		expect(text).toContain("quadrantChart");
		expect(text).toContain("title Security Risk Assessment Matrix");
		expect(text).toContain("x-axis Low Impact --> High Impact");
		expect(text).toContain("y-axis Low Likelihood --> High Likelihood");

		// Check for enhanced risk assessment
		expect(text).toContain("Assess likelihood of exploitation");
		expect(text).toContain("Very High/High/Medium/Low/Very Low");
		expect(text).toContain("Apply OWASP Risk Rating methodology");

		// Check for compliance standards
		expect(text).toContain("OWASP Top 10");
		expect(text).toContain("PCI DSS");

		// Check for analysis scope
		expect(text).toContain("Input Validation");
		expect(text).toContain("Authentication");
		expect(text).toContain("Authorization");

		// Check for low risk tolerance specifics
		expect(text).toContain("Accept minimal risk only");
		expect(text).toContain("Require mitigation for Medium+ risk findings");
	});

	it("should generate compliance-focused prompt", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Healthcare API handling patient data",
			securityFocus: "compliance-check",
			complianceStandards: ["HIPAA", "GDPR"],
			riskTolerance: "medium",
			outputFormat: "checklist",
		});

		const text = result.content[0].text;

		expect(text).toContain("Security Compliance Review Prompt");
		expect(text).toContain("HIPAA");
		expect(text).toContain("GDPR");
		expect(text).toContain("checklist format");
		expect(text).toContain("Accept Low to Medium risk findings");
		expect(text).toContain("Require immediate action for High+ risk findings");
	});

	it("should generate threat modeling prompt with high risk tolerance", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Microservices architecture with API gateway",
			securityFocus: "threat-modeling",
			riskTolerance: "high",
			analysisScope: ["api-security", "configuration-security"],
			includeTestCases: true,
		});

		const text = result.content[0].text;

		expect(text).toContain("Security Threat Model Analysis Prompt");
		expect(text).toContain("Api Security");
		expect(text).toContain("Configuration Security");
		expect(text).toContain("Test Cases");
		expect(text).toContain("Accept Low to High risk findings");
		expect(text).toContain(
			"Require immediate action only for Critical risk findings",
		);
	});

	it("should generate penetration testing prompt with annotated code output", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Web application with file upload functionality",
			securityFocus: "penetration-testing",
			outputFormat: "annotated-code",
			framework: "React",
			includeCodeExamples: false,
		});

		const text = result.content[0].text;

		expect(text).toContain("Security Penetration Testing Review Prompt");
		expect(text).toContain("annotated code");
		expect(text).toContain("// SECURITY RISK:");
		expect(text).toContain("// SECURE FIX:");
		expect(text).toContain("// SECURITY ENHANCEMENT:");
		expect(text).toContain("React-specific security patterns");
	});

	it("should include all security analysis scope areas", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Full-stack application security review",
			analysisScope: [
				"input-validation",
				"authentication",
				"authorization",
				"data-encryption",
				"session-management",
				"error-handling",
				"logging-monitoring",
				"dependency-security",
				"configuration-security",
				"api-security",
			],
		});

		const text = result.content[0].text;

		// Check that all scope areas are properly formatted
		expect(text).toContain("Input Validation");
		expect(text).toContain("Authentication");
		expect(text).toContain("Authorization");
		expect(text).toContain("Data Encryption");
		expect(text).toContain("Session Management");
		expect(text).toContain("Error Handling");
		expect(text).toContain("Logging Monitoring");
		expect(text).toContain("Dependency Security");
		expect(text).toContain("Configuration Security");
		expect(text).toContain("Api Security");
	});

	it("should work with minimal configuration", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Simple Node.js application",
		});

		const text = result.content[0].text;

		expect(text).toContain("🛡️ Security Hardening Prompt Template");
		expect(text).toContain("Security Hardening Assessment Prompt");
		expect(text).toContain("auto-detect");
		expect(text).toContain("medium risk tolerance");
		expect(text).toContain("OWASP Risk Assessment Framework");
	});

	it("should handle all compliance standards", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Enterprise application",
			complianceStandards: [
				"OWASP-Top-10",
				"NIST-Cybersecurity-Framework",
				"ISO-27001",
				"SOC-2",
				"GDPR",
				"HIPAA",
				"PCI-DSS",
			],
		});

		const text = result.content[0].text;

		expect(text).toContain("OWASP Top 10");
		expect(text).toContain("NIST Cybersecurity Framework");
		expect(text).toContain("ISO 27001");
		expect(text).toContain("SOC 2");
		expect(text).toContain("GDPR");
		expect(text).toContain("HIPAA");
		expect(text).toContain("PCI DSS");
	});

	it("should exclude optional sections when configured", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			includeFrontmatter: false,
			includeMetadata: false,
			includeReferences: false,
			includeDisclaimer: false,
			includeTechniqueHints: false,
			includePitfalls: false,
		});

		const text = result.content[0].text;

		expect(text).not.toContain("---"); // No frontmatter
		expect(text).not.toContain("Generated by:"); // No metadata
		expect(text).not.toContain("## References"); // No references
		expect(text).not.toContain("## Disclaimer"); // No disclaimer
		expect(text).not.toContain("Technique Hints"); // No technique hints
		expect(text).not.toContain("Pitfalls to Avoid"); // No pitfalls
	});
});
