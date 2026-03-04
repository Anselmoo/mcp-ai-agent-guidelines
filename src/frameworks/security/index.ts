/**
 * Security Framework — unified entry point (T-042).
 *
 * Consolidates:
 * - security-hardening-prompt-builder (OWASP + threat modeling)
 */

import type { FrameworkDefinition } from "../types.js";
import { routeSecurityAction } from "./router.js";
import { SecurityInputSchema } from "./types.js";

export const securityFramework: FrameworkDefinition = {
	name: "security",
	description:
		"Security analysis: vulnerability assessment, security hardening, threat modeling, and compliance audits.",
	version: "1.0.0",
	actions: ["assess", "harden", "model", "audit"],
	schema: SecurityInputSchema,

	async execute(input: unknown) {
		const validated = SecurityInputSchema.parse(input);
		return routeSecurityAction(validated);
	},
};

export { type SecurityInput, SecurityInputSchema } from "./types.js";
