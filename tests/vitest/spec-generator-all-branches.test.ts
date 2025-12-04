/**
 * Comprehensive Branch Coverage Tests for spec-generator.ts
 *
 * Target: All conditional branches, type-specific sections, and format variations
 * Current Coverage: 93.2% (150/161 lines)
 * Goal: 98%+ coverage by testing all untested branches
 */

import { beforeEach, describe, expect, it } from "vitest";
import { specGenerator } from "../../src/tools/design/spec-generator.js";
import type {
	DesignSessionState,
	SpecRequest,
} from "../../src/tools/design/types/index.js";

describe("SpecGenerator - Complete Branch Coverage", () => {
	beforeEach(async () => {
		await specGenerator.initialize();
	});

	describe("generateSpecification - Type-Specific Section Branches", () => {
		it("should generate API specification with all API sections", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "API Specification",
				type: "api",
				includeExamples: true,
				includeMetrics: true,
				includeDiagrams: true,
			});

			expect(result.sections.some((s) => s.id === "api-endpoints")).toBe(true);
			expect(result.sections.some((s) => s.id === "data-models")).toBe(true);
			expect(result.sections.some((s) => s.id === "api-components")).toBe(true);
			expect(result.sections.some((s) => s.id === "api-interfaces")).toBe(true);
			expect(result.sections.some((s) => s.id === "authentication")).toBe(true);
			expect(result.sections.some((s) => s.id === "error-handling")).toBe(true);
		});

		it("should generate architecture specification with all architecture sections", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Architecture Specification",
				type: "architecture",
			});

			expect(result.sections.some((s) => s.id === "components")).toBe(true);
			expect(result.sections.some((s) => s.id === "interfaces")).toBe(true);
			expect(
				result.sections.some((s) => s.id === "deployment-architecture"),
			).toBe(true);
			expect(result.sections.some((s) => s.id === "data-architecture")).toBe(
				true,
			);
		});

		it("should generate implementation specification with all implementation sections", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Implementation Specification",
				type: "implementation",
			});

			expect(result.sections.some((s) => s.id === "implementation-plan")).toBe(
				true,
			);
			expect(result.sections.some((s) => s.id === "testing-strategy")).toBe(
				true,
			);
			expect(result.sections.some((s) => s.id === "deployment-strategy")).toBe(
				true,
			);
			expect(
				result.sections.some((s) => s.id === "performance-considerations"),
			).toBe(true);
		});

		it("should generate functional specification with default sections", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Functional Specification",
				type: "functional",
			});

			expect(result.sections.some((s) => s.id === "requirements")).toBe(true);
			expect(result.sections.some((s) => s.id === "constraints")).toBe(true);
			expect(result.sections.some((s) => s.id === "components")).toBe(true);
			expect(result.sections.some((s) => s.id === "quality-attributes")).toBe(
				true,
			);
		});

		it("should generate technical specification with default sections", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Technical Specification",
				type: "technical",
			});

			expect(result.sections.some((s) => s.id === "requirements")).toBe(true);
			expect(result.sections.some((s) => s.id === "constraints")).toBe(true);
		});
	});

	describe("generateSpecification - Format Branches", () => {
		it("should generate YAML format specification", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "yaml",
			});

			expect(result.artifact.format).toBe("yaml");
			expect(result.content).toContain("title:");
			expect(result.content).toContain("sections:");
			expect(result.content).toContain("metrics:");
		});

		it("should generate JSON format specification", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "json",
				type: "api",
			});

			expect(result.artifact.format).toBe("json");
			const parsed = JSON.parse(result.content);
			expect(parsed.spec).toBeDefined();
			expect(parsed.sections).toBeDefined();
			expect(parsed.type).toBe("api");
		});

		it("should generate Markdown format specification", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
			});

			expect(result.artifact.format).toBe("markdown");
			expect(result.content).toContain("# SPEC-");
			expect(result.content).toContain("## Overview");
		});
	});

	describe("generateSpecification - Metrics Inclusion Branches", () => {
		it("should include type-specific API metrics", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "API Spec",
				type: "api",
				includeMetrics: true,
			});

			expect(result.metrics.some((m) => m.name === "API Coverage")).toBe(true);
			expect(
				result.metrics.some((m) => m.name === "Endpoint Documentation"),
			).toBe(true);
		});

		it("should include type-specific architecture metrics", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Architecture Spec",
				type: "architecture",
				includeMetrics: true,
			});

			expect(
				result.metrics.some((m) => m.name === "Component Definition"),
			).toBe(true);
			expect(
				result.metrics.some((m) => m.name === "Interface Specification"),
			).toBe(true);
		});

		it("should exclude metrics when includeMetrics is false", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				includeMetrics: false,
			});

			expect(result.metrics.length).toBe(0);
		});
	});

	describe("generateSpecification - Diagrams Inclusion Branches", () => {
		it("should include diagrams when includeDiagrams is true", async () => {
			const sessionState = createSessionStateWithDiagrams();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				includeDiagrams: true,
			});

			expect(result.diagrams.length).toBeGreaterThan(0);
			expect(result.diagrams).toContain("System Architecture Diagram");
		});

		it("should include phase-specific diagrams", async () => {
			const sessionState = createSessionStateWithCompletedPhases();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				includeDiagrams: true,
			});

			expect(result.diagrams).toContain("Deployment Architecture Diagram");
			expect(result.diagrams).toContain("Requirements Traceability Diagram");
		});

		it("should exclude diagrams when includeDiagrams is false", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				includeDiagrams: false,
			});

			expect(result.diagrams.length).toBe(0);
		});
	});

	describe("generateSpecification - Examples Inclusion Branches", () => {
		it("should include API examples when includeExamples is true", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "API Spec",
				type: "api",
				includeExamples: true,
			});

			expect(result.content).toContain("**Example Endpoints:**");
			expect(result.content).toContain("GET /api/v1/");
		});

		it("should exclude examples when includeExamples is false", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "API Spec",
				type: "api",
				includeExamples: false,
			});

			expect(result.content).not.toContain("**Example Endpoints:**");
		});

		it("should include data model examples", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "API Spec",
				type: "api",
				includeExamples: true,
			});

			expect(result.content).toContain("**Core Models:**");
			expect(result.content).toContain("interface Session");
		});
	});

	describe("Phase-Specific Content Generation Branches", () => {
		it("should include artifacts content when phase has artifacts", async () => {
			const sessionState = createSessionStateWithArtifacts();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
			});

			expect(result.content).toContain("**Artifacts:**");
		});

		it("should include API examples for requirements phase", async () => {
			const sessionState = createSessionStateWithPhase("requirements");

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "API Spec",
				type: "api",
				includeExamples: true,
			});

			expect(result.content).toContain("**Example Requirements:**");
			expect(result.content).toContain("RESTful API");
		});

		it("should include architecture examples for architecture phase", async () => {
			const sessionState = createSessionStateWithPhase("architecture");

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Architecture Spec",
				type: "architecture",
				includeExamples: true,
			});

			expect(result.content).toContain("**Example Architecture:**");
			expect(result.content).toContain("Microservices");
		});
	});

	describe("Implementation Plan Section Branches", () => {
		it("should show completed phases in implementation plan", async () => {
			const sessionState = createSessionStateWithCompletedPhases();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Implementation Spec",
				type: "implementation",
			});

			expect(result.content).toContain("Completed: Yes");
		});

		it("should show incomplete phases in implementation plan", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Implementation Spec",
				type: "implementation",
			});

			expect(result.content).toContain("Completed: No");
		});
	});

	describe("Quality Attribute Detection Branches", () => {
		it("should detect quality attributes from constraints", async () => {
			const sessionState = createSessionState();
			sessionState.config.constraints.push({
				id: "sec-1",
				name: "Security Constraint",
				description: "Security requirements for data protection",
				type: "technical",
				mandatory: true,
			});

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
			});

			expect(result.content).toContain("Security Constraint");
		});

		it("should use default quality attribute text when not in constraints", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
			});

			expect(result.content).toContain("To be defined during implementation");
		});
	});

	describe("Constraint Type Filtering Branches", () => {
		it("should filter technical constraints", async () => {
			const sessionState = createSessionStateWithConstraintTypes();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
			});

			expect(result.content).toContain("**Technical Constraints:**");
			expect(result.content).toContain("Technical Constraint A");
		});

		it("should filter business constraints", async () => {
			const sessionState = createSessionStateWithConstraintTypes();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
			});

			expect(result.content).toContain("**Business Constraints:**");
			expect(result.content).toContain("Business Constraint B");
		});

		it("should filter architectural constraints", async () => {
			const sessionState = createSessionStateWithConstraintTypes();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
			});

			expect(result.content).toContain("**Architectural Constraints:**");
			expect(result.content).toContain("Architectural Constraint C");
		});

		it("should handle missing constraint types gracefully", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
			});

			expect(result.content).toContain("No technical constraints defined");
			expect(result.content).toContain("No business constraints defined");
			expect(result.content).toContain("No architectural constraints defined");
		});
	});

	describe("Markdown Metadata Section Branch", () => {
		it("should include metadata section when metadata provided", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
				metadata: {
					author: "Test Author",
					version: "2.0",
					priority: "high",
				},
			});

			expect(result.content).toContain("## Metadata");
			expect(result.content).toContain("author");
			expect(result.content).toContain("priority");
		});

		it("should exclude metadata section when not provided", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
			});

			expect(result.content).not.toContain("## Metadata");
		});
	});

	describe("Recommendations Generation Branches", () => {
		it("should recommend improving low completeness sections", async () => {
			const sessionState = createSessionStateWithLowCompleteness();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
			});

			expect(
				result.recommendations.some((r) => r.includes("Improve completeness")),
			).toBe(true);
		});

		it("should recommend addressing metric gaps", async () => {
			const sessionState = createSessionState();
			sessionState.coverage.overall = 70; // Below target

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				includeMetrics: true,
			});

			expect(
				result.recommendations.some((r) => r.includes("metric gaps")),
			).toBe(true);
		});

		it("should include performance recommendations for critical metadata", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				metadata: { performance: "critical" },
			});

			expect(
				result.recommendations.some((r) =>
					r.includes("performance monitoring"),
				),
			).toBe(true);
		});

		it("should include scalability recommendations for high scalability", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				metadata: { scalability: "high" },
			});

			expect(
				result.recommendations.some((r) =>
					r.includes("horizontal scalability"),
				),
			).toBe(true);
		});

		it("should include security recommendations for strict security", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				metadata: { security: "strict" },
			});

			expect(
				result.recommendations.some((r) =>
					r.includes("strict security measures"),
				),
			).toBe(true);
		});

		it("should include compliance recommendations", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				metadata: { compliance: "required" },
			});

			expect(result.recommendations.some((r) => r.includes("compliance"))).toBe(
				true,
			);
		});
	});

	describe("Diagram References Section Branch", () => {
		it("should include diagrams section in markdown when diagrams present", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
				includeDiagrams: true,
			});

			expect(result.content).toContain("## Diagrams");
		});

		it("should exclude diagrams section when no diagrams", async () => {
			const sessionState = createSessionState();

			const result = await specGenerator.generateSpecification({
				sessionState,
				title: "Test Spec",
				format: "markdown",
				includeDiagrams: false,
			});

			expect(result.content).not.toContain("## Diagrams");
		});
	});
});

// Helper functions
function createSessionState(): DesignSessionState {
	return {
		config: {
			sessionId: `test-session-${Date.now()}`,
			goal: "Test specification goal",
			context: "Test context",
			constraints: [],
			requirements: ["requirement-1"],
		},
		currentPhase: "discovery",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery phase",
				status: "completed",
				outputs: ["discovery-report"],
				criteria: ["stakeholder-analysis"],
				coverage: 85,
				artifacts: [],
			},
		},
		coverage: {
			overall: 85,
			phases: { discovery: 85 },
			constraints: {},
		},
		artifacts: [],
	};
}

function createSessionStateWithDiagrams(): DesignSessionState {
	const state = createSessionState();
	state.artifacts = [
		{
			id: "diagram-1",
			name: "System Diagram",
			type: "diagram",
			content: "diagram content",
			format: "mermaid",
			timestamp: new Date().toISOString(),
		},
	];
	return state;
}

function createSessionStateWithCompletedPhases(): DesignSessionState {
	const state = createSessionState();
	state.phases = {
		requirements: {
			id: "requirements",
			name: "Requirements",
			description: "Requirements phase",
			status: "completed",
			outputs: [],
			criteria: [],
			coverage: 90,
			artifacts: [],
		},
		architecture: {
			id: "architecture",
			name: "Architecture",
			description: "Architecture phase",
			status: "completed",
			outputs: [],
			criteria: [],
			coverage: 88,
			artifacts: [],
		},
	};
	return state;
}

function createSessionStateWithArtifacts(): DesignSessionState {
	const state = createSessionState();
	state.phases.discovery.artifacts = [
		{
			id: "art-1",
			name: "Discovery Report",
			type: "document",
			content: "report content",
			format: "markdown",
			timestamp: new Date().toISOString(),
		},
	];
	return state;
}

function createSessionStateWithPhase(phaseId: string): DesignSessionState {
	const state = createSessionState();
	state.phases[phaseId] = {
		id: phaseId,
		name: phaseId.charAt(0).toUpperCase() + phaseId.slice(1),
		description: `${phaseId} phase`,
		status: "completed",
		outputs: ["output1"],
		criteria: ["criterion1"],
		coverage: 85,
		artifacts: [],
	};
	state.currentPhase = phaseId;
	return state;
}

function createSessionStateWithConstraintTypes(): DesignSessionState {
	const state = createSessionState();
	state.config.constraints = [
		{
			id: "tech-1",
			name: "Technical Constraint A",
			description: "Technical requirement",
			type: "technical",
			mandatory: true,
		},
		{
			id: "bus-1",
			name: "Business Constraint B",
			description: "Business requirement",
			type: "business",
			mandatory: true,
		},
		{
			id: "arch-1",
			name: "Architectural Constraint C",
			description: "Architectural requirement",
			type: "architectural",
			mandatory: true,
		},
	];
	return state;
}

function createSessionStateWithLowCompleteness(): DesignSessionState {
	const state = createSessionState();
	state.phases.discovery.coverage = 65; // Low completeness
	return state;
}
