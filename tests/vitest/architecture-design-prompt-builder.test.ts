import { describe, expect, it } from "vitest";
import { architectureDesignPromptBuilder } from "../../src/tools/prompt/architecture-design-prompt-builder.js";

describe("architecture-design-prompt-builder", () => {
	it("should generate architecture design prompt for small scale system", async () => {
		const result = await architectureDesignPromptBuilder({
			systemRequirements:
				"E-commerce platform with basic product catalog and checkout",
			scale: "small",
			technologyStack: "Node.js, SQLite, React",
			includeReferences: true,
		});

		const text = result.content[0].text;

		// Check for basic structure
		expect(text).toContain("Architecture Design Prompt");
		expect(text).toContain("System Architecture Design");

		// Check for scale-specific content
		expect(text).toContain("small-scale");
		expect(text).toContain("Monolithic or Simple Microservices");
		expect(text).toContain("Simple deployment and maintenance");
		expect(text).toContain("Cost-effective");

		// Check for system requirements
		expect(text).toContain("E-commerce platform");

		// Check for technology stack
		expect(text).toContain("Node.js, SQLite, React");

		// Check for references
		expect(text).toContain("Further Reading");
	});

	it("should generate architecture design prompt for medium scale system", async () => {
		const result = await architectureDesignPromptBuilder({
			systemRequirements:
				"Multi-tenant SaaS application with high availability",
			scale: "medium",
			technologyStack: "Java Spring Boot, PostgreSQL, Angular",
		});

		const text = result.content[0].text;

		expect(text).toContain("medium-scale");
		expect(text).toContain("Modular Monolith or Microservices");
		expect(text).toContain("Moderate scaling requirements");
		expect(text).toContain("Growth potential");
	});

	it("should generate architecture design prompt for large scale system", async () => {
		const result = await architectureDesignPromptBuilder({
			systemRequirements:
				"Global streaming platform with millions of concurrent users",
			scale: "large",
			technologyStack: "Kubernetes, Kafka, Cassandra",
		});

		const text = result.content[0].text;

		expect(text).toContain("large-scale");
		expect(text).toContain("Distributed Microservices");
		expect(text).toContain("Horizontal scaling");
		expect(text).toContain("Load balancing");
		expect(text).toContain("Performance optimization");
		expect(text).toContain("Fault tolerance");
	});

	it("should handle flexible technology stack", async () => {
		const result = await architectureDesignPromptBuilder({
			systemRequirements: "Real-time analytics dashboard",
			scale: "medium",
			technologyStack: "flexible",
		});

		const text = result.content[0].text;

		expect(text).toContain("flexible");
		expect(text).toContain("Suggest appropriate technologies");
		expect(text).toContain("modern best practices");
	});

	it("should include all required architecture sections", async () => {
		const result = await architectureDesignPromptBuilder({
			systemRequirements: "Healthcare management system",
			scale: "medium",
		});

		const text = result.content[0].text;

		// Check for analysis requirements
		expect(text).toContain("High-Level Architecture");
		expect(text).toContain("Technology Recommendations");
		expect(text).toContain("Scalability Considerations");

		// Check for output format sections
		expect(text).toContain("Architecture Overview");
		expect(text).toContain("Component Design");
		expect(text).toContain("Infrastructure Design");
		expect(text).toContain("Implementation Roadmap");
		expect(text).toContain("Documentation Artifacts");

		// Check for quality attributes
		expect(text).toContain("Quality Attributes");
		expect(text).toContain("Performance");
		expect(text).toContain("Reliability");
		expect(text).toContain("Security");
		expect(text).toContain("Maintainability");
		expect(text).toContain("Scalability");
	});

	it("should respect includeMetadata flag", async () => {
		const result = await architectureDesignPromptBuilder({
			systemRequirements: "Test system",
			includeMetadata: false,
		});

		const text = result.content[0].text;

		expect(text).not.toMatch(/\*\*Source Tool\*\*/);
	});

	it("should respect includeFrontmatter flag", async () => {
		const result = await architectureDesignPromptBuilder({
			systemRequirements: "Test system",
			includeFrontmatter: false,
			forcePromptMdStyle: false,
		});

		const text = result.content[0].text;

		expect(text).not.toMatch(/^---/);
	});

	it("should include deployment and network topology sections", async () => {
		const result = await architectureDesignPromptBuilder({
			systemRequirements: "Cloud-native application",
			scale: "large",
		});

		const text = result.content[0].text;

		expect(text).toContain("Deployment architecture");
		expect(text).toContain("Network topology");
		expect(text).toContain("Security considerations");
	});
});
