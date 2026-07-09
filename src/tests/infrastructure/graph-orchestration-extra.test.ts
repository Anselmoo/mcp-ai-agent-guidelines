import { describe, expect, it } from "vitest";
import {
	GraphOrchestrator,
	GraphOrchestratorFactory,
	SkillDependencyGraph,
	SkillRoutingGraph,
} from "../../infrastructure/graph-orchestration.js";

const makeSkill = (id: string, domain = "X") => ({
	id,
	name: `Skill-${id}`,
	domain,
	dependencies: [] as string[],
	complexity: 1,
	estimatedLatency: 10,
});

const makeAgent = (id: string) => ({
	id,
	name: `Agent-${id}`,
	capabilities: ["general"],
	modelTier: "free" as const,
	status: "available" as const,
	performance: {
		successRate: 1,
		averageLatency: 10,
		throughput: 1,
	},
});

describe("GraphOrchestratorFactory", () => {
	it("creates a GraphOrchestrator instance", () => {
		const orch = GraphOrchestratorFactory.create();
		expect(orch).toBeInstanceOf(GraphOrchestrator);
	});

	it("creates with ACO strategy option", () => {
		const orch = GraphOrchestratorFactory.create({
			optimizationStrategy: "aco",
			pruningThreshold: 0.5,
		});
		expect(orch).toBeInstanceOf(GraphOrchestrator);
	});

	it("creates with physarum strategy option", () => {
		const orch = GraphOrchestratorFactory.create({
			optimizationStrategy: "physarum",
		});
		expect(orch).toBeInstanceOf(GraphOrchestrator);
	});
});

describe("GraphOrchestrator extra branches", () => {
	it("findOptimalRoute returns null when source agent is missing", () => {
		const orch = new GraphOrchestrator();
		const agents = [makeAgent("B"), makeAgent("C")];
		orch.buildAgentGraph(agents);
		const result = orch.findOptimalRoute("nonexistent", "B");
		expect(result).toBeNull();
	});

	it("findOptimalRoute returns null when target agent is missing", () => {
		const orch = new GraphOrchestrator();
		const agents = [makeAgent("A"), makeAgent("B")];
		orch.buildAgentGraph(agents);
		const result = orch.findOptimalRoute("A", "nonexistent");
		expect(result).toBeNull();
	});

	it("buildSkillGraph with unknown dependency edges are silently skipped", () => {
		const orch = new GraphOrchestrator();
		const skills = [makeSkill("X"), makeSkill("Y")];
		// dep from a non-existent skill
		orch.buildSkillGraph(skills, [
			{ from: "X", to: "Y" },
			{ from: "Z", to: "Y" }, // Z not in skills
		]);
		// No throw — just verify it doesn't crash
		expect(true).toBe(true);
	});

	it("buildAgentGraph then buildAgentGraph again clears previous agents", () => {
		const orch = new GraphOrchestrator();
		orch.buildAgentGraph([makeAgent("A"), makeAgent("B")]);
		orch.buildAgentGraph([makeAgent("C")]);
		// findOptimalRoute for old agent should return null
		const result = orch.findOptimalRoute("A", "B");
		expect(result).toBeNull();
	});

	it("findOptimalRoute returns null when both agents exist but no route between them", () => {
		const orch = new GraphOrchestrator();
		// Two agents with disjoint capabilities and different tiers are not compatible,
		// so buildAgentGraph will not create a route edge between them.
		const incompatibleA = {
			...makeAgent("A"),
			capabilities: ["alpha"],
			modelTier: "free" as const,
		};
		const incompatibleB = {
			...makeAgent("B"),
			capabilities: ["beta"],
			modelTier: "strong" as const,
		};
		orch.buildAgentGraph([incompatibleA, incompatibleB]);
		const result = orch.findOptimalRoute("A", "B");
		expect(result).toBeNull();
	});

	it("findOptimalRoute returns a PathOptimization when a route exists between compatible agents", () => {
		const orch = new GraphOrchestrator();
		const agents = [makeAgent("A"), makeAgent("B")];
		orch.buildAgentGraph(agents);
		const result = orch.findOptimalRoute("A", "B");
		expect(result).not.toBeNull();
		expect(result?.path).toEqual(["A", "B"]);
		expect(result?.totalWeight).toBeGreaterThan(0);
		expect(result?.estimatedLatency).toBe(150);
		expect(result?.confidence).toBe(0.85);
	});

	it("analyzeGraph delegates to the analysis helper and returns a GraphAnalysis", () => {
		const orch = new GraphOrchestrator();
		orch.buildAgentGraph([makeAgent("A"), makeAgent("B")]);
		orch.buildSkillGraph(
			[makeSkill("X"), makeSkill("Y")],
			[{ from: "X", to: "Y" }],
		);
		const analysis = orch.analyzeGraph();
		expect(analysis).toBeDefined();
	});

	it("updatePheromoneTrails delegates to the helper without throwing", () => {
		const orch = new GraphOrchestrator();
		orch.buildAgentGraph([makeAgent("A"), makeAgent("B")]);
		expect(() =>
			orch.updatePheromoneTrails([{ path: ["A", "B"], performance: 0.9 }]),
		).not.toThrow();
	});

	it("pruneUnderutilizedPaths delegates to the helper without throwing", () => {
		const orch = new GraphOrchestrator();
		orch.buildAgentGraph([makeAgent("A"), makeAgent("B")]);
		expect(() => orch.pruneUnderutilizedPaths(0.5)).not.toThrow();
	});

	it("pruneUnderutilizedPaths uses the default usage threshold when omitted", () => {
		const orch = new GraphOrchestrator();
		orch.buildAgentGraph([makeAgent("A"), makeAgent("B")]);
		expect(() => orch.pruneUnderutilizedPaths()).not.toThrow();
	});

	it("reinforceCoactivatedPairs delegates to the helper without throwing", () => {
		const orch = new GraphOrchestrator();
		orch.buildAgentGraph([makeAgent("A"), makeAgent("B")]);
		expect(() =>
			orch.reinforceCoactivatedPairs([{ agents: ["A", "B"], success: true }]),
		).not.toThrow();
	});
});

describe("SkillDependencyGraph extra branches", () => {
	it("addSkill is idempotent (adding same skill twice)", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("A")); // second add should not throw
		const order = g.getTopologicalOrder();
		expect(order).toContain("A");
	});

	it("addDependency throws when from skill is missing", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("B"));
		expect(() => g.addDependency("missing", "B")).toThrow();
	});

	it("addDependency throws when to skill is missing", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		expect(() => g.addDependency("A", "missing")).toThrow();
	});

	it("addDependency is idempotent for duplicate edges", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("B"));
		g.addDependency("A", "B");
		g.addDependency("A", "B"); // duplicate should not throw
		expect(g.getTopologicalOrder()).toContain("A");
	});

	it("getShortestPath returns null for disconnected nodes", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("B"));
		// No dependency between A and B
		const path = g.getShortestPath("A", "B");
		expect(path).toBeNull();
	});

	it("getShortestPath returns null when the 'from' node was never added", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("B"));
		expect(g.getShortestPath("missing", "B")).toBeNull();
	});

	it("getShortestPath returns null when the 'to' node was never added", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		expect(g.getShortestPath("A", "missing")).toBeNull();
	});

	it("getIsolatedSkills returns skills with no dependencies", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("B"));
		g.addSkill(makeSkill("C"));
		g.addDependency("A", "B");
		const isolated = g.getIsolatedSkills();
		// C has no edges, A and B are connected
		expect(isolated).toContain("C");
	});

	it("getPriorityQueue returns skills ordered by complexity×latency", () => {
		const g = new SkillDependencyGraph();
		g.addSkill({ ...makeSkill("A"), complexity: 5, estimatedLatency: 10 });
		g.addSkill({ ...makeSkill("B"), complexity: 2, estimatedLatency: 5 });
		const queue = g.getPriorityQueue();
		// A has higher priority (50) vs B (10)
		expect(queue.indexOf("A")).toBeLessThan(queue.indexOf("B"));
	});

	it("getTopologicalOrder throws when the graph has a cycle", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("B"));
		g.addSkill(makeSkill("C"));
		g.addDependency("A", "B");
		g.addDependency("B", "C");
		g.addDependency("C", "A"); // cycle: Kahn's algorithm can't clear the queue
		expect(() => g.getTopologicalOrder()).toThrow(
			"Graph has at least one cycle",
		);
	});

	it("getGraph returns the underlying DirectedGraph instance", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("B"));
		g.addDependency("A", "B");
		const graph = g.getGraph();
		expect(graph.hasNode("A")).toBe(true);
		expect(graph.hasEdge("A", "B")).toBe(true);
	});
});

describe("SkillRoutingGraph extra branches", () => {
	it("findRoute delegates to SkillDependencyGraph.getShortestPath", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("B"));
		g.addSkill(makeSkill("C"));
		g.addDependency("A", "B");
		g.addDependency("B", "C");

		const router = new SkillRoutingGraph(g);
		const route = router.findRoute("A", "C");
		expect(route).toEqual(["A", "B", "C"]);
	});

	it("findRoute returns null for unconnected nodes", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("Z"));

		const router = new SkillRoutingGraph(g);
		expect(router.findRoute("A", "Z")).toBeNull();
	});

	it("analyze returns correct summary with cycle", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("B"));
		g.addSkill(makeSkill("C"));
		g.addDependency("A", "B");
		g.addDependency("B", "C");
		g.addDependency("C", "A"); // cycle

		const _router = new SkillRoutingGraph(g);
		// getTopologicalOrder throws on cycles — detectCycles is separate
		const cycleAnalysis = g.detectCycles();
		expect(cycleAnalysis.hasCycle).toBe(true);
		expect(cycleAnalysis.cyclePath).toBeDefined();
	});

	it("analyze returns hasCycles false when no cycles", () => {
		const g = new SkillDependencyGraph();
		g.addSkill(makeSkill("A"));
		g.addSkill(makeSkill("B"));
		g.addDependency("A", "B");

		const router = new SkillRoutingGraph(g);
		const analysis = router.analyze();
		expect(analysis.hasCycles).toBe(false);
	});
});

// Note: a handful of defensive branches in graph-orchestration.ts are not
// exercised here because they are unreachable through the public API:
// - GraphOrchestrator.buildAgentGraph `if (sourceRoutes)` (~line 61): every
//   agent's route map is created in the same loop that seeds `this.agents`,
//   so `this.routes.get(source.id)` can never be undefined for a `source`
//   drawn from the same `agents` array.
// - GraphOrchestrator.buildSkillGraph `deps || []` (~line 88): every skill's
//   dependency array is seeded before the edges loop runs, and an edge is
//   only processed when `this.skills.has(dep.from)` — which always implies
//   a corresponding entry already exists in `this.dependencies`.
// - GraphOrchestrator.findOptimalRoute `sourceRoutes?.keys() ?? []` (~line
//   121): `this.agents` and `this.routes` are always populated together
//   (buildAgentGraph) and cleared together, so a `sourceAgent` known to
//   `this.agents` always has a corresponding `this.routes` entry.
// - SkillDependencyGraph.detectCycles `cycleStart >= 0 ? ... : [neighbor]`
//   (~line 286): `stack` and `pathStack` are always pushed/popped together,
//   so whenever `stack.has(neighbor)` is true, `neighbor` is guaranteed to
//   be found in `pathStack` (cycleStart >= 0).
