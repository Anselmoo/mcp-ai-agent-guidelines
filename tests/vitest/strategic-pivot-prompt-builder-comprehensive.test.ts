// Comprehensive Strategic Pivot Prompt Builder Tests - Target 26/27 functions
import { beforeAll, describe, expect, it } from "vitest";
import { strategicPivotPromptBuilder } from "../../dist/tools/design/strategic-pivot-prompt-builder.js";
import type {
	DesignSessionState,
	PivotDecision,
	StrategicPivotPromptRequest,
} from "../../dist/tools/design/types.js";

describe("Strategic Pivot Prompt Builder Comprehensive Testing", () => {
	beforeAll(async () => {
		await strategicPivotPromptBuilder.initialize();
	});

	const createSessionState = (): DesignSessionState => ({
		config: {
			sessionId: "strategic-pivot-test",
			context: "Complex Enterprise Architecture Project",
			goal: "Design scalable microservices architecture with strategic pivoting capabilities",
			requirements: [
				"Microservices architecture",
				"Event-driven communication",
				"High availability and resilience",
				"Security by design",
				"Performance optimization",
			],
			constraints: [
				{
					id: "budget-constraint",
					name: "Budget Limitation",
					type: "non-functional",
					category: "business",
					description: "Project must stay within allocated budget",
					validation: {
						minCoverage: 80,
						keywords: ["budget", "cost", "financial"],
					},
					weight: 0.9,
					mandatory: true,
					source: "Business Requirements",
				},
				{
					id: "timeline-constraint",
					name: "Delivery Timeline",
					type: "non-functional",
					category: "timeline",
					description: "Must deliver within 6 months",
					validation: {
						minCoverage: 85,
						keywords: ["timeline", "schedule", "delivery"],
					},
					weight: 0.8,
					mandatory: true,
					source: "Project Charter",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["microservices-pattern", "event-driven-architecture"],
			outputFormats: ["markdown", "mermaid"],
			metadata: {
				complexity: "high",
				risk: "medium",
				stakeholders: [
					"architecture-team",
					"business-stakeholders",
					"development-teams",
				],
			},
		},
		currentPhase: "design",
		phases: {
			analysis: {
				id: "analysis",
				name: "Requirements Analysis",
				description: "Analyze business and technical requirements",
				inputs: ["stakeholder-interviews"],
				outputs: ["requirements-document"],
				criteria: ["completeness", "clarity"],
				coverage: 90,
				status: "completed",
				artifacts: [],
				dependencies: [],
			},
			design: {
				id: "design",
				name: "System Design",
				description: "Design system architecture and components",
				inputs: ["requirements-document"],
				outputs: ["architecture-document", "component-design"],
				criteria: ["scalability", "maintainability"],
				coverage: 75,
				status: "in-progress",
				artifacts: [],
				dependencies: ["analysis"],
			},
		},
		coverage: {
			overall: 82,
			phases: { analysis: 90, design: 75 },
			constraints: { "budget-constraint": 85, "timeline-constraint": 80 },
			assumptions: { "technology-stability": 85, "team-capacity": 80 },
			documentation: { "architecture-docs": 85, "design-docs": 75 },
			testCoverage: 70,
		},
		artifacts: [
			{
				id: "arch-overview",
				name: "Architecture Overview",
				type: "document",
				format: "markdown",
				content: "High-level system architecture overview",
				metadata: { phase: "design", version: "1.0" },
				tags: ["architecture", "overview"],
			},
		],
		history: [
			{
				timestamp: "2024-01-15T10:00:00Z",
				type: "phase-start",
				phase: "design",
				description: "Started design phase",
			},
		],
		status: "active",
	});

	const createTriggeredPivotDecision = (): PivotDecision => ({
		id: "pivot-001",
		type: "technological",
		reason: "New technology stack offers better performance and scalability",
		severity: "high",
		riskLevel: "medium",
		triggered: true,
		timestamp: "2024-01-20T14:30:00Z",
		phase: "design",
		description:
			"Pivot from monolithic to microservices architecture due to scalability requirements",
		impact: {
			scope: "architecture",
			effort: "high",
			timeline: 4,
			cost: "medium",
			risk: "medium",
			benefits: [
				"improved scalability",
				"better maintainability",
				"technology alignment",
			],
			drawbacks: ["increased complexity", "longer development time"],
		},
		alternatives: [
			{
				id: "alt-1",
				name: "Continue with monolithic approach",
				pros: ["faster initial development", "simpler deployment"],
				cons: ["scalability limitations", "technology constraints"],
				feasibility: 40,
			},
			{
				id: "alt-2",
				name: "Hybrid approach with modular monolith",
				pros: ["easier migration path", "reduced complexity"],
				cons: ["limited scalability", "partial benefits"],
				feasibility: 70,
			},
		],
		stakeholderConsensus: 85,
		implementationPlan: [
			"Conduct architecture spike",
			"Design microservices boundaries",
			"Plan data decomposition strategy",
			"Develop migration roadmap",
		],
		monitoringCriteria: [
			"Team adaptation to new technology",
			"Development velocity impact",
			"System performance metrics",
		],
		rollbackPlan:
			"Revert to modular monolith if microservices prove too complex",
	});

	const createNonTriggeredPivotDecision = (): PivotDecision => ({
		id: "pivot-002",
		type: "strategic",
		reason: "Monitoring strategic alignment with business goals",
		severity: "low",
		riskLevel: "low",
		triggered: false,
		timestamp: "2024-01-20T14:30:00Z",
		phase: "design",
		description: "Continuous monitoring of design decisions alignment",
		impact: {
			scope: "monitoring",
			effort: "low",
			timeline: 0,
			cost: "low",
			risk: "low",
			benefits: ["early detection of misalignment"],
			drawbacks: ["monitoring overhead"],
		},
		alternatives: [],
		stakeholderConsensus: 95,
		implementationPlan: [],
		monitoringCriteria: [
			"Alignment with business objectives",
			"Technical feasibility indicators",
			"Team confidence levels",
		],
		rollbackPlan: "No action required",
	});

	describe("Primary API - generateStrategicPivotPrompt", () => {
		it("should generate comprehensive prompt for triggered pivot", async () => {
			const sessionState = createSessionState();
			const pivotDecision = createTriggeredPivotDecision();

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision,
				context:
					"Critical architectural decision point requiring strategic pivot",
				includeTemplates: true,
				includeSpace7Instructions: true,
				outputFormat: "markdown",
				customInstructions: ["Focus on scalability", "Consider team expertise"],
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.prompt).toBeDefined();
			expect(typeof result.prompt).toBe("string");
			expect(result.prompt.length).toBeGreaterThan(100);
			expect(result.metadata).toBeDefined();
			expect(result.metadata.pivotReason).toBeDefined();
			expect(result.metadata.complexityScore).toBeDefined();
			expect(result.metadata.entropyLevel).toBeDefined();
			expect(result.metadata.templatesIncluded).toBeDefined();
			expect(result.metadata.space7Integration).toBe(true);
			expect(result.metadata.recommendedActions).toBeDefined();
			expect(result.metadata.estimatedImpact).toBeDefined();
		});

		it("should generate monitoring prompt for non-triggered pivot", async () => {
			const sessionState = createSessionState();
			const pivotDecision = createNonTriggeredPivotDecision();

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision,
				context: "Routine monitoring check",
				includeTemplates: false,
				includeSpace7Instructions: false,
				outputFormat: "markdown",
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.prompt).toBeDefined();
			expect(result.metadata.templatesIncluded).toHaveLength(0);
			expect(result.metadata.space7Integration).toBe(false);
		});

		it("should handle different output formats", async () => {
			const sessionState = createSessionState();
			const pivotDecision = createTriggeredPivotDecision();
			const formats: Array<
				"markdown" | "mermaid" | "yaml" | "json" | "typescript" | "javascript"
			> = ["markdown", "mermaid", "yaml", "json", "typescript", "javascript"];

			for (const format of formats) {
				const request: StrategicPivotPromptRequest = {
					sessionState,
					pivotDecision,
					outputFormat: format,
				};

				const result =
					await strategicPivotPromptBuilder.generateStrategicPivotPrompt(
						request,
					);

				expect(result).toBeDefined();
				expect(result.success).toBe(true);
				expect(result.prompt).toBeDefined();
			}
		});

		it("should handle different pivot types", async () => {
			const sessionState = createSessionState();
			const pivotTypes: Array<
				"strategic" | "technological" | "market" | "resource"
			> = ["strategic", "technological", "market", "resource"];

			for (const type of pivotTypes) {
				const pivotDecision: PivotDecision = {
					...createTriggeredPivotDecision(),
					type,
					reason: `${type} pivot due to changing requirements`,
				};

				const request: StrategicPivotPromptRequest = {
					sessionState,
					pivotDecision,
				};

				const result =
					await strategicPivotPromptBuilder.generateStrategicPivotPrompt(
						request,
					);

				expect(result).toBeDefined();
				expect(result.success).toBe(true);
				expect(result.prompt).toBeDefined();
			}
		});

		it("should handle different risk levels", async () => {
			const sessionState = createSessionState();
			const riskLevels: Array<"low" | "medium" | "high" | "critical"> = [
				"low",
				"medium",
				"high",
				"critical",
			];

			for (const riskLevel of riskLevels) {
				const pivotDecision: PivotDecision = {
					...createTriggeredPivotDecision(),
					riskLevel,
					severity: riskLevel === "critical" ? "high" : riskLevel,
				};

				const request: StrategicPivotPromptRequest = {
					sessionState,
					pivotDecision,
				};

				const result =
					await strategicPivotPromptBuilder.generateStrategicPivotPrompt(
						request,
					);

				expect(result).toBeDefined();
				expect(result.success).toBe(true);
				expect(result.metadata.estimatedImpact).toBeDefined();
			}
		});
	});

	describe("Complex Pivot Scenarios", () => {
		it("should handle high-complexity architectural pivot", async () => {
			const sessionState = createSessionState();
			const complexPivot: PivotDecision = {
				id: "complex-pivot-001",
				type: "technological",
				reason:
					"Major architectural shift required due to performance and scalability concerns",
				severity: "high",
				riskLevel: "high",
				triggered: true,
				timestamp: "2024-01-20T15:00:00Z",
				phase: "design",
				description:
					"Complete rearchitecture from monolithic to event-driven microservices with CQRS pattern",
				impact: {
					scope: "architecture",
					effort: "high",
					timeline: 8,
					cost: "high",
					risk: "high",
					benefits: [
						"Horizontal scalability",
						"Event-driven responsiveness",
						"Domain separation",
						"Technology diversity",
						"Independent deployments",
					],
					drawbacks: [
						"Increased system complexity",
						"Distributed system challenges",
						"Team learning curve",
						"Operational overhead",
						"Data consistency complexity",
					],
				},
				alternatives: [
					{
						id: "alt-scale-up",
						name: "Vertical scaling of monolith",
						pros: ["Quick implementation", "Low complexity"],
						cons: ["Limited scalability", "Single point of failure"],
						feasibility: 30,
					},
					{
						id: "alt-modular-monolith",
						name: "Modular monolith with service boundaries",
						pros: ["Easier migration", "Lower complexity"],
						cons: ["Shared database", "Limited isolation"],
						feasibility: 60,
					},
					{
						id: "alt-hybrid",
						name: "Hybrid approach with selective microservices",
						pros: ["Gradual migration", "Risk mitigation"],
						cons: ["Complex integration", "Partial benefits"],
						feasibility: 75,
					},
				],
				stakeholderConsensus: 70,
				implementationPlan: [
					"Domain modeling and bounded context identification",
					"Event storming workshops",
					"Microservices boundary design",
					"Data decomposition strategy",
					"API contract design",
					"Infrastructure setup (service mesh, monitoring)",
					"Migration roadmap with strangler fig pattern",
					"Team training and onboarding",
				],
				monitoringCriteria: [
					"System performance metrics",
					"Development velocity",
					"Error rates and reliability",
					"Team productivity",
					"Stakeholder satisfaction",
					"Technical debt levels",
				],
				rollbackPlan:
					"Implement hybrid approach with core services as microservices and less critical components remaining monolithic",
			};

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision: complexPivot,
				context: "Critical decision point for system architecture",
				includeTemplates: true,
				includeSpace7Instructions: true,
				outputFormat: "markdown",
				customInstructions: [
					"Emphasize risk mitigation strategies",
					"Include team readiness assessment",
					"Focus on incremental implementation",
				],
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.prompt).toBeDefined();
			expect(result.prompt.length).toBeGreaterThan(500);
			expect(result.metadata.complexityScore).toBeGreaterThan(0.7);
			expect(result.metadata.entropyLevel).toBeGreaterThan(0.6);
			expect(result.metadata.recommendedActions.length).toBeGreaterThan(3);
		});

		it("should handle resource-driven pivot", async () => {
			const sessionState = createSessionState();
			const resourcePivot: PivotDecision = {
				id: "resource-pivot-001",
				type: "resource",
				reason:
					"Key technical lead departure requires technology stack simplification",
				severity: "medium",
				riskLevel: "medium",
				triggered: true,
				timestamp: "2024-01-20T16:00:00Z",
				phase: "design",
				description: "Simplify technology stack due to reduced team expertise",
				impact: {
					scope: "technology",
					effort: "medium",
					timeline: 3,
					cost: "medium",
					risk: "medium",
					benefits: [
						"Reduced complexity",
						"Faster onboarding",
						"Lower maintenance",
					],
					drawbacks: ["Reduced capabilities", "Technology debt"],
				},
				alternatives: [
					{
						id: "hire-replacement",
						name: "Hire senior replacement",
						pros: ["Maintain current direction", "No rework"],
						cons: ["Time to hire", "Knowledge transfer"],
						feasibility: 50,
					},
				],
				stakeholderConsensus: 80,
				implementationPlan: [
					"Assess current team capabilities",
					"Identify technology simplification opportunities",
					"Plan knowledge transfer sessions",
					"Update architecture to use familiar technologies",
				],
				monitoringCriteria: [
					"Team confidence levels",
					"Development velocity",
					"Code quality metrics",
				],
				rollbackPlan: "Bring in consultant for complex components",
			};

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision: resourcePivot,
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.prompt).toBeDefined();
		});

		it("should handle market-driven pivot", async () => {
			const sessionState = createSessionState();
			const marketPivot: PivotDecision = {
				id: "market-pivot-001",
				type: "market",
				reason: "Competitor launched similar product, need to differentiate",
				severity: "high",
				riskLevel: "medium",
				triggered: true,
				timestamp: "2024-01-20T17:00:00Z",
				phase: "design",
				description:
					"Pivot to focus on AI/ML capabilities for competitive advantage",
				impact: {
					scope: "product",
					effort: "high",
					timeline: 6,
					cost: "high",
					risk: "medium",
					benefits: ["Market differentiation", "Innovation leadership"],
					drawbacks: ["Increased complexity", "New skill requirements"],
				},
				alternatives: [],
				stakeholderConsensus: 85,
				implementationPlan: [
					"Market analysis and competitive positioning",
					"AI/ML capability assessment",
					"Technology stack evaluation",
					"Team skill development plan",
				],
				monitoringCriteria: [
					"Market response",
					"Technical feasibility",
					"Development progress",
				],
				rollbackPlan: "Focus on core product features without AI/ML",
			};

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision: marketPivot,
				outputFormat: "mermaid",
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.prompt).toBeDefined();
		});
	});

	describe("Edge Cases and Error Handling", () => {
		it("should handle minimal pivot decision", async () => {
			const sessionState = createSessionState();
			const minimalPivot: PivotDecision = {
				id: "minimal-pivot",
				type: "strategic",
				reason: "Minor adjustment",
				severity: "low",
				riskLevel: "low",
				triggered: false,
				timestamp: "2024-01-20T18:00:00Z",
				phase: "design",
				description: "Minor strategic adjustment",
				impact: {
					scope: "process",
					effort: "low",
					timeline: 1,
					cost: "low",
					risk: "low",
					benefits: ["Process improvement"],
					drawbacks: [],
				},
				alternatives: [],
				stakeholderConsensus: 100,
				implementationPlan: [],
				monitoringCriteria: [],
				rollbackPlan: "No rollback needed",
			};

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision: minimalPivot,
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.prompt).toBeDefined();
		});

		it("should handle empty custom instructions", async () => {
			const sessionState = createSessionState();
			const pivotDecision = createTriggeredPivotDecision();

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision,
				customInstructions: [],
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
		});

		it("should handle session state with minimal phases", async () => {
			const minimalSession: DesignSessionState = {
				...createSessionState(),
				phases: {
					design: {
						id: "design",
						name: "Design",
						description: "Basic design",
						inputs: [],
						outputs: [],
						criteria: [],
						coverage: 50,
						status: "in-progress",
						artifacts: [],
						dependencies: [],
					},
				},
			};

			const request: StrategicPivotPromptRequest = {
				sessionState: minimalSession,
				pivotDecision: createTriggeredPivotDecision(),
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
		});

		it("should handle various severity and risk combinations", async () => {
			const sessionState = createSessionState();
			const combinations = [
				{ severity: "low", riskLevel: "low" },
				{ severity: "medium", riskLevel: "medium" },
				{ severity: "high", riskLevel: "high" },
				{ severity: "high", riskLevel: "low" },
				{ severity: "low", riskLevel: "high" },
			] as const;

			for (const { severity, riskLevel } of combinations) {
				const pivotDecision: PivotDecision = {
					...createTriggeredPivotDecision(),
					severity,
					riskLevel,
				};

				const request: StrategicPivotPromptRequest = {
					sessionState,
					pivotDecision,
				};

				const result =
					await strategicPivotPromptBuilder.generateStrategicPivotPrompt(
						request,
					);

				expect(result).toBeDefined();
				expect(result.success).toBe(true);
				expect(result.prompt).toBeDefined();
			}
		});
	});

	describe("Advanced Features", () => {
		it("should generate appropriate templates for different pivot types", async () => {
			const sessionState = createSessionState();
			const pivotTypes: Array<
				"strategic" | "technological" | "market" | "resource"
			> = ["strategic", "technological", "market", "resource"];

			for (const type of pivotTypes) {
				const pivotDecision: PivotDecision = {
					...createTriggeredPivotDecision(),
					type,
				};

				const request: StrategicPivotPromptRequest = {
					sessionState,
					pivotDecision,
					includeTemplates: true,
				};

				const result =
					await strategicPivotPromptBuilder.generateStrategicPivotPrompt(
						request,
					);

				expect(result).toBeDefined();
				expect(result.metadata.templatesIncluded).toBeDefined();
				expect(Array.isArray(result.metadata.templatesIncluded)).toBe(true);
			}
		});

		it("should calculate complexity and entropy scores", async () => {
			const sessionState = createSessionState();
			const pivotDecision = createTriggeredPivotDecision();

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision,
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.metadata.complexityScore).toBeGreaterThanOrEqual(0);
			expect(result.metadata.complexityScore).toBeLessThanOrEqual(1);
			expect(result.metadata.entropyLevel).toBeGreaterThanOrEqual(0);
			expect(result.metadata.entropyLevel).toBeLessThanOrEqual(1);
		});

		it("should provide relevant recommended actions", async () => {
			const sessionState = createSessionState();
			const pivotDecision = createTriggeredPivotDecision();

			const request: StrategicPivotPromptRequest = {
				sessionState,
				pivotDecision,
			};

			const result =
				await strategicPivotPromptBuilder.generateStrategicPivotPrompt(request);

			expect(result).toBeDefined();
			expect(result.metadata.recommendedActions).toBeDefined();
			expect(Array.isArray(result.metadata.recommendedActions)).toBe(true);
			expect(result.metadata.recommendedActions.length).toBeGreaterThan(0);
		});
	});
});
