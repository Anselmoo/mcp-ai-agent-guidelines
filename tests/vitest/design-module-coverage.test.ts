// Design Module Function Coverage Enhancement Tests
import { beforeAll, describe, expect, it } from "vitest";
import { adrGenerator } from "../../dist/tools/design/adr-generator.js";
import { constraintManager } from "../../dist/tools/design/constraint-manager.js";
import { coverageEnforcer } from "../../dist/tools/design/coverage-enforcer.js";
import { designPhaseWorkflow } from "../../dist/tools/design/design-phase-workflow.js";
import { methodologySelector } from "../../dist/tools/design/methodology-selector.js";
import { pivotModule } from "../../dist/tools/design/pivot-module.js";
import { roadmapGenerator } from "../../dist/tools/design/roadmap-generator.js";
import { specGenerator } from "../../dist/tools/design/spec-generator.js";
import { strategicPivotPromptBuilder } from "../../dist/tools/design/strategic-pivot-prompt-builder.js";

describe("Design Module Function Coverage Enhancement", () => {
	beforeAll(async () => {
		// Initialize all design modules
		await constraintManager.loadConstraintsFromConfig({
			meta: {
				version: "1.0.0",
				updated: "2024-01-10",
				source: "Function Coverage Test",
				coverage_threshold: 85,
			},
			phases: {
				discovery: {
					name: "Discovery",
					description: "Discovery phase",
					min_coverage: 80,
					required_outputs: ["context"],
					criteria: ["Clear objectives"],
				},
				requirements: {
					name: "Requirements",
					description: "Requirements phase",
					min_coverage: 85,
					required_outputs: ["requirements"],
					criteria: ["Testable requirements"],
				},
				architecture: {
					name: "Architecture",
					description: "Architecture phase",
					min_coverage: 90,
					required_outputs: ["architecture"],
					criteria: ["Scalable design"],
				},
				implementation: {
					name: "Implementation",
					description: "Implementation phase",
					min_coverage: 85,
					required_outputs: ["code"],
					criteria: ["Clean code"],
				},
			},
			constraints: {
				architectural: {
					modularity: {
						name: "Modular Design",
						description: "System must follow modular architecture",
						keywords: ["modular", "component"],
						weight: 15,
						mandatory: true,
						validation: { min_coverage: 85, keywords: ["module", "component"] },
						source: "Architecture Guidelines",
					},
					scalability: {
						name: "Scalable Architecture",
						description: "System must support horizontal scaling",
						keywords: ["scalable", "horizontal"],
						weight: 20,
						mandatory: true,
						validation: { min_coverage: 80, keywords: ["scale", "horizontal"] },
						source: "Performance Guidelines",
					},
				},
				technical: {
					testing: {
						name: "Test Coverage",
						description: "Code must have comprehensive test coverage",
						keywords: ["test", "coverage"],
						weight: 25,
						mandatory: true,
						validation: { min_coverage: 90, keywords: ["test", "spec"] },
						source: "Quality Guidelines",
					},
				},
			},
			coverage_rules: {
				overall_minimum: 85,
				phase_minimum: 80,
				constraint_minimum: 75,
				documentation_minimum: 70,
				test_minimum: 90,
			},
		});
	});

	describe("ADR Generator Coverage", () => {
		it("should generate ADR with minimal input", async () => {
			const result = await adrGenerator.generateADR({
				title: "Test ADR",
				context: "Testing ADR generation",
				decision: "Use automated ADR generation",
				consequences: ["Improved documentation"],
			});

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.adrContent).toBeDefined();
			expect(result.adrContent).toContain("Test ADR");
		});

		it("should generate ADR with full options", async () => {
			const result = await adrGenerator.generateADR({
				title: "Complex ADR Decision",
				context: "Complex architectural decision requiring full documentation",
				decision: "Implement microservices architecture",
				consequences: ["Improved scalability", "Increased complexity"],
				alternatives: ["Monolithic architecture", "Modular monolith"],
				status: "accepted",
				metadata: {
					author: "Test Author",
					reviewers: ["Reviewer 1", "Reviewer 2"],
					date: new Date().toISOString(),
				},
				rationale: "Detailed rationale for the decision",
				implementation: "Implementation steps and considerations",
			});

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.adrContent).toContain("Complex ADR Decision");
			expect(result.adrContent).toContain("microservices architecture");
		});

		it("should handle ADR generation errors", async () => {
			try {
				await adrGenerator.generateADR({
					title: "",
					context: "",
					decision: "",
					consequences: [],
				});
			} catch (error) {
				expect(error).toBeDefined();
			}
		});
	});

	describe("Constraint Manager Extended Coverage", () => {
		it("should get constraints by category", () => {
			const architecturalConstraints =
				constraintManager.getConstraints("architectural");
			expect(architecturalConstraints).toBeInstanceOf(Array);
			expect(architecturalConstraints.length).toBeGreaterThan(0);

			const technicalConstraints =
				constraintManager.getConstraints("technical");
			expect(technicalConstraints).toBeInstanceOf(Array);
		});

		it("should get specific constraint by ID", () => {
			const constraint = constraintManager.getConstraint(
				"architectural.modularity",
			);
			expect(constraint).toBeDefined();
			expect(constraint?.name).toBe("Modular Design");
		});

		it("should get mandatory constraints", () => {
			const mandatoryConstraints = constraintManager.getMandatoryConstraints();
			expect(mandatoryConstraints).toBeInstanceOf(Array);
			expect(mandatoryConstraints.length).toBeGreaterThan(0);
			expect(mandatoryConstraints.every((c) => c.mandatory)).toBe(true);
		});

		it("should get phase requirements", () => {
			const discoveryReqs = constraintManager.getPhaseRequirements("discovery");
			expect(discoveryReqs).toBeDefined();
			expect(discoveryReqs?.name).toBe("Discovery");

			const nonExistentReqs =
				constraintManager.getPhaseRequirements("nonexistent");
			expect(nonExistentReqs).toBeUndefined();
		});

		it("should get coverage thresholds", () => {
			const thresholds = constraintManager.getCoverageThresholds();
			expect(thresholds).toBeDefined();
			expect(thresholds.overall_minimum).toBe(85);
			expect(thresholds.phase_minimum).toBe(80);
		});

		it("should get micro methods", () => {
			const architecturalMethods =
				constraintManager.getMicroMethods("architectural");
			expect(architecturalMethods).toBeInstanceOf(Array);
		});

		it("should get template references", () => {
			const templateRefs = constraintManager.getTemplateReferences();
			expect(templateRefs).toBeDefined();
			expect(typeof templateRefs).toBe("object");
		});

		it("should get output format specifications", () => {
			const markdownSpec = constraintManager.getOutputFormatSpec("markdown");
			expect(markdownSpec).toBeDefined();

			const yamlSpec = constraintManager.getOutputFormatSpec("yaml");
			expect(yamlSpec).toBeDefined();
		});
	});

	describe("Coverage Enforcer Extended Coverage", () => {
		it("should enforce coverage for a session", async () => {
			const mockSessionState = {
				config: {
					sessionId: "coverage-test",
					context: "Testing coverage enforcement",
					goal: "Validate coverage",
					requirements: ["Coverage validation"],
					constraints: constraintManager.getConstraints(),
					coverageThreshold: 85,
					enablePivots: false,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				currentPhase: "requirements",
				phases: {},
				artifacts: [],
				metadata: {},
				events: [],
				status: "active",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			const result = await coverageEnforcer.enforceCoverage(mockSessionState);
			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
			expect(result.coverage).toBeGreaterThanOrEqual(0);
		});

		it("should enforce phase coverage", async () => {
			const mockSessionState = {
				config: {
					sessionId: "phase-coverage-test",
					constraints: constraintManager.getConstraints(),
				},
			} as any;

			const result = await coverageEnforcer.enforcePhaseCoverage(
				mockSessionState,
				"requirements",
			);
			expect(result).toBeDefined();
			expect(result.phase).toBe("requirements");
			expect(result.coverage).toBeGreaterThanOrEqual(0);
			expect(typeof result.canProceed).toBe("boolean");
		});

		it("should generate coverage reports", async () => {
			const mockConfig = {
				constraints: constraintManager.getConstraints(),
			};

			const report = coverageEnforcer.generateCoverageReport(
				mockConfig,
				"Test content for coverage analysis",
			);
			expect(report).toBeDefined();
			expect(report.overall).toBeGreaterThanOrEqual(0);
			expect(report.phases).toBeDefined();
			expect(report.constraints).toBeDefined();
		});
	});

	describe("Design Phase Workflow Coverage", () => {
		it("should get phase sequence", async () => {
			const sequence = await designPhaseWorkflow.getPhaseSequence();
			expect(sequence).toBeInstanceOf(Array);
			expect(sequence.length).toBeGreaterThan(0);
		});

		it("should validate phase transitions", async () => {
			const canTransition = await designPhaseWorkflow.canTransitionToPhase(
				"discovery",
				"requirements",
			);
			expect(typeof canTransition).toBe("boolean");
		});

		it("should get next phase", async () => {
			const nextPhase = await designPhaseWorkflow.getNextPhase("discovery");
			expect(nextPhase).toBeDefined();
		});

		it("should get phase dependencies", async () => {
			const dependencies =
				await designPhaseWorkflow.getPhaseDependencies("requirements");
			expect(dependencies).toBeInstanceOf(Array);
		});
	});

	describe("Methodology Selector Coverage", () => {
		it("should initialize methodology selector", async () => {
			await expect(methodologySelector.initialize()).resolves.not.toThrow();
		});

		it("should select methodology based on signals", async () => {
			const signals = {
				projectType: "web-application",
				teamSize: "medium",
				complexity: "high",
				timeline: "6-months",
				constraints: ["performance", "scalability"],
			};

			const selection = await methodologySelector.selectMethodology(signals);
			expect(selection).toBeDefined();
			expect(selection.methodology).toBeDefined();
			expect(selection.confidence).toBeGreaterThan(0);
		});

		it("should generate methodology profile", async () => {
			const profile = await methodologySelector.generateMethodologyProfile(
				"agile",
				"web-application",
				["performance"],
			);

			expect(profile).toBeDefined();
			expect(profile.methodology).toBe("agile");
			expect(profile.suitability).toBeGreaterThan(0);
		});
	});

	describe("Pivot Module Coverage", () => {
		it("should initialize pivot module", async () => {
			await expect(pivotModule.initialize()).resolves.not.toThrow();
		});

		it("should evaluate pivot decisions", async () => {
			const mockSessionState = {
				config: {
					sessionId: "pivot-test",
					context: "Testing pivot evaluation",
					goal: "Evaluate pivot options",
					requirements: ["Pivot analysis"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			} as any;

			const decision = await pivotModule.evaluatePivot(
				mockSessionState,
				"Change technology stack",
			);
			expect(decision).toBeDefined();
			expect(decision.recommended).toBeDefined();
			expect(decision.impact).toBeDefined();
		});

		it("should suggest pivot options", async () => {
			const mockSessionState = {
				config: {
					sessionId: "pivot-suggestion-test",
					context: "Testing pivot suggestions",
				},
			} as any;

			const suggestions = await pivotModule.suggestPivots(mockSessionState);
			expect(suggestions).toBeInstanceOf(Array);
		});
	});

	describe("Roadmap Generator Coverage", () => {
		it("should generate roadmap from session", async () => {
			const mockSessionState = {
				config: {
					sessionId: "roadmap-test",
					context: "Testing roadmap generation",
					goal: "Generate comprehensive roadmap",
					requirements: ["Feature 1", "Feature 2"],
					constraints: constraintManager.getConstraints().slice(0, 2),
					coverageThreshold: 85,
					enablePivots: false,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				phases: {
					discovery: { coverage: 90 },
					requirements: { coverage: 85 },
					architecture: { coverage: 80 },
				},
			} as any;

			const roadmap = await roadmapGenerator.generateRoadmap(mockSessionState);
			expect(roadmap).toBeDefined();
			expect(roadmap.success).toBe(true);
			expect(roadmap.roadmapContent).toBeDefined();
		});

		it("should generate roadmap with custom options", async () => {
			const mockSessionState = {
				config: {
					sessionId: "custom-roadmap-test",
					context: "Custom roadmap generation",
				},
			} as any;

			const roadmap = await roadmapGenerator.generateRoadmap(mockSessionState, {
				includeTimeline: true,
				includeMilestones: true,
				includeRisks: true,
				format: "detailed",
			});

			expect(roadmap).toBeDefined();
			expect(roadmap.success).toBe(true);
		});
	});

	describe("Spec Generator Coverage", () => {
		it("should generate specification from session", async () => {
			const mockSessionState = {
				config: {
					sessionId: "spec-test",
					context: "Testing specification generation",
					goal: "Generate technical specification",
					requirements: ["API endpoints", "Data models"],
					constraints: constraintManager.getConstraints().slice(0, 1),
				},
			} as any;

			const spec = await specGenerator.generateSpecification(mockSessionState);
			expect(spec).toBeDefined();
			expect(spec.success).toBe(true);
			expect(spec.specificationContent).toBeDefined();
		});

		it("should generate specification with custom format", async () => {
			const mockSessionState = {
				config: {
					sessionId: "custom-spec-test",
				},
			} as any;

			const spec = await specGenerator.generateSpecification(mockSessionState, {
				format: "openapi",
				includeExamples: true,
				includeValidation: true,
			});

			expect(spec).toBeDefined();
			expect(spec.success).toBe(true);
		});
	});

	describe("Strategic Pivot Prompt Builder Coverage", () => {
		it("should generate strategic pivot prompt", async () => {
			const mockSessionState = {
				config: {
					sessionId: "strategic-pivot-test",
					context: "Testing strategic pivot prompts",
					goal: "Generate pivot guidance",
				},
			} as any;

			const pivotDecision = {
				type: "technology_change",
				reason: "Performance requirements",
				description: "Switch from REST to GraphQL",
				impact: "moderate",
				confidence: 0.8,
			} as any;

			const result = await strategicPivotPromptBuilder.generatePrompt({
				sessionState: mockSessionState,
				pivotDecision,
				includeTemplates: true,
				includeSpace7Instructions: true,
			});

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.prompt).toBeDefined();
		});

		it("should generate prompt with custom instructions", async () => {
			const mockSessionState = {
				config: {
					sessionId: "custom-strategic-pivot-test",
				},
			} as any;

			const pivotDecision = {
				type: "scope_change",
				reason: "Market feedback",
			} as any;

			const result = await strategicPivotPromptBuilder.generatePrompt({
				sessionState: mockSessionState,
				pivotDecision,
				customInstructions: ["Consider user impact", "Analyze technical debt"],
				outputFormat: "yaml",
			});

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
		});
	});

	describe("Error Handling and Edge Cases", () => {
		it("should handle invalid inputs gracefully", async () => {
			// Test constraint manager with invalid constraint ID
			const invalidConstraint = constraintManager.getConstraint(
				"invalid.constraint.id",
			);
			expect(invalidConstraint).toBeUndefined();

			// Test phase workflow with invalid phase
			const invalidNextPhase =
				await designPhaseWorkflow.getNextPhase("invalid-phase");
			expect(invalidNextPhase).toBeUndefined();
		});

		it("should handle empty or minimal session states", async () => {
			const minimalSession = {
				config: {
					sessionId: "minimal",
					context: "",
					goal: "",
					requirements: [],
					constraints: [],
					coverageThreshold: 0,
					enablePivots: false,
					templateRefs: [],
					outputFormats: [],
					metadata: {},
				},
			} as any;

			// Test roadmap generation with minimal data
			const roadmap = await roadmapGenerator.generateRoadmap(minimalSession);
			expect(roadmap).toBeDefined();

			// Test spec generation with minimal data
			const spec = await specGenerator.generateSpecification(minimalSession);
			expect(spec).toBeDefined();
		});

		it("should test coverage with edge case values", async () => {
			const edgeCaseSession = {
				config: {
					sessionId: "edge-case",
					constraints: [],
				},
			} as any;

			const coverage = await coverageEnforcer.enforceCoverage(edgeCaseSession);
			expect(coverage).toBeDefined();
			expect(coverage.coverage).toBeGreaterThanOrEqual(0);
		});
	});
});
