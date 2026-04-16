import { describe, expect, it } from "vitest";
import {
	analyzeGraph,
	bfsTraversal,
	buildDirectedGraph,
	wouldCreateCycle,
} from "../../infrastructure/graph-analysis.js";

describe("graph-analysis", () => {
	it("analyzes acyclic graphs with topological metadata", () => {
		const graph = buildDirectedGraph(
			["a", "b", "c"],
			[
				{ from: "a", to: "b" },
				{ from: "b", to: "c" },
			],
		);
		const analysis = analyzeGraph(graph);

		expect(analysis.hasCycles).toBe(false);
		expect(analysis.topologicalOrder).toEqual(["a", "b", "c"]);
		expect(analysis.sources).toEqual(["a"]);
		expect(analysis.sinks).toEqual(["c"]);
	});

	it("tracks traversal depth and detects proposed cycles", () => {
		const graph = buildDirectedGraph(
			["a", "b", "c"],
			[
				{ from: "a", to: "b" },
				{ from: "b", to: "c" },
			],
		);

		expect(bfsTraversal(graph, "a")).toEqual([
			{ id: "a", depth: 0 },
			{ id: "b", depth: 1 },
			{ id: "c", depth: 2 },
		]);
		expect(wouldCreateCycle(graph, "c", "a")).toBe(true);
	});
});
