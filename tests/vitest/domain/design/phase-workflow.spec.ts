/**
 * Phase Workflow Tests
 * 100% coverage of pure domain phase transition logic
 */

import { describe, expect, it } from "vitest";
import {
	canTransition,
	getNextPhase,
	getPhaseDependencies,
	getPhaseIndex,
	getPhaseOrder,
	getPhaseProgress,
	getPhaseRequirements,
	getPreviousPhase,
	hasRequiredPhases,
	isFirstPhase,
	isLastPhase,
	validatePhaseCompletion,
	validatePhaseSequence,
} from "../../../../src/domain/design/phase-workflow.js";
import type { PhaseId } from "../../../../src/domain/design/types.js";

describe("Phase Workflow - Domain Logic", () => {
	describe("canTransition", () => {
		it("should allow transition to next phase", () => {
			expect(canTransition("discovery", "requirements")).toBe(true);
			expect(canTransition("requirements", "planning")).toBe(true);
			expect(canTransition("planning", "specification")).toBe(true);
		});

		it("should allow staying in current phase", () => {
			expect(canTransition("discovery", "discovery")).toBe(true);
			expect(canTransition("requirements", "requirements")).toBe(true);
		});

		it("should not allow skipping phases", () => {
			expect(canTransition("discovery", "architecture")).toBe(false);
			expect(canTransition("requirements", "implementation")).toBe(false);
		});

		it("should not allow backward transitions", () => {
			expect(canTransition("requirements", "discovery")).toBe(false);
			expect(canTransition("architecture", "planning")).toBe(false);
		});

		it("should handle edge cases", () => {
			expect(canTransition("implementation", "discovery")).toBe(false);
			expect(canTransition("discovery", "implementation")).toBe(false);
		});
	});

	describe("getNextPhase", () => {
		it("should return next phase in sequence", () => {
			expect(getNextPhase("discovery")).toBe("requirements");
			expect(getNextPhase("requirements")).toBe("planning");
			expect(getNextPhase("planning")).toBe("specification");
			expect(getNextPhase("specification")).toBe("architecture");
			expect(getNextPhase("architecture")).toBe("implementation");
		});

		it("should return null for last phase", () => {
			expect(getNextPhase("implementation")).toBeNull();
		});
	});

	describe("getPreviousPhase", () => {
		it("should return previous phase in sequence", () => {
			expect(getPreviousPhase("requirements")).toBe("discovery");
			expect(getPreviousPhase("planning")).toBe("requirements");
			expect(getPreviousPhase("specification")).toBe("planning");
			expect(getPreviousPhase("architecture")).toBe("specification");
			expect(getPreviousPhase("implementation")).toBe("architecture");
		});

		it("should return null for first phase", () => {
			expect(getPreviousPhase("discovery")).toBeNull();
		});
	});

	describe("validatePhaseCompletion", () => {
		it("should validate complete phase content", () => {
			const content = {
				problem_statement: "Need auth system",
				stakeholders: ["users", "admins"],
				context: "E-commerce platform",
			};

			const result = validatePhaseCompletion("discovery", content);

			expect(result.valid).toBe(true);
			expect(result.missing).toEqual([]);
		});

		it("should detect missing requirements", () => {
			const content = {
				problem_statement: "Need auth system",
				stakeholders: ["users"],
				// missing 'context'
			};

			const result = validatePhaseCompletion("discovery", content);

			expect(result.valid).toBe(false);
			expect(result.missing).toEqual(["context"]);
		});

		it("should detect multiple missing requirements", () => {
			const content = {
				problem_statement: "Need auth system",
				// missing 'stakeholders' and 'context'
			};

			const result = validatePhaseCompletion("discovery", content);

			expect(result.valid).toBe(false);
			expect(result.missing).toHaveLength(2);
			expect(result.missing).toContain("stakeholders");
			expect(result.missing).toContain("context");
		});

		it("should validate requirements phase", () => {
			const complete = {
				functional_requirements: ["Auth", "CRUD"],
				non_functional_requirements: ["Performance", "Security"],
			};

			const result = validatePhaseCompletion("requirements", complete);

			expect(result.valid).toBe(true);
			expect(result.missing).toEqual([]);
		});

		it("should handle empty content", () => {
			const result = validatePhaseCompletion("discovery", {});

			expect(result.valid).toBe(false);
			expect(result.missing).toHaveLength(3);
		});

		it("should ignore extra fields", () => {
			const content = {
				problem_statement: "Test",
				stakeholders: ["test"],
				context: "test",
				extra_field: "ignored",
			};

			const result = validatePhaseCompletion("discovery", content);

			expect(result.valid).toBe(true);
		});
	});

	describe("getPhaseRequirements", () => {
		it("should return requirements for discovery phase", () => {
			const reqs = getPhaseRequirements("discovery");

			expect(reqs).toEqual(["problem_statement", "stakeholders", "context"]);
		});

		it("should return requirements for requirements phase", () => {
			const reqs = getPhaseRequirements("requirements");

			expect(reqs).toEqual([
				"functional_requirements",
				"non_functional_requirements",
			]);
		});

		it("should return requirements for all phases", () => {
			const phases: PhaseId[] = [
				"discovery",
				"requirements",
				"planning",
				"specification",
				"architecture",
				"implementation",
			];

			for (const phase of phases) {
				const reqs = getPhaseRequirements(phase);
				expect(Array.isArray(reqs)).toBe(true);
				expect(reqs.length).toBeGreaterThan(0);
			}
		});
	});

	describe("getPhaseOrder", () => {
		it("should return complete phase sequence", () => {
			const order = getPhaseOrder();

			expect(order).toEqual([
				"discovery",
				"requirements",
				"planning",
				"specification",
				"architecture",
				"implementation",
			]);
		});

		it("should return a copy not original array", () => {
			const order1 = getPhaseOrder();
			const order2 = getPhaseOrder();

			expect(order1).toEqual(order2);
			expect(order1).not.toBe(order2); // Different instances
		});
	});

	describe("getPhaseIndex", () => {
		it("should return correct index for each phase", () => {
			expect(getPhaseIndex("discovery")).toBe(0);
			expect(getPhaseIndex("requirements")).toBe(1);
			expect(getPhaseIndex("planning")).toBe(2);
			expect(getPhaseIndex("specification")).toBe(3);
			expect(getPhaseIndex("architecture")).toBe(4);
			expect(getPhaseIndex("implementation")).toBe(5);
		});

		it("should return -1 for invalid phase", () => {
			expect(getPhaseIndex("invalid" as PhaseId)).toBe(-1);
		});
	});

	describe("isFirstPhase", () => {
		it("should return true for discovery phase", () => {
			expect(isFirstPhase("discovery")).toBe(true);
		});

		it("should return false for other phases", () => {
			expect(isFirstPhase("requirements")).toBe(false);
			expect(isFirstPhase("planning")).toBe(false);
			expect(isFirstPhase("implementation")).toBe(false);
		});
	});

	describe("isLastPhase", () => {
		it("should return true for implementation phase", () => {
			expect(isLastPhase("implementation")).toBe(true);
		});

		it("should return false for other phases", () => {
			expect(isLastPhase("discovery")).toBe(false);
			expect(isLastPhase("requirements")).toBe(false);
			expect(isLastPhase("architecture")).toBe(false);
		});
	});

	describe("getPhaseProgress", () => {
		it("should calculate progress correctly", () => {
			expect(getPhaseProgress("discovery")).toBeCloseTo(16.67, 1);
			expect(getPhaseProgress("requirements")).toBeCloseTo(33.33, 1);
			expect(getPhaseProgress("planning")).toBe(50);
			expect(getPhaseProgress("specification")).toBeCloseTo(66.67, 1);
			expect(getPhaseProgress("architecture")).toBeCloseTo(83.33, 1);
			expect(getPhaseProgress("implementation")).toBe(100);
		});

		it("should return 0 for invalid phase", () => {
			expect(getPhaseProgress("invalid" as PhaseId)).toBe(0);
		});
	});

	describe("getPhaseDependencies", () => {
		it("should return empty array for first phase", () => {
			const deps = getPhaseDependencies("discovery");

			expect(deps).toEqual([]);
		});

		it("should return all preceding phases", () => {
			expect(getPhaseDependencies("requirements")).toEqual(["discovery"]);
			expect(getPhaseDependencies("planning")).toEqual([
				"discovery",
				"requirements",
			]);
			expect(getPhaseDependencies("architecture")).toEqual([
				"discovery",
				"requirements",
				"planning",
				"specification",
			]);
		});

		it("should return all phases for last phase", () => {
			const deps = getPhaseDependencies("implementation");

			expect(deps).toHaveLength(5);
			expect(deps).toContain("discovery");
			expect(deps).toContain("requirements");
			expect(deps).toContain("planning");
			expect(deps).toContain("specification");
			expect(deps).toContain("architecture");
		});
	});

	describe("validatePhaseSequence", () => {
		it("should validate correct phase sequence", () => {
			const sequence = [
				"discovery",
				"requirements",
				"planning",
				"specification",
				"architecture",
				"implementation",
			];

			const result = validatePhaseSequence(sequence);

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it("should validate partial phase sequence", () => {
			const sequence = ["discovery", "requirements"];

			const result = validatePhaseSequence(sequence);

			expect(result.valid).toBe(true);
		});

		it("should detect duplicate phases", () => {
			const sequence = ["discovery", "requirements", "discovery"];

			const result = validatePhaseSequence(sequence);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("Sequence contains duplicate phases");
		});

		it("should detect invalid phase IDs", () => {
			const sequence = ["discovery", "invalid-phase", "requirements"];

			const result = validatePhaseSequence(sequence);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain("Invalid phase IDs");
		});

		it("should detect multiple errors", () => {
			const sequence = ["discovery", "invalid", "discovery"];

			const result = validatePhaseSequence(sequence);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBe(2);
		});

		it("should handle empty sequence", () => {
			const result = validatePhaseSequence([]);

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		});
	});

	describe("hasRequiredPhases", () => {
		it("should return true when all required phases present", () => {
			const sequence: PhaseId[] = ["discovery", "requirements", "planning"];
			const required: PhaseId[] = ["discovery", "requirements"];

			expect(hasRequiredPhases(sequence, required)).toBe(true);
		});

		it("should return false when required phases missing", () => {
			const sequence: PhaseId[] = ["discovery", "planning"];
			const required: PhaseId[] = ["discovery", "requirements"];

			expect(hasRequiredPhases(sequence, required)).toBe(false);
		});

		it("should handle empty required phases", () => {
			const sequence: PhaseId[] = ["discovery"];
			const required: PhaseId[] = [];

			expect(hasRequiredPhases(sequence, required)).toBe(true);
		});

		it("should handle empty sequence with required phases", () => {
			const sequence: PhaseId[] = [];
			const required: PhaseId[] = ["discovery"];

			expect(hasRequiredPhases(sequence, required)).toBe(false);
		});

		it("should check order independence", () => {
			const sequence: PhaseId[] = ["planning", "discovery", "requirements"];
			const required: PhaseId[] = ["discovery", "requirements"];

			expect(hasRequiredPhases(sequence, required)).toBe(true);
		});
	});

	describe("Integration Tests", () => {
		it("should support complete workflow navigation", () => {
			let current: PhaseId = "discovery";
			const path: PhaseId[] = [current];

			while (true) {
				const next = getNextPhase(current);
				if (next === null) break;

				expect(canTransition(current, next)).toBe(true);
				current = next;
				path.push(current);
			}

			expect(path).toHaveLength(6);
			expect(path).toEqual(getPhaseOrder());
		});

		it("should validate progressive phase completion", () => {
			const phases = getPhaseOrder();
			const validatedPhases: PhaseId[] = [];

			for (const phase of phases) {
				// Check dependencies are met
				const deps = getPhaseDependencies(phase);
				expect(hasRequiredPhases(validatedPhases, deps)).toBe(true);

				validatedPhases.push(phase);
			}
		});

		it("should calculate cumulative progress", () => {
			const phases = getPhaseOrder();
			let lastProgress = 0;

			for (const phase of phases) {
				const progress = getPhaseProgress(phase);
				expect(progress).toBeGreaterThan(lastProgress);
				lastProgress = progress;
			}

			expect(lastProgress).toBe(100);
		});
	});
});
