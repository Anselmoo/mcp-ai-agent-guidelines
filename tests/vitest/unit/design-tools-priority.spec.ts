import { describe, expect, it } from "vitest";
import { confirmationModule } from "../../../src/tools/design/confirmation-module";
import { constraintManager } from "../../../src/tools/design/constraint-manager";
import { crossSessionConsistencyEnforcer } from "../../../src/tools/design/cross-session-consistency-enforcer";
// Import built/dist modules via src when running in dev; tests use runtime imports
import { designAssistant } from "../../../src/tools/design/design-assistant";
import { methodologySelector } from "../../../src/tools/design/methodology-selector";
import type {
	ConstraintRule,
	CoverageReport,
	DesignSessionConfig,
	DesignSessionState,
} from "../../../src/tools/design/types";

function makeMinimalSession(): DesignSessionState {
	const config: DesignSessionConfig = {
		sessionId: "s-min",
		context: "test",
		goal: "g",
		requirements: [],
		constraints: [],
		coverageThreshold: 85,
		enablePivots: false,
		templateRefs: [],
		outputFormats: ["markdown"],
		metadata: {},
	};

	const coverage: CoverageReport = {
		overall: 0,
		phases: {},
		constraints: {},
		assumptions: {},
		documentation: {},
		testCoverage: 0,
	};

	return {
		config,
		currentPhase: "init",
		phases: {},
		coverage,
		artifacts: [],
		history: [],
		status: "active",
	};
}

describe("Priority design tools - targeted tests", () => {
	it("designAssistant.createSession works for minimal config", async () => {
		const resp = await designAssistant.createSession({
			context: "c",
			goal: "g",
			requirements: [],
		});
		expect(resp).toBeDefined();
		// minimal relaxation of typing for existing API shape
		expect((resp as unknown as { sessionId?: string }).sessionId).toBeDefined();
	});

	it("confirmationModule.confirmPhase returns a basic result for minimal session", async () => {
		await confirmationModule.initialize();
		const sessionState = makeMinimalSession();

		const out = await confirmationModule.confirmPhase(sessionState, "design");
		expect(out).toBeDefined();
	});

	it("constraintManager.getConstraints returns array and can be updated", async () => {
		// Ensure getConstraints always returns array
		const before = constraintManager.getConstraints();
		expect(Array.isArray(before)).toBe(true);

		// Add a dummy constraint via the public API
		const session = makeMinimalSession();
		const dummy: ConstraintRule = {
			id: "c-test",
			name: "C",
			type: "functional",
			category: "test",
			description: "dummy",
			validation: { minCoverage: 10 },
			weight: 1,
			mandatory: false,
			source: "test",
		};

		await constraintManager.addConstraint(session, dummy);
		const after = constraintManager.getConstraints();
		expect(after.find((c) => c.id === "c-test")).toBeDefined();
	});

	it("crossSessionConsistencyEnforcer records decisions and enforces consistency safely", async () => {
		await crossSessionConsistencyEnforcer.initialize();
		const decisions = {
			d1: {
				sessionId: "s1",
				constraintId: "c1",
				decision: "approved",
				rationale: "",
				timestamp: new Date().toISOString(),
			},
		};
		crossSessionConsistencyEnforcer.recordConstraintDecisions(decisions);

		const sessionState = makeMinimalSession();
		const res =
			await crossSessionConsistencyEnforcer.enforceConsistency(sessionState);
		expect(res).toBeDefined();
	});

	it("methodologySelector.selectMethodology suggests a methodology for simple contexts", async () => {
		await methodologySelector.initialize();
		const sel = await methodologySelector.selectMethodology({
			context: "simple context",
			requirements: ["x"],
			constraints: [],
		});
		expect(sel).toBeDefined();
		expect(sel.methodology).toBeDefined();
		expect(typeof sel.confidence).toBe("number");
	});
});
