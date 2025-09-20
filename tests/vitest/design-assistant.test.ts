// Design Assistant Tests
import { beforeAll, describe, expect, it } from "vitest";
import { designAssistant } from "../../dist/tools/design/index.js";

describe("Design Assistant Framework", () => {
	beforeAll(async () => {
		await designAssistant.initialize();
	});

	it("should start a new design session", async () => {
		const response = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "test-session-1",
			config: {
				sessionId: "test-session-1",
				context: "Building a task management system for teams",
				goal: "Create a scalable, user-friendly task management platform",
				requirements: [
					"User authentication and authorization",
					"Task creation and assignment",
					"Real-time collaboration features",
					"Mobile and web interfaces",
				],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});

		expect(response.success).toBe(true);
		expect(response.sessionId).toBe("test-session-1");
		expect(response.currentPhase).toBe("discovery");
		expect(response.status).toBe("active");
		expect(response.message).toContain("started successfully");
		expect(response.recommendations).toBeInstanceOf(Array);
		expect(response.recommendations.length).toBeGreaterThan(0);
	});

	it("should get session status", async () => {
		const response = await designAssistant.processRequest({
			action: "get-status",
			sessionId: "test-session-1",
		});

		expect(response.success).toBe(true);
		expect(response.sessionId).toBe("test-session-1");
		expect(response.currentPhase).toBe("discovery");
		expect(response.status).toBe("active");
		expect(response.data?.sessionState).toBeDefined();
	});

	it("should validate a phase with content", async () => {
		const content = `
		# Discovery Phase Results

		## Problem Statement
		Teams struggle with task visibility and coordination across multiple projects.

		## Stakeholder Analysis
		- Project managers: Need overview and progress tracking
		- Team members: Need task clarity and deadlines
		- Executives: Need high-level metrics and reporting

		## Context Boundaries
		- Internal team use initially
		- B2B SaaS expansion planned
		- Integration with existing tools required

		## Success Metrics
		- 50% reduction in missed deadlines
		- 90% user adoption within 3 months
		- 25% improvement in project completion rates
		`;

		const response = await designAssistant.processRequest({
			action: "validate-phase",
			sessionId: "test-session-1",
			phaseId: "discovery",
			content,
		});

		expect(response.success).toBe(true);
		expect(response.validationResults).toBeDefined();
		expect(response.coverage).toBeGreaterThan(0);
		expect(response.recommendations).toBeInstanceOf(Array);
	});

	it("should advance to the next phase", async () => {
		const content = `
		Completed discovery phase with stakeholder analysis and problem definition.
		Ready to move into requirements analysis.
		`;

		const response = await designAssistant.processRequest({
			action: "advance-phase",
			sessionId: "test-session-1",
			content,
		});

		expect(response.success).toBe(true);
		expect(response.currentPhase).toBe("requirements");
		expect(response.recommendations).toBeInstanceOf(Array);
	});

	it("should evaluate pivot need", async () => {
		const content = `
		The system is becoming very complex with numerous integrations,
		real-time features, advanced analytics, machine learning capabilities,
		and extensive customization options. This might be too much for initial release.
		`;

		const response = await designAssistant.processRequest({
			action: "evaluate-pivot",
			sessionId: "test-session-1",
			content,
		});

		expect(response.success).toBe(true);
		expect(response.pivotDecision).toBeDefined();
		expect(response.recommendations).toBeInstanceOf(Array);
	});

	it("should enforce coverage requirements", async () => {
		const content = `
		# Requirements Analysis

		## Functional Requirements
		- User registration and authentication
		- Task management (create, edit, delete, assign)
		- Project organization and categorization
		- Real-time notifications
		- Team collaboration features

		## Non-functional Requirements
		- Performance: Response time < 2 seconds
		- Scalability: Support 1000 concurrent users
		- Security: OWASP compliance required
		- Availability: 99.9% uptime target

		## Acceptance Criteria
		- All features tested and documented
		- Security audit completed
		- Performance benchmarks met
		`;

		const response = await designAssistant.processRequest({
			action: "enforce-coverage",
			sessionId: "test-session-1",
			content,
		});

		expect(response.success).toBeDefined();
		expect(response.coverage).toBeGreaterThan(0);
		expect(response.coverageReport).toBeDefined();
		expect(response.recommendations).toBeInstanceOf(Array);
	});

	it("should generate artifacts", async () => {
		const response = await designAssistant.processRequest({
			action: "generate-artifacts",
			sessionId: "test-session-1",
			artifactTypes: ["adr", "specification", "roadmap"],
		});

		expect(response.success).toBe(true);
		expect(response.artifacts).toBeInstanceOf(Array);
		expect(response.artifacts.length).toBeGreaterThan(0);

		// Check for different artifact types
		const artifactTypes = response.artifacts.map((a) => a.type);
		expect(artifactTypes).toContain("specification");
	});

	it("should load custom constraints", async () => {
		const customConstraints = {
			meta: {
				version: "1.0.0",
				updated: "2024-01-10",
				source: "Test Constraints",
				coverage_threshold: 90,
			},
			phases: {
				discovery: {
					name: "Discovery Phase",
					description: "Initial discovery",
					min_coverage: 95,
					required_outputs: ["stakeholders", "problems"],
					criteria: ["Clear problem statement"],
				},
			},
			constraints: {
				testing: {
					unit_testing: {
						name: "Unit Testing",
						description: "Comprehensive unit tests required",
						keywords: ["test", "unit", "coverage"],
						weight: 15,
						mandatory: true,
						validation: { min_coverage: 95 },
						source: "Test Standards",
					},
				},
			},
			coverage_rules: {
				overall_minimum: 90,
				phase_minimum: 85,
				constraint_minimum: 80,
				documentation_minimum: 85,
				test_minimum: 95,
				pivot_thresholds: {
					complexity_threshold: 80,
					entropy_threshold: 70,
					coverage_drop_threshold: 15,
				},
			},
			template_references: {},
			micro_methods: {
				confirmation: ["validate_phase_completion"],
				pivot: ["calculate_complexity_score"],
				coverage: ["calculate_phase_coverage"],
			},
			output_formats: {
				markdown: { format: "markdown" },
			},
		};

		const response = await designAssistant.processRequest({
			action: "load-constraints",
			sessionId: "system",
			constraintConfig: customConstraints,
		});

		expect(response.success).toBe(true);
		expect(response.message).toContain("constraints");
		expect(response.data?.constraintCount).toBeGreaterThan(0);
	});

	it("should handle errors gracefully", async () => {
		const response = await designAssistant.processRequest({
			action: "get-status",
			sessionId: "non-existent-session",
		});

		expect(response.success).toBe(false);
		expect(response.status).toBe("not-found");
		expect(response.message).toContain("not found");
	});
});

describe("Design Assistant Utility Methods", () => {
	beforeAll(async () => {
		await designAssistant.initialize();
	});

	it("should get constraint summary", async () => {
		const summary = await designAssistant.getConstraintSummary();

		expect(summary.total).toBeGreaterThan(0);
		expect(summary.mandatory).toBeGreaterThan(0);
		expect(summary.categories).toBeInstanceOf(Array);
		expect(summary.thresholds).toBeDefined();
	});

	it("should get phase sequence", async () => {
		const phases = await designAssistant.getPhaseSequence();

		expect(phases).toBeInstanceOf(Array);
		expect(phases.length).toBeGreaterThan(0);
		expect(phases).toContain("discovery");
		expect(phases).toContain("requirements");
		expect(phases).toContain("architecture");
	});

	it("should list active sessions", async () => {
		const sessions = await designAssistant.getActiveSessions();

		expect(sessions).toBeInstanceOf(Array);
		// Should include our test session
		expect(sessions).toContain("test-session-1");
	});
});
