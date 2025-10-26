import { z } from "zod";
import type { Technique } from "../shared/prompt-sections.js";
import {
	buildPitfallsSection as buildSharedPitfalls,
	buildProviderTipsSection as buildSharedProviderTips,
	ProviderEnum,
	StyleEnum,
	TechniqueEnum,
} from "../shared/prompt-sections.js";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildMetadataSection,
	buildReferencesSection,
	slugify,
} from "../shared/prompt-utils.js";
import { applyTechniques } from "./technique-applicator.js";

const SecurityHardeningSchema = z.object({
	// Core context
	codeContext: z.string(),
	securityFocus: z
		.enum([
			"vulnerability-analysis",
			"security-hardening",
			"compliance-check",
			"threat-modeling",
			"penetration-testing",
		])
		.optional()
		.default("security-hardening"),

	// Security requirements
	securityRequirements: z.array(z.string()).optional(),
	complianceStandards: z
		.array(
			z.enum([
				"OWASP-Top-10",
				"NIST-Cybersecurity-Framework",
				"ISO-27001",
				"SOC-2",
				"GDPR",
				"HIPAA",
				"PCI-DSS",
			]),
		)
		.optional(),

	// Technical parameters
	language: z.string().optional().default("auto-detect"),
	framework: z.string().optional(),
	riskTolerance: z.enum(["low", "medium", "high"]).optional().default("medium"),

	// Analysis scope
	analysisScope: z
		.array(
			z.enum([
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
			]),
		)
		.optional(),

	// Output preferences
	includeCodeExamples: z.boolean().optional().default(true),
	includeMitigations: z.boolean().optional().default(true),
	includeTestCases: z.boolean().optional().default(false),
	prioritizeFindings: z.boolean().optional().default(true),
	outputFormat: z
		.enum(["detailed", "checklist", "annotated-code"])
		.optional()
		.default("detailed"),

	// YAML prompt frontmatter
	mode: z.string().optional().default("agent"),
	model: z.string().optional().default("GPT-4.1"),
	tools: z
		.array(z.string())
		.optional()
		.default(["codebase", "security-scanner", "editFiles"]),
	description: z.string().optional(),
	includeFrontmatter: z.boolean().optional().default(true),
	includeDisclaimer: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),

	// 2025 Prompting Techniques integration
	techniques: z.array(TechniqueEnum).optional(),
	includeTechniqueHints: z.boolean().optional().default(true),
	includePitfalls: z.boolean().optional().default(true),
	autoSelectTechniques: z.boolean().optional().default(true),
	provider: ProviderEnum.optional().default("gpt-4.1"),
	style: StyleEnum.optional(),
});

type SecurityHardeningInput = z.infer<typeof SecurityHardeningSchema>;

export async function securityHardeningPromptBuilder(args: unknown) {
	const normalized = ((): unknown => {
		if (args && typeof args === "object") {
			const obj = args as Record<string, unknown>;
			if (!("codeContext" in obj) && typeof obj.codeContent === "string") {
				return { ...obj, codeContext: obj.codeContent };
			}
		}
		return args;
	})();
	const input = SecurityHardeningSchema.parse(normalized);

	const frontmatter = input.includeFrontmatter
		? `${buildSecurityHardeningFrontmatter(input)}\n`
		: "";

	const metadata = input.includeMetadata
		? `${buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_security-hardening-prompt-builder",
				inputFile: input.inputFile,
				filenameHint: `security-hardening-${slugify(input.securityFocus)}-prompt.prompt.md`,
			})}\n`
		: "";

	const prompt = buildSecurityHardeningPrompt(input);

	const references = input.includeReferences
		? `${buildSecurityReferencesSection()}\n`
		: "";

	const disclaimer = input.includeDisclaimer
		? `\n## Disclaimer\n- Security recommendations are based on common best practices and may need customization for your specific environment\n- Always validate security measures with penetration testing and security audits\n- Compliance requirements may vary by jurisdiction and industry\n- Keep security tools and dependencies up to date\n`
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🛡️ Security Hardening Prompt Template\n\n${metadata}\n${prompt}\n\n${references}${disclaimer}`,
			},
		],
	};
}

function buildSecurityHardeningPrompt(input: SecurityHardeningInput): string {
	let prompt = "";

	// Header and Context
	prompt += `# Security ${
		input.securityFocus === "vulnerability-analysis"
			? "Vulnerability Analysis"
			: input.securityFocus === "security-hardening"
				? "Hardening Assessment"
				: input.securityFocus === "compliance-check"
					? "Compliance Review"
					: input.securityFocus === "threat-modeling"
						? "Threat Model Analysis"
						: "Penetration Testing Review"
	} Prompt\n\n`;

	prompt += `Perform comprehensive security analysis of ${input.language} code with focus on ${input.securityFocus.replace("-", " ")}\n\n`;

	// Code Context
	prompt += `## Code Context\n${input.codeContext}\n\n`;

	// Security Requirements
	if (input.securityRequirements && input.securityRequirements.length > 0) {
		prompt += `## Security Requirements\n`;
		input.securityRequirements.forEach((req, index) => {
			prompt += `${index + 1}. ${req}\n`;
		});
		prompt += "\n";
	}

	// Compliance Standards
	if (input.complianceStandards && input.complianceStandards.length > 0) {
		prompt += `## Compliance Standards\nEvaluate against:\n`;
		input.complianceStandards.forEach((standard) => {
			prompt += `- ${standard.replaceAll("-", " ")}\n`;
		});
		prompt += "\n";
	}

	// Analysis Scope
	if (input.analysisScope && input.analysisScope.length > 0) {
		prompt += `## Analysis Scope\nFocus on these security areas:\n`;
		input.analysisScope.forEach((area) => {
			prompt += `- ${area.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}\n`;
		});
		prompt += "\n";
	}

	// Analysis Framework
	prompt += `## Security Analysis Framework\n\n`;
	prompt += `### 1. Vulnerability Identification\n`;
	prompt += `- Scan for common vulnerability patterns (OWASP Top 10)\n`;
	prompt += `- Identify insecure coding practices\n`;
	prompt += `- Check for hardcoded secrets and credentials\n`;
	prompt += `- Analyze input validation and sanitization\n\n`;

	prompt += `### 2. Risk Assessment\n`;
	prompt += `- Rate findings by severity (Critical/High/Medium/Low)\n`;
	prompt += `- Assess likelihood of exploitation (Very High/High/Medium/Low/Very Low)\n`;
	prompt += `- Evaluate impact on confidentiality, integrity, and availability\n`;
	prompt += `- Consider attack vectors and threat scenarios\n`;
	prompt += `- Document risk exposure and likelihood\n`;
	prompt += `- Apply OWASP Risk Rating methodology (Impact × Likelihood)\n\n`;

	prompt += `### 3. Security Controls Evaluation\n`;
	prompt += `- Review authentication mechanisms\n`;
	prompt += `- Validate authorization and access controls\n`;
	prompt += `- Check encryption and data protection\n`;
	prompt += `- Assess logging and monitoring coverage\n\n`;

	if (input.includeMitigations) {
		prompt += `### 4. Remediation Guidance\n`;
		prompt += `- Provide specific fix recommendations\n`;
		prompt += `- Suggest secure coding alternatives\n`;
		prompt += `- Include implementation best practices\n`;
		prompt += `- Reference security libraries and frameworks\n\n`;
	}

	// Output Format
	prompt += `## Output Format\n\n`;
	if (input.outputFormat === "detailed") {
		prompt += `Provide a comprehensive security assessment report including:\n`;
		prompt += `- **Executive Summary**: High-level security posture overview\n`;
		prompt += `- **Findings**: Detailed vulnerability descriptions with severity and likelihood ratings\n`;
		prompt += `- **Risk Analysis**: OWASP-based impact × likelihood assessment with risk matrix position\n`;
		prompt += `- **Recommendations**: Prioritized remediation steps with implementation guidance\n`;
		if (input.includeCodeExamples) {
			prompt += `- **Code Examples**: Before/after code snippets showing secure implementations\n`;
		}
	} else if (input.outputFormat === "checklist") {
		prompt += `Provide a security checklist format:\n`;
		prompt += `- [ ] **Critical Issues**: Immediate security concerns requiring urgent attention\n`;
		prompt += `- [ ] **High Priority**: Important security improvements\n`;
		prompt += `- [ ] **Medium Priority**: Recommended security enhancements\n`;
		prompt += `- [ ] **Low Priority**: Nice-to-have security improvements\n`;
	} else if (input.outputFormat === "annotated-code") {
		prompt += `Provide annotated code with inline security comments:\n`;
		prompt += `- Mark vulnerable code sections with // SECURITY RISK: [description]\n`;
		prompt += `- Suggest fixes with // SECURE FIX: [recommendation]\n`;
		prompt += `- Highlight security-relevant changes with // SECURITY ENHANCEMENT: [benefit]\n`;
	}

	if (input.includeTestCases) {
		prompt += `- **Test Cases**: Security test scenarios to validate fixes\n`;
	}

	prompt += `\n## OWASP Risk Assessment Framework\n`;
	prompt += `Follow OWASP Risk Rating Methodology using Impact vs Likelihood matrix:\n\n`;
	prompt += `### Risk Calculation: Overall Risk = Likelihood × Impact\n\n`;
	prompt += `**Likelihood Factors:**\n`;
	prompt += `- Threat Agent (skill level, motive, opportunity, population size)\n`;
	prompt += `- Vulnerability (ease of discovery, exploit, awareness, intrusion detection)\n\n`;
	prompt += `**Impact Factors:**\n`;
	prompt += `- Technical Impact (loss of confidentiality, integrity, availability, accountability)\n`;
	prompt += `- Business Impact (financial damage, reputation damage, non-compliance, privacy violation)\n\n`;
	prompt += `### Risk Matrix Visualization\n\n`;
	prompt += `\`\`\`mermaid\n`;
	prompt += `quadrantChart\n`;
	prompt += `    title Security Risk Assessment Matrix\n`;
	prompt += `    x-axis Low Impact --> High Impact\n`;
	prompt += `    y-axis Low Likelihood --> High Likelihood\n`;
	prompt += `    quadrant-1 Monitor & Review (High Impact, Low Likelihood)\n`;
	prompt += `    quadrant-2 Immediate Action Required (High Impact, High Likelihood)\n`;
	prompt += `    quadrant-3 Accept Risk (Low Impact, Low Likelihood)\n`;
	prompt += `    quadrant-4 Mitigate When Possible (Low Impact, High Likelihood)\n`;
	prompt += `\`\`\`\n\n`;

	prompt += `\n## Risk Tolerance\n`;
	prompt += `Apply ${input.riskTolerance} risk tolerance:\n`;
	if (input.riskTolerance === "low") {
		prompt += `- Accept minimal risk only (Low Impact × Low Likelihood)\n`;
		prompt += `- Flag all potential security issues, even minor ones\n`;
		prompt += `- Recommend defense-in-depth approaches\n`;
		prompt += `- Prioritize security over convenience\n`;
		prompt += `- Require mitigation for Medium+ risk findings\n`;
	} else if (input.riskTolerance === "medium") {
		prompt += `- Accept Low to Medium risk findings with proper justification\n`;
		prompt += `- Focus on medium to critical severity issues\n`;
		prompt += `- Balance security with usability\n`;
		prompt += `- Recommend practical, implementable solutions\n`;
		prompt += `- Require immediate action for High+ risk findings\n`;
	} else {
		prompt += `- Accept Low to High risk findings with business justification\n`;
		prompt += `- Focus only on critical and high severity issues\n`;
		prompt += `- Consider business context and implementation cost\n`;
		prompt += `- Provide flexible security recommendations\n`;
		prompt += `- Require immediate action only for Critical risk findings\n`;
	}

	if (input.prioritizeFindings) {
		prompt += `\n## Prioritization Criteria\n`;
		prompt += `1. **Critical**: Immediate threats with high exploitability\n`;
		prompt += `2. **High**: Significant security risks requiring prompt attention\n`;
		prompt += `3. **Medium**: Important improvements with moderate risk\n`;
		prompt += `4. **Low**: Best practice recommendations with minimal risk\n`;
	}

	// Technical Context
	if (input.framework) {
		prompt += `\n## Framework-Specific Considerations\n`;
		prompt += `Consider ${input.framework}-specific security patterns and recommendations\n`;
	}

	// Optional technique hints - using context-aware TechniqueApplicator
	if (input.includeTechniqueHints !== false) {
		prompt += applyTechniques({
			context: {
				context: input.codeContext,
				goal: `Security ${input.securityFocus.replace("-", " ")} analysis`,
				requirements: input.securityRequirements,
			},
			techniques: input.techniques as Technique[] | undefined,
			autoSelectTechniques: input.autoSelectTechniques,
		});
	}

	// Provider-specific tips
	if (input.provider) {
		prompt += buildSharedProviderTips(input.provider);
	}

	// Pitfalls section
	if (input.includePitfalls !== false) {
		prompt += buildSharedPitfalls();
		prompt += buildSecuritySpecificPitfalls();
	}

	return prompt;
}

function buildSecurityHardeningFrontmatter(
	input: SecurityHardeningInput,
): string {
	const desc =
		input.description ||
		`Security ${input.securityFocus.replace("-", " ")} analysis and hardening recommendations`;
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

function buildSecurityReferencesSection(): string {
	return buildReferencesSection([
		"OWASP Top 10: https://owasp.org/www-project-top-ten/",
		"NIST Cybersecurity Framework: https://www.nist.gov/cyberframework",
		"SANS Secure Coding Practices: https://www.sans.org/white-papers/2172/",
		"CWE Top 25: https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html",
		"Security Code Review Guide: https://owasp.org/www-project-code-review-guide/",
	]);
}

function buildSecuritySpecificPitfalls(): string {
	return (
		`\n## Security-Specific Pitfalls to Avoid\n\n` +
		`- Over-relying on client-side validation → implement server-side validation\n` +
		`- Ignoring principle of least privilege → restrict access to minimum required\n` +
		`- Using deprecated cryptographic algorithms → use current security standards\n` +
		`- Hardcoding sensitive configuration → use secure configuration management\n` +
		`- Insufficient logging of security events → implement comprehensive audit trails\n` +
		`- Assuming internal networks are secure → implement zero-trust principles\n\n`
	);
}
