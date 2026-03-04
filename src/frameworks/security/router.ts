/**
 * Security Framework — action router (T-042).
 */

import { securityHardeningPromptBuilder } from "../../tools/prompt/security-hardening-prompt-builder.js";
import type { SecurityInput } from "./types.js";

export async function routeSecurityAction(
	input: SecurityInput,
): Promise<unknown> {
	switch (input.action) {
		case "assess":
		case "harden":
		case "model":
		case "audit":
			return securityHardeningPromptBuilder({
				codeContext: input.codeContext ?? "",
				language: input.language,
				framework: input.framework,
				securityFocus: input.securityFocus ?? "vulnerability-analysis",
				complianceStandards: input.complianceStandards,
				riskTolerance: input.riskTolerance,
				includeMitigations: input.includeMitigations,
				includeReferences: input.includeReferences,
			});

		default:
			throw new Error(
				`Unknown security action: ${(input as SecurityInput).action}`,
			);
	}
}
