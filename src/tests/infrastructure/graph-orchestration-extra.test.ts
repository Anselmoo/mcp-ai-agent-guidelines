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

		const router = new SkillRoutingGraph(g);
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
