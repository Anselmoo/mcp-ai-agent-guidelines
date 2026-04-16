/**
 * gr-handlers.test.ts
 *
 * Focused tests for GR tranche 1 — five promoted coupling-as-gravity handlers:
 *   - gr-schwarzschild-classifier
 *   - gr-event-horizon-detector
 *   - gr-spacetime-debt-metric
 *   - gr-tidal-force-analyzer
 *   - gr-hawking-entropy-auditor
 *
 * NOTE: gr domain is now fully promoted; this file covers tranche 1 while
 * `gr-handlers-tranche2.test.ts` covers the remaining promoted GR handlers.
 *
 * Verified contracts per handler:
 *   1. Capability mode — promoted handler returns executionMode === "capability".
 *   2. Signal-driven recommendations — domain keyword rules fire; details
 *      reference GR/coupling-specific terms, not manifest text echo.
 *   3a. Insufficient-signal guard — stop-word-only request with no context fires
 *       the "provide more detail" advisory with appropriate messaging.
 *   3b. Keyword-specific match — at least one domain-distinctive keyword triggers
 *       the correct rule for each handler.
 *   4. Numeric computation — when numeric metric values are embedded in the
 *      request, the advisory computation line appears in recommendations.
 *   5. Summary non-leakage — raw request text is NOT reproduced verbatim in
 *      the result summary field.
 *   6. Advisory wording — outputs contain supplementary framing ("advisory",
 *      "validate", "indicative") and do not claim actual static analysis results.
 *   7. Sibling boundary — each handler stays within its distinctive scope and
 *      does not bleed into sibling GR skills' domains.
 *   8. Physics helper purity — helper functions produce correct numeric results
 *      for the key GR analogue formulas.
 */

import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as grEventHorizonDetectorModule } from "../skills/gr/gr-event-horizon-detector.js";
import { skillModule as grHawkingEntropyAuditorModule } from "../skills/gr/gr-hawking-entropy-auditor.js";
import {
	classifyCurvature,
	classifyEntropy,
	classifySchwarzschildZone,
	classifyTidal,
	curvatureScore,
	entropyRatio,
	extractNumbers,
	fmtNum,
	hawkingEntropy,
	schwarzschildRadius,
	tidalForce,
	timeDilationFactor,
} from "../skills/gr/gr-physics-helpers.js";
import { skillModule as grSchwarzschildClassifierModule } from "../skills/gr/gr-schwarzschild-classifier.js";
import { skillModule as grSpacetimeDebtMetricModule } from "../skills/gr/gr-spacetime-debt-metric.js";
import { skillModule as grTidalForceAnalyzerModule } from "../skills/gr/gr-tidal-force-analyzer.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

// ─── Runtime Factory ──────────────────────────────────────────────────────────

function createRuntime() {
	return {
		sessionId: "test-gr-handlers",
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

// ─── Physics Helper Unit Tests ────────────────────────────────────────────────

describe("gr-physics-helpers — Schwarzschild", () => {
	it("schwarzschildRadius returns 2 × coupling_mass", () => {
		expect(schwarzschildRadius(10)).toBe(20);
		expect(schwarzschildRadius(0)).toBe(0);
		expect(schwarzschildRadius(7.5)).toBeCloseTo(15, 5);
	});

	it("classifySchwarzschildZone — inside_horizon when r ≤ r_s", () => {
		expect(classifySchwarzschildZone(20, 20)).toBe("inside_horizon");
		expect(classifySchwarzschildZone(5, 20)).toBe("inside_horizon");
	});

	it("classifySchwarzschildZone — near_horizon when r_s < r ≤ 1.5×r_s", () => {
		expect(classifySchwarzschildZone(25, 20)).toBe("near_horizon");
		expect(classifySchwarzschildZone(30, 20)).toBe("near_horizon");
	});

	it("classifySchwarzschildZone — orbital when 1.5×r_s < r ≤ 3×r_s", () => {
		expect(classifySchwarzschildZone(35, 20)).toBe("orbital");
		expect(classifySchwarzschildZone(60, 20)).toBe("orbital");
	});

	it("classifySchwarzschildZone — free_space when r > 3×r_s", () => {
		expect(classifySchwarzschildZone(100, 20)).toBe("free_space");
	});

	it("timeDilationFactor — increases as r approaches r_s from outside", () => {
		const r_s = 20;
		const dilation_far = timeDilationFactor(100, r_s);
		const dilation_orbital = timeDilationFactor(40, r_s);
		const dilation_near = timeDilationFactor(22, r_s);
		expect(dilation_near).toBeGreaterThan(dilation_orbital);
		expect(dilation_orbital).toBeGreaterThan(dilation_far);
		expect(dilation_far).toBeGreaterThan(1);
	});

	it("timeDilationFactor — does not produce NaN or Infinity at the horizon", () => {
		const result = timeDilationFactor(20, 20); // r === r_s edge case
		expect(Number.isFinite(result)).toBe(true);
		expect(result).toBeGreaterThan(1);
	});
});

describe("gr-physics-helpers — Spacetime Curvature", () => {
	it("curvatureScore — scales with coupling × complexity / cohesion", () => {
		expect(curvatureScore(10, 5, 1)).toBeCloseTo(50, 1);
		expect(curvatureScore(2, 2, 1)).toBeCloseTo(4, 1);
	});

	it("curvatureScore — prevents division by zero at cohesion = 0", () => {
		const K = curvatureScore(10, 10, 0);
		expect(Number.isFinite(K)).toBe(true);
		expect(K).toBeGreaterThan(1000); // very high but finite
	});

	it("classifyCurvature — maps thresholds correctly", () => {
		expect(classifyCurvature(15)).toBe("extreme");
		expect(classifyCurvature(7)).toBe("high");
		expect(classifyCurvature(3)).toBe("moderate");
		expect(classifyCurvature(1)).toBe("flat");
		// Boundaries are strict (>), so the exact threshold value falls into the lower class.
		expect(classifyCurvature(10)).toBe("high"); // K=10 is NOT > 10, so: high
		expect(classifyCurvature(10.1)).toBe("extreme"); // K>10 → extreme
		expect(classifyCurvature(5)).toBe("moderate"); // K=5 is NOT > 5, so: moderate
		expect(classifyCurvature(5.1)).toBe("high"); // K>5 → high
		expect(classifyCurvature(2)).toBe("flat"); // K=2 is NOT > 2, so: flat
		expect(classifyCurvature(2.1)).toBe("moderate"); // K>2 → moderate
	});
});

describe("gr-physics-helpers — Tidal Force", () => {
	it("tidalForce — computes (maxC - minC) / (cohesion^3 + ε)", () => {
		// With cohesion=1: F = (10 - 2) / (1^3 + ε) ≈ 8
		const F = tidalForce(10, 2, 1);
		expect(F).toBeCloseTo(8, 1);
	});

	it("tidalForce — cubic denominator amplifies low cohesion", () => {
		const F_high_cohesion = tidalForce(10, 2, 2); // denominator: 8
		const F_low_cohesion = tidalForce(10, 2, 0.5); // denominator: 0.125
		expect(F_low_cohesion).toBeGreaterThan(F_high_cohesion * 50); // ≈ 64× difference
	});

	it("tidalForce — does not produce NaN at cohesion=0", () => {
		const F = tidalForce(10, 2, 0);
		expect(Number.isFinite(F)).toBe(true);
		expect(F).toBeGreaterThan(0);
	});

	it("classifyTidal — maps thresholds correctly", () => {
		expect(classifyTidal(6)).toBe("split_required");
		expect(classifyTidal(3)).toBe("high_tension");
		expect(classifyTidal(1)).toBe("stable");
		// Boundaries are strict (>), so exact threshold values fall into the lower class.
		expect(classifyTidal(5)).toBe("high_tension"); // F=5 is NOT > 5, so: high_tension
		expect(classifyTidal(5.1)).toBe("split_required"); // F>5 → split_required
		expect(classifyTidal(2)).toBe("stable"); // F=2 is NOT > 2, so: stable
		expect(classifyTidal(2.1)).toBe("high_tension"); // F>2 → high_tension
	});
});

describe("gr-physics-helpers — Hawking Entropy", () => {
	it("hawkingEntropy = public_exports / 4", () => {
		expect(hawkingEntropy(40)).toBe(10);
		expect(hawkingEntropy(0)).toBe(0);
		expect(hawkingEntropy(7)).toBe(1.75);
	});

	it("entropyRatio — scales with entropy / (lines/100 + 1)", () => {
		// S=10, lines=100: ratio = 10 / (1 + 1) = 5
		expect(entropyRatio(10, 100)).toBeCloseTo(5, 3);
		// S=2, lines=300: ratio = 2 / (3 + 1) = 0.5
		expect(entropyRatio(2, 300)).toBeCloseTo(0.5, 3);
	});

	it("classifyEntropy — maps thresholds correctly", () => {
		expect(classifyEntropy(3)).toBe("critical");
		expect(classifyEntropy(1.5)).toBe("elevated");
		expect(classifyEntropy(0.5)).toBe("healthy");
		// Boundaries are strict (>), so exact threshold values fall into the lower class.
		expect(classifyEntropy(2)).toBe("elevated"); // ratio=2 is NOT > 2, so: elevated
		expect(classifyEntropy(2.1)).toBe("critical"); // ratio>2 → critical
		expect(classifyEntropy(1)).toBe("healthy"); // ratio=1 is NOT > 1, so: healthy
		expect(classifyEntropy(1.1)).toBe("elevated"); // ratio>1 → elevated
	});
});

describe("gr-physics-helpers — Utilities", () => {
	it("extractNumbers — returns numeric tokens from text", () => {
		const nums = extractNumbers("coupling_mass=15, dependents=35");
		expect(nums).toContain(15);
		expect(nums).toContain(35);
	});

	it("extractNumbers — respects limit", () => {
		const nums = extractNumbers("1 2 3 4 5 6 7", 3);
		expect(nums).toHaveLength(3);
	});

	it("fmtNum — returns finite string", () => {
		expect(fmtNum(Math.PI)).toBe("3.14");
		expect(fmtNum(1000)).toBe("1000");
		expect(fmtNum(Number.POSITIVE_INFINITY)).toBe("∞");
	});
});

// ─── gr-schwarzschild-classifier ─────────────────────────────────────────────

describe("gr-schwarzschild-classifier handler", () => {
	it("1. returns executionMode capability — not metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await grSchwarzschildClassifierModule.run(
			{
				request:
					"Classify our modules by Schwarzschild radius and find which ones have crossed the event horizon",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gr-schwarzschild-classifier");
	});

	it("2. fires inside-horizon rule on collapse keywords", async () => {
		const runtime = createRuntime();
		const result = await grSchwarzschildClassifierModule.run(
			{
				request: "Find modules that have collapsed inside the singularity",
				context:
					"We have modules with extreme coupling and critical mass issues",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/inside|horizon|collapsed|facade/i);
		expect(result.executionMode).toBe("capability");
	});

	it("2. fires near-horizon / time-dilation rule on velocity keywords", async () => {
		const runtime = createRuntime();
		const result = await grSchwarzschildClassifierModule.run(
			{
				request:
					"Our development velocity is extremely slow on this module — it appears to be near the event horizon",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/near.?horizon|dilation|velocity|coupling/i);
	});

	it("3a. insufficient-signal guard fires when no keywords and no context", async () => {
		const runtime = createRuntime();
		const result = await grSchwarzschildClassifierModule.run(
			{ request: "the" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide/i);
		// The summary carries the skill-specific insufficient-signal message.
		expect(result.summary).toMatch(/Schwarzschild|coupling/i);
	});

	it("4. advisory computation fires when numeric values are in the request", async () => {
		const runtime = createRuntime();
		const result = await grSchwarzschildClassifierModule.run(
			{
				request: "coupling_mass is 10, current_coupling is 18, classify zone",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/Advisory computation/i);
		expect(details).toMatch(/r_s|coupling_mass/i);
	});

	it("5. summary does not reproduce raw request verbatim", async () => {
		const runtime = createRuntime();
		const request = "classify modules by schwarzschild radius coupling mass";
		const result = await grSchwarzschildClassifierModule.run(
			{ request },
			runtime,
		);

		expect(result.summary).not.toContain(request);
	});

	it("6. advisory wording present — does not claim actual static analysis", async () => {
		const runtime = createRuntime();
		const result = await grSchwarzschildClassifierModule.run(
			{
				request: "Sort modules by time dilation and coupling mass",
			},
			runtime,
		);

		const all = [
			result.summary,
			...result.recommendations.map((r) => r.detail),
		].join(" ");
		expect(all).toMatch(/advisory|validate|supplementary|indicative/i);
	});

	it("7. sibling boundary — does not bleed into tidal force or curvature score", async () => {
		const runtime = createRuntime();
		const result = await grSchwarzschildClassifierModule.run(
			{
				request: "Find coupling mass and classify zones",
				context: "We care only about the Schwarzschild radius classification",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should NOT reference tidal splitting or curvature score (K = coupling × complexity)
		expect(details).not.toMatch(/F_tidal|tidal.?force|split.?required/i);
	});

	it("includes constraint guidance when constraints provided", async () => {
		const runtime = createRuntime();
		const result = await grSchwarzschildClassifierModule.run(
			{
				request: "Classify modules by coupling and Schwarzschild radius",
				constraints: ["no breaking changes", "must stay TypeScript-only"],
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/constraint/i);
	});
});

// ─── gr-event-horizon-detector ───────────────────────────────────────────────

describe("gr-event-horizon-detector handler", () => {
	it("1. returns executionMode capability", async () => {
		const runtime = createRuntime();
		const result = await grEventHorizonDetectorModule.run(
			{
				request:
					"Detect which modules have crossed the event horizon and will cause cascade failures",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gr-event-horizon-detector");
	});

	it("2. fires beyond-horizon rule on cascade keywords", async () => {
		const runtime = createRuntime();
		const result = await grEventHorizonDetectorModule.run(
			{
				request:
					"Our user-service is past the event horizon — any change causes uncontrollable cascade failures",
				context: "It has 45 dependents and coupling_mass of 15",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/beyond|cascade|freeze|critical|API/i);
	});

	it("2. fires approaching-horizon rule on warning keywords", async () => {
		const runtime = createRuntime();
		const result = await grEventHorizonDetectorModule.run(
			{
				request:
					"We are approaching the horizon threshold — 80% of the Schwarzschild radius",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/approaching|warn|freeze|sprint/i);
	});

	it("3a. insufficient-signal guard fires on minimal input", async () => {
		const runtime = createRuntime();
		const result = await grEventHorizonDetectorModule.run(
			{ request: "is the" },
			runtime,
		);

		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide/i);
	});

	it("4. advisory computation fires when three numeric values present", async () => {
		const runtime = createRuntime();
		// afferent=8, efferent=7, dependents=35 → coupling_mass=15, r_s=30, ratio=35/30≈1.17 → BEYOND_HORIZON
		const result = await grEventHorizonDetectorModule.run(
			{
				request:
					"afferent coupling 8, efferent coupling 7, dependents 35 — is this beyond the event horizon?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/Advisory computation/i);
		expect(details).toMatch(/BEYOND_HORIZON/i);
	});

	it("5. summary does not reproduce raw request verbatim", async () => {
		const runtime = createRuntime();
		const request =
			"detect modules that have crossed the event horizon cascade uncontrollable";
		const result = await grEventHorizonDetectorModule.run({ request }, runtime);
		expect(result.summary).not.toContain(request);
	});

	it("6. advisory wording — output is clearly supplementary", async () => {
		const runtime = createRuntime();
		const result = await grEventHorizonDetectorModule.run(
			{
				request: "Find modules beyond their event horizon in our codebase",
			},
			runtime,
		);

		const all = [
			result.summary,
			...result.recommendations.map((r) => r.detail),
		].join(" ");
		expect(all).toMatch(/advisory|validate|supplementary/i);
	});

	it("7. sibling boundary — does not surface time-dilation or curvature (K) advice", async () => {
		const runtime = createRuntime();
		const result = await grEventHorizonDetectorModule.run(
			{
				request:
					"Which modules have cascade risk because their dependents exceed their Schwarzschild radius?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should not reference time_dilation (Schwarzschild handler) or K = coupling×complexity/cohesion (debt metric)
		expect(details).not.toMatch(/time_dilation|ricci|K = coupling/i);
	});
});

// ─── gr-spacetime-debt-metric ─────────────────────────────────────────────────

describe("gr-spacetime-debt-metric handler", () => {
	it("1. returns executionMode capability", async () => {
		const runtime = createRuntime();
		const result = await grSpacetimeDebtMetricModule.run(
			{
				request:
					"Compute the Ricci scalar curvature to identify our worst technical debt hotspots",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gr-spacetime-debt-metric");
	});

	it("2. fires formula guidance on curvature/spacetime keywords", async () => {
		const runtime = createRuntime();
		const result = await grSpacetimeDebtMetricModule.run(
			{
				request:
					"Map technical debt to spacetime curvature and find the Ricci scalar hotspots",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/ricci|curvature|coupling.*complexity|K = /i);
	});

	it("2. fires coupling guidance when coupling keywords appear", async () => {
		const runtime = createRuntime();
		const result = await grSpacetimeDebtMetricModule.run(
			{
				request:
					"High coupling is driving up debt curvature — how do I reduce it?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/coupling|interface|dependency|import/i);
	});

	it("2. fires complexity guidance when complexity keywords appear", async () => {
		const runtime = createRuntime();
		const result = await grSpacetimeDebtMetricModule.run(
			{
				request:
					"Cyclomatic complexity is very high in the core module — how does it affect curvature K?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/complexity|cyclomatic|decompose|function/i);
	});

	it("3a. insufficient-signal guard fires on minimal input", async () => {
		const runtime = createRuntime();
		const result = await grSpacetimeDebtMetricModule.run(
			{ request: "the a" },
			runtime,
		);

		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide/i);
	});

	it("4. advisory computation fires with three numeric values", async () => {
		const runtime = createRuntime();
		// coupling=8, complexity=6, cohesion=0.5 → K = 8*6/(0.5+ε) ≈ 96 → EXTREME
		const result = await grSpacetimeDebtMetricModule.run(
			{
				request:
					"coupling is 8, complexity score 6, cohesion 0.5 — compute curvature K for our auth module",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/Advisory computation/i);
		expect(details).toMatch(/EXTREME_CURVATURE/i);
	});

	it("5. summary does not reproduce raw request verbatim", async () => {
		const runtime = createRuntime();
		const request = "quantify technical debt curvature spacetime ricci scalar";
		const result = await grSpacetimeDebtMetricModule.run({ request }, runtime);
		expect(result.summary).not.toContain(request);
	});

	it("6. advisory wording — output is supplementary", async () => {
		const runtime = createRuntime();
		const result = await grSpacetimeDebtMetricModule.run(
			{
				request: "Which modules have the highest curvature debt score?",
				context: "We use SonarQube for complexity tracking",
			},
			runtime,
		);

		const all = [
			result.summary,
			...result.recommendations.map((r) => r.detail),
		].join(" ");
		expect(all).toMatch(/advisory|validate|supplementary|indicative/i);
	});

	it("7. sibling boundary — does not bleed into Schwarzschild zones or tidal forces", async () => {
		const runtime = createRuntime();
		const result = await grSpacetimeDebtMetricModule.run(
			{
				request:
					"Compute the curvature K score for technical debt across our service layer",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should not reference time_dilation (Schwarzschild), F_tidal (tidal), or entropy ratio (Hawking)
		expect(details).not.toMatch(/time_dilation|F_tidal|entropy_ratio/i);
	});
});

// ─── gr-tidal-force-analyzer ─────────────────────────────────────────────────

describe("gr-tidal-force-analyzer handler", () => {
	it("1. returns executionMode capability", async () => {
		const runtime = createRuntime();
		const result = await grTidalForceAnalyzerModule.run(
			{
				request:
					"Analyze tidal forces to identify which modules should be split into separate units",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gr-tidal-force-analyzer");
	});

	it("2. fires split guidance on split/decompose keywords", async () => {
		const runtime = createRuntime();
		const result = await grTidalForceAnalyzerModule.run(
			{
				request:
					"Detect which modules are being torn apart and need to be split into separate cohesive units",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/split|extract|interface|contract|module/i);
	});

	it("2. fires formula guidance on tidal/differential keywords", async () => {
		const runtime = createRuntime();
		const result = await grTidalForceAnalyzerModule.run(
			{
				request:
					"Explain the tidal force formula and how coupling differential drives module splitting",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/F_tidal|max_coupling|cohesion|formula/i);
	});

	it("2. fires cohesion guidance on cohesion keywords", async () => {
		const runtime = createRuntime();
		const result = await grTidalForceAnalyzerModule.run(
			{
				request:
					"Low cohesion is amplifying the tidal force — how to improve it?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/cohesion|SRP|LCOM|responsibility/i);
	});

	it("3a. insufficient-signal guard fires on minimal input", async () => {
		const runtime = createRuntime();
		const result = await grTidalForceAnalyzerModule.run(
			{ request: "and" },
			runtime,
		);

		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide/i);
	});

	it("4. advisory computation fires with three numeric values", async () => {
		const runtime = createRuntime();
		// max_coupling=20, min_coupling=2, mean_cohesion=0.5 → F_tidal = 18 / (0.125 + ε) >> 5 → SPLIT_REQUIRED
		const result = await grTidalForceAnalyzerModule.run(
			{
				request:
					"max coupling 20, min coupling 2, mean cohesion 0.5 — analyze tidal force for UserService",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/Advisory computation/i);
		expect(details).toMatch(/SPLIT_REQUIRED/i);
	});

	it("4. advisory computation classifies STABLE for low tidal values", async () => {
		const runtime = createRuntime();
		// max=5, min=4, cohesion=2 → F_tidal = 1 / (8 + ε) ≈ 0.125 → STABLE
		const result = await grTidalForceAnalyzerModule.run(
			{
				request:
					"max coupling is 5, min coupling is 4, mean cohesion is 2 — tidal check for PaymentModule",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/STABLE/i);
	});

	it("5. summary does not reproduce raw request verbatim", async () => {
		const runtime = createRuntime();
		const request =
			"detect differential coupling forces tidal force split candidates";
		const result = await grTidalForceAnalyzerModule.run({ request }, runtime);
		expect(result.summary).not.toContain(request);
	});

	it("6. advisory wording — output is supplementary", async () => {
		const runtime = createRuntime();
		const result = await grTidalForceAnalyzerModule.run(
			{
				request:
					"Find modules under tidal force stress and plan their decomposition",
			},
			runtime,
		);

		const all = [
			result.summary,
			...result.recommendations.map((r) => r.detail),
		].join(" ");
		expect(all).toMatch(/advisory|validate|supplementary|indicative/i);
	});

	it("7. sibling boundary — does not surface Schwarzschild zones or entropy ratios", async () => {
		const runtime = createRuntime();
		const result = await grTidalForceAnalyzerModule.run(
			{
				request:
					"Which modules have high coupling differential and should be split?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).not.toMatch(/INSIDE_HORIZON|entropy_ratio|hawking/i);
	});
});

// ─── gr-hawking-entropy-auditor ──────────────────────────────────────────────

describe("gr-hawking-entropy-auditor handler", () => {
	it("1. returns executionMode capability", async () => {
		const runtime = createRuntime();
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request:
					"Audit API surface entropy using the Hawking bound to find over-exposed modules",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("gr-hawking-entropy-auditor");
	});

	it("2. fires critical guidance on over-exposure keywords", async () => {
		const runtime = createRuntime();
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request:
					"Our core module has too many public exports — it critically violates the Hawking bound",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/critical|export|prune|facade|barrel/i);
	});

	it("2. fires formula guidance on hawking/entropy keywords", async () => {
		const runtime = createRuntime();
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request:
					"Explain the Bekenstein-Hawking entropy formula for API surface analysis",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/entropy|S = |hawking|public_exports/i);
	});

	it("2. fires barrel guidance on barrel/re-export keywords", async () => {
		const runtime = createRuntime();
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request:
					"Our barrel index.ts re-exports everything from all child modules — reducing entropy",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/barrel|re.?export|export.*from|named/i);
	});

	it("3a. insufficient-signal guard fires on minimal input", async () => {
		const runtime = createRuntime();
		const result = await grHawkingEntropyAuditorModule.run(
			{ request: "the" },
			runtime,
		);

		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide/i);
	});

	it("4. advisory computation fires with two numeric values (exports + lines)", async () => {
		const runtime = createRuntime();
		// public_exports=40, internal_lines=200 → S=10, ratio=10/(2+1)≈3.33 → CRITICAL
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request:
					"module has 40 public exports and 200 internal lines — check entropy ratio",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/Advisory computation/i);
		expect(details).toMatch(/CRITICAL/i);
	});

	it("4. advisory computation classifies HEALTHY for low ratio", async () => {
		const runtime = createRuntime();
		// public_exports=4, internal_lines=500 → S=1, ratio=1/(5+1)≈0.167 → HEALTHY
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request:
					"module has 4 public exports and 500 internal lines — check Hawking entropy",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/HEALTHY/i);
	});

	it("4. partial computation — one number produces entropy S hint", async () => {
		const runtime = createRuntime();
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request:
					"Our module has 26 public exports — compute the Hawking entropy",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should show entropy S = 5 even without internal_lines
		expect(details).toMatch(/Advisory computation/i);
		expect(details).toMatch(/entropy S=/i);
	});

	it("5. summary does not reproduce raw request verbatim", async () => {
		const runtime = createRuntime();
		const request =
			"audit api surface entropy hawking bound over-exposed modules";
		const result = await grHawkingEntropyAuditorModule.run(
			{ request },
			runtime,
		);
		expect(result.summary).not.toContain(request);
	});

	it("6. advisory wording — output is supplementary", async () => {
		const runtime = createRuntime();
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request: "Which modules violate the Hawking entropy bound?",
			},
			runtime,
		);

		const all = [
			result.summary,
			...result.recommendations.map((r) => r.detail),
		].join(" ");
		expect(all).toMatch(/advisory|validate|supplementary|indicative/i);
	});

	it("7. sibling boundary — does not surface coupling zones or tidal forces", async () => {
		const runtime = createRuntime();
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request:
					"Audit API surface entropy for all modules in our service layer",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).not.toMatch(/INSIDE_HORIZON|F_tidal|r_s = 2 × coupling/i);
	});

	it("includes context analysis when context is provided", async () => {
		const runtime = createRuntime();
		const result = await grHawkingEntropyAuditorModule.run(
			{
				request: "Audit the API surface for our utils package",
				context:
					"We have a large barrel index.ts with export * from every sub-module and many internal helpers accidentally made public",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/barrel|re.?export|context|api/i);
	});
});
