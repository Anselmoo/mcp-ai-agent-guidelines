import { describe, expect, it } from "vitest";

import {
	buildSecurityAnalysis,
	generateSecurityChecks,
} from "../../../../src/domain/prompting/security-builder.js";

describe("security-builder domain", () => {
	it("includes OWASP Top 10 checks in security analysis", () => {
		const result = buildSecurityAnalysis({ codeContext: "API service" });
		const owaspIds = result.checks
			.filter((check) => check.category === "OWASP Top 10")
			.map((check) => check.id);

		expect(owaspIds).toContain("OWASP-A01");
		expect(new Set(owaspIds).size).toBeGreaterThanOrEqual(10);
	});

	it("creates recommendations derived from generated checks", () => {
		const checks = generateSecurityChecks({
			codeContext: "web app",
			analysisScope: ["authentication"],
		});
		const result = buildSecurityAnalysis({
			codeContext: "web app",
			analysisScope: ["authentication"],
		});

		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.relatedChecks[0]).toBe(checks[0]?.id);
	});

	it("builds threat model when requested", () => {
		const result = buildSecurityAnalysis({
			codeContext: "payment processing",
			threatModel: true,
			securityFocus: "threat-modeling",
		});

		expect(result.threatModel).toBeDefined();
		expect(result.threatModel?.attackVectors.length).toBeGreaterThan(0);
		expect(result.threatModel?.mitigations.length).toBeGreaterThan(0);
	});

	it("returns compliance matrix when frameworks are provided", () => {
		const result = buildSecurityAnalysis({
			codeContext: "checkout service",
			complianceFrameworks: ["PCI-DSS", "OWASP-Top-10"],
		});

		expect(result.complianceMatrix?.length).toBeGreaterThan(0);
		expect(
			result.complianceMatrix?.some((entry) => entry.framework === "PCI-DSS"),
		).toBe(true);
	});
});
