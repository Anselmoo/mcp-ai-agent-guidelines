import { describe, expect, it } from "vitest";
import {
	ADAPTIVE_ROUTING_SIGNAL,
	FLOW_MEASURE_LABELS,
	hasAcoDomainSignal,
	hasConvergenceSignal,
	hasExplorationSignal,
	hasGraphStructureSignal,
	hasHebbianDomainSignal,
	hasPersistenceSignal,
	hasPhysarumDomainSignal,
	hasQualityMeasureSignal,
	PRUNING_STRATEGY_LABELS,
	ROUTING_MODE_LABELS,
	ROUTING_POLICY_LABELS,
	VAGUE_ROUTING_SIGNAL,
	WEIGHT_SCOPE_LABELS,
} from "../../../skills/adapt/routing-helpers.js";

describe("routing-helpers", () => {
	it("detects shared routing signals", () => {
		expect(
			ADAPTIVE_ROUTING_SIGNAL.test("dynamic self-optimising routing"),
		).toBe(true);
		expect(VAGUE_ROUTING_SIGNAL.test("routing?")).toBe(true);
		expect(VAGUE_ROUTING_SIGNAL.test("routing with graph metrics")).toBe(false);
		expect(hasGraphStructureSignal("graph edges and node topology")).toBe(true);
		expect(hasQualityMeasureSignal("quality score and latency metric")).toBe(
			true,
		);
		expect(hasExplorationSignal("balance exploration and exploitation")).toBe(
			true,
		);
		expect(hasConvergenceSignal("weights are stable after convergence")).toBe(
			true,
		);
		expect(hasPersistenceSignal("persist the routing state snapshot")).toBe(
			true,
		);
	});

	it("distinguishes ACO, Physarum, and Hebbian routing requests", () => {
		expect(
			hasAcoDomainSignal("pheromone trails reinforce high quality paths"),
		).toBe(true);
		expect(
			hasAcoDomainSignal("which workflow path has the best reward metric"),
		).toBe(true);
		expect(hasAcoDomainSignal("pairwise agent collaboration matrix")).toBe(
			false,
		);
		expect(
			hasPhysarumDomainSignal("prune unused paths based on flow throughput"),
		).toBe(true);
		expect(
			hasPhysarumDomainSignal(
				"traffic volume should simplify each workflow path",
			),
		).toBe(true);
		expect(hasPhysarumDomainSignal("pheromone evaporation on edges")).toBe(
			false,
		);
		expect(
			hasHebbianDomainSignal("learn which agent pairs collaborate well"),
		).toBe(true);
		expect(
			hasHebbianDomainSignal("strengthen complementary agent partnerships"),
		).toBe(true);
		expect(hasHebbianDomainSignal("remove dead-end edges from the graph")).toBe(
			false,
		);
	});

	it("exports the expected label maps", () => {
		expect(ROUTING_MODE_LABELS.explore).toContain("discover new paths");
		expect(PRUNING_STRATEGY_LABELS.adaptive).toContain("threshold adjusts");
		expect(FLOW_MEASURE_LABELS.quality).toContain("quality score");
		expect(ROUTING_POLICY_LABELS["epsilon-greedy"]).toContain(
			"explore randomly",
		);
		expect(WEIGHT_SCOPE_LABELS["all-to-all"]).toContain("N×N matrix");
	});
});
