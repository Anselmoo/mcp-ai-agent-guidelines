/**
 * Tests for OutputSelector
 *
 * @module tests/gateway/output-selector
 */

import { describe, expect, it } from "vitest";
import {
	type ContextSignals,
	calculateConfidence,
	extractKeywords,
	generateReasoning,
	recommendApproach,
	selectApproach,
} from "../../../src/gateway/output-selector.js";
import { OutputApproach } from "../../../src/strategies/output-strategy.js";

describe("OutputSelector", () => {
	describe("extractKeywords", () => {
		it("should extract keywords from text", () => {
			const context = "Create a spec.md and plan.md for the project";
			const keywords = extractKeywords(context);

			expect(keywords).toContain("create");
			expect(keywords).toContain("spec.md");
			expect(keywords).toContain("plan.md");
			expect(keywords).toContain("project");
		});

		it("should normalize to lowercase", () => {
			const context = "SPEC Plan TASKS";
			const keywords = extractKeywords(context);

			expect(keywords).toEqual(["spec", "plan", "tasks"]);
		});

		it("should filter stop words", () => {
			const context = "the specification is in the plan";
			const keywords = extractKeywords(context);

			expect(keywords).not.toContain("the");
			expect(keywords).not.toContain("is");
			expect(keywords).not.toContain("in");
			expect(keywords).toContain("specification");
			expect(keywords).toContain("plan");
		});

		it("should handle punctuation", () => {
			const context = "spec.md, plan.md; tasks.md!";
			const keywords = extractKeywords(context);

			expect(keywords).toContain("spec.md");
			expect(keywords).toContain("plan.md");
			expect(keywords).toContain("tasks.md");
		});

		it("should handle empty string", () => {
			const keywords = extractKeywords("");
			expect(keywords).toEqual([]);
		});
	});

	describe("selectApproach", () => {
		describe("Spec-Kit selection", () => {
			it("should select SPECKIT for constitution reference", () => {
				const signals: ContextSignals = {
					keywords: ["constitution"],
					hasConstitution: true,
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});

			it("should select SPECKIT for multiple Spec-Kit signals", () => {
				const signals: ContextSignals = {
					keywords: ["spec.md", "plan.md"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});

			it("should select SPECKIT for spec and tasks", () => {
				const signals: ContextSignals = {
					keywords: ["specification", "tasks.md"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});

			it("should select SPECKIT for plan and progress", () => {
				const signals: ContextSignals = {
					keywords: ["plan.md", "progress.md"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});

			it("should select SPECKIT for github workflow and speckit", () => {
				const signals: ContextSignals = {
					keywords: ["github workflow", "speckit"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});

			it("should select SPECKIT for constitution and constraints", () => {
				const signals: ContextSignals = {
					keywords: ["constitution", "constraints"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});

			it("should select SPECKIT for acceptance criteria and tasks", () => {
				const signals: ContextSignals = {
					keywords: ["acceptance criteria", "task list"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});
		});

		describe("avoid false positives", () => {
			it("should NOT select SPECKIT for single generic keyword 'plan'", () => {
				const signals: ContextSignals = {
					keywords: ["plan"],
				};

				expect(selectApproach(signals)).not.toBe(OutputApproach.SPECKIT);
				expect(selectApproach(signals)).toBe(OutputApproach.CHAT);
			});

			it("should NOT select SPECKIT for single generic keyword 'spec'", () => {
				const signals: ContextSignals = {
					keywords: ["spec"],
				};

				expect(selectApproach(signals)).not.toBe(OutputApproach.SPECKIT);
				expect(selectApproach(signals)).toBe(OutputApproach.CHAT);
			});

			it("should NOT select SPECKIT for single keyword 'tasks'", () => {
				const signals: ContextSignals = {
					keywords: ["tasks"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.CHAT);
			});

			it("should NOT select SPECKIT for single keyword 'specification'", () => {
				const signals: ContextSignals = {
					keywords: ["specification"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.CHAT);
			});

			it("should NOT select SPECKIT for unrelated keywords", () => {
				const signals: ContextSignals = {
					keywords: ["documentation", "readme"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.CHAT);
			});
		});

		describe("default behavior", () => {
			it("should default to CHAT for empty keywords", () => {
				const signals: ContextSignals = {
					keywords: [],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.CHAT);
			});

			it("should default to CHAT for no matches", () => {
				const signals: ContextSignals = {
					keywords: ["random", "words", "here"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.CHAT);
			});
		});

		describe("case insensitivity", () => {
			it("should match SPECKIT signals case-insensitively", () => {
				const signals: ContextSignals = {
					keywords: ["SPEC.MD", "PLAN.MD"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});

			it("should match mixed case signals", () => {
				const signals: ContextSignals = {
					keywords: ["Specification", "Tasks.md"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});
		});

		describe("partial matching", () => {
			it("should match keywords containing signals", () => {
				const signals: ContextSignals = {
					keywords: ["create-spec.md", "update-plan.md"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});

			it("should match specification and task list as distinct signals", () => {
				const signals: ContextSignals = {
					// "spec" matches "spec" signal
					// "tasks" matches "tasks" signal
					keywords: ["spec", "tasks"],
				};

				expect(selectApproach(signals)).toBe(OutputApproach.SPECKIT);
			});
		});
	});

	describe("calculateConfidence", () => {
		it("should return 95% confidence for constitution", () => {
			const signals: ContextSignals = {
				keywords: ["constitution"],
				hasConstitution: true,
			};

			const confidence = calculateConfidence(signals, OutputApproach.SPECKIT);
			expect(confidence).toBe(95);
		});

		it("should return 90% confidence for 3+ Spec-Kit signals", () => {
			const signals: ContextSignals = {
				keywords: ["spec.md", "plan.md", "tasks.md"],
			};

			const confidence = calculateConfidence(signals, OutputApproach.SPECKIT);
			expect(confidence).toBe(90);
		});

		it("should return 75% confidence for 2 Spec-Kit signals", () => {
			const signals: ContextSignals = {
				// Use signals that won't double-count
				keywords: ["specification", "acceptance criteria"],
			};

			const confidence = calculateConfidence(signals, OutputApproach.SPECKIT);
			expect(confidence).toBe(75);
		});

		it("should return 60% confidence for CHAT approach", () => {
			const signals: ContextSignals = {
				keywords: ["random"],
			};

			const confidence = calculateConfidence(signals, OutputApproach.CHAT);
			expect(confidence).toBe(60);
		});

		it("should return 60% confidence for non-SPECKIT approach", () => {
			const signals: ContextSignals = {
				keywords: [],
			};

			const confidence = calculateConfidence(signals, OutputApproach.RFC);
			expect(confidence).toBe(60);
		});
	});

	describe("generateReasoning", () => {
		it("should explain constitution-based recommendation", () => {
			const signals: ContextSignals = {
				keywords: ["constitution"],
				hasConstitution: true,
			};

			const reasoning = generateReasoning(signals, OutputApproach.SPECKIT);

			expect(reasoning).toContain("Constitution");
			expect(reasoning).toContain("constraint document");
			expect(reasoning).toContain("Spec-Kit");
		});

		it("should list matched signals for SPECKIT", () => {
			const signals: ContextSignals = {
				keywords: ["spec.md", "plan.md", "tasks.md"],
			};

			const reasoning = generateReasoning(signals, OutputApproach.SPECKIT);

			expect(reasoning).toContain("Spec-Kit signals");
			expect(reasoning).toContain("spec");
			expect(reasoning).toContain("plan");
		});

		it("should explain default CHAT approach", () => {
			const signals: ContextSignals = {
				keywords: ["random"],
			};

			const reasoning = generateReasoning(signals, OutputApproach.CHAT);

			expect(reasoning).toContain("Default markdown");
			expect(reasoning).toContain("general-purpose");
		});

		it("should limit displayed signals to 3", () => {
			const signals: ContextSignals = {
				keywords: ["spec.md", "plan.md", "tasks.md", "progress.md", "speckit"],
			};

			const reasoning = generateReasoning(signals, OutputApproach.SPECKIT);

			// Should show count but limit displayed signals
			expect(reasoning).toMatch(/5|Multiple/);
		});
	});

	describe("recommendApproach", () => {
		describe("SPECKIT recommendations", () => {
			it("should recommend SPECKIT for constitution reference", () => {
				const context = "Use the CONSTITUTION to define constraints";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
				expect(result.confidence).toBe(95);
				expect(result.reasoning).toContain("Constitution");
			});

			it("should recommend SPECKIT for lowercase constitution", () => {
				const context = "Follow the constitution guidelines";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
				expect(result.confidence).toBe(95);
			});

			it("should recommend SPECKIT for spec and plan files", () => {
				const context = "Create spec.md and plan.md documents";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
				expect(result.confidence).toBeGreaterThanOrEqual(75);
				expect(result.reasoning).toContain("Spec-Kit");
			});

			it("should recommend SPECKIT for github workflow context", () => {
				const context = "Set up github workflow with speckit format";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
				expect(result.confidence).toBeGreaterThanOrEqual(75);
			});

			it("should recommend SPECKIT for task management context", () => {
				const context = "Create tasks.md and progress.md for tracking";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
				expect(result.confidence).toBeGreaterThanOrEqual(75);
			});

			it("should recommend SPECKIT with high confidence for 3+ signals", () => {
				const context = "Create spec.md, plan.md, and tasks.md for the project";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
				expect(result.confidence).toBe(90);
			});
		});

		describe("CHAT recommendations (avoiding false positives)", () => {
			it("should recommend CHAT for single 'plan' keyword", () => {
				const context = "We need to plan the project";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.CHAT);
				expect(result.confidence).toBe(60);
			});

			it("should recommend CHAT for single 'spec' keyword", () => {
				const context = "Check the spec before proceeding";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.CHAT);
			});

			it("should recommend CHAT for unrelated content", () => {
				const context = "Write a blog post about software development";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.CHAT);
				expect(result.reasoning).toContain("Default markdown");
			});

			it("should recommend CHAT for empty context", () => {
				const context = "";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.CHAT);
			});
		});

		describe("edge cases", () => {
			it("should handle context with only stop words", () => {
				const context = "the is in on at to for";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.CHAT);
			});

			it("should handle context with special characters", () => {
				const context = "spec.md!!! plan.md??? tasks.md...";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
			});

			it("should handle very long context", () => {
				const context =
					"We need to create a comprehensive specification document (spec.md) and a detailed planning document (plan.md) with clear tasks breakdown".repeat(
						10,
					);
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
				expect(result.confidence).toBeGreaterThanOrEqual(75);
			});
		});

		describe("case variations", () => {
			it("should detect Constitution with capital C", () => {
				const context = "Review the Constitution document";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
				expect(result.confidence).toBe(95);
			});

			it("should detect CONSTITUTION in all caps", () => {
				const context = "Check CONSTITUTION for guidelines";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
				expect(result.confidence).toBe(95);
			});

			it("should detect mixed case signals", () => {
				const context = "Create SPEC.md and Plan.MD files";
				const result = recommendApproach(context);

				expect(result.approach).toBe(OutputApproach.SPECKIT);
			});
		});
	});
});
