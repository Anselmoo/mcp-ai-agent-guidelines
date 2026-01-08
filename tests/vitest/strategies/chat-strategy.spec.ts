/**
 * Tests for ChatStrategy
 *
 * @module tests/strategies/chat-strategy
 */

import { describe, expect, it } from "vitest";
import type { ScoringResult } from "../../../src/domain/analysis/types.js";
import type { PromptResult } from "../../../src/domain/prompting/types.js";
import { ChatStrategy } from "../../../src/strategies/chat-strategy.js";
import { OutputApproach } from "../../../src/strategies/output-strategy.js";

describe("ChatStrategy", () => {
	describe("constructor and properties", () => {
		it("should have CHAT approach", () => {
			const strategy = new ChatStrategy();
			expect(strategy.approach).toBe(OutputApproach.CHAT);
		});

		it("should have readonly approach property", () => {
			const strategy = new ChatStrategy();
			// TypeScript readonly is compile-time only, verify it's set correctly
			expect(strategy.approach).toBe(OutputApproach.CHAT);
		});
	});

	describe("supports() method", () => {
		it("should support PromptResult", () => {
			const strategy = new ChatStrategy();
			expect(strategy.supports("PromptResult")).toBe(true);
		});

		it("should support ScoringResult", () => {
			const strategy = new ChatStrategy();
			expect(strategy.supports("ScoringResult")).toBe(true);
		});

		it("should support SessionState", () => {
			const strategy = new ChatStrategy();
			expect(strategy.supports("SessionState")).toBe(true);
		});

		it("should not support unsupported types", () => {
			const strategy = new ChatStrategy();
			expect(strategy.supports("UnknownType")).toBe(false);
			expect(strategy.supports("AnalysisResult")).toBe(false);
			expect(strategy.supports("")).toBe(false);
		});
	});

	describe("render() - PromptResult", () => {
		it("should render simple PromptResult to markdown", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Context",
						body: "E-commerce platform",
						level: 1,
					},
					{
						title: "Goal",
						body: "Implement checkout flow",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 2,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe("prompt.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.content).toContain("# Context");
			expect(artifacts.primary.content).toContain("E-commerce platform");
			expect(artifacts.primary.content).toContain("# Goal");
			expect(artifacts.primary.content).toContain("Implement checkout flow");
		});

		it("should render hierarchical sections with different levels", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Main Section",
						body: "Top level content",
						level: 1,
					},
					{
						title: "Subsection",
						body: "Second level content",
						level: 2,
					},
					{
						title: "Deep Section",
						body: "Third level content",
						level: 3,
					},
				],
				metadata: {
					complexity: 60,
					tokenEstimate: 200,
					sections: 3,
					techniques: ["chain-of-thought"],
					requirementsCount: 1,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# Main Section");
			expect(artifacts.primary.content).toContain("## Subsection");
			expect(artifacts.primary.content).toContain("### Deep Section");
		});

		it("should handle sections without level (default to 1)", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Section Without Level",
						body: "Default level content",
					},
				],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["few-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# Section Without Level");
			expect(artifacts.primary.content).toContain("Default level content");
		});

		it("should include metadata when includeMetadata is true", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 40,
					tokenEstimate: 250,
					sections: 1,
					techniques: ["zero-shot", "few-shot"],
					requirementsCount: 2,
					issuesCount: 1,
				},
			};

			const artifacts = strategy.render(result, { includeMetadata: true });

			expect(artifacts.primary.content).toContain("---");
			expect(artifacts.primary.content).toContain(
				"Technique: zero-shot, few-shot",
			);
			expect(artifacts.primary.content).toContain("Tokens: ~250");
		});

		it("should not include metadata when includeMetadata is false", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 40,
					tokenEstimate: 250,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result, { includeMetadata: false });

			expect(artifacts.primary.content).not.toContain("---");
			expect(artifacts.primary.content).not.toContain("Technique:");
			expect(artifacts.primary.content).not.toContain("Tokens:");
		});

		it("should not include metadata by default", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 40,
					tokenEstimate: 250,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).not.toContain("Technique:");
		});

		it("should render multiple techniques in metadata", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 70,
					tokenEstimate: 400,
					sections: 1,
					techniques: ["zero-shot", "few-shot", "chain-of-thought"],
					requirementsCount: 5,
					issuesCount: 2,
				},
			};

			const artifacts = strategy.render(result, { includeMetadata: true });

			expect(artifacts.primary.content).toContain(
				"Technique: zero-shot, few-shot, chain-of-thought",
			);
		});
	});

	describe("render() - ScoringResult", () => {
		it("should render ScoringResult to markdown table", () => {
			const strategy = new ChatStrategy();
			const result: ScoringResult = {
				overallScore: 85,
				breakdown: {
					hygiene: {
						score: 25,
						issues: [],
					},
					coverage: {
						score: 22,
						issues: [],
					},
					documentation: {
						score: 13,
						issues: [],
					},
					security: {
						score: 10,
						issues: [],
					},
				},
				recommendations: ["Improve test coverage", "Add more documentation"],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe("score-report.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.content).toContain("# Clean Code Score: 85/100");
			expect(artifacts.primary.content).toContain("## Breakdown");
			expect(artifacts.primary.content).toContain("| Metric | Score |");
			expect(artifacts.primary.content).toContain("| Hygiene | 25 |");
			expect(artifacts.primary.content).toContain("| Coverage | 22 |");
			expect(artifacts.primary.content).toContain("| Documentation | 13 |");
			expect(artifacts.primary.content).toContain("| Security | 10 |");
		});

		it("should render recommendations list", () => {
			const strategy = new ChatStrategy();
			const result: ScoringResult = {
				overallScore: 70,
				breakdown: {
					hygiene: {
						score: 20,
						issues: ["Outdated patterns"],
					},
					coverage: {
						score: 18,
						issues: ["Low coverage"],
					},
					documentation: {
						score: 10,
						issues: ["Missing docs"],
					},
					security: {
						score: 10,
						issues: [],
					},
				},
				recommendations: [
					"Update to modern patterns",
					"Increase test coverage to 90%",
					"Add JSDoc comments",
					"Review security best practices",
				],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("## Recommendations");
			expect(artifacts.primary.content).toContain(
				"- Update to modern patterns",
			);
			expect(artifacts.primary.content).toContain(
				"- Increase test coverage to 90%",
			);
			expect(artifacts.primary.content).toContain("- Add JSDoc comments");
			expect(artifacts.primary.content).toContain(
				"- Review security best practices",
			);
		});

		it("should handle empty recommendations", () => {
			const strategy = new ChatStrategy();
			const result: ScoringResult = {
				overallScore: 100,
				breakdown: {
					hygiene: {
						score: 30,
						issues: [],
					},
					coverage: {
						score: 25,
						issues: [],
					},
					documentation: {
						score: 15,
						issues: [],
					},
					security: {
						score: 10,
						issues: [],
					},
				},
				recommendations: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("## Recommendations");
			// Empty recommendations should still have the heading
			expect(artifacts.primary.content).toMatch(/## Recommendations\n\n\n$/);
		});

		it("should handle zero scores", () => {
			const strategy = new ChatStrategy();
			const result: ScoringResult = {
				overallScore: 0,
				breakdown: {
					hygiene: {
						score: 0,
						issues: ["Critical issues"],
					},
					coverage: {
						score: 0,
						issues: ["No tests"],
					},
					documentation: {
						score: 0,
						issues: ["No docs"],
					},
					security: {
						score: 0,
						issues: ["Security vulnerabilities"],
					},
				},
				recommendations: ["Fix all critical issues immediately"],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# Clean Code Score: 0/100");
			expect(artifacts.primary.content).toContain("| Hygiene | 0 |");
			expect(artifacts.primary.content).toContain("| Coverage | 0 |");
		});
	});

	describe("render() - error handling", () => {
		it("should throw error for unsupported result type", () => {
			const strategy = new ChatStrategy();
			const invalidResult = {
				someField: "value",
			};

			expect(() =>
				strategy.render(invalidResult as PromptResult | ScoringResult),
			).toThrow("Unsupported domain result type");
		});

		it("should throw error for null result", () => {
			const strategy = new ChatStrategy();

			expect(() =>
				strategy.render(null as unknown as PromptResult | ScoringResult),
			).toThrow("Unsupported domain result type");
		});

		it("should throw error for undefined result", () => {
			const strategy = new ChatStrategy();

			expect(() =>
				strategy.render(undefined as unknown as PromptResult | ScoringResult),
			).toThrow("Unsupported domain result type");
		});
	});

	describe("output artifacts structure", () => {
		it("should return OutputArtifacts with primary document only", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary).toBeDefined();
			expect(artifacts.secondary).toBeUndefined();
			expect(artifacts.crossCutting).toBeUndefined();
		});

		it("should have correct document format for PromptResult", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.name).toBe("prompt.md");
			expect(typeof artifacts.primary.content).toBe("string");
		});

		it("should have correct document format for ScoringResult", () => {
			const strategy = new ChatStrategy();
			const result: ScoringResult = {
				overallScore: 85,
				breakdown: {
					hygiene: {
						score: 25,
						issues: [],
					},
					coverage: {
						score: 22,
						issues: [],
					},
					documentation: {
						score: 13,
						issues: [],
					},
					security: {
						score: 10,
						issues: [],
					},
				},
				recommendations: ["Improve coverage"],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.name).toBe("score-report.md");
			expect(typeof artifacts.primary.content).toBe("string");
		});
	});

	describe("integration with RenderOptions", () => {
		it("should accept partial RenderOptions", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result, {
				includeMetadata: true,
				verbosity: "verbose",
			});

			expect(artifacts).toBeDefined();
			expect(artifacts.primary.content).toContain("Technique:");
		});

		it("should work without options parameter", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts).toBeDefined();
			expect(artifacts.primary.content).not.toContain("Technique:");
		});

		it("should ignore verbosity option (not used in ChatStrategy)", () => {
			const strategy = new ChatStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Test",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const minimalArtifacts = strategy.render(result, {
				verbosity: "minimal",
			});
			const verboseArtifacts = strategy.render(result, {
				verbosity: "verbose",
			});

			expect(minimalArtifacts.primary.content).toBe(
				verboseArtifacts.primary.content,
			);
		});
	});
});
