import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	ADRGenerationResult,
	ADRRequest,
} from "../../src/tools/design/adr-generator.ts";
import { adrGenerator } from "../../src/tools/design/adr-generator.ts";
import type { ConstraintValidationResult } from "../../src/tools/design/constraint-manager.ts";
import { constraintManager } from "../../src/tools/design/constraint-manager.ts";
import type {
	Artifact,
	DesignPhase,
	DesignSessionState,
} from "../../src/tools/design/types/index.ts";
import { logger } from "../../src/tools/shared/logger.ts";

interface InternalADRGenerator {
	generateConsequences: (
		decision: string,
		sessionState: DesignSessionState,
	) => string;
	generateADRRecommendations: (request: ADRRequest) => string[];
	findRelatedDecisions: (
		sessionState: DesignSessionState,
		decision: string,
	) => string[];
	extractKeywords: (text: string) => string[];
	extractDecisionsFromPhase: (
		phase: DesignPhase,
	) => Array<{ title: string; content: string }>;
}

const getInternal = (): InternalADRGenerator =>
	adrGenerator as unknown as InternalADRGenerator;

const createSessionState = (): DesignSessionState => {
	const artifacts: Artifact[] = [
		{
			id: "adr-legacy",
			name: "ADR-0001: Adopt GraphQL",
			type: "adr",
			format: "markdown",
			content:
				"We selected GraphQL APIs with federated gateway using Apollo and node services.",
			metadata: { phaseId: "architecture" },
			timestamp: "2024-01-01T00:00:00.000Z",
		},
	];

	return {
		config: {
			sessionId: "adr-private-tests",
			context: "Modernize analytics platform",
			goal: "Deliver resilient decision records",
			requirements: ["document decisions", "share knowledge"],
			constraints: [],
			coverageThreshold: 85,
			enablePivots: false,
			templateRefs: [],
			outputFormats: ["markdown"],
			metadata: {},
		},
		currentPhase: "architecture",
		phases: {
			architecture: {
				id: "architecture",
				name: "Architecture",
				description: "Architecture phase",
				inputs: ["vision"],
				outputs: ["adr"],
				criteria: ["system components"],
				coverage: 92,
				status: "completed",
				artifacts: [
					{
						id: "arch-notes",
						name: "Architecture Notes",
						type: "specification",
						format: "markdown",
						content: `We decided to move to microservices.
We selected AWS for hosting critical workloads.
Approach: Use managed database services for persistence.
We will use API Gateway to expose the platform.
`,
						metadata: {},
						timestamp: new Date().toISOString(),
					},
				],
				dependencies: [],
			},
			design: {
				id: "design",
				name: "Design",
				description: "Design phase",
				inputs: ["architecture"],
				outputs: ["diagrams"],
				criteria: ["cover interfaces"],
				coverage: 80,
				status: "completed",
				artifacts: [
					{
						id: "design-summary",
						name: "Design Summary",
						type: "specification",
						format: "markdown",
						content:
							"The team chose container orchestration and decided to adopt React UI.",
						metadata: {},
						timestamp: new Date().toISOString(),
					},
				],
				dependencies: ["architecture"],
			},
		},
		coverage: {
			overall: 88,
			phases: { architecture: 92, design: 80 },
			constraints: {},
			assumptions: {},
			documentation: {},
			testCoverage: 75,
		},
		artifacts,
		history: [],
		status: "active",
	};
};

describe("adrGenerator private helper coverage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("generates fallback consequences when decision lacks keywords", () => {
		const internal = getInternal();
		const sessionState = createSessionState();
		const consequences = internal.generateConsequences(
			"Adopt a gradual enhancement roadmap for support teams",
			sessionState,
		);

		expect(consequences).toContain("**Positive**");
		expect(consequences).toContain("**Negative**");
	});

	it("enriches recommendations for constraint failures and context keywords", () => {
		const internal = getInternal();
		const sessionState = createSessionState();

		const validation: ConstraintValidationResult = {
			passed: false,
			coverage: 45,
			violations: [
				{
					constraintId: "security",
					severity: "error",
					message: "Missing threat model",
					suggestion: "Add threat modeling activities",
				},
			],
			recommendations: ["Include security squad", "Plan resilience testing"],
		};

		const validationSpy = vi
			.spyOn(constraintManager, "validateConstraints")
			.mockReturnValue(validation);

		const recommendations = internal.generateADRRecommendations({
			sessionState,
			title: "ADR-Context",
			context: "Security modernization",
			decision:
				"Introduce new technology platform with advanced security measures",
		});

		expect(recommendations[0]).toContain("Address constraint violations");
		expect(recommendations).toContain(
			"Conduct proof-of-concept before full implementation",
		);
		expect(recommendations).toContain(
			"Involve security team in implementation planning",
		);
		expect(validationSpy).toHaveBeenCalled();
	});

	it("finds related decisions using keyword overlap", () => {
		const internal = getInternal();
		const sessionState = createSessionState();
		const related = internal.findRelatedDecisions(
			sessionState,
			"Adopt database strategy with API exposure",
		);

		expect(related).toContain("ADR-0001: Adopt GraphQL (1 shared concepts)");
		expect(related).toContain("Data architecture decisions");
		expect(related).toContain("Interface design decisions");
	});

	it("extracts decision narratives from phase artifacts with fallback", () => {
		const internal = getInternal();
		const sessionState = createSessionState();
		const decisions = internal.extractDecisionsFromPhase(
			sessionState.phases.architecture,
		);

		expect(decisions.length).toBeGreaterThanOrEqual(3);
		expect(decisions[0].content.length).toBeGreaterThan(10);

		const fallbackPhase: DesignPhase = {
			...sessionState.phases.design,
			artifacts: [
				{
					id: "design-minimal",
					name: "Design Minimal",
					type: "specification",
					format: "markdown",
					content: "No explicit decisions recorded here.",
					metadata: {},
					timestamp: new Date().toISOString(),
				},
			],
		};

		const fallbackDecisions = internal.extractDecisionsFromPhase(fallbackPhase);
		expect(fallbackDecisions[0].title).toContain("Design");
	});

	it("logs warnings when session ADR generation fails for a phase", async () => {
		const sessionState = createSessionState();
		const warnSpy = vi
			.spyOn(logger, "warn")
			.mockImplementation(() => undefined);

		const mockArtifact: Artifact = {
			id: "adr-generated",
			name: "ADR-9999",
			type: "adr",
			format: "markdown",
			content: "ADR content",
			metadata: {},
			timestamp: new Date().toISOString(),
		};

		const generateSpy = vi
			.spyOn(adrGenerator, "generateADR")
			.mockRejectedValueOnce(new Error("generation failure"))
			.mockResolvedValue({
				artifact: mockArtifact,
				markdown: mockArtifact.content,
				recommendations: [],
				relatedDecisions: [],
			} satisfies ADRGenerationResult);

		const artifacts = await adrGenerator.generateSessionADRs(sessionState);

		expect(warnSpy).toHaveBeenCalled();
		expect(generateSpy.mock.calls.length).toBeGreaterThan(1);
		expect(artifacts.length).toBe(generateSpy.mock.calls.length - 1);
		expect(artifacts.every((artifact) => artifact === mockArtifact)).toBe(true);
	});

	it("extracts technology keywords for downstream matching", () => {
		const internal = getInternal();
		const keywords = internal.extractKeywords(
			"We rely on Kubernetes, Redis cache, GraphQL APIs, and HTTPS.",
		);

		expect(keywords).toEqual(
			expect.arrayContaining(["kubernetes", "redis", "graphql", "https"]),
		);
	});
});
