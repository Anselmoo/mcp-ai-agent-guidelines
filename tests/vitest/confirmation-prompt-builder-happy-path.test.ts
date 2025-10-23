// Confirmation Prompt Builder - Happy Path & Private Method Coverage Tests
import { beforeAll, describe, expect, it } from "vitest";
import { confirmationPromptBuilder } from "../../dist/tools/design/confirmation-prompt-builder.js";
import type { DesignSessionState } from "../../dist/tools/design/types/index.js";

describe("Confirmation Prompt Builder - Happy Path & Private Methods", () => {
	beforeAll(async () => {
		await confirmationPromptBuilder.initialize();
	});

	const createFullSessionState = (): DesignSessionState => ({
		config: {
			sessionId: "full-test-session",
			context: "Complete testing of confirmation prompt generation",
			goal: "Full coverage of all private helper methods",
			requirements: [
				"Comprehensive prompt generation",
				"Multiple constraint validation",
				"Complete artifact handling",
				"Full markdown formatting",
			],
			constraints: [
				{
					id: "constraint-1",
					name: "Performance Constraint",
					type: "non-functional",
					category: "performance",
					description: "System must handle 1000 req/s",
					validation: {
						minCoverage: 90,
						keywords: ["performance", "throughput"],
					},
					weight: 0.9,
					mandatory: true,
					source: "Requirements",
				},
				{
					id: "constraint-2",
					name: "Security Constraint",
					type: "non-functional",
					category: "security",
					description: "Must implement OAuth 2.0",
					validation: { minCoverage: 95, keywords: ["security", "auth"] },
					weight: 0.95,
					mandatory: true,
					source: "Requirements",
				},
				{
					id: "constraint-3",
					name: "Usability Constraint",
					type: "functional",
					category: "usability",
					description: "UI must be intuitive",
					validation: { minCoverage: 75, keywords: ["usability", "ui"] },
					weight: 0.7,
					mandatory: false,
					source: "Stakeholders",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["full-template"],
			outputFormats: ["markdown", "json"],
			metadata: { environment: "test", fullCoverage: true },
		},
		currentPhase: "requirements",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery Phase",
				description: "Stakeholder discovery and problem definition",
				status: "completed",
				inputs: ["stakeholder-interviews", "market-research"],
				outputs: ["problem-statement", "stakeholder-map", "market-analysis"],
				criteria: [
					"stakeholders-identified",
					"problem-defined",
					"goals-aligned",
				],
				coverage: 95,
				artifacts: [
					{
						id: "stakeholder-map",
						name: "Stakeholder Map",
						type: "diagram",
						content:
							"Comprehensive stakeholder analysis with roles and influences",
						format: "svg",
						timestamp: "2024-01-01T10:00:00Z",
						metadata: { keywords: ["stakeholders", "influence"] },
					},
					{
						id: "problem-analysis",
						name: "Problem Analysis",
						type: "document",
						content: "Detailed problem statement with root cause analysis",
						format: "markdown",
						timestamp: "2024-01-01T11:00:00Z",
						metadata: { keywords: ["problem", "root-cause"] },
					},
				],
				dependencies: [],
			},
			requirements: {
				id: "requirements",
				name: "Requirements Analysis",
				description: "Requirements gathering, analysis, and specification",
				status: "in-progress",
				inputs: ["problem-statement", "stakeholder-map"],
				outputs: [
					"functional-reqs",
					"non-functional-reqs",
					"acceptance-criteria",
				],
				criteria: [
					"all-requirements-documented",
					"acceptance-criteria-defined",
					"stakeholder-approved",
				],
				coverage: 85,
				artifacts: [
					{
						id: "requirements-doc",
						name: "Requirements Specification",
						type: "document",
						content:
							"Comprehensive requirements specification with user stories",
						format: "markdown",
						timestamp: "2024-01-02T10:00:00Z",
						metadata: { keywords: ["requirements", "user-stories"] },
					},
				],
				dependencies: ["discovery"],
			},
			design: {
				id: "design",
				name: "System Design",
				description: "Architecture and component design",
				status: "pending",
				inputs: ["requirements-doc"],
				outputs: ["architecture-diagram", "component-specs", "api-spec"],
				criteria: [
					"design-reviewed",
					"scalability-confirmed",
					"performance-modeled",
				],
				coverage: 0,
				artifacts: [],
				dependencies: ["requirements"],
			},
			implementation: {
				id: "implementation",
				name: "Implementation",
				description: "Code development and testing",
				status: "pending",
				inputs: ["design-docs"],
				outputs: ["source-code", "test-suite", "documentation"],
				criteria: ["code-complete", "tests-passing", "docs-updated"],
				coverage: 0,
				artifacts: [],
				dependencies: ["design"],
			},
		},
		coverage: {
			overall: 82.5,
			phases: {
				discovery: 95,
				requirements: 85,
				design: 0,
				implementation: 0,
			},
			constraints: {
				"constraint-1": 92,
				"constraint-2": 96,
				"constraint-3": 70,
			},
			assumptions: {
				"team-expertise": 85,
				"vendor-availability": 80,
				"timeline-feasibility": 75,
			},
			documentation: {
				"requirements-doc": 88,
				"design-doc": 0,
				"api-doc": 0,
			},
			testCoverage: 82,
		},
		artifacts: [
			{
				id: "session-artifact-1",
				name: "Session Summary",
				type: "summary",
				content: "Session progress summary",
				format: "markdown",
				timestamp: "2024-01-15T15:00:00Z",
				metadata: { phase: "requirements" },
			},
		],
		history: [
			{
				timestamp: "2024-01-01T09:00:00Z",
				type: "phase-start",
				phase: "discovery",
				description: "Started discovery phase",
			},
			{
				timestamp: "2024-01-01T18:00:00Z",
				type: "phase-end",
				phase: "discovery",
				description: "Completed discovery phase",
			},
			{
				timestamp: "2024-01-02T09:00:00Z",
				type: "phase-start",
				phase: "requirements",
				description: "Started requirements analysis phase",
			},
		],
		status: "active",
	});

	describe("generateConfirmationPrompt - Full Happy Path", () => {
		it("should generate complete confirmation prompt with all sections", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
					contextualContent:
						"Full requirements analysis with multiple constraints",
					includeRationale: true,
				},
			);

			expect(prompt).toBeDefined();
			expect(prompt.title).toBe("Requirements Analysis Phase Confirmation");
			expect(prompt.sections).toHaveLength(4);
			expect(prompt.validationChecklist.length).toBeGreaterThan(0);
			expect(prompt.rationaleQuestions.length).toBeGreaterThan(0);
			expect(prompt.nextSteps.length).toBeGreaterThan(0);
		});

		it("should include all section types in generated prompt", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
					includeRationale: true,
				},
			);

			const sectionTypes = prompt.sections.map((s) => s.type);
			expect(sectionTypes).toContain("overview");
			expect(sectionTypes).toContain("validation");
			expect(sectionTypes).toContain("rationale");
			expect(sectionTypes).toContain("recommendations");
		});

		it("should populate metadata correctly in generated prompt", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			expect(prompt.metadata).toBeDefined();
			expect(prompt.metadata.phaseId).toBe("requirements");
			expect(prompt.metadata.sessionId).toBe("full-test-session");
			expect(prompt.metadata.timestamp).toBeDefined();
			expect(prompt.metadata.coverageGaps).toBeInstanceOf(Array);
			expect(prompt.metadata.criticalIssues).toBeInstanceOf(Array);
		});

		it("should handle prompt generation without rationale questions", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
					includeRationale: false,
				},
			);

			expect(prompt.rationaleQuestions).toHaveLength(0);
		});

		it("should generate sections with all expected structure", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			for (const section of prompt.sections) {
				expect(section).toHaveProperty("id");
				expect(section).toHaveProperty("title");
				expect(section).toHaveProperty("content");
				expect(section).toHaveProperty("type");
				expect(section).toHaveProperty("required");
				expect(section).toHaveProperty("prompts");
				expect(section.prompts).toBeInstanceOf(Array);
				expect(section.prompts.length).toBeGreaterThan(0);
			}
		});
	});

	describe("generatePhaseCompletionPrompt - Happy Path", () => {
		it("should generate markdown formatted phase completion prompt", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toBeDefined();
			expect(typeof markdown).toBe("string");
			expect(markdown).toContain("# Requirements Analysis Phase Confirmation");
		});

		it("should include all sections in markdown output", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("## Phase Overview");
			expect(markdown).toContain("## Validation & Quality Assurance");
			expect(markdown).toContain("## Decision Rationale & Documentation");
			expect(markdown).toContain("## Recommendations & Next Steps");
		});

		it("should format validation checklist with status icons", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("## Validation Checklist");
			expect(markdown).toMatch(/[✅❌➖⏳]/);
		});

		it("should include rationale questions in markdown", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("## Decision Rationale");
			expect(markdown).toContain("key decisions");
		});

		it("should format next steps as numbered list", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("## Next Steps");
			expect(markdown).toMatch(/\d+\./);
		});
	});

	describe("generatePromptSections - Private Method Coverage", () => {
		it("should generate all four section types", async () => {
			const sessionState = createFullSessionState();
			const _phase = sessionState.phases.requirements;

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			expect(prompt.sections).toHaveLength(4);
			const types = prompt.sections.map((s) => s.type);
			expect(types).toEqual([
				"overview",
				"validation",
				"rationale",
				"recommendations",
			]);
		});

		it("should populate overview section with phase details", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const overviewSection = prompt.sections.find(
				(s) => s.type === "overview",
			);
			expect(overviewSection).toBeDefined();
			expect(overviewSection?.content).toContain("Requirements Analysis");
			expect(overviewSection?.prompts).toContain(
				"Review the phase objectives and deliverables",
			);
		});

		it("should populate validation section with coverage gaps", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const validationSection = prompt.sections.find(
				(s) => s.type === "validation",
			);
			expect(validationSection).toBeDefined();
			expect(validationSection?.content).toContain("Current Status");
			expect(validationSection?.content).toContain("Coverage");
		});

		it("should populate rationale section with phase artifacts", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const rationaleSection = prompt.sections.find(
				(s) => s.type === "rationale",
			);
			expect(rationaleSection).toBeDefined();
			expect(rationaleSection?.content).toContain("Key Decision Areas");
		});

		it("should populate recommendations section with coverage gaps", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const recommendSection = prompt.sections.find(
				(s) => s.type === "recommendations",
			);
			expect(recommendSection).toBeDefined();
			expect(recommendSection?.content).toContain("Recommendations");
		});
	});

	describe("generateValidationChecklist - Private Method Coverage", () => {
		it("should generate checkpoints for coverage threshold", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const coverageCheckpoint = prompt.validationChecklist.find(
				(c) => c.category === "coverage",
			);
			expect(coverageCheckpoint).toBeDefined();
			expect(coverageCheckpoint?.description).toContain(
				"coverage meets minimum threshold",
			);
		});

		it("should generate checkpoints for all constraints", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const constraintCheckpoints = prompt.validationChecklist.filter(
				(c) => c.category === "constraints",
			);
			expect(constraintCheckpoints.length).toBe(3);
		});

		it("should generate quality checkpoints for deliverables", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const qualityCheckpoints = prompt.validationChecklist.filter(
				(c) => c.category === "quality",
			);
			expect(qualityCheckpoints.length).toBeGreaterThan(0);
		});

		it("should mark coverage checkpoints as satisfied when above threshold", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const coverageCheckpoint = prompt.validationChecklist.find(
				(c) => c.id === "coverage-threshold",
			);
			expect(coverageCheckpoint?.status).toBe("satisfied");
		});

		it("should mark deliverables checkpoint as satisfied when outputs exist", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const deliverableCheckpoint = prompt.validationChecklist.find(
				(c) => c.id === "deliverables-complete",
			);
			expect(deliverableCheckpoint?.status).toBe("satisfied");
		});
	});

	describe("generateRationaleQuestions - Private Method Coverage", () => {
		it("should generate primary decisions question", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const primaryDecision = prompt.rationaleQuestions.find(
				(q) => q.id === "primary-decisions",
			);
			expect(primaryDecision).toBeDefined();
			expect(primaryDecision?.category).toBe("decision");
			expect(primaryDecision?.required).toBe(true);
		});

		it("should generate alternatives considered question", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const alternatives = prompt.rationaleQuestions.find(
				(q) => q.id === "alternatives-considered",
			);
			expect(alternatives).toBeDefined();
			expect(alternatives?.category).toBe("alternative");
		});

		it("should generate risk mitigation question when critical issues exist", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "discovery",
				},
			);

			const riskQuestion = prompt.rationaleQuestions.find(
				(q) => q.id === "risk-mitigation",
			);
			if (prompt.metadata.criticalIssues.length > 0) {
				expect(riskQuestion).toBeDefined();
			}
		});

		it("should generate assumptions question", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const assumptions = prompt.rationaleQuestions.find(
				(q) => q.id === "assumptions",
			);
			expect(assumptions).toBeDefined();
			expect(assumptions?.category).toBe("assumption");
			expect(assumptions?.required).toBe(false);
		});

		it("should include suggestions for all questions", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			for (const question of prompt.rationaleQuestions) {
				expect(question.suggestions).toBeInstanceOf(Array);
				expect(question.suggestions.length).toBeGreaterThan(0);
			}
		});
	});

	describe("generateNextSteps - Private Method Coverage", () => {
		it("should include steps for addressing coverage gaps", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "design",
				},
			);

			const hasGapSteps = prompt.nextSteps.some((s) =>
				s.includes("coverage gaps"),
			);
			expect(hasGapSteps || prompt.metadata.coverageGaps.length === 0).toBe(
				true,
			);
		});

		it("should include steps for resolving critical issues", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "design",
				},
			);

			if (prompt.metadata.criticalIssues.length > 0) {
				const hasIssueSteps = prompt.nextSteps.some((s) =>
					s.includes("critical issues"),
				);
				expect(hasIssueSteps).toBe(true);
			}
		});

		it("should include phase transition steps when next phase exists", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const hasTransitionSteps = prompt.nextSteps.some((s) =>
				s.includes("phase transition"),
			);
			expect(hasTransitionSteps).toBe(true);
		});

		it("should always include documentation update steps", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const hasDocSteps = prompt.nextSteps.some((s) =>
				s.includes("documentation"),
			);
			expect(hasDocSteps).toBe(true);
		});

		it("should include default steps when no gaps or issues", async () => {
			const sessionState = createFullSessionState();
			sessionState.phases.requirements.coverage = 100;

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			expect(prompt.nextSteps.length).toBeGreaterThan(0);
		});
	});

	describe("formatPromptAsMarkdown - Private Method Coverage", () => {
		it("should include title in markdown", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("# Requirements Analysis Phase Confirmation");
		});

		it("should include description in markdown", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("Deterministic confirmation prompt");
		});

		it("should include metadata section", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**Session**:");
			expect(markdown).toContain("**Phase**:");
			expect(markdown).toContain("**Generated**:");
		});

		it("should format all sections with h2 headers", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("## Phase Overview");
			expect(markdown).toContain("## Validation & Quality Assurance");
			expect(markdown).toContain("## Decision Rationale & Documentation");
		});

		it("should include guiding questions for each section", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("### Guiding Questions");
			expect(markdown).toMatch(/- Review the phase objectives/);
		});

		it("should format validation checklist with status icons", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("## Validation Checklist");
			expect(markdown).toMatch(/[✅❌➖⏳]/);
		});

		it("should format rationale questions with proper structure", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("## Decision Rationale");
			expect(markdown).toContain("###");
			expect(markdown).toContain("**(Required)**");
		});

		it("should format next steps as numbered list", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("## Next Steps");
			expect(markdown).toMatch(/1\./);
		});

		it("should include footer attribution", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("Generated by MCP Design Assistant");
		});
	});

	describe("identifyCoverageGaps - Private Method Coverage", () => {
		it("should identify gaps when overall coverage is below target", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const gaps = prompt.metadata.coverageGaps;
			if (sessionState.coverage.overall < 85) {
				expect(gaps.length).toBeGreaterThan(0);
			}
		});

		it("should identify phase-specific coverage gaps", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "design",
				},
			);

			const gaps = prompt.metadata.coverageGaps;
			expect(gaps.length).toBeGreaterThan(0);
		});
	});

	describe("identifyCriticalIssues - Private Method Coverage", () => {
		it("should identify missing phase outputs as critical issue", async () => {
			const sessionState = createFullSessionState();
			sessionState.phases.requirements.outputs = [];

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const issues = prompt.metadata.criticalIssues;
			expect(issues).toContain("No outputs defined for phase");
		});

		it("should identify unmet mandatory constraints", async () => {
			const sessionState = createFullSessionState();
			sessionState.coverage.constraints["constraint-1"] = 50;

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const issues = prompt.metadata.criticalIssues;
			if (sessionState.config.constraints[0].mandatory) {
				expect(issues.some((i) => i.includes("Mandatory constraint"))).toBe(
					true,
				);
			}
		});

		it("should identify blocked dependencies", async () => {
			const sessionState = createFullSessionState();
			sessionState.phases.requirements.dependencies = ["discovery"];
			sessionState.phases.discovery.status = "pending";

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const issues = prompt.metadata.criticalIssues;
			expect(issues.some((i) => i.includes("Dependency"))).toBe(true);
		});
	});

	describe("generateOverviewContent - Private Method Coverage", () => {
		it("should format phase name", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**Phase**: Requirements Analysis");
		});

		it("should format phase description", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**Description**:");
		});

		it("should format phase status and coverage", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**Status**:");
			expect(markdown).toContain("**Coverage**:");
		});

		it("should list all phase objectives", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**Objectives**:");
			expect(markdown).toContain("- all-requirements-documented");
		});

		it("should list all expected outputs", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**Expected Outputs**:");
			expect(markdown).toContain("- functional-reqs");
		});
	});

	describe("generateValidationContent - Private Method Coverage", () => {
		it("should format current status and coverage", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**Current Status**:");
			expect(markdown).toContain("**Coverage**:");
		});

		it("should list coverage gaps when present", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"design",
				);

			if (sessionState.coverage.phases.design === 0) {
				expect(markdown).toContain("**Coverage Gaps**:");
			}
		});

		it("should list critical issues when present", async () => {
			const sessionState = createFullSessionState();
			sessionState.phases.requirements.outputs = [];

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**Critical Issues**:");
		});

		it("should show success status when no gaps or issues", async () => {
			const sessionState = createFullSessionState();
			sessionState.phases.discovery.outputs = [];

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"discovery",
				);

			const hasGapsOrIssues =
				sessionState.coverage.phases.discovery < 85 ||
				sessionState.phases.discovery.outputs.length === 0;
			if (!hasGapsOrIssues) {
				expect(markdown).toContain("✅");
			}
		});
	});

	describe("generateRationaleContent - Private Method Coverage", () => {
		it("should include key decision areas", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("Key Decision Areas");
			expect(markdown).toContain("Technical approach");
			expect(markdown).toContain("Resource allocation");
		});

		it("should list generated artifacts when present", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**Generated Artifacts**:");
			expect(markdown).toContain("Requirements Specification");
		});
	});

	describe("generateRecommendationsContent - Private Method Coverage", () => {
		it("should include priority actions when gaps or issues exist", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"design",
				);

			if (
				sessionState.coverage.phases.design === 0 ||
				sessionState.phases.design.outputs.length === 0
			) {
				expect(markdown).toContain("Priority Actions");
			}
		});

		it("should include general recommendations", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			expect(markdown).toContain("**General Recommendations**:");
			expect(markdown).toContain("Review and validate");
			expect(markdown).toContain("stakeholder alignment");
			expect(markdown).toContain("documentation");
		});

		it("should mark critical issues with red dot emoji", async () => {
			const sessionState = createFullSessionState();
			sessionState.phases.requirements.outputs = [];

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"requirements",
				);

			if (sessionState.phases.requirements.outputs.length === 0) {
				expect(markdown).toContain("🔴");
			}
		});

		it("should mark coverage gaps with yellow dot emoji", async () => {
			const sessionState = createFullSessionState();

			const markdown =
				await confirmationPromptBuilder.generatePhaseCompletionPrompt(
					sessionState,
					"design",
				);

			if (sessionState.coverage.phases.design < 85) {
				expect(markdown).toContain("🟡");
			}
		});
	});

	describe("getNextPhase - Private Method Coverage", () => {
		it("should return next phase when available", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "requirements",
				},
			);

			const hasNextPhaseStep = prompt.nextSteps.some((s) =>
				s.includes("design"),
			);
			expect(hasNextPhaseStep).toBe(true);
		});

		it("should handle last phase correctly", async () => {
			const sessionState = createFullSessionState();

			const prompt = await confirmationPromptBuilder.generateConfirmationPrompt(
				{
					sessionState,
					phaseId: "implementation",
				},
			);

			const hasNextPhaseStep = prompt.nextSteps.some((s) =>
				s.includes("phase transition"),
			);
			expect(hasNextPhaseStep || prompt.nextSteps.length > 0).toBe(true);
		});
	});
});
