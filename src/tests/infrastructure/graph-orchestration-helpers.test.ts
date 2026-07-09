import { describe, expect, it } from "vitest";
import type { RouteEdge } from "../../contracts/graph-types.js";
import {
	analyzeGraphState,
	detectCyclesInDependencies,
	generateOptimizationRecommendations,
	identifyBottlenecks,
	pruneUnderutilizedPaths,
	reinforceCoactivatedPairs,
	updatePheromoneTrails,
} from "../../infrastructure/graph-orchestration-helpers.js";

function createEdge(overrides: Partial<RouteEdge> = {}): RouteEdge {
	return {
		weight: 1,
		performance: {
			successRate: 0.9,
			averageLatency: 100,
		},
		lastUsed: new Date(),
		...overrides,
	};
}

describe("infrastructure/graph-orchestration-helpers", () => {
	it("analyzes graph state and detects cycle recommendations", () => {
		const analysis = analyzeGraphState(
			new Map([
				["agent-a", {}],
				["agent-b", {}],
			]),
			new Map([
				["skill-a", {}],
				["skill-b", {}],
			]),
			new Map([
				[
					"agent-a",
					new Map([
						["agent-b", createEdge()],
						["agent-c", createEdge()],
					]),
				],
				["agent-b", new Map()],
			]),
			new Map([
				["skill-a", ["skill-b"]],
				["skill-b", ["skill-a"]],
			]),
		);

		expect(analysis.skillDependencies.hasCycles).toBe(true);
		expect(analysis.recommendations).toEqual(
			expect.arrayContaining([expect.stringContaining("dependency cycles")]),
		);
	});

	it("mutates route weights within expected bounds", () => {
		const routes = new Map<string, Map<string, RouteEdge>>([
			[
				"agent-a",
				new Map([
					["agent-b", createEdge({ weight: 1.9 })],
					[
						"agent-c",
						createEdge({
							weight: 0.2,
							performance: { successRate: 0.05, averageLatency: 100 },
						}),
					],
				]),
			],
			["agent-b", new Map([["agent-a", createEdge({ weight: 1.95 })]])],
		]);

		updatePheromoneTrails(routes, [
			{ path: ["agent-a", "agent-b"], performance: 2 },
		]);
		reinforceCoactivatedPairs(routes, [
			{ agents: ["agent-a", "agent-b"], success: true },
		]);
		pruneUnderutilizedPaths(routes, 0.1);

		expect(routes.get("agent-a")?.has("agent-c")).toBe(false);
		expect(routes.get("agent-a")?.get("agent-b")?.weight).toBeLessThanOrEqual(
			2,
		);
		expect(routes.get("agent-b")?.get("agent-a")?.weight).toBeLessThanOrEqual(
			2,
		);
		expect(
			routes.get("agent-a")?.get("agent-b")?.weight,
		).toBeGreaterThanOrEqual(0.1);
	});

	it("skips pheromone update when a path step has no matching route", () => {
		const routes = new Map<string, Map<string, RouteEdge>>([
			["agent-a", new Map([["agent-b", createEdge({ weight: 1 })]])],
		]);

		// "agent-a" -> "agent-z" has no edge, so sourceRoutes?.has(target) is false.
		expect(() =>
			updatePheromoneTrails(routes, [
				{ path: ["agent-a", "agent-z"], performance: 1 },
			]),
		).not.toThrow();

		// Untouched edge still decays via the second loop.
		expect(routes.get("agent-a")?.get("agent-b")?.weight).toBeCloseTo(0.95);
	});

	it("treats a missing successRate as zero when pruning", () => {
		const routes = new Map<string, Map<string, RouteEdge>>([
			[
				"agent-a",
				new Map([
					[
						"agent-b",
						createEdge({
							performance: {
								averageLatency: 100,
							} as RouteEdge["performance"],
						}),
					],
				]),
			],
		]);

		pruneUnderutilizedPaths(routes, 0.1);

		expect(routes.get("agent-a")?.has("agent-b")).toBe(false);
	});

	it("skips coactivation reinforcement for failed activations", () => {
		const routes = new Map<string, Map<string, RouteEdge>>([
			["agent-a", new Map([["agent-b", createEdge({ weight: 1 })]])],
		]);

		reinforceCoactivatedPairs(routes, [
			{ agents: ["agent-a", "agent-b"], success: false },
		]);

		expect(routes.get("agent-a")?.get("agent-b")?.weight).toBe(1);
	});

	it("skips coactivation reinforcement when fewer than two agents activated", () => {
		const routes = new Map<string, Map<string, RouteEdge>>([
			["agent-a", new Map([["agent-b", createEdge({ weight: 1 })]])],
		]);

		reinforceCoactivatedPairs(routes, [{ agents: ["agent-a"], success: true }]);

		expect(routes.get("agent-a")?.get("agent-b")?.weight).toBe(1);
	});

	it("leaves weights untouched when no route exists between coactivated agents", () => {
		const routes = new Map<string, Map<string, RouteEdge>>([
			["agent-a", new Map()],
			["agent-b", new Map()],
		]);

		expect(() =>
			reinforceCoactivatedPairs(routes, [
				{ agents: ["agent-a", "agent-b"], success: true },
			]),
		).not.toThrow();

		expect(routes.get("agent-a")?.size).toBe(0);
		expect(routes.get("agent-b")?.size).toBe(0);
	});

	it("detects cycles via a back-edge and skips already-visited non-cycle nodes", () => {
		// Diamond dependency graph (no cycle): d has no entry in the map,
		// exercising the `dependencies.get(node) || []` fallback, and "d" is
		// reached twice (from b and from c) without being part of a cycle,
		// exercising the "already visited but not on the stack" branch.
		const dependencies = new Map<string, string[]>([
			["a", ["b", "c"]],
			["b", ["d"]],
			["c", ["d"]],
		]);

		expect(detectCyclesInDependencies(dependencies, ["a", "b", "c", "d"])).toBe(
			false,
		);
	});

	it("detects a true cycle through a back-edge on the recursion stack", () => {
		const dependencies = new Map<string, string[]>([
			["a", ["b"]],
			["b", ["c"]],
			["c", ["a"]],
		]);

		expect(detectCyclesInDependencies(dependencies, ["a", "b", "c"])).toBe(
			true,
		);
	});

	it("does not re-run dfs for a skill already visited via another root", () => {
		// "b" is reachable from "a", so when the outer loop reaches "b" directly
		// it should already be visited and dfs should not run again for it.
		const dependencies = new Map<string, string[]>([["a", ["b"]]]);

		expect(detectCyclesInDependencies(dependencies, ["a", "b"])).toBe(false);
	});

	it("flags an agent as a bottleneck when its route count exceeds the threshold", () => {
		const routes = new Map<string, Map<string, RouteEdge>>([
			[
				"agent-a",
				new Map([
					["agent-b", createEdge()],
					["agent-c", createEdge()],
				]),
			],
		]);

		const bottlenecks = identifyBottlenecks(routes, 2);

		expect(bottlenecks).toEqual([
			{ node: "agent-a", score: 0.8, type: "agent" },
		]);
	});

	it("recommends adding agents when the topology has fewer than two nodes", () => {
		const recommendations = generateOptimizationRecommendations(
			{
				componentCount: 1,
				centralityScores: {},
				nodeCount: 1,
				edgeCount: 0,
			},
			{
				componentCount: 1,
				hasCycles: false,
				cycles: [],
				nodeCount: 0,
				edgeCount: 0,
			},
			[],
		);

		expect(recommendations).toEqual([
			expect.stringContaining("Only 1 agent(s)"),
		]);
	});

	it("recommends load balancing when bottlenecks are present", () => {
		const recommendations = generateOptimizationRecommendations(
			{
				componentCount: 1,
				centralityScores: {},
				nodeCount: 5,
				edgeCount: 10,
			},
			{
				componentCount: 1,
				hasCycles: false,
				cycles: [],
				nodeCount: 3,
				edgeCount: 2,
			},
			[{ node: "agent-a", score: 0.8, type: "agent" }],
		);

		expect(recommendations).toEqual([
			expect.stringContaining("potential bottlenecks"),
		]);
	});
});
