import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { confirmationModule } from "../../src/tools/design/confirmation-module.ts";
import type { ConstraintValidationResult } from "../../src/tools/design/constraint-manager.ts";
import { constraintManager } from "../../src/tools/design/constraint-manager.ts";
import type {
	ConfirmationResult,
	DesignPhase,
	DesignSessionState,
} from "../../src/tools/design/types/index.ts";

interface InternalConfirmationModule {
	executeMicroMethods: (
		phase: DesignPhase,
		content: string,
		sessionState: DesignSessionState,
	) => Promise<Record<string, unknown>>;
	validatePhaseCompletion: (
		phase: DesignPhase,
		content: string,
	) => { status: string; completeness: number; missing: string[] };
	checkCoverageThreshold: (
		phase: DesignPhase,
		content: string,
		sessionState: DesignSessionState,
	) => { status: string; coverage: number; threshold: number };
	verifyConstraintCompliance: (
		content: string,
		sessionState: DesignSessionState,
	) => { status: string; violations: number; details: unknown };
	assessOutputQuality: (
		content: string,
		phase: DesignPhase,
	) => { status: string; quality: number; factors: Record<string, number> };
	confirmStakeholderApproval: (
		phase: DesignPhase,
		sessionState: DesignSessionState,
	) => { status: string; approval: boolean };
	checkRequiredOutputs: (
		content: string,
		requiredOutputs: string[],
	) => string[];
	extractAlternatives: (content: string) => unknown[];
	extractRisks: (content: string, result: ConfirmationResult) => unknown[];
	microMethods: string[];
	rationaleHistory: Map<string, unknown>;
}

const getInternal = (): InternalConfirmationModule =>
	confirmationModule as unknown as InternalConfirmationModule;

let defaultMicroMethods: string[] = [];

const createSessionState = (): DesignSessionState => ({
	config: {
		sessionId: "confirmation-private-helpers",
		context: "API modernization",
		goal: "Deliver resilient services",
		requirements: ["scale", "observe"],
		constraints: [
			{
				id: "security",
				name: "Security",
				type: "non-functional",
				category: "security",
				description: "Ensure encryption and zero trust",
				validation: {
					minCoverage: 80,
					keywords: ["encryption", "zero trust"],
				},
				weight: 1,
				mandatory: true,
				source: "policy",
			},
		],
		coverageThreshold: 80,
		enablePivots: false,
		templateRefs: [],
		outputFormats: ["markdown"],
		metadata: {},
	},
	currentPhase: "design",
	phases: {
		design: {
			id: "design",
			name: "Design",
			description: "Design the platform",
			inputs: ["requirements"],
			outputs: ["architecture doc", "risk register"],
			criteria: ["describe interfaces", "note resiliency"],
			coverage: 65,
			status: "in-progress",
			artifacts: [],
			dependencies: [],
		},
	},
	coverage: {
		overall: 60,
		phases: { design: 65 },
		constraints: { security: 60 },
		assumptions: {},
		documentation: {},
		testCoverage: 55,
	},
	artifacts: [],
	history: [],
	status: "active",
});

const createConfirmationResult = (): ConfirmationResult => ({
	passed: false,
	coverage: 45,
	issues: ["Phase coverage below target"],
	recommendations: ["Include resiliency plan"],
	nextSteps: ["Draft mitigation roadmap"],
	canProceed: false,
	phase: "design",
});

describe("confirmationModule private helpers", () => {
	beforeEach(async () => {
		await confirmationModule.initialize();
		const internal = getInternal();
		internal.rationaleHistory = new Map();
		defaultMicroMethods = [
			...constraintManager.getMicroMethods("confirmation"),
		];
		internal.microMethods = [...defaultMicroMethods];
	});

	afterEach(() => {
		vi.restoreAllMocks();
		getInternal().microMethods = [...defaultMicroMethods];
	});

	it("executes configured micro methods and handles errors", async () => {
		const internal = getInternal();
		const sessionState = createSessionState();
		const phase = sessionState.phases.design;
		const content = `# Design Summary

## Security
- Encryption approach documented for all services
- Zero trust controls outlined with policy automation

## Deliverables
Architecture doc and risk register include escalation paths.`;

		internal.microMethods = [
			"validate_phase_completion",
			"check_coverage_threshold",
			"verify_constraint_compliance",
			"assess_output_quality",
			"confirm_stakeholder_approval",
			"unknown_micro_method",
		];

		const failure = new Error("forced failure");
		const validateSpy = vi
			.spyOn(internal, "validatePhaseCompletion")
			.mockImplementation(() => {
				throw failure;
			});

		const constraintValidation: ConstraintValidationResult = {
			passed: false,
			coverage: 42,
			violations: [
				{
					constraintId: "security",
					severity: "error",
					message: "Missing encryption details",
					suggestion: "Describe encryption posture",
				},
			],
			recommendations: ["Expand security posture section"],
		};

		const validateConstraintsSpy = vi
			.spyOn(constraintManager, "validateConstraints")
			.mockReturnValue(constraintValidation);

		const coverageSpy = vi
			.spyOn(constraintManager, "generateCoverageReport")
			.mockReturnValue({
				overall: 92,
				phases: { design: 92 },
				constraints: { security: 95 },
				details: constraintValidation,
			});

		const results = await internal.executeMicroMethods(
			phase,
			content,
			sessionState,
		);

		expect(results.validate_phase_completion).toMatchObject({
			status: "error",
		});
		expect(results.check_coverage_threshold).toMatchObject({
			status: "passed",
			coverage: 92,
			threshold: 80,
		});
		expect(results.verify_constraint_compliance).toMatchObject({
			status: "violations_found",
			violations: 1,
		});
		const qualityStatus = (results.assess_output_quality as { status: string })
			.status;
		expect(["acceptable", "good"]).toContain(qualityStatus);
		expect(results.confirm_stakeholder_approval).toMatchObject({
			status: "pending",
			approval: false,
		});
		expect(results.unknown_micro_method).toMatchObject({
			status: "not_implemented",
		});
		expect(validateSpy).toHaveBeenCalledOnce();
		expect(validateConstraintsSpy).toHaveBeenCalled();
		expect(coverageSpy).toHaveBeenCalled();
	});

	it("calculates output quality across score brackets", () => {
		const internal = getInternal();
		const phase = createSessionState().phases.design;

		const poor = internal.assessOutputQuality("brief note", phase);
		expect(poor.status).toBe("needs_improvement");

		const acceptableContent = `
			The architecture doc outlines interfaces and resiliency.
			It discusses encryption and zero trust practices.
			Risk register entries are drafted with mitigation steps.
		`;
		const acceptable = internal.assessOutputQuality(acceptableContent, phase);
		expect(acceptable.status).toBe("acceptable");

		const highQualityContent = `# Design Overview

## Interfaces
- API Gateway integrates services
- Async messaging coordinates workloads

## Resiliency Plan
Detailed architecture doc covers failover, rate limiting, and observability.
The risk register notes remaining concerns and mitigations.
`;
		const excellent = internal.assessOutputQuality(highQualityContent, phase);
		expect(excellent.status).toBe("good");
	});

	it("evaluates required outputs and alternative extraction helpers", () => {
		const internal = getInternal();
		const missing = internal.checkRequiredOutputs(
			"Document references architecture doc but omits the detailed risk log",
			["architecture doc", "risk-register"],
		);
		expect(missing).toEqual(["risk-register"]);

		const alternatives = internal.extractAlternatives(
			"Alternatively we could adopt async messaging. Another option to simplify is using managed services.",
		);
		expect(alternatives.length).toBeGreaterThanOrEqual(2);
	});

	it("collects risks from confirmation results and narrative", () => {
		const internal = getInternal();
		const confirmationResult = createConfirmationResult();
		const risks = internal.extractRisks(
			"There is a risk of latency spikes if caching fails.",
			confirmationResult,
		);

		expect(risks.length).toBeGreaterThanOrEqual(2);
		const ids = risks.map((entry) => (entry as { id: string }).id);
		expect(new Set(ids).size).toBe(risks.length);
	});
});
