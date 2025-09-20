import { describe, expect, it } from "vitest";
import { getPrompt } from "../../src/prompts/index.js";

describe("security-analysis-prompt", () => {
	it("should generate comprehensive security analysis prompt with OWASP risk framework", async () => {
		const result = await getPrompt("security-analysis-prompt", {
			codebase: "Node.js Express API with authentication endpoints",
			security_focus: "vulnerability-analysis",
			language: "javascript",
			compliance_standards: ["OWASP-Top-10", "NIST-Cybersecurity-Framework"],
			risk_tolerance: "low",
		});

		const text = result.messages[0].content.text;

		// Check for OWASP risk framework
		expect(text).toContain("Risk Assessment Framework");
		expect(text).toContain("OWASP Risk Rating Methodology");
		expect(text).toContain("Overall Risk = Likelihood × Impact");
		expect(text).toContain("Likelihood Factors");
		expect(text).toContain("Impact Factors");

		// Check for Mermaid chart
		expect(text).toContain("```mermaid");
		expect(text).toContain("quadrantChart");
		expect(text).toContain("title Security Risk Assessment Matrix");
		expect(text).toContain("Immediate Action Required");
		expect(text).toContain("Monitor & Review");

		// Check for enhanced risk assessment
		expect(text).toContain("Assess likelihood of exploitation");
		expect(text).toContain("Very High/High/Medium/Low/Very Low");
		expect(text).toContain("Apply OWASP Risk Rating methodology");

		// Check for enhanced vulnerability details
		expect(text).toContain(
			"Likelihood assessment (Very High/High/Medium/Low/Very Low)",
		);
		expect(text).toContain("Overall risk score (Severity × Likelihood)");
		expect(text).toContain("Reference to OWASP risk matrix position");

		// Check for low risk tolerance specifics
		expect(text).toContain("Accept minimal risk only");
		expect(text).toContain("Require mitigation for Medium+ risk findings");
	});

	it("should generate security hardening prompt", async () => {
		const result = await getPrompt("security-analysis-prompt", {
			codebase: "Web application with user management",
			security_focus: "security-hardening",
			risk_tolerance: "medium",
		});

		const text = result.messages[0].content.text;

		expect(text).toContain("Implement security hardening measures");
		expect(text).toContain("Apply defense-in-depth principles");
		expect(text).toContain("Accept Low to Medium risk findings");
		expect(text).toContain("Require immediate action for High+ risk findings");
	});

	it("should generate compliance check prompt", async () => {
		const result = await getPrompt("security-analysis-prompt", {
			codebase: "Healthcare application handling patient data",
			security_focus: "compliance-check",
			compliance_standards: ["HIPAA", "GDPR"],
			risk_tolerance: "high",
		});

		const text = result.messages[0].content.text;

		expect(text).toContain("Verify compliance with HIPAA,GDPR requirements");
		expect(text).toContain("Check adherence to security policies");
		expect(text).toContain("Accept Low to High risk findings");
		expect(text).toContain(
			"Require immediate action only for Critical risk findings",
		);
	});

	it("should generate threat modeling prompt", async () => {
		const result = await getPrompt("security-analysis-prompt", {
			codebase: "Microservices architecture",
			security_focus: "threat-modeling",
		});

		const text = result.messages[0].content.text;

		expect(text).toContain("Identify potential threat vectors");
		expect(text).toContain("Analyze security boundaries");
		expect(text).toContain("Assess impact and likelihood of potential threats");
	});

	it("should include compliance standards in prompt", async () => {
		const result = await getPrompt("security-analysis-prompt", {
			codebase: "Financial services application",
			compliance_standards: ["PCI-DSS", "SOC-2", "ISO-27001"],
		});

		const text = result.messages[0].content.text;

		expect(text).toContain("PCI-DSS");
		expect(text).toContain("SOC-2");
		expect(text).toContain("ISO-27001");
	});

	it("should handle empty compliance standards", async () => {
		const result = await getPrompt("security-analysis-prompt", {
			codebase: "Simple web application",
			compliance_standards: [],
		});

		const text = result.messages[0].content.text;
		// Should still generate valid prompt without compliance section
		expect(text).toContain("Risk Assessment Framework");
		expect(text).toContain("OWASP Risk Rating Methodology");
	});

	it("should handle different language specifications", async () => {
		const languages = ["python", "java", "typescript", "go", "rust"];

		for (const lang of languages) {
			const result = await getPrompt("security-analysis-prompt", {
				codebase: `${lang} application with REST API`,
				language: lang,
			});

			const text = result.messages[0].content.text;
			expect(text).toContain("Risk Assessment Framework");
			expect(text).toContain("OWASP Risk Rating Methodology");
		}
	});

	it("should validate required parameters", async () => {
		// Should require code_context
		await expect(
			getPrompt("security-analysis-prompt", {
				// missing code_context
				security_focus: "vulnerability-analysis",
			}),
		).rejects.toThrow();
	});

	it("should validate security focus options", async () => {
		const validFocuses = [
			"vulnerability-analysis",
			"security-hardening",
			"compliance-check",
			"threat-modeling",
		];

		for (const focus of validFocuses) {
			const result = await getPrompt("security-analysis-prompt", {
				codebase: "Test application",
				security_focus: focus,
			});

			expect(result.messages[0].content.text).toContain(
				"Risk Assessment Framework",
			);
		}

		// Note: This prompt template doesn't validate input values
		// so we can't test for rejection of invalid focus values
	});

	it("should validate risk tolerance options", async () => {
		const tolerances = ["low", "medium", "high"] as const;
		const expectedTexts = [
			"Accept minimal risk only",
			"Accept Low to Medium risk findings",
			"Accept Low to High risk findings",
		];

		for (let i = 0; i < tolerances.length; i++) {
			const result = await getPrompt("security-analysis-prompt", {
				codebase: "Test application",
				risk_tolerance: tolerances[i],
			});

			const text = result.messages[0].content.text;
			expect(text).toContain(expectedTexts[i]);
		}

		// Note: This prompt template doesn't validate input values
		// so we can't test for rejection of invalid tolerance values
	});

	it("should include all risk matrix quadrants", async () => {
		const result = await getPrompt("security-analysis-prompt", {
			codebase: "Enterprise application",
		});

		const text = result.messages[0].content.text;

		expect(text).toContain(
			"quadrant-1 Monitor & Review (High Impact, Low Likelihood)",
		);
		expect(text).toContain(
			"quadrant-2 Immediate Action Required (High Impact, High Likelihood)",
		);
		expect(text).toContain(
			"quadrant-3 Accept Risk (Low Impact, Low Likelihood)",
		);
		expect(text).toContain(
			"quadrant-4 Mitigate When Possible (Low Impact, High Likelihood)",
		);
	});

	it("should include technical and business impact factors", async () => {
		const result = await getPrompt("security-analysis-prompt", {
			codebase: "Business application",
		});

		const text = result.messages[0].content.text;

		// Technical impact factors
		expect(text).toContain(
			"loss of confidentiality, integrity, availability, accountability",
		);

		// Business impact factors
		expect(text).toContain(
			"financial damage, reputation damage, non-compliance, privacy violation",
		);
	});

	it("should include threat agent and vulnerability factors", async () => {
		const result = await getPrompt("security-analysis-prompt", {
			codebase: "Public-facing application",
		});

		const text = result.messages[0].content.text;

		// Threat agent factors
		expect(text).toContain("skill level, motive, opportunity, population size");

		// Vulnerability factors
		expect(text).toContain(
			"ease of discovery, exploit, awareness, intrusion detection",
		);
	});
});
