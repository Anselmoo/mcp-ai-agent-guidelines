import { describe, expect, it } from "vitest";
import type { RouteEdge } from "../../contracts/graph-types.js";
import {
	analyzeGraphState,
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
});
