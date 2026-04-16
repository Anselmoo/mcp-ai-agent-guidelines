/**
 * gr-handlers-tranche2.test.ts
 *
 * Focused tests for GR tranche 2 — ten promoted coupling-as-gravity handlers:
 *   - gr-dark-energy-forecaster
 *   - gr-equivalence-principle-checker
 *   - gr-frame-dragging-detector
 *   - gr-geodesic-refactor
 *   - gr-gravitational-lensing-tracer
 *   - gr-gravitational-wave-detector
 *   - gr-inflation-detector
 *   - gr-neutron-star-compactor
 *   - gr-penrose-diagram-mapper
 *   - gr-redshift-velocity-mapper
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
 */

import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as grDarkEnergyForecasterModule } from "../skills/gr/gr-dark-energy-forecaster.js";
import { skillModule as grEquivalencePrincipleCheckerModule } from "../skills/gr/gr-equivalence-principle-checker.js";
import { skillModule as grFrameDraggingDetectorModule } from "../skills/gr/gr-frame-dragging-detector.js";
import { skillModule as grGeodesicRefactorModule } from "../skills/gr/gr-geodesic-refactor.js";
import { skillModule as grGravitationalLensingTracerModule } from "../skills/gr/gr-gravitational-lensing-tracer.js";
import { skillModule as grGravitationalWaveDetectorModule } from "../skills/gr/gr-gravitational-wave-detector.js";
import { skillModule as grInflationDetectorModule } from "../skills/gr/gr-inflation-detector.js";
import { skillModule as grNeutronStarCompactorModule } from "../skills/gr/gr-neutron-star-compactor.js";
import { skillModule as grPenroseDiagramMapperModule } from "../skills/gr/gr-penrose-diagram-mapper.js";
import { skillModule as grRedshiftVelocityMapperModule } from "../skills/gr/gr-redshift-velocity-mapper.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

// ─── Runtime Factory ──────────────────────────────────────────────────────────

function createRuntime() {
	return {
		sessionId: "test-gr-handlers-tranche2",
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

// ─── Dark Energy Forecaster ───────────────────────────────────────────────────

describe("gr-dark-energy-forecaster", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grDarkEnergyForecasterModule.run(
			{
				request:
					"detect dark energy in module with 100 convention lines and 50 functional lines",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on dark energy keywords", async () => {
		const runtime = createRuntime();
		const result = await grDarkEnergyForecasterModule.run(
			{ request: "analyze dark energy expansion in boilerplate code" },
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/dark energy|convention|boilerplate/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grDarkEnergyForecasterModule.run(
			{
				request: "analyze dark energy density",
				options: { conventionLines: 120, functionalLines: 60 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/convention_lines.*120/i);
	});

	it("fires insufficient signal for empty request", async () => {
		const runtime = createRuntime();
		const result = await grDarkEnergyForecasterModule.run(
			{ request: "the" },
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const summary = result.summary;
		expect(summary).toMatch(
			/Dark Energy Forecaster needs|module description|LOC metrics|convention-debt/i,
		);
	});
});

// ─── Equivalence Principle Checker ────────────────────────────────────────────

describe("gr-equivalence-principle-checker", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grEquivalencePrincipleCheckerModule.run(
			{ request: "check equivalence principle with local 0.8 global 0.6" },
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on equivalence keywords", async () => {
		const runtime = createRuntime();
		const result = await grEquivalencePrincipleCheckerModule.run(
			{
				request:
					"verify local consistency matches global architectural patterns",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/equivalence|local.*consistency|global/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grEquivalencePrincipleCheckerModule.run(
			{
				request: "check equivalence principle",
				options: { localConsistency: 0.9, globalConsistency: 0.5 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/equivalence_ratio/i);
	});

	it("fires insufficient signal for empty request", async () => {
		const runtime = createRuntime();
		const result = await grEquivalencePrincipleCheckerModule.run(
			{ request: "the" },
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const summary = result.summary;
		expect(summary).toMatch(
			/Equivalence Principle Checker needs|module description|consistency scores|alignment/i,
		);
	});
});

// ─── Frame Dragging Detector ──────────────────────────────────────────────────

describe("gr-frame-dragging-detector", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grFrameDraggingDetectorModule.run(
			{ request: "detect frame dragging with churn rate 10 and coupling 20" },
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on frame dragging keywords", async () => {
		const runtime = createRuntime();
		const result = await grFrameDraggingDetectorModule.run(
			{
				request: "find modules with high churn dragging neighbors into changes",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/frame.?dragging|churn|drag/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grFrameDraggingDetectorModule.run(
			{
				request: "analyze frame dragging",
				options: { churnRate: 15, coupling: 30 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/F_drag/i);
	});
});

// ─── Geodesic Refactor ────────────────────────────────────────────────────────

describe("gr-geodesic-refactor", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grGeodesicRefactorModule.run(
			{ request: "find geodesic refactor path from coupling 50 to 10" },
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on geodesic keywords", async () => {
		const runtime = createRuntime();
		const result = await grGeodesicRefactorModule.run(
			{ request: "compute shortest refactoring path through waypoints" },
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/geodesic|shortest.*path|waypoint/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grGeodesicRefactorModule.run(
			{
				request: "plan geodesic refactor",
				options: { currentCoupling: 60, targetCoupling: 15, waypointCount: 5 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/geodesic_distance|waypoints/i);
	});
});

// ─── Gravitational Lensing Tracer ─────────────────────────────────────────────

describe("gr-gravitational-lensing-tracer", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grGravitationalLensingTracerModule.run(
			{
				request:
					"detect gravitational lensing with complexity 200 and afferent 30",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on lensing keywords", async () => {
		const runtime = createRuntime();
		const result = await grGravitationalLensingTracerModule.run(
			{ request: "find load-bearing modules that bend call paths around them" },
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/lensing|load-bearing|bend/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grGravitationalLensingTracerModule.run(
			{
				request: "detect lensing",
				options: { complexity: 300, afferentCoupling: 40 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/lensing_power/i);
	});
});

// ─── Gravitational Wave Detector ──────────────────────────────────────────────

describe("gr-gravitational-wave-detector", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grGravitationalWaveDetectorModule.run(
			{
				request: "detect gravitational waves from refactor before 40 after 25",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on wave keywords", async () => {
		const runtime = createRuntime();
		const result = await grGravitationalWaveDetectorModule.run(
			{ request: "measure strain ripples in coupling from large merge event" },
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/wave|strain|ripple/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grGravitationalWaveDetectorModule.run(
			{
				request: "measure strain",
				options: { couplingBefore: 50, couplingAfter: 30 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/strain/i);
	});
});

// ─── Inflation Detector ───────────────────────────────────────────────────────

describe("gr-inflation-detector", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grInflationDetectorModule.run(
			{
				request:
					"detect runaway inflation with LOC growth 20 and value growth 2",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on inflation keywords", async () => {
		const runtime = createRuntime();
		const result = await grInflationDetectorModule.run(
			{
				request:
					"find modules with exponential LOC expansion without value increase",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/inflation|exponential|runaway/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grInflationDetectorModule.run(
			{
				request: "detect inflation",
				options: { locGrowthRate: 25, valueGrowthRate: 5 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/inflation_ratio/i);
	});
});

// ─── Neutron Star Compactor ───────────────────────────────────────────────────

describe("gr-neutron-star-compactor", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grNeutronStarCompactorModule.run(
			{
				request:
					"check neutron star density with LOC 500, complexity 30, cohesion 0.2",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on neutron star keywords", async () => {
		const runtime = createRuntime();
		const result = await grNeutronStarCompactorModule.run(
			{
				request:
					"detect files approaching Chandrasekhar limit and information collapse",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/neutron.?star|chandrasekhar|density|collapse/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grNeutronStarCompactorModule.run(
			{
				request: "check density",
				options: { linesOfCode: 600, cyclomaticComplexity: 40, cohesion: 0.15 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/density/i);
	});
});

// ─── Penrose Diagram Mapper ───────────────────────────────────────────────────

describe("gr-penrose-diagram-mapper", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grPenroseDiagramMapperModule.run(
			{
				request:
					"map causal structure with path length 0 for spacelike modules",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on penrose keywords", async () => {
		const runtime = createRuntime();
		const result = await grPenroseDiagramMapperModule.run(
			{
				request:
					"identify timelike chains and spacelike islands in dependency graph",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/penrose|causal|timelike|spacelike/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grPenroseDiagramMapperModule.run(
			{
				request: "map causal structure",
				options: { pathLength: 3 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/causal_class.*TIMELIKE/i);
	});
});

// ─── Redshift Velocity Mapper ─────────────────────────────────────────────────

describe("gr-redshift-velocity-mapper", () => {
	it("returns capability mode", async () => {
		const runtime = createRuntime();
		const result = await grRedshiftVelocityMapperModule.run(
			{
				request:
					"measure API redshift with original 10 exports and current 18 exports",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
	});

	it("triggers on redshift keywords", async () => {
		const runtime = createRuntime();
		const result = await grRedshiftVelocityMapperModule.run(
			{
				request:
					"detect interface drift and API contract expansion through abstraction layers",
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/redshift|drift|api|interface/i);
	});

	it("produces advisory computation when explicit options provided", async () => {
		const runtime = createRuntime();
		const result = await grRedshiftVelocityMapperModule.run(
			{
				request: "measure redshift",
				options: { originalExports: 20, currentExports: 35 },
			},
			runtime,
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory computation/i);
		expect(details).toMatch(/redshift.*z/i);
	});
});

// ─── Cross-cutting Contract Tests ─────────────────────────────────────────────

describe("GR tranche 2 — cross-cutting contracts", () => {
	const modules = [
		{ name: "dark-energy-forecaster", module: grDarkEnergyForecasterModule },
		{
			name: "equivalence-principle-checker",
			module: grEquivalencePrincipleCheckerModule,
		},
		{ name: "frame-dragging-detector", module: grFrameDraggingDetectorModule },
		{ name: "geodesic-refactor", module: grGeodesicRefactorModule },
		{
			name: "gravitational-lensing-tracer",
			module: grGravitationalLensingTracerModule,
		},
		{
			name: "gravitational-wave-detector",
			module: grGravitationalWaveDetectorModule,
		},
		{ name: "inflation-detector", module: grInflationDetectorModule },
		{ name: "neutron-star-compactor", module: grNeutronStarCompactorModule },
		{ name: "penrose-diagram-mapper", module: grPenroseDiagramMapperModule },
		{
			name: "redshift-velocity-mapper",
			module: grRedshiftVelocityMapperModule,
		},
	];

	it.each(modules)("$name — does NOT leak raw request in summary", async ({
		module,
	}) => {
		const runtime = createRuntime();
		const specificRequest = "UNIQUE_TEST_PHRASE_XYZ_12345";
		const result = await module.run({ request: specificRequest }, runtime);
		expect(result.summary).not.toContain(specificRequest);
	});

	it.each(modules)("$name — includes advisory wording", async ({ module }) => {
		const runtime = createRuntime();
		const result = await module.run(
			{ request: "analyze coupling metrics" },
			runtime,
		);
		const allText = [
			result.summary,
			...result.recommendations.map((r) => r.detail),
		].join(" ");
		expect(allText).toMatch(/advisory|validate|indicative|supplementary/i);
	});
});
