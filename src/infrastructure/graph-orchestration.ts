/**
 * Simplified graph orchestration for agent routing
 * Basic implementation without complex graphology dependencies
 */

/**
 * Simplified graph orchestrator for agent routing and dependency analysis
 */
import { DirectedGraph } from "graphology";
import { unweighted } from "graphology-shortest-path";
import type {
	AgentNode,
	GraphAnalysis,
	PathOptimization,
	RouteEdge,
	SkillNode,
} from "../contracts/graph-types.js";
import {
	analyzeGraphState,
	pruneUnderutilizedPaths as pruneUnderutilizedRoutePaths,
	reinforceCoactivatedPairs as reinforceCoactivatedRoutePairs,
	updatePheromoneTrails as updateRoutePheromoneTrails,
} from "./graph-orchestration-helpers.js";
import { createOperationalLogger } from "./observability.js";

const graphOrchestrationLogger = createOperationalLogger("info");

export class GraphOrchestrator {
	private agents: Map<string, AgentNode> = new Map();
	private skills: Map<string, SkillNode> = new Map();
	private routes: Map<string, Map<string, RouteEdge>> = new Map();
	private dependencies: Map<string, string[]> = new Map();

	/**
	 * Build agent orchestration graph for routing optimization
	 */
	buildAgentGraph(agents: AgentNode[]): void {
		this.agents.clear();
		this.routes.clear();

		// Add agent nodes
		for (const agent of agents) {
			this.agents.set(agent.id, agent);
			this.routes.set(agent.id, new Map());
		}

		// Add routing edges based on agent compatibility and performance history
		for (const source of agents) {
			for (const target of agents) {
				if (
					source.id !== target.id &&
					this.areAgentsCompatible(source, target)
				) {
					const edge: RouteEdge = {
						weight: this.calculateRouteWeight(source, target),
						performance: this.getHistoricalPerformance(source.id, target.id),
						lastUsed: new Date(),
					};

					const sourceRoutes = this.routes.get(source.id);
					if (sourceRoutes) {
						sourceRoutes.set(target.id, edge);
					}
				}
			}
		}
	}

	/**
	 * Build skill dependency graph for workflow topology analysis
	 */
	buildSkillGraph(
		skills: SkillNode[],
		dependencies: Array<{ from: string; to: string }>,
	): void {
		this.skills.clear();
		this.dependencies.clear();

		// Add skill nodes
		for (const skill of skills) {
			this.skills.set(skill.id, skill);
			this.dependencies.set(skill.id, []);
		}

		// Add dependency edges
		for (const dep of dependencies) {
			if (this.skills.has(dep.from) && this.skills.has(dep.to)) {
				const deps = this.dependencies.get(dep.from) || [];
				deps.push(dep.to);
				this.dependencies.set(dep.from, deps);
			}
		}
	}

	/**
	 * Find optimal routing path for agent orchestration (simplified)
	 */
	findOptimalRoute(
		sourceAgent: string,
		targetAgent: string,
	): PathOptimization | null {
		if (!this.agents.has(sourceAgent) || !this.agents.has(targetAgent)) {
			graphOrchestrationLogger.log(
				"warn",
				"Unable to resolve graph route for unknown agent",
				{
					sourceAgent,
					targetAgent,
					sourceExists: this.agents.has(sourceAgent),
					targetExists: this.agents.has(targetAgent),
				},
			);
			return null;
		}

		const sourceRoutes = this.routes.get(sourceAgent);
		if (!sourceRoutes?.has(targetAgent)) {
			graphOrchestrationLogger.log("warn", "No direct graph route available", {
				sourceAgent,
				targetAgent,
				availableTargets: [...(sourceRoutes?.keys() ?? [])],
			});
			return null;
		}

		const edge = sourceRoutes.get(targetAgent)!;

		return {
			path: [sourceAgent, targetAgent],
			totalWeight: edge.weight,
			estimatedLatency: edge.performance.averageLatency,
			confidence: edge.performance.successRate,
		};
	}

	/**
	 * Analyze graph structure for bottlenecks and optimization opportunities
	 */
	analyzeGraph(): GraphAnalysis {
		return analyzeGraphState(
			this.agents,
			this.skills,
			this.routes,
			this.dependencies,
		);
	}

	/**
	 * Integration point for ACO (Ant Colony Optimization) routing
	 */
	updatePheromoneTrails(
		successfulPaths: Array<{ path: string[]; performance: number }>,
	): void {
		updateRoutePheromoneTrails(this.routes, successfulPaths);
	}

	/**
	 * Prune underutilized paths
	 */
	pruneUnderutilizedPaths(usageThreshold: number = 0.1): void {
		pruneUnderutilizedRoutePaths(this.routes, usageThreshold);
	}

	/**
	 * Reinforce co-activated pairs
	 */
	reinforceCoactivatedPairs(
		activationHistory: Array<{ agents: string[]; success: boolean }>,
	): void {
		reinforceCoactivatedRoutePairs(this.routes, activationHistory);
	}

	private areAgentsCompatible(agent1: AgentNode, agent2: AgentNode): boolean {
		return (
			agent1.capabilities.some((cap) => agent2.capabilities.includes(cap)) ||
			agent1.modelTier === agent2.modelTier
		);
	}

	private calculateRouteWeight(source: AgentNode, target: AgentNode): number {
		const capabilityOverlap = source.capabilities.filter((cap) =>
			target.capabilities.includes(cap),
		).length;

		return Math.max(1.0 - capabilityOverlap * 0.1, 0.1);
	}

	private getHistoricalPerformance(
		_sourceId: string,
		_targetId: string,
	): { successRate: number; averageLatency: number } {
		return {
			successRate: 0.85,
			averageLatency: 150,
		};
	}
}

/**
 * Factory for creating graph orchestrators
 */
export class GraphOrchestratorFactory {
	static create(
		_config: {
			optimizationStrategy?: "aco" | "physarum" | "hebbian";
			pruningThreshold?: number;
		} = {},
	): GraphOrchestrator {
		return new GraphOrchestrator();
	}
}

/**
 * Graphology-backed Skill Dependency Graph
 */
export class SkillDependencyGraph {
	private graph: DirectedGraph;
	private skillData: Map<
		string,
		import("../contracts/graph-types.js").SkillNode
	> = new Map();

	constructor() {
		this.graph = new DirectedGraph();
	}

	addSkill(skill: import("../contracts/graph-types.js").SkillNode): void {
		this.skillData.set(skill.id, skill);
		if (!this.graph.hasNode(skill.id)) {
			this.graph.addNode(skill.id, { ...skill });
		}
	}

	addDependency(from: string, to: string): void {
		if (!this.graph.hasNode(from) || !this.graph.hasNode(to)) {
			throw new Error(
				`Both skills must be added before adding a dependency: ${from} -> ${to}`,
			);
		}
		if (!this.graph.hasEdge(from, to)) {
			this.graph.addDirectedEdge(from, to);
		}
	}

	getTopologicalOrder(): string[] {
		// Kahn's algorithm
		const order: string[] = [];
		const inDegree: Record<string, number> = {};
		this.graph.forEachNode((node: string) => {
			inDegree[node] = this.graph.inDegree(node);
		});
		const queue: string[] = Object.keys(inDegree).filter(
			(n) => inDegree[n] === 0,
		);
		while (queue.length > 0) {
			const node = queue.shift()!;
			order.push(node);
			this.graph.forEachOutboundNeighbor(node, (neighbor: string) => {
				inDegree[neighbor]--;
				if (inDegree[neighbor] === 0) queue.push(neighbor);
			});
		}
		if (order.length !== this.graph.order) {
			throw new Error("Graph has at least one cycle");
		}
		return order;
	}

	/** DFS-based cycle detection — returns whether a cycle exists and one representative path. */
	detectCycles(): { hasCycle: boolean; cyclePath: string[] } {
		const visited = new Set<string>();
		const stack = new Set<string>();
		const pathStack: string[] = [];

		const dfs = (node: string): string[] | null => {
			visited.add(node);
			stack.add(node);
			pathStack.push(node);
			for (const neighbor of this.graph.outboundNeighbors(node)) {
				if (!visited.has(neighbor)) {
					const nestedCycle = dfs(neighbor);
					if (nestedCycle) return nestedCycle;
				}
				if (stack.has(neighbor)) {
					const cycleStart = pathStack.indexOf(neighbor);
					return cycleStart >= 0 ? pathStack.slice(cycleStart) : [neighbor];
				}
			}
			stack.delete(node);
			pathStack.pop();
			return null;
		};

		for (const node of this.graph.nodes()) {
			if (!visited.has(node)) {
				const cyclePath = dfs(node);
				if (cyclePath) {
					return { hasCycle: true, cyclePath };
				}
			}
		}
		return { hasCycle: false, cyclePath: [] };
	}

	/** Returns arrays of nodes forming cycles (strongly connected components of size > 1). */
	getCycles(): string[][] {
		// Kosaraju's two-pass SCC
		const visited = new Set<string>();
		const finishOrder: string[] = [];

		const dfs1 = (node: string) => {
			visited.add(node);
			for (const nb of this.graph.outboundNeighbors(node)) {
				if (!visited.has(nb)) dfs1(nb);
			}
			finishOrder.push(node);
		};

		for (const node of this.graph.nodes()) {
			if (!visited.has(node)) dfs1(node);
		}

		const visited2 = new Set<string>();
		const sccs: string[][] = [];

		const dfs2 = (node: string, scc: string[]) => {
			visited2.add(node);
			scc.push(node);
			for (const nb of this.graph.inboundNeighbors(node)) {
				if (!visited2.has(nb)) dfs2(nb, scc);
			}
		};

		for (const node of [...finishOrder].reverse()) {
			if (!visited2.has(node)) {
				const scc: string[] = [];
				dfs2(node, scc);
				if (scc.length > 1) sccs.push(scc);
			}
		}
		return sccs;
	}

	getShortestPath(from: string, to: string): string[] | null {
		if (!this.graph.hasNode(from) || !this.graph.hasNode(to)) return null;
		const path = unweighted.bidirectional(this.graph, from, to);
		return path ?? null;
	}

	getIsolatedSkills(): string[] {
		return this.graph.filterNodes(
			(node: string) => this.graph.degree(node) === 0,
		);
	}

	getPriorityQueue(): string[] {
		return this.graph
			.nodes()
			.sort(
				(a: string, b: string) =>
					this.graph.inDegree(a) - this.graph.inDegree(b),
			);
	}

	getGraph(): DirectedGraph {
		return this.graph;
	}
}

/**
 * Skill Routing Graph (runtime wrapper for dependency graph)
 */
export class SkillRoutingGraph {
	private depGraph: SkillDependencyGraph;

	constructor(depGraph: SkillDependencyGraph) {
		this.depGraph = depGraph;
	}

	findRoute(from: string, to: string): string[] | null {
		return this.depGraph.getShortestPath(from, to);
	}

	analyze() {
		const cycleAnalysis = this.depGraph.detectCycles();
		return {
			topologicalOrder: this.depGraph.getTopologicalOrder(),
			hasCycles: cycleAnalysis.hasCycle,
			cycles: this.depGraph.getCycles(),
			cyclePath: cycleAnalysis.cyclePath,
			isolated: this.depGraph.getIsolatedSkills(),
			priorityQueue: this.depGraph.getPriorityQueue(),
		};
	}
}
