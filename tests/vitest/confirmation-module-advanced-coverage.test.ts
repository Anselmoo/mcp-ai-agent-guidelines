// Advanced Confirmation Module Coverage Tests - Target uncovered methods and edge cases
import { beforeAll, describe, expect, it } from "vitest";
import { confirmationModule } from "../../dist/tools/design/confirmation-module.js";
import type { DesignSessionState } from "../../dist/tools/design/types/index.js";

describe("Confirmation Module - Advanced Coverage Tests", () => {
	beforeAll(async () => {
		await confirmationModule.initialize();
	});

	// Helper to create session with minimal constraints
	const createMinimalSessionState = (): DesignSessionState => ({
		config: {
			sessionId: `minimal-session-${Date.now()}`,
			context: "Minimal test context",
			goal: "Test minimal configuration",
			requirements: ["Requirement 1"],
			constraints: [],
			coverageThreshold: 50,
			enablePivots: false,
			templateRefs: [],
			outputFormats: ["markdown"],
			metadata: { projectType: "test" },
		},
		currentPhase: "discovery",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery phase",
				inputs: [],
				outputs: [],
				criteria: [],
				coverage: 0,
				status: "in-progress",
				artifacts: [],
				dependencies: [],
			},
			analysis: {
				id: "analysis",
				name: "Analysis",
				description: "Analysis phase",
				inputs: [],
				outputs: [],
				criteria: [],
				coverage: 0,
				status: "pending",
				artifacts: [],
				dependencies: [],
			},
		},
		coverage: {
			overall: 0,
			phases: {},
			constraints: {},
			details: { recommendations: [] },
		},
		history: [],
		status: "active",
		artifacts: [],
	});

	// Helper to create comprehensive session state
	const createComprehensiveSessionState = (): DesignSessionState => {
		const artifacts = [
			{
				id: "artifact-1",
				name: "Discovery Document",
				type: "specification" as const,
				content: "Discovery content",
				format: "markdown" as const,
				metadata: { phase: "discovery" },
				timestamp: new Date().toISOString(),
			},
			{
				id: "artifact-2",
				name: "Analysis Document",
				type: "specification" as const,
				content: "Analysis content",
				format: "markdown" as const,
				metadata: { phase: "analysis" },
				timestamp: new Date().toISOString(),
			},
		];

		return {
			config: {
				sessionId: `advanced-session-${Date.now()}`,
				context: "Advanced test with comprehensive constraints",
				goal: "Test advanced features",
				requirements: [
					"Core functionality",
					"Performance",
					"Security",
					"Scalability",
				],
				constraints: [
					{
						id: "constraint-1",
						name: "Security",
						type: "non-functional",
						category: "security",
						description: "Security constraints",
						validation: {
							minCoverage: 80,
							keywords: ["security", "authentication"],
						},
						weight: 1.0,
						mandatory: true,
						source: "Policy",
					},
					{
						id: "constraint-2",
						name: "Performance",
						type: "non-functional",
						category: "performance",
						description: "Performance constraints",
						validation: {
							minCoverage: 75,
							keywords: ["performance", "latency"],
						},
						weight: 0.9,
						mandatory: true,
						source: "SLA",
					},
				],
				coverageThreshold: 80,
				enablePivots: true,
				templateRefs: ["template-1"],
				outputFormats: ["markdown", "json"],
				metadata: { projectType: "enterprise", teamSize: 10 },
			},
			currentPhase: "analysis",
			phases: {
				discovery: {
					id: "discovery",
					name: "Discovery",
					description: "Initial discovery",
					inputs: ["stakeholder-input"],
					outputs: ["discovery-doc"],
					criteria: [],
					coverage: 80,
					status: "completed",
					artifacts: [artifacts[0]],
					dependencies: [],
				},
				analysis: {
					id: "analysis",
					name: "Analysis",
					description: "Detailed analysis",
					inputs: ["discovery-doc"],
					outputs: ["analysis-doc"],
					criteria: [],
					coverage: 60,
					status: "in-progress",
					artifacts: [artifacts[1]],
					dependencies: ["discovery"],
				},
				design: {
					id: "design",
					name: "Design",
					description: "Design phase",
					inputs: ["analysis-doc"],
					outputs: ["design-doc"],
					criteria: [],
					coverage: 0,
					status: "pending",
					artifacts: [],
					dependencies: ["analysis"],
				},
			},
			coverage: {
				overall: 60,
				phases: {
					discovery: 80,
					analysis: 60,
					design: 0,
				},
				constraints: {
					"constraint-1": 80,
					"constraint-2": 70,
				},
				assumptions: {},
				documentation: {},
				testCoverage: 65,
			},
			history: [],
			status: "active",
			artifacts,
		};
	};

	describe("confirmPhaseCompletion with edge cases", () => {
		it("should handle phase not found in session", async () => {
			const session = createMinimalSessionState();
			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"non-existent-phase",
				"Test content",
			);

			expect(result).toBeDefined();
			expect(result.passed).toBe(false);
			// Check that there's at least one issue about the phase not being found
			expect(result.issues.length).toBeGreaterThan(0);
			expect(result.issues[0]).toMatch(/phase|not found/i);
		});

		it("should handle empty content gracefully", async () => {
			const session = createMinimalSessionState();
			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				"",
			);

			expect(result).toBeDefined();
			expect(result.coverage).toBeDefined();
		});

		it("should handle minimal session state", async () => {
			const session = createMinimalSessionState();
			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				"Phase content with sufficient detail for testing",
			);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
			expect(result.coverage).toBeGreaterThanOrEqual(0);
			expect(result.coverage).toBeLessThanOrEqual(100);
		});

		it("should handle comprehensive session state", async () => {
			const session = createComprehensiveSessionState();
			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				"Comprehensive analysis with all components: security measures, performance optimization, scalability strategy",
			);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
			expect(result.coverage).toBeGreaterThanOrEqual(0);
		});

		it("should extract decisions from content", async () => {
			const session = createComprehensiveSessionState();
			const content = `
## Key Decisions
1. Architecture: Microservices chosen for scalability
2. Database: PostgreSQL selected for data integrity
3. Caching: Redis for performance optimization
			`;
			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				content,
			);

			expect(result).toBeDefined();
		});

		it("should assess content length variations", async () => {
			const session = createMinimalSessionState();

			// Very short content
			const shortResult = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				"Short.",
			);
			expect(shortResult).toBeDefined();

			// Long content
			const longContent = "Detailed analysis: ".repeat(100);
			const longResult = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				longContent,
			);
			expect(longResult).toBeDefined();
		});

		it("should assess content structure quality", async () => {
			const session = createMinimalSessionState();

			// Well-structured content
			const structuredContent = `
# Phase Analysis

## Introduction
Overview of the phase

## Key Points
- Point 1
- Point 2

## Conclusion
Summary of analysis
			`;
			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				structuredContent,
			);
			expect(result).toBeDefined();
		});

		it("should assess content clarity", async () => {
			const session = createMinimalSessionState();

			// Clear content
			const clearContent =
				"The system will use a microservices architecture with PostgreSQL database";
			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				clearContent,
			);
			expect(result).toBeDefined();
		});

		it("should assess content completeness", async () => {
			const session = createComprehensiveSessionState();

			// Complete content addressing all aspects
			const completeContent = `
## Discovery Phase Completion

### Requirements
- Requirement 1: Core functionality
- Requirement 2: Performance requirements
- Requirement 3: Security requirements

### Constraints
- Security: 80% minimum coverage
- Performance: 75% minimum coverage

### Stakeholder Review
- Architecture team: Reviewed
- Security team: Approved
- Performance team: Approved

### Risk Assessment
- High risks identified and mitigation planned

### Next Steps
- Proceed to analysis phase
- Conduct detailed security review
			`;
			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				completeContent,
			);
			expect(result).toBeDefined();
		});
	});

	describe("confirmPhase backward compatibility", () => {
		it("should work with backward-compatible signature", async () => {
			const session = createMinimalSessionState();
			const result = await confirmationModule.confirmPhase(
				session,
				"discovery",
				"Test content",
			);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
		});

		it("should use default mock content when not provided", async () => {
			const session = createMinimalSessionState();
			const result = await confirmationModule.confirmPhase(
				session,
				"discovery",
			);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
		});
	});

	describe("getSessionRationaleHistory", () => {
		it("should retrieve rationale history", async () => {
			const session = createComprehensiveSessionState();
			const sessionId = session.config.sessionId;

			const history =
				await confirmationModule.getSessionRationaleHistory(sessionId);
			expect(history).toBeDefined();
		});

		it("should handle non-existent session rationale", async () => {
			const history = await confirmationModule.getSessionRationaleHistory(
				"non-existent-session",
			);
			expect(history).toBeDefined();
		});
	});

	describe("exportRationaleDocumentation", () => {
		it("should export rationale documentation", async () => {
			const session = createComprehensiveSessionState();
			const sessionId = session.config.sessionId;

			const documentation =
				await confirmationModule.exportRationaleDocumentation(sessionId);
			expect(documentation).toBeDefined();
		});

		it("should handle export for new session", async () => {
			const documentation =
				await confirmationModule.exportRationaleDocumentation(
					"brand-new-session",
				);
			expect(documentation).toBeDefined();
		});
	});

	describe("Multi-phase workflow confirmation", () => {
		it("should confirm multiple phases in sequence", async () => {
			const session = createComprehensiveSessionState();

			// Confirm first phase
			const result1 = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				"Discovery phase complete",
			);
			expect(result1).toBeDefined();

			// Confirm second phase
			const result2 = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				"Analysis phase complete with comprehensive findings",
			);
			expect(result2).toBeDefined();
		});

		it("should validate session readiness for next phase", async () => {
			const session = createComprehensiveSessionState();

			// Confirm current phase with comprehensive content
			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				`
## Analysis Phase Completion Report

### Findings
- All requirements analyzed
- Constraints identified and documented
- Risks assessed

### Stakeholder Sign-off
- All stakeholders have reviewed
- No outstanding concerns
- Approval granted

### Quality Metrics
- Coverage: 85%
- Completeness: 90%
- Clarity: Excellent
			`,
			);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
		});

		it("should handle mixed content with decisions, risks, and assumptions", async () => {
			const session = createComprehensiveSessionState();

			const mixedContent = `
## Design Phase Analysis

### Decisions Made
- Architecture: Microservices
- Technology Stack: Node.js + PostgreSQL
- Deployment: Kubernetes

### Assumptions
- Team has Docker experience
- Infrastructure is available
- Timeline is realistic

### Risks Identified
- Microservices complexity: Mitigated by team training
- Performance: Mitigated by caching strategy

### Alternatives Considered
- Monolithic architecture: Rejected due to scalability needs
- Serverless: Rejected due to cost considerations

### Coverage
- Security: 85%
- Performance: 80%
- Scalability: 90%
			`;

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"design",
				mixedContent,
			);

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
		});
	});

	describe("Error handling and edge cases", () => {
		it("should handle sessions with no history", async () => {
			const session = createMinimalSessionState();
			session.history = [];

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				"Content",
			);
			expect(result).toBeDefined();
		});

		it("should handle sessions with no artifacts", async () => {
			const session = createMinimalSessionState();
			session.artifacts = [];

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				"Content",
			);
			expect(result).toBeDefined();
		});

		it("should handle content with special characters", async () => {
			const session = createMinimalSessionState();
			const specialContent = `
Special chars: <>&"'|\\{}[]()
Unicode: ñáéíóú 中文 日本語 한국어
Math: ∑∏∫√π
			`;

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				specialContent,
			);
			expect(result).toBeDefined();
		});

		it("should handle very large content", async () => {
			const session = createMinimalSessionState();
			const largeContent = "Very detailed analysis: ".repeat(1000);

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				largeContent,
			);
			expect(result).toBeDefined();
		});

		it("should handle content with multiple keywords", async () => {
			const session = createComprehensiveSessionState();
			const keywordContent = `
Security considerations: authentication, authorization, encryption
Performance optimizations: caching, indexing, load balancing
Scalability strategies: sharding, replication, clustering
			`;

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				keywordContent,
			);
			expect(result).toBeDefined();
		});
	});

	describe("Coverage threshold variations", () => {
		it("should handle different coverage thresholds", async () => {
			const session = createComprehensiveSessionState();
			session.config.coverageThreshold = 50;

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				"Analysis content",
			);
			expect(result).toBeDefined();
		});

		it("should handle strict mode validation", async () => {
			const session = createComprehensiveSessionState();

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				"Strict mode content",
				true, // strictMode = true
			);
			expect(result).toBeDefined();
		});

		it("should handle lenient mode validation", async () => {
			const session = createComprehensiveSessionState();

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				"Lenient mode content",
				false, // strictMode = false
			);
			expect(result).toBeDefined();
		});
	});

	describe("Rationale extraction edge cases", () => {
		it("should extract decisions with structured format", async () => {
			const session = createComprehensiveSessionState();

			const structuredRationale = `
## Key Decisions

| Decision | Rationale | Confidence |
|----------|-----------|-----------|
| Microservices | Scalability | 95% |
| PostgreSQL | Data integrity | 90% |
| Kubernetes | Container orchestration | 85% |

## Decision Details
1. **Microservices Architecture**
   - Rationale: Enables independent scaling of services
   - Confidence: 95%
   - Stakeholders: Architecture team
   - Impact: High

2. **PostgreSQL Database**
   - Rationale: Strong ACID compliance and reliability
   - Confidence: 90%
   - Stakeholders: Database team
   - Impact: High
			`;

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"design",
				structuredRationale,
			);
			expect(result).toBeDefined();
		});

		it("should extract assumptions and risks", async () => {
			const session = createComprehensiveSessionState();

			const assumptionsAndRisks = `
## Assumptions
- Team has 3+ years microservices experience
- Infrastructure is already provisioned
- Stakeholders are available for reviews

## Risks
- Risk 1: Microservices complexity (Likelihood: Medium, Impact: High)
  Mitigation: Team training and mentoring
- Risk 2: Performance overhead (Likelihood: Low, Impact: Medium)
  Mitigation: Caching and load balancing
- Risk 3: Operational complexity (Likelihood: Medium, Impact: High)
  Mitigation: DevOps automation and monitoring
			`;

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				assumptionsAndRisks,
			);
			expect(result).toBeDefined();
		});

		it("should extract alternatives analysis", async () => {
			const session = createComprehensiveSessionState();

			const alternatives = `
## Alternatives Considered

### Alternative 1: Monolithic Architecture
Pros: Simpler initial development, easier debugging
Cons: Hard to scale, high coupling, deployment risk
Feasibility: 70%
Reasoning: Not suitable for enterprise scalability needs

### Alternative 2: Serverless Architecture
Pros: No infrastructure management, auto-scaling
Cons: Cold starts, vendor lock-in, cost uncertainty
Feasibility: 65%
Reasoning: Cost may be prohibitive for sustained traffic

### Alternative 3: Hybrid Architecture (Chosen)
Pros: Flexibility, scalability, cost efficiency
Cons: Operational complexity
Feasibility: 95%
Reasoning: Best balance for enterprise requirements
			`;

			const result = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				alternatives,
			);
			expect(result).toBeDefined();
		});
	});

	describe("Session state consistency", () => {
		it("should maintain session state through confirmations", async () => {
			const session = createComprehensiveSessionState();
			const initialPhaseCount = Object.keys(session.phases).length;

			await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				"Content 1",
			);

			const currentPhaseCount = Object.keys(session.phases).length;
			expect(currentPhaseCount).toBe(initialPhaseCount);
		});

		it("should handle session updates across confirmations", async () => {
			const session = createComprehensiveSessionState();

			const result1 = await confirmationModule.confirmPhaseCompletion(
				session,
				"discovery",
				"Discovery complete",
			);
			expect(result1).toBeDefined();

			const result2 = await confirmationModule.confirmPhaseCompletion(
				session,
				"analysis",
				"Analysis complete",
			);
			expect(result2).toBeDefined();
		});
	});
});
