// Comprehensive Design Workflow Integration Tests
// This test suite exercises design tools in realistic scenarios to increase coverage
import { beforeAll, describe, expect, it } from "vitest";
import {
	confirmationPromptBuilder,
	constraintManager,
} from "../../dist/tools/design/index.js";
import type { DesignAssistantRequest } from "../../dist/tools/design/types.js";

describe("Design Workflow Integration - Coverage Enhancement", () => {
	beforeAll(async () => {
		await confirmationPromptBuilder.initialize();
	});

	const createComprehensiveRequest = (): DesignAssistantRequest => ({
		context: "E-commerce platform redesign",
		goal: "Create a modern, scalable microservices architecture",
		requirements: [
			"Support 100k concurrent users",
			"Sub-200ms response time for core APIs",
			"GDPR and PCI-DSS compliance",
			"Multi-region deployment",
			"Real-time inventory tracking",
			"Personalized user experience",
		],
		constraints: [
			{
				id: "budget-constraint",
				name: "Budget Limitation",
				type: "resource",
				category: "financial",
				description: "Total infrastructure cost under $50k/month",
				validation: {
					minCoverage: 80,
					keywords: ["cost", "budget", "infrastructure"],
				},
				weight: 0.9,
				mandatory: true,
				source: "Stakeholder Requirements",
			},
			{
				id: "security-constraint",
				name: "Security Standards",
				type: "non-functional",
				category: "security",
				description: "OWASP Top 10 compliance and regular security audits",
				validation: {
					minCoverage: 95,
					keywords: ["security", "authentication", "encryption"],
				},
				weight: 1.0,
				mandatory: true,
				source: "Security Team",
			},
			{
				id: "performance-constraint",
				name: "Performance SLA",
				type: "non-functional",
				category: "performance",
				description: "99.9% uptime with <200ms response time",
				validation: {
					minCoverage: 90,
					keywords: ["performance", "latency", "throughput"],
				},
				weight: 0.95,
				mandatory: true,
				source: "Product Requirements",
			},
		],
		coverageThreshold: 90,
		enablePivots: true,
		outputFormat: "markdown",
		templateRefs: ["microservices-template", "e-commerce-template"],
		metadata: {
			projectName: "NextGen E-Commerce",
			targetDate: "Q4 2024",
			stakeholders: ["Product", "Engineering", "Security", "Ops"],
		},
	});

	describe("Constraint Management - Advanced Coverage", () => {
		it("should generate coverage report for complex scenarios", () => {
			const config = createComprehensiveRequest();

			const richContent = `
        This e-commerce platform implements comprehensive security measures including
        encryption, authentication, and OWASP compliance. The infrastructure is designed
        for performance with low latency and high throughput. Budget considerations include
        cost optimization and efficient resource allocation.
      `;

			const report = constraintManager.generateCoverageReport(
				config,
				richContent,
			);

			expect(report).toBeDefined();
			expect(report.overall).toBeGreaterThan(0);
			expect(report.constraints).toBeDefined();
			expect(Object.keys(report.constraints).length).toBe(
				config.constraints.length,
			);
		});

		it("should detect when content lacks required keywords", () => {
			const config = createComprehensiveRequest();
			const minimalContent = "Basic system design";

			const report = constraintManager.generateCoverageReport(
				config,
				minimalContent,
			);

			expect(report.overall).toBeLessThan(50);
		});

		it("should weight constraints properly in coverage calculation", () => {
			const config = createComprehensiveRequest();
			const securityContent =
				"Security implementation with authentication and encryption following OWASP standards";

			const report = constraintManager.generateCoverageReport(
				config,
				securityContent,
			);

			// Security constraint has highest weight (1.0)
			expect(report.constraints["security-constraint"]).toBeGreaterThan(
				report.constraints["budget-constraint"] || 0,
			);
		});

		it("should handle edge case with empty content", () => {
			const config = createComprehensiveRequest();
			const report = constraintManager.generateCoverageReport(config, "");

			expect(report.overall).toBe(0);
			expect(Object.values(report.constraints).every((c) => c === 0)).toBe(
				true,
			);
		});

		it("should handle case-insensitive keyword matching", () => {
			const config = createComprehensiveRequest();
			const content =
				"SECURITY and AUTHENTICATION with ENCRYPTION for OWASP compliance";

			const report = constraintManager.generateCoverageReport(config, content);

			expect(report.constraints["security-constraint"]).toBeGreaterThan(50);
		});

		it("should handle comprehensive content covering all constraints", () => {
			const config = createComprehensiveRequest();
			const comprehensiveContent = `
        E-commerce platform with robust security including authentication and encryption.
        Performance optimization for low latency and high throughput operations.
        Cost-effective infrastructure design within budget constraints.
        All implementations follow OWASP best practices.
      `;

			const report = constraintManager.generateCoverageReport(
				config,
				comprehensiveContent,
			);

			expect(report.overall).toBeGreaterThan(0);
			expect(Object.keys(report.constraints).length).toBe(3);
		});
	});
});
