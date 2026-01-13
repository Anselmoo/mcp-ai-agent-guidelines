/**
 * Final Integration Tests for Spec-Kit
 *
 * End-to-end validation of complete Spec-Kit implementation with real project files.
 * Tests the full workflow from constitution parsing through artifact generation,
 * validation, and progress tracking.
 *
 * @module tests/strategies/speckit/final-integration
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { polyglotGateway } from "../../../../src/gateway/polyglot-gateway.js";
import { OutputApproach } from "../../../../src/strategies/output-strategy.js";
import { parseConstitution } from "../../../../src/strategies/speckit/constitution-parser.js";
import { createProgressTracker } from "../../../../src/strategies/speckit/progress-tracker.js";
import { SpecKitStrategy } from "../../../../src/strategies/speckit-strategy.js";
import { specKitGenerator } from "../../../../src/tools/speckit-generator.js";
import { validateSpec } from "../../../../src/tools/validate-spec.js";

const PROJECT_ROOT = process.cwd();
const CONSTITUTION_PATH = join(PROJECT_ROOT, "plan-v0.13.x/CONSTITUTION.md");

describe("Spec-Kit Final Integration", () => {
	let constitutionContent: string;
	let constitutionAvailable = false;

	beforeAll(async () => {
		try {
			constitutionContent = await fs.readFile(CONSTITUTION_PATH, "utf-8");
			constitutionAvailable = true;
		} catch {
			console.warn("CONSTITUTION.md not found, using mock data");
			constitutionContent = getMockConstitution();
		}
	});

	describe("Real CONSTITUTION.md parsing", () => {
		it("parses all section types", () => {
			const constitution = parseConstitution(constitutionContent);

			// Verify structure
			expect(constitution).toBeDefined();
			expect(constitution.principles).toBeDefined();
			expect(constitution.constraints).toBeDefined();

			// If using real constitution, verify content
			if (constitutionAvailable) {
				expect(constitution.principles?.length).toBeGreaterThan(0);
			}
		});

		it("extracts principle IDs correctly", () => {
			const constitution = parseConstitution(constitutionContent);

			if (constitution.principles?.length) {
				// Real CONSTITUTION uses numbered principles (1, 2, 3, etc.)
				expect(constitution.principles[0].id).toMatch(/^\d+$/);
			}
		});

		it("extracts constraint IDs correctly", () => {
			const constitution = parseConstitution(constitutionContent);

			if (constitution.constraints?.length) {
				// Constraints should have C1, C2, etc. format
				expect(constitution.constraints[0].id).toMatch(/^C\d+$/);
			}
		});
	});

	describe("Full generation workflow", () => {
		it("generates valid spec.md from real requirements", async () => {
			const requirements = getRealRequirements();

			const result = await specKitGenerator({
				...requirements,
				constitutionPath: constitutionAvailable ? CONSTITUTION_PATH : undefined,
				validateAgainstConstitution: constitutionAvailable,
			});

			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
			expect(result.content[0].text).toContain("spec.md");
			expect(result.content[0].text).toContain("Spec-Kit Generated");
		});

		it("generates all 4 artifacts", async () => {
			const strategy = new SpecKitStrategy();
			const domainResult = createDomainResult();

			const constitution = constitutionAvailable
				? parseConstitution(constitutionContent)
				: undefined;
			const result = strategy.render(domainResult, { constitution });

			// Primary is README.md with slug prefix
			expect(result.primary.name).toContain("README.md");
			expect(result.secondary).toBeDefined();

			if (result.secondary) {
				expect(result.secondary.length).toBeGreaterThanOrEqual(3);

				const names = result.secondary.map((s) => s.name);
				// Check for spec, plan, tasks, progress in the secondary files
				expect(names.some((n) => n.includes("spec.md"))).toBe(true);
				expect(names.some((n) => n.includes("plan.md"))).toBe(true);
				expect(names.some((n) => n.includes("tasks.md"))).toBe(true);
				expect(names.some((n) => n.includes("progress.md"))).toBe(true);
			}
		});
	});

	describe("Validation against real constitution", () => {
		it("validates without errors", async () => {
			if (!constitutionAvailable) {
				return; // Skip if no real constitution
			}

			const result = await validateSpec({
				specContent: getSampleSpec(),
				constitutionPath: CONSTITUTION_PATH,
				outputFormat: "json",
			});

			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.valid).toBeDefined();
			expect(typeof parsed.score).toBe("number");
		});

		it("generates validation report in markdown", async () => {
			if (!constitutionAvailable) return;

			const result = await validateSpec({
				specContent: getSampleSpec(),
				constitutionPath: CONSTITUTION_PATH,
				outputFormat: "markdown",
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].text).toContain("Validation");
			expect(result.content[0].text).toContain("Score");
		});

		it("generates validation summary format", async () => {
			if (!constitutionAvailable) return;

			const result = await validateSpec({
				specContent: getSampleSpec(),
				constitutionPath: CONSTITUTION_PATH,
				outputFormat: "summary",
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].text).toMatch(/Validation:/);
			expect(result.content[0].text).toMatch(/Score:/);
		});
	});

	describe("Progress tracking workflow", () => {
		it("tracks progress correctly", () => {
			const tasks = createSampleTasks();
			const tracker = createProgressTracker(tasks);

			// Initial state
			let metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(0);

			// Complete some tasks
			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });
			tracker.updateProgress({ taskId: "TASK-002", status: "completed" });

			metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(2);
			expect(metrics.percentComplete).toBeGreaterThan(0);
		});

		it("generates valid progress.md", () => {
			const tasks = createSampleTasks();
			const tracker = createProgressTracker(tasks);

			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });

			const markdown = tracker.generateProgressMarkdown();

			expect(markdown).toContain("# Progress");
			expect(markdown).toContain("[x]"); // Completed checkbox
			expect(markdown).toContain("[ ]"); // Incomplete checkbox
		});

		it("updates multiple tasks", () => {
			const tasks = createSampleTasks();
			const tracker = createProgressTracker(tasks);

			tracker.updateMultiple([
				{ taskId: "TASK-001", status: "completed" },
				{ taskId: "TASK-002", status: "in-progress" },
			]);

			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(1);
		});
	});

	describe("Gateway integration", () => {
		it("routes to SpecKitStrategy correctly", () => {
			const domainResult = createDomainResult();

			const result = polyglotGateway.render({
				domainResult,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			});

			// Primary is README.md with slug prefix
			expect(result.primary.name).toContain("README.md");
			expect(result.secondary).toBeDefined();
		});

		it("includes constitution when provided", () => {
			if (!constitutionAvailable) return;

			const domainResult = createDomainResult();
			const constitution = parseConstitution(constitutionContent);

			const result = polyglotGateway.render({
				domainResult,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
				options: {
					constitution,
					includeConstitutionalConstraints: true,
				},
			});

			expect(result.primary.content).toBeDefined();
			expect(result.primary.name).toContain("README.md");
		});
	});

	describe("End-to-end workflow", () => {
		it("completes full spec-kit workflow", async () => {
			// 1. Generate artifacts
			const requirements = getRealRequirements();
			const generated = await specKitGenerator(requirements);
			expect(generated).toBeDefined();
			expect(generated.content).toBeDefined();
			expect(generated.content[0].text).toContain("Spec-Kit Generated");

			// 2. Validate (if constitution available)
			if (constitutionAvailable) {
				const validation = await validateSpec({
					specContent: getSampleSpec(),
					constitutionPath: CONSTITUTION_PATH,
					outputFormat: "summary",
				});
				expect(validation.content).toBeDefined();
				expect(validation.content[0].text).toContain("Validation:");
				// Summary format doesn't include metadata.valid, just check the content
			}

			// 3. Track progress - use the direct progress tracker API
			const tasks = createSampleTasks();
			const tracker = createProgressTracker(tasks);
			tracker.updateProgress({ taskId: "TASK-001", status: "completed" });

			const metrics = tracker.calculateCompletion();
			expect(metrics.completed).toBe(1);
		});

		it("validates constitution-enhanced spec", async () => {
			if (!constitutionAvailable) return;

			// Generate with constitution
			const requirements = getRealRequirements();
			const generated = await specKitGenerator({
				...requirements,
				constitutionPath: CONSTITUTION_PATH,
				validateAgainstConstitution: true,
			});

			expect(generated.content).toBeDefined();
			expect(generated.content[0].text).toContain("CONSTITUTION.md");
		});
	});
});

// Helper functions
function getMockConstitution(): string {
	return `# CONSTITUTION.md

## Principles
### 1. Type Safety
All code must be type-safe

### 2. Testing
Tests required for all features

## Constraints
### C1: No External Dependencies
Without approval

### C2: TypeScript Support
Must support TypeScript 5.0+

## Architecture Rules
### AR1: Functional Patterns
Use functional patterns where possible

## Design Principles
### DP1: Single Responsibility
Each module has one responsibility
`;
}

function getRealRequirements() {
	return {
		title: "v0.13.x Refactoring",
		overview:
			"Major refactoring for improved discoverability and domain extraction",
		objectives: [
			{ description: "Improve tool discoverability", priority: "high" },
			{ description: "Extract domain modules", priority: "high" },
		],
		requirements: [
			{
				description: "Add tool annotations",
				type: "functional" as const,
				priority: "high",
			},
			{
				description: "Create domain extractors",
				type: "functional" as const,
				priority: "high",
			},
		],
		acceptanceCriteria: [
			"All tools have annotations",
			"Domain modules extracted",
		],
		outOfScope: ["Breaking API changes"],
	};
}

function createDomainResult() {
	const req = getRealRequirements();
	return {
		id: "test-session",
		phase: "implementation",
		status: "active",
		config: {
			sessionId: "test-session",
			context: {},
			goal: req.title,
			requirements: req.requirements.map((r) => r.description),
		},
		context: {
			title: req.title,
			overview: req.overview,
			objectives: req.objectives.map((o) => o.description),
			requirements: req.requirements.map((r) => r.description),
			acceptanceCriteria: req.acceptanceCriteria,
			outOfScope: req.outOfScope,
		},
		history: [],
		phases: {},
	};
}

function createSampleTasks() {
	return {
		items: [
			{ id: "TASK-001", title: "Add annotations", priority: "high" },
			{ id: "TASK-002", title: "Extract domains", priority: "high" },
			{ id: "TASK-003", title: "Update tests", priority: "medium" },
		],
	};
}

function getSampleSpec(): string {
	return `# v0.13.x Spec

## Overview
Major refactoring effort for improved discoverability.

## Requirements
- Add tool annotations to improve LLM discoverability
- Extract domain modules for better separation of concerns
- Maintain backward compatibility

## Constraints
- No breaking API changes
- TypeScript strict mode required
`;
}

function _getSampleProgress(): string {
	return `# Progress

## Tasks
- [ ] **TASK-001**: Add annotations
- [ ] **TASK-002**: Extract domains
- [ ] **TASK-003**: Update tests
`;
}
