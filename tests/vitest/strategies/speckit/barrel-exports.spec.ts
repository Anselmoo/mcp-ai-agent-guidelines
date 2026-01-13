/**
 * Barrel Exports Tests for Spec-Kit Module
 *
 * Tests for P4-023: Export All Spec-Kit from Barrel
 *
 * Verifies that all Spec-Kit types, classes, and functions are properly
 * exported from barrel files and accessible via clean import paths.
 */

import { describe, expect, it } from "vitest";

describe("Spec-Kit Barrel Exports", () => {
	describe("speckit/index.ts exports", () => {
		it("should export all type definitions", async () => {
			// Import from speckit barrel
			const module = await import(
				"../../../../src/strategies/speckit/index.js"
			);

			// Types are TypeScript compile-time only, but we can verify
			// that the module exports the runtime values correctly
			expect(module).toBeDefined();
		});

		it("should export parseConstitution function", async () => {
			const { parseConstitution } = await import(
				"../../../../src/strategies/speckit/index.js"
			);

			expect(parseConstitution).toBeDefined();
			expect(typeof parseConstitution).toBe("function");
		});

		it("should export parseSpecFromMarkdown function", async () => {
			const { parseSpecFromMarkdown } = await import(
				"../../../../src/strategies/speckit/index.js"
			);

			expect(parseSpecFromMarkdown).toBeDefined();
			expect(typeof parseSpecFromMarkdown).toBe("function");
		});

		it("should export parseTasksFromMarkdown function", async () => {
			const { parseTasksFromMarkdown } = await import(
				"../../../../src/strategies/speckit/index.js"
			);

			expect(parseTasksFromMarkdown).toBeDefined();
			expect(typeof parseTasksFromMarkdown).toBe("function");
		});

		it("should export SpecValidator class", async () => {
			const { SpecValidator } = await import(
				"../../../../src/strategies/speckit/index.js"
			);

			expect(SpecValidator).toBeDefined();
			expect(typeof SpecValidator).toBe("function");
			expect(SpecValidator.prototype.validate).toBeDefined();
		});

		it("should export createSpecValidator factory", async () => {
			const { createSpecValidator } = await import(
				"../../../../src/strategies/speckit/index.js"
			);

			expect(createSpecValidator).toBeDefined();
			expect(typeof createSpecValidator).toBe("function");
		});

		it("should export ProgressTracker class", async () => {
			const { ProgressTracker } = await import(
				"../../../../src/strategies/speckit/index.js"
			);

			expect(ProgressTracker).toBeDefined();
			expect(typeof ProgressTracker).toBe("function");
			expect(ProgressTracker.prototype.calculateCompletion).toBeDefined();
		});

		it("should export createProgressTracker factory", async () => {
			const { createProgressTracker } = await import(
				"../../../../src/strategies/speckit/index.js"
			);

			expect(createProgressTracker).toBeDefined();
			expect(typeof createProgressTracker).toBe("function");
		});
	});

	describe("strategies/index.ts exports", () => {
		it("should re-export speckit module", async () => {
			const module = await import("../../../../src/strategies/index.js");

			// Verify speckit exports are available
			expect(module.parseConstitution).toBeDefined();
			expect(module.SpecValidator).toBeDefined();
			expect(module.ProgressTracker).toBeDefined();
			expect(module.createSpecValidator).toBeDefined();
			expect(module.createProgressTracker).toBeDefined();
		});

		it("should export SpecKitStrategy", async () => {
			const { SpecKitStrategy } = await import(
				"../../../../src/strategies/index.js"
			);

			expect(SpecKitStrategy).toBeDefined();
			expect(typeof SpecKitStrategy).toBe("function");
		});

		it("should export OutputApproach enum", async () => {
			const { OutputApproach } = await import(
				"../../../../src/strategies/index.js"
			);

			expect(OutputApproach).toBeDefined();
			expect(OutputApproach.SPECKIT).toBeDefined();
			expect(OutputApproach.SDD).toBeDefined();
			expect(OutputApproach.ADR).toBeDefined();
		});
	});

	describe("main index.ts exports", () => {
		it("should re-export strategies module", async () => {
			const module = await import("../../../../src/index.js");

			// Verify strategy exports are available
			expect(module.parseConstitution).toBeDefined();
			expect(module.SpecValidator).toBeDefined();
			expect(module.ProgressTracker).toBeDefined();
			expect(module.SpecKitStrategy).toBeDefined();
			expect(module.OutputApproach).toBeDefined();
		});

		it("should allow importing all key Spec-Kit components", async () => {
			const {
				parseConstitution,
				SpecValidator,
				ProgressTracker,
				createSpecValidator,
				createProgressTracker,
			} = await import("../../../../src/index.js");

			// Verify all imports
			expect(parseConstitution).toBeDefined();
			expect(SpecValidator).toBeDefined();
			expect(ProgressTracker).toBeDefined();
			expect(createSpecValidator).toBeDefined();
			expect(createProgressTracker).toBeDefined();
		});
	});

	describe("functional verification", () => {
		it("should work with parseConstitution imported from main index", async () => {
			const { parseConstitution } = await import("../../../../src/index.js");

			const markdown = `
# Constitution

## Principles

### 1. Test Principle
This is a test principle.

## Constraints

### C1: Test Constraint
This is a test constraint.
`;

			const result = parseConstitution(markdown);

			expect(result).toBeDefined();
			expect(result.principles).toHaveLength(1);
			expect(result.principles[0].title).toBe("Test Principle");
			expect(result.constraints).toHaveLength(1);
			expect(result.constraints[0].title).toBe("Test Constraint");
		});

		it("should work with SpecValidator imported from main index", async () => {
			const { SpecValidator, parseConstitution } = await import(
				"../../../../src/index.js"
			);

			const constitutionMarkdown = `
# Constitution

## Principles

### 1. Test-Driven Development
Always write tests first.

## Constraints

### C1: Code Coverage
Must maintain 90% code coverage.
`;

			const constitution = parseConstitution(constitutionMarkdown);
			const validator = new SpecValidator(constitution);

			const spec = {
				title: "Test Spec",
				overview: "This is a test specification.",
			};

			const result = validator.validate(spec);

			expect(result).toBeDefined();
			expect(result.valid).toBeDefined();
			expect(result.score).toBeGreaterThanOrEqual(0);
			expect(result.issues).toBeDefined();
		});

		it("should work with ProgressTracker imported from main index", async () => {
			const { ProgressTracker } = await import("../../../../src/index.js");

			const tasks = {
				items: [
					{
						id: "TASK-001",
						title: "Setup project",
						description: "Initialize the project structure",
						priority: "high" as const,
						estimate: "1 day",
						acceptanceCriteria: ["Project initialized"],
					},
				],
			};

			const tracker = new ProgressTracker(tasks);

			expect(tracker).toBeDefined();
			expect(tracker.calculateCompletion().total).toBe(1);
			expect(tracker.calculateCompletion().completed).toBe(0);
		});
	});
});
