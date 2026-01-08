/**
 * Tests for RFCStrategy
 *
 * @module tests/strategies/rfc-strategy
 */

import { describe, expect, it } from "vitest";
import type { SessionState } from "../../../src/domain/design/types.js";
import type { PromptResult } from "../../../src/domain/prompting/types.js";
import { OutputApproach } from "../../../src/strategies/output-strategy.js";
import { RFCStrategy } from "../../../src/strategies/rfc-strategy.js";

describe("RFCStrategy", () => {
	describe("constructor and properties", () => {
		it("should have RFC approach", () => {
			const strategy = new RFCStrategy();
			expect(strategy.approach).toBe(OutputApproach.RFC);
		});

		it("should have readonly approach property", () => {
			const strategy = new RFCStrategy();
			// TypeScript readonly is compile-time only, verify it's set correctly
			expect(strategy.approach).toBe(OutputApproach.RFC);
		});
	});

	describe("supports() method", () => {
		it("should support PromptResult", () => {
			const strategy = new RFCStrategy();
			expect(strategy.supports("PromptResult")).toBe(true);
		});

		it("should support SessionState", () => {
			const strategy = new RFCStrategy();
			expect(strategy.supports("SessionState")).toBe(true);
		});

		it("should not support unsupported types", () => {
			const strategy = new RFCStrategy();
			expect(strategy.supports("ScoringResult")).toBe(false);
			expect(strategy.supports("UnknownType")).toBe(false);
			expect(strategy.supports("AnalysisResult")).toBe(false);
			expect(strategy.supports("")).toBe(false);
		});
	});

	describe("render() - PromptResult", () => {
		it("should render simple PromptResult to RFC format", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "E-commerce Checkout Flow",
						body: "Implement a secure checkout flow for the e-commerce platform",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe("RFC.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.content).toContain(
				"# RFC: E-commerce Checkout Flow",
			);
			expect(artifacts.primary.content).toContain("## Summary");
			expect(artifacts.primary.content).toContain("## Scope");
			expect(artifacts.primary.content).toContain("## Participants");
			expect(artifacts.primary.content).toContain("## Proposal");
			expect(artifacts.primary.content).toContain("## Pros");
			expect(artifacts.primary.content).toContain("## Cons");
			expect(artifacts.primary.content).toContain("## Alternatives Considered");
			expect(artifacts.primary.content).toContain("## Conclusion");
		});

		it("should include all RFC sections", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Context",
						body: "API Gateway Implementation",
						level: 1,
					},
				],
				metadata: {
					complexity: 60,
					tokenEstimate: 200,
					sections: 1,
					techniques: ["chain-of-thought"],
					requirementsCount: 1,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);
			const content = artifacts.primary.content;

			// Verify all required RFC sections are present
			expect(content).toMatch(/# RFC:/);
			expect(content).toMatch(/## Summary/);
			expect(content).toMatch(/## Scope/);
			expect(content).toMatch(/## Participants/);
			expect(content).toMatch(/## Proposal/);
			expect(content).toMatch(/## Pros/);
			expect(content).toMatch(/## Cons/);
			expect(content).toMatch(/## Alternatives Considered/);
			expect(content).toMatch(/## Conclusion/);
		});

		it("should extract title from first section", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Microservices Architecture",
						body: "Proposal for microservices migration",
						level: 1,
					},
				],
				metadata: {
					complexity: 70,
					tokenEstimate: 300,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"# RFC: Microservices Architecture",
			);
		});

		it("should use default title when no sections", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 0,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# RFC: Untitled Proposal");
		});

		it("should extract summary from first section body", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "New Feature",
						body: "This is a comprehensive proposal for implementing a new authentication system with OAuth 2.0 support.",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("## Summary");
			expect(artifacts.primary.content).toContain(
				"This is a comprehensive proposal for implementing a new authentication system",
			);
		});

		it("should truncate long summaries", () => {
			const strategy = new RFCStrategy();
			const longBody = "A".repeat(250);
			const result: PromptResult = {
				sections: [
					{
						title: "Feature",
						body: longBody,
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("...");
		});

		it("should extract scope from scope section", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
					{
						title: "Scope",
						body: "This proposal covers authentication and authorization",
						level: 2,
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

			expect(artifacts.primary.content).toContain(
				"This proposal covers authentication and authorization",
			);
		});

		it("should use default scope when not found", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("To be defined");
		});

		it("should extract proposal from goal section", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
					{
						title: "Goal",
						body: "Implement OAuth 2.0 authentication",
						level: 2,
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

			expect(artifacts.primary.content).toContain(
				"Implement OAuth 2.0 authentication",
			);
		});

		it("should combine all sections as proposal when no specific section", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Section 1",
						body: "Content 1",
						level: 1,
					},
					{
						title: "Section 2",
						body: "Content 2",
						level: 2,
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

			expect(artifacts.primary.content).toContain("### Section 1");
			expect(artifacts.primary.content).toContain("Content 1");
			expect(artifacts.primary.content).toContain("### Section 2");
			expect(artifacts.primary.content).toContain("Content 2");
		});

		it("should extract pros from benefits section", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
					{
						title: "Benefits",
						body: "Improved security\nBetter performance",
						level: 2,
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

			expect(artifacts.primary.content).toContain("- Improved security");
			expect(artifacts.primary.content).toContain("- Better performance");
		});

		it("should convert pros to bullet list", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
					{
						title: "Pros",
						body: "Fast\nSecure\nScalable",
						level: 2,
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

			expect(artifacts.primary.content).toContain("- Fast");
			expect(artifacts.primary.content).toContain("- Secure");
			expect(artifacts.primary.content).toContain("- Scalable");
		});

		it("should use default pros when not found", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toMatch(/## Pros\n\n- TBD/);
		});

		it("should extract cons from risks section", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
					{
						title: "Risks",
						body: "High complexity\nMigration cost",
						level: 2,
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

			expect(artifacts.primary.content).toContain("- High complexity");
			expect(artifacts.primary.content).toContain("- Migration cost");
		});

		it("should use default cons when not found", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toMatch(/## Cons\n\n- TBD/);
		});

		it("should extract alternatives section", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
					{
						title: "Alternatives",
						body: "Option A: Use existing system\nOption B: Build from scratch",
						level: 2,
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

			expect(artifacts.primary.content).toContain(
				"Option A: Use existing system",
			);
			expect(artifacts.primary.content).toContain(
				"Option B: Build from scratch",
			);
		});

		it("should use default alternatives when not found", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("None documented");
		});

		it("should extract conclusion section", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
					{
						title: "Conclusion",
						body: "We should proceed with Option A",
						level: 2,
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

			expect(artifacts.primary.content).toContain(
				"We should proceed with Option A",
			);
		});

		it("should use default conclusion when not found", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("Pending team discussion");
		});

		it("should include metadata footer by default", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("---");
			expect(artifacts.primary.content).toContain("*RFC generated:");
		});

		it("should exclude metadata when includeMetadata is false", () => {
			const strategy = new RFCStrategy();
			const result: PromptResult = {
				sections: [
					{
						title: "Title",
						body: "Content",
						level: 1,
					},
				],
				metadata: {
					complexity: 50,
					tokenEstimate: 150,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const artifacts = strategy.render(result, { includeMetadata: false });

			expect(artifacts.primary.content).not.toContain("*RFC generated:");
		});
	});

	describe("render() - SessionState", () => {
		it("should render SessionState to RFC format", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "requirements",
				context: {
					title: "API Gateway Design",
					summary: "Design an API gateway for microservices",
				},
				status: "active",
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.name).toBe("RFC.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.content).toContain("# RFC: API Gateway Design");
			expect(artifacts.primary.content).toContain("## Summary");
			expect(artifacts.primary.content).toContain("## Status");
			expect(artifacts.primary.content).toContain("active");
		});

		it("should extract title from config goal", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {},
				config: {
					sessionId: "session-123",
					context: {},
					goal: "Implement OAuth 2.0",
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# RFC: Implement OAuth 2.0");
		});

		it("should extract title from context", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {
					title: "Database Migration",
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# RFC: Database Migration");
		});

		it("should use default title when not found", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "discovery",
				context: {},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# RFC: Untitled Session");
		});

		it("should extract summary from context", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "requirements",
				context: {
					summary: "Comprehensive API gateway design",
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"Comprehensive API gateway design",
			);
		});

		it("should use phase as fallback summary", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "architecture",
				context: {},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"Design session in architecture phase",
			);
		});

		it("should extract scope from context", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {
					scope: "Authentication and authorization services",
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"Authentication and authorization services",
			);
		});

		it("should use phase as default scope", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "specification",
				context: {},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("Phase: specification");
		});

		it("should extract proposal from context", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {
					proposal: "Implement microservices architecture",
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"Implement microservices architecture",
			);
		});

		it("should extract pros from context array", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {
					pros: ["Improved scalability", "Better maintainability"],
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("- Improved scalability");
			expect(artifacts.primary.content).toContain("- Better maintainability");
		});

		it("should extract cons from context array", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {
					cons: ["Increased complexity", "Higher costs"],
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("- Increased complexity");
			expect(artifacts.primary.content).toContain("- Higher costs");
		});

		it("should extract alternatives from context string", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {
					alternatives: "Option A: Monolith\nOption B: Microservices",
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("Option A: Monolith");
			expect(artifacts.primary.content).toContain("Option B: Microservices");
		});

		it("should extract alternatives from context array", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {
					alternatives: ["Monolith", "Microservices", "Hybrid"],
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("- Monolith");
			expect(artifacts.primary.content).toContain("- Microservices");
			expect(artifacts.primary.content).toContain("- Hybrid");
		});

		it("should extract conclusion from context", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {
					conclusion: "Proceed with microservices",
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("Proceed with microservices");
		});

		it("should use completed status for conclusion", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "implementation",
				context: {},
				status: "completed",
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"Session completed successfully",
			);
		});

		it("should render phases data when available", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {},
				phases: {
					discovery: { completed: true },
					requirements: { items: ["Auth", "API"] },
				},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("discovery");
			expect(artifacts.primary.content).toContain("requirements");
		});

		it("should include status section", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {},
				status: "active",
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toMatch(/## Status\n\nactive/);
		});

		it("should use default status when not provided", () => {
			const strategy = new RFCStrategy();
			const result: SessionState = {
				id: "session-123",
				phase: "planning",
				context: {},
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toMatch(/## Status\n\nDraft/);
		});
	});

	describe("render() - error handling", () => {
		it("should throw error for unsupported result type", () => {
			const strategy = new RFCStrategy();
			const invalidResult = {
				someField: "value",
			};

			expect(() =>
				strategy.render(invalidResult as PromptResult | SessionState),
			).toThrow("Unsupported domain result type");
		});

		it("should throw error for null result", () => {
			const strategy = new RFCStrategy();

			expect(() =>
				strategy.render(null as unknown as PromptResult | SessionState),
			).toThrow("Unsupported domain result type");
		});

		it("should throw error for undefined result", () => {
			const strategy = new RFCStrategy();

			expect(() =>
				strategy.render(undefined as unknown as PromptResult | SessionState),
			).toThrow("Unsupported domain result type");
		});
	});

	describe("output artifacts structure", () => {
		it("should return OutputArtifacts with primary document only", () => {
			const strategy = new RFCStrategy();
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

		it("should have correct document format", () => {
			const strategy = new RFCStrategy();
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
			expect(artifacts.primary.name).toBe("RFC.md");
			expect(typeof artifacts.primary.content).toBe("string");
		});
	});

	describe("participants section", () => {
		it("should include participants in RFC", () => {
			const strategy = new RFCStrategy();
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

			expect(artifacts.primary.content).toContain("## Participants");
			expect(artifacts.primary.content).toContain("**Author**: @copilot");
			expect(artifacts.primary.content).toContain("**Reviewers**: TBD");
			expect(artifacts.primary.content).toContain("**Stakeholders**: TBD");
		});
	});

	describe("integration with RenderOptions", () => {
		it("should accept partial RenderOptions", () => {
			const strategy = new RFCStrategy();
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
			expect(artifacts.primary.content).toContain("*RFC generated:");
		});

		it("should work without options parameter", () => {
			const strategy = new RFCStrategy();
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
			expect(artifacts.primary.content).toContain("*RFC generated:");
		});
	});
});
