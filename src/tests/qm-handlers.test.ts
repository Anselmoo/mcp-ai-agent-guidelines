/**
 * qm-handlers.test.ts
 *
 * Focused tests for QM Tranche 1 — five promoted capability handlers:
 *   - qm-uncertainty-tradeoff    (Heisenberg coupling × cohesion tension)
 *   - qm-superposition-generator (Born-rule candidate ranking)
 *   - qm-measurement-collapse    (code-review decision backaction)
 *   - qm-decoherence-sentinel    (flaky-test channel classification)
 *   - qm-tunneling-breakthrough  (WKB refactoring viability)
 *
 * The QM domain is now fully promoted; this file covers tranche 1 while
 * `qm-handlers-tranche2.test.ts` covers the remaining promoted QM handlers.
 *
 * Verified contracts per handler:
 *   1. Capability mode — promoted handler returns executionMode === "capability".
 *   2. Signal-driven recommendations — domain keyword rules fire; details
 *      reference algorithm-specific terms, not manifest text echo.
 *   3. Insufficient-signal guard — stop-word-only or off-topic request fires
 *      the advisory guard result (executionMode === "capability").
 *   4. Advisory framing — outputs do NOT claim physics computation, exact
 *      probability values, or live execution.
 *   5. Physics disclaimer — QM_ADVISORY_DISCLAIMER appears in successful outputs.
 *   6. Summary non-leakage — raw request text is not reproduced verbatim.
 *   7. Domain boundary — each handler stays within its declared scope.
 */

import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as qmDecoherenceSentinelModule } from "../skills/qm/qm-decoherence-sentinel.js";
import { skillModule as qmMeasurementCollapseModule } from "../skills/qm/qm-measurement-collapse.js";
import { skillModule as qmSuperpositionGeneratorModule } from "../skills/qm/qm-superposition-generator.js";
import { skillModule as qmTunnelingBreakthroughModule } from "../skills/qm/qm-tunneling-breakthrough.js";
import { skillModule as qmUncertaintyTradeoffModule } from "../skills/qm/qm-uncertainty-tradeoff.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

function createRuntime() {
	return {
		sessionId: "test-qm-handlers",
		executionState: {
			instructionStack: [],
			progressRecords: [],
		},
		sessionStore: {
			async readSessionHistory() {
				return [];
			},
			async writeSessionHistory() {
				return;
			},
			async appendSessionHistory() {
				return;
			},
		},
		instructionRegistry: new InstructionRegistry(),
		skillRegistry: new SkillRegistry({ workspace: null }),
		modelRouter: new ModelRouter(),
		workflowEngine: new WorkflowEngine(),
	};
}

// ─── qm-uncertainty-tradeoff ──────────────────────────────────────────────────

describe("qm-uncertainty-tradeoff handler", () => {
	// 1. Capability mode
	it("returns executionMode capability — not the metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{
				request:
					"Which modules have both high coupling and low cohesion in our codebase?",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("qm-uncertainty-tradeoff");
	});

	// 2. Signal-driven — coupling rules fire
	it("fires coupling rules on coupling keywords", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{
				request:
					"Find modules with high fan-out coupling and tight dependencies causing Pareto violations",
				context:
					"Our monolith has 120 modules. Several have EC > 15 and LCOM > 0.8 simultaneously.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/coupl|afferent|efferent/i);
		expect(details).toMatch(/pareto|violat|both|simultaneously/i);
	});

	// 2. Signal-driven — cohesion rules fire
	it("fires cohesion rules on SRP/cohesion keywords", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{
				request:
					"Identify god classes with mixed concerns and low cohesion that also have high coupling",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/cohes|LCOM|responsib/i);
	});

	// 3. Insufficient-signal guard — empty request
	it("fires insufficient-signal guard on empty request with no context", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{ request: "help me" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allText = result.recommendations.map((r) => r.detail).join(" ");
		expect(allText).toMatch(/metric|coupl|cohes|describe/i);
	});

	// 4. Advisory framing — no physics claim
	it("output does not claim to be an exact physics computation", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{
				request:
					"Compute the exact Heisenberg uncertainty product for our modules using coupling and cohesion metrics",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should contain advisory framing, not exact computation claim
		expect(details).toMatch(/advisory|supplementary|lens|metaphor|analogy/i);
	});

	// 5. Physics disclaimer present
	it("includes the QM advisory disclaimer in successful outputs", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{
				request:
					"Find modules violating the coupling-cohesion uncertainty principle",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/supplementary lens|advisory|not a physics simulation/i,
		);
	});

	// 6. Summary non-leakage
	it("summary does not reproduce the raw request verbatim", async () => {
		const rawRequest =
			"Find all modules with both high coupling and low cohesion metrics that are Pareto violations";
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{ request: rawRequest },
			runtime,
		);

		expect(result.summary).not.toContain(rawRequest);
	});

	// 7. Domain boundary — does not advise on time-series metric drift (heisenberg-picture)
	it("does not surface Heisenberg-picture time-drift analysis for a static snapshot request", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{
				request: "Which modules have coupling and cohesion tension right now?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should not advise on operator drift over time (that belongs to qm-heisenberg-picture)
		expect(details).not.toMatch(
			/operator.*time|time.*drift.*metric.*operator/i,
		);
	});

	// Options: metricPair complexity-coverage
	it("switches to complexity-coverage axis when metricPair option is set", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{
				request:
					"Find modules with high cyclomatic complexity and low test coverage",
				options: { metricPair: "complexity-coverage" },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// Summary reflects the complexity ↔ test-coverage label from METRIC_PAIR_LABELS
		expect(result.summary).toMatch(/complexity.*coverage/i);
	});

	it("prepends an illustrative uncertainty product when numeric options are provided", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{
				request: "Assess coupling and cohesion tension for this module",
				options: { coupling: 0.8, cohesionDeficit: 0.6 },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const firstDetail = result.recommendations[0]?.detail ?? "";
		const allDetails = result.recommendations.map((r) => r.detail).join(" ");
		expect(firstDetail).toMatch(/Illustrative|supplementary/i);
		expect(firstDetail).toMatch(/\d/);
		expect(allDetails).toMatch(
			/supplementary lens|advisory|not a physics simulation/i,
		);
	});

	it("rejects out-of-range numeric options gracefully", async () => {
		const runtime = createRuntime();
		const result = await qmUncertaintyTradeoffModule.run(
			{
				request: "Assess coupling and cohesion tension for this module",
				options: { coupling: 1.2, cohesionDeficit: 0.6 },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allText = result.recommendations.map((r) => r.detail).join(" ");
		expect(allText).toMatch(
			/provide a more specific request|targeted recommendations/i,
		);
	});
});

// ─── qm-superposition-generator ──────────────────────────────────────────────

describe("qm-superposition-generator handler", () => {
	// 1. Capability mode
	it("returns executionMode capability — not the metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{
				request:
					"Rank these three candidate implementations and select the best one",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("qm-superposition-generator");
	});

	// 2. Signal-driven — ranking rules fire
	it("fires ranking and criteria rules on candidate evaluation keywords", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{
				request:
					"How do I rank five competing API implementations to pick the best one for production?",
				context:
					"We have five implementations differing in latency, maintainability, and output quality.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/rank|criterion|weight|criteria/i);
		expect(details).toMatch(/candidat|option|approach/i);
	});

	// 2. Signal-driven — Born-rule vocabulary fires
	it("fires Born-rule and amplitude rules on quantum vocabulary", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{
				request:
					"Use Born-rule probability to collapse the superposition of implementations to the winner",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/born.rule|amplitude|probabilit|collapse/i);
	});

	// 3. Insufficient-signal guard
	it("fires insufficient-signal guard when no candidates are described", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{ request: "help pick the best option" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allText = result.recommendations.map((r) => r.detail).join(" ");
		expect(allText).toMatch(/candidat|option|choose between|describe/i);
	});

	// 5. Physics disclaimer
	it("includes the QM advisory disclaimer in successful outputs", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{
				request:
					"Which of these three candidate implementations should I select: option A, option B, or option C?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/supplementary lens|advisory|not a physics simulation/i,
		);
	});

	// 6. Summary non-leakage
	it("summary does not reproduce the raw request verbatim", async () => {
		const rawRequest =
			"Rank these three candidate implementations and select the best one for the project";
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{ request: rawRequest },
			runtime,
		);

		expect(result.summary).not.toContain(rawRequest);
	});

	// 4. Advisory framing — no claim of live computation
	it("output does not claim to execute a probabilistic algorithm live", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{
				request:
					"Run Born-rule probability computation on these candidates and give me the exact probability values",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/advisory|supplementary|metaphor|analogy|heuristic|framework/i,
		);
	});

	// Options: selectionCriteria quality
	it("reflects explicit selectionCriteria option in summary", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{
				request:
					"Which implementation variant should I choose based on quality?",
				options: { selectionCriteria: "quality" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/quality/i);
	});

	// Options: candidateCount reflected in summary
	it("reflects explicit candidateCount in summary", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{
				request:
					"Rank these 4 candidate approaches using the superposition framework",
				options: { candidateCount: 4 },
			},
			runtime,
		);

		expect(result.summary).toMatch(/4 candidates/i);
	});

	it("prepends an illustrative Born-rule ranking when numeric scores are provided", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{
				request: "Rank these candidate implementations for selection",
				options: { scores: [9, 6, 3] },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const firstDetail = result.recommendations[0]?.detail ?? "";
		const allDetails = result.recommendations.map((r) => r.detail).join(" ");
		expect(firstDetail).toMatch(/Illustrative|Born-rule|supplementary/i);
		expect(firstDetail).toMatch(/\d/);
		expect(allDetails).toMatch(
			/supplementary lens|advisory|not a physics simulation/i,
		);
	});

	it("rejects out-of-range score arrays gracefully", async () => {
		const runtime = createRuntime();
		const result = await qmSuperpositionGeneratorModule.run(
			{
				request: "Rank these candidate implementations for selection",
				options: { scores: [9, -1, 3] },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allText = result.recommendations.map((r) => r.detail).join(" ");
		expect(allText).toMatch(
			/provide a more specific request|targeted recommendations/i,
		);
	});
});

// ─── qm-measurement-collapse ─────────────────────────────────────────────────

describe("qm-measurement-collapse handler", () => {
	// 1. Capability mode
	it("returns executionMode capability — not the metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{
				request:
					"We chose implementation A in code review — which adjacent modules are affected?",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("qm-measurement-collapse");
	});

	// 2. Signal-driven — adjacent module backaction rules fire
	it("fires adjacent-module backaction rules on review decision keywords", async () => {
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{
				request:
					"After choosing impl-B in review, which downstream callers and dependents need to be reviewed for backaction?",
				context:
					"impl-B changes the public API signature of the UserService. Three modules depend on UserService directly.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/adjacent|depend|caller|downstream|backaction/i);
	});

	// 2. Signal-driven — interface contract rules fire
	it("fires interface and contract rules on API/signature keywords", async () => {
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{
				request:
					"The selected implementation changes the TypeScript interface contract — which consumers are disturbed?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/interface|contract|api|signature|consumer/i);
	});

	// 3. Insufficient-signal guard
	it("fires insufficient-signal guard on non-review request", async () => {
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{ request: "What should I do today?" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
	});

	// 5. Physics disclaimer
	it("includes the QM advisory disclaimer in successful outputs", async () => {
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{
				request:
					"We selected the new caching implementation — what is the backaction on adjacent modules?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/supplementary lens|advisory|not a physics simulation/i,
		);
	});

	// 6. Summary non-leakage
	it("summary does not reproduce the raw request verbatim", async () => {
		const rawRequest =
			"We chose implementation A in code review — identify which adjacent modules experience backaction and require review";
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{ request: rawRequest },
			runtime,
		);

		expect(result.summary).not.toContain(rawRequest);
	});

	// 7. Domain boundary — does not advise on pre-decision candidate ranking
	it("does not advise on pre-decision probability ranking (superposition-generator boundary)", async () => {
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{
				request:
					"After selecting impl-X, check what modules are affected by the decision",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should focus on post-decision backaction, not pre-decision ranking
		expect(details).not.toMatch(
			/born.rule.*rank.*before.*decision|probability.*rank.*candidates.*pick/i,
		);
	});

	// Options: collapseScope reflected in summary
	it("reflects explicit collapseScope option in summary", async () => {
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{
				request:
					"We adopted the new auth service — assess cross-cutting backaction",
				options: { collapseScope: "cross-cutting" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/cross.cutting/i);
	});

	it("prepends an illustrative backaction estimate when numeric options are provided", async () => {
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{
				request: "We selected the new cache implementation in code review",
				options: { selectedSimilarity: 0.7, adjacentCount: 10 },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const firstDetail = result.recommendations[0]?.detail ?? "";
		const allDetails = result.recommendations.map((r) => r.detail).join(" ");
		expect(firstDetail).toMatch(/Illustrative|supplementary/i);
		expect(firstDetail).toMatch(/\d/);
		expect(allDetails).toMatch(
			/supplementary lens|advisory|not a physics simulation/i,
		);
	});

	it("rejects out-of-range backaction options gracefully", async () => {
		const runtime = createRuntime();
		const result = await qmMeasurementCollapseModule.run(
			{
				request: "We selected the new cache implementation in code review",
				options: { selectedSimilarity: 1.2, adjacentCount: 10 },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allText = result.recommendations.map((r) => r.detail).join(" ");
		expect(allText).toMatch(
			/provide a more specific request|targeted recommendations/i,
		);
	});
});

// ─── qm-decoherence-sentinel ─────────────────────────────────────────────────

describe("qm-decoherence-sentinel handler", () => {
	// 1. Capability mode
	it("returns executionMode capability — not the metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request:
					"Classify our flaky tests by decoherence channel and compute coherence time T₂",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("qm-decoherence-sentinel");
	});

	// 2. Signal-driven — timing channel rules fire
	it("fires timing-channel rules on sleep/race-condition keywords", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request:
					"Our integration tests are flaky because of sleep() calls and race conditions in async code",
				context:
					"We have 12 tests that fail intermittently in CI but pass locally. Most use arbitrary sleep(500) waits.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/timing|sleep|race|async|wait/i);
	});

	// 2. Signal-driven — resource-channel rules fire
	it("fires resource-channel rules on shared-state/connection keywords", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request:
					"Tests fail when run in parallel due to shared mutable singleton state and database connection pool exhaustion",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/shared.state|mutable|singleton|resource.leak|pool|connection/i,
		);
	});

	// 2. Signal-driven — ordering-channel rules fire
	it("fires ordering-channel rules on execution-order keywords", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request:
					"Tests pass in a fixed order but fail when randomised — they depend on previous test state",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/order|sequence|depend.on.prev|run.before/i);
	});

	// 2. Signal-driven — quarantine rules fire
	it("fires quarantine rules on skip/quarantine keywords", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request:
					"Should I quarantine or skip the flaky tests while I fix them?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/quarantin|skip|isolat|tag|suite/i);
	});

	// 3. Insufficient-signal guard
	it("fires insufficient-signal guard on no-flakiness request", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{ request: "make our tests better" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
	});

	// 5. Physics disclaimer
	it("includes the QM advisory disclaimer in successful outputs", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request:
					"Classify these intermittent test failures using decoherence channels",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/supplementary lens|advisory|not a physics simulation/i,
		);
	});

	// 6. Summary non-leakage
	it("summary does not reproduce the raw request verbatim", async () => {
		const rawRequest =
			"Classify our flaky tests by decoherence channel and compute coherence time T₂ for each";
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{ request: rawRequest },
			runtime,
		);

		expect(result.summary).not.toContain(rawRequest);
	});

	// 7. Domain boundary — does not advise on test coverage vs. bug patterns
	it("does not surface Born-rule coverage probability advice (wavefunction-coverage boundary)", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request:
					"Which flaky tests are covering our most critical bug-prone modules?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should focus on flakiness classification, not wavefunction overlap with bugs
		expect(details).not.toMatch(
			/wavefunction.*overlap.*bug|born.rule.*coverage.*bug.pattern/i,
		);
	});

	// Options: primaryChannel reflected in summary
	it("reflects explicit primaryChannel option in summary", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request: "Classify our CI-only test failures by environment factors",
				options: { primaryChannel: "environment" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/environment/i);
	});

	it("prepends an illustrative T₂ computation when numeric rates are provided", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request: "Classify flaky tests with timing and resource channel rates",
				options: { timingRate: 0.2, resourceRate: 0.1, orderingRate: 0.05 },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const firstDetail = result.recommendations[0]?.detail ?? "";
		const allDetails = result.recommendations.map((r) => r.detail).join(" ");
		expect(firstDetail).toMatch(/Illustrative|supplementary/i);
		expect(firstDetail).toMatch(/\d/);
		expect(allDetails).toMatch(
			/supplementary lens|advisory|not a physics simulation/i,
		);
	});

	it("rejects out-of-range decoherence rates gracefully", async () => {
		const runtime = createRuntime();
		const result = await qmDecoherenceSentinelModule.run(
			{
				request: "Classify flaky tests with timing and resource channel rates",
				options: { timingRate: 1.2, resourceRate: 0.1 },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allText = result.recommendations.map((r) => r.detail).join(" ");
		expect(allText).toMatch(
			/provide a more specific request|targeted recommendations/i,
		);
	});
});

// ─── qm-tunneling-breakthrough ───────────────────────────────────────────────

describe("qm-tunneling-breakthrough handler", () => {
	// 1. Capability mode
	it("returns executionMode capability — not the metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request:
					"Should we attempt the legacy authentication refactoring now or defer it?",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("qm-tunneling-breakthrough");
	});

	// 2. Signal-driven — barrier and legacy rules fire
	it("fires barrier and legacy rules on legacy/debt keywords", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request:
					"Assess whether we can tunnel through the technical debt barrier and refactor the legacy payment module this sprint",
				context:
					"The payment module has high coupling (EC=18), low test coverage (22%), and is unfamiliar to the current team.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/legacy|technical.debt|barrier|coupl|coverage/i);
	});

	// 2. Signal-driven — migration/strangler fig rules fire
	it("fires migration rules on migration/replacement keywords", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request:
					"We want to migrate from the old REST client to the new gRPC client across 30 services",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/migrat|strangler|incrementally|caller/i);
	});

	// 2. Signal-driven — test coverage as energy rules fire
	it("fires coverage-as-energy rules on coverage keywords", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request:
					"We have 15% test coverage on the target refactoring — is this enough to proceed safely?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/coverage|characterisat|test|energy|safe/i);
	});

	// 2. Signal-driven — code freeze rules fire
	it("fires freeze rules on release/freeze keywords", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request:
					"We are two weeks from a code freeze — should we still attempt this refactoring?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/freeze|release|deadline|partial|revert/i);
	});

	// 3. Insufficient-signal guard — no refactoring context
	it("fires insufficient-signal guard on request without refactoring signal", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{ request: "help me think about this problem" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
	});

	// 5. Physics disclaimer
	it("includes the QM advisory disclaimer in successful outputs", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request:
					"Assess the WKB tunneling probability for our database migration",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/supplementary lens|advisory|not a physics simulation|heuristic/i,
		);
	});

	// 6. Summary non-leakage
	it("summary does not reproduce the raw request verbatim", async () => {
		const rawRequest =
			"Should we attempt the legacy authentication refactoring now or defer it to next quarter";
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{ request: rawRequest },
			runtime,
		);

		expect(result.summary).not.toContain(rawRequest);
	});

	// 7. Domain boundary — does not drift into business prioritisation
	it("does not surface business-value prioritisation advice (strat-prioritization boundary)", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request:
					"Should we refactor the billing module given our technical debt and business priorities?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should advise on technical feasibility, not business ROI ranking
		expect(details).not.toMatch(
			/business.value.*rank|roi.*prioritis|revenue.*weigh.*refactor/i,
		);
	});

	// Options: barrierRisk + teamEnergy reflected in summary
	it("reflects barrierRisk and teamEnergy options in summary viability signal", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request:
					"Assess whether to refactor the monolithic order processor now",
				options: { barrierRisk: "high", teamEnergy: "low" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/unfavourable|defer/i);
	});

	it("produces favourable signal for low barrier with high team energy", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request:
					"Refactor the small utility module during our refactoring sprint",
				options: { barrierRisk: "low", teamEnergy: "high" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/favourable|attempt/i);
	});

	it("prepends an illustrative WKB estimate when numeric options are provided", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request: "Assess whether we should refactor the legacy payment module",
				options: {
					barrierWidth: 0.3,
					barrierHeight: 0.7,
					teamEnergyLevel: 0.5,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const firstDetail = result.recommendations[0]?.detail ?? "";
		const allDetails = result.recommendations.map((r) => r.detail).join(" ");
		expect(firstDetail).toMatch(/heuristic|supplementary|WKB/i);
		expect(firstDetail).toMatch(/\d/);
		expect(allDetails).toMatch(
			/supplementary lens|advisory|not a physics simulation/i,
		);
	});

	it("ranks structured refactoring candidates in descending tunneling probability", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request: "rank these refactorings by tunneling viability",
				options: {
					candidates: [
						{
							name: "replace-legacy-orm",
							barrier_width: 0.9,
							barrier_height: 0.9,
							energy: 0.35,
						},
						{
							name: "extract-service-layer",
							barrier_width: 0.2,
							barrier_height: 0.45,
							energy: 0.65,
						},
						{
							name: "migrate-to-typescript",
							barrier_width: 0.65,
							barrier_height: 0.75,
							energy: 0.5,
						},
					],
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/top candidate: extract-service-layer/i);
		const rankingArtifact = result.artifacts?.find(
			(artifact) => artifact.kind === "comparison-matrix",
		);
		expect(rankingArtifact).toMatchObject({
			kind: "comparison-matrix",
			rows: [
				{ label: "extract-service-layer" },
				{ label: "migrate-to-typescript" },
				{ label: "replace-legacy-orm" },
			],
		});
	});

	it("rejects out-of-range tunneling options gracefully", async () => {
		const runtime = createRuntime();
		const result = await qmTunnelingBreakthroughModule.run(
			{
				request: "Assess whether we should refactor the legacy payment module",
				options: {
					barrierWidth: 1.2,
					barrierHeight: 0.7,
					teamEnergyLevel: 0.5,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allText = result.recommendations.map((r) => r.detail).join(" ");
		expect(allText).toMatch(
			/provide a more specific request|targeted recommendations/i,
		);
	});
});

// ─── promoted QM tranche 2 — registry execution path ─────────────────────────
//
// These skills now execute through promoted capability handlers in the hidden
// skill registry. The test below proves the registry path resolves to the
// handwritten handler rather than the metadata fallback.

describe("promoted QM tranche 2 — registry execution path", () => {
	it("qm-bloch-interpolator executes through the promoted registry path", async () => {
		const runtime = createRuntime();
		const result = await runtime.skillRegistry.execute(
			"qm-bloch-interpolator",
			{
				request:
					"Show me the intermediate steps between OOP and functional style on the Bloch sphere",
				physicsAnalysisJustification:
					"Bloch-sphere interpolation is the canonical physics metaphor for reasoning about gradual style migrations between two architectural poles.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("qm-bloch-interpolator");
		expect(result.summary).toMatch(/Bloch Interpolator produced/i);
		expect(result.recommendations[0]?.title).not.toBe("Purpose");
		expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
	});
});
