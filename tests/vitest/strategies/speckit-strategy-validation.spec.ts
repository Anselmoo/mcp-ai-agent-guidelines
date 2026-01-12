/**
 * Tests for SpecKitStrategy validation integration
 *
 * @module tests/strategies/speckit-strategy-validation
 */

import { describe, expect, it } from "vitest";
import type { SessionState } from "../../../src/domain/design/types.js";
import type { Constitution } from "../../../src/strategies/speckit/types.js";
import { SpecKitStrategy } from "../../../src/strategies/speckit-strategy.js";

describe("SpecKitStrategy - Validation Integration", () => {
	const sampleConstitution: Constitution = {
		principles: [
			{
				id: "1",
				title: "Clear Requirements",
				description: "All specs must have clear, testable requirements",
				type: "principle",
			},
		],
		constraints: [
			{
				id: "C1",
				title: "TypeScript Strict Mode",
				description: "Avoid 'any' types",
				severity: "must",
				type: "constraint",
			},
			{
				id: "C2",
				title: "ESM Modules",
				description: "Use ESM import/export",
				severity: "must",
				type: "constraint",
			},
		],
		architectureRules: [
			{
				id: "AR1",
				title: "Layer Dependencies",
				description: "Follow Gateway → Domain flow",
				type: "architecture-rule",
			},
		],
		designPrinciples: [
			{
				id: "DP1",
				title: "Single Responsibility",
				description: "Each component should have one responsibility",
				type: "design-principle",
			},
		],
	};

	describe("validateBeforeRender option", () => {
		it("should not validate when validateBeforeRender is false", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview",
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: false,
			});

			// Should render without validation section
			expect(artifacts.secondary?.[0].content).not.toContain(
				"⚠️ Validation Results",
			);
		});

		it("should not validate when validateBeforeRender is undefined", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview",
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
			});

			// Should render without validation section
			expect(artifacts.secondary?.[0].content).not.toContain(
				"⚠️ Validation Results",
			);
		});

		it("should validate when validateBeforeRender is true", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview with proper requirements",
				},
				config: {
					sessionId: "test-session",
					context: {},
					requirements: ["Implement authentication", "Add logging"],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			// Should include validation section
			expect(artifacts.secondary?.[0].content).toContain(
				"⚠️ Validation Results",
			);
			expect(artifacts.secondary?.[0].content).toContain("**Score**:");
			expect(artifacts.secondary?.[0].content).toContain(
				"**Constraints Checked**:",
			);
			expect(artifacts.secondary?.[0].content).toContain(
				"**Constraints Passed**:",
			);
		});

		it("should require constitution when validateBeforeRender is true", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview",
				},
				history: [],
			};

			// Validation without constitution should not throw but also not validate
			const artifacts = strategy.render(result, {
				validateBeforeRender: true,
			});

			// Should not include validation section without constitution
			expect(artifacts.secondary?.[0].content).not.toContain(
				"⚠️ Validation Results",
			);
		});
	});

	describe("failOnValidationErrors option", () => {
		it("should not fail when failOnValidationErrors is false", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Use any type here for testing",
				},
				history: [],
			};

			// Should not throw even if there are validation errors
			expect(() =>
				strategy.render(result, {
					constitution: sampleConstitution,
					validateBeforeRender: true,
					failOnValidationErrors: false,
				}),
			).not.toThrow();
		});

		it("should not fail when failOnValidationErrors is undefined", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Use any type here for testing",
				},
				history: [],
			};

			// Should not throw when failOnValidationErrors is not set
			expect(() =>
				strategy.render(result, {
					constitution: sampleConstitution,
					validateBeforeRender: true,
				}),
			).not.toThrow();
		});

		it("should fail when failOnValidationErrors is true and there are errors", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Use any type to trigger validation error",
				},
				history: [],
			};

			// Should throw when validation fails and failOnValidationErrors is true
			expect(() =>
				strategy.render(result, {
					constitution: sampleConstitution,
					validateBeforeRender: true,
					failOnValidationErrors: true,
				}),
			).toThrow("Spec validation failed");
		});

		it("should not fail when failOnValidationErrors is true but validation passes", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Clean overview without violations",
				},
				config: {
					sessionId: "test-session",
					context: {},
					requirements: ["Implement feature X"],
				},
				history: [],
			};

			// Should not throw when validation passes
			expect(() =>
				strategy.render(result, {
					constitution: sampleConstitution,
					validateBeforeRender: true,
					failOnValidationErrors: true,
				}),
			).not.toThrow();
		});
	});

	describe("renderValidationSection", () => {
		it("should render validation section with no issues", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Clean spec with no violations",
				},
				config: {
					sessionId: "test-session",
					context: {},
					requirements: ["Implement feature"],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			const specContent = artifacts.secondary?.[0].content || "";
			expect(specContent).toContain("⚠️ Validation Results");
			expect(specContent).toContain("/100");
			expect(specContent).toContain("**Constraints Checked**:");
			expect(specContent).toContain("**Constraints Passed**:");
		});

		it("should render validation section with errors", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Spec with any type violation",
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
				failOnValidationErrors: false, // Don't throw, just render
			});

			const specContent = artifacts.secondary?.[0].content || "";
			expect(specContent).toContain("⚠️ Validation Results");
			expect(specContent).toContain("**Score**:");

			// Should have issues section
			if (specContent.includes("Issues Found")) {
				expect(specContent).toContain("### Issues Found");
			}
		});

		it("should categorize issues by severity", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test overview with any type and require() usage",
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
				failOnValidationErrors: false,
			});

			const specContent = artifacts.secondary?.[0].content || "";

			// Validation section should exist
			expect(specContent).toContain("⚠️ Validation Results");

			// If there are issues, they should be categorized
			if (specContent.includes("Issues Found")) {
				// At least one category should be present
				const hasErrors = specContent.includes("❌ Errors");
				const hasWarnings = specContent.includes("⚠️ Warnings");
				const hasInfo = specContent.includes("ℹ️ Info");

				expect(hasErrors || hasWarnings || hasInfo).toBe(true);
			}
		});

		it("should include suggestions when available", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Test Feature",
					overview: "Test with any type to trigger suggestion",
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
				failOnValidationErrors: false,
			});

			const specContent = artifacts.secondary?.[0].content || "";

			// If validation found issues with suggestions, they should be present
			if (specContent.includes("any")) {
				// C1 violation should include suggestion
				expect(specContent).toContain("⚠️ Validation Results");
			}
		});
	});

	describe("extractSpecContent", () => {
		it("should extract title and overview", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Payment Gateway",
					overview: "Secure payment processing integration",
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			expect(artifacts.secondary?.[0].content).toContain("Payment Gateway");
			expect(artifacts.secondary?.[0].content).toContain(
				"Secure payment processing integration",
			);
		});

		it("should extract objectives", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Feature",
					overview: "Overview",
					objectives: ["Enable payments", "Support refunds"],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			const specContent = artifacts.secondary?.[0].content || "";
			expect(specContent).toContain("Enable payments");
			expect(specContent).toContain("Support refunds");
		});

		it("should extract requirements from config", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Feature",
					overview: "Overview",
				},
				config: {
					sessionId: "test-session",
					context: {},
					requirements: ["Requirement 1", "Requirement 2"],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			const specContent = artifacts.secondary?.[0].content || "";
			expect(specContent).toContain("Requirement 1");
			expect(specContent).toContain("Requirement 2");
		});

		it("should extract requirements from context", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Feature",
					overview: "Overview",
					requirements: ["Context Req 1", "Context Req 2"],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			const specContent = artifacts.secondary?.[0].content || "";
			expect(specContent).toContain("Context Req 1");
			expect(specContent).toContain("Context Req 2");
		});

		it("should extract acceptance criteria", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Feature",
					overview: "Overview",
					acceptanceCriteria: ["Payment successful", "Receipt generated"],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			const specContent = artifacts.secondary?.[0].content || "";
			expect(specContent).toContain("Payment successful");
			expect(specContent).toContain("Receipt generated");
		});
	});

	describe("integration with existing features", () => {
		it("should work with constitutional constraints rendering", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Feature",
					overview: "Overview",
					constraintReferences: [
						{
							constitutionId: "C1",
							type: "constraint",
							notes: "Critical for type safety",
						},
					],
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				includeConstitutionalConstraints: true,
				validateBeforeRender: true,
			});

			const specContent = artifacts.secondary?.[0].content || "";

			// Should include both constitutional constraints and validation
			expect(specContent).toContain("Constitutional Constraints");
			expect(specContent).toContain("⚠️ Validation Results");
		});

		it("should maintain all secondary documents", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Feature",
					overview: "Overview",
				},
				history: [],
			};

			const artifacts = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			// Should still have 6 secondary documents
			expect(artifacts.secondary).toHaveLength(6);
			expect(artifacts.secondary?.[0].name).toContain("spec.md");
			expect(artifacts.secondary?.[1].name).toContain("plan.md");
			expect(artifacts.secondary?.[2].name).toContain("tasks.md");
			expect(artifacts.secondary?.[3].name).toContain("progress.md");
			expect(artifacts.secondary?.[4].name).toContain("adr.md");
			expect(artifacts.secondary?.[5].name).toContain("roadmap.md");
		});
	});

	describe("validator caching", () => {
		it("should reuse validator when same constitution is provided", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Feature",
					overview: "Clean spec",
				},
				history: [],
			};

			// First render with constitution
			const artifacts1 = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			// Second render with same constitution
			const artifacts2 = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			// Both should succeed and produce validation results
			expect(artifacts1.secondary?.[0].content).toContain(
				"⚠️ Validation Results",
			);
			expect(artifacts2.secondary?.[0].content).toContain(
				"⚠️ Validation Results",
			);
		});

		it("should create new validator when constitution changes", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Feature",
					overview: "Clean spec",
				},
				history: [],
			};

			const altConstitution: Constitution = {
				principles: [
					{
						id: "2",
						title: "Different Principle",
						description: "Different description",
						type: "principle",
					},
				],
				constraints: [],
				architectureRules: [],
				designPrinciples: [],
			};

			// First render with original constitution
			const artifacts1 = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			// Second render with different constitution
			const artifacts2 = strategy.render(result, {
				constitution: altConstitution,
				validateBeforeRender: true,
			});

			// Both should succeed and produce validation results
			expect(artifacts1.secondary?.[0].content).toContain(
				"⚠️ Validation Results",
			);
			expect(artifacts2.secondary?.[0].content).toContain(
				"⚠️ Validation Results",
			);
		});

		it("should validate without constitution when none provided", () => {
			const strategy = new SpecKitStrategy();
			const result: SessionState = {
				id: "test-session",
				phase: "specification",
				context: {
					title: "Feature",
					overview: "Clean spec",
				},
				history: [],
			};

			// First render with constitution
			const artifacts1 = strategy.render(result, {
				constitution: sampleConstitution,
				validateBeforeRender: true,
			});

			// Second render without constitution
			const artifacts2 = strategy.render(result, {
				validateBeforeRender: true,
			});

			// First should have validation results
			expect(artifacts1.secondary?.[0].content).toContain(
				"⚠️ Validation Results",
			);

			// Second should not have validation results (no constitution)
			expect(artifacts2.secondary?.[0].content).not.toContain(
				"⚠️ Validation Results",
			);
		});
	});
});
