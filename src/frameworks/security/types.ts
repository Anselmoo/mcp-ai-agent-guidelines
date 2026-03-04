/**
 * Security Framework — shared types.
 */
import { z } from "zod";

export const SecurityActionEnum = z.enum([
	"assess",
	"harden",
	"model",
	"audit",
]);

export type SecurityAction = z.infer<typeof SecurityActionEnum>;

export const SecurityInputSchema = z.object({
	action: SecurityActionEnum.describe("Security action"),
	codeContext: z
		.string()
		.optional()
		.describe("Code context or description to analyze"),
	language: z.string().optional().describe("Programming language"),
	framework: z.string().optional().describe("Framework/stack"),
	securityFocus: z
		.enum([
			"vulnerability-analysis",
			"security-hardening",
			"compliance-check",
			"threat-modeling",
			"penetration-testing",
		])
		.optional(),
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
	riskTolerance: z.enum(["low", "medium", "high"]).optional().default("medium"),
	includeMitigations: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
});

export type SecurityInput = z.infer<typeof SecurityInputSchema>;
