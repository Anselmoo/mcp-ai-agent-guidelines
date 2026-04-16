import { describe, expect, it } from "vitest";
import {
	SkillDependencyGraph,
	SkillRoutingGraph,
} from "../../infrastructure/graph-orchestration.js";

const skills = [
	{
		id: "A",
		name: "SkillA",
		domain: "X",
		dependencies: [],
		complexity: 1,
		estimatedLatency: 10,
	},
	{
		id: "B",
		name: "SkillB",
		domain: "X",
		dependencies: ["A"],
		complexity: 1,
		estimatedLatency: 10,
	},
	{
		id: "C",
		name: "SkillC",
		domain: "Y",
		dependencies: ["B"],
		complexity: 1,
		estimatedLatency: 10,
	},
	{
		id: "D",
		name: "SkillD",
		domain: "Y",
		dependencies: [],
		complexity: 1,
		estimatedLatency: 10,
	},
	{
		id: "E",
		name: "SkillE",
		domain: "Z",
		dependencies: ["C", "D"],
		complexity: 1,
		estimatedLatency: 10,
	},
];

describe("SkillDependencyGraph", () => {
	it("builds a valid topological order", () => {
		const g = new SkillDependencyGraph();
		for (const skill of skills) g.addSkill(skill);
		g.addDependency("A", "B");
		g.addDependency("B", "C");
		g.addDependency("C", "E");
		g.addDependency("D", "E");
		const order = g.getTopologicalOrder();
		expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
		expect(order.indexOf("B")).toBeLessThan(order.indexOf("C"));
		expect(order.indexOf("C")).toBeLessThan(order.indexOf("E"));
		expect(order.indexOf("D")).toBeLessThan(order.indexOf("E"));
	});

	it("detects cycles", () => {
		const g = new SkillDependencyGraph();
		for (const skill of skills) g.addSkill(skill);
		g.addDependency("A", "B");
		g.addDependency("B", "C");
		g.addDependency("C", "A"); // cycle
		const cycleDetection = g.detectCycles();
		expect(cycleDetection.hasCycle).toBe(true);
		expect(cycleDetection.cyclePath).toEqual(["A", "B", "C"]);
		const cycles = g.getCycles();
		expect(
			cycles.some((c) => c.includes("A") && c.includes("B") && c.includes("C")),
		).toBe(true);
	});

	it("finds shortest path", () => {
		const g = new SkillDependencyGraph();
		for (const skill of skills) g.addSkill(skill);
		g.addDependency("A", "B");
		g.addDependency("B", "C");
		g.addDependency("C", "E");
		g.addDependency("D", "E");
		expect(g.getShortestPath("A", "E")).toEqual(["A", "B", "C", "E"]);
		expect(g.getShortestPath("D", "E")).toEqual(["D", "E"]);
		expect(g.getShortestPath("A", "D")).toBeNull();
	});

	it("finds isolated skills", () => {
		const g = new SkillDependencyGraph();
		for (const skill of skills) g.addSkill(skill);
		expect(g.getIsolatedSkills().sort()).toEqual(
			["A", "B", "C", "D", "E"].sort(),
		);
		g.addDependency("A", "B");
		g.addDependency("B", "C");
		g.addDependency("C", "E");
		g.addDependency("D", "E");
		expect(g.getIsolatedSkills()).toEqual([]);
	});

	it("returns a priority queue (lowest in-degree first)", () => {
		const g = new SkillDependencyGraph();
		for (const skill of skills) g.addSkill(skill);
		g.addDependency("A", "B");
		g.addDependency("B", "C");
		g.addDependency("C", "E");
		g.addDependency("D", "E");
		const pq = g.getPriorityQueue();
		expect(pq[0]).toBe("A");
		expect(pq[1]).toBe("D");
		expect(pq[pq.length - 1]).toBe("E");
	});
});

describe("SkillRoutingGraph", () => {
	it("wraps dependency graph and exposes analysis", () => {
		const g = new SkillDependencyGraph();
		for (const skill of skills) g.addSkill(skill);
		g.addDependency("A", "B");
		g.addDependency("B", "C");
		g.addDependency("C", "E");
		g.addDependency("D", "E");
		const routing = new SkillRoutingGraph(g);
		const analysis = routing.analyze();
		expect(analysis.topologicalOrder).toContain("A");
		expect(analysis.hasCycles).toBe(false);
		expect(analysis.cyclePath).toEqual([]);
		expect(analysis.cycles).toEqual([]);
		expect(analysis.isolated).toEqual([]);
		expect(analysis.priorityQueue[0]).toBe("A");
	});

	it("finds route using dependency graph", () => {
		const g = new SkillDependencyGraph();
		for (const skill of skills) g.addSkill(skill);
		g.addDependency("A", "B");
		g.addDependency("B", "C");
		g.addDependency("C", "E");
		g.addDependency("D", "E");
		const routing = new SkillRoutingGraph(g);
		expect(routing.findRoute("A", "E")).toEqual(["A", "B", "C", "E"]);
		expect(routing.findRoute("D", "E")).toEqual(["D", "E"]);
		expect(routing.findRoute("A", "D")).toBeNull();
	});
});
