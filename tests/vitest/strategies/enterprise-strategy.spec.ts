/**
 * Tests for EnterpriseStrategy
 *
 * @module tests/strategies/enterprise-strategy
 */

import { describe, expect, it } from "vitest";
import type { SessionState } from "../../../src/domain/design/types.js";
import { EnterpriseStrategy } from "../../../src/strategies/enterprise-strategy.js";
import { OutputApproach } from "../../../src/strategies/output-strategy.js";

describe("EnterpriseStrategy", () => {
	describe("constructor and properties", () => {
		it("should have ENTERPRISE approach", () => {
			const strategy = new EnterpriseStrategy();
			expect(strategy.approach).toBe(OutputApproach.ENTERPRISE);
		});

		it("should have readonly approach property", () => {
			const strategy = new EnterpriseStrategy();
			expect(strategy.approach).toBe(OutputApproach.ENTERPRISE);
		});
	});

	describe("supports() method", () => {
		it("should support SessionState", () => {
			const strategy = new EnterpriseStrategy();
			expect(strategy.supports("SessionState")).toBe(true);
		});

		it("should not support unsupported types", () => {
			const strategy = new EnterpriseStrategy();
			expect(strategy.supports("PromptResult")).toBe(false);
			expect(strategy.supports("ScoringResult")).toBe(false);
			expect(strategy.supports("UnknownType")).toBe(false);
			expect(strategy.supports("")).toBe(false);
		});
	});

	describe("render() - SessionState", () => {
		it("should render SessionState with full context to enterprise format", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-enterprise-001",
				phase: "implementation",
				status: "active",
				context: {},
				config: {
					sessionId: "session-enterprise-001",
					context: {},
					goal: "Digital Transformation Initiative",
				},
				phases: {
					planning: { status: "completed", duration: "2 months" },
					implementation: { status: "active", duration: "6 months" },
					architecture: { status: "planned", duration: "3 months" },
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			// Verify primary document (Executive Summary)
			expect(artifacts.primary).toBeDefined();
			expect(artifacts.primary.name).toBe("executive-summary.md");
			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.content).toContain("# Executive Summary");
			expect(artifacts.primary.content).toContain("## Overview");
			expect(artifacts.primary.content).toContain(
				"Digital Transformation Initiative",
			);
			expect(artifacts.primary.content).toContain("## Strategic Alignment");
			expect(artifacts.primary.content).toContain(
				"## Business Value Proposition",
			);
			expect(artifacts.primary.content).toContain("## Investment Required");
			expect(artifacts.primary.content).toContain("## Risk Profile");
			expect(artifacts.primary.content).toContain("## Timeline");
			expect(artifacts.primary.content).toContain("## Recommendation");
			expect(artifacts.primary.content).toContain("## Key Success Factors");

			// Verify secondary documents
			expect(artifacts.secondary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(4);

			// Board Presentation
			const boardPresentation = artifacts.secondary?.[0];
			expect(boardPresentation?.name).toBe("board-presentation.md");
			expect(boardPresentation?.format).toBe("markdown");
			expect(boardPresentation?.content).toContain("# Board Presentation");
			expect(boardPresentation?.content).toContain(
				"## Slide 1: Initiative Overview",
			);
			expect(boardPresentation?.content).toContain("## Slide 2: Current State");
			expect(boardPresentation?.content).toContain(
				"## Slide 3: Proposed Solution",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 4: Benefits & ROI",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 5: Implementation Approach",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 6: Timeline & Milestones",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 7: Investment & Resources",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 8: Risks & Mitigation",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 9: Competitive Advantage",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 10: Recommendation",
			);

			// Detailed Analysis
			const detailedAnalysis = artifacts.secondary?.[1];
			expect(detailedAnalysis?.name).toBe("detailed-analysis.md");
			expect(detailedAnalysis?.format).toBe("markdown");
			expect(detailedAnalysis?.content).toContain("# Detailed Analysis");
			expect(detailedAnalysis?.content).toContain("## 1. Business Context");
			expect(detailedAnalysis?.content).toContain("## 2. Technical Analysis");
			expect(detailedAnalysis?.content).toContain(
				"## 3. Operational Considerations",
			);
			expect(detailedAnalysis?.content).toContain("## 4. Financial Analysis");
			expect(detailedAnalysis?.content).toContain("## 5. Risk Analysis");
			expect(detailedAnalysis?.content).toContain(
				"## 6. Alternatives Considered",
			);
			expect(detailedAnalysis?.content).toContain(
				"## 7. Dependencies & Constraints",
			);

			// Implementation Roadmap
			const roadmap = artifacts.secondary?.[2];
			expect(roadmap?.name).toBe("implementation-roadmap.md");
			expect(roadmap?.format).toBe("markdown");
			expect(roadmap?.content).toContain("# Implementation Roadmap");
			expect(roadmap?.content).toContain("## Roadmap Overview");
			expect(roadmap?.content).toContain("## Phase Breakdown");
			expect(roadmap?.content).toContain("## Critical Path");
			expect(roadmap?.content).toContain("## Resource Allocation");
			expect(roadmap?.content).toContain("## Quality Gates");
			expect(roadmap?.content).toContain("## Change Management");

			// Budget Estimate
			const budget = artifacts.secondary?.[3];
			expect(budget?.name).toBe("budget-estimate.md");
			expect(budget?.format).toBe("markdown");
			expect(budget?.content).toContain("# Budget Estimate");
			expect(budget?.content).toContain("## Budget Summary");
			expect(budget?.content).toContain("## Capital Expenditure (CapEx)");
			expect(budget?.content).toContain("## Operational Expenditure (OpEx)");
			expect(budget?.content).toContain("## One-Time Costs");
			expect(budget?.content).toContain("## Recurring Costs");
			expect(budget?.content).toContain("## Financial Summary");
			expect(budget?.content).toContain("## Budget Contingency");
		});

		it("should render SessionState with minimal metadata", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-minimal",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("# Executive Summary");
			expect(artifacts.primary.content).toContain(
				"Initiative overview to be documented",
			);
			expect(artifacts.secondary).toHaveLength(4);
		});

		it("should include metadata footer when requested", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-metadata",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result, { includeMetadata: true });

			expect(artifacts.primary.content).toContain(
				"*Executive Summary generated:",
			);
			expect(artifacts.primary.content).toMatch(/\d{4}-\d{2}-\d{2}T/);
		});

		it("should not include metadata footer by default", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-no-metadata",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).not.toContain(
				"*Executive Summary generated:",
			);
		});

		it("should extract goal and status in overview", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-overview",
				phase: "implementation",
				status: "completed",
				context: {},
				config: {
					sessionId: "session-overview",
					context: {},
					goal: "Modernize Legacy Infrastructure",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"Modernize Legacy Infrastructure",
			);
			expect(artifacts.primary.content).toContain(
				"**Current Status:** completed",
			);
			expect(artifacts.primary.content).toContain(
				"**Current Phase:** implementation",
			);
		});

		it("should include phase milestones in board presentation", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-milestones",
				phase: "planning",
				context: {},
				phases: {
					discovery: { duration: "1 month" },
					requirements: { duration: "2 months" },
					implementation: { duration: "6 months" },
					architecture: { duration: "2 months" },
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			const boardPresentation = artifacts.secondary?.[0];
			expect(boardPresentation?.content).toContain("**Phase 1:** discovery");
			expect(boardPresentation?.content).toContain("**Phase 2:** requirements");
			expect(boardPresentation?.content).toContain(
				"**Phase 3:** implementation",
			);
			expect(boardPresentation?.content).toContain("**Phase 4:** architecture");
		});

		it("should include phase breakdown in implementation roadmap", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-roadmap",
				phase: "planning",
				context: {},
				phases: {
					requirements: {
						activities: ["Requirements", "Design"],
						deliverables: ["Spec", "Architecture"],
					},
					implementation: {
						activities: ["Development", "Testing"],
						deliverables: ["MVP", "Test Reports"],
					},
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			const roadmap = artifacts.secondary?.[2];
			expect(roadmap?.content).toContain("## Phase Breakdown");
			expect(roadmap?.content).toContain("### Phase 1: requirements");
			expect(roadmap?.content).toContain("### Phase 2: implementation");
		});

		it("should include proposed architecture from phases", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-architecture",
				phase: "architecture",
				context: {},
				phases: {
					architecture: { components: ["REST API", "GraphQL"] },
					implementation: { components: ["PostgreSQL", "Redis"] },
					specification: { components: ["React", "TypeScript"] },
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			const detailedAnalysis = artifacts.secondary?.[1];
			expect(detailedAnalysis?.content).toContain(
				"### 2.2 Proposed Architecture",
			);
			expect(detailedAnalysis?.content).toContain("**architecture:**");
			expect(detailedAnalysis?.content).toContain("**implementation:**");
			expect(detailedAnalysis?.content).toContain("**specification:**");
		});

		it("should handle empty phases gracefully", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-no-phases",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			const roadmap = artifacts.secondary?.[2];
			expect(roadmap?.content).toContain(
				"Phase breakdown with timelines and deliverables to be defined",
			);
		});

		it("should include strategic alignment in executive summary", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-alignment",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"Improving operational efficiency",
			);
			expect(artifacts.primary.content).toContain("Reducing technical debt");
			expect(artifacts.primary.content).toContain("Enabling scalable growth");
			expect(artifacts.primary.content).toContain(
				"Enhancing competitive positioning",
			);
		});

		it("should include business value proposition", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-value",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("**Expected Benefits:**");
			expect(artifacts.primary.content).toContain(
				"Improved system performance and reliability",
			);
			expect(artifacts.primary.content).toContain("Reduced operational costs");
			expect(artifacts.primary.content).toContain(
				"Enhanced customer experience",
			);
			expect(artifacts.primary.content).toContain("Accelerated time to market");
		});

		it("should include key success factors", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-success",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain(
				"Executive sponsorship and stakeholder alignment",
			);
			expect(artifacts.primary.content).toContain(
				"Adequate resource allocation",
			);
			expect(artifacts.primary.content).toContain(
				"Clear governance and decision-making",
			);
			expect(artifacts.primary.content).toContain(
				"Effective change management",
			);
		});

		it("should include quality gates in roadmap", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-quality",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			const roadmap = artifacts.secondary?.[2];
			expect(roadmap?.content).toContain("## Quality Gates");
			expect(roadmap?.content).toContain("**Design Review:**");
			expect(roadmap?.content).toContain("**Code Review:**");
			expect(roadmap?.content).toContain("**Testing:**");
			expect(roadmap?.content).toContain("**Security Review:**");
			expect(roadmap?.content).toContain("**Performance Testing:**");
		});

		it("should include budget categories", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-budget",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			const budget = artifacts.secondary?.[3];
			expect(budget?.content).toContain("### Infrastructure Costs");
			expect(budget?.content).toContain("### Software Licenses");
			expect(budget?.content).toContain("### Personnel Costs");
			expect(budget?.content).toContain("### Cloud Services");
			expect(budget?.content).toContain("### Maintenance & Support");
			expect(budget?.content).toContain("### Training & Development");
		});

		it("should include contingency in budget", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-contingency",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			const budget = artifacts.secondary?.[3];
			expect(budget?.content).toContain("## Budget Contingency");
			expect(budget?.content).toContain("15-20%");
		});
	});

	describe("render() - error handling", () => {
		it("should throw error for unsupported result type", () => {
			const strategy = new EnterpriseStrategy();
			const invalidResult = {
				someField: "value",
			};

			expect(() => strategy.render(invalidResult as SessionState)).toThrow(
				"Unsupported domain result type for EnterpriseStrategy",
			);
		});

		it("should throw error for null result", () => {
			const strategy = new EnterpriseStrategy();

			expect(() => strategy.render(null as unknown as SessionState)).toThrow(
				"Unsupported domain result type for EnterpriseStrategy",
			);
		});

		it("should throw error for undefined result", () => {
			const strategy = new EnterpriseStrategy();

			expect(() =>
				strategy.render(undefined as unknown as SessionState),
			).toThrow("Unsupported domain result type for EnterpriseStrategy");
		});

		it("should throw error for PromptResult type", () => {
			const strategy = new EnterpriseStrategy();
			const promptResult = {
				sections: [{ title: "Test", body: "Content", level: 1 }],
				metadata: { complexity: 50, tokenEstimate: 100 },
			};

			expect(() =>
				strategy.render(promptResult as unknown as SessionState),
			).toThrow("Unsupported domain result type for EnterpriseStrategy");
		});
	});

	describe("output artifacts structure", () => {
		it("should return OutputArtifacts with primary and secondary documents", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-structure",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary).toBeDefined();
			expect(artifacts.secondary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(4);
			expect(artifacts.crossCutting).toBeUndefined();
		});

		it("should have correct document formats", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-formats",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.format).toBe("markdown");
			expect(artifacts.primary.name).toMatch(/\.md$/);
			expect(typeof artifacts.primary.content).toBe("string");

			for (const doc of artifacts.secondary || []) {
				expect(doc.format).toBe("markdown");
				expect(doc.name).toMatch(/\.md$/);
				expect(typeof doc.content).toBe("string");
			}
		});

		it("should have unique names for all documents", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-names",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);

			const names = [
				artifacts.primary.name,
				...(artifacts.secondary?.map((d) => d.name) || []),
			];

			const uniqueNames = new Set(names);
			expect(uniqueNames.size).toBe(names.length);
		});
	});

	describe("enterprise documentation coverage", () => {
		it("should include all required executive summary sections", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-executive",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const content = artifacts.primary.content;

			expect(content).toContain("## Overview");
			expect(content).toContain("## Strategic Alignment");
			expect(content).toContain("## Business Value Proposition");
			expect(content).toContain("## Investment Required");
			expect(content).toContain("## Risk Profile");
			expect(content).toContain("## Timeline");
			expect(content).toContain("## Recommendation");
			expect(content).toContain("## Key Success Factors");
		});

		it("should include all required board presentation slides", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-board",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const boardPresentation = artifacts.secondary?.[0];

			expect(boardPresentation?.content).toContain(
				"## Slide 1: Initiative Overview",
			);
			expect(boardPresentation?.content).toContain("## Slide 2: Current State");
			expect(boardPresentation?.content).toContain(
				"## Slide 3: Proposed Solution",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 4: Benefits & ROI",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 5: Implementation Approach",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 6: Timeline & Milestones",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 7: Investment & Resources",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 8: Risks & Mitigation",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 9: Competitive Advantage",
			);
			expect(boardPresentation?.content).toContain(
				"## Slide 10: Recommendation",
			);
		});

		it("should include comprehensive risk analysis", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-risks",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const detailedAnalysis = artifacts.secondary?.[1];

			expect(detailedAnalysis?.content).toContain("## 5. Risk Analysis");
			expect(detailedAnalysis?.content).toContain("### 5.1 Technical Risks");
			expect(detailedAnalysis?.content).toContain("### 5.2 Business Risks");
			expect(detailedAnalysis?.content).toContain("### 5.3 Operational Risks");
			expect(detailedAnalysis?.content).toContain(
				"### 5.4 Mitigation Strategies",
			);
		});

		it("should include financial analysis sections", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-financial",
				phase: "planning",
				context: {},
				history: [],
			};

			const artifacts = strategy.render(result);
			const detailedAnalysis = artifacts.secondary?.[1];

			expect(detailedAnalysis?.content).toContain("## 4. Financial Analysis");
			expect(detailedAnalysis?.content).toContain(
				"### 4.1 Cost-Benefit Analysis",
			);
			expect(detailedAnalysis?.content).toContain(
				"### 4.2 Total Cost of Ownership (TCO)",
			);
			expect(detailedAnalysis?.content).toContain(
				"### 4.3 Return on Investment (ROI)",
			);
		});
	});

	describe("data extraction and formatting", () => {
		it("should handle string phase data", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-string-phase",
				phase: "planning",
				context: {},
				phases: {
					Phase1: "Simple description",
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			const roadmap = artifacts.secondary?.[2];
			expect(roadmap?.content).toContain("Simple description");
		});

		it("should handle object phase data", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-object-phase",
				phase: "planning",
				context: {},
				phases: {
					Phase1: { key: "value", data: "test" },
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			const roadmap = artifacts.secondary?.[2];
			expect(roadmap?.content).toContain('"key"');
			expect(roadmap?.content).toContain('"value"');
		});

		it("should format timeline based on phase count", () => {
			const strategy = new EnterpriseStrategy();
			const result: SessionState = {
				id: "session-timeline",
				phase: "planning",
				context: {},
				phases: {
					discovery: {},
					requirements: {},
					planning: {},
				},
				history: [],
			};

			const artifacts = strategy.render(result);

			expect(artifacts.primary.content).toContain("**Duration:** 3 phases");
		});
	});
});
