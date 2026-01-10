/**
 * Security Analyzer Agent Definition
 *
 * @module agents/definitions/security-agent
 */

import type { AgentDefinition } from "../types.js";

/**
 * Agent for generating security analysis prompts with OWASP/NIST compliance.
 * Creates structured prompts for vulnerability assessment and security hardening.
 */
export const securityAgent: AgentDefinition = {
	name: "security-analyzer",
	description:
		"Generates security analysis prompts with OWASP/NIST compliance checks",
	capabilities: ["security", "compliance", "owasp", "prompt-generation"],
	toolName: "security-hardening-prompt-builder",
	inputSchema: {
		type: "object",
		properties: {
			codeContext: { type: "string" },
			securityFocus: {
				type: "string",
				enum: [
					"vulnerability-analysis",
					"security-hardening",
					"compliance-check",
					"threat-modeling",
					"penetration-testing",
				],
			},
			complianceStandards: {
				type: "array",
				items: {
					type: "string",
					enum: [
						"OWASP-Top-10",
						"NIST-Cybersecurity-Framework",
						"ISO-27001",
						"SOC-2",
						"GDPR",
						"HIPAA",
						"PCI-DSS",
					],
				},
			},
			analysisScope: {
				type: "array",
				items: {
					type: "string",
					enum: [
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
				},
			},
			language: { type: "string" },
			framework: { type: "string" },
		},
		required: ["codeContext"],
	},
};
