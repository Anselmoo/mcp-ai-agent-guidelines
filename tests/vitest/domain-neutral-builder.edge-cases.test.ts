import { describe, expect, it } from "vitest";
import { domainNeutralPromptBuilder } from "../../src/tools/prompt/domain-neutral-prompt-builder";

describe("domain-neutral-prompt-builder edge cases", () => {
	it("handles minimal inputs with defaults", async () => {
		const result = await domainNeutralPromptBuilder({
			title: "Test System",
			summary: "A test system for validation",
		});

		const text = result.content[0].text;
		expect(text).toMatch(/Test System/);
		expect(text).toMatch(/A test system for validation/);
		expect(text).toMatch(/Domain-Neutral Prompt Template/);
		expect(text).toMatch(/Metadata/);
	});

	it("handles complex configuration with all optional fields", async () => {
		const result = await domainNeutralPromptBuilder({
			title: "Complex Enterprise System",
			summary: "Multi-tenant SaaS platform with advanced analytics",
			objectives: ["Scalability", "Security", "Performance"],
			scope: "Enterprise-level deployment",
			inputs: "User data, metrics, configurations",
			outputs: "Reports, analytics, notifications",
			workflow: ["Data ingestion", "Processing", "Analysis", "Reporting"],
			constraints: "Must comply with GDPR and SOC2",
			assumptions: "High availability infrastructure available",
			background: "Replacing legacy monolithic system",
			stakeholdersUsers: "Enterprise customers, administrators, end users",
			successMetrics: ["99.9% uptime", "Sub-second response times"],
			nonGoals: ["Mobile app development", "Third-party integrations"],
			capabilities: [
				{
					name: "User Authentication",
					purpose: "Secure user access",
					inputs: "Credentials",
					outputs: "Auth tokens",
					processing: "OAuth 2.0 flow",
					preconditions: "Valid user account",
					successCriteria: "Successful authentication",
					errors: "Invalid credentials",
					observability: "Login metrics tracked",
				},
			],
			risks: [
				{
					description: "Data privacy breach",
					mitigation: "Encrypt all PII data",
					likelihoodImpact: "Low/High",
				},
			],
			acceptanceTests: [
				{
					setup: "Deploy system to staging",
					action: "Run load test with 1000 concurrent users",
					expected: "Response time < 500ms, 0 errors",
				},
			],
			interfaces: [
				{
					name: "REST API",
					contract: "OpenAPI 3.0 specification",
				},
			],
			edgeCases: [
				{
					name: "Database connection failure",
					handling: "Graceful degradation with cached data",
				},
			],
			milestones: [
				{
					name: "MVP Release",
					eta: "Q1 2024",
					deliverables: "Core functionality deployed",
				},
			],
			nextSteps: ["Security audit", "Performance testing"],
			openQuestions: ["Should we support mobile?"],
			manualChecklist: ["Verify SSL certificates", "Test backup procedures"],
			changelog: ["v1.0 - Initial release", "v1.1 - Bug fixes"],
			includeFrontmatter: true,
			includeMetadata: true,
			includePitfalls: true,
			includeReferences: true,
			includeDisclaimer: true,
		});

		const text = result.content[0].text;
		expect(text).toMatch(/Complex Enterprise System/);
		expect(text).toMatch(/Multi-tenant SaaS platform/);
		expect(text).toMatch(/User Authentication/);
		expect(text).toMatch(/Data privacy breach/);
		expect(text).toMatch(/Database connection failure/);
		expect(text).toMatch(/MVP Release/);
		expect(text).toMatch(/Security audit/);
		expect(text).toMatch(/Should we support mobile/);
		expect(text).toMatch(/Verify SSL certificates/);
		expect(text).toMatch(/v1\.0 - Initial release/);
		expect(text).toMatch(/metadata/i);
		expect(text).toMatch(/references/i);
		expect(text).toMatch(/disclaimer/i);
	});

	it("handles empty arrays and objects gracefully", async () => {
		const result = await domainNeutralPromptBuilder({
			title: "Empty System",
			summary: "System with empty configurations",
			objectives: [],
			capabilities: [],
			risks: [],
			acceptanceTests: [],
			interfaces: [],
			edgeCases: [],
			milestones: [],
			nextSteps: [],
			openQuestions: [],
			manualChecklist: [],
			changelog: [],
		});

		const text = result.content[0].text;
		expect(text).toMatch(/Empty System/);
		expect(text).toMatch(/System with empty configurations/);
		// Should handle empty arrays without breaking
		expect(text).not.toMatch(/undefined/);
		expect(text).not.toMatch(/\[object Object\]/);
	});

	it("handles special characters and markdown content", async () => {
		const result = await domainNeutralPromptBuilder({
			title: "System with **Bold** and `Code`",
			summary: "A system that handles *special* characters & symbols #test",
			background: "Legacy system had <script>alert('xss')</script> vulnerabilities",
			constraints: "Must escape | pipes | and & ampersands",
		});

		const text = result.content[0].text;
		expect(text).toMatch(/System with \*\*Bold\*\* and `Code`/);
		expect(text).toMatch(/special.*characters.*symbols/);
		expect(text).toMatch(/script.*alert.*xss.*vulnerabilities/);
		expect(text).toMatch(/pipes.*ampersands/);
	});

	it("handles very long content without breaking", async () => {
		const longText = "A".repeat(1000); // Reduced size for testing
		const result = await domainNeutralPromptBuilder({
			title: "Large System",
			summary: `System with very long description: ${longText}`,
			background: longText.substring(0, 500), // Truncate for test
			constraints: longText.substring(0, 500),
		});

		const text = result.content[0].text;
		expect(text).toMatch(/Large System/);
		expect(text).toMatch(/System with very long description/);
		expect(text.length).toBeGreaterThan(1000);
	});

	it("generates different formats correctly", async () => {
		const markdownResult = await domainNeutralPromptBuilder({
			title: "Markdown System",
			summary: "System for markdown testing",
			forcePromptMdStyle: true,
		});

		const standardResult = await domainNeutralPromptBuilder({
			title: "Standard System", 
			summary: "System for standard testing",
			forcePromptMdStyle: false,
		});

		const markdownText = markdownResult.content[0].text;
		const standardText = standardResult.content[0].text;
		
		expect(markdownText).toMatch(/Markdown System/);
		expect(standardText).toMatch(/Standard System/);
		// Both should be valid but may have different formatting
		expect(markdownText.length).toBeGreaterThan(0);
		expect(standardText.length).toBeGreaterThan(0);
	});

	it("handles various data types in optional fields", async () => {
		const result = await domainNeutralPromptBuilder({
			title: "Flexible System",
			summary: "System with various data types",
			performanceScalability: "99.9% uptime required",
			reliabilityAvailability: "5-9s availability target",
			securityPrivacy: "GDPR compliant, encrypted at rest",
			observabilityOps: "Prometheus metrics, centralized logging",
			costBudget: "$50k annual budget",
			environment: "AWS cloud infrastructure",
			dependencies: "Redis, PostgreSQL, Elasticsearch",
			versioningStrategy: "Semantic versioning with feature flags",
			migrationCompatibility: "Backward compatible APIs",
			compliancePolicy: "SOC2 Type II certification required",
		});

		const text = result.content[0].text;
		expect(text).toMatch(/Flexible System/);
		expect(text).toMatch(/99\.9% uptime/);
		expect(text).toMatch(/5-9s availability/);
		expect(text).toMatch(/GDPR compliant/);
		expect(text).toMatch(/Prometheus metrics/);
		expect(text).toMatch(/50k annual budget/);
		expect(text).toMatch(/AWS cloud/);
		expect(text).toMatch(/Redis.*PostgreSQL/);
		expect(text).toMatch(/Semantic versioning/);
		expect(text).toMatch(/Backward compatible/);
		expect(text).toMatch(/SOC2 Type II/);
	});
});