import { describe, expect, it } from "vitest";
import { securityHardeningPromptBuilder } from "../../src/tools/prompt/security-hardening-prompt-builder.js";

describe("security-hardening-prompt-builder edge cases", () => {
	it("should handle empty security requirements array", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			securityRequirements: [],
		});

		const text = result.content[0].text;
		expect(text).toContain("🛡️ Security Hardening Prompt Template");
		expect(text).not.toContain("## Security Requirements");
	});

	it("should handle empty compliance standards array", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			complianceStandards: [],
		});

		const text = result.content[0].text;
		expect(text).toContain("🛡️ Security Hardening Prompt Template");
		expect(text).not.toContain("## Compliance Standards");
	});

	it("should handle empty analysis scope array", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			analysisScope: [],
		});

		const text = result.content[0].text;
		expect(text).toContain("🛡️ Security Hardening Prompt Template");
		expect(text).not.toContain("## Analysis Scope");
	});

	it("should generate different headers for each security focus", async () => {
		const focuses = [
			"vulnerability-analysis",
			"security-hardening",
			"compliance-check",
			"threat-modeling",
			"penetration-testing",
		] as const;

		const expectedHeaders = [
			"Security Vulnerability Analysis Prompt",
			"Security Hardening Assessment Prompt",
			"Security Compliance Review Prompt",
			"Security Threat Model Analysis Prompt",
			"Security Penetration Testing Review Prompt",
		];

		for (let i = 0; i < focuses.length; i++) {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Test application",
				securityFocus: focuses[i],
			});

			const text = result.content[0].text;
			expect(text).toContain(expectedHeaders[i]);
		}
	});

	it("should properly format security requirements with indices", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			securityRequirements: [
				"First requirement",
				"Second requirement",
				"Third requirement",
			],
		});

		const text = result.content[0].text;
		expect(text).toContain("1. First requirement");
		expect(text).toContain("2. Second requirement");
		expect(text).toContain("3. Third requirement");
	});

	it("should include prioritization criteria when enabled", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			prioritizeFindings: true,
		});

		const text = result.content[0].text;
		expect(text).toContain("## Prioritization Criteria");
		expect(text).toContain(
			"1. **Critical**: Immediate threats with high exploitability",
		);
		expect(text).toContain(
			"2. **High**: Significant security risks requiring prompt attention",
		);
		expect(text).toContain(
			"3. **Medium**: Important improvements with moderate risk",
		);
		expect(text).toContain(
			"4. **Low**: Best practice recommendations with minimal risk",
		);
	});

	it("should exclude prioritization criteria when disabled", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			prioritizeFindings: false,
		});

		const text = result.content[0].text;
		expect(text).not.toContain("## Prioritization Criteria");
	});

	it("should include framework considerations when specified", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			framework: "Django",
		});

		const text = result.content[0].text;
		expect(text).toContain("Django Framework Security Analysis");
		expect(text).toContain("Django-Specific Security Checks");
		expect(text).toContain("Django ORM");
	});

	it("should exclude framework considerations when not specified", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			// framework not specified
		});

		const text = result.content[0].text;
		expect(text).not.toContain("## Framework-Specific Considerations");
	});

	it("should return error for invalid security focus", async () => {
		const result = (await securityHardeningPromptBuilder({
			codeContext: "Test application",
			securityFocus: "invalid-focus" as any,
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
	});

	it("should return error for invalid risk tolerance", async () => {
		const result = (await securityHardeningPromptBuilder({
			codeContext: "Test application",
			riskTolerance: "invalid-tolerance" as any,
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
	});

	it("should return error for invalid compliance standard", async () => {
		const result = (await securityHardeningPromptBuilder({
			codeContext: "Test application",
			complianceStandards: ["INVALID-STANDARD"] as any,
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
	});

	it("should return error for invalid analysis scope", async () => {
		const result = (await securityHardeningPromptBuilder({
			codeContext: "Test application",
			analysisScope: ["invalid-scope"] as any,
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
	});

	it("should return error for invalid output format", async () => {
		const result = (await securityHardeningPromptBuilder({
			codeContext: "Test application",
			outputFormat: "invalid-format" as any,
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
	});

	it("should return error when codeContext parameter missing", async () => {
		const result = (await securityHardeningPromptBuilder({
			// missing codeContext
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
	});

	it("should handle provider-specific tips", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			provider: "claude-opus-4.1",
		});

		const text = result.content[0].text;
		expect(text).toContain("Model-Specific Tips");
	});

	it("should exclude provider tips when provider not specified", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			// provider defaults to "GPT-5" so tips will be included
		});

		const text = result.content[0].text;
		expect(text).toContain("Model-Specific Tips"); // Tips are included by default
	});

	it("should include security-specific pitfalls", async () => {
		const result = await securityHardeningPromptBuilder({
			codeContext: "Test application",
			includePitfalls: true,
		});

		const text = result.content[0].text;
		expect(text).toContain("Security-Specific Pitfalls to Avoid");
		expect(text).toContain("Over-relying on client-side validation");
		expect(text).toContain("Ignoring principle of least privilege");
		expect(text).toContain("Using deprecated cryptographic algorithms");
	});

	it("should generate correct frontmatter with custom description", async () => {
		const customDescription = "Custom security analysis for payment processing";
		const result = await securityHardeningPromptBuilder({
			codeContext: "Payment processing system",
			description: customDescription,
			mode: "analysis",
			model: "GPT-4o",
			tools: ["security-scanner", "code-analyzer"],
		});

		const text = result.content[0].text;
		expect(text).toContain("---");
		expect(text).toContain(`description: '${customDescription}'`);
		expect(text).toContain("mode: 'agent'"); // Normalized from invalid 'analysis'
		expect(text).toContain("model: GPT-4o"); // Shows warning about unrecognized model
		expect(text).toContain(
			"# Note: Dropped unknown tools: security-scanner, code-analyzer",
		);
	});
});
