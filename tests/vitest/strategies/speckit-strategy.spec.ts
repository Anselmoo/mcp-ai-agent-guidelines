/**
 * Tests for SpecKitStrategy
 *
 * @module tests/strategies/speckit-strategy
 */

import { describe, expect, it } from "vitest";
import type { SessionState } from "../../../src/domain/design/types.js";
import { OutputApproach } from "../../../src/strategies/output-strategy.js";
import { SpecKitStrategy } from "../../../src/strategies/speckit-strategy.js";

describe("SpecKitStrategy", () => {
	describe("constructor and properties", () => {
		it("should have SPECKIT approach", () => {
			const strategy = new SpecKitStrategy();
			expect(strategy.approach).toBe(OutputApproach.SPECKIT);
		});

		it("should have readonly approach property", () => {
			const strategy = new SpecKitStrategy();
			// TypeScript readonly is compile-time only, verify it's set correctly
			expect(strategy.approach).toBe(OutputApproach.SPECKIT);
		});
	});

	describe("supports() method", () => {
		it("should support SessionState", () => {
			const strategy = new SpecKitStrategy();
			expect(strategy.supports("SessionState")).toBe(true);
		});

		it("should not support PromptResult", () => {
			const strategy = new SpecKitStrategy();
			expect(strategy.supports("PromptResult")).toBe(false);
		});

		it("should not support ScoringResult", () => {
			const strategy = new SpecKitStrategy();
			expect(strategy.supports("ScoringResult")).toBe(false);
		});

		it("should not support unsupported types", () => {
			const strategy = new SpecKitStrategy();
			expect(strategy.supports("UnknownType")).toBe(false);
			expect(strategy.supports("")).toBe(false);
		});
	});

	describe("render() - SessionState", () => {
		it("should render SessionState with README and 5 secondary documents", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "E-commerce Checkout",
					overview: "Implement secure checkout flow",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toContain("README.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.secondary).toHaveLength(5);
			expect(artifacts.secondary?.[0].name).toContain("spec.md");
			expect(artifacts.secondary?.[1].name).toContain("plan.md");
			expect(artifacts.secondary?.[2].name).toContain("tasks.md");
			expect(artifacts.secondary?.[3].name).toContain("adr.md");
			expect(artifacts.secondary?.[4].name).toContain("roadmap.md");
		});

		it("should generate README.md with proper structure", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Implement authentication system",
				},
				context: {
					overview: "JWT-based authentication with OAuth2 support",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"# Spec Kit: Implement authentication system",
			);
			expect(artifacts.primary.content).toContain("## Overview");
			expect(artifacts.primary.content).toContain(
				"JWT-based authentication with OAuth2 support",
			);
			expect(artifacts.primary.content).toContain("## Contents");
			expect(artifacts.primary.content).toContain("- [spec.md](./spec.md)");
			expect(artifacts.primary.content).toContain("- [plan.md](./plan.md)");
			expect(artifacts.primary.content).toContain("- [tasks.md](./tasks.md)");
			expect(artifacts.primary.content).toContain("- [adr.md](./adr.md)");
			expect(artifacts.primary.content).toContain(
				"- [roadmap.md](./roadmap.md)",
			);
			expect(artifacts.primary.content).toContain("## Quick Start");
			expect(artifacts.primary.content).toContain("## Status");
			expect(artifacts.primary.content).toContain("**Owner**: @copilot");
		});

		it("should generate spec.md with requirements and constraints", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Payment Gateway Integration",
					requirements: [
						"Support credit cards",
						"Handle refunds",
						"PCI compliance",
					],
					constraints: ["Must use Stripe API", "GDPR compliant"],
				},
				context: {
					nonFunctionalRequirements: ["99.9% uptime", "< 200ms response time"],
					acceptanceCriteria: ["All tests pass", "Security audit complete"],
					outOfScope: ["Bitcoin payments", "Installment plans"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.name).toContain("spec.md");
			expect(spec?.content).toContain(
				"# Specification: Payment Gateway Integration",
			);
			expect(spec?.content).toContain("## Overview");
			expect(spec?.content).toContain("## Objectives");
			expect(spec?.content).toContain("## Requirements");
			expect(spec?.content).toContain("### Functional Requirements");
			expect(spec?.content).toContain("1. Support credit cards");
			expect(spec?.content).toContain("2. Handle refunds");
			expect(spec?.content).toContain("3. PCI compliance");
			expect(spec?.content).toContain("### Non-Functional Requirements");
			expect(spec?.content).toContain("1. 99.9% uptime");
			expect(spec?.content).toContain("2. < 200ms response time");
			expect(spec?.content).toContain("## Constraints");
			expect(spec?.content).toContain("- Must use Stripe API");
			expect(spec?.content).toContain("- GDPR compliant");
			expect(spec?.content).toContain("## Acceptance Criteria");
			expect(spec?.content).toContain("- [ ] All tests pass");
			expect(spec?.content).toContain("- [ ] Security audit complete");
			expect(spec?.content).toContain("## Out of Scope");
			expect(spec?.content).toContain("- Bitcoin payments");
			expect(spec?.content).toContain("- Installment plans");
		});

		it("should generate plan.md with phases and timeline", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "API Gateway",
				},
				context: {
					approach: "Microservices architecture with API gateway pattern",
					timeline: "8 weeks total implementation",
					dependencies: ["Kubernetes cluster", "Service mesh"],
					risks: [
						{
							name: "Network latency",
							mitigation: "Implement caching layer",
						},
						"Third-party API changes",
					],
				},
				phases: {
					discovery: "Requirements gathering complete",
					planning: "Currently defining implementation approach",
					implementation: "Pending",
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[1];

			expect(plan?.name).toContain("plan.md");
			expect(plan?.content).toContain("# Implementation Plan: API Gateway");
			expect(plan?.content).toContain("## Approach");
			expect(plan?.content).toContain(
				"Microservices architecture with API gateway pattern",
			);
			expect(plan?.content).toContain("## Phases");
			expect(plan?.content).toContain("### PHASE-001: discovery");
			expect(plan?.content).toContain("### PHASE-002: planning");
			expect(plan?.content).toContain("### PHASE-003: implementation");
			expect(plan?.content).toContain("## Timeline");
			expect(plan?.content).toContain("| Phase | Start | End |");
			expect(plan?.content).toContain("## Dependencies");
			expect(plan?.content).toContain("| DEP-001 | Kubernetes cluster | TBD |");
			expect(plan?.content).toContain("| DEP-002 | Service mesh | TBD |");
			expect(plan?.content).toContain("## Risks");
			expect(plan?.content).toContain(
				"| RISK-001 | Network latency | medium | Implement caching layer |",
			);
			expect(plan?.content).toContain(
				"| RISK-002 | Third-party API changes | medium |",
			);
		});

		it("should generate tasks.md with task list and tracking", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {
					tasks: [
						{
							id: "T1",
							title: "Setup infrastructure",
							estimate: "2 days",
							priority: "high",
						},
						{
							id: "T2",
							title: "Implement API endpoints",
							estimate: "1 week",
							priority: "high",
							dependencies: ["T1"],
						},
						{
							title: "Write documentation",
							estimate: "2 days",
							priority: "medium",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[2];

			expect(tasks?.name).toContain("tasks.md");
			expect(tasks?.content).toContain("# Tasks:");
			expect(tasks?.content).toContain("## Task List");
			expect(tasks?.content).toContain(
				"1. [ ] Setup infrastructure (2 days) [high]",
			);
			expect(tasks?.content).toContain(
				"2. [ ] Implement API endpoints (1 week) [high]",
			);
			expect(tasks?.content).toContain(
				"3. [ ] Write documentation (2 days) [medium]",
			);
			expect(tasks?.content).toContain("## Task Dependencies");
			expect(tasks?.content).toContain("**T2** depends on: T1");
			expect(tasks?.content).toContain("## Completion Tracking");
			expect(tasks?.content).toContain("Total Tasks: 3");
			expect(tasks?.content).toContain("Completed: 0");
		});

		it("should generate adr.md with decision context", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "architecture",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Database Migration",
				},
				context: {
					adrContext: "Need to scale database to handle 10x traffic growth",
					adrDecision:
						"Migrate from PostgreSQL to distributed PostgreSQL cluster",
					adrConsequences: {
						positive: [
							"Improved scalability",
							"Better fault tolerance",
							"Geographic distribution",
						],
						negative: [
							"Increased complexity",
							"Higher operational cost",
							"Migration downtime",
						],
						neutral: ["Team needs training", "New monitoring tools required"],
					},
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const adr = artifacts.secondary?.[3];

			expect(adr?.name).toContain("adr.md");
			expect(adr?.content).toContain("# ADR: Database Migration");
			expect(adr?.content).toContain("## Status");
			expect(adr?.content).toContain("Proposed");
			expect(adr?.content).toContain("## Context");
			expect(adr?.content).toContain(
				"Need to scale database to handle 10x traffic growth",
			);
			expect(adr?.content).toContain("## Decision");
			expect(adr?.content).toContain(
				"Migrate from PostgreSQL to distributed PostgreSQL cluster",
			);
			expect(adr?.content).toContain("## Consequences");
			expect(adr?.content).toContain("### Positive");
			expect(adr?.content).toContain("- Improved scalability");
			expect(adr?.content).toContain("- Better fault tolerance");
			expect(adr?.content).toContain("### Negative");
			expect(adr?.content).toContain("- Increased complexity");
			expect(adr?.content).toContain("- Migration downtime");
			expect(adr?.content).toContain("### Neutral");
			expect(adr?.content).toContain("- Team needs training");
		});

		it("should generate roadmap.md with milestones", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Mobile App Launch",
				},
				context: {
					milestones: [
						{
							name: "MVP Complete",
							date: "2026-03-01",
							deliverables: [
								"User authentication",
								"Core features",
								"Basic UI",
							],
						},
						{
							name: "Beta Launch",
							date: "2026-04-15",
							deliverables: ["Bug fixes", "Performance optimization"],
						},
						{
							name: "Public Release",
							date: "2026-06-01",
						},
					],
					deliverables: [
						"iOS app",
						"Android app",
						"Backend API",
						"User documentation",
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const roadmap = artifacts.secondary?.[4];

			expect(roadmap?.name).toContain("roadmap.md");
			expect(roadmap?.content).toContain("# Roadmap: Mobile App Launch");
			expect(roadmap?.content).toContain("## Milestones");
			expect(roadmap?.content).toContain("### Milestone 1: MVP Complete");
			expect(roadmap?.content).toContain("**Target Date**: 2026-03-01");
			expect(roadmap?.content).toContain("- User authentication");
			expect(roadmap?.content).toContain("- Core features");
			expect(roadmap?.content).toContain("### Milestone 2: Beta Launch");
			expect(roadmap?.content).toContain("**Target Date**: 2026-04-15");
			expect(roadmap?.content).toContain("### Milestone 3: Public Release");
			expect(roadmap?.content).toContain("**Target Date**: 2026-06-01");
			expect(roadmap?.content).toContain("## Key Deliverables");
			expect(roadmap?.content).toContain("- iOS app");
			expect(roadmap?.content).toContain("- Android app");
			expect(roadmap?.content).toContain("- Backend API");
		});

		it("should handle minimal SessionState with defaults", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "minimal-session",
				phase: "discovery",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# Spec Kit: Feature");
			expect(artifacts.primary.content).toContain("To be defined");
			expect(artifacts.secondary?.[0].content).toContain(
				"# Specification: Feature",
			);
			expect(artifacts.secondary?.[1].content).toContain(
				"# Implementation Plan: Feature",
			);
			expect(artifacts.secondary?.[2].content).toContain("# Tasks: Feature");
			expect(artifacts.secondary?.[3].content).toContain("# ADR: Feature");
			expect(artifacts.secondary?.[4].content).toContain("# Roadmap: Feature");
		});

		it("should use goal from config as title", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "User Management System",
				},
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"# Spec Kit: User Management System",
			);
			expect(artifacts.secondary?.[0].content).toContain(
				"# Specification: User Management System",
			);
		});

		it("should use context.title as title", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Real-time Chat",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# Spec Kit: Real-time Chat");
			expect(artifacts.secondary?.[0].content).toContain(
				"# Specification: Real-time Chat",
			);
		});

		it("should include session status in README", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {},
				history: [],
				status: "active",
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("**Status**: active");
		});

		it("should generate default phases when not provided", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[1];

			expect(plan?.content).toContain("### PHASE-001: Requirements Gathering");
			expect(plan?.content).toContain("### PHASE-002: Design & Architecture");
			expect(plan?.content).toContain("### PHASE-003: Implementation");
			expect(plan?.content).toContain("### PHASE-004: Testing & Validation");
		});

		it("should generate default milestones when not provided", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const roadmap = artifacts.secondary?.[4];

			expect(roadmap?.content).toContain(
				"### Milestone 1: Requirements Complete",
			);
			expect(roadmap?.content).toContain("### Milestone 2: Design Complete");
			expect(roadmap?.content).toContain(
				"### Milestone 3: Implementation Complete",
			);
			expect(roadmap?.content).toContain("### Milestone 4: Testing Complete");
		});

		it("should derive tasks from requirements when tasks not provided", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				config: {
					sessionId: "test-session",
					context: {},
					requirements: ["Add search feature", "Implement filters"],
				},
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[2];

			expect(tasks?.content).toContain("1. [ ] Implement: Add search feature");
			expect(tasks?.content).toContain("2. [ ] Implement: Implement filters");
		});
	});

	describe("slugify() functionality", () => {
		it("should slugify title correctly", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "E-commerce Product Catalog",
				},
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe(
				"e-commerce-product-catalog/README.md",
			);
			expect(artifacts.secondary?.[0].name).toBe(
				"e-commerce-product-catalog/spec.md",
			);
		});

		it("should handle special characters in slugify", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "User's Real-Time Chat (v2.0)!",
				},
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe(
				"user-s-real-time-chat-v2-0/README.md",
			);
		});

		it("should truncate long titles to 50 characters", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "This is a very long title that should be truncated to exactly fifty characters maximum",
				},
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const slug = artifacts.primary.name.split("/")[0];

			expect(slug.length).toBeLessThanOrEqual(50);
		});

		it("should remove leading and trailing hyphens", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "---Feature---",
				},
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe("feature/README.md");
		});
	});

	describe("render() - error handling", () => {
		it("should throw error for non-SessionState input", () => {
			const strategy = new SpecKitStrategy();
			const invalidResult = {
				someField: "value",
			};

			expect(() => strategy.render(invalidResult as SessionState)).toThrow(
				"SpecKitStrategy only supports SessionState",
			);
		});

		it("should throw error for null input", () => {
			const strategy = new SpecKitStrategy();

			expect(() => strategy.render(null as unknown as SessionState)).toThrow(
				"SpecKitStrategy only supports SessionState",
			);
		});

		it("should throw error for undefined input", () => {
			const strategy = new SpecKitStrategy();

			expect(() =>
				strategy.render(undefined as unknown as SessionState),
			).toThrow("SpecKitStrategy only supports SessionState");
		});
	});

	describe("output artifacts structure", () => {
		it("should return OutputArtifacts with primary and 5 secondary documents", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary).toBeDefined();
			expect(artifacts.primary.name).toContain("README.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.secondary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(5);
			expect(artifacts.crossCutting).toBeUndefined();
		});

		it("should have correct document formats for all outputs", () => {
			const strategy = new SpecKitStrategy();
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
			expect(artifacts.secondary?.[2].format).toBe("markdown");
			expect(artifacts.secondary?.[3].format).toBe("markdown");
			expect(artifacts.secondary?.[4].format).toBe("markdown");
		});

		it("should have all documents with non-empty content", () => {
			const strategy = new SpecKitStrategy();
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
			expect(artifacts.secondary?.[2].content.length).toBeGreaterThan(0);
			expect(artifacts.secondary?.[3].content.length).toBeGreaterThan(0);
			expect(artifacts.secondary?.[4].content.length).toBeGreaterThan(0);
		});
	});

	describe("cross-references between documents", () => {
		it("should include cross-references in spec.md", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("See [plan.md](./plan.md)");
			expect(spec?.content).toContain("See [adr.md](./adr.md)");
		});

		it("should include cross-references in plan.md", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[1];

			expect(plan?.content).toContain("See [tasks.md](./tasks.md)");
			expect(plan?.content).toContain("See [roadmap.md](./roadmap.md)");
		});

		it("should include cross-references in adr.md", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "architecture",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const adr = artifacts.secondary?.[3];

			expect(adr?.content).toContain("See [spec.md](./spec.md)");
			expect(adr?.content).toContain("See [plan.md](./plan.md)");
		});

		it("should include cross-references in roadmap.md", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const roadmap = artifacts.secondary?.[4];

			expect(roadmap?.content).toContain("See [plan.md](./plan.md)");
			expect(roadmap?.content).toContain("See [tasks.md](./tasks.md)");
		});
	});

	describe("integration with RenderOptions", () => {
		it("should accept partial RenderOptions", () => {
			const strategy = new SpecKitStrategy();
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
			expect(artifacts.secondary).toHaveLength(5);
		});

		it("should work without options parameter", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts).toBeDefined();
			expect(artifacts.primary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(5);
		});
	});

	describe("data extraction - context paths", () => {
		it("should extract objectives from context.objectives", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					objectives: ["Improve performance", "Reduce costs", "Enhance UX"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("## Objectives");
			expect(spec?.content).toContain("1. Improve performance");
			expect(spec?.content).toContain("2. Reduce costs");
			expect(spec?.content).toContain("3. Enhance UX");
		});

		it("should extract requirements from context.requirements", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					requirements: ["Support mobile devices", "Enable offline mode"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("### Functional Requirements");
			expect(spec?.content).toContain("1. Support mobile devices");
			expect(spec?.content).toContain("2. Enable offline mode");
		});

		it("should extract constraints from context.constraints", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraints: ["Budget limit: $50k", "Timeline: 3 months"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("## Constraints");
			expect(spec?.content).toContain("- Budget limit: $50k");
			expect(spec?.content).toContain("- Timeline: 3 months");
		});

		it("should extract acceptance criteria from successCriteria", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					successCriteria: ["User satisfaction > 90%", "Page load < 2s"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("## Acceptance Criteria");
			expect(spec?.content).toContain("- [ ] User satisfaction > 90%");
			expect(spec?.content).toContain("- [ ] Page load < 2s");
		});

		it("should generate timeline from phases when no explicit timeline", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				phases: {
					discovery: "Complete",
					planning: "In progress",
					implementation: "Not started",
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[1];

			expect(plan?.content).toContain("## Timeline");
			expect(plan?.content).toContain("| Phase | Start | End |");
		});
	});

	describe("branch coverage - ternary and conditional paths", () => {
		it("should handle phase data as object with status", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				phases: {
					discovery: { status: "Complete", notes: "All requirements gathered" },
					planning: { status: "In Progress" },
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[1];

			expect(plan?.content).toContain("### PHASE-001: discovery");
			expect(plan?.content).toContain("### PHASE-002: planning");
		});

		it("should handle risks as objects with mitigation", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {
					risks: [
						{ name: "API downtime", mitigation: "Implement retry logic" },
						{ name: "Security breach", mitigation: "Add 2FA" },
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[1];

			expect(plan?.content).toContain(
				"| RISK-001 | API downtime | medium | Implement retry logic |",
			);
			expect(plan?.content).toContain(
				"| RISK-002 | Security breach | medium | Add 2FA |",
			);
		});

		it("should handle tasks without id field", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {
					tasks: [
						{
							title: "Setup database",
							dependencies: [],
						},
						{
							title: "Create API",
							dependencies: ["Setup database"],
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[2];

			expect(tasks?.content).toContain(
				"**Create API** depends on: Setup database",
			);
		});

		it("should handle milestones without date", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {
					milestones: [
						{
							name: "Alpha Release",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const roadmap = artifacts.secondary?.[4];

			expect(roadmap?.content).toContain("**Target Date**: TBD");
		});

		it("should handle milestones without deliverables", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {
					milestones: [
						{
							name: "Beta Launch",
							date: "2026-06-01",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const roadmap = artifacts.secondary?.[4];

			expect(roadmap?.content).toContain("### Milestone 1: Beta Launch");
			expect(roadmap?.content).toContain("**Target Date**: 2026-06-01");
		});

		it("should handle ADR consequences with all three types", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "architecture",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Microservices Migration",
				},
				context: {
					adrConsequences: {
						positive: ["Better scalability", "Independent deployment"],
						negative: ["Increased complexity", "More infrastructure"],
						neutral: ["Need new monitoring tools"],
					},
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const adr = artifacts.secondary?.[3];

			expect(adr?.content).toContain("### Positive");
			expect(adr?.content).toContain("- Better scalability");
			expect(adr?.content).toContain("- Independent deployment");
			expect(adr?.content).toContain("### Negative");
			expect(adr?.content).toContain("- Increased complexity");
			expect(adr?.content).toContain("- More infrastructure");
			expect(adr?.content).toContain("### Neutral");
			expect(adr?.content).toContain("- Need new monitoring tools");
		});

		it("should handle phase data as non-string fallback", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				phases: {
					discovery: { completed: true },
					planning: 42, // Non-string, non-object with status
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[1];

			expect(plan?.content).toContain("In progress");
			expect(plan?.content).toContain("### PHASE-001: discovery");
		});

		it("should handle risks with missing mitigation", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {
					risks: [{ name: "Vendor lock-in" }],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[1];

			expect(plan?.content).toContain(
				"| RISK-001 | Vendor lock-in | medium | To be defined |",
			);
		});

		it("should handle tasks with no dependencies", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {
					tasks: [
						{
							title: "Design mockups",
							dependencies: [],
						},
						{
							title: "Write documentation",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[2];

			expect(tasks?.content).toContain("## Task Dependencies");
			expect(tasks?.content).toContain(
				"No explicit task dependencies defined yet",
			);
		});

		it("should handle ADR consequences object without arrays", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "architecture",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Architecture Decision",
				},
				context: {
					adrConsequences: {},
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const adr = artifacts.secondary?.[3];

			expect(adr?.content).toContain("### Positive");
			expect(adr?.content).toContain("- To be documented");
			expect(adr?.content).toContain("### Negative");
			expect(adr?.content).toContain("### Neutral");
		});

		it("should handle ADR consequences with only positive array", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "architecture",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Architecture Decision",
				},
				context: {
					adrConsequences: {
						positive: ["Improved performance"],
					},
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const adr = artifacts.secondary?.[3];

			expect(adr?.content).toContain("### Positive");
			expect(adr?.content).toContain("- Improved performance");
			expect(adr?.content).toContain("### Negative");
			expect(adr?.content).toContain("- To be documented");
		});
	});

	describe("edge cases and fallbacks", () => {
		it("should handle empty arrays for objectives", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					objectives: [],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("## Objectives");
			expect(spec?.content).toContain("To be defined");
		});

		it("should handle empty arrays for requirements in context", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					requirements: [],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("To be defined");
		});

		it("should handle empty arrays for constraints in context", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraints: [],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("None specified");
		});

		it("should handle empty arrays for successCriteria", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					successCriteria: [],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("To be defined");
		});

		it("should handle phases object with no timeline", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "planning",
				context: {},
				phases: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const plan = artifacts.secondary?.[1];

			expect(plan?.content).toContain("| Phase | Start | End |");
		});
	});

	describe("constitutional constraints support", () => {
		it("should include constitutional constraints when provided", () => {
			const strategy = new SpecKitStrategy();
			const constitution = {
				principles: [
					{
						id: "PRIN-001",
						title: "Pure Functions First",
						description: "Prefer pure functions for business logic",
						type: "principle" as const,
					},
				],
				constraints: [
					{
						id: "CONS-001",
						title: "No Side Effects",
						description: "Domain functions must not have side effects",
						severity: "must" as const,
						type: "constraint" as const,
					},
				],
				architectureRules: [],
				designPrinciples: [],
			};

			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				config: {
					sessionId: "test-session",
					context: {},
					goal: "Feature Implementation",
				},
				context: {
					constraintReferences: [
						{
							constitutionId: "PRIN-001",
							type: "principle" as const,
							notes: "Apply to all domain functions",
						},
						{
							constitutionId: "CONS-001",
							type: "constraint" as const,
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeConstitutionalConstraints: true,
				constitution,
			});

			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("## Constitutional Constraints");
			expect(spec?.content).toContain("### PRIN-001: Pure Functions First");
			expect(spec?.content).toContain(
				"Prefer pure functions for business logic",
			);
			expect(spec?.content).toContain(
				"**Notes**: Apply to all domain functions",
			);
			expect(spec?.content).toContain("### CONS-001: No Side Effects");
			expect(spec?.content).toContain(
				"Domain functions must not have side effects",
			);
		});

		it("should not include constitutional constraints when flag is false", () => {
			const strategy = new SpecKitStrategy();
			const constitution = {
				principles: [
					{
						id: "PRIN-001",
						title: "Pure Functions First",
						description: "Prefer pure functions for business logic",
						type: "principle" as const,
					},
				],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};

			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraintReferences: [
						{
							constitutionId: "PRIN-001",
							type: "principle" as const,
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeConstitutionalConstraints: false,
				constitution,
			});

			const spec = artifacts.secondary?.[0];

			expect(spec?.content).not.toContain("## Constitutional Constraints");
		});

		it("should not include constitutional constraints when no constitution provided", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraintReferences: [
						{
							constitutionId: "PRIN-001",
							type: "principle" as const,
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeConstitutionalConstraints: true,
			});

			const spec = artifacts.secondary?.[0];

			expect(spec?.content).not.toContain("## Constitutional Constraints");
		});

		it("should handle constraint references without notes", () => {
			const strategy = new SpecKitStrategy();
			const constitution = {
				principles: [],
				constraints: [
					{
						id: "CONS-001",
						title: "Test Constraint",
						description: "Test description",
						type: "constraint" as const,
					},
				],
				architectureRules: [],
				designPrinciples: [],
			};

			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraintReferences: [
						{
							constitutionId: "CONS-001",
							type: "constraint" as const,
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeConstitutionalConstraints: true,
				constitution,
			});

			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("### CONS-001: Test Constraint");
			expect(spec?.content).not.toContain("**Notes**:");
		});

		it("should handle unknown constitution IDs gracefully", () => {
			const strategy = new SpecKitStrategy();
			const constitution = {
				principles: [],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};

			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraintReferences: [
						{
							constitutionId: "UNKNOWN-001",
							type: "principle" as const,
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeConstitutionalConstraints: true,
				constitution,
			});

			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("### UNKNOWN-001: Unknown");
		});

		it("should handle empty constraint references", () => {
			const strategy = new SpecKitStrategy();
			const constitution = {
				principles: [],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};

			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraintReferences: [],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeConstitutionalConstraints: true,
				constitution,
			});

			const spec = artifacts.secondary?.[0];

			expect(spec?.content).not.toContain("## Constitutional Constraints");
		});

		it("should find architecture rules in constitution", () => {
			const strategy = new SpecKitStrategy();
			const constitution = {
				principles: [],
				constraints: [],
				architectureRules: [
					{
						id: "AR1",
						title: "Layered Architecture",
						description: "Use clear separation between layers",
						type: "architecture-rule" as const,
					},
				],
				designPrinciples: [],
			};

			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraintReferences: [
						{
							constitutionId: "AR1",
							type: "architecture-rule" as const,
							notes: "Apply to all modules",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeConstitutionalConstraints: true,
				constitution,
			});

			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("### AR1: Layered Architecture");
			expect(spec?.content).toContain("Use clear separation between layers");
		});

		it("should find design principles in constitution", () => {
			const strategy = new SpecKitStrategy();
			const constitution = {
				principles: [],
				constraints: [],
				architectureRules: [],
				designPrinciples: [
					{
						id: "DP1",
						title: "Composition over Inheritance",
						description: "Prefer composition patterns",
						type: "design-principle" as const,
					},
				],
			};

			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraintReferences: [
						{
							constitutionId: "DP1",
							type: "design-principle" as const,
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeConstitutionalConstraints: true,
				constitution,
			});

			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("### DP1: Composition over Inheritance");
			expect(spec?.content).toContain("Prefer composition patterns");
		});

		it("should handle multiple constraint types in one spec", () => {
			const strategy = new SpecKitStrategy();
			const constitution = {
				principles: [
					{
						id: "PRIN-001",
						title: "Test Principle",
						description: "Test principle description",
						type: "principle" as const,
					},
				],
				constraints: [
					{
						id: "CONS-001",
						title: "Test Constraint",
						description: "Test constraint description",
						type: "constraint" as const,
					},
				],
				architectureRules: [
					{
						id: "AR1",
						title: "Test Architecture Rule",
						description: "Test architecture rule description",
						type: "architecture-rule" as const,
					},
				],
				designPrinciples: [
					{
						id: "DP1",
						title: "Test Design Principle",
						description: "Test design principle description",
						type: "design-principle" as const,
					},
				],
			};

			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					constraintReferences: [
						{ constitutionId: "PRIN-001", type: "principle" as const },
						{ constitutionId: "CONS-001", type: "constraint" as const },
						{ constitutionId: "AR1", type: "architecture-rule" as const },
						{ constitutionId: "DP1", type: "design-principle" as const },
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				includeConstitutionalConstraints: true,
				constitution,
			});

			const spec = artifacts.secondary?.[0];

			expect(spec?.content).toContain("### PRIN-001: Test Principle");
			expect(spec?.content).toContain("### CONS-001: Test Constraint");
			expect(spec?.content).toContain("### AR1: Test Architecture Rule");
			expect(spec?.content).toContain("### DP1: Test Design Principle");
		});
	});
});
