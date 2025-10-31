import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adrGenerator } from "../../src/tools/design/adr-generator.ts";
import { constraintConsistencyEnforcer } from "../../src/tools/design/constraint-consistency-enforcer.ts";
import type {
	ConstraintValidationResult,
	ConstraintViolation,
} from "../../src/tools/design/constraint-manager.ts";
import type {
	Artifact,
	ConstraintConsistencyViolation,
	ConstraintEnforcementHistory,
	CrossSessionValidationResult,
	DesignSessionState,
	EnforcementAction,
} from "../../src/tools/design/types/index.ts";
import { logger } from "../../src/tools/shared/logger.ts";

interface InternalEnforcer {
	generateEnforcementActions: (
		currentValidation: ConstraintValidationResult,
		crossSessionValidation: CrossSessionValidationResult,
		strictMode: boolean,
	) => EnforcementAction[];
	generateInteractivePrompts: (
		crossSessionValidation: CrossSessionValidationResult,
		phaseId: string,
	) => string[];
	generateEnforcementArtifacts: (
		sessionState: DesignSessionState,
		crossSessionValidation: CrossSessionValidationResult,
		enforcementActions: EnforcementAction[],
	) => Promise<Artifact[]>;
	storeEnforcementDecisions: (
		sessionState: DesignSessionState,
		enforcementActions: EnforcementAction[],
		context: string,
	) => Promise<void>;
	calculateRawConsistencyScore: (
		violations: ConstraintConsistencyViolation[],
		totalConstraints: number,
	) => number;
	generateEnforcementConsequences: (
		crossSessionValidation: CrossSessionValidationResult,
	) => string;
	generateEnforcementDecisionText: (
		crossSessionValidation: CrossSessionValidationResult,
		enforcementActions: EnforcementAction[],
	) => string;
	generateHistoricalAlignments: (
		crossSessionValidation: CrossSessionValidationResult,
	) => string[];
	generateContextDrivenPrompt: (
		violation: ConstraintConsistencyViolation,
		phaseId: string,
	) => string;
	generateSpace7AlignmentPrompt: (
		phaseId: string,
		crossSessionValidation: CrossSessionValidationResult,
	) => string;
	generateViolationResolutionPrompt: (violation: ConstraintViolation) => string;
	persistEnforcementHistory: () => Promise<void>;
	enforcementHistory: Map<string, ConstraintEnforcementHistory[]>;
	initialized: boolean;
}

const getInternal = (): InternalEnforcer =>
	constraintConsistencyEnforcer as unknown as InternalEnforcer;

const createSessionState = (sessionId: string): DesignSessionState => ({
	config: {
		sessionId,
		context: "Testing context",
		goal: "Improve coverage",
		requirements: [],
		constraints: [],
		coverageThreshold: 80,
		enablePivots: false,
		templateRefs: [],
		outputFormats: ["markdown"],
		metadata: {},
	},
	currentPhase: "design",
	phases: {},
	coverage: {
		overall: 75,
		phases: {},
		constraints: {},
		assumptions: {},
		documentation: {},
		testCoverage: 70,
	},
	artifacts: [],
	history: [],
	status: "active",
});

const baseCrossSession = (
	overrides: Partial<CrossSessionValidationResult> = {},
): CrossSessionValidationResult => ({
	passed: true,
	consistencyScore: 85,
	violations: [],
	recommendations: [],
	enforcementActions: [],
	historicalContext: [],
	...overrides,
});

describe("constraintConsistencyEnforcer private utilities", () => {
	const resetInternalState = () => {
		const internal = getInternal();
		internal.enforcementHistory = new Map();
		internal.initialized = false;
	};

	beforeEach(() => {
		resetInternalState();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		resetInternalState();
	});

	it("promotes warning violations when strict mode is enabled", () => {
		const internal = getInternal();
		const warningViolation: ConstraintViolation = {
			constraintId: "performance",
			severity: "warning",
			message: "Response times drifting",
			suggestion: "Review scaling plan",
		};

		const currentValidation: ConstraintValidationResult = {
			passed: false,
			coverage: 60,
			violations: [warningViolation],
			recommendations: [],
		};

		const actionsWithStrictMode = internal.generateEnforcementActions(
			currentValidation,
			baseCrossSession(),
			true,
		);
		const actionsWithoutStrictMode = internal.generateEnforcementActions(
			currentValidation,
			baseCrossSession(),
			false,
		);

		expect(actionsWithStrictMode).toHaveLength(2);
		expect(actionsWithStrictMode[0].constraintId).toBe("performance");
		expect(actionsWithStrictMode[1]).toMatchObject({
			type: "generate_adr",
			constraintId: "enforcement-decisions",
		});
		expect(actionsWithoutStrictMode).toHaveLength(0);
	});

	it("generates critical and alignment prompts for low consistency scores", () => {
		const internal = getInternal();
		const criticalViolation: ConstraintConsistencyViolation = {
			constraintId: "security",
			currentSessionId: "session-current",
			conflictingSessionId: "session-previous",
			violationType: "decision_conflict",
			description: "TLS versions differ",
			severity: "critical",
			suggestedResolution: "Align on TLS 1.3",
		};

		const prompts = internal.generateInteractivePrompts(
			baseCrossSession({
				consistencyScore: 62,
				violations: [criticalViolation],
			}),
			"design",
		);

		expect(prompts.length).toBeGreaterThanOrEqual(2);
		expect(prompts[0]).toContain("Constraint Consistency Validation Required");
		expect(prompts[prompts.length - 1]).toContain(
			"Space 7 Instructions Alignment Check",
		);
	});

	it("builds enforcement artifacts and tolerates ADR generation failures", async () => {
		const internal = getInternal();
		const sessionState = createSessionState("artifact-session");
		const enforcementActions: EnforcementAction[] = [
			{
				id: "enforcement-adr",
				type: "generate_adr",
				constraintId: "security",
				description: "Document cross-session enforcement",
				interactive: false,
				expectedOutcome: "ADR documented",
			},
		];
		const crossSession = baseCrossSession({
			consistencyScore: 58,
			violations: [
				{
					constraintId: "security",
					currentSessionId: "artifact-session",
					conflictingSessionId: "legacy-session",
					violationType: "enforcement_mismatch",
					description: "Different encryption posture",
					severity: "warning",
					suggestedResolution: "Align on shared enforcement model",
				},
			],
		});

		const mockArtifact: Artifact = {
			id: "adr-0001",
			name: "ADR-0001",
			type: "adr",
			content: "Generated ADR content",
			format: "markdown",
			metadata: {},
			timestamp: new Date().toISOString(),
		};

		const adrSpy = vi.spyOn(adrGenerator, "generateADR").mockResolvedValue({
			artifact: mockArtifact,
			markdown: mockArtifact.content,
			recommendations: [],
			relatedDecisions: [],
		});

		const artifacts = await internal.generateEnforcementArtifacts(
			sessionState,
			crossSession,
			enforcementActions,
		);
		expect(artifacts).toEqual([mockArtifact]);
		expect(adrSpy).toHaveBeenCalledTimes(1);

		const warnSpy = vi
			.spyOn(logger, "warn")
			.mockImplementation(() => undefined);
		adrSpy.mockRejectedValueOnce(new Error("adr failure"));

		const fallbackArtifacts = await internal.generateEnforcementArtifacts(
			sessionState,
			crossSession,
			enforcementActions,
		);

		expect(fallbackArtifacts).toEqual([]);
		expect(warnSpy).toHaveBeenCalledOnce();
		const warnArg = warnSpy.mock.calls[0]?.[1];
		expect(warnArg).toMatchObject({
			error: "adr failure",
			sessionId: "artifact-session",
			phase: "design",
		});
	});

	it("stores enforcement decisions for future sessions", async () => {
		const internal = getInternal();
		const persistSpy = vi
			.spyOn(internal, "persistEnforcementHistory")
			.mockResolvedValue();
		const sessionState = createSessionState("history-session");
		const actions: EnforcementAction[] = [
			{
				id: "current-security",
				type: "prompt_for_clarification",
				constraintId: "security",
				description: "Address security deviation",
				interactive: true,
				expectedOutcome: "Alignment achieved",
			},
		];

		await internal.storeEnforcementDecisions(
			sessionState,
			actions,
			"New payment service rollout",
		);

		const history = internal.enforcementHistory.get("security");
		expect(history).toBeDefined();
		expect(history?.length).toBe(1);
		expect(history?.[0]).toMatchObject({
			constraintId: "security",
			sessionId: "history-session",
			enforcement: true,
			context: "New payment service rollout",
		});
		expect(persistSpy).toHaveBeenCalledOnce();
	});

	it("computes raw consistency scores across edge cases", () => {
		const internal = getInternal();
		const noConstraintsScore = internal.calculateRawConsistencyScore([], 0);
		expect(noConstraintsScore).toBe(100);

		const violations: ConstraintConsistencyViolation[] = [
			{
				constraintId: "performance",
				currentSessionId: "session-a",
				conflictingSessionId: "session-b",
				violationType: "enforcement_mismatch",
				description: "Scaling rule applied inconsistently",
				severity: "critical",
				suggestedResolution: "Adopt shared autoscaling policy",
			},
			{
				constraintId: "logging",
				currentSessionId: "session-a",
				conflictingSessionId: "session-c",
				violationType: "decision_conflict",
				description: "Structured logging omitted",
				severity: "warning",
				suggestedResolution: "Restore structured logging",
			},
		];

		const weightedScore = internal.calculateRawConsistencyScore(violations, 5);
		expect(weightedScore).toBeLessThan(100);
		expect(weightedScore).toBeGreaterThanOrEqual(0);
	});

	it("summarizes enforcement outcomes and consequences", () => {
		const internal = getInternal();
		const crossSession = baseCrossSession({
			consistencyScore: 65,
			violations: [
				{
					constraintId: "security",
					currentSessionId: "session-x",
					conflictingSessionId: "session-y",
					violationType: "decision_conflict",
					description: "Zero trust model skipped",
					severity: "critical",
					suggestedResolution: "Restore zero trust controls",
				},
			],
		});
		const enforcementActions: EnforcementAction[] = [
			{
				id: "conflict-security",
				type: "prompt_for_clarification",
				constraintId: "security",
				description: "Align zero trust posture",
				interactive: true,
				expectedOutcome: "Shared enforcement plan",
			},
		];

		const decisionText = internal.generateEnforcementDecisionText(
			crossSession,
			enforcementActions,
		);
		expect(decisionText).toContain(
			"Cross-session constraint consistency enforcement",
		);

		const consequences = internal.generateEnforcementConsequences(crossSession);
		expect(consequences).toContain(
			"Improved constraint consistency across design sessions",
		);
		expect(consequences).toContain("May require additional review");

		const alignments = internal.generateHistoricalAlignments(
			baseCrossSession({
				historicalContext: [
					{
						constraintId: "security",
						sessionId: "session-old",
						timestamp: "2024-04-01T00:00:00.000Z",
						phase: "design",
						decision: "Strict enforcement",
						rationale: "Meets compliance",
						context: "Legacy compliance initiative",
						enforcement: true,
					},
				],
			}),
		);
		expect(alignments).toEqual(["security: Strict enforcement (session-old)"]);
	});

	it("provides descriptive prompts for specific violations", () => {
		const internal = getInternal();
		const violation: ConstraintConsistencyViolation = {
			constraintId: "documentation",
			currentSessionId: "session-d",
			conflictingSessionId: "session-e",
			violationType: "decision_conflict",
			description: "Different doc formats",
			severity: "warning",
			suggestedResolution: "Adopt shared documentation template",
		};
		const prompt = internal.generateContextDrivenPrompt(violation, "design");
		expect(prompt).toContain("Constraint Consistency Validation Required");
		expect(prompt).toContain("Resolution Options");

		const alignmentPrompt = internal.generateSpace7AlignmentPrompt(
			"design",
			baseCrossSession({ consistencyScore: 72 }),
		);
		expect(alignmentPrompt).toContain("Space 7 Instructions Alignment Check");

		const resolutionPrompt = internal.generateViolationResolutionPrompt({
			constraintId: "performance",
			severity: "error",
			message: "Latency exceeds target",
			suggestion: "Scale read replicas",
		});
		expect(resolutionPrompt).toContain("Constraint Violation Resolution");
		expect(resolutionPrompt).toContain("Scale read replicas");
	});
});
