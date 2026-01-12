/**
 * Coverage boost tests for SpecKitStrategy
 * Targets uncovered branches and error paths
 *
 * @module tests/strategies/speckit-strategy-coverage-boost
 */

import { describe, expect, it, vi } from "vitest";
import type { SessionState } from "../../../src/domain/design/types.js";
import type { Constitution } from "../../../src/strategies/speckit/types.js";
import { SpecKitStrategy } from "../../../src/strategies/speckit-strategy.js";

// Mock the createSpecValidator function to track calls
const mockCreateSpecValidator = vi.fn();
vi.mock("../../../src/strategies/speckit/spec-validator.js", () => ({
	createSpecValidator: (...args: unknown[]) => mockCreateSpecValidator(...args),
}));

describe("SpecKitStrategy - Coverage Boost", () => {
	const sampleConstitution: Constitution = {
		principles: [
			{
				id: "P1",
				title: "Test Principle",
				description: "Test principle description",
				type: "principle",
			},
		],
		constraints: [
			{
				id: "C1",
				title: "Test Constraint",
				description: "Test constraint description",
				severity: "must",
				type: "constraint",
			},
		],
		architectureRules: [
			{
				id: "AR1",
				title: "Test Architecture Rule",
				description: "Test architecture rule description",
				type: "architecture-rule",
			},
		],
		designPrinciples: [
			{
				id: "DP1",
				title: "Test Design Principle",
				description: "Test design principle description",
				type: "design-principle",
			},
		],
	};

	const anotherConstitution: Constitution = {
		principles: [
			{
				id: "P2",
				title: "Different Principle",
				description: "Different principle description",
				type: "principle",
			},
		],
		constraints: [],
		architectureRules: [],
		designPrinciples: [],
	};

	describe("constitution caching", () => {
		it("should cache validator when constitution is provided", () => {
			mockCreateSpecValidator.mockClear();
			mockCreateSpecValidator.mockReturnValue({
				validate: vi
					.fn()
					.mockReturnValue({ valid: true, issues: [], score: 100 }),
			});

			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: { title: "Test", overview: "Test" },
				history: [],
			};

			// First render with constitution - should create validator
			const artifacts1 = strategy.render(result, {
				constitution: sampleConstitution,
			});
			expect(artifacts1).toBeDefined();
			expect(mockCreateSpecValidator).toHaveBeenCalledTimes(1);
			expect(mockCreateSpecValidator).toHaveBeenCalledWith(sampleConstitution);

			// Second render with same constitution - should reuse cached validator
			const artifacts2 = strategy.render(result, {
				constitution: sampleConstitution,
			});
			expect(artifacts2).toBeDefined();
			// Still only called once - validator was cached
			expect(mockCreateSpecValidator).toHaveBeenCalledTimes(1);
		});

		it("should create new validator when constitution changes", () => {
			mockCreateSpecValidator.mockClear();
			mockCreateSpecValidator.mockReturnValue({
				validate: vi
					.fn()
					.mockReturnValue({ valid: true, issues: [], score: 100 }),
			});

			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: { title: "Test", overview: "Test" },
				history: [],
			};

			// First render with first constitution
			const artifacts1 = strategy.render(result, {
				constitution: sampleConstitution,
			});
			expect(artifacts1).toBeDefined();
			expect(mockCreateSpecValidator).toHaveBeenCalledTimes(1);
			expect(mockCreateSpecValidator).toHaveBeenCalledWith(sampleConstitution);

			// Second render with different constitution - should create new validator
			const artifacts2 = strategy.render(result, {
				constitution: anotherConstitution,
			});
			expect(artifacts2).toBeDefined();
			// Called twice - new validator created for different constitution
			expect(mockCreateSpecValidator).toHaveBeenCalledTimes(2);
			expect(mockCreateSpecValidator).toHaveBeenCalledWith(anotherConstitution);
		});

		it("should clear validator when constitution is removed", () => {
			mockCreateSpecValidator.mockClear();
			mockCreateSpecValidator.mockReturnValue({
				validate: vi
					.fn()
					.mockReturnValue({ valid: true, issues: [], score: 100 }),
			});

			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: { title: "Test", overview: "Test" },
				history: [],
			};

			// First render with constitution
			const artifacts1 = strategy.render(result, {
				constitution: sampleConstitution,
			});
			expect(artifacts1).toBeDefined();
			expect(mockCreateSpecValidator).toHaveBeenCalledTimes(1);

			// Second render without constitution - should clear validator (no new call)
			const artifacts2 = strategy.render(result);
			expect(artifacts2).toBeDefined();
			// Still only called once - validator was cleared, not recreated
			expect(mockCreateSpecValidator).toHaveBeenCalledTimes(1);
		});
	});

	describe("validation error handling", () => {
		it("should throw error when failOnValidationErrors is true and validation fails", () => {
			mockCreateSpecValidator.mockClear();
			// Mock validator that returns invalid result
			mockCreateSpecValidator.mockReturnValue({
				validate: vi.fn().mockReturnValue({
					valid: false,
					issues: [{ type: "error", message: "Missing requirements" }],
					score: 50,
				}),
			});

			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test",
					overview: "Test",
					objectives: [],
					requirements: [],
					acceptanceCriteria: [],
				},
				history: [],
			};

			// Should throw validation error when validation fails and failOnValidationErrors is true
			expect(() =>
				strategy.render(result, {
					constitution: sampleConstitution,
					validateBeforeRender: true,
					failOnValidationErrors: true,
				}),
			).toThrow();
		});

		it("should not throw error when failOnValidationErrors is false", () => {
			mockCreateSpecValidator.mockClear();
			// Mock validator that returns invalid result
			mockCreateSpecValidator.mockReturnValue({
				validate: vi.fn().mockReturnValue({
					valid: false,
					issues: [{ type: "error", message: "Missing requirements" }],
					score: 50,
				}),
			});

			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test",
					overview: "Test",
				},
				history: [],
			};

			// Should not throw when failOnValidationErrors is false
			expect(() =>
				strategy.render(result, {
					constitution: sampleConstitution,
					validateBeforeRender: true,
					failOnValidationErrors: false,
				}),
			).not.toThrow();
		});
	});

	describe("constitutional constraints rendering", () => {
		it("should render constitutional constraints when option is enabled", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview",
					constraintReferences: [
						{
							constitutionId: "C1",
							notes: "Required for compliance",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				includeConstitutionalConstraints: true,
			});

			const spec = artifacts.secondary?.[0];
			expect(spec?.content).toContain("## Constitutional Constraints");
			expect(spec?.content).toContain("C1: Test Constraint");
			expect(spec?.content).toContain("Required for compliance");
		});

		it("should not render constitutional constraints when option is disabled", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview",
					constraintReferences: [
						{
							constitutionId: "C1",
							notes: "Required for compliance",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				includeConstitutionalConstraints: false,
			});

			const spec = artifacts.secondary?.[0];
			expect(spec?.content).not.toContain("## Constitutional Constraints");
		});

		it("should handle constraint reference without notes", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview",
					constraintReferences: [
						{
							constitutionId: "C1",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				includeConstitutionalConstraints: true,
			});

			const spec = artifacts.secondary?.[0];
			expect(spec?.content).toContain("C1: Test Constraint");
			expect(spec?.content).not.toContain("**Notes**:");
		});
	});

	describe("validation result rendering", () => {
		it("should render validation results when validation is performed", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test",
					overview: "Test overview",
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
				failOnValidationErrors: false,
			});

			const spec = artifacts.secondary?.[0];
			expect(spec?.content).toContain("⚠️ Validation Results");
		});

		it("should not render validation results when validation is not performed", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test",
					overview: "Test overview",
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: false,
			});

			const spec = artifacts.secondary?.[0];
			expect(spec?.content).not.toContain("⚠️ Validation Results");
		});
	});

	describe("generateTasks error handling", () => {
		it("should fallback to basic tasks when extractSpec fails in non-production", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				config: {
					sessionId: "test-session",
					context: {},
					requirements: ["Test requirement"],
				},
				context: {
					// Malformed data to trigger extraction error
					requirements: "not an array" as unknown as string[],
					acceptanceCriteria: ["Test criteria"],
				},
				history: [],
			};

			// Should not throw, should fallback to basic task generation
			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[2];
			expect(tasks?.name).toContain("tasks.md");
			expect(tasks?.content).toBeDefined();
		});

		it("should use basic task generation when no spec data available", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[2];
			expect(tasks?.name).toContain("tasks.md");
			expect(tasks?.content).toContain("Total Tasks:");
		});
	});

	describe("extractTaskTitle edge cases", () => {
		it("should handle empty description", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				config: {
					sessionId: "test-session",
					context: {},
					requirements: [""],
				},
				context: {
					acceptanceCriteria: [""],
				},
				history: [],
			};

			// Should handle empty strings gracefully
			const artifacts = strategy.render(result);
			expect(artifacts).toBeDefined();
		});

		it("should strip action verbs from task titles", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				config: {
					sessionId: "test-session",
					context: {},
					requirements: [
						"Implement authentication",
						"Create database schema",
						"Add validation logic",
					],
				},
				context: {
					acceptanceCriteria: ["Build API endpoints"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[2];

			// Verify task content is generated
			expect(tasks?.content).toBeDefined();

			// Verify action verbs are stripped to avoid redundancy like "Implement: Implement authentication"
			// The extractTaskTitle method strips verbs like "Implement", "Create", "Add", "Build"
			// So we should see titles like "Implement: authentication" not "Implement: Implement authentication"
			expect(tasks?.content).toContain("Implement:");
			expect(tasks?.content).not.toContain("Implement: Implement");
			expect(tasks?.content).not.toContain("Implement: Create");
			expect(tasks?.content).not.toContain("Implement: Add");
		});

		it("should handle acronyms in task titles", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				config: {
					sessionId: "test-session",
					context: {},
					requirements: ["API endpoint for user authentication"],
				},
				context: {
					acceptanceCriteria: ["REST API compliance"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[2];

			// Verify task content is generated
			expect(tasks?.content).toBeDefined();

			// Verify acronyms like "API" and "REST" are preserved in uppercase
			// The extractTaskTitle method preserves acronyms when the next char is also uppercase
			expect(tasks?.content).toContain("API");
			expect(tasks?.content).toContain("REST");
		});

		it("should truncate long task titles", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "implementation",
				config: {
					sessionId: "test-session",
					context: {},
					requirements: [
						"This is a very long requirement description that should be truncated when used as a task title because it exceeds fifty characters",
					],
				},
				context: {
					acceptanceCriteria: ["Test criteria"],
				},
				history: [],
			};

			const artifacts = strategy.render(result);
			const tasks = artifacts.secondary?.[2];

			// Verify task content is generated
			expect(tasks?.content).toBeDefined();
			expect(tasks?.content.length).toBeGreaterThan(0);

			// Verify that long titles (>50 chars) are truncated with ellipsis
			// The extractTaskTitle method truncates at 50 characters and adds "..."
			expect(tasks?.content).toContain("...");
		});
	});

	describe("edge cases for constitution item lookup", () => {
		it("should handle unknown constitution IDs", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview",
					constraintReferences: [
						{
							constitutionId: "UNKNOWN_ID",
							notes: "Reference to unknown constraint",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				includeConstitutionalConstraints: true,
			});

			const spec = artifacts.secondary?.[0];
			expect(spec?.content).toContain("UNKNOWN_ID: Unknown");
		});

		it("should find items across all constitution sections", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview",
					constraintReferences: [
						{ constitutionId: "P1" }, // Principle
						{ constitutionId: "C1" }, // Constraint
						{ constitutionId: "AR1" }, // Architecture Rule
						{ constitutionId: "DP1" }, // Design Principle
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				includeConstitutionalConstraints: true,
			});

			const spec = artifacts.secondary?.[0];
			expect(spec?.content).toContain("P1: Test Principle");
			expect(spec?.content).toContain("C1: Test Constraint");
			expect(spec?.content).toContain("AR1: Test Architecture Rule");
			expect(spec?.content).toContain("DP1: Test Design Principle");
		});
	});
});
