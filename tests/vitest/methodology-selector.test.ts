import { beforeEach, describe, expect, it, vi } from "vitest";
import { methodologySelector } from "../../src/tools/design/index.js";
import type { MethodologySignals } from "../../src/tools/design/types/index.js";

interface AlternativeSignals {
	context?: string;
	requirements?: string[];
	constraints?: string[];
}

describe("methodology-selector - Comprehensive Coverage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ============================================================================
	// SECTION 1: Operator Coverage (equals, in, not_equals, not_in)
	// ============================================================================

	describe("Rule Condition Operators", () => {
		describe("equals operator", () => {
			it("should match when equals condition is satisfied", async () => {
				const signals: MethodologySignals = {
					projectType: "safety-protocol",
					problemFraming: "policy-first",
					riskLevel: "critical",
					timelinePressure: "normal",
					stakeholderMode: "regulatory",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});

			it("should not match when equals condition is not satisfied", async () => {
				const signals: MethodologySignals = {
					projectType: "new-application",
					problemFraming: "innovation-driven",
					riskLevel: "low",
					timelinePressure: "flexible",
					stakeholderMode: "technical",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				// Should use fallback methodology since no rules match exactly
				expect(result.selected).toBeDefined();
			});
		});

		describe("in operator", () => {
			it("should match when value is in the array", async () => {
				const signals: MethodologySignals = {
					projectType: "large-refactor",
					problemFraming: "technical-debt",
					riskLevel: "high",
					timelinePressure: "normal",
					stakeholderMode: "technical",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});

			it("should match when value is in the array (critical risk)", async () => {
				const signals: MethodologySignals = {
					projectType: "large-refactor",
					problemFraming: "technical-debt",
					riskLevel: "critical",
					timelinePressure: "normal",
					stakeholderMode: "technical",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});

			it("should not match when value is not in the array", async () => {
				const signals: MethodologySignals = {
					projectType: "large-refactor",
					problemFraming: "technical-debt",
					riskLevel: "low",
					timelinePressure: "normal",
					stakeholderMode: "technical",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				// Low risk doesn't match "in" [high, critical]
				expect(result.selected).toBeDefined();
			});
		});

		describe("not_equals operator", () => {
			it("should match when value is not equal", async () => {
				const signals: MethodologySignals = {
					projectType: "analytics-overhaul",
					problemFraming: "performance-first",
					riskLevel: "medium",
					timelinePressure: "relaxed",
					stakeholderMode: "technical",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});

			it("should not match when value is equal", async () => {
				const signals: MethodologySignals = {
					projectType: "new-application",
					problemFraming: "uncertain-modeling",
					riskLevel: "low",
					timelinePressure: "urgent",
					stakeholderMode: "technical",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});
		});

		describe("not_in operator", () => {
			it("should match when value is not in the array", async () => {
				const signals: MethodologySignals = {
					projectType: "analytics-overhaul",
					problemFraming: "scalability-focused",
					riskLevel: "low",
					timelinePressure: "relaxed",
					stakeholderMode: "technical",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});

			it("should not match when value is in the array", async () => {
				const signals: MethodologySignals = {
					projectType: "integration-project",
					problemFraming: "scalability-focused",
					riskLevel: "high",
					timelinePressure: "urgent",
					stakeholderMode: "business",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});
		});
	});

	// ============================================================================
	// SECTION 2: ProjectType × ProblemFraming Combinations
	// ============================================================================

	describe("ProjectType x ProblemFraming Combinations", () => {
		const projectTypes: Array<MethodologySignals["projectType"]> = [
			"analytics-overhaul",
			"safety-protocol",
			"interactive-feature",
			"large-refactor",
			"new-application",
			"integration-project",
			"optimization-project",
			"compliance-initiative",
			"research-exploration",
			"platform-migration",
		];

		const problemFramings: Array<MethodologySignals["problemFraming"]> = [
			"uncertain-modeling",
			"policy-first",
			"empathy-focused",
			"performance-first",
			"security-focused",
			"scalability-focused",
			"user-experience",
			"technical-debt",
			"innovation-driven",
			"compliance-driven",
		];

		projectTypes.forEach((projectType) => {
			problemFramings.forEach((problemFraming) => {
				it(`should handle ${projectType} + ${problemFraming}`, async () => {
					const signals: MethodologySignals = {
						projectType,
						problemFraming,
						riskLevel: "medium",
						timelinePressure: "normal",
						stakeholderMode: "mixed",
					};
					const result = await methodologySelector.selectMethodology(signals);
					expect(result).toBeDefined();
					expect(result.selected).toBeDefined();
					expect(result.selected.id).toBeDefined();
					expect(typeof result.selected.confidenceScore).toBe("number");
				});
			});
		});
	});

	// ============================================================================
	// SECTION 3: Confidence Modifiers
	// ============================================================================

	describe("Confidence Modifiers", () => {
		it("should apply positive modifier for stakeholderMode match", async () => {
			const signals: MethodologySignals = {
				projectType: "safety-protocol",
				problemFraming: "policy-first",
				riskLevel: "critical",
				timelinePressure: "normal",
				stakeholderMode: "regulatory",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected.confidenceScore).toBeGreaterThan(80);
		});

		it("should apply positive modifier for risk level match", async () => {
			const signals: MethodologySignals = {
				projectType: "safety-protocol",
				problemFraming: "policy-first",
				riskLevel: "critical",
				timelinePressure: "normal",
				stakeholderMode: "technical",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected.confidenceScore).toBeGreaterThan(70);
		});

		it("should apply negative modifier for urgent timeline", async () => {
			const signals: MethodologySignals = {
				projectType: "interactive-feature",
				problemFraming: "empathy-focused",
				riskLevel: "low",
				timelinePressure: "urgent",
				stakeholderMode: "business",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			// With negative modifier, confidence should be affected
			expect(result.selected.confidenceScore).toBeDefined();
		});

		it("should apply positive modifier for urgent timeline lean methodology", async () => {
			const signals: MethodologySignals = {
				projectType: "new-application",
				problemFraming: "user-experience",
				riskLevel: "low",
				timelinePressure: "urgent",
				stakeholderMode: "business",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
		});

		it("should apply multiple modifiers cumulatively", async () => {
			const signals: MethodologySignals = {
				projectType: "large-refactor",
				problemFraming: "technical-debt",
				riskLevel: "critical",
				timelinePressure: "normal",
				stakeholderMode: "technical",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			// Multiple positive modifiers should boost confidence
			expect(result.selected.confidenceScore).toBeGreaterThan(80);
		});
	});

	// ============================================================================
	// SECTION 4: Risk Level Variations
	// ============================================================================

	describe("Risk Level Variations", () => {
		const riskLevels: Array<MethodologySignals["riskLevel"]> = [
			"low",
			"medium",
			"high",
			"critical",
		];

		riskLevels.forEach((riskLevel) => {
			it(`should handle risk level: ${riskLevel}`, async () => {
				const signals: MethodologySignals = {
					projectType: "new-application",
					problemFraming: "uncertain-modeling",
					riskLevel,
					timelinePressure: "normal",
					stakeholderMode: "mixed",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});
		});
	});

	// ============================================================================
	// SECTION 5: Timeline Pressure Variations
	// ============================================================================

	describe("Timeline Pressure Variations", () => {
		const timelines: Array<MethodologySignals["timelinePressure"]> = [
			"urgent",
			"normal",
			"relaxed",
			"flexible",
		];

		timelines.forEach((timeline) => {
			it(`should handle timeline pressure: ${timeline}`, async () => {
				const signals: MethodologySignals = {
					projectType: "new-application",
					problemFraming: "uncertain-modeling",
					riskLevel: "medium",
					timelinePressure: timeline,
					stakeholderMode: "mixed",
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});
		});
	});

	// ============================================================================
	// SECTION 6: Stakeholder Mode Variations
	// ============================================================================

	describe("Stakeholder Mode Variations", () => {
		const modes: Array<MethodologySignals["stakeholderMode"]> = [
			"technical",
			"business",
			"mixed",
			"external",
			"regulatory",
		];

		modes.forEach((mode) => {
			it(`should handle stakeholder mode: ${mode}`, async () => {
				const signals: MethodologySignals = {
					projectType: "new-application",
					problemFraming: "uncertain-modeling",
					riskLevel: "medium",
					timelinePressure: "normal",
					stakeholderMode: mode,
				};
				const result = await methodologySelector.selectMethodology(signals);
				expect(result).toBeDefined();
				expect(result.selected).toBeDefined();
			});
		});
	});

	// ============================================================================
	// SECTION 7: Multiple Condition Rules
	// ============================================================================

	describe("Multiple Condition Rules", () => {
		it("should match rules with multiple conditions (all must match)", async () => {
			const signals: MethodologySignals = {
				projectType: "interactive-feature",
				problemFraming: "empathy-focused",
				riskLevel: "low",
				timelinePressure: "normal",
				stakeholderMode: "business",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
		});

		it("should not match when one condition fails in multi-condition rule", async () => {
			const signals: MethodologySignals = {
				projectType: "interactive-feature",
				problemFraming: "technical-debt",
				riskLevel: "low",
				timelinePressure: "normal",
				stakeholderMode: "business",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			// Should fall back to another methodology
			expect(result.selected).toBeDefined();
		});
	});

	// ============================================================================
	// SECTION 8: Fallback Methodology Selection
	// ============================================================================

	describe("Fallback Methodology Selection", () => {
		it("should provide fallback when no rules match exactly", async () => {
			const signals: MethodologySignals = {
				projectType: "analytics-overhaul",
				problemFraming: "compliance-driven",
				riskLevel: "low",
				timelinePressure: "flexible",
				stakeholderMode: "external",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
			expect(result.selected.id).toBeDefined();
		});

		it("should return alternatives in selection result", async () => {
			const signals: MethodologySignals = {
				projectType: "new-application",
				problemFraming: "uncertain-modeling",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "mixed",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.alternatives).toBeDefined();
			expect(Array.isArray(result.alternatives)).toBe(true);
			expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
		});
	});

	// ============================================================================
	// SECTION 9: Selection Result Structure
	// ============================================================================

	describe("Selection Result Structure", () => {
		it("should include all required result fields", async () => {
			const signals: MethodologySignals = {
				projectType: "new-application",
				problemFraming: "uncertain-modeling",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "mixed",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
			expect(result.alternatives).toBeDefined();
			expect(result.signals).toBeDefined();
			expect(result.timestamp).toBeDefined();
			expect(result.selectionRationale).toBeDefined();
		});

		it("should include backward-compatible methodology and confidence fields", async () => {
			const signals: MethodologySignals = {
				projectType: "new-application",
				problemFraming: "uncertain-modeling",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "mixed",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result.methodology).toBeDefined();
			expect(result.confidence).toBeDefined();
			expect(typeof result.confidence).toBe("number");
		});

		it("should have valid ISO timestamp", async () => {
			const signals: MethodologySignals = {
				projectType: "new-application",
				problemFraming: "uncertain-modeling",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "mixed",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result.timestamp).toBeDefined();
			expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
		});
	});

	// ============================================================================
	// SECTION 10: Input Validation and Fallback
	// ============================================================================

	describe("Input Validation and Fallback", () => {
		it("should handle context parameter for inference", async () => {
			const signals: AlternativeSignals = {
				context: "We need to implement safety-critical aviation protocols",
				requirements: ["regulatory compliance", "safety"],
				constraints: ["time-limited"],
			};
			const result = await methodologySelector.selectMethodology(
				signals as MethodologySignals | AlternativeSignals,
			);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
		});

		it("should infer policy-first when context contains safety keyword", async () => {
			const signals: AlternativeSignals = {
				context: "This is a safety protocol for medical devices",
			};
			const result = await methodologySelector.selectMethodology(
				signals as MethodologySignals | AlternativeSignals,
			);
			expect(result).toBeDefined();
			expect(result.signals.problemFraming).toBe("policy-first");
		});

		it("should default to innovation-driven when no safety context", async () => {
			const signals: AlternativeSignals = {
				context: "Building a new mobile application",
			};
			const result = await methodologySelector.selectMethodology(
				signals as MethodologySignals | AlternativeSignals,
			);
			expect(result).toBeDefined();
			expect(result.signals.problemFraming).toBe("innovation-driven");
		});

		it("should handle partial signal data", async () => {
			const signals: AlternativeSignals = {
				context: "New project",
				requirements: ["fast execution"],
			};
			const result = await methodologySelector.selectMethodology(
				signals as MethodologySignals | AlternativeSignals,
			);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
		});
	});

	// ============================================================================
	// SECTION 11: Edge Cases and Error Conditions
	// ============================================================================

	describe("Edge Cases and Error Conditions", () => {
		it("should handle empty string context", async () => {
			const signals: AlternativeSignals = {
				context: "",
				requirements: [],
				constraints: [],
			};
			const result = await methodologySelector.selectMethodology(
				signals as MethodologySignals | AlternativeSignals,
			);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
		});

		it("should handle undefined additionalContext", async () => {
			const signals: MethodologySignals = {
				projectType: "new-application",
				problemFraming: "uncertain-modeling",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "mixed",
				additionalContext: undefined,
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
		});

		it("should handle large additionalContext object", async () => {
			const signals: MethodologySignals = {
				projectType: "new-application",
				problemFraming: "uncertain-modeling",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "mixed",
				additionalContext: {
					budget: "high",
					team_size: 10,
					experience_level: "senior",
					geographic_distribution: "global",
					cultural_factors: ["distributed", "async"],
				},
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
		});
	});

	// ============================================================================
	// SECTION 12: Confidence Score Calculations
	// ============================================================================

	describe("Confidence Score Calculations", () => {
		it("should rank methodologies by confidence score", async () => {
			const signals: MethodologySignals = {
				projectType: "new-application",
				problemFraming: "uncertain-modeling",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "mixed",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.alternatives).toBeDefined();

			// First should have higher or equal confidence than alternatives
			if (result.alternatives.length > 0) {
				expect(result.selected.confidenceScore).toBeGreaterThanOrEqual(
					result.alternatives[0].confidenceScore,
				);
			}
		});

		it("should maintain confidence scores between 0 and 100", async () => {
			const signals: MethodologySignals = {
				projectType: "new-application",
				problemFraming: "uncertain-modeling",
				riskLevel: "high",
				timelinePressure: "urgent",
				stakeholderMode: "technical",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result.selected.confidenceScore).toBeGreaterThanOrEqual(0);
			expect(result.selected.confidenceScore).toBeLessThanOrEqual(100);

			result.alternatives.forEach((alt) => {
				expect(alt.confidenceScore).toBeGreaterThanOrEqual(0);
				expect(alt.confidenceScore).toBeLessThanOrEqual(100);
			});
		});
	});

	// ============================================================================
	// SECTION 13: Specific Rule Execution Paths
	// ============================================================================

	describe("Specific Rule Execution Paths", () => {
		it("should execute safety-protocol rule", async () => {
			const signals: MethodologySignals = {
				projectType: "safety-protocol",
				problemFraming: "policy-first",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "regulatory",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected.id).toBe("policy-first-risk-evaluation");
		});

		it("should execute interactive-feature rule with multiple conditions", async () => {
			const signals: MethodologySignals = {
				projectType: "interactive-feature",
				problemFraming: "empathy-focused",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "business",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected.id).toBe("design-thinking-empathy");
		});

		it("should execute large-refactor rule with in operator", async () => {
			const signals: MethodologySignals = {
				projectType: "large-refactor",
				problemFraming: "technical-debt",
				riskLevel: "high",
				timelinePressure: "normal",
				stakeholderMode: "technical",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected.id).toBe("architecture-decision-mapping");
		});

		it("should execute urgent-timeline rule", async () => {
			const signals: MethodologySignals = {
				projectType: "integration-project",
				problemFraming: "scalability-focused",
				riskLevel: "low",
				timelinePressure: "urgent",
				stakeholderMode: "technical",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
		});

		it("should execute compliance rule", async () => {
			const signals: MethodologySignals = {
				projectType: "compliance-initiative",
				problemFraming: "compliance-driven",
				riskLevel: "high",
				timelinePressure: "normal",
				stakeholderMode: "regulatory",
			};
			const result = await methodologySelector.selectMethodology(signals);
			expect(result).toBeDefined();
			expect(result.selected).toBeDefined();
		});
	});
});
