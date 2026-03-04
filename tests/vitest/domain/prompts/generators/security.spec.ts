import { describe, expect, it } from "vitest";
import { SecurityGenerator } from "../../../../../src/domain/prompts/generators/security.js";

describe("SecurityGenerator", () => {
	const gen = new SecurityGenerator();

	it("has correct domain", () => {
		expect(gen.domain).toBe("security");
		expect(gen.version).toBe("1.0.0");
	});

	it("generate() includes code-context and security-focus sections", () => {
		const result = gen.generate({ codeContext: "function login() {}" });
		expect(result.sections.some((s) => s.id === "code-context")).toBe(true);
		expect(result.sections.some((s) => s.id === "security-focus")).toBe(true);
	});

	it("generate() includes compliance section when standards provided", () => {
		const result = gen.generate({
			codeContext: "API endpoint",
			complianceStandards: ["OWASP-Top-10", "PCI-DSS"],
		});
		const complianceSection = result.sections.find(
			(s) => s.id === "compliance",
		);
		expect(complianceSection).toBeDefined();
		expect(complianceSection?.content).toContain("OWASP-Top-10");
	});

	it("recommendTechniques() returns non-empty array", () => {
		expect(
			gen.recommendTechniques({ codeContext: "x" }).length,
		).toBeGreaterThan(0);
	});

	it("requestSchema rejects empty codeContext", () => {
		expect(gen.requestSchema.safeParse({ codeContext: "" }).success).toBe(
			false,
		);
	});
});
