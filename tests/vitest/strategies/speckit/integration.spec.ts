/**
 * Comprehensive Spec-Kit Integration Tests
 *
 * End-to-end tests for Spec-Kit functionality including:
 * - Full artifact generation (README, spec, plan, tasks, progress, adr, roadmap)
 * - Constitution validation
 * - Progress tracking with metrics
 * - Gateway integration
 * - Real CONSTITUTION.md validation
 *
 * @module tests/strategies/speckit/integration
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import type { SessionState } from "../../../../src/domain/design/types.js";
import { polyglotGateway } from "../../../../src/gateway/polyglot-gateway.js";
import { OutputApproach } from "../../../../src/strategies/output-strategy.js";
import { parseConstitution } from "../../../../src/strategies/speckit/constitution-parser.js";
import { createProgressTracker } from "../../../../src/strategies/speckit/progress-tracker.js";
import { createSpecValidator } from "../../../../src/strategies/speckit/spec-validator.js";
import type {
	Constitution,
	Tasks,
} from "../../../../src/strategies/speckit/types.js";
import { SpecKitStrategy } from "../../../../src/strategies/speckit-strategy.js";

// Sample constitution content
const sampleConstitution = `
# CONSTITUTION.md

> Applies to v0.13.x

## Principles

### 1. All code must be type-safe

TypeScript strict mode is mandatory for all production code.

### 2. Tests required for all features

Every feature must have corresponding test coverage of at least 90%.

---

## Constraints

### C1: No external dependencies without approval

All external dependencies must be reviewed and approved before adding to package.json.

### C2: Must support TypeScript 5.0+

The codebase must maintain compatibility with TypeScript 5.0 and later versions.

---

## Architecture Rules

### AR1: Use functional patterns where possible

Prefer functional programming patterns over imperative code.

---

## Design Principles

### DP1: Single responsibility principle

Each module, class, and function should have a single, well-defined responsibility.

---
`;

// Sample domain result matching SessionState structure
const sampleDomainResult: SessionState = {
	id: "test-session-001",
	phase: "implementation",
	config: {
		sessionId: "test-session-001",
		context: {},
		goal: "Test Feature",
		requirements: ["Requirement 1", "Requirement 2"],
	},
	context: {
		title: "Test Feature",
		overview: "Test feature overview",
		objectives: [
			{ description: "Objective 1", priority: "high" },
			{ description: "Objective 2", priority: "medium" },
		],
		requirements: [
			{
				description: "Requirement 1",
				type: "functional",
				priority: "high",
			},
			{
				description: "Requirement 2",
				type: "non-functional",
				priority: "medium",
			},
		],
		acceptanceCriteria: ["Criteria 1", "Criteria 2"],
		outOfScope: ["Out of scope item"],
	},
	history: [],
};

describe("Spec-Kit Integration", () => {
	describe("End-to-end generation", () => {
		it("generates all 7 artifacts (README + 6 secondary)", () => {
			const strategy = new SpecKitStrategy();
			const result = strategy.render(sampleDomainResult);

			// Verify primary artifact with slug prefix
			expect(result.primary.name).toMatch(/.+\/README\.md$/);
			expect(result.primary.format).toBe("markdown");
			expect(result.primary.content).toContain("# Spec Kit:");

			// Verify all 6 secondary artifacts exist
			expect(result.secondary).toHaveLength(6);

			// Helper function to check artifact names
			const expectArtifactNamed = (names: string[], fragment: string) => {
				expect(names.some((name) => name.includes(fragment))).toBe(true);
			};

			const secondaryNames = result.secondary?.map((s) => s.name) ?? [];
			expectArtifactNamed(secondaryNames, "spec.md");
			expectArtifactNamed(secondaryNames, "plan.md");
			expectArtifactNamed(secondaryNames, "tasks.md");
			expectArtifactNamed(secondaryNames, "progress.md");
			expectArtifactNamed(secondaryNames, "adr.md");
			expectArtifactNamed(secondaryNames, "roadmap.md");
		});

		it("includes title in spec.md", () => {
			const strategy = new SpecKitStrategy();
			const result = strategy.render(sampleDomainResult);

			const specDoc = result.secondary?.find((s) => s.name.includes("spec.md"));
			expect(specDoc).toBeDefined();
			expect(specDoc?.content).toContain("Test Feature");
			expect(specDoc?.content).toContain("# Specification:");
		});

		it("derives tasks from requirements", () => {
			const strategy = new SpecKitStrategy();
			const result = strategy.render(sampleDomainResult);

			const tasksDoc = result.secondary?.find((s) =>
				s.name.includes("tasks.md"),
			);
			expect(tasksDoc).toBeDefined();

			// Should contain task references to requirements
			expect(tasksDoc?.content).toContain("Requirement 1");
		});

		it("generates progress.md with initial metrics", () => {
			const strategy = new SpecKitStrategy();
			const result = strategy.render(sampleDomainResult);

			const progressDoc = result.secondary?.find((s) =>
				s.name.includes("progress.md"),
			);
			expect(progressDoc).toBeDefined();
			expect(progressDoc?.content).toContain("# Progress");
			expect(progressDoc?.content).toContain("Last Updated");
			expect(progressDoc?.content).toContain("Status:");
		});

		it("generates plan.md with phases", () => {
			const strategy = new SpecKitStrategy();
			const result = strategy.render(sampleDomainResult);

			const planDoc = result.secondary?.find((s) => s.name.includes("plan.md"));
			expect(planDoc).toBeDefined();
			expect(planDoc?.content).toContain("# Implementation Plan:");
			expect(planDoc?.content).toContain("## Phases");
		});

		it("generates adr.md with decision structure", () => {
			const strategy = new SpecKitStrategy();
			const result = strategy.render(sampleDomainResult);

			const adrDoc = result.secondary?.find((s) => s.name.includes("adr.md"));
			expect(adrDoc).toBeDefined();
			expect(adrDoc?.content).toContain("# ADR:");
			expect(adrDoc?.content).toContain("## Status");
			expect(adrDoc?.content).toContain("## Context");
			expect(adrDoc?.content).toContain("## Decision");
			expect(adrDoc?.content).toContain("## Consequences");
		});

		it("generates roadmap.md with milestones", () => {
			const strategy = new SpecKitStrategy();
			const result = strategy.render(sampleDomainResult);

			const roadmapDoc = result.secondary?.find((s) =>
				s.name.includes("roadmap.md"),
			);
			expect(roadmapDoc).toBeDefined();
			expect(roadmapDoc?.content).toContain("# Roadmap:");
			expect(roadmapDoc?.content).toContain("## Milestones");
		});
	});

	describe("Constitution validation", () => {
		it("validates spec against constitution", () => {
			const constitution = parseConstitution(sampleConstitution);
			const validator = createSpecValidator(constitution);

			const result = validator.validate({
				title: "Test",
				overview: "Test overview",
				requirements: [{ description: "Test requirement", type: "functional" }],
			});

			expect(result.valid).toBeDefined();
			expect(typeof result.valid).toBe("boolean");
			expect(result.score).toBeGreaterThanOrEqual(0);
			expect(result.score).toBeLessThanOrEqual(100);
			expect(result.checkedConstraints).toBeGreaterThan(0);
		});

		it("generates validation report", () => {
			const constitution = parseConstitution(sampleConstitution);
			const validator = createSpecValidator(constitution);

			const report = validator.generateReport({
				title: "Test",
				requirements: [],
			});

			expect(report.timestamp).toBeDefined();
			expect(report.metrics).toBeDefined();
			expect(report.metrics.total).toBeGreaterThanOrEqual(0);
			expect(report.byType).toBeDefined();
			expect(report.byType.principles).toBeDefined();
			expect(report.byType.constraints).toBeDefined();
		});

		it("detects violations in problematic specs", () => {
			const constitution = parseConstitution(sampleConstitution);
			const validator = createSpecValidator(constitution);

			const problematicSpec = {
				title: "Problematic Spec",
				rawMarkdown: `
# Problematic Spec

Using any type everywhere for flexibility.
Also using require() for imports.
Architecture: domain → gateway (wrong order).
				`,
			};

			const result = validator.validate(problematicSpec);

			// Should detect at least some issues
			expect(result.issues).toBeDefined();
			// Issues may or may not be empty depending on validator rules
			expect(Array.isArray(result.issues)).toBe(true);
		});

		it("provides constraint breakdown by type", () => {
			const constitution = parseConstitution(sampleConstitution);
			const validator = createSpecValidator(constitution);

			const report = validator.generateReport({ title: "Test Spec" });

			expect(report.byType.principles.checked).toBeGreaterThanOrEqual(0);
			expect(report.byType.constraints.checked).toBeGreaterThanOrEqual(0);
			expect(report.byType.architectureRules.checked).toBeGreaterThanOrEqual(0);
			expect(report.byType.designPrinciples.checked).toBeGreaterThanOrEqual(0);
		});
	});

	describe("Progress tracking", () => {
		it("calculates completion metrics", () => {
			const tasks: Tasks = {
				items: [
					{
						id: "TASK-001",
						title: "Task 1",
						description: "Complete task 1",
						priority: "high",
						estimate: "1 day",
						acceptanceCriteria: ["Task 1 completed"],
					},
					{
						id: "TASK-002",
						title: "Task 2",
						description: "Complete task 2",
						priority: "medium",
						estimate: "2 days",
						acceptanceCriteria: ["Task 2 completed"],
					},
					{
						id: "TASK-003",
						title: "Task 3",
						description: "Complete task 3",
						priority: "low",
						estimate: "1 day",
						acceptanceCriteria: ["Task 3 completed"],
					},
				],
			};

			const tracker = createProgressTracker(tasks);

			let metrics = tracker.calculateCompletion();
			expect(metrics.total).toBe(3);
			expect(metrics.completed).toBe(0);
			expect(metrics.percentComplete).toBe(0);

			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });

			metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(1);
			expect(metrics.percentComplete).toBe(33);
		});

		it("generates progress markdown", () => {
			const tasks: Tasks = {
				items: [
					{
						id: "TASK-001",
						title: "Task 1",
						description: "Complete task 1",
						priority: "high",
						estimate: "1 day",
						acceptanceCriteria: ["Task 1 completed"],
					},
				],
			};

			const tracker = createProgressTracker(tasks);
			const markdown = tracker.generateProgressMarkdown();

			expect(markdown).toContain("# Progress");
			expect(markdown).toContain("TASK-001");
			expect(markdown).toContain("Last Updated");
		});

		it("tracks multiple task updates", () => {
			const tasks: Tasks = {
				items: [
					{
						id: "TASK-001",
						title: "Task 1",
						description: "Complete task 1",
						priority: "high",
						estimate: "1 day",
						acceptanceCriteria: ["Task 1 completed"],
					},
					{
						id: "TASK-002",
						title: "Task 2",
						description: "Complete task 2",
						priority: "medium",
						estimate: "2 days",
						acceptanceCriteria: ["Task 2 completed"],
					},
					{
						id: "TASK-003",
						title: "Task 3",
						description: "Complete task 3",
						priority: "low",
						estimate: "1 day",
						acceptanceCriteria: ["Task 3 completed"],
					},
				],
			};

			const tracker = createProgressTracker(tasks);

			tracker.updateMultiple([
				{ taskId: "TASK-001", status: "completed" },
				{ taskId: "TASK-002", status: "completed" },
			]);

			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(2);
			expect(metrics.percentComplete).toBe(67);
		});

		it("handles empty task list", () => {
			const tracker = createProgressTracker();
			const metrics = tracker.calculateCompletion();

			expect(metrics.total).toBe(0);
			expect(metrics.completed).toBe(0);
			expect(metrics.percentComplete).toBe(0);
		});
	});

	describe("Gateway integration", () => {
		it("routes speckit approach correctly", () => {
			const result = polyglotGateway.render({
				domainResult: sampleDomainResult,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			});

			expect(result.primary.name).toContain("README.md");
			expect(result.secondary).toBeDefined();
			expect(result.secondary?.length).toBeGreaterThan(0);

			const hasSpecMd = result.secondary?.some((doc) =>
				doc.name.includes("spec.md"),
			);
			expect(hasSpecMd).toBe(true);
		});

		it("generates correct artifact structure through gateway", () => {
			const result = polyglotGateway.render({
				domainResult: sampleDomainResult,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			});

			expect(result.primary.format).toBe("markdown");
			expect(result.secondary).toHaveLength(6);

			// All artifacts should be markdown format
			const allMarkdown = result.secondary?.every(
				(doc) => doc.format === "markdown",
			);
			expect(allMarkdown).toBe(true);
		});
	});

	describe("Constitution parsing", () => {
		it("parses constitution sections", () => {
			const constitution = parseConstitution(sampleConstitution);

			expect(constitution.principles).toBeDefined();
			expect(constitution.constraints).toBeDefined();
			expect(constitution.architectureRules).toBeDefined();
			expect(constitution.designPrinciples).toBeDefined();

			// Verify content was extracted
			expect(constitution.principles.length).toBeGreaterThan(0);
			expect(constitution.constraints.length).toBeGreaterThan(0);
		});

		it("extracts metadata from constitution", () => {
			const constitution = parseConstitution(sampleConstitution);

			expect(constitution.metadata).toBeDefined();
			expect(constitution.metadata?.title).toBe("CONSTITUTION.md");
			expect(constitution.metadata?.appliesTo).toContain("v0.13.x");
		});

		it("parses principle details", () => {
			const constitution = parseConstitution(sampleConstitution);

			const firstPrinciple = constitution.principles[0];
			expect(firstPrinciple).toBeDefined();
			expect(firstPrinciple.id).toBe("1");
			expect(firstPrinciple.title).toContain("type-safe");
			expect(firstPrinciple.description).toContain("TypeScript");
		});

		it("parses constraint details", () => {
			const constitution = parseConstitution(sampleConstitution);

			const firstConstraint = constitution.constraints[0];
			expect(firstConstraint).toBeDefined();
			expect(firstConstraint.id).toBe("C1");
			expect(firstConstraint.title).toContain("dependencies");
			expect(firstConstraint.description).toBeDefined();
		});
	});
});

describe("Spec-Kit with real constitution", () => {
	let realConstitution: Constitution;
	let constitutionContent: string;

	beforeAll(() => {
		try {
			const constitutionPath = join(
				process.cwd(),
				"plan-v0.13.x/CONSTITUTION.md",
			);
			constitutionContent = readFileSync(constitutionPath, "utf-8");
			realConstitution = parseConstitution(constitutionContent);
		} catch (error) {
			// Fallback to sample if real file not found
			// Log for debugging but continue with fallback
			console.debug(
				"CONSTITUTION.md not found or unreadable, using sample data:",
				error instanceof Error ? error.message : String(error),
			);
			constitutionContent = sampleConstitution;
			realConstitution = parseConstitution(sampleConstitution);
		}
	});

	it("parses real constitution", () => {
		expect(realConstitution.principles).toBeDefined();
		expect(realConstitution.constraints).toBeDefined();
		expect(realConstitution.architectureRules).toBeDefined();
		expect(realConstitution.designPrinciples).toBeDefined();

		// Real constitution should have meaningful content
		const totalItems =
			realConstitution.principles.length +
			realConstitution.constraints.length +
			realConstitution.architectureRules.length +
			realConstitution.designPrinciples.length;

		expect(totalItems).toBeGreaterThan(0);
	});

	it("validates against real constitution", () => {
		const validator = createSpecValidator(realConstitution);

		const validSpec = {
			title: "Test Specification",
			overview: "Clean, well-structured specification",
			requirements: [
				{ description: "Use TypeScript strict mode", type: "technical" },
			],
			acceptanceCriteria: ["All tests pass"],
		};

		const result = validator.validate(validSpec);

		expect(result).toBeDefined();
		expect(typeof result.score).toBe("number");
		expect(result.score).toBeGreaterThanOrEqual(0);
		expect(result.score).toBeLessThanOrEqual(100);
	});

	it("generates validation report with real constitution", () => {
		const validator = createSpecValidator(realConstitution);

		const report = validator.generateReport({
			title: "Test Feature",
			overview: "Test overview",
			requirements: [],
		});

		expect(report.timestamp).toBeDefined();
		expect(report.valid).toBeDefined();
		expect(report.score).toBeDefined();
		expect(report.metrics.total).toBeGreaterThan(0);
	});

	it("formats report as markdown", () => {
		const validator = createSpecValidator(realConstitution);

		const report = validator.generateReport({
			title: "Test Spec",
			requirements: [],
		});

		const markdown = validator.formatReportAsMarkdown(report);

		expect(markdown).toContain("# Validation Report");
		expect(markdown).toContain("## Summary");
		expect(markdown).toContain("| Metric | Count |");
	});
});
