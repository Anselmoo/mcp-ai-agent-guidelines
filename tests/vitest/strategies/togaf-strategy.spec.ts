/**
 * Tests for TOGAFStrategy
 *
 * @module tests/strategies/togaf-strategy
 */

import { describe, expect, it } from "vitest";
import type { SessionState } from "../../../src/domain/design/types.js";
import { OutputApproach } from "../../../src/strategies/output-strategy.js";
import { TOGAFStrategy } from "../../../src/strategies/togaf-strategy.js";

describe("TOGAFStrategy", () => {
	describe("constructor and properties", () => {
		it("should have TOGAF approach", () => {
			const strategy = new TOGAFStrategy();
			expect(strategy.approach).toBe(OutputApproach.TOGAF);
		});

		it("should have readonly approach property", () => {
			const strategy = new TOGAFStrategy();
			expect(strategy.approach).toBe(OutputApproach.TOGAF);
		});
	});

	describe("supports() method", () => {
		it("should support SessionState", () => {
			const strategy = new TOGAFStrategy();
			expect(strategy.supports("SessionState")).toBe(true);
		});

		it("should not support unsupported types", () => {
			const strategy = new TOGAFStrategy();
			expect(strategy.supports("PromptResult")).toBe(false);
			expect(strategy.supports("ScoringResult")).toBe(false);
			expect(strategy.supports("UnknownType")).toBe(false);
			expect(strategy.supports("")).toBe(false);
		});
	});

	describe("render() - SessionState", () => {
		it("should render SessionState with full context to TOGAF format", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-togaf-001",
				phase: "architecture",
				status: "in-progress",
				context: {
					businessGoals: [
						"Improve system scalability",
						"Reduce operational costs",
					],
					principles: ["Cloud-first", "API-driven"],
					stakeholders: ["CTO", "VP Engineering", "Product Team"],
					risks: ["Technical complexity", "Resource constraints"],
				},
				config: {
					goal: "Implement Cloud-Native Architecture",
					requirements: ["Microservices", "Containerization", "CI/CD"],
				},
				phases: {
					discovery: { status: "completed" },
					architecture: { status: "in-progress" },
					implementation: { status: "planned" },
				},
				artifacts: {
					spec: "specification.md",
					diagram: "architecture.mmd",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			// Verify primary document (Architecture Vision)
			expect(artifacts.primary).toBeDefined();
			expect(artifacts.primary.name).toBe("architecture-vision.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.content).toContain(
				"# Architecture Vision Document",
			);
			expect(artifacts.primary.content).toContain("## Executive Summary");
			expect(artifacts.primary.content).toContain(
				"Implement Cloud-Native Architecture",
			);
			expect(artifacts.primary.content).toContain(
				"## Request for Architecture Work",
			);
			expect(artifacts.primary.content).toContain(
				"## Business Goals and Drivers",
			);
			expect(artifacts.primary.content).toContain(
				"- Improve system scalability",
			);
			expect(artifacts.primary.content).toContain("- Reduce operational costs");
			expect(artifacts.primary.content).toContain("## Architecture Principles");
			expect(artifacts.primary.content).toContain("- Cloud-first");
			expect(artifacts.primary.content).toContain("- API-driven");
			expect(artifacts.primary.content).toContain("## Stakeholder Map");
			expect(artifacts.primary.content).toContain("- CTO");
			expect(artifacts.primary.content).toContain("## High-Level Architecture");
			expect(artifacts.primary.content).toContain("## Risk Assessment");
			expect(artifacts.primary.content).toContain("- Technical complexity");
			expect(artifacts.primary.content).toContain("## Architecture Repository");
			expect(artifacts.primary.content).toContain("- spec");

			// Verify secondary documents (TOGAF ADM phases)
			expect(artifacts.secondary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(5);

			// Business Architecture (Phase B)
			const businessArch = artifacts.secondary?.[0];
			expect(businessArch?.name).toBe("business-architecture.md");
			expect(businessArch?.format).toBe("markdown");
			expect(businessArch?.content).toContain("# Business Architecture");
			expect(businessArch?.content).toContain("## Business Strategy");
			expect(businessArch?.content).toContain("## Organization Structure");
			expect(businessArch?.content).toContain("## Business Capabilities");
			expect(businessArch?.content).toContain(
				"*TOGAF Phase B: Business Architecture*",
			);

			// Data Architecture (Phase C)
			const dataArch = artifacts.secondary?.[1];
			expect(dataArch?.name).toBe("data-architecture.md");
			expect(dataArch?.format).toBe("markdown");
			expect(dataArch?.content).toContain("# Data Architecture");
			expect(dataArch?.content).toContain("## Data Principles");
			expect(dataArch?.content).toContain("## Logical Data Model");
			expect(dataArch?.content).toContain("## Data Governance");
			expect(dataArch?.content).toContain("*TOGAF Phase C: Data Architecture*");

			// Application Architecture (Phase C)
			const appArch = artifacts.secondary?.[2];
			expect(appArch?.name).toBe("application-architecture.md");
			expect(appArch?.format).toBe("markdown");
			expect(appArch?.content).toContain("# Application Architecture");
			expect(appArch?.content).toContain("## Application Portfolio");
			expect(appArch?.content).toContain("## Application Services");
			expect(appArch?.content).toContain(
				"*TOGAF Phase C: Application Architecture*",
			);

			// Technology Architecture (Phase D)
			const techArch = artifacts.secondary?.[3];
			expect(techArch?.name).toBe("technology-architecture.md");
			expect(techArch?.format).toBe("markdown");
			expect(techArch?.content).toContain("# Technology Architecture");
			expect(techArch?.content).toContain("## Technology Principles");
			expect(techArch?.content).toContain("## Infrastructure Architecture");
			expect(techArch?.content).toContain("## Security Architecture");
			expect(techArch?.content).toContain(
				"*TOGAF Phase D: Technology Architecture*",
			);

			// Migration Plan (Phase E-F)
			const migrationPlan = artifacts.secondary?.[4];
			expect(migrationPlan?.name).toBe("migration-plan.md");
			expect(migrationPlan?.format).toBe("markdown");
			expect(migrationPlan?.content).toContain("# Migration Plan");
			expect(migrationPlan?.content).toContain("## Migration Strategy");
			expect(migrationPlan?.content).toContain("## Implementation Roadmap");
			expect(migrationPlan?.content).toContain("## Work Packages");
			expect(migrationPlan?.content).toContain(
				"*TOGAF Phase E-F: Migration Planning*",
			);
		});

		it("should render SessionState with minimal metadata", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-minimal",
				phase: "discovery",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"# Architecture Vision Document",
			);
			expect(artifacts.primary.content).toContain(
				"Executive summary to be documented",
			);
			expect(artifacts.secondary).toHaveLength(5);
		});

		it("should include metadata footer when requested", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-metadata",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result, { includeMetadata: true });

			expect(artifacts.primary.content).toContain(
				"*TOGAF Architecture Vision generated:",
			);
			expect(artifacts.primary.content).toMatch(/\d{4}-\d{2}-\d{2}T/);
		});

		it("should not include metadata footer by default", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-no-metadata",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).not.toContain(
				"*TOGAF Architecture Vision generated:",
			);
		});

		it("should extract requirements into Architecture Work section", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-requirements",
				phase: "architecture",
				context: {},
				config: {
					goal: "Modernize Legacy Systems",
					requirements: [
						"Migrate to microservices",
						"Implement API gateway",
						"Adopt DevOps practices",
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"**Objective:** Modernize Legacy Systems",
			);
			expect(artifacts.primary.content).toContain("**Requirements:**");
			expect(artifacts.primary.content).toContain("- Migrate to microservices");
			expect(artifacts.primary.content).toContain("- Implement API gateway");
			expect(artifacts.primary.content).toContain("- Adopt DevOps practices");
		});

		it("should format phase data in High-Level Architecture", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-phases",
				phase: "architecture",
				context: {},
				phases: {
					"Phase 1": {
						activities: ["Design", "Prototype"],
						duration: "3 months",
					},
					"Phase 2": { activities: ["Build", "Test"], duration: "6 months" },
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("### Phase 1");
			expect(artifacts.primary.content).toContain("### Phase 2");
		});

		it("should include current phase and status in executive summary", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-status",
				phase: "implementation",
				status: "completed",
				context: {},
				config: {
					goal: "Deploy Cloud Infrastructure",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"Deploy Cloud Infrastructure",
			);
			expect(artifacts.primary.content).toContain(
				"**Current Phase:** implementation",
			);
			expect(artifacts.primary.content).toContain("**Status:** completed");
		});

		it("should extract business capabilities from context", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-capabilities",
				phase: "architecture",
				context: {
					capabilities: ["Order Management", "Inventory Control", "Analytics"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			const businessArch = artifacts.secondary?.[0];
			expect(businessArch?.content).toContain("## Business Capabilities");
			expect(businessArch?.content).toContain("- Order Management");
			expect(businessArch?.content).toContain("- Inventory Control");
			expect(businessArch?.content).toContain("- Analytics");
		});

		it("should extract dependencies from context", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-dependencies",
				phase: "architecture",
				context: {
					dependencies: ["Legacy system integration", "Third-party APIs"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			const migrationPlan = artifacts.secondary?.[4];
			expect(migrationPlan?.content).toContain("## Dependencies");
			expect(migrationPlan?.content).toContain("- Legacy system integration");
			expect(migrationPlan?.content).toContain("- Third-party APIs");
		});

		it("should include implementation roadmap from phases", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-roadmap",
				phase: "architecture",
				context: {},
				phases: {
					Discovery: "Assess current state",
					Design: "Create target architecture",
					Build: "Implement solution",
					Deploy: "Roll out to production",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			const migrationPlan = artifacts.secondary?.[4];
			expect(migrationPlan?.content).toContain("## Implementation Roadmap");
			expect(migrationPlan?.content).toContain("### Phase 1: Discovery");
			expect(migrationPlan?.content).toContain("### Phase 2: Design");
			expect(migrationPlan?.content).toContain("### Phase 3: Build");
			expect(migrationPlan?.content).toContain("### Phase 4: Deploy");
		});
	});

	describe("render() - error handling", () => {
		it("should throw error for unsupported result type", () => {
			const strategy = new TOGAFStrategy();
			const invalidResult = {
				someField: "value",
			};

			expect(() => strategy.render(invalidResult as SessionState)).toThrow(
				"Unsupported domain result type for TOGAFStrategy",
			);
		});

		it("should throw error for null result", () => {
			const strategy = new TOGAFStrategy();

			expect(() => strategy.render(null as unknown as SessionState)).toThrow(
				"Unsupported domain result type for TOGAFStrategy",
			);
		});

		it("should throw error for undefined result", () => {
			const strategy = new TOGAFStrategy();

			expect(() =>
				strategy.render(undefined as unknown as SessionState),
			).toThrow("Unsupported domain result type for TOGAFStrategy");
		});

		it("should throw error for PromptResult type", () => {
			const strategy = new TOGAFStrategy();
			const promptResult = {
				sections: [{ title: "Test", body: "Content", level: 1 }],
				metadata: { complexity: 50, tokenEstimate: 100 },
			};

			expect(() =>
				strategy.render(promptResult as unknown as SessionState),
			).toThrow("Unsupported domain result type for TOGAFStrategy");
		});
	});

	describe("output artifacts structure", () => {
		it("should return OutputArtifacts with primary and secondary documents", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-structure",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary).toBeDefined();
			expect(artifacts.secondary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(5);
			expect(artifacts.crossCutting).toBeUndefined();
		});

		it("should have correct document formats", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-formats",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.name).toMatch(/\.md$/);
			expect(typeof artifacts.primary.content).toBe("string");

			for (const doc of artifacts.secondary || []) {
				expect(doc.format).toBe("markdown");
				expect(doc.name).toMatch(/\.md$/);
				expect(typeof doc.content).toBe("string");
			}
		});

		it("should have unique names for all documents", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-names",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			const names = [
				artifacts.primary.name,
				...(artifacts.secondary?.map((d) => d.name) || []),
			];

			const uniqueNames = new Set(names);
			expect(uniqueNames.size).toBe(names.length);
		});
	});

	describe("TOGAF ADM phase coverage", () => {
		it("should include all required TOGAF sections in Architecture Vision", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-vision",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const content = artifacts.primary.content;

			expect(content).toContain("## Executive Summary");
			expect(content).toContain("## Request for Architecture Work");
			expect(content).toContain("## Business Goals and Drivers");
			expect(content).toContain("## Architecture Principles");
			expect(content).toContain("## Stakeholder Map");
			expect(content).toContain("## High-Level Architecture");
			expect(content).toContain("## Risk Assessment");
			expect(content).toContain("## Architecture Repository");
		});

		it("should include all TOGAF ADM phases in secondary documents", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-phases",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const secondaryNames = artifacts.secondary?.map((d) => d.name) || [];

			expect(secondaryNames).toContain("business-architecture.md");
			expect(secondaryNames).toContain("data-architecture.md");
			expect(secondaryNames).toContain("application-architecture.md");
			expect(secondaryNames).toContain("technology-architecture.md");
			expect(secondaryNames).toContain("migration-plan.md");
		});

		it("should include default principles when not provided", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-default-principles",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"**Principle 1:** Follow industry best practices",
			);
			expect(artifacts.primary.content).toContain(
				"**Principle 2:** Ensure scalability and maintainability",
			);
			expect(artifacts.primary.content).toContain(
				"**Principle 3:** Prioritize security and compliance",
			);
		});

		it("should include default stakeholders when not provided", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-default-stakeholders",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("**Business Sponsor:** TBD");
			expect(artifacts.primary.content).toContain("**Architecture Team:** TBD");
			expect(artifacts.primary.content).toContain("**Development Teams:** TBD");
			expect(artifacts.primary.content).toContain("**Operations Team:** TBD");
		});
	});

	describe("data extraction and formatting", () => {
		it("should handle string phase data", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-string-phase",
				phase: "architecture",
				context: {},
				phases: {
					Phase1: "Simple string description",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("Simple string description");
		});

		it("should handle object phase data", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-object-phase",
				phase: "architecture",
				context: {},
				phases: {
					Phase1: { key: "value", nested: { data: "test" } },
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			// Should be formatted as JSON
			expect(artifacts.primary.content).toContain('"key"');
			expect(artifacts.primary.content).toContain('"value"');
		});

		it("should handle array context fields", () => {
			const strategy = new TOGAFStrategy();
			const result: SessionState = {
				id: "session-arrays",
				phase: "architecture",
				context: {
					goals: ["Goal 1", "Goal 2", "Goal 3"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("- Goal 1");
			expect(artifacts.primary.content).toContain("- Goal 2");
			expect(artifacts.primary.content).toContain("- Goal 3");
		});
	});
});
