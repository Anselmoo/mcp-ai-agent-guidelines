/**
 * Tests for SDDStrategy
 *
 * @module tests/strategies/sdd-strategy
 */

import { describe, expect, it } from "vitest";
import type { SessionState } from "../../../src/domain/design/types.js";
import type { PromptResult } from "../../../src/domain/prompting/types.js";
import { OutputApproach } from "../../../src/strategies/output-strategy.js";
import { SDDStrategy } from "../../../src/strategies/sdd-strategy.js";

describe("SDDStrategy", () => {
	describe("constructor and properties", () => {
		it("should have SDD approach", () => {
			const strategy = new SDDStrategy();
			expect(strategy.approach).toBe(OutputApproach.SDD);
		});

		it("should have readonly approach property", () => {
			const strategy = new SDDStrategy();
			// TypeScript readonly is compile-time only, verify it's set correctly
			expect(strategy.approach).toBe(OutputApproach.SDD);
		});
	});

	describe("supports() method", () => {
		it("should support SessionState", () => {
			const strategy = new SDDStrategy();
			expect(strategy.supports("SessionState")).toBe(true);
		});

		it("should support PromptResult", () => {
			const strategy = new SDDStrategy();
			expect(strategy.supports("PromptResult")).toBe(true);
		});

		it("should not support unsupported types", () => {
			const strategy = new SDDStrategy();
			expect(strategy.supports("ScoringResult")).toBe(false);
			expect(strategy.supports("UnknownType")).toBe(false);
			expect(strategy.supports("")).toBe(false);
		});
	});

	describe("render() - SessionState", () => {
		it("should render SessionState with all three documents", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "E-commerce Checkout",
					overview: "Implement secure checkout flow",
					requirements: ["Payment processing", "Cart validation"],
					constraints: ["PCI compliance", "GDPR compliance"],
					successCriteria: ["All tests pass", "Security audit complete"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe("spec.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.secondary).toHaveLength(2);
			expect(artifacts.secondary?.[0].name).toBe("plan.md");
			expect(artifacts.secondary?.[1].name).toBe("tasks.md");
		});

		it("should generate spec.md with proper structure", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Implement authentication system",
					requirements: ["JWT tokens", "OAuth2 support"],
					constraints: ["OAuth2.0 standard", "Refresh token rotation"],
				},
				context: {
					nonFunctionalRequirements: ["Performance: <100ms response"],
					successCriteria: ["100% test coverage", "Security review passed"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"# Specification: Implement authentication system",
			);
			expect(artifacts.primary.content).toContain("## Overview");
			expect(artifacts.primary.content).toContain("## Requirements");
			expect(artifacts.primary.content).toContain(
				"### Functional Requirements",
			);
			expect(artifacts.primary.content).toContain(
				"### Non-Functional Requirements",
			);
			expect(artifacts.primary.content).toContain("## Constraints");
			expect(artifacts.primary.content).toContain("## Success Criteria");
			expect(artifacts.primary.content).toContain("1. JWT tokens");
			expect(artifacts.primary.content).toContain("2. OAuth2 support");
			expect(artifacts.primary.content).toContain("- OAuth2.0 standard");
			expect(artifacts.primary.content).toContain("- [ ] 100% test coverage");
		});

		it("should generate plan.md with phases", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {
					timeline: "4 weeks total",
					dependencies: ["Database schema", "API gateway"],
					risks: ["Third-party API downtime", "Performance bottlenecks"],
				},
				phases: {
					discovery: "Completed requirements gathering",
					requirements: "Defined functional and non-functional requirements",
					planning: "Current phase - creating implementation plan",
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[0];

			expect(plan?.name).toBe("plan.md");
			expect(plan?.content).toContain("# Implementation Plan");
			expect(plan?.content).toContain("## Phases");
			expect(plan?.content).toContain("### Phase 1: discovery");
			expect(plan?.content).toContain("### Phase 2: requirements");
			expect(plan?.content).toContain("## Timeline");
			expect(plan?.content).toContain("4 weeks total");
			expect(plan?.content).toContain("## Dependencies");
			expect(plan?.content).toContain("- Database schema");
			expect(plan?.content).toContain("## Risks");
			expect(plan?.content).toContain("- Third-party API downtime");
		});

		it("should generate tasks.md with Mermaid diagram", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {
					tasks: [
						{ id: "T1", title: "Setup database", estimate: "2h" },
						{
							id: "T2",
							title: "Create API endpoints",
							estimate: "4h",
							dependencies: ["T1"],
						},
						{
							id: "T3",
							title: "Add authentication",
							estimate: "3h",
							dependencies: ["T2"],
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[1];

			expect(tasks?.name).toBe("tasks.md");
			expect(tasks?.content).toContain("# Tasks");
			expect(tasks?.content).toContain("## Task List");
			expect(tasks?.content).toContain("- [ ] Setup database (2h)");
			expect(tasks?.content).toContain("- [ ] Create API endpoints (4h)");
			expect(tasks?.content).toContain("- [ ] Add authentication (3h)");
			expect(tasks?.content).toContain("## Dependencies Graph");
			expect(tasks?.content).toContain("```mermaid");
			expect(tasks?.content).toContain("graph TD");
			expect(tasks?.content).toContain("T1[Setup database]");
			expect(tasks?.content).toContain("T1 --> T2");
			expect(tasks?.content).toContain("T2 --> T3");
		});

		it("should handle minimal SessionState with defaults", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "minimal-session",
				phase: "discovery",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# Specification: Feature");
			expect(artifacts.primary.content).toContain("To be defined");
			expect(artifacts.primary.content).toContain("None specified");
			expect(artifacts.secondary?.[0].content).toContain("To be estimated");
			expect(artifacts.secondary?.[1].content).toContain(
				"- [ ] Define requirements",
			);
		});

		it("should extract title from config.goal", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Implement user management",
				},
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"# Specification: Implement user management",
			);
		});

		it("should extract title from context.title", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Payment Integration",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"# Specification: Payment Integration",
			);
		});

		it("should extract phases from history if phases not defined", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "architecture",
				context: {},
				history: [
					{
						from: "discovery",
						to: "requirements",
						timestamp: "2026-01-01T10:00:00Z",
					},
					{
						from: "requirements",
						to: "planning",
						timestamp: "2026-01-02T10:00:00Z",
					},
					{
						from: "planning",
						to: "architecture",
						timestamp: "2026-01-03T10:00:00Z",
					},
				],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[0];

			expect(plan?.content).toContain("### Phase 1: requirements");
			expect(plan?.content).toContain("### Phase 2: planning");
			expect(plan?.content).toContain("### Phase 3: architecture");
		});

		it("should extract timeline from history timestamps", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				history: [
					{
						from: "discovery",
						to: "requirements",
						timestamp: "2026-01-01T10:00:00Z",
					},
					{
						from: "requirements",
						to: "planning",
						timestamp: "2026-01-02T10:00:00Z",
					},
				],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[0];

			expect(plan?.content).toContain("2026-01-01T10:00:00Z");
			expect(plan?.content).toContain("Transitioned to requirements");
		});

		it("should handle tasks without dependencies", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {
					tasks: [
						{ id: "T1", title: "Setup environment" },
						{ id: "T2", title: "Configure linting" },
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[1];

			expect(tasks?.content).toContain("- [ ] Setup environment");
			expect(tasks?.content).toContain("- [ ] Configure linting");
			// Should still have default graph when no dependencies
			expect(tasks?.content).toContain("graph TD");
		});
	});

	describe("render() - PromptResult", () => {
		it("should render PromptResult to SDD format", () => {
			const strategy = new SDDStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Context",
						body: "Building a new API service",
						level: 1,
					},
					{
						title: "Requirements",
						body: "RESTful endpoints with authentication",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 200,
					sections: 2,
					techniques: ["zero-shot"],
					requirementsCount: 1,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe("spec.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.secondary).toHaveLength(2);
			expect(artifacts.secondary?.[0].name).toBe("plan.md");
			expect(artifacts.secondary?.[1].name).toBe("tasks.md");
		});

		it("should extract overview from first section", () => {
			const strategy = new SDDStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Overview",
						body: "Microservices architecture for e-commerce platform",
						level: 1,
					},
				],
				metadata: {
					complexity: 40,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["few-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("## Overview");
			expect(artifacts.primary.content).toContain(
				"Microservices architecture for e-commerce platform",
			);
		});

		it("should extract requirements from sections", () => {
			const strategy = new SDDStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Overview",
						body: "Payment processing system",
						level: 1,
					},
					{
						title: "Functional Requirements",
						body: "Support multiple payment methods",
						level: 2,
					},
					{
						title: "Requirements",
						body: "PCI DSS compliance",
						level: 2,
					},
				],
				metadata: {
					complexity: 60,
					tokenEstimate: 300,
					sections: 3,
					techniques: ["chain-of-thought"],
					requirementsCount: 2,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("## Requirements");
			expect(artifacts.primary.content).toContain(
				"1. Support multiple payment methods",
			);
			expect(artifacts.primary.content).toContain("2. PCI DSS compliance");
		});

		it("should generate default plan.md for PromptResult", () => {
			const strategy = new SDDStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[0];

			expect(plan?.content).toContain("# Implementation Plan");
			expect(plan?.content).toContain("To be defined");
			expect(plan?.content).toContain("To be estimated");
			expect(plan?.content).toContain("To be identified");
			expect(plan?.content).toContain("To be assessed");
		});

		it("should generate default tasks.md for PromptResult", () => {
			const strategy = new SDDStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[1];

			expect(tasks?.content).toContain("# Tasks");
			expect(tasks?.content).toContain("- [ ] Define requirements");
			expect(tasks?.content).toContain("- [ ] Create implementation plan");
			expect(tasks?.content).toContain("```mermaid");
			expect(tasks?.content).toContain("graph TD");
			expect(tasks?.content).toContain("A[Define Requirements]");
		});

		it("should handle empty PromptResult sections", () => {
			const strategy = new SDDStrategy();
			const result: PromptResult = {
				sections: [],
				metadata: {
					complexity: 20,
					tokenEstimate: 50,
					sections: 0,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# Specification: Feature");
			expect(artifacts.primary.content).toContain("To be defined");
		});
	});

	describe("render() - error handling", () => {
		it("should throw error for unsupported result type", () => {
			const strategy = new SDDStrategy();
			const invalidResult = {
				someField: "value",
			};

			expect(() =>
				strategy.render(invalidResult as SessionState | PromptResult),
			).toThrow("Unsupported domain result type");
		});

		it("should throw error for null result", () => {
			const strategy = new SDDStrategy();

			expect(() =>
				strategy.render(null as unknown as SessionState | PromptResult),
			).toThrow("Unsupported domain result type");
		});

		it("should throw error for undefined result", () => {
			const strategy = new SDDStrategy();

			expect(() =>
				strategy.render(undefined as unknown as SessionState | PromptResult),
			).toThrow("Unsupported domain result type");
		});
	});

	describe("output artifacts structure", () => {
		it("should return OutputArtifacts with primary and secondary documents", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary).toBeDefined();
			expect(artifacts.primary.name).toBe("spec.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.secondary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(2);
			expect(artifacts.crossCutting).toBeUndefined();
		});

		it("should have correct document formats for all outputs", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.secondary?.[0].format).toBe("markdown");
			expect(artifacts.secondary?.[1].format).toBe("markdown");
		});

		it("should have all three documents with correct names", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe("spec.md");
			expect(artifacts.secondary?.[0].name).toBe("plan.md");
			expect(artifacts.secondary?.[1].name).toBe("tasks.md");
		});

		it("should have all three documents with non-empty content", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content.length).toBeGreaterThan(0);
			expect(artifacts.secondary?.[0].content.length).toBeGreaterThan(0);
			expect(artifacts.secondary?.[1].content.length).toBeGreaterThan(0);
		});
	});

	describe("integration with RenderOptions", () => {
		it("should accept partial RenderOptions", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeMetadata: true,
				verbosity: "verbose",
			});

			expect(artifacts).toBeDefined();
			expect(artifacts.primary).toBeDefined();
		});

		it("should work without options parameter", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts).toBeDefined();
			expect(artifacts.primary).toBeDefined();
		});
	});

	describe("cross-references and interconnections", () => {
		it("should maintain consistency across all three documents", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "User Authentication",
				},
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			// Title should appear in spec
			expect(artifacts.primary.content).toContain("User Authentication");

			// All documents should be generated
			expect(artifacts.primary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(2);
		});

		it("should extract phase information consistently", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				phases: {
					discovery: "Completed",
					requirements: "Completed",
					planning: "In progress",
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[0];

			expect(plan?.content).toContain("### Phase 1: discovery");
			expect(plan?.content).toContain("### Phase 2: requirements");
			expect(plan?.content).toContain("### Phase 3: planning");
		});
	});

	describe("Mermaid diagram generation", () => {
		it("should generate valid Mermaid syntax", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {
					tasks: [
						{ id: "A", title: "Task A" },
						{ id: "B", title: "Task B", dependencies: ["A"] },
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[1];

			expect(tasks?.content).toContain("```mermaid");
			expect(tasks?.content).toMatch(/graph TD/);
			expect(tasks?.content).toContain("```");
		});

		it("should generate default graph when no tasks defined", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[1];

			expect(tasks?.content).toContain("```mermaid");
			expect(tasks?.content).toContain("A[Define Requirements]");
			expect(tasks?.content).toContain("B[Create Plan]");
			expect(tasks?.content).toContain("C[Break Down Tasks]");
			expect(tasks?.content).toContain(
				"A[Define Requirements] --> B[Create Plan]",
			);
			expect(tasks?.content).toContain("B --> C[Break Down Tasks]");
		});

		it("should handle complex dependency graphs", () => {
			const strategy = new SDDStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {
					tasks: [
						{ id: "T1", title: "Foundation" },
						{ id: "T2", title: "Module A", dependencies: ["T1"] },
						{ id: "T3", title: "Module B", dependencies: ["T1"] },
						{ id: "T4", title: "Integration", dependencies: ["T2", "T3"] },
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[1];

			expect(tasks?.content).toContain("T1[Foundation]");
			expect(tasks?.content).toContain("T2[Module A]");
			expect(tasks?.content).toContain("T3[Module B]");
			expect(tasks?.content).toContain("T4[Integration]");
			expect(tasks?.content).toContain("T1 --> T2");
			expect(tasks?.content).toContain("T1 --> T3");
			expect(tasks?.content).toContain("T2 --> T4");
			expect(tasks?.content).toContain("T3 --> T4");
		});
	});
});
